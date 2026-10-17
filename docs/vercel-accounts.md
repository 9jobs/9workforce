# Vercel accounts and Google sign-in

Production URL: `https://9workforce.com.au`. Google sign-up and sign-in share one provider flow. The white account card and protected worker/hiring return URLs are unchanged.

## Required configuration

Configure these server-only Vercel Production environment variables:

- `BETTER_AUTH_URL=https://9workforce.com.au`
- `BETTER_AUTH_SECRET`: stable random secret, at least 32 characters.
- `DATABASE_URL`: Supabase **Transaction pooler** PostgreSQL URL, including the real URL-encoded database password and `?sslmode=require`. `SUPABASE_URL` is the REST URL and cannot replace this value.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: the existing Google Web application client.
- Existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for registration emails/submission mirroring.
- `CRON_SECRET` protects the optional notification-retry endpoint.

No secret belongs in a `VITE_` variable or Git. `.env`, `.env.production.local`, `data/` and `scratch/` are ignored by Git and deployment uploads.

In the Google OAuth client, retain the localhost origin/callback and add:

- JavaScript origin: `https://9workforce.com.au`
- Redirect URI: `https://9workforce.com.au/api/auth/callback/google`

The published consent screen/audience must allow intended customer Google accounts. Keep scopes at OpenID, email and profile. The production callback URL must match exactly.

## Database migration and release

1. Put the production secret/base URL in ignored `.env.production.local` and the real `DATABASE_URL` in the local `.env` (or export all three to the migration process).
2. Run `npm run db:migrate:accounts`. This creates the dedicated `workforce_auth` schema, Better Auth tables (including persistent rate limits), and durable notification jobs. It does not alter the existing Supabase `auth` schema or contact-submission table. Keep `workforce_auth` out of the schemas exposed by PostgREST.
3. Set the same variables on the linked **9workforce** Vercel project and deploy the intended Git commit. Vercel runs the built frontend plus `/api/auth/[...all]`, `/api/account/google`, `/api/account/config` and authenticated submissions. `server.mjs` remains the local server; Vercel does not run it as a persistent process.
4. Check `/api/account/config`, the Google redirect URI, secure HttpOnly cookies, registration, session persistence after a new function instance, sign-out, and return to the selected worker/hiring form.

Production fails closed if database/secret/HTTPS configuration is missing. It never silently stores accounts in temporary SQLite. Local development continues using SQLite unless `DATABASE_URL` is explicitly supplied.

Requests to start Google sign-in on another hostname redirect to the canonical origin before issuing the state cookie. This prevents losing the state cookie between a preview/alias and the production OAuth callback.

## Notifications and existing accounts

Vercel `waitUntil` keeps the registration delivery task alive after the auth response. The PostgreSQL outbox records completed mail steps and leases pending jobs across function instances. A retry can be invoked with `GET /api/account/delivery` and `Authorization: Bearer <CRON_SECRET>` from a trusted scheduler. No public unauthenticated retry endpoint is provided. A crash after SMTP acceptance but before saving the message ID can still cause a duplicate email on retry; this is at-least-once delivery.

Local SQLite test accounts are not copied to production automatically. Production accounts persist in PostgreSQL across deployments. Google users can sign in again to create their production account; local email/password test accounts need a separate migration if they must be preserved.

Repeatable checks (no real emails): `node --input-type=module -e "await import('./tests/production-auth.test.js');await import('./tests/account-notifications.test.js');await import('./tests/google-oauth.test.js');"` and the isolated auth browser tests. The production-mode OAuth test uses a fixture database; it does not establish live PostgreSQL connectivity or complete a personal Google consent flow.
