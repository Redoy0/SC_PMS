# SCPMS Security Review & Fixes

Date: 2026-07-21
Scope: `backend/`, `frontend/` (Socket.IO client, routing, agent dashboard)
Method: Manual code review + live exploitation against an isolated in-memory MongoDB instance (production Atlas data was never touched). Every finding below was reproduced with real requests before being fixed, and re-verified after the fix. Frontend fixes were also verified by running the actual Vite dev server + backend against the same isolated database and driving a headless browser through login, public tracking, and the removed routes.

## Critical

### 1. Privilege escalation on registration
`POST /api/auth/register` accepted a client-supplied `role` field.
- **File:** `backend/src/controllers/auth.controller.js`
- **Proof:** Registered with `{"role":"admin"}` → received a valid admin JWT.
- **Fix:** Registration now always creates a `customer`; the `role` field is ignored/stripped from `req.body` before use.

### 2. Broken access control on parcel deletion
`DELETE /api/parcels/:id` had no role or ownership check.
- **File:** `backend/src/routes/parcel.routes.js`
- **Proof:** Customer B deleted Customer A's parcel (`{"success":true}`, HTTP 200).
- **Fix:** Route now requires `requireRoles('admin')`.

### 3. Broken access control on agent assignment
`POST /api/parcels/:id/assign` had no role check.
- **File:** `backend/src/routes/parcel.routes.js`
- **Proof:** Customer B (a stranger) assigned an agent to Customer A's parcel.
- **Fix:** Route now requires `requireRoles('admin')`.

### 4. IDOR on parcel read
`GET /api/parcels/:id` returned any parcel to any authenticated user.
- **File:** `backend/src/controllers/parcel.controller.js`
- **Proof:** Customer B fetched Customer A's private parcel (addresses, customer name/email) by guessing the Mongo `_id`.
- **Fix:** `getParcel` now requires the requester to be the owning customer, the assigned agent, or an admin (403 otherwise).

## High

