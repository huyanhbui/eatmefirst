# Save Food site updates: login background, Join Us petition, Stories, and polish

**Date:** 2026-06-15
**Status:** Draft (design), pending user review
**Project type:** Static learning project (HTML, CSS, JS plus client-side Firebase). No backend.

## Goals

Make six changes to the Save Food site:

1. Give the login and register pages a black and white, food-relevant background photo, and turn the nav "login" link into a dark green button on the far right.
2. Fix the broken show/hide password toggle on the login and register pages.
3. Give the EatMeFirst app the same loading animation as the rest of the site.
4. Turn the Contact page into a "Join Us" petition that collects names and emails in Firebase and shows a live counter. Rename the file to `join-us.html`.
5. Add a new Stories section (its own page and nav tab, separate from the Blog) with written sample stories from people around the world.
6. Remove em dashes and en dashes from all reader-facing text across the site.

## Non-goals

- No backend or server code. Everything stays static plus client-side Firebase.
- No automatic commits. The user commits all changes, including this spec.
- No recurring or paid features. The petition is just name and email capture.
- No tightening of Firebase security rules (noted as a separate future task).
- The split-screen login layout that was first discussed is dropped in favour of a simple background photo.

## Constraints and key decisions

- **Static, client only.** The site is plain HTML, CSS, and JS. Dynamic data is read and written straight from the browser using the Firebase JS SDK, exactly like the current contact form. Firebase config already lives in `js/firebase-config.js` and exports `auth` and `db`.
- **Black and white via CSS.** The login background photo is downloaded in colour and shown black and white with a CSS `filter: grayscale(1)`. This guarantees the black and white look, lets us pick the best photo regardless of its colour, and works offline once the file is saved into `images/`.
- **Dark green tint kept.** A soft dark green semi-transparent layer sits over the login background photo so the white form card stays readable and the page keeps the green theme. This can be removed later if the plain photo is preferred.
- **Login button via CSS.** The nav "login" link is restyled and pushed to the far right with a CSS rule in `css/food-theme.css`, so we do not have to hand-edit a button into every page. The new "Stories" tab and the `contact.html` to `join-us.html` link change do require editing the nav block in each page that has it.
- **Counter shows the number only.** The Join Us page displays how many people have joined. Names and emails are stored in Firebase but are never printed on the page.
- **Plain text.** No em dashes or en dashes anywhere in reader-facing text, including this spec. Normal hyphens in compound words such as "food-saving" stay.

## Feature 1: Login and register background photo plus login nav button

**Pages:** `log in.html`, `signup.html`, and the nav on every content page.

**Background photo (both auth pages):**
- Save one downloaded stock photo to `images/login-bg.jpg` (free licence, food waste relevant, for example surplus produce, a market stall, or food in a bin).
- In `css/auth-theme.css`, replace the current green gradient `body` background with this photo, sized to cover the screen and fixed in place.
- Apply `filter: grayscale(1)` (or a grayscale layer) so it always renders black and white.
- Add a dark green semi-transparent overlay between the photo and the form card (for example a full-screen layer at roughly 45 to 60 percent dark green) so the white card and text stay readable.
- The existing centered white form card (`.signup-content`) stays as it is, sitting on top of the photo and tint. Same treatment on both `log in.html` and `signup.html`.

**Login nav button (content pages):**
- In `css/food-theme.css`, target the login link (`.gh-tab-item[href="log in.html"]`) and: push it to the far right of the nav (margin auto on the left so it separates from the other tabs), give it a solid dark green background, white text, rounded pill shape, and a hover state. Display the label as "Login".
- This is CSS only. No per-page HTML edit is needed for the button itself.

## Feature 2: Fix the show/hide password toggle

**Pages:** `log in.html` and `signup.html`.

**Why it is broken (three separate faults):**
- Both pages load `js/main.js` and `vendor/jquery/jquery.min.js`, but no files exist at those paths. The real jQuery is under `loginandsignup/vendor/`, and the real toggle handler is `loginandsignup/js/main.js`. So the toggle code never runs.
- The eye icon has `toggle="#password"`, but the input id is `passwordd`. The selector matches nothing.
- The password input starts as `type="text"`, so the password is visible by default.

**Fix:**
- Set the password input to `type="password"` by default on both pages.
- Remove the two dead script tags (`js/main.js` and `vendor/jquery/jquery.min.js`).
- Add a small plain-JavaScript toggle (no jQuery) that, when the eye icon is clicked, flips the matching field between `password` and `text` and swaps the icon between the open eye and the closed eye. Wire it to the correct field on both pages. On signup it controls the main password field; the repeat-password field stays a normal password field with no toggle, to keep things simple.

