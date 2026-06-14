# Design: Save Food site improvements

Date: 2026-06-14
Status: Approved

## Context

`Save Food` is a static website (HTML + Bootstrap + a Firebase backend) about
food waste, with a companion tool called EatMeFirst. This spec covers five
improvements requested together. The stack stays as-is: static HTML pages,
`css/style.css` (template) + `css/food-theme.css` (green re-skin override), and
Firebase (Auth + Realtime Database) configured in `js/firebase-config.js`. No
build tooling is added.

## Goals

1. Landing page text no longer duplicates the About page.
2. Page headers use eye-catching photo backgrounds instead of a flat green box.
3. Each blog card links to its own article (today all 9 link to one page);
   preview images replaced with fresh stock photos.
4. The blog grid is fixed (currently ragged due to mismatched column widths).
5. Login/Signup gain working Google + GitHub social sign-in.

## Non-goals

- Apple and Facebook login (deferred — Apple needs a paid dev account, Facebook
  needs a Meta app + review). The layout should leave room to add them later.
- Any change to the EatMeFirst tool's logic.
- Introducing a build system, framework, or bundler.

---

## 1. Landing page (`index.html`) — de-duplicate from About

**Problem:** The `#intro` section repeats About almost verbatim — the same
`1 in 3 / 282M / ~2.5 kg` stat cards and the same explanatory paragraphs.

**Change:** Replace `#intro` content with a *light teaser*:
- One eye-catching stat as a hook + a one-sentence mission line.
- Two clear next steps: **"Read the full story → about.html"** and
  **"Start saving → eatmefirst.html"**.
- Remove the three duplicated `stat-card` blocks from the landing page (they
  remain on About, which is the deep explainer).

**Keep:** the 6-card `#portfolio` story grid and the EatMeFirst CTA section.

**Story-card images:** Replace all 6 portfolio images with downloaded stock
photos that match each card:
- `food_watse.jfif` → waste / discarded food
- `african_hungry.jfif` → hunger
- `vietnam.jfif` → Vietnamese market/household
- `fridge_box.jfif` → fridge / food storage
- `How To Stop Wasting Food.jfif` → leftovers
- `eat_me_first_logo.png` → kitchen/app-style image for "Meet EatMeFirst"

(New files saved under `images/`; update the `src` attributes to match.)

## 2. Header backgrounds — a photo per page

**Problem:** `food-theme.css` renders every header as a flat green gradient box.
The template's section classes (`.header-three/.four/.five`) point at
`images/header-three-bg.jpg` etc., but those files do not exist, so only green
shows.

**Change:**
- Download one relevant photo per header class and save with the exact names the
  CSS already expects:
  - `images/header-one-bg.jpg` — Home (food / market hero)
  - `images/header-two-bg.jpg` — Contact (neutral food/table)
  - `images/header-three-bg.jpg` — About (fresh produce)
  - `images/header-four-bg.jpg` — EatMeFirst (kitchen/fridge)
  - `images/header-five-bg.jpg` — Blog + single posts (cooking/kitchen)
- Add `background-image` for `.header-one` and `.header-two` in CSS (the other
  three already reference their files).
- Keep the existing green `multiply` overlay (`food-theme.css` lines ~25-30) so
  white heading text stays legible; ensure `background-size: cover` and centered.
- Change the inner `.header-thumb` from a solid green gradient box to a
  **semi-transparent dark/green panel** (e.g. `rgba(27,94,32,0.55)` + slight blur
  or just translucency) so the photo shows through while text stays readable.

**Note:** Pages are mapped by the template's header class, so the two single-post
pages that use `.header-five` share the Blog header image. Acceptable.

## 3. Blog — 9 individual articles + new previews

**Problem:** All 9 cards in `blog.html` link to the same `single-post.html`.

**Change:**
- Create 9 article pages `single-post-1.html` … `single-post-9.html`, one per
  existing heading, ~2-3 short paragraphs each, reusing the current
  `single-post.html` structure (header, `#single-post` body, optional pull-quote
  and one inline image, footer, scripts).
