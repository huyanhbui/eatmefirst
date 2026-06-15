# Donation Page + Stripe Test-Mode Charges — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a themed donation page to the Save Food static site whose amount buttons send donors to Stripe Payment Links (test mode) for a real Visa/Mastercard test charge, returning them to a thank-you page.

**Architecture:** Pure static HTML/CSS — no backend, no card data in the repo. Donate buttons are anchors pointing to Stripe-hosted Payment Link URLs (created later by the user in the Stripe dashboard, pasted in as placeholders for now). Stripe owns all card entry, processing, and PCI scope.

**Tech Stack:** Static HTML5, Bootstrap (existing), `css/food-theme.css` (existing theme override), Font Awesome 4 (icons confirmed present: `fa-cc-visa`, `fa-cc-mastercard`, `fa-lock`, `fa-heart`), Stripe Payment Links (test mode). Served via `python -m http.server`.

> **Testing note — read first.** This is a static site with **no test runner**. "TDD" is adapted to: state the expected result, make the change, then **verify in the browser against exact expectations**, then commit. Run the site with `python -m http.server 8000` from the repo root and open the listed URLs. Hard-refresh (Ctrl+F5) after CSS changes.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `donate.html` | Create | The donation page: intro/mission, demo banner, amount buttons (links to Stripe), trust row. |
| `thank-you.html` | Create | Post-payment confirmation page Stripe redirects to. |
| `css/food-theme.css` | Modify (append) | Styles scoped to `#donate`: amount-button grid, demo banner, trust row. |
| `index.html`, `about.html`, `blog.html`, `contact.html`, `eatmefirst.html`, `log in.html` | Modify (nav) | Add a **Donate** tab to the `gh-tab-bar`. |
| `docs/STRIPE-DONATION-SETUP.md` | Create | Click-by-click Stripe Payment Link setup + where to paste URLs + test cards. |

**Out of scope (per spec):** the `single-post*.html` / `single-project*.html` sub-pages do not get the Donate nav item; recurring donations; live-mode keys; any backend.

**Class names used consistently across HTML + CSS tasks** (define once, reuse exactly):
`#donate` (section id), `.demo-banner`, `.donate-intro`, `.donate-amounts`, `.donate-amount`, `.donate-amount.custom`, `.donate-trust`, `.donate-trust .cards`, `.donate-trust .secure`.

**Placeholder Stripe URLs** (replaced during Stripe setup, Task 5): exactly these strings so they are easy to find — `REPLACE_WITH_STRIPE_LINK_5`, `_10`, `_25`, `_50`, `REPLACE_WITH_STRIPE_LINK_CUSTOM`. A click on an unreplaced link 404s, making "not yet configured" obvious.

---

## Task 1: Create `donate.html`

**Files:**
- Create: `donate.html`

- [ ] **Step 1: Write the page**