### 5. Insecure JWT fallback secret
`backend/src/utils/jwt.js` fell back to the hardcoded string `'dev_secret_change_me'` if `JWT_SECRET` was unset — and this string is public (it's in the repo). `render.yaml` doesn't declare `JWT_SECRET` as a deploy-time env var, so it depends entirely on manual Render dashboard config.
- **Fix:** The app now throws at startup if `JWT_SECRET` is missing and `NODE_ENV=production`. Dev/local still has the fallback for convenience.
- **Action still needed:** Confirm `JWT_SECRET` is actually set in the Render dashboard before your next deploy — the app will now refuse to start without it (safer than silently signing tokens with a public secret).

### 6. No rate limiting (brute-force login)
`RATE_LIMIT_WINDOW`/`RATE_LIMIT_MAX_REQUESTS` existed in `.env` but were never wired up anywhere.
- **Proof:** 8/8 rapid wrong-password attempts against one account all returned 400 with no delay or lockout.
- **Fix:** Added `express-rate-limit` (10 requests / 15 min / IP) on `/api/auth/*`. Also set `app.set('trust proxy', 1)` in `backend/src/index.js` so the limiter sees real client IPs behind Render's proxy. Re-tested: 11th+ rapid request now returns `429`.

### 7. Unauthenticated Socket.IO
`backend/src/services/socket.js` trusted any client-supplied `userId`/`agentId` with zero verification.
- **Proof:** Any socket client could broadcast fake `agent:location:update` events for any `agentId`, spoofing another agent's live location.
- **Fix:**
  - Server verifies a JWT sent via `socket.handshake.auth.token` on connect and attaches `socket.data.user = { id, role }`. Anonymous/public connections (no token) are still allowed — needed for the public tracking pages (`PublicTrack.jsx`, `TrackPublicParcel.jsx`), which are intentionally unauthenticated by design (mirrors the public `GET /api/parcels/track/:trackingCode` REST route).
  - `agent:location:update` is now dropped server-side unless `socket.data.user.role === 'agent'` and the event's `agentId` matches the authenticated user's own id.
  - Frontend `frontend/src/socket.js` now sends the stored JWT (`auth: { token }`) on every socket connection.
- **Verified live** with a 3-case test: (a) no auth + spoofed agentId → blocked, (b) valid agent token + own agentId → broadcast succeeds (feature still works), (c) valid agent token + a *different* agentId → blocked.

## Medium

### 8. Missing input validation → 500s instead of 400s
`express-validator` was a declared dependency but never imported anywhere. An empty/malformed body to `POST /api/parcels` returned HTTP 500.
- **Fix:** `createParcel` now validates required fields and enum values (`parcelSize`, `parcelType`, `paymentType`) and returns 400 with a clear message. New exported enums `PARCEL_SIZES`, `PARCEL_TYPES`, `PAYMENT_TYPES` added to `backend/src/models/Parcel.js` for this.

### 9. Error message leakage
Registration's catch block returned `err.message` (raw DB/internal error text) to the client.
- **Fix:** Generic message returned to client; full error still logged server-side via `console.error`.

### 10. No security headers
- **Fix:** Added `helmet()` middleware in `backend/src/index.js`.

### 11. Dependency vulnerabilities
`npm audit` reported 19 known vulnerabilities in transitive dependencies (express/body-parser, socket.io/engine.io, mongoose, morgan, lodash, qs, path-to-regexp, jws, nodemailer).
- **Fix:** Ran `npm audit fix` — resolved 17 of 19 without breaking changes.
- **Remaining (not auto-fixed):** `nodemailer` and `uuid` vulnerabilities require major-version bumps (flagged as breaking changes by npm). Left untouched since upgrading them could affect the mailer and tracking-code generation — recommend upgrading deliberately with a test pass on the email-notification and parcel-creation flows.

## Frontend / UI issues (found after a follow-up pass)

### 12. Dead route — the "protected" tracking page was unreachable
`App.jsx` declared `/track/:trackingCode` → `PublicTrack.jsx` (public, top-level) *before* `/track/:id` → `TrackParcel.jsx` (nested inside the protected route block). Both patterns match the same URL shape, and React Router resolves the tie in favor of whichever was registered first — so `PublicTrack` always won, for every user, logged in or not. `TrackParcel.jsx` was fully unreachable, and nothing in the app linked to it.
- **Fix:** Removed the dead `/track/:id` route and deleted `frontend/src/pages/TrackParcel.jsx` (confirmed via grep it was referenced nowhere else). Logged-in customers already have an equivalent, reachable detail view at `/customer/parcel/:id` (`CustomerParcelDetail.jsx`).

### 13. Broken feature — OTP delivery confirmation had no backend, and no way to even open it
`AgentDashboard.jsx` had a full "Confirm Delivery via OTP" modal calling `POST /parcels/:id/request-delivery-otp` and `POST /parcels/:id/confirm-delivery-otp` — endpoints that don't exist anywhere in the backend. Worse, nothing in the table actually opened the modal (`setOtpModal({open:true, parcelId: p._id, ...})` was never called from a button), so the whole feature was unreachable dead code on top of being broken.
- **Decision (user):** Remove the OTP UI rather than build the missing backend.
- **Fix:** Removed the `otpModal` state, `requestDeliveryOtp`/`confirmDeliveryOtp` handlers, and the modal JSX from `AgentDashboard.jsx`. Also cleaned up two pre-existing unused imports (`useMemo`, `api`) in the same file while touching it.

### 14. Public, unauthenticated debug/simulator pages shipped to production
`/test`, `/test/push`, `/test/current` (`MapJavascriptRoute.jsx`, `PushInMap.jsx`, `PushCurrentLocation.jsx`) were mounted with no auth guard and no dev-only gate — live on the deployed site for anyone who found the URL. They also broadcast `agent:location:update` using fake string IDs (`'rider-live'`, `'rider-simulator'`) with no real login — the exact spoofing pattern closed off by fix #7, so after that fix these pages' location pushes were silently dropped anyway.
- **Decision (user):** Remove them from production routing entirely (rather than gating behind login).
- **Fix:** Deleted the three routes from `App.jsx` and removed `frontend/src/pages/MapJavascriptRoute.jsx`, `PushInMap.jsx`, `PushCurrentLocation.jsx` (confirmed via grep they were referenced nowhere else).

**Verification for #12–14:** Ran `npm run build` (clean) and `eslint` (clean) after the edits, then launched the real Vite dev server + Express backend against the isolated test database and drove a headless Chromium browser through: (a) agent login → dashboard renders with zero "OTP" text/elements and no console errors beyond expected geolocation-denied noise in a headless context; (b) `/track/<code>` renders the public tracking page correctly; (c) `/test`, `/test/push`, `/test/current` all now redirect away (bounced to `/agent` since already authenticated in that session — would go to `/login` for a logged-out visitor) instead of rendering.

## Not fixed — recommendations only

These are real but lower-priority, or would require a larger redesign / cross-file frontend changes beyond a targeted security fix:

- **JWT in `localStorage`** (`frontend/src/context/AuthContext.jsx`, `frontend/src/api.js`) — vulnerable to token theft via XSS. Moving to an httpOnly cookie would be the sturdier long-term fix, but it's a bigger architectural change (CSRF handling, cookie-based CORS) that touches both frontend and backend auth flow.
- **Global agent-location broadcast** — `io.emit('agent:location:update', ...)` sends every agent's location to *every* connected socket (spoofing is now blocked, but any connected client — including someone on the public tracking page — still receives location data for agents unrelated to the parcel they're tracking). Scoping this to per-parcel rooms would require adding a `parcelId` to the location payload and updating ~6 frontend pages that emit/listen for this event.
- **Unused `express-validator` dependency** — harmless dead weight in `backend/package.json`; could be removed or adopted more broadly for consistency.
- **CORS/Socket.IO CORS defaults to `'*'`** if `CLIENT_ORIGIN`/`SOCKET_CORS_ORIGIN` are unset (`backend/src/index.js`) — low risk since these are expected to always be set in deployment, but worth hard-failing on in production the same way `JWT_SECRET` now does, if you want defense-in-depth against a missed env var.
- **Route/geocode APIs re-fire on every live-location tick** — `TrackParcel.jsx` (now removed) and `PublicTrack.jsx` re-run the full Google Directions request on every incoming `liveLoc`/`currentLocation` change instead of just moving the marker; `TrackPublicParcel.jsx`, `ParcelRoute.jsx`, and `MapJavascriptRoute.jsx` do the same against the free OSRM demo router + the geocode proxy. Under continuous agent movement this re-requests routing/geocoding far more than needed and could hit rate limits on the free OSRM server or your Google Directions quota. Fixing this means debouncing/skipping the route recompute when only the live position changed — didn't touch it this round since it's a behavior change across several map components, not a security issue.
- **Duplicate public tracking pages** — `PublicTrack.jsx` (Google Maps, `/track/:trackingCode`) and `TrackPublicParcel.jsx` (Leaflet+OSRM, `/track-parcel`) do the same job with inconsistent live-update behavior (only `PublicTrack` listens for the global `agent:location:update` broadcast; `TrackPublicParcel` only reacts to `parcel:location`, which requires the agent to already be posting to `/parcels/:id/location`). Worth consolidating to one page, but that's a product decision, not a bug fix.
- **`VITE_GOOGLE_MAPS_API_KEY` appears to be missing from your production build config** — `frontend/.env.production` (the file Vercel/Netlify build from) sets `VITE_API_BASE` and `VITE_SOCKET_URL` but no Google Maps key, and nothing else in the repo sets it either. `PublicTrack.jsx` calls `useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '' })` — with an empty key this renders exactly the gray "This page can't load Google Maps correctly" error I captured while testing locally (screenshot on file). **I can't see your actual Vercel/Netlify dashboard env vars from here** — if the key is set there outside the repo, ignore this; if not, every real customer hitting your live public tracking page is seeing a broken map right now. Worth checking before your next demo.

