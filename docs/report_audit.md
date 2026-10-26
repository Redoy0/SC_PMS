# SmartCourier (SCPMS) — Project and Template Audit for the Final Defense Report

Audit date: 19 October 2026
Scope: the SmartCourier repository (`SmartCourier/SmartCourier/`), the surrounding defense folder (progress report, presentations, proposal), and the LaTeX template `Hepatocellular Carcinoma Nafi X Asif/`.
Method: full read of the backend source, targeted reading of every frontend page/component, comparison with all project documents, execution of the frontend linter and build, dependency audit, a new black-box API/Socket.IO test harness run against an in-memory database, and screenshot capture of the locally running application. Secrets in `backend/.env` were **not** read or reproduced.

Claim classes used below: **V** = verified (code/config/executed test), **D** = documented but unverified, **P** = planned / incomplete / absent, **U** = unknown.

---

## 1. Project overview (verified)

SCPMS ("Smart Courier and Parcel Management System") is a MERN web application (MongoDB, Express, React, Node.js) for a single courier operator. Three roles share one parcel dataset:

| Role | What the code lets them do | Evidence |
|---|---|---|
| Customer | Self-register (email-verified), book parcels, see own parcels, view parcel QR code, follow parcel on map, receive status emails | `backend/src/controllers/auth.controller.js` `register`, `routes/parcel.routes.js:171`, `frontend/src/pages/CustomerDashboard.jsx`, `CustomerQrScanner.jsx`, `CustomerParcelDetail.jsx` |
| Delivery agent | Created by admin (invitation link), sees assigned parcels, scans customer QR to open pickup confirmation, moves parcel forward through lifecycle, shares live location | `routes/user.routes.js:230`, `AgentDashboard.jsx`, `AgentParcelPickUpConfirmation.jsx`, `ParcelDetailView.jsx` |
| Administrator | Lists users, onboards/disables agents, assigns agents, corrects status, deletes parcels, views metrics, exports CSV/PDF, tracks agents on a map | `components/AdminPanel.jsx`, `pages/AdminAgentTracking.jsx`, `controllers/analytics.controller.js` |

Plus an unauthenticated **public tracking** view by tracking code (`GET /api/parcels/track/:code`, `TrackPublicParcel.jsx`, `PublicTrack.jsx`).

Problem addressed (from proposal/progress report, consistent with code): fragmented, manual courier coordination with no live parcel visibility for customers and little operational insight for administrators.

Deployment configuration exists for Render (backend, `backend/render.yaml`) and Vercel/Netlify (frontend, `frontend/vercel.json`, `frontend/netlify.toml`, proxy to `https://sc-pms.onrender.com`). Whether the live deployment is currently running was **not** verified (U).

## 2. Directory and documentation inventory

| Path | Content | Reliability |
|---|---|---|
| `backend/src/` (25 files, 1,866 LOC incl. seed) | Express API, Mongoose models, Socket.IO, services, middleware | Source of truth |
| `frontend/src/` (36 files, ~9,200 LOC) | React 19 + Vite SPA, 20 page components, EN/BN translations | Source of truth |
| `README.md` | Feature list and architecture | **Overstates**: lists Manager role, Cloudinary, heatmaps, delay-risk heuristic, revenue/monthly reports, audit/activity logs, SMS-ready architecture — none exist in code (see §4) |
| `PROJECT_REPORT.md` | Short thesis-style report | Contains an ER diagram with entities that do not exist (TRACKING_EVENT, DELIVERY_HISTORY, ROUTE_HISTORY, NOTIFICATION, ACTIVITY_LOG, REPORT); mentions Manager role |
| `FINAL_THESIS_REPORT.md` | Long Markdown thesis draft | Contains test tables marked "Pass" without evidence, performance numbers explicitly "Estimated for demonstration" (98.6 %, 0.96, ~180 ms, <2 s), claims QR verification at pickup **and delivery** (only pickup exists), claims `express-validator` is used (it is not) |
| `SECURITY_REVIEW.md` | Two rounds of security fixes (Jul and Oct 2026) | Fixes it describes are present in code (V). Its claims of "78 checks pass" and "eslint (clean)" are D: the test scripts are not in the repository, and ESLint currently reports 98 errors (see §7) |
| `PRESENTATION_CONTENT.md` | Slide script | Secondary |
| `backend/ENVIRONMENT_SETUP.md` | Env-var guide | Partly outdated (`JWT_EXPIRE`, `MONGODB_URI_PROD`, port 3000 CORS) vs. `env.example` |
| `backend/env.example` | Current env-var reference | Consistent with code (V) |
| `postman_collection_api.json` | 18 requests | Outdated: lacks refresh/logout/verify/forgot/reset/agent-invite/user-status endpoints |
| `../SCPMS_Progress_Report.pdf/.docx` (22 Jul 2026) | Student names, IDs, supervisor, timeline | Administrative facts used; its metrics are labelled estimates and are **not** used |
| `../UU_FYP_Defense_Final 3.pdf/.pptx` | Defense slides | Same estimated metrics; references [1]–[3] could not be verified (§10) |
| `new thesis doc/…Smart Courier…pdf` (title defense) | Proposal slides | Names a different supervisor (§8) |
| `.git` | 4 commits (18 Jul – 13 Oct 2026, author "redoy0"/"Redoy0") | History is squashed; project evolution cannot be reconstructed from Git |
| Tests | **None** in repository (no test runner, no test files) | — |
| Screenshots/diagrams | **None** in repository | Genuine screenshots were captured during this audit (§7) |

