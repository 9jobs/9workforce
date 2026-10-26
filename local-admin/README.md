# 9WORKFORCE local management workspace

## Repository and deployment scope

The management workspace source, design source, assets and automated tests are versioned in Git. Runtime databases, credentials, logs, screenshots and generated builds are ignored. The production build now includes a separate admin entry at `/admin` and `/workspace`. Only selected source and public assets are uploaded; local data, documents, keys and tests are excluded. Git-triggered Vercel deployments remain disabled; release explicitly.

## Hosted admin

The hosted API disables local registration, unauthenticated employer access and worker/employer previews. Existing password-authenticated administrators sign in with their existing credentials; MFA remains enforced. Cookies are Secure and HttpOnly, and cross-origin requests are rejected. Public website accounts and their credentials remain separate.

`lib/cloudWorkspace.js` retains the existing tested SQLite operations inside an isolated temporary directory for each request. The durable source is an AES-GCM encrypted snapshot in the dedicated PostgreSQL `workforce_admin_state` table, with RLS and no anonymous/authenticated database grants. A row lock serializes operations across instances. The snapshot includes records, uploaded documents, authentication limits, settings and MFA state. Responses and session cookies are released only after the database commit succeeds. Temporary files are removed after each invocation. This design is intended for a small internal team; operations serialize and snapshot size grows with document storage. A larger deployment should move the workspace tables and document storage to dedicated relational/object stores.

Provision once using `node scripts/configure-cloud-workspace.mjs`, then `node scripts/provision-cloud-workspace.mjs`. Configuration sends the generated server encryption key to the existing Vercel Production project using stdin. Keep the ignored `local-admin/data/cloud-key` backed up securely; losing it makes the encrypted hosted state unreadable. Provisioning copies existing local records and MFA encryption material but excludes browser sessions, and never replaces an existing hosted snapshot. No plaintext credential or database is committed or deployed as a static file.

After provisioning, use the hosted panel as the management source. Local and hosted workspace edits are independent; both still sync source website submissions and publish job changes. The local panel remains available for development. Serverless email delivery has no always-running worker; existing explicit email tests/actions work, but unattended settings-email queue processing still requires a scheduled worker.

Job posts now support company names, editable request/employer auto-fill, public listing updates and deletion synchronization. The separate public `api/jobs.js` endpoint exposes whitelisted job fields only; no Admin routes or local databases are deployed. Job publishing writes to the dedicated production job-post table. Website account and registration sync reads their source records without modifying authentication credentials. The older implementation notes below describe the earlier stages of this workspace.

## Run locally

In the project root, run `npm run dev` to start the existing public website at http://127.0.0.1:3001. In `local-admin`, run `npm run dev` to start the management workspace at http://127.0.0.1:3002. Admin requires local account setup or sign-in. Employer and Worker retain their local console access. The public website UI, routes, Request Workers form, navigation, footer and production APIs/configuration are unchanged.

The root development launcher now uses `local-admin/website-server.mjs`. It serves the existing public React source and the existing Better Auth library with explicitly local SQLite storage, without loading production database, Supabase or SMTP credentials. Existing local website accounts in root `data/accounts.sqlite` are reused. Google configuration is read separately when present; no Google authorization or email was triggered during testing. Production `server.mjs`, serverless APIs and deployment files are unchanged.

## Live website request sync

The panel now reads worker requests from the existing production Supabase `workforce_form_submissions` table using server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configuration already present in the root `.env`. The running panel checks on refresh and every five seconds while visible, imports all existing worker requests with pagination, and deduplicates by production submission ID. Live data is cached in local SQLite; operational status and assignments remain local and survive subsequent syncs. Production submissions, auth records and email delivery are never modified.

Website accounts sync independently of request submission through a PostgreSQL READ ONLY transaction using `DATABASE_URL`. Safe fields include name, email, verified email state, creation date, Google/email provider labels, and the latest available sign-in date. Requests link to accounts only by verified website account ID. No auth migrations, session tokens, provider tokens, passwords or credential hashes are loaded. Only the maximum session creation timestamp is selected for the available sign-in date. Older submissions lacking accountUserId retain their submitted contact/company details; their website account identity is shown as unavailable rather than inferred from a contact email.

The UI shows connection state, request count and last sync time. Failed reads retain previously imported records and display an error. Configuration credentials are never sent to the browser. Live sync is enabled only in the normal local Vite panel; isolated automated test servers use disposable local data.

## Employer flow — website is the source

