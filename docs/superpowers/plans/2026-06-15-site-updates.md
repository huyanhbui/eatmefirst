# Save Food Site Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply six site updates to the Save Food static site: a black and white background photo plus a far-right green login button on the auth pages, a working password show/hide toggle, an EatMeFirst loading animation, a Contact-to-Join-Us petition page backed by Firebase, a new Stories section, and removal of em and en dashes from all reader-facing text.

**Architecture:** The site is plain HTML, CSS, and JS with no build step and no backend. Dynamic data is read and written from the browser using the Firebase JS SDK (config in `js/firebase-config.js`, which exports `auth` and `db`). New behaviour is added as small focused files; shared nav lives copy-pasted in each page. There is no automated test suite, so each task is verified by serving the site locally and observing the result in a browser, plus text searches for mechanical changes.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Firebase Realtime Database (client SDK 10.4.0), Bootstrap and WOW.js (already vendored), a local static server (`python -m http.server 8000`).

---

## Conventions for this plan

- **Commits are the user's job.** Each task ends with a suggested commit command. Do NOT run `git commit` automatically. Stop after each task so the user can review and commit.
- **Local preview:** from the repo root run `python -m http.server 8000`, then open `http://localhost:8000/<page>`. Firebase and ES modules need http, so do not open pages with `file://`.
- **No em or en dashes** in any new text you write (use commas, periods, colons, or the words "and" or "to"). Normal hyphens in compound words are fine.
- **Search tool:** where a step says "search", use ripgrep (`rg`) from the repo root, or the editor's search. Example: `rg --no-heading -n 'pattern'`.

---

## Task 1: Fix the password show/hide toggle (login and signup)

The toggle is dead because the pages load script files that do not exist (`js/main.js`, `vendor/jquery/jquery.min.js`), the eye icon points at `#password` while the field id is `passwordd`, and the field starts as `type="text"`. This task adds a tiny vanilla toggle, points it at the right field, and hides the password by default.

**Files:**
- Create: `js/auth-password.js`
- Modify: `log in.html` (input on line 39, icon on line 40, dead scripts on lines 66 to 68)
- Modify: `signup.html` (input on line 41, icon on line 43, dead scripts on lines 79 to 80)

- [ ] **Step 1: Create the toggle script**

Create `js/auth-password.js`:

```javascript
// Show/hide password for the auth pages. Plain JS, no jQuery.
// Each eye icon carries a `toggle` attribute holding the CSS selector of its field.
document.querySelectorAll(".toggle-password").forEach(function (icon) {
  icon.addEventListener("click", function () {
    var input = document.querySelector(icon.getAttribute("toggle"));
    if (!input) return;
    var hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    icon.classList.toggle("zmdi-eye", !hidden);
    icon.classList.toggle("zmdi-eye-off", hidden);
  });
});
```

- [ ] **Step 2: Fix the login field and icon**

In `log in.html`, change the password input (line 39) so its type is `password`:

```html
<input type="password" class="form-input" name="password" id="passwordd" placeholder="Password"/>
```

Change the eye icon (line 40) so `toggle` points at the real id `#passwordd`:

```html
<span toggle="#passwordd" class="zmdi zmdi-eye field-icon toggle-password"></span>
```

- [ ] **Step 3: Replace the dead scripts on the login page**

In `log in.html`, delete these three lines (66 to 68):

```html
<script src="vendor/jquery/jquery.min.js"></script>
<script src="js/main.js"></script>
<script src="loginandsignup/js/sign_in.js"></script>
```

Replace them with:

```html
<script src="js/auth-password.js"></script>
```

(Leave the two `type="module"` scripts for `js/auth-login.js` and `js/auth-social.js` as they are.)

- [ ] **Step 4: Fix the signup field, icon, and dead scripts**

In `signup.html`, change the password input (line 41) to `type="password"`:

```html
<input type="password" class="form-input" name="password" id="passwordd" placeholder="Password" />
```

Change the eye icon (line 43):

```html
<span toggle="#passwordd" class="zmdi zmdi-eye field-icon toggle-password"></span>
```

Delete the two dead local scripts (lines 79 to 80):

```html
<script src="vendor/jquery/jquery.min.js"></script>
<script src="js/main.js"></script>
```