## Feature 3: EatMeFirst loading animation

**Page:** `eatmefirst.html`, styles in `css/eatmefirst.css`, script in `js/eatmefirst.js`.

The main site shows a preloader: a full white screen with a pulsing dark circle (`.preloader` plus `.sk-spinner-pulse` in `css/style.css`) that fades out on window load via `js/custom.js`.

**Fix:**
- Add the same preloader markup to the top of the EatMeFirst body: a `.preloader` containing the pulsing circle.
- Copy the preloader and spinner CSS (and the `sk-pulseScaleOut` keyframes) into `css/eatmefirst.css` so it looks identical.
- EatMeFirst is plain JavaScript with no jQuery, so fade the preloader out with a few lines of plain JavaScript on `window.load` (add an `is-hidden` class that transitions opacity to 0, then set `display:none`). No jQuery is pulled into the app.

## Feature 4: Contact becomes the Join Us petition

**File rename:** `contact.html` becomes `join-us.html`.
- Update every internal link from `href="contact.html"` to `href="join-us.html"` and change the nav label from "Contact" to "Join Us". The link appears in these pages: `index.html`, `about.html`, `blog.html`, `donate.html`, `thank-you.html`, the renamed `join-us.html` itself, and all `single-post*.html` and `single-project*.html` pages.

**Page content (new `join-us.html`):**
- Keep the shared nav, footer, theme CSS, Bootstrap, and WOW animations.
- Header: "Join Us" with a short subtitle.
- A short pledge line, for example: "I pledge to waste less food and help feed more people."
- A live counter: "X people have joined", which reads the pledge list from Firebase and updates in real time.
- A form: name and email, with an "Add my name" button.
- On submit: write the entry to Firebase Realtime Database under a `pledges` list using `push()` (a unique key per person) with fields `name`, `email`, and a timestamp. Then show a thank-you message and clear the form.
- Remove the Google map iframe and the phone, email, and address blocks.

**Data and privacy note:** the database is read and written from the browser, the same as the current contact form. The page shows only the count, never the stored names or emails. Restricting who can read the raw `pledges` data is a Firebase security-rules change and is out of scope here.

## Feature 5: Stories section

**New page:** `stories.html`. **New nav tab:** "Stories", added to every page that has the nav (placed after "Blog").

**Layout:**
- Keep the shared nav, footer, and theme.
- A short intro line above the grid, for example: "Voices from around the world on saving food."
- A responsive grid of story cards. Because each paragraph is around 7 to 8 lines, the grid is two cards wide on desktop (one wide on phones) so the text is comfortable to read. Each card has a photo, a name, a country, and the paragraph.
- Styled to match the site but visually distinct from the blog: a wall of personal quotes, not an article list.

**Photos:** reuse `images/african.jfif` and `images/vietnam.jfif`, and download four more free-licence portraits into `images/` for the other four cards (Marco, Priya, Bea, and Diego), so everything works offline.

**Content (written, illustrative, can be replaced later).** Six stories. Each paragraph is about 7 to 8 lines and uses plain punctuation with no em or en dashes.

**Lan, Hanoi, Vietnam** (photo: `images/vietnam.jfif`)
My grandmother lived through years when food was scarce, so throwing away rice always felt wrong in our house, and I still cook that way today. Every Sunday I look at what is left in the fridge and plan the week's meals around whatever needs eating first. Wilting herbs go into soup, and tired vegetables become a quick stir fry. I freeze ginger and chillies so they never spoil before I get to them. When there are scraps, they feed the chickens on my mother's small plot. Saving food is not about being poor. It is about respect for the people who grew it.

**Amara, Lagos, Nigeria** (photo: `images/african.jfif`)
At our local market, traders used to throw out crates of tomatoes and peppers that were too soft to sell by the end of the day. It hurt to watch good food rot while neighbours went hungry. So a few of us started collecting the unsold produce each evening and turning it into stews and sauces we share on our street. Soft tomatoes still make a rich base, and bruised peppers still bring flavour. What we cannot cook, we dry in the sun for later. Now the traders set the extra aside for us instead of binning it. A little planning feeds a lot of people.

**Marco, Naples, Italy**
In my family nothing from a meal is ever wasted, because that is how my nonna ran her kitchen. Stale bread is the start of half our recipes, soaked for meatballs or toasted for soup. Vegetable ends and parmesan rinds go into a pot to make a stock that tastes better than anything from a shop. Yesterday's pasta water thickens today's sauce. When tomatoes are cheap and ripe I cook big batches and jar them for winter. People think eating well means buying more. My nonna proved it means wasting less.