Create `donate.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en">

<head>

	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="keywords" content="">
	<meta name="description" content="Donate to help feed the hungry — every dollar supports Food Recovery Network.">

	<!-- Site title
   ================================================== -->
	<title>Donate — Save Food</title>

	<!-- Bootstrap CSS
   ================================================== -->
	<link rel="stylesheet" href="css/bootstrap.min.css">

	<!-- Animate CSS
   ================================================== -->
	<link rel="stylesheet" href="css/animate.min.css">

	<!-- Font Icons CSS
   ================================================== -->
	<link rel="stylesheet" href="css/font-awesome.min.css">
	<link rel="stylesheet" href="css/ionicons.min.css">

	<!-- Main CSS
   ================================================== -->
	<link rel="stylesheet" href="css/style.css">

	<!-- Save Food theme override
   ================================================== -->
	<link rel="stylesheet" href="css/food-theme.css">

	<!-- Google web font
   ================================================== -->
	<link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700,300' rel='stylesheet' type='text/css'>

</head>

<body>


	<!-- Preloader section
================================================== -->
	<div class="preloader">

		<div class="sk-spinner sk-spinner-pulse"></div>

	</div>


	<!-- Navigation section
================================================== -->
<div class="gh-nav-container">
   <div class="gh-nav-inner">
      <div class="gh-brand">
         <a href="index.html">Save Food</a>
      </div>
      <nav class="gh-tab-bar" role="tablist">
         <a href="index.html" class="gh-tab-item">Home</a>
         <a href="about.html" class="gh-tab-item">About</a>
         <a href="blog.html" class="gh-tab-item">Blog</a>
         <a href="contact.html" class="gh-tab-item">Contact</a>
         <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
         <a href="donate.html" class="gh-tab-item">Donate</a>
         <a href="log in.html" class="gh-tab-item">login</a>
      </nav>
   </div>
</div>


	<!-- Header section
================================================== -->
	<section id="header" class="header-two">
		<div class="container">
			<div class="row">

				<div class="col-md-offset-3 col-md-6 col-sm-offset-2 col-sm-8">
					<div class="header-thumb">
						<h1 class="wow fadeIn" data-wow-delay="0.6s">Fund a Meal</h1>
						<h3 class="wow fadeInUp" data-wow-delay="0.9s">Every dollar helps feed someone who would otherwise go hungry</h3>
					</div>
				</div>

			</div>
		</div>
	</section>


	<!-- Donation section
================================================== -->
	<section id="donate">
		<div class="container">
			<div class="row">
				<div class="col-md-offset-2 col-md-8">

					<!-- Demo / test-mode notice -->
					<div class="demo-banner wow fadeInUp" data-wow-delay="0.2s">
						<strong>Demo site:</strong> Stripe <strong>test mode</strong> — no real charges.
						Use test card <strong>4242 4242 4242 4242</strong>, any future expiry, any CVC.
					</div>

					<div class="donate-intro wow fadeInUp" data-wow-delay="0.3s">
						<p class="FaQ">FEED THE HUNGRY</p>
						<h1>Turn spare change into meals</h1>
						<p>One third of all food is thrown away while millions go hungry. Your gift supports
							<a href="https://www.foodrecovery.org" target="_blank" rel="noopener">Food Recovery Network</a>,
							which rescues surplus food and gets it to people who need it. Every dollar goes toward feeding the hungry.</p>
					</div>

					<!--
						STRIPE SETUP: replace each href below with your Payment Link URL from the
						Stripe dashboard. See docs/STRIPE-DONATION-SETUP.md. Until then these links 404.
					-->
					<div class="donate-amounts wow fadeInUp" data-wow-delay="0.4s">
						<a class="donate-amount" href="REPLACE_WITH_STRIPE_LINK_5">$5</a>
						<a class="donate-amount" href="REPLACE_WITH_STRIPE_LINK_10">$10</a>
						<a class="donate-amount" href="REPLACE_WITH_STRIPE_LINK_25">$25</a>
						<a class="donate-amount" href="REPLACE_WITH_STRIPE_LINK_50">$50</a>
						<a class="donate-amount custom" href="REPLACE_WITH_STRIPE_LINK_CUSTOM"><i class="fa fa-heart"></i>&nbsp; Choose your own amount</a>
					</div>

					<div class="donate-trust wow fadeInUp" data-wow-delay="0.5s">
						<div class="cards">
							<i class="fa fa-cc-visa" title="Visa"></i>
							<i class="fa fa-cc-mastercard" title="Mastercard"></i>
						</div>
						<p class="secure"><i class="fa fa-lock"></i> Secure payment powered by Stripe — we accept Visa &amp; Mastercard. Your card details never touch this site.</p>
					</div>

				</div>
			</div>
		</div>
	</section>


	<!-- Footer section
================================================== -->
	<footer>
		<div class="container">
			<div class="row">

				<div class="col-md-12 col-sm-12">
					<p class="wow fadeInUp" data-wow-delay="0.3s">Copyright © 2024 Save Food — together we waste less and feed more.</p>
					<ul class="social-icon wow fadeInUp" data-wow-delay="0.6s">
						<li><a href="#" class="fa fa-facebook"></a></li>
						<li><a href="#" class="fa fa-twitter"></a></li>
						<li><a href="#" class="fa fa-dribbble"></a></li>
						<li><a href="#" class="fa fa-behance"></a></li>
						<li><a href="#" class="fa fa-google-plus"></a></li>
					</ul>
				</div>

			</div>
		</div>
	</footer>

	<!-- Javascript
================================================== -->
	<script src="js/jquery.js"></script>
	<script src="js/bootstrap.min.js"></script>
	<script src="js/wow.min.js"></script>
	<script src="js/custom.js"></script>

</body>

</html>
```