Replace them with:

```html
<script src="js/auth-password.js"></script>
```

(The repeat-password field keeps its normal `type="password"` and gets no toggle. Leave the `platform.js` line and the module scripts alone.)

- [ ] **Step 5: Verify in the browser**

Serve the site (`python -m http.server 8000`) and open `http://localhost:8000/log%20in.html`.
Expected: the password field starts hidden (dots). Clicking the eye reveals the text and the icon switches to the crossed-out eye. Clicking again hides it. Repeat on `http://localhost:8000/signup.html`.

- [ ] **Step 6: Suggested commit (user runs when happy)**

```bash
git add "js/auth-password.js" "log in.html" "signup.html"
git commit -m "Fix password show/hide toggle on login and signup"
```

---

## Task 2: EatMeFirst loading animation

Give EatMeFirst the same preloader the main site uses: a white screen with a pulsing dark circle that fades out on load. EatMeFirst is plain JS with no jQuery, so the fade is done in vanilla JS.

**Files:**
- Modify: `eatmefirst.html` (add markup right after `<body>` on line 11)
- Modify: `css/eatmefirst.css` (append preloader styles)
- Modify: `js/eatmefirst.js` (add fade-out at the very top)

- [ ] **Step 1: Add the preloader markup**

In `eatmefirst.html`, immediately after the `<body>` tag (line 11), add:

```html
  <div class="preloader"><div class="sk-spinner sk-spinner-pulse"></div></div>
```

- [ ] **Step 2: Add the preloader styles**

Append to `css/eatmefirst.css`:

```css
/* Preloader: matches the main site (white screen, pulsing dark circle) */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: opacity 0.6s ease;
}
.preloader.is-hidden { opacity: 0; }
.sk-spinner-pulse {
  width: 60px;
  height: 60px;
  background-color: #111112;
  border-radius: 100%;
  animation: sk-pulseScaleOut 1s infinite ease-in-out;
}
@keyframes sk-pulseScaleOut {
  0%   { transform: scale(0); }
  100% { transform: scale(1); opacity: 0; }
}
```

- [ ] **Step 3: Fade the preloader out on load**

At the very top of `js/eatmefirst.js`, add:

```javascript
// Fade out the preloader once everything has loaded (matches the main site).
window.addEventListener("load", function () {
  var p = document.querySelector(".preloader");
  if (!p) return;
  p.classList.add("is-hidden");
  setTimeout(function () { p.style.display = "none"; }, 600);
});
```

- [ ] **Step 4: Verify in the browser**

Open `http://localhost:8000/eatmefirst.html`.
Expected: on load you briefly see a white screen with a pulsing dark circle, which fades out and reveals the app. The app still works (add an item, etc.).

- [ ] **Step 5: Suggested commit**

```bash
git add eatmefirst.html css/eatmefirst.css js/eatmefirst.js
git commit -m "Add site-style loading animation to EatMeFirst"
```

---

## Task 3: Login and register background photo

Both auth pages get a black and white food-relevant background photo with a soft dark green tint over it, behind the existing white form card. The photo is shown grayscale with CSS, so it is always black and white and works offline.

**Files:**
- Create: `images/login-bg.jpg` (downloaded stock photo)
- Modify: `css/auth-theme.css` (the `body` rule near the top, lines 7 to 13)

- [ ] **Step 1: Download a food-waste background photo**

Find a free-licence photo (Unsplash or Pexels, free to use) on a food waste theme, for example surplus or discarded produce, a market stall, or food in a bin. Copy its direct image URL (ends in `.jpg`), then from the repo root run:

```powershell
Invoke-WebRequest -Uri "<DIRECT_IMAGE_URL>" -OutFile "images/login-bg.jpg"
```

Verify the file downloaded and is a real image (more than a few KB):

```powershell
Get-Item images/login-bg.jpg | Select-Object Name, Length
```

Expected: a `login-bg.jpg` of roughly 100 KB or more. If the download is blocked or the URL fails, try another image URL. The page still works without it (it falls back to a dark green panel from Step 2).

- [ ] **Step 2: Apply the photo, grayscale, and green tint**

In `css/auth-theme.css`, replace the existing `body` rule (lines 7 to 13):

