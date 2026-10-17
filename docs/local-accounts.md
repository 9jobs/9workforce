# Local accounts

Run `npm run dev` and open the localhost address printed in the terminal. The header's Register button opens `/register`. Email/password registration, sign-in, sign-out and cookie sessions use Better Auth and SQLite. Accounts are stored in ignored `data/accounts.sqlite`; the generated signing secret is in ignored `data/auth-secret`. Requires Node 22.13 or later. Do not remove these files to preserve local accounts and sessions.

The canonical dev address is `http://localhost:3001`. `http://localhost:3000` forwards all paths to 3001, including `/api/account/google`, so existing bookmarks use the registered Google callback. The server does not silently change ports if the canonical port is occupied.

`npm run dev` checks the running server before initializing auth or Vite. If this workspace is already running, it prints the existing URL and exits successfully instead of attempting a second listener. A different or older server on that port is reported explicitly and is never terminated automatically. Stop the terminal running the server with Ctrl+C before restarting when a server-side change requires it.

Email/password registration now returns to the sign-in form with the email prefilled; it does not create a session automatically. After sign-in, users choose **Register for Work** or **Request Workers**. Google performs registration/sign-in in one provider flow and returns to the same choices. Signed-in cards use the supplied 9Work Force logo and do not display the user's name or email.

When arriving from a protected form, `/register?mode=signin&next=...` preserves that form's local URL. A successful login, Google login, or new registration returns directly to it. New registrations from this flow also sign in with the submitted credentials; the standalone Register page retains its separate sign-in step. Return URLs are restricted to local worker and hiring pages.

`/request-workers`, `/find-work#register`, and role `/apply` URLs require a session. Public work listings remain browsable, but the embedded worker form is replaced with a sign-in prompt for guests. Worker applications and hiring requests are also checked against the server session before processing `/api/submissions`; each accepted request records the authenticated account ID. An expired session sends the form user back to sign-in with the return URL preserved. The general contact enquiry remains public.

## Registration database and emails

New email/password or Google accounts are stored locally in the auth `user`/`account` tables. A durable `registration_delivery` job mirrors the new user's name, email, local account ID and registration timestamp into Supabase `workforce_form_submissions`, with `form_type=contact` and `fields.applicationForm=accountRegistration`. Passwords and OAuth tokens are never copied into that table or emails.

The configured `MAIL_TO` inbox receives a new-registration notification, and the registrant receives an account confirmation email. After SMTP acceptance, per-email state and message IDs are saved locally; the mirrored row records `email_sent` and `fields.confirmationEmailSent`. SMTP acceptance does not establish inbox placement.

Failures remain in the local delivery queue and retry with backoff while the app runs, including after restart. Completed mail steps are not resent on an ordinary retry. Keep `data/` to retain accounts and pending deliveries. SQLite uses WAL and a busy timeout for concurrent auth/delivery access.

Live verification used a clearly named **Registration Live Test** account at the configured support inbox. Its Supabase row and two accepted test emails were verified. Repeatable delivery/retry checks: `node tests/account-notifications.test.js`. To run browser layout/OAuth checks without generating extra notification emails, set `SKIP_SIGNUP_EMAIL=1` before `npx playwright test --config playwright.accounts.config.js`.

## Enable Google sign-in

For the current local preview, open `http://localhost:3001/register`.

1. Open https://console.cloud.google.com/auth/overview and select/create a Google Cloud project.
2. In Google Auth Platform, complete **Branding** (app name, support email) and **Audience**. For an external app in Testing, add the Google accounts you will use under **Test users**.
3. Open **Clients → Create client → Web application**.
4. Set **Authorized JavaScript origins** to `http://localhost:3001`.
5. Set **Authorized redirect URIs** to `http://localhost:3001/api/auth/callback/google`.
6. Copy the client ID and secret into the existing blank `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=` lines in the project's `.env`. Keep the secret local.
7. Restart the app with `npm run dev`, check that it prints port 3001, then use **Sign in with Google**. If it prints a different port, update the two Google URLs to that port first.

Email/password registration, login and session persistence are tested locally. Google credentials are configured in the ignored `.env`, and the real Google sign-in page has been verified from localhost:3001. The final personal-account login/consent step must be completed by the account owner. In Google Auth Platform → Branding, use **9Work Force** as the app name.

### Other localhost ports

1. Create a Web application OAuth client in Google Cloud Console and configure its consent screen/test users.
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Use the actual localhost port printed by the dev server if 3000 is occupied (for example `http://localhost:3001/api/auth/callback/google`). Use the same hostname in your browser and Google configuration.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`, then restart `npm run dev`. Never put the client secret in a `VITE_` variable.
4. Click Sign in with Google on `/register`. Successful sign-in returns to your local account page. Account linking is disabled: an existing email/password account must continue using its original login method.

Until credentials are configured, the Google button explains that setup is pending and email registration remains available. For the production serverless setup, see [Vercel accounts](vercel-accounts.md).

References: https://better-auth.com/docs/adapters/sqlite and https://developers.google.com/identity/protocols/oauth2/web-server

## Google accounts and passwords

A Google-created account initially has no password. Re-registering an existing email does not overwrite its sign-in method or password; the registration response stays generic to prevent account enumeration. Use Google sign-in, or the **Forgot / set password via email** link on Sign in. The secure reset link expires after 30 minutes, can only be used once, and revokes existing sessions when a new password is saved. It can add a password to a Google account after email ownership is established.
