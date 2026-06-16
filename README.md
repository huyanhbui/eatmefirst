# Save Food

A website with a mission: waste less food, feed more people.

Save Food is a static, multi-page site about the global food-waste problem, built
around a companion web app called **EatMeFirst** that helps people use up what is
already in their fridge before it spoils. Visitors can read the story behind food
waste, pledge to waste less, donate toward feeding the hungry, and track their own
fridge with AI-assisted tools.

> **Run it from a local server, not by opening the files directly.** Social sign-in
> popups, ES modules, the camera barcode scanner, and several images only work over
> `http://localhost`, not the `file://` protocol.
>
> ```bash
> python -m http.server 8000
> # then open http://localhost:8000
> ```

---

## Project summary

| Area | What it does |
| --- | --- |
| **Landing + story pages** | `index.html`, `about.html`, and six `single-project*.html` deep-dives explain the scale of food waste and the case for change. |
| **Blog** | `blog.html` plus nine individual articles (`single-post-1..9.html`), each with a per-post Firebase comment thread. |
| **Stories** | `stories.html` collects first-person accounts from people around the world on how they save food. |
| **EatMeFirst app** | `eatmefirst.html` is a per-user fridge tracker: add items by photo (Claude API), barcode (Open Food Facts + camera), or quick-pick; it tracks expiry, suggests recipes, and tallies food and money saved vs. wasted. |
| **Donations** | `donate.html` routes donors to Stripe-hosted Payment Links (test mode) and returns them to `thank-you.html`. No card data touches this site. |
| **Join Us petition** | `join-us.html` collects name + email pledges in Firebase and shows a live counter. |
| **Auth** | `log in.html` / `signup.html` support Firebase email/password plus Google and GitHub social sign-in. |

## Tech stack

- **Frontend:** Plain HTML, CSS, and JavaScript on a Bootstrap template, re-skinned
  green via `css/food-theme.css`. No framework, bundler, or build step.
- **Animation / layout libraries:** WOW.js, Isotope, imagesLoaded, jQuery (template),
  Font Awesome, Ionicons, Material icons.
- **Firebase (client SDK, project `asia-festival`):** Authentication (email/password,
  Google, GitHub) and Realtime Database (fridge sync, pledges, comments).
- **Anthropic Claude API:** EatMeFirst photo recognition and recipe suggestions
  (default model `claude-opus-4-8`); the API key is entered in the app and stored
  locally in the browser, never committed.
- **Open Food Facts API + `BarcodeDetector`:** barcode lookup and optional camera scan.
- **Stripe Payment Links (test mode):** donations, with no backend and no card handling.

## Getting started

1. **Serve the site locally** (required, see the caution above):
   ```bash
   python -m http.server 8000
   ```
   Open `http://localhost:8000`.

2. **Firebase** is pre-configured in `js/firebase-config.js` for the `asia-festival`
   project. To point it at your own project, replace that config and enable the
   Authentication providers (Email/Password, Google, GitHub) and the Realtime Database.

3. **Social login setup** (Google + GitHub) is done in the Firebase and GitHub
   developer consoles; the callback URL is
   `https://asia-festival.firebaseapp.com/__/auth/handler`. Social popups require
   `http://localhost`, not `file://`.

4. **Donations** use Stripe Payment Links in test mode. Follow
   [`docs/STRIPE-DONATION-SETUP.md`](docs/STRIPE-DONATION-SETUP.md) to create the five
   links and paste them into `donate.html`. Test with card `4242 4242 4242 4242`.

5. **EatMeFirst AI features** ask for an Anthropic API key the first time you use
   photo-add or recipes. The key is stored in your browser only.

## Project structure

```
.
├── index.html, about.html, blog.html, stories.html, donate.html,
│   thank-you.html, join-us.html, eatmefirst.html, log in.html, signup.html
├── single-post-1..9.html        # blog articles
├── single-project*.html         # food-waste deep-dives
├── css/                         # style.css (template) + food/auth/eatmefirst/stories themes
├── js/                          # firebase-config, auth-*, eatmefirst, comments, custom
├── images/                      # photos and stock imagery (committed so the site works offline)
└── docs/                        # setup notes and design specs
```

## Status and limitations

- Static, client-only by design. There is no backend; dynamic data is read and
  written straight from the browser via the Firebase client SDK.
- Donations and payments run in **Stripe test mode** only. This is a learning/demo
  project; no real funds are collected.
- Tightening Firebase security rules (who can read the raw `pledges` and comments
  data) is a known future task, not yet done.
- There is no automated test suite; verification is manual in the browser.