## 3. Confirmed technology stack (V, from `package.json` files and imports)

Backend (`backend/package.json`, ESM): Node.js (tested on v24.20.0; Netlify config pins Node 20 for the frontend build), Express ^4.19.2, Mongoose ^8.5.1, Socket.IO ^4.7.5, jsonwebtoken ^9.0.2 (HS256), bcryptjs ^2.4.3 (cost 12 default, clamped 10–14), cookie-parser, cors, helmet ^8.3.0, express-rate-limit ^8.6.0, morgan, nodemailer ^10.1.0, pdfkit ^0.15.0, dotenv. `csv-writer` is imported but unused (CSV is streamed manually); `express-validator` is declared but never imported. Node's `crypto` provides tokens and tracking codes.

Frontend (`frontend/package.json`): React ^19.1.1, React Router ^7.8.1, Vite ^7.1.2, Tailwind CSS ^3.4.17, axios, socket.io-client ^4.8.1, Leaflet ^1.9.4 + leaflet-routing-machine (OSRM public demo server), @react-google-maps/api (only `PublicTrack.jsx`), qrcode (QR generation), @zxing/browser + native `BarcodeDetector` (QR scanning).

External services: MongoDB (Atlas implied by deployment docs, U), SMTP (Gmail per docs), Photon (komoot) and Nominatim geocoding via backend proxy `routes/geocode.routes.js`, OpenStreetMap tiles, OSRM demo router, Google Maps JS API (key not present in `frontend/.env.production`).

## 4. Implemented versus planned features