```css
body {
  background: linear-gradient(135deg, #eaf4e8 0%, #cfe6cb 55%, #bcdcb6 100%) !important;
  padding: 56px 16px !important;
  min-height: 100vh;
  font-family: 'Source Sans Pro', 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: #243528 !important;
}
```

with this (a dark green fallback colour, a fixed grayscale photo layer, and a green tint layer, both behind the card):

```css
body {
  background: #14361f !important; /* dark green fallback if the photo is missing */
  padding: 56px 16px !important;
  min-height: 100vh;
  font-family: 'Source Sans Pro', 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: #243528 !important;
  position: relative;
}
body::before { /* the photo, forced black and white */
  content: "";
  position: fixed;
  inset: 0;
  z-index: -2;
  background: url("../images/login-bg.jpg") center / cover no-repeat;
  filter: grayscale(1);
}
body::after { /* soft dark green tint for readability and theme */
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background: rgba(20, 54, 31, 0.55);
}
/* Let the photo show through the template's section wrappers */
.main, .signup { background: transparent !important; }
```

- [ ] **Step 3: Verify in the browser**

Open `http://localhost:8000/log%20in.html` and `http://localhost:8000/signup.html`.
Expected: a black and white food photo fills the background with a dark green wash over it, and the white form card sits clearly on top and stays readable. With the file missing, the background is a plain dark green and the card is still readable.

- [ ] **Step 4: Suggested commit**

```bash
git add images/login-bg.jpg css/auth-theme.css
git commit -m "Add black and white food background with green tint to auth pages"
```

---

## Task 4: Login nav button (far right, dark green)

Turn the nav "login" link into a dark green pill on the far right of the nav. This is CSS only, applied everywhere the nav appears.

**Files:**
- Modify: `css/food-theme.css` (append after the `.gh-tab-item.active` rule, around line 399)

- [ ] **Step 1: Add the button styles**

Append to `css/food-theme.css`:

```css
/* Let the tab bar fill the row so the login button can sit on the far right */
.gh-tab-bar { flex: 1 1 auto; }

/* The login link, set apart on the right as a dark green button */
.gh-tab-item[href="log in.html"] {
  margin-left: auto;
  align-self: center;
  background: var(--leaf);
  color: #fff !important;
  border-radius: 999px;
  padding: 8px 18px;
  font-weight: 700;
  text-transform: capitalize; /* shows "Login" from the lowercase text */
}
.gh-tab-item[href="log in.html"]:hover {
  background: #14532d;
  color: #fff !important;
}
.gh-tab-item[href="log in.html"].active {
  border-bottom-color: transparent;
}
```

- [ ] **Step 2: Verify in the browser**

Open `http://localhost:8000/index.html` (and one other page, for example `about.html`).
Expected: the other tabs sit on the left, and "Login" is a dark green rounded button on the far right of the nav. Hover darkens it. It still links to the login page.

- [ ] **Step 3: Suggested commit**

```bash
git add css/food-theme.css
git commit -m "Style nav login link as a dark green button on the far right"
```

---

## Task 5: Stories page (new section, separate from the blog)

A new page `stories.html` with a grid of six story cards (photo, name, country, and a paragraph of around 7 to 8 lines). The nav link is added site-wide later in Task 7. The page itself uses the final nav block so it is consistent from the start.

**Files:**
- Create: `stories.html`
- Create: `css/stories.css`
- Create: four downloaded portraits in `images/` (`story-marco.jpg`, `story-priya.jpg`, `story-bea.jpg`, `story-diego.jpg`); reuse `images/vietnam.jfif` and `images/african.jfif` for the other two.

- [ ] **Step 1: Download four portrait photos**

Find four free-licence portrait photos (Unsplash or Pexels) and download them. From the repo root:

```powershell
Invoke-WebRequest -Uri "<MARCO_PORTRAIT_URL>" -OutFile "images/story-marco.jpg"
Invoke-WebRequest -Uri "<PRIYA_PORTRAIT_URL>" -OutFile "images/story-priya.jpg"
Invoke-WebRequest -Uri "<BEA_PORTRAIT_URL>"   -OutFile "images/story-bea.jpg"
Invoke-WebRequest -Uri "<DIEGO_PORTRAIT_URL>" -OutFile "images/story-diego.jpg"
```

