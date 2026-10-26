// SCPMS final defense deck — styled after "UU_FYP_Defense_Final 3.pptx"
// (Arial, Uttara blue, kicker + title, footer with logo and page counter).
// All content comes from the verified thesis report.
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const ROOT = "P:/Suppriya Defense-20261011T165740Z-1-001/Suppriya Defense";
const REPO = ROOT + "/SmartCourier/SmartCourier";
const SHOT = REPO + "/report/evidence/screenshots/";
const DIAG = REPO + "/report/figures/export/out/";
const LOGO_COLOR = process.env.REFX + "/ppt/media/image1.png";
const LOGO_WHITE = process.env.REFX + "/ppt/media/image2.png";
const OUT = process.env.DECK_OUT || ROOT + "/SCPMS_Final_Defense_Slides.pptx";

const THEME = {
  name: "SCPMS Defense",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "10101B", lt1: "FFFFFF", dk2: "4A4A5C", lt2: "F4F5FB",
    accent1: "1200FF", accent2: "059669", accent3: "7C3AED", accent4: "D97706",
    accent5: "0891B2", accent6: "DC2626", hlink: "1200FF", folHlink: "7C3AED",
  },
};
const HEX = { blue: "1200FF", ink: "10101B", muted: "4A4A5C", line: "E1E3F0", soft: "F4F5FB",
  green: "059669", purple: "7C3AED", amber: "D97706", cyan: "0891B2", red: "DC2626" };
const TOTAL = 19;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.title = "Design and Implementation of a Smart Courier and Parcel Management System";
pres.author = "Sharmin Khatun, Tasnim Jahan Mim";
pres.subject = "B.Sc. thesis defense, Department of CSE, Uttara University";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
// Speaker notes come from the shared two-presenter script (script.js)
// SCRIPT_FILE=./script_bn.js builds the same deck with Bangla speaker notes
const SCRIPT = require(process.env.SCRIPT_FILE || "./script.js");
const ALL_SLIDES = [];
const _addSlide = pres.addSlide.bind(pres);
pres.addSlide = (o) => { const sl = _addSlide(o); ALL_SLIDES.push(sl); return sl; };

// ---------------- helpers ----------------
async function icon(Icon, hex, size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Icon, { color: "#" + hex, size }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
const shadow = () => ({ type: "outer", color: "000000", opacity: 0.12, blur: 8, offset: 2, angle: 90 });
function card(slide, x, y, w, h, name, fill = C.background1, line = HEX.line) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill },
    line: { color: line, width: 0.75 }, shadow: shadow(), objectName: name });
}
async function iconBadge(slide, Icon, x, y, d, fillHex, name) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fillHex }, line: { color: fillHex }, objectName: name + " circle" });
  slide.addImage({ data: await icon(Icon, "FFFFFF"), x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, objectName: name + " icon", altText: name });
}
function content(section, kicker, title) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(kicker, { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  return s;
}
function txt(slide, text, o) { slide.addText(text, { isTextBox: true, fontFace: "Arial", color: C.text1, margin: 0, valign: "top", ...o }); }

// ---------------- layouts ----------------
pres.defineSlideMaster({
  title: "TITLE_BLUE",
  background: { color: HEX.blue },
  objects: [
    { ellipse: { x: 10.4, y: -1.6, w: 4.4, h: 4.4, fill: { color: "FFFFFF", transparency: 92 }, line: { color: "FFFFFF", transparency: 100 } } },
    { ellipse: { x: -1.2, y: 5.6, w: 3.0, h: 3.0, fill: { color: "FFFFFF", transparency: 93 }, line: { color: "FFFFFF", transparency: 100 } } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: "FFFFFF" },
  margin: [0.5, 0.6, 0.7, 0.6],
  objects: [
    { image: { path: LOGO_COLOR, x: 0.6, y: 6.93, w: 0.62, h: 0.34 } },
    { text: { text: "Department of CSE · Uttara University", options: { x: 1.32, y: 6.93, w: 5, h: 0.34, fontFace: "Arial", fontSize: 10, color: HEX.muted, valign: "middle", margin: 0 } } },
    { text: { text: "/ " + TOTAL, options: { x: 12.36, y: 6.93, w: 0.45, h: 0.34, fontFace: "Arial", fontSize: 10, color: HEX.muted, valign: "top", margin: 0 } } },
    { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.42, w: 10, h: 0.3, fontFace: "Arial", fontSize: 11, bold: true, color: HEX.blue, charSpacing: 2, margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.74, w: 12.1, h: 0.72, fontFace: "Arial", fontSize: 30, bold: true, color: HEX.ink, margin: 0, valign: "top", align: "left" }, text: "" } },
  ],
  slideNumber: { x: 11.86, y: 6.93, w: 0.45, h: 0.34, fontFace: "Arial", fontSize: 10, color: HEX.muted, align: "right", valign: "top", margin: 0 },
});