| Feature | Status | Evidence / note |
|---|---|---|
| Customer self-registration with email OTP verification (6 digits, 10 min, 5 attempts, 60 s resend cooldown) | V | `auth.controller.js` `register`, `verifyEmail`, `resendVerification`; tests T05–T12 |
| Login with lockout (5 failures → 15 min), constant-time unknown-user path | V | `login`; T13–T14 |
| Short-lived access JWT (15 min, in memory) + rotating HttpOnly refresh cookie with reuse detection, `tokenVersion` revocation | V | `session.service.js`, `utils/jwt.js`, `middleware/auth.js`, `frontend/src/api.js`; T16–T22, T62 |
| Forgot/reset password (30 min single-use link, no enumeration) | V | `forgotPassword`, `resetPassword`; T65 |
| Admin-created agents with 72 h invitation link; disable/enable accounts | V | `user.routes.js`; T24, T36–T38, T61–T62 |
| RBAC: route guards (`requireRoles`) + ownership checks + frontend route guards | V | `middleware/auth.js`, `parcel.controller.js getParcel`, `routes/ProtectedRoute.jsx`; T23, T25, T30–T32, T39–T41, T50, T58 |
| Parcel booking with validation (size/type/payment enums, COD ≤ 500,000, lengths) | V | `createParcel`; T26–T30 |
| 10-char tracking code, 32-symbol alphabet (~50 bits), `crypto.randomInt` | V | `utils/tokens.js`; T29 |
| Six-state lifecycle with server-side transition rules; final states locked | V | `transitionError` in `parcel.controller.js`; T44–T55 |
| Status history (status, time, actor, role) | V | `statusHistory` in `models/Parcel.js`; T54 |
| Agents may skip forward (e.g. Assigned → Delivered) | V (finding) | T56 — lifecycle is "forward-only", not "strictly sequential" |
| Public tracking with reduced (privacy-preserving) view | V | `toPublicParcel`; T34–T35 |
| Real-time updates via Socket.IO rooms (`role:admin`, `user:<id>`, `parcel:<id>`), anonymous subscription only with tracking code, agent location only from authenticated agent | V | `services/socket.js`, `services/realtime.js`; T43, T49, T51 |
| Agent live location: browser Geolocation `watchPosition` + socket emit; REST location for In-Transit parcels; 20 s periodic push on parcel page | V | `AgentDashboard.jsx:265–335`, `ParcelDetailView.jsx:262–310` |
| Agent last-known locations held in server memory only (lost on restart) | V (limitation) | `agentLocations` Map in `socket.js` |
| QR-assisted pickup: customer page renders QR of URL `…/customer/parcel/qr/<parcelId>`; agent scanner (BarcodeDetector → ZXing fallback, or manual paste) opens confirm page; confirmation calls status `Picked Up`, which the server only permits for the assigned agent | V | `CustomerQrScanner.jsx`, `AgentParcelPickUpConfirmation.jsx`, `AgentPickupConfirmPage.jsx` |
| QR verification at **delivery** | **P (absent)** | No delivery-scan code; QR page text says "pickup/delivery". Drafts and progress report claim both |
| QR as cryptographic proof | **P (absent)** | QR encodes the database id only; the manual fallback accepts a pasted id. Security comes from server-side assignment checks, not from the QR |
| OTP delivery confirmation | Removed | SECURITY_REVIEW #13; no code |
| Email status notifications (best-effort, async) | V | `sendStatusEmail`; dev mode prints instead of sending |
| SMS notifications | P | Future work only |
| Admin metrics: bookings today, failed deliveries, COD collected from delivered parcels | V | `dashboardMetrics`; T57 |
| CSV and PDF export (tracking code, status, payment, COD, created) | V | `exportCsv`, `exportPdf`; T59–T60 |
| Revenue/monthly reports, success-rate charts, heatmaps, delay-risk heuristic, audit/activity logs, Manager role, Cloudinary storage | **P (absent)** | Not in code (grep); README/PROJECT_REPORT claims are incorrect |
| ETA | V (heuristic) | Client-side straight-line (haversine) distance ÷ observed speed or 25 km/h default (`CustomerParcelDetail.jsx:178–199`); server stores `etaMinutes` only if supplied |
| Map routing | V | OSRM demo server via leaflet-routing-machine; Google Directions in `PublicTrack.jsx` |
| Bilingual UI (English/Bangla), 300+ keys each | V | `translations/en.js`, `bn.js`; screenshot `landing-bn.png` |
| Search/filter of parcels | V (basic) | Client-side text filter in admin panel and agent-tracking page |
| NoSQL-injection sanitisation, helmet, CORS allow-list, rate limits, 100 kB body limit, central error handler | V | `middleware/sanitize.js`, `index.js`, `rateLimits.js`; T02–T04, T63, T66 |

Known defects / technical debt found (V): debug button "Test agent location" visible to customers (`CustomerParcelDetail.jsx:626–640`); COD shown with "$" on customer detail page (screenshot); two duplicate public tracking pages (Leaflet and Google Maps) with different behaviour; Google Maps key absent from production env file; `/parcel/:id/route` is a public route but calls an authenticated endpoint; empty file `AgentParcelPickUpScan.jsx`; route/geocode recomputation on each location tick (SECURITY_REVIEW recommendation, not fixed); 1.88 MB main JS bundle; 30 duplicate translation keys; Postman collection outdated; no automated test suite in repo.

## 5. Architecture and data flow (V)

Client–server SPA. React SPA → same-origin `/api` (Vite proxy in dev; Vercel/Netlify rewrite in prod) → Express REST API → MongoDB via Mongoose. A Socket.IO channel runs directly from the browser to the backend (`VITE_SOCKET_URL`). Backend calls out to SMTP and geocoding providers; the browser fetches OSM tiles, the OSRM router and (one page) Google Maps.

Backend layering: `routes/` (HTTP binding + guards) → `controllers/` (validation + business rules) → `models/` (schemas) with `services/` (sessions, sockets, room emission) and `utils/` (JWT, tokens, validation, mailer).

Key flow (booking → delivery): customer `POST /api/parcels` → `parcel:created` to admins → admin `POST /:id/assign` → `parcel:update` to parcel rooms → agent scans QR → `POST /:id/status {Picked Up}` → … → `Delivered`; each step appends `statusHistory`, emits `parcel:update`, and sends an email asynchronously. Location: agent socket `agent:location:update` → server validates sender and fans out to `role:admin` + rooms of agent's active parcels; REST `POST /:id/location` stores `currentLocation` and emits `parcel:location`.

## 6. Database and API findings (V)

