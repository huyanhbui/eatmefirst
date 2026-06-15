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