## Files changed

```
backend/package.json                         (+helmet, +express-rate-limit)
backend/src/controllers/auth.controller.js   (role stripped from register, no error leakage)
backend/src/controllers/parcel.controller.js (ownership check on getParcel, input validation on createParcel)
backend/src/index.js                         (helmet, trust proxy)
backend/src/models/Parcel.js                 (exported enum constants)
backend/src/routes/auth.routes.js            (rate limiter)
backend/src/routes/parcel.routes.js          (admin-only assign/delete)
backend/src/services/socket.js               (JWT auth + agent-id verification)
backend/src/utils/jwt.js                     (fail fast on missing JWT_SECRET in production)
frontend/src/socket.js                       (send JWT on socket connect)
frontend/src/App.jsx                         (removed dead /track/:id route + /test* simulator routes)
frontend/src/pages/AgentDashboard.jsx        (removed dead OTP modal/handlers, unused imports)
frontend/src/pages/TrackParcel.jsx           (deleted — unreachable dead code)
frontend/src/pages/MapJavascriptRoute.jsx    (deleted — unauthenticated debug page)
frontend/src/pages/PushInMap.jsx             (deleted — unauthenticated debug page)
frontend/src/pages/PushCurrentLocation.jsx   (deleted — unauthenticated debug page)
package-lock.json                            (npm audit fix, new deps — npm workspaces root lockfile)
```
