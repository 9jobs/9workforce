# Request Workers form

The homepage Request Workers links and the construction section's final CTA now open `/request-workers`. The existing `/contact` page remains separate.

`src/RequestWorkers.jsx` and `src/request-workers.css` contain the new responsive form. `src/main.jsx` registers its route. `src/HomeHero.jsx` and `src/ConstructionJourney.jsx` connect its entry points.

The compact sharp-corner card uses a light blue-grey background and an orange side panel with an overlapping navy contact card. Decorative background circles have been removed. The form remains on the left on desktop and stacks above the contact card on mobile. Step 1 collects Name, Company, Email and Mobile; Continue validates these before showing site requirements in Step 2. Back preserves entered values. GET MY WORKFORCE submits both steps together.

The form uses the existing `/api/submissions` database and SMTP pipeline, with `applicationForm: workerRequest` to identify this enquiry. `lib/workerRequest.js` provides validation and readable email labels, shared by `server.mjs` and `api/submissions.js`. The configured recipient is `support@9workforce.com.au`; SMTP credentials remain in environment configuration.

## Local preview

Run `npm run dev`, then open `http://localhost:3000/request-workers`. If port 3000 is already occupied, set PowerShell `$env:PORT='3002'` and `$env:HMR_PORT='24680'` before `npm run dev` and open port 3002. The separate HMR port avoids conflicts with another running preview. Restart the full server after backend changes; a standalone Vite server does not supply the email endpoint.

## Verification

`npm run build` passed. Browser checks covered desktop, tablet, 390px and 320px mobile layouts, homepage navigation, unchanged Contact page, required fields, API validation, error recovery and success state. One clearly labelled local test was saved and accepted by SMTP through the real endpoint.

Run safe regression checks with `npx playwright test --config playwright.request-workers.config.js`. Set `PREVIEW_URL` to the running server's URL when using another port. Live email testing is skipped by default; explicitly setting `TEST_LIVE_EMAIL=1` sends a labelled test enquiry to the configured inbox.