Collections: **User** (name, email unique, phone, password hash `select:false`, role enum admin/agent/customer, isActive, emailVerified, emailVerification{codeHash,expiresAt,attempts,lastSentAt}, passwordReset{tokenHash,expiresAt,requestedAt}, tokenVersion, failedLoginAttempts, lockUntil, lastLoginAt, createdBy→User); **Parcel** (trackingCode unique, customer→User, agent→User, addresses, parcelSize/Type, paymentType, codAmount, status, statusHistory[{status,at,by→User,role}], currentLocation{lat,lng,updatedAt}, etaMinutes, notes, timestamps); **Session** (user→User, tokenHash unique, family, expiresAt TTL index, revokedAt, rotatedAt, persistent, userAgent, ip).

REST endpoints (25): auth ×8 (`register, verify-email, resend-verification, login, forgot-password, reset-password, refresh, logout`), parcels ×8 (`GET /track/:code`, `GET /`, `POST /`, `GET /:id`, `POST /:id/assign`, `POST /:id/status`, `POST /:id/location`, `DELETE /:id`), users ×5 (`GET /me`, `GET /`, `POST /agents`, `POST /:id/resend-invite`, `PATCH /:id/status`), assignments ×1 (`GET /agents`), analytics ×3 (`/dashboard`, `/export/csv`, `/export/pdf`), geocode ×1 (`/search`), plus `/health`. Socket events: client→server `subscribe:parcel`, `unsubscribe:parcel`, `agent:location:update`, `request:agent:location`; server→client `parcel:created`, `parcel:update`, `parcel:location`, `agent:location:update`, `request:agent:location`.

## 7. Testing and evaluation evidence

Pre-existing: none executable in the repository. `SECURITY_REVIEW.md` describes earlier manual/automated verification (D).

Produced during this audit (all reproducible, stored under `report/evidence/`):

| Evidence | Command | Result |
|---|---|---|
| API + Socket.IO black-box tests (66 cases) against the **unmodified** backend, in-memory MongoDB 7.0.14, seeded with `backend/scripts/seed.js` | `node report/evidence/api-test/run-api-tests.cjs backend report/evidence/api-test` | **66/66 pass** (`results.json`, `server.log`) |
| Local latency measurement (same run) | — | Median ≈ 15.3 ms for `/health`, public tracking and parcel list (n = 100–200, sequential, localhost, Windows 11, Ryzen 5 5600X). The identical floor for a trivial endpoint shows the figure is dominated by client/OS timer granularity, not application work. Socket fan-out agent→admin median 0.29 ms (n = 50, same process host). Not representative of network deployment |
| Frontend production build | `npx vite build --outDir <tmp>` | Succeeds; warning: 1,879 kB main chunk (428 kB gzip) |
| Frontend lint | `npx eslint .` | **105 problems (98 errors, 7 warnings)**: 45 unused variables, 30 duplicate translation keys, 18 empty blocks, 3 `process` undefined (false positives — Vite replaces `process.env.NODE_ENV`; confirmed absent from bundle), 2 react-refresh, 7 hook-dependency warnings |
| Backend syntax check | `node --check` on all files | No errors |
| Dependency audit | `npm audit --omit=dev` / `npm audit` | 0 vulnerabilities in production deps; 8 (6 high, 2 moderate) in dev tooling (Tailwind 3 chain: `braces`, `postcss-selector-parser`) |
| Screenshots (13) of the locally running app (Vite dev + backend + in-memory DB, demo data, simulated agent geolocation 23.8223 N, 90.3654 E) | `node report/evidence/screenshots/capture-screenshots.cjs . report/evidence/screenshots` | Captured; used in Chapter 4 |

Not available: usability study (no participants), field test with real agents/devices, load test, test against the live deployment, cross-browser/mobile camera testing (headless Chrome with a fake camera only).

## 8. Missing or contradictory documentation

1. **Supervisor**: title-defense proposal names *Pranta Banik, Lecturer*; progress report (22 Jul 2026) and final defense slides name *Dr. Md. Obaidur Rahaman, Professor*. The report uses the latter (most recent) and flags it for confirmation.
2. **Student name**: "Mst. Sharmin Khatun" (proposal) vs "Sharmin Khatun" (progress report, defense). Report uses "Sharmin Khatun" pending confirmation. IDs: 2223081010 (Sharmin Khatun), 2221081138 (Tasnim Jahan Mim) — consistent across documents.
3. **Tracking code**: defense slide 10 shows `uuid().slice(0,8)`; current code uses 10-char `crypto.randomInt` codes (changed in security round 2).
4. **Metrics** in progress report/slides/draft (98.6 %, 0.96, 180 ms, <2 s) are self-declared estimates — excluded.
5. **Feature claims** in README/drafts beyond implementation (see §4).
6. **Progress report** (Jul) lists notifications, analytics, bilingual UI as pending; all three exist now (V) — consistent with later work.
7. Clearance-page committee (coordinator, examiner, head of department) for this project is not documented anywhere → placeholders.
8. Submission month: template says "October, 2026"; actual submission date unknown → placeholder `[SUBMISSION MONTH, YEAR]`.

