# Social Login Setup (Google + GitHub)

The buttons and code are already wired up. To make them work, finish these steps
in the provider consoles. **Important:** social sign-in popups only work when the
site is served over `http`/`https` — open it via a local server, e.g.
`python -m http.server 8000`, then visit `http://localhost:8000/log in.html`.
They do **not** work by double-clicking the HTML file (`file://`).

Firebase project: **asia-festival** (see `js/firebase-config.js`).

## 1. Google (free, ~2 minutes)
1. Open the [Firebase Console](https://console.firebase.google.com/) → project
   **asia-festival**.
2. Build → **Authentication** → **Sign-in method**.
3. Click **Google** → **Enable** → pick a support email → **Save**.
4. Done. The Google button now works on `http://localhost`.

## 2. GitHub (free, ~5 minutes)
1. On GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Application name: `Save Food`
   - Homepage URL: `http://localhost:8000`
   - Authorization callback URL:
     `https://asia-festival.firebaseapp.com/__/auth/handler`
   - Register, then copy the **Client ID** and generate a **Client secret**.
2. Firebase Console → **Authentication → Sign-in method → GitHub → Enable**.
   Paste the Client ID and Client secret → **Save**.
3. Done. The GitHub button now works on `http://localhost`.

## 3. Authorized domains
`localhost` is authorized by default. When you deploy, add your real domain under
Firebase Console → Authentication → Settings → **Authorized domains**.

## Not included yet
Apple and Facebook were intentionally left out. Apple requires a paid Apple
Developer account ($99/yr); Facebook requires a Meta Developer app and review.
The button row is easy to extend later — add a button with `id="apple-login"` /
`id="facebook-login"` and the matching provider in `js/auth-social.js`.