- The 9 headings (already written, keep them):
  1. Why a third of the world's food never gets eaten
  2. The average Vietnamese family wastes 2.5 kg of food a week
  3. Hunger in Africa: the other side of the food crisis
  4. 7 storage tricks that keep your food fresh for longer
  5. "Best before" vs "use by": the labels that fool us
  6. Meet EatMeFirst: your free anti-waste fridge tracker
  7. 5 easy recipes to use up leftovers tonight
  8. How food waste fuels climate change
  9. How to plan a week of meals and buy only what you need
- Update each card's links (`<img>` link, `<h1>` link, and button) in `blog.html`
  to point at its own page. Card #6 keeps a prominent in-article link to
  `eatmefirst.html`.
- Replace preview images `1.jpg`–`9.jpg` with downloaded stock photos matching
  each topic.
- **Comments:** keep the Firebase comment widget on each post, but key each
  thread per-post so threads don't mix. Inspect `js/comments.js` to see how the
  thread id is derived; if it is hard-coded, parameterize it by a `data-post-id`
  on the page (or the page filename) so each article has its own thread. If
  per-post keying is impractical without larger changes, fall back to keeping
  comments only on post #1 and omit the widget on the others (decide during
  implementation, prefer per-post keying).

## 4. Fix the broken blog grid

**Problem:** The 9 cards use `col-md-6, 6, 4, 4, 4, 3, 3, 3, 3` (plus mismatched
`col-sm`), producing a ragged, misaligned layout.

**Change:** Standardize all 9 cards to `col-md-4 col-sm-6` → a clean 3-across grid
(3 even rows of 3). Ensure equal-height cards (the `food-theme.css` `.blog-thumb`
card styling already exists; add height/flex handling if rows still look uneven).

## 5. Social login — Google + GitHub

**Problem:** `log in.html` and `signup.html` only support Firebase
email/password.

**Change:**
- Add **"Continue with Google"** and **"Continue with GitHub"** buttons to both
  pages, with an "or" divider and provider icons (Font Awesome / material icons
  already loaded).
- New `js/auth-social.js` (ES module), imported by both pages. Uses the existing
  `firebase-config.js` `auth`/`db` exports and:
  - `GoogleAuthProvider` + `GithubAuthProvider` from the Firebase Auth SDK.
  - `signInWithPopup(auth, provider)` on button click.
  - On success: upsert the user into `users/<uid>` in the Realtime DB (name,
    email, createdAt if new), then `window.location.replace("index.html")`.
  - On error: reuse `friendlyAuthError` for readable messages (extend the map for
    `auth/popup-closed-by-user`, `auth/account-exists-with-different-credential`).
- Style buttons to fit the existing green auth theme (`css/auth-theme.css`),
  full-width, with a subtle border and the provider glyph.

**Setup checklist (delivered with the work, user must complete in the consoles):**
1. Firebase Console → Authentication → Sign-in method → enable **Google**.
2. Register a **GitHub OAuth App** (Settings → Developer settings → OAuth Apps),
   set the callback URL to the Firebase one
   (`https://asia-festival.firebaseapp.com/__/auth/handler`), copy Client ID +
   Secret into Firebase Console → enable **GitHub** provider.
3. Add authorized domains (localhost is allowed by default for testing).

**Constraint (flag prominently):** `signInWithPopup` does **not** work over the
`file://` protocol. The site must be opened via a local web server
(e.g. `http://localhost:8000`) for social login to function. Email/password is
unaffected.

---

## Implementation order

1. Download all stock images (6 story cards, 9 blog previews, 5 header
   backgrounds) into `images/`.
2. Fix blog grid columns in `blog.html`.
3. Create the 9 `single-post-N.html` pages and rewire `blog.html` links + preview
   images.
4. Header background CSS + translucent `.header-thumb` in `food-theme.css`.
5. Landing page `#intro` rewrite + story-card image swaps in `index.html`.
6. Social login: `js/auth-social.js` + buttons in `log in.html` / `signup.html`.
7. Write the setup checklist into the repo (e.g. a short `SOCIAL-LOGIN-SETUP.md`).

## Risks / open items

- Stock image download source and licensing: use freely-usable stock (e.g.
  Unsplash direct image URLs) and save locally; verify each URL resolves.
- `comments.js` thread keying (see §3) — confirm during implementation.
- Social login requires a local server + console setup before it visibly works;
  this is expected and documented, not a bug.