1. Employer clicks Request Workers on the website.
2. Existing website sign-in/registration runs before the approved two-step request form opens.
3. Employer fills the original form: name, company, email, mobile, site/location, worker type, quantity, start date and requirements.
4. On the live website, successful submission saves to production Supabase and the local panel imports it automatically. On the localhost website, the bridge saves directly to `local-admin/data/workspace.sqlite`.
5. Admin → Employers and Employer Requests show the records automatically. Open admin views refresh every five seconds and when the tab regains focus.
6. Employer workspace shows all website-submitted employers and requests without requiring a website session. Employer Details supports local management edits, status toggles and history-preserving archive; Account Details shows safe website account identifiers read-only.

Admin does not create employer profiles or worker requests manually. The corresponding create buttons/forms are removed and API creation is blocked. Admin can review details, update operational status, archive/cancel, create jobs from requests and assign workers. Employer and request details can be corrected locally in both management views. Corrections survive subsequent syncs; original website details and source relationships are preserved. Production data is not modified.

Employer details include submitted contact name, company, contact email, mobile, site/location, verified website account name/email/ID, account creation date, first/last submission dates, status, request history and assignments. Each request retains its original submitted contact details and site requirements, even after later submissions update the company's profile. Profiles are linked by verified website account ID, not by user-entered contact email, so matching contact emails cannot claim another employer's history. Repeated submissions by the same account reuse its employer profile. Duplicate source IDs do not create duplicate requests.

The local employer console displays all submitted employers, requests and assignments. Account Details shows website account names, emails, IDs and dates; plaintext passwords and password hashes are never returned. Legacy Local Preview Employer records remain on disk but are excluded from genuine website employer lists.

## Local panel access

The Admin workspace now uses actual local admin accounts and server-backed sessions. First-time setup collects a name, email and password, persists a hashed credential, and signs in. Subsequent logins load that administrator's own saved name, email, phone and photo automatically. The header and sidebar account menus offer Manage Profile and Logout. Profile email edits also update the local login email transactionally. Logout revokes the server session; refreshing or calling the preview endpoint does not reopen Admin access. Admin session cookies are HttpOnly, SameSite=Strict, scoped to the workspace API, and expire after 12 hours. Passwords and credential hashes are never sent back to the browser. Existing placeholder console profiles do not count as configured admin accounts.

Employer and Worker retain their existing local-console/preview behavior. Their profiles and operational flows are unchanged. All panels remain loopback-only and must not be deployed. Public website authentication is separate and unchanged. The welcome dashboard is shown only after Admin sign-in (or restoring a valid saved session). Signed-out visits to the root show the login/setup screen. The header always shows the signed-in account menu, with profile edit and logout controls. The theme uses a navy sidebar, orange accents, a locally stored construction banner, and actual workspace counts. Activity charts count current snapshot records by their actual creation dates over the last seven local calendar days, excluding future, invalid and archived rows; they show a flat empty state when no records were added. They do not imply historical changes in operational status, and fixed decorative trend lines/bars have been removed. Totals display a loading placeholder until the first snapshot arrives. Header search and sidebar read-only panels use existing local snapshot data. Messages shows an honest disconnected state; no external messaging service or production write is added.

Worker uses a separate automatic local preview profile. Existing job/application/assignment operations remain connected. Employer views exclude private worker documents. Database files and stored credentials are denied as static assets.

## Pages

Admin: Dashboard, Employer Requests, Employers, Workers, Job Posts, Applications, Assignments, User Accounts, Settings.

Employer: Dashboard, Employer Requests, Employers, Assigned Workers, Account Details.

Worker: Dashboard, Find Jobs, My Applications, My Assignments, My Profile, Documents & Tickets, Account.

Requests and jobs remain separate. Admin may directly assign available workers or create a reviewed draft/open job from a website request. Worker applications are unique per job. Assignments update related request, application, job and availability states atomically. Destructive UI actions require confirmation and preserve history through archive/cancel/deactivate operations.

## Verification

- `npm test` from local-admin: 21 passing store/security/website-ingestion/live-sync/reference/edit-persistence tests.
- `npm run test:browser`: 6 passing browser scenarios, including real website registration/sign-in, the original two-step form, automatic admin refresh, full employer details, duplicate prevention, direct assignment, job-based hiring, all-record local viewing without cookies, disabled panel login, rejected manual creation and responsive layouts. Tests run both actual local servers with a disposable database at ports 3003 and 3015. Authentication and form submissions are not mocked.
- `npm run build` in local-admin and the project root both pass.
- Running ports 3001/3002 were checked directly: public Request Workers requires sign-in, all three panels open without login and employer Account Details opens without a website session, anonymous submission returns 401 and the local bridge reports connected. No test account/request was inserted into the normal user database during this check.
- Public UI source is unchanged, verified using Git diff. The only tracked project change is the development launcher target in `scripts/dev.mjs`; local-admin was already locally Git-excluded. No commit, push, PR, deployment, production database writes or email delivery occurred. Read-only production access is used for live worker-request sync.