Verify all four exist:

```powershell
Get-ChildItem images/story-*.jpg | Select-Object Name, Length
```

Expected: four image files, each more than a few KB. If a download fails, the card still renders with a broken-image box; pick another URL.

- [ ] **Step 2: Create the Stories styles**

Create `css/stories.css`:

```css
/* Stories section: a wall of personal quotes, distinct from the blog. */
.stories-wrap { max-width: 1100px; margin: 0 auto; padding: 40px 20px 64px; }
.stories-intro { text-align: center; margin-bottom: 36px; }
.stories-intro h1 { color: #1b5e20; font-weight: 800; }
.stories-intro p { color: #5b6b5e; font-size: 1.05rem; }

.stories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
@media (max-width: 768px) {
  .stories-grid { grid-template-columns: 1fr; }
}

.story-card {
  background: #fff;
  border: 1px solid #e6efe3;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 26px rgba(27, 94, 32, 0.10);
}
.story-head { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.story-photo {
  width: 64px; height: 64px; border-radius: 50%;
  object-fit: cover; flex: none;
  filter: grayscale(1);
}
.story-name { font-weight: 700; color: #243528; font-size: 1.05rem; }
.story-country { color: #2e7d32; font-size: 0.9rem; }
.story-text { color: #3a4a3c; line-height: 1.6; margin: 0; }
```

- [ ] **Step 3: Create `stories.html`**

Create `stories.html` with the full content below (final nav block included, with Stories and Join Us):

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Stories: Save Food</title>
	<link rel="stylesheet" href="css/bootstrap.min.css">
	<link rel="stylesheet" href="css/animate.min.css">
	<link rel="stylesheet" href="css/font-awesome.min.css">
	<link rel="stylesheet" href="css/ionicons.min.css">
	<link rel="stylesheet" href="css/style.css">
	<link rel="stylesheet" href="css/food-theme.css">
	<link rel="stylesheet" href="css/stories.css">
	<link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700,300' rel='stylesheet' type='text/css'>
