/*
 * Captures genuine screenshots of the running SCPMS application for the thesis.
 *
 * The unmodified backend and the Vite dev server are started locally against a
 * throw-away in-memory MongoDB that is filled with demonstration data through the
 * public API (no production data, no backend/.env, no real email). Headless Chrome
 * (puppeteer-core) then visits each page. The browser's geolocation is set to a
 * fixed point in Dhaka so that the agent pages can share a location; this is a
 * simulated device position and is stated as such in the figure captions.
 *
 * Usage:
 *   TEST_DEPS=<dir with mongodb-memory-server, puppeteer-core> CHROME=<chrome.exe> \
 *   node capture-screenshots.cjs <repo-root> <output-dir>
 */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const depsDir = process.env.TEST_DEPS || __dirname;
const need = (m) => require(require.resolve(m, { paths: [depsDir] }));
const { MongoMemoryServer } = need('mongodb-memory-server');
const puppeteer = need('puppeteer-core');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '../../..'));
const OUT = path.resolve(process.argv[3] || __dirname);
const API_PORT = 5056;
const API = `http://127.0.0.1:${API_PORT}`;
const WEB = 'http://localhost:5173';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let log = '';

async function waitFor(fn, ms = 30000) {
	const end = Date.now() + ms;
	while (Date.now() < end) { const v = await fn(); if (v) return v; await sleep(200); }
	return null;
}
function lastMatch(re) { const m = [...log.matchAll(re)]; return m.length ? m[m.length - 1][1] : null; }

async function call(method, url, body, token) {
	const res = await fetch(API + url, {
		method,
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: body ? JSON.stringify(body) : undefined
	});
	const text = await res.text();
	try { return JSON.parse(text); } catch { return text; }
}

