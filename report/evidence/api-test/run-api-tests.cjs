/*
 * SCPMS black-box API and Socket.IO test harness (thesis evidence, Chapter 5).
 *
 * - Starts a throw-away in-memory MongoDB (mongodb-memory-server). No real
 *   database is ever contacted.
 * - Starts the unmodified backend (backend/src/index.js) as a child process
 *   whose working directory is a temporary folder, so backend/.env (which may
 *   contain production credentials) is NOT loaded. SMTP variables are removed
 *   from the environment, so the backend prints emails to stdout instead of
 *   sending them; the harness reads verification codes / invite links from there.
 * - Seeds the admin account with the project's own scripts/seed.js.
 * - Executes test cases over HTTP and Socket.IO and writes results.json.
 *
 * Usage:
 *   TEST_DEPS=<dir with mongodb-memory-server and socket.io-client installed> \
 *   node run-api-tests.cjs <path-to-backend> <output-dir>
 */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');

const depsDir = process.env.TEST_DEPS || __dirname;
const need = (m) => require(require.resolve(m, { paths: [depsDir] }));
const { MongoMemoryServer } = need('mongodb-memory-server');
const { io: ioClient } = need('socket.io-client');

const BACKEND = path.resolve(process.argv[2] || path.join(__dirname, '../../../backend'));
const OUT = path.resolve(process.argv[3] || __dirname);
const PORT = 5055;
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const results = [];
let serverLog = '';

