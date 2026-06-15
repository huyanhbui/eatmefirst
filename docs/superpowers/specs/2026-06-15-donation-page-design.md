# Donation Page + Stripe Test-Mode Charges — Design

**Date:** 2026-06-15
**Status:** Approved (design); pending implementation plan
**Project type:** Demo / learning project (no real money moves)

## Goal

Add a donation page to the Save Food website that lets a visitor make a
credit-card donation in support of feeding the hungry, framed around the
Food Recovery Network charity (foodrecovery.org). The payment flow must be
genuinely functional (a real transaction is processed), support Visa and
Mastercard, and require **no backend** so it runs on the existing static
site (`python -m http.server`).

Because this is a learning/demo project, the payment runs entirely in
**Stripe test mode** — real charge flow, fake money. No legal/authorization
concerns and no real funds are collected on the charity's behalf.

## Constraints & key decisions

- **Static site, no backend.** The site is plain HTML/CSS/JS served by
  `python -m http.server`. There is no server to hold a Stripe secret key,
  so we cannot create charges from our own code.
- **No raw card handling.** Card data is never entered into, or stored by,
  this repo. Stripe's hosted page collects and processes the card, keeping
  us out of PCI scope entirely.
- **Stripe Payment Links (test mode)** is the chosen mechanism: hosted,
  no-code, no backend, supports Visa/Mastercard automatically, and supports
  both fixed amounts and "customer chooses price."
- **Amount is fixed before reaching Stripe.** Without a backend we cannot
  securely pass an arbitrary typed amount to a hosted link, so each
  selectable amount maps to its own pre-created Payment Link.
- **One-time donations only** (YAGNI). No monthly/recurring giving.
- **Open to everyone.** Donating does not require login; it is independent
  of the existing Firebase auth.
- **Honest demo framing.** A small banner states it is test mode with no
  real charges and shows the Stripe test card number.

## Architecture & data flow

```
donate.html (static site)
   └─ donor clicks an amount button ($5 / $10 / $25 / $50 / choose-your-own)
        └─ browser navigates to that amount's Stripe Payment Link (TEST mode)
             └─ donor enters card (Visa / Mastercard) on Stripe's secure page
                  └─ Stripe processes the test charge
                       └─ Stripe redirects back to thank-you.html
```

Stripe owns: card entry, validation, declines, retries, receipts, PCI.
Our repo owns: the donation page UI, the buttons that link out, and the
thank-you page. No secrets, no card data, no charge-creation code.

## Components

### `donate.html` (new)
Donation page matching the existing theme (same nav container, footer,
`food-theme.css`, Bootstrap, WOW animations). Sections:
- **Intro / mission** — "Every dollar helps feed the hungry," framed around
  Food Recovery Network, with a link to https://foodrecovery.org.
- **Demo banner** — small notice: "Demo — Stripe test mode, no real charges.
  Use test card 4242 4242 4242 4242."
- **Amount selector** — preset buttons `$5 / $10 / $25 / $50` plus a
  "Choose your own" option. Each is an anchor pointing to its Stripe
  Payment Link (placeholder URLs until the links are created).
- **Trust row** — Visa + Mastercard badges (`fa-cc-visa`, `fa-cc-mastercard`)
  and a "Secure payment powered by Stripe" line with a lock icon.

### `thank-you.html` (new)
Simple confirmation page Stripe redirects to after a successful payment:
"Thank you for funding a meal," brief impact line, and a link back to home
/ EatMeFirst. Same theme, nav, and footer.

### Navigation (edit)
Add a **Donate** tab to the `gh-tab-bar` nav on the main pages: `index.html`,
`about.html`, `blog.html`, `contact.html`, `eatmefirst.html`, `log in.html`,
and the two new pages (`donate.html`, `thank-you.html`).

### `css/food-theme.css` (edit)
A small block of styles for the amount-button grid, the trust row, and the
demo banner, reusing existing button/section classes where practical.

### Setup note (new, under `docs/`)
Click-by-click Stripe steps (see below) plus the test card details.

## One-time Stripe setup (performed by the user)

1. Create a free Stripe account; remain in **Test mode**.
2. Create 5 Payment Links:
   - Four fixed amounts: $5, $10, $25, $50.
   - One "customers choose what to pay" (pay-what-you-want) for "choose your own".
3. For each link, set the post-payment confirmation to **redirect to**
   the deployed `thank-you.html` URL.
4. Copy each link's URL into the matching button in `donate.html`,
   replacing the placeholder.

Test card for verifying the flow: `4242 4242 4242 4242`, any future expiry,
any 3-digit CVC, any postal code.

## Error handling

- Card declines, invalid numbers, and retries are handled entirely on
  Stripe's hosted page — outside our code.
- The only failure mode in our code is an unconfigured/placeholder link.
  Placeholders are clearly marked so a click before setup is obvious rather
  than silently broken.

## Testing (manual)

The site has no test runner, so verification is manual:
1. Run `python -m http.server` and open `donate.html`.
2. Confirm Donate appears in the nav and the page matches the site theme.
3. Click each amount button; confirm it opens the correct Stripe test link.
4. Complete a payment with test card `4242 4242 4242 4242`.
5. Confirm the redirect lands on `thank-you.html`.
6. Confirm the charge appears in the Stripe **test** dashboard.

## Out of scope

- Recurring/monthly donations.
- Real (live-mode) payments and any real fund collection for the charity.
- Backend services, databases, or storing donor/payment records.
- Tax receipts, donor accounts, refunds handled in-app (Stripe dashboard
  covers refunds if ever needed).