- [ ] **Step 2: Verify the page loads and is structurally correct**

Run: `python -m http.server 8000` (from repo root), then open `http://localhost:8000/donate.html`.
Expected:
- Page loads with the nav bar (including a **Donate** tab) and footer.
- A green header box reads "Fund a Meal".
- The demo banner, intro text (with a "Food Recovery Network" link to foodrecovery.org), five amount links ($5/$10/$25/$50/Choose your own), and the Visa/Mastercard + lock trust row are all visible (styling is added in Task 2 — it may look plain here, that's fine).
- Hovering a "Food Recovery Network" link shows it points to `https://www.foodrecovery.org`.

- [ ] **Step 3: Commit**

```bash
git add donate.html
git commit -m "Add donation page with Stripe Payment Link placeholders"
```

---

## Task 2: Style the donation section

**Files:**
- Modify: `css/food-theme.css` (append to end of file)

- [ ] **Step 1: Append the donation styles**

Add this block to the very end of `css/food-theme.css`:

```css

/* =====================================================================
   Donation page (#donate)
   ===================================================================== */
#donate { padding: 60px 0 50px; }

#donate .donate-intro { text-align: center; max-width: 720px; margin: 0 auto 30px; }
#donate .donate-intro h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #1f3322;
  margin: 6px 0 14px;
}
#donate .donate-intro p { color: #4a5a4c; font-size: 1.08rem; line-height: 1.7; }
#donate .donate-intro a { font-weight: 700; }

/* Demo / test-mode banner */
.demo-banner {
  max-width: 720px;
  margin: 0 auto 26px;
  background: #fff7ed;
  border: 1px solid #f3d8b6;
  border-left: 5px solid var(--tomato);
  border-radius: 10px;
  padding: 14px 18px;
  color: #8a5a2b;
  font-size: 0.95rem;
  text-align: center;
}
.demo-banner strong { color: var(--tomato); }

/* Amount buttons */
.donate-amounts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto 34px;
}
.donate-amount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 128px;
  padding: 18px 26px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--leaf-dark) !important;
  background: #fff;
  border: 2px solid #cfe0cb;
  border-radius: 14px;
  text-decoration: none;
  box-shadow: var(--card-shadow);
  transition: transform .12s ease, box-shadow .2s ease, background .15s, color .15s, border-color .15s;
}
.donate-amount:hover,
.donate-amount:focus {
  background: linear-gradient(135deg, var(--leaf), var(--leaf-dark));
  border-color: var(--leaf);
  color: #fff !important;
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(27,94,32,.28);
}
.donate-amount.custom {
  min-width: 100%;
  background: linear-gradient(135deg, var(--leaf), var(--leaf-dark));
  color: #fff !important;
  border-color: var(--leaf);
}

/* Trust row */
.donate-trust { text-align: center; color: #5d6b5f; }
.donate-trust .cards { font-size: 2.6rem; line-height: 1; margin-bottom: 10px; }
.donate-trust .cards .fa { margin: 0 6px; color: var(--leaf); }
.donate-trust .secure { font-size: 0.95rem; max-width: 560px; margin: 0 auto; }
.donate-trust .secure .fa { color: var(--leaf); margin-right: 6px; }

@media (max-width: 600px) {
  #donate { padding: 40px 0 30px; }
  .donate-amount { min-width: 44%; font-size: 1.1rem; padding: 16px; }
  .donate-amount.custom { min-width: 100%; }
}
```

- [ ] **Step 2: Verify the styling renders**

Hard-refresh `http://localhost:8000/donate.html` (Ctrl+F5).
Expected:
- The four amount buttons appear as a centered row of white rounded "pills"; the "Choose your own amount" button is full-width and green below them.
- Hovering an amount button turns it green, white text, and lifts it slightly.
- The demo banner is a soft amber box with a red-orange left border.
- The Visa and Mastercard icons render (not empty squares) above the green padlock "Secure payment powered by Stripe" line.
- On a narrow window (<600px), the four amounts wrap two-per-row.

- [ ] **Step 3: Commit**

```bash
git add css/food-theme.css
git commit -m "Style donation page amount buttons, banner, and trust row"
```

---

## Task 3: Create `thank-you.html`

**Files:**
- Create: `thank-you.html`

- [ ] **Step 1: Write the page**

Create `thank-you.html` with this exact content (reuses the existing `.eat-cta` band styling — no new CSS needed):

```html
<!DOCTYPE html>
<html lang="en">

<head>

	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="keywords" content="">
	<meta name="description" content="Thank you for your donation to help feed the hungry.">

	<!-- Site title
   ================================================== -->
	<title>Thank You — Save Food</title>

	<!-- Bootstrap CSS
   ================================================== -->
	<link rel="stylesheet" href="css/bootstrap.min.css">

	<!-- Animate CSS
   ================================================== -->
	<link rel="stylesheet" href="css/animate.min.css">

	<!-- Font Icons CSS
   ================================================== -->
	<link rel="stylesheet" href="css/font-awesome.min.css">
	<link rel="stylesheet" href="css/ionicons.min.css">

	<!-- Main CSS
   ================================================== -->
	<link rel="stylesheet" href="css/style.css">

	<!-- Save Food theme override
   ================================================== -->
	<link rel="stylesheet" href="css/food-theme.css">

	<!-- Google web font
   ================================================== -->
	<link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700,300' rel='stylesheet' type='text/css'>

</head>

<body>


	<!-- Preloader section
================================================== -->
	<div class="preloader">

		<div class="sk-spinner sk-spinner-pulse"></div>

	</div>


	<!-- Navigation section
================================================== -->
<div class="gh-nav-container">
   <div class="gh-nav-inner">
      <div class="gh-brand">
         <a href="index.html">Save Food</a>
      </div>
      <nav class="gh-tab-bar" role="tablist">
         <a href="index.html" class="gh-tab-item">Home</a>
         <a href="about.html" class="gh-tab-item">About</a>
         <a href="blog.html" class="gh-tab-item">Blog</a>
         <a href="contact.html" class="gh-tab-item">Contact</a>
         <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
         <a href="donate.html" class="gh-tab-item">Donate</a>
         <a href="log in.html" class="gh-tab-item">login</a>
      </nav>
   </div>
</div>


	<!-- Header section
================================================== -->
	<section id="header" class="header-three">
		<div class="container">
			<div class="row">

				<div class="col-md-offset-3 col-md-6 col-sm-offset-2 col-sm-8">
					<div class="header-thumb">
						<h1 class="wow fadeIn" data-wow-delay="0.6s">Thank You!</h1>
						<h3 class="wow fadeInUp" data-wow-delay="0.9s">Your gift is on its way to someone who needs it</h3>
					</div>
				</div>

			</div>
		</div>
	</section>


	<!-- Thank-you section
================================================== -->
	<section class="container">
		<div class="row">
			<div class="col-md-12">
				<div class="eat-cta wow fadeInUp" data-wow-delay="0.3s">
					<h2><i class="fa fa-heart"></i> Thank you for funding a meal</h2>
					<p>Your donation supports Food Recovery Network in rescuing surplus food and feeding the hungry.
						Small gifts add up to real meals — thank you for being part of it.</p>
					<a href="index.html" class="eat-btn">Back to home &rarr;</a>
				</div>
			</div>
		</div>
	</section>


	<!-- Footer section
================================================== -->
	<footer>
		<div class="container">
			<div class="row">

				<div class="col-md-12 col-sm-12">
					<p class="wow fadeInUp" data-wow-delay="0.3s">Copyright © 2024 Save Food — together we waste less and feed more.</p>
					<ul class="social-icon wow fadeInUp" data-wow-delay="0.6s">
						<li><a href="#" class="fa fa-facebook"></a></li>
						<li><a href="#" class="fa fa-twitter"></a></li>
						<li><a href="#" class="fa fa-dribbble"></a></li>
						<li><a href="#" class="fa fa-behance"></a></li>
						<li><a href="#" class="fa fa-google-plus"></a></li>
					</ul>
				</div>

			</div>
		</div>
	</footer>

	<!-- Javascript
================================================== -->
	<script src="js/jquery.js"></script>
	<script src="js/bootstrap.min.js"></script>
	<script src="js/wow.min.js"></script>
	<script src="js/custom.js"></script>

</body>

</html>
```

- [ ] **Step 2: Verify the page loads**

Open `http://localhost:8000/thank-you.html`.
Expected:
- Nav and footer present; header box reads "Thank You!".
- A green gradient band shows "Thank you for funding a meal" with a white "Back to home" button that returns to `index.html`.

- [ ] **Step 3: Commit**

```bash
git add thank-you.html
git commit -m "Add post-donation thank-you page"
```

---

## Task 4: Add "Donate" to the nav on existing pages

**Files:**
- Modify: `index.html`, `about.html`, `blog.html`, `contact.html`, `eatmefirst.html`, `log in.html`

- [ ] **Step 1: Apply the same nav edit to each of the 6 files**

In each file, find these two consecutive lines:

```html
         <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
         <a href="log in.html" class="gh-tab-item">login</a>
```

and replace them with these three lines (insert the Donate tab between them, 9-space indent to match):

```html
         <a href="eatmefirst.html" class="gh-tab-item">EatMeFirst</a>
         <a href="donate.html" class="gh-tab-item">Donate</a>
         <a href="log in.html" class="gh-tab-item">login</a>
```

Note: `log in.html` references `eatmefirst.html`/`log in.html` in its own nav too — apply the identical edit there. (If any of these 6 files happens not to contain the exact two-line block, stop and inspect its nav before editing.)

- [ ] **Step 2: Verify Donate appears in every main page's nav**

Run: `grep -c 'donate.html' index.html about.html blog.html contact.html eatmefirst.html "log in.html"`
Expected: each file reports `1`.

Then open `http://localhost:8000/index.html` and confirm a **Donate** tab sits between EatMeFirst and login, and clicking it loads `donate.html`.

- [ ] **Step 3: Commit**

```bash
git add index.html about.html blog.html contact.html eatmefirst.html "log in.html"
git commit -m "Add Donate tab to main site navigation"
```

---

## Task 5: Write the Stripe setup doc

**Files:**
- Create: `docs/STRIPE-DONATION-SETUP.md`

- [ ] **Step 1: Write the doc**

Create `docs/STRIPE-DONATION-SETUP.md` with this content:

```markdown
# Stripe Donation Setup (Test Mode)

The donation page (`donate.html`) sends donors to Stripe-hosted **Payment Links**.
No backend and no card data ever touch this site. Follow these one-time steps to
make the buttons live. Everything here is **test mode** — no real money moves.

## 1. Create a Stripe account
1. Sign up at https://dashboard.stripe.com/register (free).
2. Make sure the **Test mode** toggle (top-right of the dashboard) is **ON**.

## 2. Create 5 Payment Links
Dashboard → **Product catalog** → **Payment Links** → **+ New** (or **More → Payment Links**).

Create four fixed-amount links and one "choose your own":

| Link | Type | Setting |
|------|------|---------|
| $5  | Fixed | Product name e.g. "Donation – $5", price **$5.00**, one-time |
| $10 | Fixed | price **$10.00**, one-time |
| $25 | Fixed | price **$25.00**, one-time |
| $50 | Fixed | price **$50.00**, one-time |
| Custom | Customer chooses | enable **"Let customers choose what they pay"** (a.k.a. customer-chosen price / pay-what-you-want), suggested amount optional |

For each link, under **After payment**, choose **Don't show confirmation page →
Redirect to your website** and enter your `thank-you.html` URL, e.g.
`http://localhost:8000/thank-you.html` (or your deployed URL).

## 3. Paste the links into the page
Copy each link's URL (looks like `https://buy.stripe.com/test_xxxxxxxx`) and replace
the matching placeholder in `donate.html`:

| Placeholder in donate.html | Replace with |
|----------------------------|--------------|
| `REPLACE_WITH_STRIPE_LINK_5`      | your $5 link |
| `REPLACE_WITH_STRIPE_LINK_10`     | your $10 link |
| `REPLACE_WITH_STRIPE_LINK_25`     | your $25 link |
| `REPLACE_WITH_STRIPE_LINK_50`     | your $50 link |
| `REPLACE_WITH_STRIPE_LINK_CUSTOM` | your custom-amount link |

## 4. Test it
1. Run `python -m http.server 8000` and open `http://localhost:8000/donate.html`.
2. Click an amount → you land on Stripe's hosted checkout.
3. Pay with a test card:
   - Visa: `4242 4242 4242 4242`
   - Mastercard: `5555 5555 5555 4444`
   - Any future expiry (e.g. 12/34), any 3-digit CVC, any postal code.
4. After "payment", Stripe redirects you to `thank-you.html`.
5. Confirm the payment shows in Stripe dashboard → **Payments** (test mode).

## Going live (later, optional)
Switch the dashboard to live mode, recreate the links with live pricing, swap the
URLs in `donate.html`, and remove the demo banner. Live donations to a charity you
don't operate also require authorization to fundraise on their behalf — out of scope
for this demo.
```

- [ ] **Step 2: Verify the doc**

Open `docs/STRIPE-DONATION-SETUP.md` and confirm the placeholder names in the table
exactly match those in `donate.html` (`REPLACE_WITH_STRIPE_LINK_5/_10/_25/_50/_CUSTOM`).

Run: `grep -o 'REPLACE_WITH_STRIPE_LINK_[A-Z0-9]*' donate.html | sort -u`
Expected: the five names `_5, _10, _25, _50, _CUSTOM` (each appears once), matching the doc's table.

- [ ] **Step 3: Commit**

```bash
git add docs/STRIPE-DONATION-SETUP.md
git commit -m "Document Stripe Payment Link setup for donations"
```

---

## Task 6: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full static walkthrough (no Stripe account needed)**

With `python -m http.server 8000` running:
1. From `index.html`, click the **Donate** tab → lands on `donate.html`.
2. Donate page shows: demo banner, mission text with working foodrecovery.org link, four amount pills + full-width custom button, Visa/Mastercard icons + secure note.
3. Open `thank-you.html` directly → confirmation band + "Back to home" works.
4. Confirm the Donate tab is present on about, blog, contact, eatmefirst, and log in pages.

- [ ] **Step 2: Document the Stripe-dependent check as a manual follow-up**

The live charge flow (click amount → Stripe → test card → redirect to thank-you →
payment in dashboard) requires the user to complete `docs/STRIPE-DONATION-SETUP.md`
first. Note this clearly when handing off; it is not blocked by code.

- [ ] **Step 3: No-op commit guard**

Run: `git status`
Expected: clean working tree (all prior tasks committed). If anything is uncommitted, commit it before finishing.

---

## Self-Review (completed during planning)

- **Spec coverage:** donate page ✓ (T1/T2), thank-you page ✓ (T3), nav Donate tab ✓ (T4), CSS ✓ (T2), Stripe setup doc ✓ (T5), Visa/MC support ✓ (Stripe + trust row), demo banner ✓ (T1/T2), one-time only ✓ (fixed-amount links), no backend / no card data ✓ (Payment Links), manual testing ✓ (T6).
- **Placeholders:** the only intentional placeholders are the clearly-named Stripe URLs, replaced in T5 setup. No "TBD"/"handle errors"-style gaps.
- **Type/name consistency:** class names and the five `REPLACE_WITH_STRIPE_LINK_*` tokens are identical across donate.html (T1), CSS (T2), and the setup doc (T5).
```