</head>
<body>

	<div class="preloader"><div class="sk-spinner sk-spinner-pulse"></div></div>

	<div class="gh-nav-container">
	   <div class="gh-nav-inner">
	      <div class="gh-brand"><a href="index.html">Save Food</a></div>
	      <nav class="gh-tab-bar" role="tablist">
	         <a href="index.html" class="gh-tab-item">Home</a>
	         <a href="about.html" class="gh-tab-item">About</a>
	         <a href="blog.html" class="gh-tab-item">Blog</a>
	         <a href="stories.html" class="gh-tab-item">Stories</a>
	         <a href="join-us.html" class="gh-tab-item">Join Us</a>
	         <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
	         <a href="donate.html" class="gh-tab-item">Donate</a>
	         <a href="log in.html" class="gh-tab-item">login</a>
	      </nav>
	   </div>
	</div>

	<main class="stories-wrap">
		<div class="stories-intro wow fadeInUp">
			<h1>Voices from around the world</h1>
			<p>Real habits, real kitchens. Here is how people everywhere keep good food out of the bin.</p>
		</div>

		<div class="stories-grid">

			<article class="story-card wow fadeInUp">
				<div class="story-head">
					<img class="story-photo" src="images/vietnam.jfif" alt="Lan from Vietnam">
					<div>
						<div class="story-name">Lan</div>
						<div class="story-country">Hanoi, Vietnam</div>
					</div>
				</div>
				<p class="story-text">My grandmother lived through years when food was scarce, so throwing away rice always felt wrong in our house, and I still cook that way today. Every Sunday I look at what is left in the fridge and plan the week's meals around whatever needs eating first. Wilting herbs go into soup, and tired vegetables become a quick stir fry. I freeze ginger and chillies so they never spoil before I get to them. When there are scraps, they feed the chickens on my mother's small plot. Saving food is not about being poor. It is about respect for the people who grew it.</p>
			</article>

			<article class="story-card wow fadeInUp">
				<div class="story-head">
					<img class="story-photo" src="images/african.jfif" alt="Amara from Nigeria">
					<div>
						<div class="story-name">Amara</div>
						<div class="story-country">Lagos, Nigeria</div>
					</div>
				</div>
				<p class="story-text">At our local market, traders used to throw out crates of tomatoes and peppers that were too soft to sell by the end of the day. It hurt to watch good food rot while neighbours went hungry. So a few of us started collecting the unsold produce each evening and turning it into stews and sauces we share on our street. Soft tomatoes still make a rich base, and bruised peppers still bring flavour. What we cannot cook, we dry in the sun for later. Now the traders set the extra aside for us instead of binning it. A little planning feeds a lot of people.</p>
			</article>

			<article class="story-card wow fadeInUp">
				<div class="story-head">
					<img class="story-photo" src="images/story-marco.jpg" alt="Marco from Italy">
					<div>
						<div class="story-name">Marco</div>
						<div class="story-country">Naples, Italy</div>
					</div>
				</div>
				<p class="story-text">In my family nothing from a meal is ever wasted, because that is how my nonna ran her kitchen. Stale bread is the start of half our recipes, soaked for meatballs or toasted for soup. Vegetable ends and parmesan rinds go into a pot to make a stock that tastes better than anything from a shop. Yesterday's pasta water thickens today's sauce. When tomatoes are cheap and ripe I cook big batches and jar them for winter. People think eating well means buying more. My nonna proved it means wasting less.</p>
			</article>

			<article class="story-card wow fadeInUp">
				<div class="story-head">
					<img class="story-photo" src="images/story-priya.jpg" alt="Priya from India">
					<div>
						<div class="story-name">Priya</div>
						<div class="story-country">Jaipur, India</div>
					</div>
				</div>
				<p class="story-text">Growing up, my mother could feed our whole family for days from what others would throw away. I learned that leftover dal becomes tomorrow's filling for parathas, and that yesterday's rice fries up into a breakfast no one can resist. We keep vegetable peels to flavour the cooking oil, and overripe fruit turns into chutney instead of going in the bin. Nothing edible leaves our kitchen as waste. When we cook for festivals we plan the portions carefully and send any extra home with guests. Food is treated like a guest in our culture, and you do not let a guest go to waste.</p>
			</article>

			<article class="story-card wow fadeInUp">
				<div class="story-head">
					<img class="story-photo" src="images/story-bea.jpg" alt="Bea from Brazil">
					<div>
						<div class="story-name">Bea</div>
						<div class="story-country">Sao Paulo, Brazil</div>
					</div>
				</div>
				<p class="story-text">I run a small cafe, and for years I watched us throw out trimmings at the end of every shift. One day I decided to weigh the waste, and the number shocked me. Now carrot tops become pesto, stale cake turns into a warm pudding, and fruit that is too ripe to serve goes into our juices. I plan the menu around what we already have before I order anything new. My staff treat the scraps as a challenge instead of rubbish. Our waste has dropped by more than half. The savings pay for a free meal we hand out every Friday.</p>
			</article>

			<article class="story-card wow fadeInUp">
				<div class="story-head">
					<img class="story-photo" src="images/story-diego.jpg" alt="Diego from Mexico">
					<div>
						<div class="story-name">Diego</div>
						<div class="story-country">Oaxaca, Mexico</div>
					</div>
				</div>
				<p class="story-text">My grandfather farmed corn, so I grew up knowing how much work goes into every cob, and that is why waste bothers me so much. At home we cook only what we will eat, and we save every tortilla, because day old tortillas make the best chilaquiles. Vegetable trimmings and bones simmer into a broth that becomes the base for the next meal. Even coffee grounds and peelings go back to the garden as compost. I keep a list on the fridge of what needs eating first. None of this is hard. It is just paying attention, the way my grandfather taught me.</p>
			</article>

		</div>
	</main>

	<footer>
		<div class="container">
			<div class="row">
				<div class="col-md-12 col-sm-12">
					<p class="wow fadeInUp">Copyright 2024 Save Food. Together we waste less and feed more.</p>
				</div>
			</div>
		</div>
	</footer>

	<script src="js/jquery.js"></script>
	<script src="js/wow.min.js"></script>
	<script src="js/custom.js"></script>
</body>
</html>
```

- [ ] **Step 4: Verify in the browser**

Open `http://localhost:8000/stories.html`.
Expected: a two-column grid (one column on a narrow window) of six cards, each with a round black and white photo, a name, a country, and a paragraph. The preloader shows then fades. Two photos (Lan, Amara) load from the existing `.jfif` files; the other four load from the downloaded portraits.