async function main() {
	fs.mkdirSync(OUT, { recursive: true });
	const work = fs.mkdtempSync(path.join(os.tmpdir(), 'scpms-shots-'));
	const mongo = await MongoMemoryServer.create();
	const env = { ...process.env };
	for (const k of Object.keys(env)) if (/^(MAIL_|SMTP_|MONGODB_|JWT_|CLIENT_ORIGIN|APP_URL|SEED_|VITE_)/.test(k)) delete env[k];
	Object.assign(env, {
		NODE_ENV: 'development', PORT: String(API_PORT), MONGODB_URI: mongo.getUri('scpms_demo'),
		JWT_SECRET: crypto.randomBytes(48).toString('base64url'), CLIENT_ORIGIN: WEB,
		EMAIL_VERIFICATION: 'required', TRUST_PROXY_HOPS: '0',
		SEED_ADMIN_PASSWORD: 'Admin12345demo', SEED_AGENT_PASSWORD: 'Agent12345demo'
	});
	spawnSync(process.execPath, [path.join(ROOT, 'backend/scripts/seed.js')], { cwd: work, env, encoding: 'utf8' });
	const api = spawn(process.execPath, [path.join(ROOT, 'backend/src/index.js')], { cwd: work, env });
	api.stdout.on('data', d => { log += d; }); api.stderr.on('data', d => { log += d; });
	await waitFor(() => /Server running/.test(log));

	const webEnv = { ...env, VITE_DEV_API_TARGET: API, VITE_SOCKET_URL: API };
	const viteBin = path.join(ROOT, 'node_modules/vite/bin/vite.js');
	const web = spawn(process.execPath, [viteBin, '--port', '5173', '--strictPort'], { cwd: path.join(ROOT, 'frontend'), env: webEnv });
	let webLog = ''; web.stdout.on('data', d => { webLog += d; }); web.stderr.on('data', d => { webLog += d; });
	await waitFor(() => /ready in|Local:/.test(webLog), 60000);

	// ----- demonstration data through the public API -----
	const admin = (await call('POST', '/api/auth/login', { email: 'admin@example.com', password: 'Admin12345demo' })).accessToken;
	const agent = await call('POST', '/api/auth/login', { email: 'agent1@example.com', password: 'Agent12345demo' });
	await call('POST', '/api/auth/register', { name: 'Demo Customer', email: 'customer@example.com', phone: '01712345678', password: 'Customer123', acceptTerms: true });
	const code = await waitFor(() => lastMatch(/Verification code: (\d{6})/g));
	const cust = await call('POST', '/api/auth/verify-email', { email: 'customer@example.com', code });
	await call('POST', '/api/users/agents', { name: 'Rahim Uddin', email: 'rahim.agent@example.com', phone: '01812345678' }, admin);

	const mk = (b) => call('POST', '/api/parcels', { parcelSize: 'Small', parcelType: 'Standard', paymentType: 'COD', codAmount: 1500, ...b }, cust.accessToken);
	const pA = await mk({ pickupAddress: 'Uttara Sector 7, Dhaka', deliveryAddress: 'Mirpur 10, Dhaka', parcelType: 'Document', codAmount: 1200 });
	const pB = await mk({ pickupAddress: 'Banani, Dhaka', deliveryAddress: 'Dhanmondi 27, Dhaka', paymentType: 'Prepaid', parcelSize: 'Medium', parcelType: 'Fragile' });
	const pC = await mk({ pickupAddress: 'Gulshan 1, Dhaka', deliveryAddress: 'Motijheel, Dhaka', codAmount: 2500 });
	const pD = await mk({ pickupAddress: 'Bashundhara R/A, Dhaka', deliveryAddress: 'Mohakhali, Dhaka', codAmount: 900 });
	await mk({ pickupAddress: 'Farmgate, Dhaka', deliveryAddress: 'Badda, Dhaka', parcelSize: 'Large' });
	const agentId = agent.user._id;
	for (const p of [pA, pB, pC, pD]) await call('POST', `/api/parcels/${p._id}/assign`, { agentId }, admin);
	for (const s of ['Picked Up', 'In Transit']) await call('POST', `/api/parcels/${pA._id}/status`, { status: s }, agent.accessToken);
	await call('POST', `/api/parcels/${pA._id}/location`, { lat: 23.8223, lng: 90.3654, etaMinutes: 18 }, agent.accessToken);
	for (const s of ['Picked Up', 'In Transit', 'Delivered']) await call('POST', `/api/parcels/${pC._id}/status`, { status: s }, agent.accessToken);
	await call('POST', `/api/parcels/${pD._id}/status`, { status: 'Failed' }, agent.accessToken);

	// ----- browser -----
	const browser = await puppeteer.launch({
		executablePath: process.env.CHROME, headless: true,
		args: ['--window-size=1440,900', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
	});
	const ctx = browser.defaultBrowserContext();
	await ctx.overridePermissions(WEB, ['geolocation', 'camera']);
	const shots = [];

	async function session(email, password, lang = 'en') {
		const page = await browser.newPage();
		await page.setViewport({ width: 1440, height: 900 });
		await page.setGeolocation({ latitude: 23.8223, longitude: 90.3654 });
		await page.goto(WEB + '/', { waitUntil: 'networkidle2' });
		await page.evaluate((l) => localStorage.setItem('language', l), lang);
		if (email) {
			await page.evaluate(async (e, p) => {
				await fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify({ email: e, password: p }) });
			}, email, password);
		}
		return page;
	}
	async function shot(page, url, file, { full = false, wait = 2500 } = {}) {
		await page.goto(WEB + url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
		await sleep(wait);
		await page.screenshot({ path: path.join(OUT, file), fullPage: full });
		shots.push({ file, url });
		console.log('captured', file, url);
	}

	const guest = await session(null);
	await shot(guest, '/', 'landing.png');
	await shot(guest, '/login', 'login.png');
	await shot(guest, '/register', 'register.png');
	await shot(guest, `/track-parcel?code=${pA.trackingCode}`, 'public-tracking.png', { wait: 6000 });
	const guestBn = await session(null, null, 'bn');
	await shot(guestBn, '/', 'landing-bn.png');

	const c = await session('customer@example.com', 'Customer123');
	await shot(c, '/app', 'customer-dashboard.png');
	await shot(c, `/customer/parcel/qr/${pB._id}`, 'customer-qr.png');
	await shot(c, `/customer/parcel/${pA._id}`, 'customer-parcel-detail.png', { wait: 6000 });

	// The agent dashboard stays open in its own tab so that it keeps sharing the
	// (simulated) device location while the admin tracking page is captured.
	const g = await session('agent1@example.com', 'Agent12345demo');
	await shot(g, '/agent', 'agent-dashboard.png', { wait: 5000 });

	const a = await session('admin@example.com', 'Admin12345demo');
	await shot(a, '/admin', 'admin-dashboard.png', { full: true });
	await shot(a, '/admin/tracking', 'admin-agent-tracking.png', { wait: 3000 });
	await a.select('select', agentId).catch(() => {});
	await sleep(6000);
	await a.screenshot({ path: path.join(OUT, 'admin-agent-tracking.png'), fullPage: true });

	const g2 = await session('agent1@example.com', 'Agent12345demo');
	await shot(g2, `/parcel/${pA._id}`, 'agent-parcel-view.png', { wait: 6000 });
	await shot(g2, `/agent/parcel/${pB._id}/pickup-confirm`, 'agent-pickup-confirm.png');

	await browser.close();
	web.kill(); api.kill(); await mongo.stop();
	fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ captured: new Date().toISOString(), viewport: '1440x900', note: 'Local run against in-memory MongoDB with demonstration data; agent geolocation fixed at 23.8223, 90.3654 (simulated).', shots }, null, 2));
}

main().catch(e => { console.error(e); console.error(log.slice(-2000)); process.exit(1); });