## 9. Template compatibility and compilation findings

Template files: `main.tex`, `classes/uuthesis.cls` (report.cls derivative, v1.6.1), `frontmatters/` (title, 2ndpage, abstract, clearance, declaration, copyright, dedication, acknowledgment, symbol, abbreviation), `chapter1–6/*.tex`, `backmatters/references.bib` (19 entries, IEEE-style keys `ref1…`), `backmatters/appendix.tex`, empty `backmatters/listofappendices.tex`, `logo/logo.png`, local copies of style files in `style/` (not on the TeX search path from `main.tex`).

Issues found in `main.tex` (the original is left untouched; fixes applied only in `report/main.tex`):

| Issue | Effect | Fix in adapted copy |
|---|---|---|
| `\include{chapters/appendix}` — no `chapters/` directory | Compilation error | Appendix moved to `appendix/appendix.tex`, included with `\appendix` |
| `hyperref` loaded twice, `float` twice, `titlesec` twice; `hyperref` not last | Option clashes / warnings | Single load, `hyperref` last |
| `titlesec` `\titleformat{\chapter}` prints "Chapter 1:" while class head prints "Chapter I" and `tocloft` prints "CHAPTER I:" | Inconsistent chapter numbering | One convention: "Chapter 1" in headings, "CHAPTER 1:" in TOC, arabic section/figure numbers |
| `\addcontentsline` placed *before* `\chapter*` (and after `\bibliography`) | Wrong page numbers in TOC | `\cleardoublepage\phantomsection` then `\addcontentsline` |
| `breakurl` with pdfLaTeX | Package warning / no effect | Replaced with `url`/`xurl` |
| Stray `\` line before main matter | Spurious empty line/page | Removed |
| `lipsum`, `algorithm*`, `multicol`, `amssymb` unused for this report | Harmless | Removed where unused |
| Appendix via `\chapter*{}` + manual "APPENDIX A" | Not in TOC, unnumbered | Real `\appendix` chapters (class sets "Appendix A") |
| Medical figures in `chapter5/figures` | Irrelevant | Not copied |

Class compatibility: `uuthesis.cls` uses `size12.clo`, standard LaTeX2e; compatible with pdfLaTeX, XeLaTeX and Tectonic. No pdfLaTeX/MiKTeX/TeX Live is installed on the audit machine; compilation was performed with **Tectonic 0.17.0** (XeTeX engine with on-demand packages) downloaded to a temporary folder. Bibliography: BibTeX with `IEEEtran.bst` (kept).

## 10. Questions that cannot be resolved from the repository

1. Confirm supervisor (Dr. Md. Obaidur Rahaman vs Pranta Banik) and exact designation.
2. Confirm student names as they must appear (with/without "Mst.") and university e-mail addresses.
3. Names and designations of coordinator, examiner(s) and head of department for the clearance page.
4. Submission month/year and defense date.
5. Is the Render/Vercel deployment live, and is `VITE_GOOGLE_MAPS_API_KEY` set in the hosting dashboard?
6. Were any user/usability sessions or field trials carried out? (No evidence found.)
7. Source and verifiability of literature references [1]–[3] on the defense slides (Ahmed et al. 2019 IJCA; Rahman et al. 2020 IJACSA; Khan et al. 2021 JCSIT). A search did not locate them; they are **not** cited in the report.
8. Individual contribution split between the two students (needed if the department requires it).

## 11. Risks of unsupported academic claims

- Reusing estimated metrics (98.6 % etc.) would present fabricated results — excluded.
- Claiming "QR scan-verified delivery" or "tamper-proof verification" is false — the report describes QR as a pickup-identification aid backed by server-side authorisation.
- Claiming analytics features (revenue trends, heatmaps, delay prediction) or extra entities/roles from the README is false — excluded.
- Claiming superiority over Pathao/Sundarban/Steadfast cannot be supported (no access, no measurement) — the report compares only against published literature categories and states this limitation.
- Claiming production readiness or scalability is unsupported (no load test, in-memory agent locations, single-instance Socket.IO) — stated as limitations.
- Local latency figures must not be generalised to network deployment — stated explicitly.
- Statements about examiner approval, signatures and declarations are left as signature placeholders, not filled in.