**Priya, Jaipur, India**
Growing up, my mother could feed our whole family for days from what others would throw away. I learned that leftover dal becomes tomorrow's filling for parathas, and that yesterday's rice fries up into a breakfast no one can resist. We keep vegetable peels to flavour the cooking oil, and overripe fruit turns into chutney instead of going in the bin. Nothing edible leaves our kitchen as waste. When we cook for festivals we plan the portions carefully and send any extra home with guests. Food is treated like a guest in our culture, and you do not let a guest go to waste.

**Bea, Sao Paulo, Brazil**
I run a small cafe, and for years I watched us throw out trimmings at the end of every shift. One day I decided to weigh the waste, and the number shocked me. Now carrot tops become pesto, stale cake turns into a warm pudding, and fruit that is too ripe to serve goes into our juices. I plan the menu around what we already have before I order anything new. My staff treat the scraps as a challenge instead of rubbish. Our waste has dropped by more than half. The savings pay for a free meal we hand out every Friday.

**Diego, Oaxaca, Mexico**
My grandfather farmed corn, so I grew up knowing how much work goes into every cob, and that is why waste bothers me so much. At home we cook only what we will eat, and we save every tortilla, because day old tortillas make the best chilaquiles. Vegetable trimmings and bones simmer into a broth that becomes the base for the next meal. Even coffee grounds and peelings go back to the garden as compost. I keep a list on the fridge of what needs eating first. None of this is hard. It is just paying attention, the way my grandfather taught me.

## Feature 6: Remove em and en dashes from reader-facing text

Sweep all HTML pages and replace every em dash and en dash in reader-facing text with plain punctuation (a comma, a period, a colon, or the words "and" or "to"), rewriting so each sentence reads naturally. Keep normal hyphens in compound words. Do not touch code, attributes, filenames, or CSS.

Pages that currently contain these dashes: `index.html`, `about.html`, `blog.html`, `donate.html`, `thank-you.html`, `eatmefirst.html`, `log in.html`, the renamed `join-us.html`, and all `single-post*.html` and `single-project*.html` pages.

Examples:
- "Save Food — Stop Food Waste, Feed the Future" becomes "Save Food: Stop Food Waste, Feed the Future".
- "Let's change that — one fridge at a time." becomes "Let's change that, one fridge at a time."
- "EatMeFirst — never waste food again" becomes "EatMeFirst: never waste food again".

## Feature 7: Offline images

Download free-licence stock photos (Pexels or Unsplash, free to use) and save them into `images/`:
- One food waste relevant photo for the login and register background (`images/login-bg.jpg`).
- Four portrait photos for the Stories cards (Marco, Priya, Bea, Diego), since Lan and Amara reuse `vietnam.jfif` and `african.jfif`.

All images live in the repo so the site works offline. If a download is blocked at build time, the affected image falls back to a plain dark green panel and the page still works.

## Files to change (summary)

- **New:** `stories.html`, `images/login-bg.jpg`, a few `images/` portraits.
- **Renamed:** `contact.html` to `join-us.html` (content rewritten to the petition).
- **Edited HTML (nav: add Stories tab, point login link, update Contact link to Join Us):** `index.html`, `about.html`, `blog.html`, `donate.html`, `thank-you.html`, `join-us.html`, all `single-post*.html`, all `single-project*.html`.
- **Edited HTML (other):** `log in.html` and `signup.html` (password fix, remove dead scripts), `eatmefirst.html` (preloader markup).
- **Edited CSS:** `css/auth-theme.css` (background photo plus tint), `css/food-theme.css` (login nav button, Stories cards if styled here), `css/eatmefirst.css` (preloader styles), and possibly a small new stylesheet for the Stories grid.
- **Edited JS:** `js/eatmefirst.js` (preloader fade out), a small toggle script for the auth pages (inline or a new `js/auth-password.js`), and the Join Us page script (Firebase pledge write plus live count).
- **Dash cleanup:** all HTML pages listed in Feature 6.

## Verification

Because there is no test suite, verification is manual in the browser:

- Login and register pages show a black and white food photo with the green tint, and the card is readable.
- The eye icon toggles the password between hidden and shown on both pages, starting hidden.
- The nav login link sits on the far right as a dark green button on every content page.
- EatMeFirst shows the pulsing preloader on load, which then fades out.
- The Join Us page saves a name and email to Firebase, shows a thank-you message, and the counter goes up. The map and contact blocks are gone.
- The Stories page shows the six cards with photos, names, countries, and paragraphs, and has its own nav tab separate from the Blog.
- A search across the HTML pages finds no em dash or en dash characters in reader-facing text.
- Every nav links to `join-us.html` and there are no remaining links to `contact.html`.