- [ ] **Step 5: Suggested commit**

```bash
git add stories.html css/stories.css images/story-marco.jpg images/story-priya.jpg images/story-bea.jpg images/story-diego.jpg
git commit -m "Add Stories section with six stories from around the world"
```

---

## Task 6: Join Us petition page (replaces Contact)

Create `join-us.html`: a pledge, a name and email form that saves to Firebase, a live counter, and a thank-you message. The Google map and the phone, email, and address blocks are gone. The old `contact.html` is removed in Task 7 once nothing links to it.

**Files:**
- Create: `join-us.html`

- [ ] **Step 1: Create `join-us.html`**

Create `join-us.html` with the full content below. It imports the shared `db` from `js/firebase-config.js`, writes each pledge under `pledges` with `push()`, and listens for the live count with `onValue`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Join Us: Save Food</title>
	<link rel="stylesheet" href="css/bootstrap.min.css">
	<link rel="stylesheet" href="css/animate.min.css">
	<link rel="stylesheet" href="css/font-awesome.min.css">
	<link rel="stylesheet" href="css/ionicons.min.css">
	<link rel="stylesheet" href="css/style.css">
	<link rel="stylesheet" href="css/food-theme.css">
	<link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700,300' rel='stylesheet' type='text/css'>
	<style>
		.join-wrap { max-width: 640px; margin: 0 auto; padding: 48px 20px 64px; text-align: center; }
		.join-wrap h1 { color: #1b5e20; font-weight: 800; }
		.pledge { font-size: 1.25rem; color: #243528; line-height: 1.5; margin: 18px 0 24px; }
		.join-count { font-size: 1.05rem; color: #2e7d32; font-weight: 700; margin-bottom: 24px; }
		.join-form input { display: block; width: 100%; margin: 0 0 14px; padding: 13px 16px;
			border: 1.5px solid #dbe5d8; border-radius: 12px; font-size: 15px; box-sizing: border-box; }
		.join-form button { width: 100%; border: none; border-radius: 12px; padding: 14px 20px;
			color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; cursor: pointer;
			background-image: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); }
		.join-thanks { display: none; color: #1b5e20; font-weight: 700; font-size: 1.15rem; margin-top: 8px; }
	</style>
</head>
<body>

	<div class="preloader"><div class="sk-spinner sk-spinner-pulse"></div></div>

	<div class="gh-nav-container">
	   <div class="gh-nav-inner">
	      <div class="gh-brand"><a href="index.html">Save Food</a></div>
	      <nav class="gh-tab-bar" role="tablist">
	         <a href="index.html" class="gh-tab-item">Home</a>
	         <a href="about.html" class="gh-tab-item">About</a>
	         <a href="blog.html" class="gh-tab-item">Blog</a>
	         <a href="stories.html" class="gh-tab-item">Stories</a>
	         <a href="join-us.html" class="gh-tab-item">Join Us</a>
	         <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
	         <a href="donate.html" class="gh-tab-item">Donate</a>
	         <a href="log in.html" class="gh-tab-item">login</a>
	      </nav>
	   </div>
	</div>

	<main class="join-wrap">
		<h1 class="wow fadeIn">Join Us</h1>
		<p class="pledge wow fadeInUp">"I pledge to waste less food and help feed more people."</p>
		<p class="join-count" id="joinCount">Loading the count...</p>

		<form class="join-form wow fadeInUp" id="joinForm">
			<input type="text" id="joinName" placeholder="Your name" required>
			<input type="email" id="joinEmail" placeholder="Your email" required>
			<button type="submit" id="joinSubmit">Add my name</button>
		</form>
		<p class="join-thanks" id="joinThanks">Thank you for joining. Your name is in.</p>
	</main>

	<footer>
		<div class="container">
			<div class="row">
				<div class="col-md-12 col-sm-12">
					<p class="wow fadeInUp">Copyright 2024 Save Food. Together we waste less and feed more.</p>
				</div>
			</div>
		</div>
	</footer>

	<script src="js/jquery.js"></script>
	<script src="js/wow.min.js"></script>
	<script src="js/custom.js"></script>

	<script type="module">
		import { db } from "./js/firebase-config.js";
		import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

		const pledges = ref(db, "pledges");
		const countEl = document.getElementById("joinCount");
		const form = document.getElementById("joinForm");
		const thanks = document.getElementById("joinThanks");
		const submit = document.getElementById("joinSubmit");

		// Live counter. Shows the number only, never the names or emails.
		onValue(pledges, (snap) => {
			const n = snap.numChildren();
			countEl.textContent = n === 1 ? "1 person has joined" : n + " people have joined";
		}, () => {
			countEl.textContent = "";
		});

		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			const name = document.getElementById("joinName").value.trim();
			const email = document.getElementById("joinEmail").value.trim();
			if (!name || !email) return;
			submit.disabled = true;
			submit.textContent = "Adding...";
			try {
				await push(pledges, { name, email, ts: Date.now() });
				form.style.display = "none";
				thanks.style.display = "block";
			} catch (err) {
				submit.disabled = false;
				submit.textContent = "Add my name";
				alert("Something went wrong. Please try again.");
				console.log(err);
			}
		});
	</script>
</body>
</html>
```

- [ ] **Step 2: Verify in the browser**

Open `http://localhost:8000/join-us.html`.
Expected: the pledge shows, the counter loads a number (0 or more), and submitting a name and email hides the form, shows the thank-you line, and bumps the counter by one. Check the Firebase console (Realtime Database, `pledges` node) to confirm the entry was written. No map or contact blocks appear.

- [ ] **Step 3: Suggested commit**

```bash
git add join-us.html
git commit -m "Add Join Us petition page backed by Firebase with a live counter"
```

---

## Task 7: Site-wide nav update and remove the old Contact page

Replace the nav block in every page that has it so it includes the Stories tab and points to `join-us.html` (labelled "Join Us") instead of `contact.html`. Then delete `contact.html`.

**Files (each has the `gh-tab-bar` nav to update):** `index.html`, `about.html`, `blog.html`, `donate.html`, `thank-you.html`, `single-post.html`, `single-post-1.html`, `single-post-2.html`, `single-post-3.html`, `single-post-4.html`, `single-post-5.html`, `single-post-6.html`, `single-post-7.html`, `single-post-8.html`, `single-post-9.html`, `single-project.html`, `single-project 1 .html`, `single-project  2.html`, `single-project  3.html`, `single-project  4.html`, `single-project  5.html`.
**Delete:** `contact.html`.

- [ ] **Step 1: Find every page with the old nav**

```bash
rg --no-heading -l 'href="contact.html"'
```

Expected: the list of HTML pages above (ignore any files under `docs/`, those are plan and spec notes and stay as they are).

- [ ] **Step 2: Replace the nav block in each page**

In each listed page, find the `<nav class="gh-tab-bar" ...> ... </nav>` block. It is the same in every page:

```html
<nav class="gh-tab-bar" role="tablist">
   <a href="index.html" class="gh-tab-item">Home</a>
   <a href="about.html" class="gh-tab-item">About</a>
   <a href="blog.html" class="gh-tab-item">Blog</a>
   <a href="contact.html" class="gh-tab-item">Contact</a>
   <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
   <a href="donate.html" class="gh-tab-item">Donate</a>
   <a href="log in.html" class="gh-tab-item">login</a>
</nav>
```

Replace it with (adds Stories, renames Contact to Join Us pointing at `join-us.html`):

```html
<nav class="gh-tab-bar" role="tablist">
   <a href="index.html" class="gh-tab-item">Home</a>
   <a href="about.html" class="gh-tab-item">About</a>
   <a href="blog.html" class="gh-tab-item">Blog</a>
   <a href="stories.html" class="gh-tab-item">Stories</a>
   <a href="join-us.html" class="gh-tab-item">Join Us</a>
   <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
   <a href="donate.html" class="gh-tab-item">Donate</a>
   <a href="log in.html" class="gh-tab-item">login</a>
</nav>
```

If a page's nav indentation differs slightly, match its existing indentation; only the link list changes.

- [ ] **Step 3: Delete the old Contact page**

```bash
git rm contact.html
```

- [ ] **Step 4: Verify links and the browser**

Confirm nothing references the old page anymore:

```bash
rg --no-heading -n 'contact\.html'
```

Expected: no matches in the HTML pages (matches inside `docs/` are fine to ignore).

Then open `http://localhost:8000/index.html` and click through the nav. Expected: every page shows the Stories and Join Us tabs, both links work, and there is no Contact tab or page.

- [ ] **Step 5: Suggested commit**

```bash
git add -A
git commit -m "Add Stories and Join Us to the nav, remove the old Contact page"
```

---

## Task 8: Remove em and en dashes from reader-facing text

Sweep every HTML page and replace em dashes and en dashes in visible text with plain punctuation, rewriting so each sentence reads naturally. Keep normal hyphens in compound words. Do not touch attributes, URLs, or code.

**Files:** all HTML pages with these characters: `index.html`, `about.html`, `blog.html`, `donate.html`, `thank-you.html`, `eatmefirst.html`, `log in.html`, and all `single-post*.html` and `single-project*.html`. (`join-us.html` and `stories.html` were written clean. `signup.html` had none.)

- [ ] **Step 1: List every occurrence**

```bash
rg --no-heading -n '[\x{2013}\x{2014}]'
```

This lists each em dash (long) and en dash (medium) with its file and line. Work through the list page by page.

- [ ] **Step 2: Apply the rewrite rules**

For each hit, replace the dash and adjust wording:
- A dash joining two clauses becomes a comma, or a period and a new sentence.
- A dash before a list or restatement becomes a colon.
- A dash standing in for "to" in a range becomes the word "to".

Known examples to apply (these are real lines in the site):
- `index.html` title: "Save Food — Stop Food Waste, Feed the Future" becomes "Save Food: Stop Food Waste, Feed the Future".
- `index.html` hero: "Let's change that — one fridge at a time." becomes "Let's change that, one fridge at a time."
- `index.html` intro: "A third of the world's food is thrown away — let's start with your kitchen." becomes "A third of the world's food is thrown away, so let's start with your kitchen."
- `eatmefirst.html` title: "EatMeFirst — never waste food again" becomes "EatMeFirst: never waste food again".
- `log in.html` form title: "Welcome back — log in to your fridge" becomes "Welcome back, log in to your fridge".
- Footer lines such as "Save Food — together we waste less and feed more." become "Save Food. Together we waste less and feed more."

Apply the same style to every remaining hit in the about, blog, donate, thank-you, single-post, and single-project pages.

- [ ] **Step 3: Verify the sweep is complete**

```bash
rg --no-heading -n '[\x{2013}\x{2014}]'
```

Expected: no matches anywhere in the HTML pages. (If a match remains inside `docs/`, that is the plan or spec text and can be left.)

Then open a few pages (`index.html`, `eatmefirst.html`, `log in.html`) and read the changed lines to confirm they sound natural.

- [ ] **Step 4: Suggested commit**

```bash
git add -A
git commit -m "Remove em and en dashes from site text"
```

---

## Self-Review

**Spec coverage:**
- Login and register background photo plus login button: Tasks 3 and 4. Covered.
- Password show/hide fix: Task 1. Covered.
- EatMeFirst loading animation: Task 2. Covered.
- Contact becomes Join Us petition with rename: Tasks 6 and 7. Covered.
- Stories section: Task 5 (page and content) and Task 7 (nav link). Covered.
- Remove em and en dashes: Task 8. Covered.
- Offline images: Task 3 (login background) and Task 5 (portraits). Covered.

**Notes carried from the spec:** static site, no backend (all Firebase from the browser); commits left to the user (stated in Conventions and every task); the counter shows the number only; the dark green tint over the login photo is kept and can be removed later.

**Type and name consistency:** the Firebase node is `pledges` in every reference; the toggle script reads the `toggle` attribute that points at `#passwordd` (matching the input id fixed in Task 1); the nav block in Task 7 matches the one written into `stories.html` and `join-us.html`; image paths (`images/login-bg.jpg`, `images/story-*.jpg`) match between the download steps and the markup.

**Placeholder scan:** the only runtime-resolved values are the stock photo URLs in Tasks 3 and 5, which must be live image URLs chosen at download time; each has an exact download command and a verification step, and the pages degrade gracefully if an image is missing.