(async () => {
  // ================= 1. TITLE =================
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "TITLE_BLUE", sectionTitle: "Opening" });
  s.addImage({ path: LOGO_WHITE, x: 0.8, y: 0.6, w: 2.3, h: 1.27, objectName: "Uttara University logo", altText: "Uttara University logo" });
  txt(s, "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING  ·  UTTARA UNIVERSITY", { x: 0.8, y: 2.3, w: 11, h: 0.3, fontSize: 11, bold: true, color: "FFFFFF", charSpacing: 2 });
  txt(s, "Smart Courier and Parcel Management System", { x: 0.8, y: 2.7, w: 11.5, h: 1.3, fontSize: 40, bold: true, color: "FFFFFF" });
  txt(s, "Design, implementation and evaluation of a secure, real-time parcel tracking platform", { x: 0.8, y: 4.3, w: 11, h: 0.45, fontSize: 18, color: "FFFFFF", transparency: 10 });
  txt(s, [
    { text: "PRESENTED BY", options: { fontSize: 10, bold: true, color: "FFFFFF", charSpacing: 2, breakLine: true } },
    { text: "Sharmin Khatun", options: { fontSize: 15, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "ID: 2223081010", options: { fontSize: 12, color: "FFFFFF" } },
  ], { x: 0.8, y: 5.35, w: 3.0, h: 1.1 });
  txt(s, [
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "Tasnim Jahan Mim", options: { fontSize: 15, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "ID: 2221081138", options: { fontSize: 12, color: "FFFFFF" } },
  ], { x: 3.9, y: 5.35, w: 3.0, h: 1.1 });
  txt(s, [
    { text: "SUPERVISED BY", options: { fontSize: 10, bold: true, color: "FFFFFF", charSpacing: 2, breakLine: true } },
    { text: "Dr. Md. Obaidur Rahaman", options: { fontSize: 15, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "Professor, Dept. of CSE", options: { fontSize: 12, color: "FFFFFF" } },
  ], { x: 7.3, y: 5.35, w: 3.3, h: 1.1 });
  txt(s, [
    { text: "B.Sc. Thesis Defense", options: { fontSize: 12, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "27 October 2026", options: { fontSize: 12, color: "FFFFFF" } },
  ], { x: 10.7, y: 5.6, w: 1.9, h: 0.7, align: "right" });
  // ================= 2. OUTLINE =================
  s = content("Opening", "PRESENTATION OUTLINE", "What We Will Cover");
  const outline = ["Introduction & Background", "Problem Statement", "Objectives", "Literature Review", "Methodology",
    "Requirements & Design", "Implementation", "Testing & Evaluation", "Findings & Limitations", "Conclusion & Future Work"];
  outline.forEach((t, i) => {
    const col = i < 5 ? 0 : 1, row = i % 5;
    const x = 0.6 + col * 6.2, y = 1.95 + row * 0.9;
    card(s, x, y, 5.9, 0.7, "Outline item " + (i + 1), i % 2 === 0 ? C.background2 : C.background1);
    txt(s, String(i + 1).padStart(2, "0"), { x: x + 0.25, y: y + 0.15, w: 0.6, h: 0.4, fontSize: 18, bold: true, color: C.accent1, valign: "middle" });
    txt(s, t, { x: x + 0.95, y: y + 0.15, w: 4.8, h: 0.4, fontSize: 16, bold: true, valign: "middle" });
  });
  // ================= 3. INTRODUCTION =================
  pres.addSection({ title: "Context" });
  s = content("Context", "01 — INTRODUCTION", "Introduction & Background");
  const intro = [
    [fa.FaTruckFast, HEX.blue, "The last mile is costly", "Reviews describe last-mile delivery as the least efficient stage, up to 28% of delivery cost [1], [2]."],
    [fa.FaPhoneVolume, HEX.amber, "Small couriers coordinate by hand", "Phone calls, paper and chat leave every party with a partial, late picture of each parcel."],
    [fa.FaLayerGroup, HEX.green, "Our system: SCPMS", "One shared, role-controlled parcel record with live updates, built on MongoDB, Express, React, Node.js and Socket.IO."],
  ];
  for (let i = 0; i < intro.length; i++) {
    const [I, col, h, b] = intro[i], y = 1.85 + i * 1.5;
    await iconBadge(s, I, 0.6, y, 0.75, col, "Intro point " + (i + 1));
    txt(s, h, { x: 1.6, y: y - 0.02, w: 5.2, h: 0.4, fontSize: 18, bold: true });
    txt(s, b, { x: 1.6, y: y + 0.42, w: 5.2, h: 0.85, fontSize: 14, color: C.text2 });
  }
  s.addImage({ path: SHOT + "landing.png", x: 7.2, y: 1.85, w: 5.5, h: 3.44, objectName: "Landing page screenshot", altText: "SCPMS landing page", shadow: shadow() });
  txt(s, "SCPMS landing page with public tracking (running system)", { x: 7.2, y: 5.4, w: 5.5, h: 0.3, fontSize: 11, color: C.text2, italic: true, align: "center" });
  // ================= 4. PROBLEM =================
  s = content("Context", "02 — PROBLEM STATEMENT", "The Problem We Address");
  card(s, 0.6, 1.75, 12.1, 0.95, "Problem statement banner", C.background2, HEX.line);
  txt(s, "Manual or fragmented courier coordination gives customers no live visibility, leaves responsibility unclear, keeps no trustworthy record of status changes and gives administrators little insight.",
    { x: 0.9, y: 1.85, w: 11.5, h: 0.75, fontSize: 16, bold: true, valign: "middle" });
  const probs = [
    [fa.FaEye, HEX.blue, "Visibility", "Customers cannot see a parcel's status or position without calling."],
    [fa.FaUserCheck, HEX.green, "Responsibility", "Who holds which parcel, and who may change it, is informal."],
    [fa.FaClipboardList, HEX.purple, "Accountability", "Status changes are not recorded with the actor and time."],
    [fa.FaChartColumn, HEX.amber, "Insight", "No booking, failure or cash-on-delivery indicators or exports."],
  ];
  for (let i = 0; i < probs.length; i++) {
    const [I, col, h, b] = probs[i], x = 0.6 + i * 3.1;
    card(s, x, 3.0, 2.85, 2.55, "Problem card " + h);
    await iconBadge(s, I, x + 0.3, 3.25, 0.7, col, "Problem " + h);
    txt(s, h, { x: x + 0.3, y: 4.1, w: 2.3, h: 0.4, fontSize: 17, bold: true });
    txt(s, b, { x: x + 0.3, y: 4.5, w: 2.3, h: 0.95, fontSize: 13, color: C.text2 });
  }
  txt(s, [{ text: "And it must be secure: ", options: { bold: true, color: C.accent6 } },
    { text: "it holds personal data, so each role may only see and change what it is allowed to." }],
    { x: 0.6, y: 5.85, w: 12.1, h: 0.5, fontSize: 14 });
  // ================= 5. OBJECTIVES =================
  s = content("Context", "03 — OBJECTIVES", "Aim and Objectives");
  txt(s, [{ text: "Aim: ", options: { bold: true, color: C.accent1 } },
    { text: "design, implement and evaluate a secure, role-based web system that manages the parcel lifecycle and gives authorised users real-time visibility." }],
    { x: 0.6, y: 1.65, w: 12.1, h: 0.6, fontSize: 15 });
  const objs = [
    ["O1", "Secure registration, sign-in and sessions for three roles"],
    ["O2", "Role- and ownership-based access control on every operation"],
    ["O3", "Server-enforced parcel lifecycle with an audit trail"],
    ["O4", "Real-time updates to authorised watchers, public tracking by code"],
    ["O5", "QR-assisted pickup and map-based route display"],
    ["O6", "Admin indicators, user management and CSV/PDF export"],
  ];
  objs.forEach(([id, t], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 0.6 + col * 4.1, y = 2.5 + row * 1.95;
    card(s, x, y, 3.85, 1.7, "Objective " + id, row === 0 ? C.background1 : C.background2);
    txt(s, id, { x: x + 0.3, y: y + 0.25, w: 1, h: 0.45, fontSize: 22, bold: true, color: C.accent1 });
    txt(s, t, { x: x + 0.3, y: y + 0.75, w: 3.3, h: 0.8, fontSize: 14, bold: true });
  });
  // ================= 6. LITERATURE =================
  s = content("Context", "04 — LITERATURE REVIEW", "Related Work and the Gap");
  const head = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.blue }, fontSize: 13 } });
  const row = (a, b, c) => [{ text: a, options: { bold: true } }, { text: b }, { text: c }];
  s.addTable([
    [head("Category"), head("What it offers"), head("Limitation for a small courier")],
    row("Last-mile & city-logistics research [1]–[4]", "Routing, scheduling and network models", "Assumes order and position data already exist"),
    row("Visibility, tracking & e-POD [5], [6]", "Track forward, trace history; electronic proof of delivery", "Concepts and frameworks, not a deployable system"),
    row("Proprietary carrier platforms", "Large-scale booking and tracking", "Closed, unpublished, not self-hostable"),
    row("Web courier management apps, e.g. [7]", "Booking, status pages, role separation", "Refresh-based updates; little security design or measured evaluation"),
  ], { x: 0.6, y: 1.7, w: 12.1, colW: [3.4, 4.1, 4.6], fontFace: "Arial", fontSize: 13, color: HEX.ink,
    border: { type: "solid", pt: 0.75, color: HEX.line }, fill: { color: "FFFFFF" }, valign: "middle", rowH: [0.45, 0.62, 0.62, 0.62, 0.62], margin: 0.08 });
  card(s, 0.6, 5.0, 12.1, 1.3, "Gap callout", C.background2);
  await iconBadge(s, fa.FaLightbulb, 0.85, 5.25, 0.8, HEX.blue, "Gap");
  txt(s, [{ text: "Gap: ", options: { bold: true, color: C.accent1 } },
    { text: "a small operator needs a self-hostable system that combines role-based coordination, a server-enforced lifecycle with audit trail, push-based live tracking and privacy-preserving public tracking, with documented security and test evidence." }],
    { x: 1.9, y: 5.2, w: 10.6, h: 0.95, fontSize: 14, valign: "middle" });
  // ================= 7. METHODOLOGY =================
  pres.addSection({ title: "Approach" });
  s = content("Approach", "05 — METHODOLOGY", "Iterative and Incremental Development");
  const phases = [
    ["Plan", "Apr–May", "Problem, roles, lifecycle states"],
    ["Design", "May", "Data model, wireframes, MERN + Socket.IO"],
    ["Core build", "May–Jul", "Auth, booking, lifecycle, live tracking, QR"],
    ["Extend", "Jul–Oct", "E-mail, analytics, Bangla UI, deployment"],
    ["Harden", "Jul & Oct", "Two security-review rounds"],
    ["Evaluate", "Oct", "66 tests, static analysis, screenshots"],
  ];
  for (let i = 0; i < phases.length; i++) {
    const [h, when, b] = phases[i], x = 0.6 + i * 2.05;
    card(s, x, 2.0, 1.85, 2.9, "Phase " + h, i === 5 ? C.background2 : C.background1);
    s.addShape(pres.shapes.OVAL, { x: x + 0.62, y: 2.2, w: 0.6, h: 0.6, fill: { color: HEX.blue }, line: { color: HEX.blue }, objectName: "Phase number " + (i + 1) });
    txt(s, String(i + 1), { x: x + 0.62, y: 2.2, w: 0.6, h: 0.6, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, h, { x: x + 0.12, y: 2.95, w: 1.61, h: 0.4, fontSize: 15, bold: true, align: "center" });
    txt(s, when + " 2026", { x: x + 0.12, y: 3.35, w: 1.61, h: 0.3, fontSize: 11, color: C.accent1, bold: true, align: "center" });
    txt(s, b, { x: x + 0.15, y: 3.75, w: 1.55, h: 1.05, fontSize: 12, color: C.text2, align: "center" });
    if (i < 5) txt(s, "→", { x: x + 1.83, y: 3.2, w: 0.25, h: 0.4, fontSize: 16, bold: true, color: C.accent1, align: "center" });
  }
  card(s, 0.6, 5.25, 12.1, 1.15, "Evaluation approach", C.background2);
  await iconBadge(s, fa.FaFlask, 0.85, 5.43, 0.8, HEX.green, "Evaluation");
  txt(s, [{ text: "Evaluation: ", options: { bold: true, color: C.accent2 } },
    { text: "black-box API and Socket.IO tests on the unmodified backend with an in-memory database, plus lint, build and dependency audit. Usability, load and field tests were not performed." }],
    { x: 1.9, y: 5.35, w: 10.6, h: 0.95, fontSize: 14, valign: "middle" });
  // ================= 8. REQUIREMENTS & ROLES =================
  s = content("Approach", "06 — REQUIREMENTS & DESIGN", "Three Roles, One Shared Parcel Record");
  const roles = [
    [fa.FaUser, HEX.blue, "Customer", "Self-registers with e-mail verification, books parcels, sees own parcels, shows QR, follows the map"],
    [fa.FaMotorcycle, HEX.green, "Delivery agent", "Created by admin invitation, scans QR at pickup, moves parcels forward, shares live location"],
    [fa.FaUserShield, HEX.purple, "Administrator", "Assigns agents, manages accounts, corrects status, views indicators, exports CSV/PDF"],
    [fa.FaGlobe, HEX.amber, "Public viewer", "Enters a tracking code and sees a reduced view with no personal data"],
  ];
  for (let i = 0; i < roles.length; i++) {
    const [I, col, h, b] = roles[i], y = 1.75 + i * 1.2;
    card(s, 0.6, y, 8.2, 1.05, "Role " + h);
    await iconBadge(s, I, 0.8, y + 0.17, 0.7, col, "Role " + h);
    txt(s, h, { x: 1.75, y: y + 0.12, w: 6.8, h: 0.35, fontSize: 16, bold: true });
    txt(s, b, { x: 1.75, y: y + 0.47, w: 6.85, h: 0.5, fontSize: 13, color: C.text2 });
  }
  const stats = [["21", "functional requirements", HEX.blue], ["7", "non-functional requirements (ISO/IEC 25010)", HEX.purple], ["3", "MongoDB collections: User, Parcel, Session", HEX.green]];
  stats.forEach(([n, l, col], i) => {
    const y = 1.75 + i * 1.6;
    card(s, 9.2, y, 3.5, 1.4, "Stat " + l, C.background2);
    txt(s, n, { x: 9.45, y: y + 0.1, w: 3.1, h: 0.75, fontSize: 40, bold: true, color: col });
    txt(s, l, { x: 9.45, y: y + 0.85, w: 3.1, h: 0.45, fontSize: 12, color: C.text2 });
  });
  // ================= 9. ARCHITECTURE =================
  s = content("Approach", "06 — REQUIREMENTS & DESIGN", "System Architecture");
  s.addImage({ path: DIAG + "architecture.png", x: 0.6, y: 1.6, w: 7.9, h: 5.15, objectName: "Layered architecture diagram", altText: "Layered architecture: client, edge proxy, Node.js server, MongoDB" });
  const arch = [
    [fa.FaDesktop, HEX.blue, "React single-page app", "Role pages, route guards, in-memory token"],
    [fa.FaServer, HEX.purple, "One Node.js process", "Express REST API and Socket.IO together"],
    [fa.FaShieldHalved, HEX.red, "Fixed middleware chain", "Headers, CORS, sanitiser, rate limits, guards"],
    [fa.FaDatabase, HEX.green, "MongoDB via Mongoose", "Users, parcels with embedded history, sessions"],
  ];
  for (let i = 0; i < arch.length; i++) {
    const [I, col, h, b] = arch[i], y = 1.75 + i * 1.22;
    await iconBadge(s, I, 8.85, y, 0.62, col, "Architecture " + h);
    txt(s, h, { x: 9.65, y: y - 0.02, w: 3.1, h: 0.35, fontSize: 15, bold: true });
    txt(s, b, { x: 9.65, y: y + 0.34, w: 3.1, h: 0.7, fontSize: 12, color: C.text2 });
  }
  // ================= 10. LIFECYCLE =================
  s = content("Approach", "06 — REQUIREMENTS & DESIGN", "Server-Enforced Parcel Lifecycle");
  s.addImage({ path: DIAG + "statemachine.png", x: 0.6, y: 1.6, w: 9.0, h: 4.21, objectName: "Parcel lifecycle state machine", altText: "Six-state parcel lifecycle" });
  const rules = [["Explicit responsibility", "Only the assigned agent may change a parcel"], ["Locked final states", "Delivered and Failed cannot change, even by admin"], ["Audit trail", "Every change stores status, time, actor and role"]];
  rules.forEach(([h, b], i) => {
    const y = 1.75 + i * 1.4;
    card(s, 9.9, y, 2.8, 1.2, "Rule " + h, C.background2);
    txt(s, h, { x: 10.1, y: y + 0.12, w: 2.45, h: 0.35, fontSize: 14, bold: true, color: C.accent1 });
    txt(s, b, { x: 10.1, y: y + 0.5, w: 2.45, h: 0.62, fontSize: 12, color: C.text2 });
  });
  txt(s, "Design finding: agents may skip forward (e.g. Assigned → Delivered); tightening this is listed as future work.", { x: 0.6, y: 6.05, w: 12.1, h: 0.4, fontSize: 13, italic: true, color: C.text2 });
  // ================= 11. REAL-TIME & SECURITY =================
  s = content("Approach", "06 — REQUIREMENTS & DESIGN", "Real-Time Scoping and Security Design");
  s.addImage({ path: DIAG + "rooms.png", x: 0.6, y: 1.7, w: 7.4, h: 3.48, objectName: "Socket.IO room scoping diagram", altText: "Socket rooms: role:admin, user, parcel" });
  txt(s, "No event is broadcast to every socket. Anonymous viewers join a parcel room only by proving its tracking code.", { x: 0.6, y: 5.35, w: 7.4, h: 0.7, fontSize: 13, italic: true, color: C.text2 });
  const sec = [
    [fa.FaKey, "Short-lived access token in memory; rotating HttpOnly refresh cookie with reuse detection"],
    [fa.FaUserLock, "Role guards plus ownership checks (no IDOR)"],
    [fa.FaLock, "bcrypt passwords, 5-try lockout, rate limits"],
    [fa.FaFilter, "NoSQL operator stripping; CSRF header check"],
    [fa.FaLocationCrosshairs, "Agent location accepted only from that agent"],
  ];
  for (let i = 0; i < sec.length; i++) {
    const [I, b] = sec[i], y = 1.75 + i * 0.92;
    await iconBadge(s, I, 8.4, y, 0.55, HEX.red, "Security control " + (i + 1));
    txt(s, b, { x: 9.1, y: y + 0.02, w: 3.6, h: 0.75, fontSize: 13, valign: "middle" });
  }
  // ================= 12. IMPLEMENTATION SCREENS =================
  pres.addSection({ title: "Implementation" });
  s = content("Implementation", "07 — IMPLEMENTATION", "The Running System");
  const shots = [["customer-dashboard.png", "Customer dashboard: booking and parcel list"], ["admin-dashboard.png", "Admin dashboard: indicators, users, assignment, export"],
    ["agent-dashboard.png", "Agent dashboard: assigned parcels and live map"], ["public-tracking.png", "Public tracking by code: OSM map and route"]];
  shots.forEach(([f, cap], i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 0.6 + col * 6.2, y = 1.6 + row * 2.6;
    s.addImage({ path: SHOT + f, x, y, w: 5.9, h: 2.1, sizing: { type: "cover", w: 5.9, h: 2.1 }, objectName: "Screenshot " + cap, altText: cap, shadow: shadow() });
    txt(s, cap, { x, y: y + 2.15, w: 5.9, h: 0.3, fontSize: 12, color: C.text2 });
  });
  // ================= 13. QR & LIVE TRACKING =================
  s = content("Implementation", "07 — IMPLEMENTATION", "QR-Assisted Pickup and Live Tracking");
  s.addImage({ path: SHOT + "customer-qr.png", x: 0.6, y: 1.6, w: 3.9, h: 3.0, sizing: { type: "cover", w: 3.9, h: 3.0 }, objectName: "Customer QR page", altText: "Customer parcel QR code", shadow: shadow() });
  txt(s, "1  Customer shows the parcel QR", { x: 0.6, y: 4.7, w: 3.9, h: 0.35, fontSize: 13, bold: true });
  s.addImage({ path: SHOT + "agent-pickup-confirm.png", x: 4.75, y: 1.6, w: 3.9, h: 3.0, sizing: { type: "cover", w: 3.9, h: 3.0 }, objectName: "Pickup confirmation page", altText: "Agent pickup confirmation", shadow: shadow() });
  txt(s, "2  Agent scans and confirms pickup", { x: 4.75, y: 4.7, w: 3.9, h: 0.35, fontSize: 13, bold: true });
  s.addImage({ path: SHOT + "admin-agent-tracking.png", x: 8.9, y: 1.6, w: 3.8, h: 3.0, sizing: { type: "cover", w: 3.8, h: 3.0 }, objectName: "Admin agent tracking page", altText: "Admin live agent tracking", shadow: shadow() });
  txt(s, "3  Admin follows the agent live", { x: 8.9, y: 4.7, w: 3.8, h: 0.35, fontSize: 13, bold: true });
  card(s, 0.6, 5.35, 12.1, 1.05, "QR honesty note", C.background2);
  txt(s, [{ text: "What the QR does: ", options: { bold: true, color: C.accent1 } },
    { text: "it identifies the parcel quickly. The guarantee comes from the server, which accepts Picked Up only from the assigned agent. It is not cryptographic proof, and there is no delivery-side scan yet." }],
    { x: 0.85, y: 5.45, w: 11.6, h: 0.85, fontSize: 13, valign: "middle" });
  // ================= 14. TESTING =================
  pres.addSection({ title: "Evaluation" });
  s = content("Evaluation", "08 — TESTING & EVALUATION", "What We Tested and What Passed");
  const kpis = [["66/66", "black-box tests passed", HEX.green], ["0", "known vulnerabilities in production dependencies", HEX.blue], ["98", "frontend lint errors to clean up", HEX.amber], ["14", "defects and findings documented", HEX.red]];
  kpis.forEach(([n, l, col], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.65, 2.85, 1.45, "KPI " + l, C.background2);
    txt(s, n, { x: x + 0.25, y: 1.72, w: 2.4, h: 0.75, fontSize: 36, bold: true, color: col });
    txt(s, l, { x: x + 0.25, y: 2.45, w: 2.4, h: 0.6, fontSize: 12, color: C.text2 });
  });
  s.addChart(pres.charts.BAR, [{ name: "Tests passed", labels: ["Auth & sessions", "Lifecycle & assignment", "Access control", "Security & robustness", "Tracking & real-time", "Booking & parcels", "Users", "Analytics & reports"],
    values: [19, 12, 9, 8, 6, 5, 4, 3] }], {
    x: 0.6, y: 3.3, w: 7.6, h: 3.35, barDir: "bar", chartColors: [HEX.blue], showValue: true, dataLabelPosition: "outEnd",
    dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt", dataLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 11,
    catAxisLabelColor: HEX.ink, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisOrientation: "maxMin",
    showLegend: false, showTitle: true, title: "Executed tests by area (all passed)", titleFontFace: "+mn-lt", titleFontSize: 13, titleColor: HEX.ink, barGapWidthPct: 45,
  });
  card(s, 8.5, 3.3, 4.2, 3.35, "Test environment");
  txt(s, [{ text: "How the tests ran", options: { bold: true, fontSize: 15, color: C.accent1, breakLine: true } },
    { text: "Unmodified backend, in-memory MongoDB 7.0", options: { bullet: true, breakLine: true } },
    { text: "Real HTTP and WebSocket clients", options: { bullet: true, breakLine: true } },
    { text: "Never touched production data or sent e-mail", options: { bullet: true, breakLine: true } },
    { text: "Reproducible: one script, under two minutes", options: { bullet: true } }],
    { x: 8.75, y: 3.5, w: 3.8, h: 3.0, fontSize: 13, paraSpaceAfter: 6 });
  // ================= 15. KEY RESULTS =================
  s = content("Evaluation", "08 — TESTING & EVALUATION", "Behaviours Verified Rather Than Assumed");
  const verified = [
    [fa.FaUserSecret, "IDOR blocked", "A customer cannot read another customer's parcel (T32)"],
    [fa.FaArrowsRotate, "Token theft detected", "Replaying a rotated cookie revokes the whole family (T21)"],
    [fa.FaBan, "Instant revocation", "Disabling an account kills a still-valid token (T62)"],
    [fa.FaSatelliteDish, "Scoped live events", "Unrelated and wrong-code sockets receive nothing (T43, T51)"],
    [fa.FaSyringe, "Injection neutralised", "Login with query operators returns 400 (T63)"],
    [fa.FaLock, "Brute force resisted", "Lockout after 5 failures; e-mail endpoint rate-limited (T14, T66)"],
  ];
  for (let i = 0; i < verified.length; i++) {
    const [I, h, b] = verified[i], col = i % 2, row = Math.floor(i / 2), x = 0.6 + col * 4.3, y = 1.7 + row * 1.5;
    card(s, x, y, 4.05, 1.3, "Verified " + h);
    await iconBadge(s, I, x + 0.2, y + 0.3, 0.65, HEX.green, "Verified " + h);
    txt(s, h, { x: x + 1.05, y: y + 0.15, w: 2.85, h: 0.35, fontSize: 14, bold: true });
    txt(s, b, { x: x + 1.05, y: y + 0.52, w: 2.85, h: 0.7, fontSize: 12, color: C.text2 });
  }
  card(s, 9.3, 1.7, 3.4, 4.3, "Latency callout", C.background2);
  txt(s, [{ text: "≈15 ms", options: { fontSize: 36, bold: true, color: C.accent1, breakLine: true } },
    { text: "median local HTTP round trip (n = 100–200)", options: { fontSize: 12, color: C.text2, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "0.29 ms", options: { fontSize: 28, bold: true, color: C.accent5, breakLine: true } },
    { text: "median socket fan-out, agent to admin", options: { fontSize: 12, color: C.text2, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Local upper bounds only: no network, no load test.", options: { fontSize: 12, italic: true, color: C.accent6 } }],
    { x: 9.55, y: 1.9, w: 2.95, h: 3.95, valign: "middle" });
  // ================= 16. FINDINGS & LIMITATIONS =================
  s = content("Evaluation", "09 — FINDINGS & LIMITATIONS", "What Still Needs Work");
  txt(s, "KEY FINDINGS", { x: 0.6, y: 1.65, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.accent6, charSpacing: 2 });
  const finds = ["Agents can skip lifecycle states (F1)", "Google Maps key missing for one tracking page (F2)", "Routes re-requested from rate-limited free map services (F3)",
    "Customer-visible debug button; COD shown with \"$\" (F4, F5)", "98 lint errors, incl. duplicate translation keys (F6)"];
  for (let i = 0; i < finds.length; i++) {
    const y = 2.05 + i * 0.82;
    await iconBadge(s, fa.FaTriangleExclamation, 0.6, y, 0.5, HEX.amber, "Finding " + (i + 1));
    txt(s, finds[i], { x: 1.25, y: y + 0.02, w: 5.2, h: 0.5, fontSize: 14, valign: "middle" });
  }
  txt(s, "NOT YET EVALUATED", { x: 6.9, y: 1.65, w: 5.8, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 2 });
  const notdone = [[fa.FaUsers, "Usability study", "No participants yet; SUS-based procedure proposed"], [fa.FaGaugeHigh, "Load test", "Single process; scalability unproven"],
    [fa.FaRoute, "Field trial", "Real agents, phones and mobile networks"], [fa.FaQrcode, "Delivery proof", "QR is identification only; no delivery scan"]];
  for (let i = 0; i < notdone.length; i++) {
    const [I, h, b] = notdone[i], y = 2.05 + i * 1.02;
    card(s, 6.9, y, 5.8, 0.88, "Not evaluated " + h, C.background2);
    await iconBadge(s, I, 7.07, y + 0.16, 0.56, HEX.blue, "Not evaluated " + h);
    txt(s, h, { x: 7.8, y: y + 0.1, w: 4.7, h: 0.32, fontSize: 14, bold: true });
    txt(s, b, { x: 7.8, y: y + 0.45, w: 4.7, h: 0.35, fontSize: 12, color: C.text2 });
  }
  // ================= 17. CONCLUSION =================
  pres.addSection({ title: "Closing" });
  s = content("Closing", "10 — CONCLUSION & FUTURE WORK", "Conclusion and Future Work");
  card(s, 0.6, 1.7, 5.9, 3.55, "Conclusion column");
  txt(s, "CONCLUSION", { x: 0.9, y: 1.9, w: 5.3, h: 0.3, fontSize: 12, bold: true, color: C.accent2, charSpacing: 2 });
  txt(s, [
    { text: "A complete, working courier system for one operator", options: { bullet: true, breakLine: true } },
    { text: "Every status change recorded; final states locked", options: { bullet: true, breakLine: true } },
    { text: "Live tracking reaches the right people, and only them", options: { bullet: true, breakLine: true } },
    { text: "66/66 adversarial and functional tests passed", options: { bullet: true, breakLine: true } },
    { text: "Objectives O1, O2, O4, O6 achieved; O3 largely; O5 partly", options: { bullet: true } }],
    { x: 0.9, y: 2.3, w: 5.4, h: 2.85, fontSize: 15, paraSpaceAfter: 8 });
  card(s, 6.8, 1.7, 5.9, 3.55, "Future work column", C.background2);
  txt(s, "FUTURE WORK", { x: 7.1, y: 1.9, w: 5.3, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 2 });
  txt(s, [
    { text: "Signed, single-use delivery confirmation", options: { bullet: true, breakLine: true } },
    { text: "Strict lifecycle steps; fix findings and lint in CI", options: { bullet: true, breakLine: true } },
    { text: "Persistent location history; Redis adapter to scale", options: { bullet: true, breakLine: true } },
    { text: "Richer analytics, SMS alerts, agent mobile app", options: { bullet: true, breakLine: true } },
    { text: "Usability study, load test and field trial", options: { bullet: true } }],
    { x: 7.1, y: 2.3, w: 5.4, h: 2.85, fontSize: 15, paraSpaceAfter: 8 });
  card(s, 0.6, 5.5, 12.1, 0.95, "Takeaway banner", C.accent1, HEX.blue);
  txt(s, [{ text: "Takeaway: ", options: { bold: true } }, { text: "a secure, verifiable real-time courier system can be built from commodity open-source parts; usability, scale and field benefit are the next things to prove." }],
    { x: 0.9, y: 5.6, w: 11.5, h: 0.75, fontSize: 15, color: "FFFFFF", valign: "middle" });
  // ================= 18. REFERENCES =================
  s = content("Closing", "11 — REFERENCES", "Selected References");
  const refs = [
    "[1] N. Boysen, S. Fedtke, S. Schwerdfeger, \"Last-mile delivery concepts: a survey from an operational research perspective,\" OR Spectrum, vol. 43, no. 1, pp. 1–58, 2021.",
    "[2] L. Ranieri et al., \"A review of last mile logistics innovations in an externalities cost reduction vision,\" Sustainability, vol. 10, no. 3, 782, 2018.",
    "[3] J. Olsson, D. Hellström, H. Pålsson, \"Framework of last mile logistics research,\" Sustainability, vol. 11, no. 24, 7131, 2019.",
    "[4] M. Savelsbergh, T. Van Woensel, \"City logistics: Challenges and opportunities,\" Transportation Science, vol. 50, no. 2, pp. 579–590, 2016.",
    "[5] A. Musa, A. Gunasekaran, Y. Yusuf, \"Supply chain product visibility: Methods, systems and impacts,\" Expert Syst. Appl., vol. 41, no. 1, pp. 176–194, 2014.",
    "[6] S. Wibbeling, F. Schneiders, \"Research project ePOD@Home: Electronic proof of delivery at point of delivery,\" Lecture Notes in Logistics, Springer, 2013.",
    "[7] A. Chaudhary et al., \"Parcel Pulse: A web-based courier management system,\" IJSREM, vol. 9, no. 11, 2025.",
    "[8] V. Pimentel, B. G. Nickerson, \"Communicating and displaying real-time data with WebSocket,\" IEEE Internet Computing, vol. 16, no. 4, pp. 45–53, 2012.",
    "[9] R. S. Sandhu et al., \"Role-based access control models,\" Computer, vol. 29, no. 2, pp. 38–47, 1996.",
    "[10] OWASP Foundation, \"OWASP Top 10:2021\"; T. Lodderstedt et al., \"Best Current Practice for OAuth 2.0 Security,\" RFC 9700, IETF, 2025.",
  ];
  txt(s, refs.map((r, i) => ({ text: r, options: { breakLine: i < refs.length - 1 } })), { x: 0.6, y: 1.7, w: 12.1, h: 5.0, fontSize: 13, color: C.text2, paraSpaceAfter: 8 });
  // ================= 19. THANK YOU =================
  s = pres.addSlide({ masterName: "TITLE_BLUE", sectionTitle: "Closing" });
  s.addImage({ path: LOGO_WHITE, x: 5.67, y: 0.9, w: 2.0, h: 1.1, objectName: "Uttara University logo", altText: "Uttara University logo" });
  txt(s, "Thank You", { x: 1.5, y: 2.35, w: 10.33, h: 1.0, fontSize: 48, bold: true, color: "FFFFFF", align: "center" });
  txt(s, "Questions & Discussion", { x: 1.5, y: 3.35, w: 10.33, h: 0.55, fontSize: 22, color: "FFFFFF", align: "center" });
  txt(s, "We thank our supervisor, Dr. Md. Obaidur Rahaman, and the Department of CSE, Uttara University, for their guidance and support.",
    { x: 2.2, y: 4.5, w: 8.93, h: 0.75, fontSize: 14, color: "FFFFFF", align: "center" });
  txt(s, "Sharmin Khatun  ·  Tasnim Jahan Mim", { x: 1.5, y: 5.6, w: 10.33, h: 0.4, fontSize: 13, bold: true, color: "FFFFFF", align: "center" });
  if (ALL_SLIDES.length !== SCRIPT.slides.length) throw new Error("script/slide count mismatch: " + ALL_SLIDES.length);
  ALL_SLIDES.forEach((sl, i) => sl.addNotes(SCRIPT.notesFor(i)));
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