function record(id, area, title, expected, actual, pass, requirement) {
	results.push({ id, area, requirement, title, expected, actual: String(actual), status: pass ? 'Pass' : 'Fail' });
	console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${title} -> ${actual}`);
}

// Minimal cookie-aware HTTP client
function client() {
	const jar = {};
	let token = null;
	async function req(method, url, { body, headers = {}, raw = false, auth = true, rawBody } = {}) {
		const h = { ...headers };
		if (body !== undefined) h['Content-Type'] = 'application/json';
		if (auth && token) h.Authorization = `Bearer ${token}`;
		const cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
		if (cookie) h.Cookie = cookie;
		const t0 = process.hrtime.bigint();
		const res = await fetch(BASE + url, {
			method, headers: h,
			body: rawBody !== undefined ? rawBody : (body !== undefined ? JSON.stringify(body) : undefined)
		});
		const ms = Number(process.hrtime.bigint() - t0) / 1e6;
		const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
		for (const sc of setCookies) {
			const [pair] = sc.split(';');
			const idx = pair.indexOf('=');
			const k = pair.slice(0, idx); const v = pair.slice(idx + 1);
			if (v === '' || /expires=Thu, 01 Jan 1970/i.test(sc)) delete jar[k]; else jar[k] = v;
		}
		let data = null;
		if (raw) data = Buffer.from(await res.arrayBuffer());
		else { const text = await res.text(); try { data = JSON.parse(text); } catch { data = text; } }
		return { status: res.status, data, headers: res.headers, setCookies, ms };
	}
	return {
		req, jar,
		get token() { return token; }, set token(t) { token = t; },
		get: (u, o) => req('GET', u, o),
		post: (u, body, o = {}) => req('POST', u, { ...o, body }),
		patch: (u, body, o = {}) => req('PATCH', u, { ...o, body }),
		del: (u, o) => req('DELETE', u, o)
	};
}

function lastMatch(re) {
	const all = [...serverLog.matchAll(re)];
	return all.length ? all[all.length - 1][1] : null;
}
async function waitFor(fn, ms = 5000) {
	const end = Date.now() + ms;
	while (Date.now() < end) { const v = fn(); if (v) return v; await sleep(50); }
	return null;
}
function connectSocket(token) {
	return new Promise((resolve, reject) => {
		const s = ioClient(BASE, { auth: token ? { token } : {}, transports: ['websocket'], reconnection: false });
		s.on('connect', () => resolve(s));
		s.on('connect_error', reject);
	});
}
function collect(socket, event) {
	const list = [];
	socket.on(event, (p) => list.push({ at: Date.now(), p }));
	return list;
}
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; };
const stats = (arr) => ({ n: arr.length, mean: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2), median: +pct(arr, 50).toFixed(2), p95: +pct(arr, 95).toFixed(2), max: +Math.max(...arr).toFixed(2) });

async function main() {
	fs.mkdirSync(OUT, { recursive: true });
	const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scpms-test-'));
	const mongo = await MongoMemoryServer.create();
	const env = { ...process.env };
	for (const k of Object.keys(env)) if (/^(MAIL_|SMTP_|MONGODB_|JWT_|CLIENT_ORIGIN|APP_URL|SEED_)/.test(k)) delete env[k];
	Object.assign(env, {
		NODE_ENV: 'development',
		PORT: String(PORT),
		MONGODB_URI: mongo.getUri('scpms_test'),
		JWT_SECRET: crypto.randomBytes(48).toString('base64url'),
		CLIENT_ORIGIN: 'http://localhost:5173',
		EMAIL_VERIFICATION: 'required',
		TRUST_PROXY_HOPS: '0',
		BCRYPT_ROUNDS: '10',
		SEED_ADMIN_PASSWORD: 'Admin12345test',
		SEED_AGENT_PASSWORD: 'Agent12345test'
	});

	const seed = spawnSync(process.execPath, [path.join(BACKEND, 'scripts/seed.js')], { cwd: workDir, env, encoding: 'utf8' });
	console.log('seed:', (seed.stdout || '').trim(), (seed.stderr || '').trim());

	const server = spawn(process.execPath, [path.join(BACKEND, 'src/index.js')], { cwd: workDir, env });
	server.stdout.on('data', d => { serverLog += d.toString(); });
	server.stderr.on('data', d => { serverLog += d.toString(); });
	const up = await waitFor(() => /Server running/.test(serverLog), 20000);
	if (!up) throw new Error('Backend did not start:\n' + serverLog);

	const env_info = {
		date: new Date().toISOString(), node: process.version, platform: `${os.type()} ${os.release()} ${os.arch()}`,
		cpu: os.cpus()[0]?.model, cpus: os.cpus().length, memGB: +(os.totalmem() / 2 ** 30).toFixed(1),
		mongodb: 'mongodb-memory-server (in-memory mongod)', backend: BACKEND
	};

	try {
		await runTests(env);
	} finally {
		server.kill();
		await mongo.stop();
		fs.writeFileSync(path.join(OUT, 'server.log'), serverLog.replace(/[A-Za-z0-9_-]{40,}/g, '<redacted-token>'));
		const summary = { environment: env_info, total: results.length, passed: results.filter(r => r.status === 'Pass').length, failed: results.filter(r => r.status === 'Fail').length };
		fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ summary, results, performance: perf }, null, 2));
		console.log('\nSUMMARY', JSON.stringify(summary));
	}
}

const perf = {};

async function runTests() {
	const anon = client();
	const admin = client(), c1 = client(), c2 = client(), c3 = client(), agent = client(), agent2 = client();

	// ---------- System ----------
	let r = await anon.get('/health');
	record('T01', 'System', 'Health endpoint responds', '200 {status:ok}', `${r.status} ${JSON.stringify(r.data)}`, r.status === 200 && r.data.status === 'ok', 'NFR-Availability');
	r = await anon.get('/api/parcels');
	const hdr = r.headers;
	record('T02', 'Security', 'Security headers set by helmet', 'X-Content-Type-Options=nosniff, X-Frame-Options present',
		`nosniff=${hdr.get('x-content-type-options')}, xfo=${hdr.get('x-frame-options')}`,
		hdr.get('x-content-type-options') === 'nosniff' && !!hdr.get('x-frame-options'), 'NFR-Security');
	r = await anon.get('/api/does-not-exist');
	record('T03', 'System', 'Unknown API route returns JSON 404', '404', r.status, r.status === 404, 'NFR-Robustness');
	r = await anon.req('POST', '/api/auth/login', { rawBody: '{"email":', headers: { 'Content-Type': 'application/json' } });
	record('T04', 'System', 'Malformed JSON body rejected', '400', r.status, r.status === 400, 'NFR-Robustness');

	// ---------- Registration ----------
	const base = { name: 'Customer One', email: 'c1@test.local', phone: '01712345678', password: 'Passw0rd99', acceptTerms: true };
	r = await anon.post('/api/auth/register', { ...base, password: 'short' });
	record('T05', 'Auth', 'Registration rejects weak password', '400 WEAK_PASSWORD', `${r.status} ${r.data.code}`, r.status === 400 && r.data.code === 'WEAK_PASSWORD', 'FR-01');
	r = await anon.post('/api/auth/register', { ...base, phone: '12345' });
	record('T06', 'Auth', 'Registration rejects invalid Bangladeshi mobile number', '400 INVALID_PHONE', `${r.status} ${r.data.code}`, r.status === 400 && r.data.code === 'INVALID_PHONE', 'FR-01');
	r = await anon.post('/api/auth/register', { ...base, acceptTerms: false });
	record('T07', 'Auth', 'Registration requires acceptance of terms', '400 TERMS_REQUIRED', `${r.status} ${r.data.code}`, r.status === 400 && r.data.code === 'TERMS_REQUIRED', 'FR-01');
	r = await anon.post('/api/auth/register', { ...base, role: 'admin' });
	record('T08', 'Auth', 'Valid registration (with injected role=admin) requires email verification', '201 VERIFICATION_REQUIRED', `${r.status} ${r.data.status}`, r.status === 201 && r.data.status === 'VERIFICATION_REQUIRED', 'FR-01');
	r = await c1.post('/api/auth/login', { email: base.email, password: base.password });
	record('T09', 'Auth', 'Unverified account cannot sign in', '403 EMAIL_NOT_VERIFIED', `${r.status} ${r.data.code}`, r.status === 403 && r.data.code === 'EMAIL_NOT_VERIFIED', 'FR-02');
	r = await c1.post('/api/auth/verify-email', { email: base.email, code: '000000' === lastMatch(/Verification code: (\d{6})/g) ? '111111' : '000000' });
	record('T10', 'Auth', 'Wrong verification code rejected', '400 INVALID_CODE', `${r.status} ${r.data.code}`, r.status === 400 && r.data.code === 'INVALID_CODE', 'FR-02');
	const code1 = await waitFor(() => lastMatch(/Verification code: (\d{6})/g));
	r = await c1.post('/api/auth/verify-email', { email: base.email, code: code1 });
	c1.token = r.data.accessToken;
	const rtCookie = (r.setCookies || []).find(c => c.startsWith('scpms_rt=')) || '';
	record('T11', 'Auth', 'Correct code verifies account, signs in and role stays customer', '200, role=customer, HttpOnly refresh cookie on /api/auth',
		`${r.status}, role=${r.data.user?.role}, cookie=${/HttpOnly/i.test(rtCookie) && /Path=\/api\/auth/i.test(rtCookie) ? 'HttpOnly;Path=/api/auth' : rtCookie}`,
		r.status === 200 && r.data.user?.role === 'customer' && /HttpOnly/i.test(rtCookie) && /Path=\/api\/auth/i.test(rtCookie), 'FR-01, FR-02, NFR-Security');
	r = await anon.post('/api/auth/register', base);
	record('T12', 'Auth', 'Duplicate email registration rejected', '409 EMAIL_TAKEN', `${r.status} ${r.data.code}`, r.status === 409 && r.data.code === 'EMAIL_TAKEN', 'FR-01');

	async function registerVerified(cl, name, email, phone) {
		await anon.post('/api/auth/register', { name, email, phone, password: 'Passw0rd99', acceptTerms: true });
		const code = await waitFor(() => { const m = [...serverLog.matchAll(new RegExp(`To: ${email.replace('.', '\\.')}[\\s\\S]*?Verification code: (\\d{6})`, 'g'))]; return m.length ? m[m.length - 1][1] : null; });
		const v = await cl.post('/api/auth/verify-email', { email, code });
		cl.token = v.data.accessToken;
		return v;
	}
	await registerVerified(c2, 'Customer Two', 'c2@test.local', '01812345678');
	await registerVerified(c3, 'Customer Three', 'c3@test.local', '01912345678');

	// ---------- Login ----------
	r = await anon.post('/api/auth/login', { email: base.email, password: 'WrongPass1' });
	const r2 = await anon.post('/api/auth/login', { email: 'nobody@test.local', password: 'WrongPass1' });
	record('T13', 'Auth', 'Wrong password and unknown email give the same generic response', '401 INVALID_CREDENTIALS for both',
		`${r.status} ${r.data.code} / ${r2.status} ${r2.data.code}`, r.status === 401 && r2.status === 401 && r.data.message === r2.data.message, 'FR-02, NFR-Security');
	for (let i = 0; i < 5; i++) await anon.post('/api/auth/login', { email: 'c3@test.local', password: 'WrongPass1' });
	r = await anon.post('/api/auth/login', { email: 'c3@test.local', password: 'Passw0rd99' });
	record('T14', 'Auth', 'Account locks after 5 failed attempts (even correct password then fails)', '423 ACCOUNT_LOCKED', `${r.status} ${r.data.code}`, r.status === 423 && r.data.code === 'ACCOUNT_LOCKED', 'FR-02, NFR-Security');
	r = await admin.post('/api/auth/login', { email: 'admin@example.com', password: 'Admin12345test' });
	admin.token = r.data.accessToken;
	record('T15', 'Auth', 'Seeded administrator signs in', '200 role=admin', `${r.status} role=${r.data.user?.role}`, r.status === 200 && r.data.user?.role === 'admin', 'FR-02');
	r = await c1.post('/api/auth/login', { email: base.email, password: base.password });
	c1.token = r.data.accessToken;

	// ---------- Session / token handling ----------
	r = await anon.get('/api/parcels', { auth: false });
	record('T16', 'Auth', 'Protected endpoint without token rejected', '401 NO_TOKEN', `${r.status} ${r.data.code}`, r.status === 401 && r.data.code === 'NO_TOKEN', 'FR-03');
	r = await anon.get('/api/parcels', { headers: { Authorization: 'Bearer not.a.jwt' }, auth: false });
	record('T17', 'Auth', 'Protected endpoint with forged token rejected', '401 INVALID_TOKEN', `${r.status} ${r.data.code}`, r.status === 401 && r.data.code === 'INVALID_TOKEN', 'FR-03');
	r = await c1.req('POST', '/api/auth/refresh');
	record('T18', 'Auth', 'Refresh without X-Requested-With header blocked (CSRF defence)', '403 CSRF_CHECK_FAILED', `${r.status} ${r.data.code}`, r.status === 403 && r.data.code === 'CSRF_CHECK_FAILED', 'NFR-Security');
	const xhr = { headers: { 'X-Requested-With': 'XMLHttpRequest' } };
	const oldCookie = c1.jar.scpms_rt;
	r = await c1.req('POST', '/api/auth/refresh', xhr);
	const newCookie = c1.jar.scpms_rt;
	record('T19', 'Auth', 'Refresh issues new access token and rotates refresh cookie', '200, new cookie differs', `${r.status}, rotated=${oldCookie !== newCookie}`, r.status === 200 && !!r.data.accessToken && oldCookie !== newCookie, 'FR-03');
	c1.token = r.data.accessToken;
	const thief = client(); thief.jar.scpms_rt = oldCookie;
	r = await thief.req('POST', '/api/auth/refresh', xhr);
	record('T20', 'Auth', 'Re-using a just-rotated cookie within grace window is treated as a race', '401 REFRESH_RACE', `${r.status} ${r.data.code}`, r.status === 401 && r.data.code === 'REFRESH_RACE', 'FR-03');
	console.log('   (waiting 31 s for the rotation grace window to expire)');
	await sleep(31000);
	r = await thief.req('POST', '/api/auth/refresh', xhr);
	const r3 = await c1.req('POST', '/api/auth/refresh', xhr);
	record('T21', 'Auth', 'Replay of rotated cookie after grace window revokes the whole token family', '401 TOKEN_REUSE, then legitimate cookie also 401',
		`${r.status} ${r.data.code}; legit=${r3.status}`, r.status === 401 && r.data.code === 'TOKEN_REUSE' && r3.status === 401, 'FR-03, NFR-Security');
	r = await c1.post('/api/auth/login', { email: base.email, password: base.password });
	c1.token = r.data.accessToken;
	const sessC1 = client(); r = await sessC1.post('/api/auth/login', { email: base.email, password: base.password });
	r = await sessC1.req('POST', '/api/auth/logout', xhr);
	const after = await sessC1.req('POST', '/api/auth/refresh', xhr);
	record('T22', 'Auth', 'Logout ends the session (refresh afterwards fails)', '204 then 401', `${r.status} then ${after.status}`, r.status === 204 && after.status === 401, 'FR-03');

	// ---------- Role checks / users ----------
	r = await c1.get('/api/users');
	record('T23', 'Access control', 'Customer cannot list users', '403', r.status, r.status === 403, 'FR-04');
	r = await admin.post('/api/users/agents', { name: 'Agent Two', email: 'agent2@test.local', phone: '01612345678' });
	const agent2Id = r.data.user?._id;
	record('T24', 'Users', 'Admin creates a delivery agent (invitation pending)', '201, role=agent, emailVerified=false', `${r.status}, role=${r.data.user?.role}, verified=${r.data.user?.emailVerified}`,
		r.status === 201 && r.data.user?.role === 'agent' && r.data.user?.emailVerified === false, 'FR-05');
	r = await c1.post('/api/users/agents', { name: 'X Agent', email: 'x@test.local', phone: '01612345679' });
	record('T25', 'Access control', 'Customer cannot create agents', '403', r.status, r.status === 403, 'FR-04, FR-05');

	// ---------- Parcel booking ----------
	const parcelBody = { pickupAddress: 'Uttara Sector 7, Dhaka', deliveryAddress: 'Mirpur 10, Dhaka', parcelSize: 'Small', parcelType: 'Document', paymentType: 'COD', codAmount: 1200, notes: 'Handle with care' };
	r = await c1.post('/api/parcels', { ...parcelBody, parcelSize: 'Huge' });
	record('T26', 'Booking', 'Booking with invalid parcel size rejected', '400', r.status, r.status === 400, 'FR-06');
	r = await c1.post('/api/parcels', { ...parcelBody, codAmount: 600000 });
	record('T27', 'Booking', 'COD amount above 500,000 rejected', '400', r.status, r.status === 400, 'FR-06');
	r = await c1.post('/api/parcels', { ...parcelBody, pickupAddress: '' });
	record('T28', 'Booking', 'Missing pickup address rejected', '400', r.status, r.status === 400, 'FR-06');
	r = await c1.post('/api/parcels', parcelBody);
	const p1 = r.data;
	record('T29', 'Booking', 'Valid booking creates Pending parcel with 10-character tracking code', '201, Pending, /^[A-HJ-NP-Z2-9]{10}$/',
		`${r.status}, ${p1.status}, code=${p1.trackingCode}`, r.status === 201 && p1.status === 'Pending' && /^[A-HJ-NP-Z2-9]{10}$/.test(p1.trackingCode) && p1.statusHistory?.length === 1, 'FR-06, FR-07');
	r = await admin.post('/api/parcels', parcelBody);
	record('T30', 'Access control', 'Only customers can book parcels (admin refused)', '403', r.status, r.status === 403, 'FR-04, FR-06');
	const p2 = (await c1.post('/api/parcels', { ...parcelBody, paymentType: 'Prepaid', parcelType: 'Fragile', deliveryAddress: 'Banani, Dhaka' })).data;
	const p3 = (await c2.post('/api/parcels', { ...parcelBody, codAmount: 800 })).data;

	r = await c2.get('/api/parcels');
	record('T31', 'Access control', 'Customer list shows only own parcels', 'c2 sees exactly 1 parcel', `count=${r.data.length}`, r.status === 200 && r.data.length === 1 && r.data[0]._id === p3._id, 'FR-04, FR-08');
	r = await c2.get(`/api/parcels/${p1._id}`);
	record('T32', 'Access control', "Customer cannot read another customer's parcel (IDOR)", '403', r.status, r.status === 403, 'FR-04');
	r = await c1.get('/api/parcels/not-an-id');
	record('T33', 'Robustness', 'Malformed parcel id rejected', '400', r.status, r.status === 400, 'NFR-Robustness');

	// ---------- Public tracking ----------
	r = await anon.get(`/api/parcels/track/${p1.trackingCode.toLowerCase()}`);
	const leaked = ['customer', 'notes'].filter(k => k in (r.data || {}));
	record('T34', 'Tracking', 'Public tracking (case-insensitive) returns reduced view without customer data or notes', '200, no customer/notes fields',
		`${r.status}, leaked=[${leaked}], historyKeys=${Object.keys(r.data.statusHistory?.[0] || {})}`,
		r.status === 200 && leaked.length === 0 && !('by' in (r.data.statusHistory?.[0] || {})), 'FR-09, NFR-Privacy');
	r = await anon.get('/api/parcels/track/ZZZZZZZZZZ');
	const rb = await anon.get('/api/parcels/track/bad$code');
	record('T35', 'Tracking', 'Unknown or malformed tracking code returns 404', '404 / 404', `${r.status} / ${rb.status}`, r.status === 404 && rb.status === 404, 'FR-09');

	// ---------- Agent activation and assignment ----------
	r = await admin.post(`/api/parcels/${p1._id}/assign`, { agentId: agent2Id });
	record('T36', 'Assignment', 'Agent with pending invitation cannot be assigned', '400', `${r.status} ${r.data.message}`, r.status === 400, 'FR-05, FR-10');
	const invite = await waitFor(() => lastMatch(/Invite link: (\S+)/g));
	const inviteToken = new URL(invite).searchParams.get('token');
	r = await anon.post('/api/auth/reset-password', { token: inviteToken, password: 'weak' });
	const ok = await anon.post('/api/auth/reset-password', { token: inviteToken, password: 'AgentPass22' });
	record('T37', 'Users', 'Agent activates account through invitation link (weak password refused)', '400 then 200', `${r.status} then ${ok.status}`, r.status === 400 && ok.status === 200, 'FR-05');
	r = await agent2.post('/api/auth/login', { email: 'agent2@test.local', password: 'AgentPass22' });
	agent2.token = r.data.accessToken;
	r = await agent.post('/api/auth/login', { email: 'agent1@example.com', password: 'Agent12345test' });
	agent.token = r.data.accessToken;
	const agentId = r.data.user._id;
	record('T38', 'Auth', 'Activated and seeded agents can sign in', '200 role=agent (both)', `${r.status} role=${r.data.user?.role}; agent2 token=${!!agent2.token}`, r.status === 200 && r.data.user?.role === 'agent' && !!agent2.token, 'FR-02, FR-05');

	r = await c1.post(`/api/parcels/${p1._id}/assign`, { agentId });
	record('T39', 'Access control', 'Customer cannot assign agents', '403', r.status, r.status === 403, 'FR-04, FR-10');
	r = await agent.post(`/api/parcels/${p1._id}/status`, { status: 'Picked Up' });
	record('T40', 'Lifecycle', 'Agent cannot update a parcel not assigned to them', '403', r.status, r.status === 403, 'FR-04, FR-11');
	r = await c1.post(`/api/parcels/${p1._id}/status`, { status: 'Delivered' });
	record('T41', 'Access control', 'Customer cannot change parcel status', '403', r.status, r.status === 403, 'FR-04, FR-11');

	// Sockets: admin, owner customer, unrelated customer, anonymous (right/wrong code)
	const sAdmin = await connectSocket(admin.token);
	const sOwner = await connectSocket(c1.token);
	const sOther = await connectSocket(c2.token);
	const sPublic = await connectSocket(null);
	const sGuess = await connectSocket(null);
	const sAgent = await connectSocket(agent.token);
	const sSpoof = await connectSocket(c2.token);
	sPublic.emit('subscribe:parcel', { parcelId: p1._id, trackingCode: p1.trackingCode });
	sGuess.emit('subscribe:parcel', { parcelId: p1._id, trackingCode: 'WRONGCODE2' });
	await sleep(300);
	const evAdminUpd = collect(sAdmin, 'parcel:update'), evOwnerUpd = collect(sOwner, 'parcel:update'), evOtherUpd = collect(sOther, 'parcel:update');
	const evPublicUpd = collect(sPublic, 'parcel:update'), evGuessUpd = collect(sGuess, 'parcel:update');
	const evPublicLoc = collect(sPublic, 'parcel:location');
	const evAdminAgentLoc = collect(sAdmin, 'agent:location:update'), evOwnerAgentLoc = collect(sOwner, 'agent:location:update'), evOtherAgentLoc = collect(sOther, 'agent:location:update');

	r = await admin.post(`/api/parcels/${p1._id}/assign`, { agentId });
	record('T42', 'Assignment', 'Admin assigns active agent; parcel becomes Assigned', '200 Assigned', `${r.status} ${r.data.status}`, r.status === 200 && r.data.status === 'Assigned', 'FR-10');
	await sleep(400);
	record('T43', 'Real-time', 'Assignment pushed to admin, owner and code-holding public viewer only', 'admin, owner, public receive; other customer and wrong-code socket do not',
		`admin=${evAdminUpd.length}, owner=${evOwnerUpd.length}, public=${evPublicUpd.length}, other=${evOtherUpd.length}, wrongCode=${evGuessUpd.length}`,
		evAdminUpd.length > 0 && evOwnerUpd.length > 0 && evPublicUpd.length > 0 && evOtherUpd.length === 0 && evGuessUpd.length === 0, 'FR-12, NFR-Privacy');

	r = await agent.post(`/api/parcels/${p1._id}/status`, { status: 'Picked Up' });
	record('T44', 'Lifecycle', 'Assigned agent marks parcel Picked Up', '200 Picked Up', `${r.status} ${r.data.status}`, r.status === 200 && r.data.status === 'Picked Up', 'FR-11');
	r = await agent.post(`/api/parcels/${p1._id}/status`, { status: 'Assigned' });
	record('T45', 'Lifecycle', 'Agent cannot move a parcel backwards', '400', `${r.status} ${r.data.message}`, r.status === 400, 'FR-11');
	r = await admin.post(`/api/parcels/${p1._id}/assign`, { agentId: agent2Id });
	record('T46', 'Assignment', 'Parcel cannot be reassigned after pickup', '400', `${r.status} ${r.data.message}`, r.status === 400, 'FR-10');
	r = await agent.post(`/api/parcels/${p1._id}/status`, { status: 'In Transit' });
	record('T47', 'Lifecycle', 'Agent marks parcel In Transit', '200 In Transit', `${r.status} ${r.data.status}`, r.status === 200 && r.data.status === 'In Transit', 'FR-11');

	r = await agent.post(`/api/parcels/${p1._id}/location`, { lat: 123, lng: 90.4 });
	record('T48', 'Tracking', 'Out-of-range coordinates rejected', '400', r.status, r.status === 400, 'FR-12');
	r = await agent.post(`/api/parcels/${p1._id}/location`, { lat: 23.8103, lng: 90.4125, etaMinutes: 25 });
	await sleep(300);
	record('T49', 'Tracking', 'Agent location update stored and pushed to public tracking viewer', '200; public socket receives parcel:location',
		`${r.status}; publicEvents=${evPublicLoc.length}`, r.status === 200 && r.data.currentLocation?.lat === 23.8103 && evPublicLoc.length > 0, 'FR-12');
	r = await agent2.post(`/api/parcels/${p1._id}/location`, { lat: 23.8, lng: 90.4 });
	record('T50', 'Access control', 'Another agent cannot post location for this parcel', '403', r.status, r.status === 403, 'FR-04, FR-12');

	sSpoof.emit('agent:location:update', { agentId, location: { lat: 1, lng: 1 } });
	await sleep(300);
	const spoofed = evAdminAgentLoc.filter(e => e.p.location.lat === 1).length;
	sAgent.emit('agent:location:update', { agentId, location: { lat: 23.811, lng: 90.413 } });
	await sleep(400);
	record('T51', 'Real-time', 'Spoofed agent location ignored; genuine agent location delivered to admin and owner only', 'spoofed=0; admin>0, owner>0, other=0',
		`spoofed=${spoofed}, admin=${evAdminAgentLoc.length}, owner=${evOwnerAgentLoc.length}, other=${evOtherAgentLoc.length}`,
		spoofed === 0 && evAdminAgentLoc.length > 0 && evOwnerAgentLoc.length > 0 && evOtherAgentLoc.length === 0, 'FR-12, NFR-Security');

	r = await agent.post(`/api/parcels/${p1._id}/status`, { status: 'Delivered' });
	record('T52', 'Lifecycle', 'Agent marks parcel Delivered', '200 Delivered', `${r.status} ${r.data.status}`, r.status === 200 && r.data.status === 'Delivered', 'FR-11');
	r = await admin.post(`/api/parcels/${p1._id}/status`, { status: 'Failed' });
	const loc = await agent.post(`/api/parcels/${p1._id}/location`, { lat: 23.8, lng: 90.4 });
	record('T53', 'Lifecycle', 'Delivered parcel is locked (even for admin) and accepts no location', '400 / 400', `${r.status} / ${loc.status}`, r.status === 400 && loc.status === 400, 'FR-11');
	r = await c1.get(`/api/parcels/${p1._id}`);
	const hist = (r.data.statusHistory || []).map(e => e.status).join(' > ');
	record('T54', 'Lifecycle', 'Status history records every transition with actor role', 'Pending > Assigned > Picked Up > In Transit > Delivered',
		hist, hist === 'Pending > Assigned > Picked Up > In Transit > Delivered' && r.data.statusHistory.every(e => e.role), 'FR-13');

	await admin.post(`/api/parcels/${p2._id}/assign`, { agentId });
	r = await agent.post(`/api/parcels/${p2._id}/status`, { status: 'Failed' });
	record('T55', 'Lifecycle', 'Agent can mark an active parcel Failed', '200 Failed', `${r.status} ${r.data.status}`, r.status === 200 && r.data.status === 'Failed', 'FR-11');
	await admin.post(`/api/parcels/${p3._id}/assign`, { agentId: agent2Id });
	r = await agent2.post(`/api/parcels/${p3._id}/status`, { status: 'Delivered' });
	record('T56', 'Lifecycle', 'Observed behaviour: agent can skip forward from Assigned directly to Delivered', 'documented behaviour (forward skip allowed)', `${r.status} ${r.data.status}`, r.status === 200, 'FR-11 (finding)');

	// ---------- Analytics ----------
	r = await admin.get('/api/analytics/dashboard');
	record('T57', 'Analytics', 'Dashboard metrics reflect test data', 'dailyBookings=3, failedDeliveries=1, codAmount=2000',
		JSON.stringify(r.data), r.status === 200 && r.data.dailyBookings === 3 && r.data.failedDeliveries === 1 && r.data.codAmount === 2000, 'FR-14');
	r = await c1.get('/api/analytics/dashboard');
	record('T58', 'Access control', 'Customer cannot access analytics', '403', r.status, r.status === 403, 'FR-04, FR-14');
	r = await admin.req('GET', '/api/analytics/export/csv', { raw: true });
	const csvLines = r.data.toString('utf8').trim().split('\n');
	record('T59', 'Reports', 'CSV export returns header and one row per parcel', 'text/csv, 1 header + 3 rows',
		`${r.headers.get('content-type')}, lines=${csvLines.length}`, r.status === 200 && /text\/csv/.test(r.headers.get('content-type')) && csvLines.length === 4, 'FR-15');
	r = await admin.req('GET', '/api/analytics/export/pdf', { raw: true });
	record('T60', 'Reports', 'PDF export returns a PDF document', 'application/pdf, starts with %PDF',
		`${r.headers.get('content-type')}, magic=${r.data.slice(0, 4).toString()}`, r.status === 200 && r.data.slice(0, 4).toString() === '%PDF', 'FR-15');

	// ---------- Account administration ----------
	r = await admin.get('/api/users/me');
	const adminId = r.data._id;
	r = await admin.patch(`/api/users/${adminId}/status`, { isActive: false });
	record('T61', 'Users', 'Admin cannot disable own account', '400', r.status, r.status === 400, 'FR-05');
	const c2Id = (await c2.get('/api/users/me')).data._id;
	r = await admin.patch(`/api/users/${c2Id}/status`, { isActive: false });
	const reuse = await c2.get('/api/parcels');
	const relog = await anon.post('/api/auth/login', { email: 'c2@test.local', password: 'Passw0rd99' });
	record('T62', 'Users', 'Disabling an account revokes existing tokens and blocks sign-in', '200; old token 401 TOKEN_REVOKED; login 403 ACCOUNT_DISABLED',
		`${r.status}; ${reuse.status} ${reuse.data.code}; ${relog.status} ${relog.data.code}`,
		r.status === 200 && reuse.status === 401 && reuse.data.code === 'TOKEN_REVOKED' && relog.status === 403 && relog.data.code === 'ACCOUNT_DISABLED', 'FR-05, NFR-Security');

	// ---------- Injection ----------
	r = await anon.post('/api/auth/login', { email: { $ne: null }, password: { $ne: null } });
	record('T63', 'Security', 'NoSQL operator injection in login is neutralised', '400 (no session issued)', `${r.status} ${r.data.code}`, r.status === 400 && !r.data.accessToken, 'NFR-Security');
	r = await admin.del(`/api/parcels/${p2._id}`);
	const gone = await admin.get(`/api/parcels/${p2._id}`);
	record('T64', 'Parcels', 'Admin deletes a parcel', '200 then 404', `${r.status} then ${gone.status}`, r.status === 200 && gone.status === 404, 'FR-16');

	// ---------- Performance (local, sequential) ----------
	const lat = { health: [], track: [], list: [] };
	for (let i = 0; i < 200; i++) lat.health.push((await anon.get('/health')).ms);
	for (let i = 0; i < 100; i++) lat.track.push((await anon.get(`/api/parcels/track/${p1.trackingCode}`)).ms);
	for (let i = 0; i < 100; i++) lat.list.push((await admin.get('/api/parcels')).ms);
	perf.httpLatencyMs = { 'GET /health': stats(lat.health), 'GET /api/parcels/track/:code (public)': stats(lat.track), 'GET /api/parcels (admin, 2 parcels)': stats(lat.list) };

	// Socket propagation: agent emits own location -> admin socket receives
	const prop = [];
	for (let i = 0; i < 50; i++) {
		const lat0 = 23.7 + i * 0.001;
		const got = new Promise(res => {
			const h = (d) => { if (Math.abs(d.location.lat - lat0) < 1e-9) { sAdmin.off('agent:location:update', h); res(); } };
			sAdmin.on('agent:location:update', h);
		});
		const t0 = process.hrtime.bigint();
		sAgent.emit('agent:location:update', { agentId, location: { lat: lat0, lng: 90.4 } });
		await got;
		prop.push(Number(process.hrtime.bigint() - t0) / 1e6);
		await sleep(20);
	}
	perf.socketAgentLocationToAdminMs = stats(prop);

	// Status change: HTTP request issued -> owner socket receives parcel:update
	const p4 = (await c1.post('/api/parcels', { ...parcelBody, deliveryAddress: 'Gulshan 1, Dhaka' })).data;
	await admin.post(`/api/parcels/${p4._id}/assign`, { agentId });
	const statusProp = [];
	for (const st of ['Picked Up', 'In Transit', 'Delivered']) {
		const got = new Promise(res => { const h = (d) => { if (d.id === p4._id && d.status === st) { sOwner.off('parcel:update', h); res(); } }; sOwner.on('parcel:update', h); });
		const t0 = process.hrtime.bigint();
		await agent.post(`/api/parcels/${p4._id}/status`, { status: st });
		await got;
		statusProp.push(Number(process.hrtime.bigint() - t0) / 1e6);
	}
	perf.statusChangeToOwnerSocketMs = { samples: statusProp.map(v => +v.toFixed(2)) };
	[sAdmin, sOwner, sOther, sPublic, sGuess, sAgent, sSpoof].forEach(s => s.close());

	// ---------- Rate limiting and enumeration (last: consumes the email budget) ----------
	const f1 = await anon.post('/api/auth/forgot-password', { email: 'c1@test.local' });
	const f2 = await anon.post('/api/auth/forgot-password', { email: 'ghost@test.local' });
	record('T65', 'Security', 'Forgot-password response identical for existing and unknown email', 'same 200 message', `${f1.status}/${f2.status} same=${f1.data.message === f2.data.message}`,
		f1.status === 200 && f2.status === 200 && f1.data.message === f2.data.message, 'FR-17, NFR-Security');
	let last;
	for (let i = 0; i < 4; i++) last = await anon.post('/api/auth/forgot-password', { email: `ghost${i}@test.local` });
	record('T66', 'Security', 'Email-sending endpoint rate-limited (6th request in 15 min)', '429 RATE_LIMITED', `${last.status} ${last.data.code}`, last.status === 429, 'NFR-Security');
}

main().catch(err => { console.error(err); process.exitCode = 1; });