Screenshots: `proof/website-original-request-form.png`, `proof/website-employer-all-details.png`, `proof/website-admin-employers-*.png`, `proof/website-request-mobile.png`, `proof/website-employer-mobile.png`.

## Limits

The localhost panel reads existing and new live website worker requests, as well as requests submitted through the localhost website. It does not write to the production database, send SMTP messages or deploy changes. Local website auth uses the existing local account database. Safe live account identifiers are copied for requests with verified accountUserId; production login credentials are never copied. Other public forms submitted locally are retained in the local submission journal; this task specifically adds automatic employer-request ingestion.

The earlier root role-application API test has an unchanged request-mock/auth mismatch (500 versus expected 400). Real Google-provider authorization and email delivery are outside local verification. Live Supabase request reads and safe account metadata reads were verified; production writes were not performed.

## Implementation for website integration

Added: `website-bridge.mjs`, `website-server.mjs`, `tests/website-bridge.test.mjs`.

Updated: `api.mjs`, `store.mjs`, `model.mjs`, `src/Operations.jsx`, `tests/ui-server.mjs`, `tests/workflow.spec.js`, `package.json`, `README.md`, and project `scripts/dev.mjs`.

Prior UI work includes `src/workspace-theme.css`, which imports the unchanged public `src/brand-tokens.css` palette (#30497D / #F2842F), responsive management-panel styling using the existing website colors.

Live verification (2026-10-19): four existing production worker requests appeared in both running panels at port 3002, verified against their submitted contact emails in the browser without login. All four were imported once; one submission had an account ID available for account metadata enrichment. Screenshots: `proof/live-synced-admin-requests.png` and `proof/live-synced-employer-requests.png`.

## Manageable tables and references

Employers, requests and users now use persistent local references such as EMP-0001, REQ-0001 and USR-0001. Internal relationship IDs are unchanged; reference numbers survive imports, sorting, filtering, reopening and refresh. References are never recycled, so hidden or archived records can leave gaps.

Tables group contact details, use legible email/phone values, concise dates, sticky actions and icon menus. Employer/request/account tables prioritize summary fields; View retains full submitted data and related history. Website accounts display Google/email sign-in methods and verified email state, including users who have not submitted a request yet. Legacy panel admin/preview identities are excluded from the website account list. Website accounts are read-only in both the UI and local API.

Live verification: 4 requests and 2 Google website accounts displayed correctly at port 3002. No new Google authorization or live form submission was triggered. Email-provider behavior was verified with isolated fixtures. Desktop/mobile screenshots are in proof/managed-*.png.

## Record detail cards and local CRUD

Record details now use compact sections aligned with the data-table style, readable dates, a summary header, related history, and collapsed technical references. Table and detail-sheet actions use icons only, with accessible labels and native tooltips. Employer records expose View, Edit and Archive directly in both Admin and Employer consoles. New requests continue through the original website form (the plus icon opens it), respecting the website as the record-creation source.

Active/Deactive uses a switch in employer tables. Other lifecycle states use a status picker with segmented radio toggles: Pending, Reviewing, In Progress, Workers Assigned, Complete and Cancelled map to the existing persisted status values. Existing assignment/relationship constraints still apply. Status controls and local edit forms work in the Employer console as well as Admin. Website login accounts remain read-only.

Employer/request edits are local overrides; sync never overwrites them. The original submitted values remain available in the detail card. Archive preserves relationships and history. Tests cover the full employer edit/reload/status/archive flow using disposable data; normal live user records were inspected without writes.

Final verification: 21 domain/sync tests and 6 browser scenarios pass. Admin and Employer detail cards and icon controls were inspected at 1440px and 390px on the running localhost panel. The isolated browser test verifies employer edit persistence, Active/Deactive switches, request Complete status, and archive confirmation. Build passes.

## Latest control layout

The Actions column now has one pencil trigger. Its dropdown contains labelled icon actions (View, Update, Delete/archive and the actions applicable to that record). Create for employers/requests opens the original website form. Google providers use the coloured Google G logo.

Status changes use compact native select boxes directly in table rows and record forms. Enabled/Disabled map to Active/Inactive, and Pending/Complete map to New/Completed. There is no separate change-status card. Auto-save, assignment constraints, local edit preservation and archive confirmation remain unchanged. Six browser scenarios pass, including saving and reloading inline status selections; live menus and the Google icon were inspected without modifying user records.

## Account Details management

Account Details and User Accounts now provide the same pencil menu for local display-name updates, archive/disable and View. New-account creation continues through website registration. Enabled/Disabled is available inline; these are local management states and do not change or revoke live website authentication. Login email, provider and credentials remain immutable in this console. Local names and status survive subsequent live syncs.

Status selects size to their selected text with a custom chevron seven pixels from the right edge, removing the previous fixed-width gap. The normal account select was verified at 84px, including mobile fit. Final checks: 22 domain/sync tests, 7 browser scenarios and build pass. Account edit/status/archive persistence is tested against disposable data; running user records were inspected read-only.

## Worker website registration integration (completed 20 October 2026)

The unchanged website worker form now feeds the same local management store as employer requests. Production worker registrations are read-only imports from the existing Supabase submission table; localhost registrations use the website bridge. All contact fields, work category, availability, experience/tickets, additional information, safe account metadata, registration history, resume and cover-letter documents are retained. Profiles link by verified website account ID; legacy registrations without one retain their submitted contact details without inventing an account link. Repeated submissions reuse a profile and deduplicate file content. Local corrections, availability and archive states survive re-sync.

Admin Workers and worker management use the existing table palette, compact status controls, readable WRK references, pencil action menu and detail sheets. Worker Account Details lists safely linked Google/email accounts. Worker Documents & Tickets lists the website registration documents by worker. Old My Profile/Account URLs lead to actual registration/account views rather than duplicate preview forms. The existing job/application/assignment preview APIs and behavior remain intact.

New profiles continue through the original website form. Public form/UI, auth logic, production APIs and production storage are unchanged. Documents are served as attachment downloads with nosniff; raw file contents are excluded from JSON snapshots. Unsupported imported file types produce a visible registration warning. All new automated submissions use disposable test databases, not the normal user data or production.

Verification: 24 domain/sync tests pass; the existing 7 browser scenarios pass; a separate worker browser scenario passes on a fresh server so existing auth rate limits are preserved. That scenario exercises real website registration/sign-in, original worker form, resume/cover upload, admin details, downloads, worker status persistence, account metadata, mobile layout, grouped documents and legacy navigation. Panel build passes. The normal localhost website and panel are running with the final bridge.

Read-only live checks found 4 historical worker registrations represented by 3 unique profiles and 5 uploaded documents. Those old registrations did not store account IDs, so their login accounts remain unlinked. New account-linked behavior is verified with real local website sign-in and with Google metadata fixtures; no new Google authorization or production writes were performed. Proof files: proof/worker-complete-*.png, proof/worker-registration-admin-details.png, proof/worker-accounts-mobile.png, proof/worker-final-dashboard.png and proof/worker-final-documents.png.

## Document CRUD and legacy worker account visibility

Worker Documents & Tickets and admin worker detail cards now support per-worker upload, View, Download, Update (name, category, expiry and optional replacement file), and confirmed Delete through the pencil menu. Local uploads accept PDF, Word and image files up to 2 MB. File ownership is immutable. Employer access remains denied. Snapshot metadata excludes file bodies, original file bodies and local content overrides.

Imported document edits persist through subsequent syncs. Deleted documents retain a local tombstone and are excluded from snapshots/downloads so a sync cannot resurrect them. Original production submissions remain unchanged. PDF/image View uses sandboxed inline responses; Word and download links use attachment responses.

Worker Account Details now displays linked website accounts plus a separate Submitted worker contact details table for older registrations without an account ID. The live panel shows three such worker rows rather than an empty account page. No contact email is falsely presented as a verified login or Google account.

Verification: 25 domain/sync tests and the worker browser scenario pass, including document upload/update/download/delete across reloads. Read-only live checks confirm the populated Account Details page, per-worker CRUD controls, upload dialog and mobile fit. Existing employer/staffing browser scenarios are also run separately. Proof: proof/worker-account-contacts-visible.png and proof/worker-document-crud-menu.png.


## Delete versus Disabled (20 October)

Delete removes the record from applicable local panel lists and persists a deletion marker through website sync and reopening. Disabled remains a separate status that keeps the row visible. Previously disabled rows are not automatically deleted; use the pencil menu, Delete, then Confirm delete. Original production submissions and internal relationship history are retained.

Ongoing linked assignments are cancelled atomically before deletion and staffing availability is reconciled. The last active local administrator is protected. Deleted records reject edits. Deleting a linked account does not relabel it as an unverified legacy registration.

Verification: 27 data/sync tests, 7 general/employer browser scenarios, 1 worker end-to-end browser scenario, and build pass. Test deletions use disposable data; actual website submissions are preserved.


## Worker login metadata visibility

Worker rows now show the verified website sign-in providers and login email separately from submitted contact details. A deleted local account is restored only when a verified worker registration has a source timestamp strictly later than that deletion. Replaying older submissions never restores the account; deleting it again after the new activity keeps it hidden. The worker profile, stable references and source account relationship remain unchanged. Disabled accounts are not automatically enabled by normal sync.

Verified the actual WRK-0005 row and Worker Account Details in the running panel: both linked Google and Email & password methods and the login email are visible. Production auth/submission data was read only. Checks: 28 domain/sync tests, isolated worker signup/registration/browser flow, and build pass. Proof: proof/worker-login-method-fixed.png.


## Live job publishing (20 October 2026)

Admin > Job Posts supports Create, View, Update, Duplicate, status changes and confirmed Delete through the existing icon controls. Set status Open to publish. Draft, Closed, Filled and deleted jobs are excluded from the public feed and Worker Find Jobs. Public /find-work keeps the existing work-area catalogue and displays published openings above it using the same card styling. Job details include location, pay, work type, worker count, dates, skills, experience, requirements and tickets. Apply now opens the existing worker-registration flow.

The loopback Admin server writes whitelisted vacancy data to public.workforce_job_posts using server-only DATABASE_URL credentials. Job changes have persistent revisioned publication markers in SQLite. Failed writes remain queued; refresh retries, and concurrent newer changes are published after the older revision. Public Vercel GET /api/jobs reads only Open, non-deleted rows; public writes return 405. The table has RLS enabled. No employer contact data, login credentials, local relationships or publication metadata are exposed. Original form/auth tables are unchanged. local-admin/ is explicitly excluded from Vercel deployment uploads.

Run node local-admin/migrate-jobs.mjs once to provision the idempotent dedicated table. The normal panel uses the live publisher; disposable test servers do not. Restart the normal panel after changing its Vite configuration. Local website also serves the same public feed from the shared SQLite store. The hosted website continues serving already-published jobs when the local Admin is closed.

Released production deployment dpl_3kZRajvPkCPDvm16Kh8zhQhVQjBj to https://9workforce.com.au on 20 October. Verified Admin UI -> live PostgreSQL -> public API -> actual website cards for create/edit/Open/Closed/Delete. Temporary verification vacancies were deleted. Evidence: proof/live-jobs-verification.json and proof/live-published-job-card.png. Checks passed: 31 data/sync/publisher tests, dedicated job-CRUD browser scenario, 7 existing employer/staffing browser scenarios, public website build and panel build. No commit or push was performed.


## Request-linked job employer selection

The job form now selects the actual employer when an Employer Request is chosen and fills position, work type, location, quantity, start date and description. Request options include readable reference, company and position; employer options include the contact name and company. The linked employer is read-only while a request is selected, and the explicit employer ID is retained on submit. Clearing the request enables standalone employer selection. Unrelated fields, such as pay rate, are retained when switching requests. The backend rejects deleted or mismatched relationships.

A website request with a source timestamp later than a deleted employer now restores that linked employer profile with the same ID/reference and latest submitted details. Old request replays and requests deleted earlier remain hidden, and deleting the employer again after the new request stays deleted. This resolves new requests referencing a previously deleted company without reviving all historical records.

Verification: 32 domain/sync/publisher tests, both jobs browser scenarios, and panel build pass. The actual Build Urban request selects its linked contact/company and pre-fills site details in the running panel; no new live job was created or published during this check. Proof: proof/live-job-employer-autofill.png.


## Posted jobs only and reliable local deletion

The public opportunities section no longer renders the six fixed role cards. It displays only jobs from the existing published feed and shows an explicit empty state when there are none. The separate work-area/search catalogue data and registration banner remain intact.

The reported Failed to fetch was reproduced as ECONNREFUSED: the localhost Admin server was not running, so no DELETE reached the backend. It is now started through a hidden detached Windows process with logs in local-admin/data/admin-server-stdout.log and admin-server-stderr.log. The local API client gives a specific connection message; a successful retry clears the old error. Idle PostgreSQL pool errors are handled, and pending job publication/deletion retries every five seconds in the running local server even with the browser closed. Reopen with npm run dev --prefix local-admin after a computer restart.

Checks: 33 data/sync/publisher tests, both job browser scenarios (including forced network failure, retry and website disappearance), both builds, and read-only production listing checks. Automatic approval review rejected creating/deleting a temporary production job, so live data was not mutated for verification. Admin remains excluded from Vercel deployment, backend website files remain unchanged, and no Git push occurred. Production deployment: dpl_uDiQiGzn5o9BHFjvPYc7E21RErhk.


## Figma Admin home

The signed-in Admin home follows frame `21:2326` in Figma file `VUFF5gQo8q9Gb9R6l3jKPc`: 260 px navy sidebar, 64 px header, compact welcome strip, three workspace cards, four KPI cards, workforce activity/recent activity, and three secondary analytics cards. Static SVG icons and the hero watermark are downloaded into `public/assets/figma-home/`; temporary Figma URLs are not used at runtime. The earlier construction-photo banner is no longer part of this home screen.

The existing local login, profile editing, logout, data fetching and operational routes are retained. Chart range controls use current records and actual creation dates (7/30/90 days); this is not a historical status audit. Workforce distribution uses registered work types. Compliance verification is shown as unavailable until a verified source exists, rather than presenting the design's sample percentages as actual audit results. Employer and Worker workspace screens and public website sources are not redesigned.

Validation: isolated browser checks cover the Figma-size desktop frame, mobile navigation, exact intrinsic SVG geometry and successful loading of every rendered design asset, live-data counts, chart ranges, profile persistence and logout.

## Integrated Settings system

Settings now expands within all four existing sidebars and opens dedicated pages. Existing operational menu items and routes are preserved. All work runs in the local panel; no website deployment is part of this change.

### Routes and behavior

| Workspace | Routes (relative to the prefix) | Prefix |
| --- | --- | --- |
| Home | `profile`, `security`, `notifications`, `preferences`, `privacy` | `/settings/` |
| Admin | `account`, `platform`, `roles`, `approvals`, `notifications`, `audit-logs`, `security` | `/admin/settings/` |
| Employer | `account`, `company`, `hiring`, `assignments`, `notifications`, `privacy` | `/employer/settings/` |
| Worker | `account`, `jobs`, `availability`, `notifications`, `documents`, `privacy` | `/worker/settings/` |

Base Settings URLs open the first section. Invalid subroutes show a recovery page. Expanded state follows active routes; refresh, history navigation and mobile navigation are supported. Editable forms provide dirty-state save/reset controls, errors that preserve edits, and confirmation before leaving unsaved work.

### Shared and role-specific data

- Home and Admin use the same administrator profile, credentials and preference record. Updating either profile updates the same user. The existing compact profile modal also uses the shared server validation.
- Each account has one `workspace_preferences` row, keyed by server-resolved user ID. Notification and application preferences are shared account values; worker job/availability/document groups and employer company/hiring/assignment groups are role-specific within that same row.
- Platform configuration uses the reserved `__platform` owner. Only an authenticated administrator can write it. There is no super-admin tier in the existing model; no new role escalation or permission-grant API was added.
- Names, Australian phone numbers and validated PNG/JPEG/WebP uploads update the existing user record. Email changes for credentialed accounts require the current password. The local provider has no email-verification delivery workflow.
- Password changes reuse the existing scrypt credentials, revoke previous sessions, then establish a replacement session for the requesting browser. Session lists show actual expiry and current-session status, without inventing device/IP metadata. Revoke-other-sessions requires the password.
- Time zone and date format affect local Home clocks, recent activity dates, settings/audit dates and operational record date rendering. Platform display name changes sidebar branding and Home welcome text. Support email is used by Home Help & Support. English (Australia) and the existing light theme are the supported presentation modes.
- In-app notification preferences filter `/settings/feed`. Critical account security events remain included. Document reminders use only the requesting worker's linked documents with an explicit expiry date. They do not invent White Card expiry dates or send background/email messages.
- Worker job preferences filter the matching-open-jobs panel. Availability status updates the existing linked worker record using existing validation, transactionally with preferences. Days, shifts and radius are stored preferences, not automatic scheduling or geolocation.
- Exports are real JSON downloads of the requesting account's profile, preferences and linked records. Passwords, session tokens and document binary content are excluded. Admin exports also remain own-account exports rather than unrestricted database dumps.
- Deactivation submissions create actual `Pending` account requests. They do not delete or deactivate accounts. Admin Audit Logs displays pending requests for review; existing User Accounts status controls remain the mechanism for supported account changes.

### Persistence / migration

Startup idempotently creates two SQLite tables in the existing `local-admin/data/workspace.sqlite` database:

- `workspace_preferences(owner_id, data, updated_at)`
- `workspace_audit(id, actor_id, actor_name, action, target, status, details, created_at)`, with time and actor indexes.

Deactivation requests reuse the existing JSON `records` table with kind `accountRequests`. No production database migration or destructive migration is required. Existing records and credentials are retained. Nested store operations use SQLite savepoints so availability changes and preference writes remain atomic.

Audit history begins when this feature is installed: profile/settings changes, successful sign-ins, password/session changes, own-data exports, deactivation requests, and subsequent workforce/document mutations. No old events are fabricated. Audit responses exclude passwords, credential hashes and session tokens.

### API

All paths below are under `/api/workspace/`. Settings endpoints require a valid role-matched session, use the existing localhost/origin checks, and never accept a client-supplied owner ID.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `settings` | Own profile, preferences, platform defaults, capabilities and owned-record options |
| PATCH | `settings/preferences/:group` | Whitelisted, validated role-compatible settings |
| PATCH | `settings/profile` | Shared profile update; reauthenticate login-email changes |
| POST | `settings/password` | Verify current password and rotate credentials/sessions |
| GET | `settings/sessions` | Own active sessions, without tokens |
| POST | `settings/sessions/revoke-others` | Password-confirmed revocation |
| POST | `settings/export` | Password/confirmation-checked own-data export |
| POST | `settings/deactivation` | Confirmation-checked pending request |
| GET | `settings/audit` | Admin-only filtered, paginated actual audit history |
| GET | `settings/feed` | Own notification feed with saved preferences |

The existing `PATCH profile` endpoint uses the same profile validation and now requires a role-matched session. The Employer console obtains an explicit scoped local session through the existing session/preview flow instead of letting Settings write anonymously.

### Current capability boundaries

The current Employer workspace is a **shared local operator console**, and Worker can open a **local preview identity**. These are not production tenant-authenticated portals. Their operational access to imported website records is deliberately preserved. Settings scopes new preferences, options, feeds and exports to the actual local session identity and does not treat an arbitrary displayed company/worker as the signed-in account.

- Company/hiring/assignment defaults are disabled in the shared Employer console because it has no authenticated company ownership link. The backend validates role and linked ownership for those groups; it will not copy another company's contacts or sites into the options. Connecting website identity and using those defaults in the website's request/job forms requires a separate integration.
- Website passwords, Google login, verification and production account settings remain with the website's existing authentication provider. Local preview profiles cannot change website credentials.
- Password-authenticated local accounts support authenticator TOTP, single-use recovery codes, configurable 1/4/12-hour sessions and session revocation. Preview identities have no password login to enrol. Editable role-permission grants, email templates and scheduled assignment reminders are still outside the existing provider.
- Profile/contact visibility applies to the authenticated local workspace directory. It does not publish profiles to the public website. Deactivation requests can be withdrawn or reviewed by an administrator; approval disables the local account and its sessions, with protection for the last active administrator.
- Notification preferences filter the live in-app feed and, for password-authenticated accounts that explicitly opt in, SMTP email. The feed refreshes every 10 seconds, supports persistent read/unread state and keeps security events enabled. Email uses the existing server SMTP configuration, processes new events every 30 seconds and records accepted/retrying/failed delivery states. No external push provider is configured. Worker document reminders require owned documents with recorded expiry dates; Documents & Tickets remains the upload source.
- This integration does not claim that the pre-existing shared management consoles are production multi-tenant access boundaries.

### Files

New implementation: `settings-model.mjs`, `settings-service.mjs`, `settings-security.mjs`, `settings-delivery.mjs`, `settings-activity.mjs`, `src/SettingsNavigation.jsx`, `src/SettingsPage.jsx`, `src/SettingsInteractions.jsx`, `src/settings.css`.

Integrated existing files: `api.mjs`, `store.mjs`, `src/Operations.jsx`, `src/Sidebar.jsx`, `src/AdminHomeSidebar.jsx`, `src/WorkspaceWelcome.jsx`, `src/ProfileManager.jsx`, `package.json`.

Tests/config: `settings.config.js`, `settings-dynamic.config.js`, `tests/settings.test.mjs`, `tests/settings-dynamic.test.mjs`, `tests/settings.spec.js`, `tests/settings-dynamic.spec.js`; profile regression checks in `tests/profile.spec.js`.

### Verification and manual checks

Commands:

- `npm test --prefix local-admin` — existing store/sync/job tests plus Settings security/persistence tests.
- `npm run test:settings:browser --prefix local-admin` — all four Settings dropdowns and account flows, using a disposable database and server on port 3003.
- From `local-admin`: `node ../node_modules/@playwright/test/cli.js test --config profile.config.js` — existing profile/dashboard regression checks.
- `npm run build --prefix local-admin` — production bundle check. This JavaScript project has no configured lint or typecheck script.

Manual verification on `http://127.0.0.1:3002`:

1. Sign in as the existing Admin; expand Home Settings, update My Profile, reload and confirm it matches Admin / Settings / My Account.
2. Change App Preferences, save, and check Home's clock. Try navigating with unsaved edits, then choose to keep or discard them.
3. In Security & Login, review sessions; change a password only if intended, then verify a fresh login with the new password.
4. In Admin Settings, save a platform display name/support email, inspect the read-only role/approval rules, filter Audit Logs and review recorded changes.
5. In Employer Settings, confirm company-specific fields explain the missing ownership link, notification choices persist, and Account Details remains the existing operational page.
6. In Worker Settings, save trades/work preferences, review matching jobs, update availability, and choose document reminder windows. Check the in-app feed.
7. In Privacy, confirm an own-data export and inspect the downloaded JSON. Submit a deactivation request only if desired; it appears as pending in Admin audit review.
8. At a narrow/mobile viewport, open the sidebar and navigate every Settings subsection. Inputs stack, tables scroll within their cards, and the page has no horizontal overflow.


### Dynamic Settings follow-up (24 October 2026)

All five Home Settings pages now use persistent local API state:

- My Profile edits/photo changes use the shared signed-in identity; email changes require the current password. Reset restores the last saved values.
- Security supports actual authenticator enrolment and login challenges, eight single-use recovery codes, device/session activity, individual/other-session revocation and a saved session-duration policy. Enabling/disabling 2FA ends other sessions. Password changes invalidate previous sessions and outstanding login challenges. Expired sessions are never extended by a preference change.
- Notifications include accessible switches, a polling feed, persistent read/unread controls and optional SMTP delivery to the saved account address. Email is off by default; enabling it starts from new events rather than mailing old history. Connection checks send no message; the explicit Send test email action does. Accepted means SMTP acceptance, not confirmed inbox delivery. Failures retry up to five times and remain visible.
- App Preferences apply language locale (English AU/UK/US), IANA time zone, date/time format and comfortable/compact layout. Saving updates the local interface and Home clock; changes persist after reload and login.
- Privacy choices actually filter the shared directory API. Contact sharing is separate from profile visibility. Own-data export excludes credentials, MFA secrets, recovery codes and session tokens. Deactivation requests persist, can be withdrawn, and can be approved/rejected in Admin Settings / Audit Logs.

MFA secrets use AES-256-GCM. The random local key is stored in `data/settings-key`; keep it with private database backups and out of source control. Vite denies the complete data directory and private key filenames. Losing that key prevents use of existing authenticator secrets. Recovery codes are stored as hashes; login challenges are hashed, short-lived, attempt-limited and consumed once. No real account was enrolled or password changed during automated checks.

SMTP is read server-side from the existing `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` and `SMTP_SECURE` configuration. These values never enter Settings responses or the browser bundle. Test suites inject a mock transport and do not email real recipients. Shared preview/operator identities cannot opt into email because they do not have password-authenticated mail identities.

Validation: 46 backend tests, 6 Settings navigation/account browser tests, 3 dynamic Settings browser tests, 4 profile/dashboard browser regressions, and the local-admin production build passed. Screenshots are available in the ignored `proof/` directory. The implementation is local on `http://127.0.0.1:3002`; no deployment was performed.


### Admin submission bell

The existing Home header bell now lists actual worker registration and employer request forms, including the submitted contact name, company (for employers), date/time and unread count. It uses the existing five-second Admin snapshot refresh after website sync. A form keeps one stable notification across repeat syncs and profile/status edits; a new submission by the same person receives a new notification. Worker registration history preserves each submitted name. Reading one item opens the corresponding existing Admin section; Mark all read and per-admin read state persist in SQLite. Recent Activity retains its existing separate behavior.

Only the local Admin implementation changed. The public form UI, submission/validation logic, website ingestion and operational permissions are preserved. New authenticated admin-only routes: `GET /api/workspace/submission-notifications` and `POST /api/workspace/submission-notifications/read`. Returned data excludes email addresses, phone numbers and attachments. Old known form submissions appear in the initial history; deleted records and local preview/manual profiles without a source form are omitted.

Validation: `node --test --experimental-test-isolation=none local-admin/tests/submission-notifications.test.mjs` (4 tests), `npm run test:notifications --prefix local-admin` (isolated website form submission through API to the live Admin bell), profile/dashboard browser regressions, and the local-admin build. No real website test form was submitted. Desktop/mobile proof images are in the ignored `proof/admin-form-notifications-*.png` files.
