// SCPMS SHORT defense deck (12 slides, single presenter) — same style as build.js.
// SCRIPT_FILE selects the speaker-notes script (./script_short.js or ./script_short_bn.js);
// DECK_OUT sets the output file.
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
const OUT = process.env.DECK_OUT || ROOT + "/SCPMS_Defense_Short_Slides.pptx";
const SCRIPT = require(process.env.SCRIPT_FILE || "./script_short.js");

const THEME = {
  name: "SCPMS Defense", headFontFace: "Arial", bodyFontFace: "Arial",
  colors: { dk1: "10101B", lt1: "FFFFFF", dk2: "4A4A5C", lt2: "F4F5FB", accent1: "1200FF", accent2: "059669",
    accent3: "7C3AED", accent4: "D97706", accent5: "0891B2", accent6: "DC2626", hlink: "1200FF", folHlink: "7C3AED" },
};
const HEX = { blue: "1200FF", ink: "10101B", muted: "4A4A5C", line: "E1E3F0", soft: "F4F5FB",
  green: "059669", purple: "7C3AED", amber: "D97706", cyan: "0891B2", red: "DC2626" };
const TOTAL = 12;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "Design and Implementation of a Smart Courier and Parcel Management System (short defense)";
pres.author = "Sharmin Khatun, Tasnim Jahan Mim";
pres.subject = "B.Sc. thesis defense, Department of CSE, Uttara University";
pres.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };
const C = pres.SchemeColor;
const ALL = [];
const _add = pres.addSlide.bind(pres);
pres.addSlide = (o) => { const s = _add(o); ALL.push(s); return s; };

async function icon(Icon, hex) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Icon, { color: "#" + hex, size: 256 }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}
const shadow = () => ({ type: "outer", color: "000000", opacity: 0.12, blur: 8, offset: 2, angle: 90 });
function card(s, x, y, w, h, name, fill = C.background1) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill },
    line: { color: HEX.line, width: 0.75 }, shadow: shadow(), objectName: name });
}
async function badge(s, Icon, x, y, d, hex, name) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: hex }, line: { color: hex }, objectName: name + " circle" });
  s.addImage({ data: await icon(Icon, "FFFFFF"), x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, objectName: name + " icon", altText: name });
}
function txt(s, text, o) { s.addText(text, { isTextBox: true, fontFace: "Arial", color: C.text1, margin: 0, valign: "top", ...o }); }
function content(section, kicker, title) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(kicker, { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  return s;
}

pres.defineSlideMaster({
  title: "TITLE_BLUE", background: { color: HEX.blue },
  objects: [
    { ellipse: { x: 10.4, y: -1.6, w: 4.4, h: 4.4, fill: { color: "FFFFFF", transparency: 92 }, line: { color: "FFFFFF", transparency: 100 } } },
    { ellipse: { x: -1.2, y: 5.6, w: 3.0, h: 3.0, fill: { color: "FFFFFF", transparency: 93 }, line: { color: "FFFFFF", transparency: 100 } } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: "FFFFFF" }, margin: [0.5, 0.6, 0.7, 0.6],
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
  // ===== 1. TITLE =====
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "TITLE_BLUE", sectionTitle: "Opening" });
  s.addImage({ path: LOGO_WHITE, x: 0.8, y: 0.6, w: 2.3, h: 1.27, objectName: "Uttara University logo", altText: "Uttara University logo" });
  txt(s, "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING  ·  UTTARA UNIVERSITY", { x: 0.8, y: 2.3, w: 11, h: 0.3, fontSize: 11, bold: true, color: "FFFFFF", charSpacing: 2 });
  txt(s, "Smart Courier and Parcel Management System", { x: 0.8, y: 2.7, w: 11.5, h: 1.3, fontSize: 40, bold: true, color: "FFFFFF" });
  txt(s, "Design, implementation and evaluation of a secure, real-time parcel tracking platform", { x: 0.8, y: 4.3, w: 11, h: 0.45, fontSize: 18, color: "FFFFFF" });
  txt(s, [{ text: "PRESENTED BY", options: { fontSize: 10, bold: true, color: "FFFFFF", charSpacing: 2, breakLine: true } },
    { text: "Sharmin Khatun", options: { fontSize: 15, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "ID: 2223081010", options: { fontSize: 12, color: "FFFFFF" } }], { x: 0.8, y: 5.35, w: 3.0, h: 1.1 });
  txt(s, [{ text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "Tasnim Jahan Mim", options: { fontSize: 15, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "ID: 2221081138", options: { fontSize: 12, color: "FFFFFF" } }], { x: 3.9, y: 5.35, w: 3.0, h: 1.1 });
  txt(s, [{ text: "SUPERVISED BY", options: { fontSize: 10, bold: true, color: "FFFFFF", charSpacing: 2, breakLine: true } },
    { text: "Dr. Md. Obaidur Rahaman", options: { fontSize: 15, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "Professor, Dept. of CSE", options: { fontSize: 12, color: "FFFFFF" } }], { x: 7.3, y: 5.35, w: 3.3, h: 1.1 });
  txt(s, [{ text: "B.Sc. Thesis Defense", options: { fontSize: 12, bold: true, color: "FFFFFF", breakLine: true } },
    { text: "27 October 2026", options: { fontSize: 12, color: "FFFFFF" } }], { x: 10.7, y: 5.6, w: 1.9, h: 0.7, align: "right" });

  // ===== 2. BACKGROUND & PROBLEM =====
  pres.addSection({ title: "Context" });
  s = content("Context", "01 — BACKGROUND & PROBLEM", "Why Courier Delivery Needs a Better System");
  const ctx = [
    [fa.FaTruckFast, HEX.blue, "The last mile is costly", "Least efficient delivery stage; up to 28% of cost [1], [2]"],
    [fa.FaPhoneVolume, HEX.amber, "Small couriers work by hand", "Phone calls, paper and chat give a late, partial picture"],
    [fa.FaLayerGroup, HEX.green, "Our answer: SCPMS", "One shared, role-controlled parcel record with live updates"],
  ];
  for (let i = 0; i < ctx.length; i++) {
    const [I, c, h, b] = ctx[i], y = 1.8 + i * 1.45;
    await badge(s, I, 0.6, y, 0.72, c, "Context " + (i + 1));
    txt(s, h, { x: 1.55, y: y - 0.02, w: 4.5, h: 0.38, fontSize: 17, bold: true });
    txt(s, b, { x: 1.55, y: y + 0.4, w: 4.5, h: 0.75, fontSize: 14, color: C.text2 });
  }
  const probs = [[fa.FaEye, HEX.blue, "Visibility", "Customers must call to know where a parcel is"],
    [fa.FaUserCheck, HEX.green, "Responsibility", "Unclear which agent holds which parcel"],
    [fa.FaClipboardList, HEX.purple, "Accountability", "Status changes not recorded with who and when"],
    [fa.FaChartColumn, HEX.amber, "Insight", "No booking, failure or COD figures for managers"]];
  for (let i = 0; i < probs.length; i++) {
    const [I, c, h, b] = probs[i], x = 6.5 + (i % 2) * 3.15, y = 1.75 + Math.floor(i / 2) * 2.05;
    card(s, x, y, 2.95, 1.85, "Problem " + h);
    await badge(s, I, x + 0.25, y + 0.22, 0.6, c, "Problem " + h);
    txt(s, h, { x: x + 1.0, y: y + 0.3, w: 1.8, h: 0.4, fontSize: 16, bold: true });
    txt(s, b, { x: x + 0.25, y: y + 0.95, w: 2.5, h: 0.8, fontSize: 13, color: C.text2 });
  }
  txt(s, [{ text: "It must also be secure: ", options: { bold: true, color: C.accent6 } }, { text: "the system holds personal data, so each role sees only what it may." }],
    { x: 0.6, y: 6.0, w: 12.1, h: 0.45, fontSize: 14 });

  // ===== 3. OBJECTIVES =====
  s = content("Context", "02 — AIM & OBJECTIVES", "What We Set Out to Build");
  txt(s, [{ text: "Aim: ", options: { bold: true, color: C.accent1 } },
    { text: "build and evaluate a secure, role-based web system that manages the parcel lifecycle with real-time visibility." }],
    { x: 0.6, y: 1.65, w: 12.1, h: 0.55, fontSize: 15 });
  const objs = [["O1", "Secure sign-up, sign-in and sessions"], ["O2", "Role and ownership checks on every action"],
    ["O3", "Server-controlled parcel steps with an audit trail"], ["O4", "Live updates and public tracking by code"],
    ["O5", "QR-assisted pickup and route maps"], ["O6", "Admin figures, user management, CSV/PDF export"]];
  objs.forEach(([id, t], i) => {
    const x = 0.6 + (i % 3) * 4.1, y = 2.45 + Math.floor(i / 3) * 1.95;
    card(s, x, y, 3.85, 1.7, "Objective " + id, i < 3 ? C.background1 : C.background2);
    txt(s, id, { x: x + 0.3, y: y + 0.25, w: 1, h: 0.45, fontSize: 22, bold: true, color: C.accent1 });
    txt(s, t, { x: x + 0.3, y: y + 0.78, w: 3.3, h: 0.8, fontSize: 15, bold: true });
  });

  // ===== 4. RELATED WORK =====
  s = content("Context", "03 — RELATED WORK", "What Exists and What Is Missing");
  const rel = [[fa.FaBookOpen, HEX.purple, "Last-mile research [1]–[3]", "Optimises routes and schedules, but assumes the data already exists"],
    [fa.FaBuilding, HEX.cyan, "Commercial carrier platforms", "Work at scale, but closed and not available for a small courier to run"],
    [fa.FaCode, HEX.amber, "Courier web apps, e.g. [4]", "Refresh-based updates; little security design or measured testing"]];
  for (let i = 0; i < rel.length; i++) {
    const [I, c, h, b] = rel[i], x = 0.6 + i * 4.1;
    card(s, x, 1.75, 3.85, 2.35, "Related " + h);
    await badge(s, I, x + 0.28, 1.97, 0.62, c, "Related " + h);
    txt(s, h, { x: x + 0.28, y: 2.72, w: 3.3, h: 0.4, fontSize: 15, bold: true });
    txt(s, b, { x: x + 0.28, y: 3.12, w: 3.3, h: 0.9, fontSize: 13, color: C.text2 });
  }
  card(s, 0.6, 4.35, 12.1, 1.2, "Gap callout", C.background2);
  await badge(s, fa.FaLightbulb, 0.85, 4.55, 0.8, HEX.blue, "Gap");
  txt(s, [{ text: "Gap: ", options: { bold: true, color: C.accent1 } },
    { text: "a self-hostable courier system that combines clear roles, a recorded parcel history, live and private tracking, and real test evidence." }],
    { x: 1.9, y: 4.48, w: 10.6, h: 0.95, fontSize: 15, valign: "middle" });
  txt(s, "[1] Boysen et al., OR Spectrum, 2021   [2] Ranieri et al., Sustainability, 2018   [3] Savelsbergh & Van Woensel, Transportation Science, 2016   [4] Chaudhary et al., IJSREM, 2025   (40 verified references in the thesis)",
    { x: 0.6, y: 5.8, w: 12.1, h: 0.55, fontSize: 10, color: C.text2 });

  // ===== 5. APPROACH =====
  pres.addSection({ title: "Design" });
  s = content("Design", "04 — APPROACH", "How We Built It and for Whom");
  const phases = ["Plan", "Design", "Build", "Extend", "Secure", "Test"];
  phases.forEach((p, i) => {
    const x = 0.6 + i * 2.05;
    s.addShape(pres.shapes.OVAL, { x: x + 0.55, y: 1.75, w: 0.62, h: 0.62, fill: { color: HEX.blue }, line: { color: HEX.blue }, objectName: "Phase " + (i + 1) });
    txt(s, String(i + 1), { x: x + 0.55, y: 1.75, w: 0.62, h: 0.62, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, p, { x: x, y: 2.45, w: 1.72, h: 0.35, fontSize: 14, bold: true, align: "center" });
    if (i < 5) txt(s, "→", { x: x + 1.72, y: 1.85, w: 0.33, h: 0.4, fontSize: 18, bold: true, color: C.accent1, align: "center" });
  });
  txt(s, "Iterative, step-by-step development, April to October 2026", { x: 0.6, y: 2.88, w: 12.1, h: 0.35, fontSize: 13, italic: true, color: C.text2, align: "center" });
  const roles = [[fa.FaUser, HEX.blue, "Customer", "Books and tracks parcels"], [fa.FaMotorcycle, HEX.green, "Delivery agent", "Scans QR, updates status, shares location"],
    [fa.FaUserShield, HEX.purple, "Administrator", "Assigns agents, manages users, reports"], [fa.FaGlobe, HEX.amber, "Public viewer", "Tracks by code, no personal data"]];
  for (let i = 0; i < roles.length; i++) {
    const [I, c, h, b] = roles[i], x = 0.6 + i * 3.1;
    card(s, x, 3.5, 2.85, 1.85, "Role " + h);
    await badge(s, I, x + 0.25, 3.7, 0.6, c, "Role " + h);
    txt(s, h, { x: x + 0.25, y: 4.42, w: 2.4, h: 0.35, fontSize: 15, bold: true });
    txt(s, b, { x: x + 0.25, y: 4.78, w: 2.45, h: 0.5, fontSize: 12, color: C.text2 });
  }
  txt(s, [{ text: "21", options: { bold: true, color: C.accent1, fontSize: 20 } }, { text: " functional   ·   ", options: {} },
    { text: "7", options: { bold: true, color: C.accent3, fontSize: 20 } }, { text: " quality requirements   ·   ", options: {} },
    { text: "3", options: { bold: true, color: C.accent2, fontSize: 20 } }, { text: " database collections", options: {} }],
    { x: 0.6, y: 5.65, w: 12.1, h: 0.55, fontSize: 15, align: "center", valign: "middle" });

  // ===== 6. ARCHITECTURE =====
  s = content("Design", "05 — SYSTEM ARCHITECTURE", "How the System Fits Together");
  s.addImage({ path: DIAG + "architecture.png", x: 0.6, y: 1.6, w: 7.9, h: 5.15, objectName: "Architecture diagram", altText: "Layered architecture: browser, proxy, Node.js server, MongoDB" });
  const arch = [[fa.FaDesktop, HEX.blue, "Website (React)", "What each role sees"], [fa.FaServer, HEX.purple, "Server (Node.js)", "Checks every rule in one place"],
    [fa.FaBolt, HEX.cyan, "Live connection", "Socket.IO pushes updates instantly"], [fa.FaDatabase, HEX.green, "Database (MongoDB)", "Users, parcels, sessions"]];
  for (let i = 0; i < arch.length; i++) {
    const [I, c, h, b] = arch[i], y = 1.8 + i * 1.2;
    await badge(s, I, 8.85, y, 0.62, c, "Architecture " + h);
    txt(s, h, { x: 9.65, y: y - 0.02, w: 3.1, h: 0.35, fontSize: 15, bold: true });
    txt(s, b, { x: 9.65, y: y + 0.36, w: 3.1, h: 0.6, fontSize: 13, color: C.text2 });
  }

  // ===== 7. LIFECYCLE & SECURITY =====
  s = content("Design", "06 — LIFECYCLE & SECURITY", "Every Parcel Follows Fixed, Protected Steps");
  s.addImage({ path: DIAG + "statemachine.png", x: 0.6, y: 1.65, w: 7.6, h: 3.55, objectName: "Parcel lifecycle diagram", altText: "Six-state parcel lifecycle" });
  txt(s, "Only the assigned agent can update a parcel; Delivered and Failed are locked; every change is recorded. Finding: agents can skip forward a step.",
    { x: 0.6, y: 5.4, w: 7.6, h: 0.8, fontSize: 13, color: C.text2, italic: true });
  txt(s, "SECURITY BUILT IN", { x: 8.6, y: 1.7, w: 4.1, h: 0.3, fontSize: 12, bold: true, color: C.accent6, charSpacing: 2 });
  const sec = [[fa.FaKey, "Short-lived login token, rotating cookie with theft detection"], [fa.FaUserLock, "Users can only open their own parcels"],
    [fa.FaLock, "Hashed passwords, lockout after 5 tries"], [fa.FaUsersRectangle, "Live updates go only to allowed groups"], [fa.FaFilter, "Harmful input and spoofing blocked"]];
  for (let i = 0; i < sec.length; i++) {
    const [I, b] = sec[i], y = 2.15 + i * 0.85;
    await badge(s, I, 8.6, y, 0.55, HEX.red, "Security " + (i + 1));
    txt(s, b, { x: 9.3, y: y, w: 3.4, h: 0.6, fontSize: 13, valign: "middle" });
  }

  // ===== 8. RUNNING SYSTEM =====
  pres.addSection({ title: "Results" });
  s = content("Results", "07 — THE RUNNING SYSTEM", "Real Screens from the Working System");
  const shots = [["customer-dashboard.png", "Customer books and tracks parcels"], ["customer-qr.png", "Customer shows the parcel QR for pickup"],
    ["agent-dashboard.png", "Agent sees jobs and a live map"], ["admin-agent-tracking.png", "Admin follows the agent live"]];
  shots.forEach(([f, cap], i) => {
    const x = 0.6 + (i % 2) * 6.2, y = 1.6 + Math.floor(i / 2) * 2.45;
    s.addImage({ path: SHOT + f, x, y, w: 5.9, h: 1.95, sizing: { type: "cover", w: 5.9, h: 1.95 }, objectName: "Screenshot " + cap, altText: cap, shadow: shadow() });
    txt(s, cap, { x, y: y + 2.0, w: 5.9, h: 0.3, fontSize: 12, bold: true });
  });
  txt(s, "The QR code identifies the parcel at pickup; the server accepts the pickup only from the assigned agent.", { x: 0.6, y: 6.5, w: 12.1, h: 0.35, fontSize: 12, italic: true, color: C.text2 });

  // ===== 9. TESTING & RESULTS =====
  s = content("Results", "08 — TESTING & RESULTS", "Tested on the Real System");
  const kpis = [["66/66", "automatic tests passed", HEX.green], ["0", "known vulnerabilities in shipped packages", HEX.blue], ["98", "code-style errors to clean up", HEX.amber], ["14", "issues recorded honestly", HEX.red]];
  kpis.forEach(([n, l, c], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.65, 2.85, 1.35, "KPI " + l, C.background2);
    txt(s, n, { x: x + 0.25, y: 1.72, w: 2.4, h: 0.72, fontSize: 34, bold: true, color: c });
    txt(s, l, { x: x + 0.25, y: 2.42, w: 2.45, h: 0.5, fontSize: 12, color: C.text2 });
  });
  s.addChart(pres.charts.BAR, [{ name: "Tests passed", labels: ["Auth & sessions", "Lifecycle", "Access control", "Security", "Live tracking", "Booking", "Users", "Reports"],
    values: [19, 12, 9, 8, 6, 5, 4, 3] }], {
    x: 0.6, y: 3.2, w: 6.4, h: 3.45, barDir: "bar", chartColors: [HEX.blue], showValue: true, dataLabelPosition: "outEnd",
    dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt", dataLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 11,
    catAxisLabelColor: HEX.ink, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisOrientation: "maxMin",
    showLegend: false, showTitle: true, title: "Tests by area (all passed)", titleFontFace: "+mn-lt", titleFontSize: 13, titleColor: HEX.ink, barGapWidthPct: 45,
  });
  txt(s, "PROVEN BY TESTS", { x: 7.4, y: 3.25, w: 5.3, h: 0.3, fontSize: 12, bold: true, color: C.accent2, charSpacing: 2 });
  const proved = ["A customer cannot open another's parcel", "A stolen, reused login is detected", "A disabled account is blocked at once",
    "Live updates never reach the wrong people", "Harmful input and password guessing are stopped"];
  for (let i = 0; i < proved.length; i++) {
    const y = 3.62 + i * 0.55;
    await badge(s, fa.FaCheck, 7.4, y, 0.42, HEX.green, "Proved " + (i + 1));
    txt(s, proved[i], { x: 7.95, y: y - 0.02, w: 4.75, h: 0.46, fontSize: 13, valign: "middle" });
  }
  txt(s, "Speed: about 15 ms per request on one local computer only, not a load test.", { x: 7.4, y: 6.42, w: 5.3, h: 0.3, fontSize: 11, italic: true, color: C.text2 });

  // ===== 10. LIMITATIONS & FUTURE =====
  s = content("Results", "09 — LIMITATIONS & FUTURE WORK", "What Is Next");
  card(s, 0.6, 1.7, 5.9, 4.7, "Limitations column");
  txt(s, "LIMITATIONS", { x: 0.9, y: 1.9, w: 5.3, h: 0.3, fontSize: 12, bold: true, color: C.accent6, charSpacing: 2 });
  txt(s, [
    { text: "Not yet tested with real users or many users", options: { bullet: true, breakLine: true } },
    { text: "No field trial with real delivery agents", options: { bullet: true, breakLine: true } },
    { text: "QR identifies the parcel; it does not prove delivery", options: { bullet: true, breakLine: true } },
    { text: "Agents can skip a lifecycle step", options: { bullet: true, breakLine: true } },
    { text: "Depends on free map services with limits", options: { bullet: true } }],
    { x: 0.9, y: 2.4, w: 5.4, h: 3.8, fontSize: 17, paraSpaceAfter: 16 });
  card(s, 6.8, 1.7, 5.9, 4.7, "Future work column", C.background2);
  txt(s, "FUTURE WORK", { x: 7.1, y: 1.9, w: 5.3, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 2 });
  txt(s, [
    { text: "Secure, single-use delivery confirmation", options: { bullet: true, breakLine: true } },
    { text: "Strict parcel steps; fix the recorded issues", options: { bullet: true, breakLine: true } },
    { text: "Scale to many users; keep location history", options: { bullet: true, breakLine: true } },
    { text: "SMS alerts and a mobile app for agents", options: { bullet: true, breakLine: true } },
    { text: "User study, load test and field trial", options: { bullet: true } }],
    { x: 7.1, y: 2.4, w: 5.4, h: 3.8, fontSize: 17, paraSpaceAfter: 16 });

  // ===== 11. CONCLUSION =====
  pres.addSection({ title: "Closing" });
  s = content("Closing", "10 — CONCLUSION", "What We Achieved");
  const ach = [["O1", "Secure sessions", "Achieved", HEX.green], ["O2", "Access control", "Achieved", HEX.green], ["O3", "Parcel lifecycle", "Mostly", HEX.amber],
    ["O4", "Live updates", "Achieved", HEX.green], ["O5", "QR and maps", "Partly", HEX.amber], ["O6", "Admin tools", "Achieved", HEX.green]];
  ach.forEach(([id, t, st, c], i) => {
    const x = 0.6 + (i % 3) * 4.1, y = 1.7 + Math.floor(i / 3) * 1.25;
    card(s, x, y, 3.85, 1.05, "Achievement " + id);
    txt(s, id, { x: x + 0.25, y: y + 0.3, w: 0.6, h: 0.45, fontSize: 18, bold: true, color: C.accent1 });
    txt(s, t, { x: x + 0.9, y: y + 0.3, w: 1.6, h: 0.45, fontSize: 14, bold: true, valign: "middle" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 2.55, y: y + 0.32, w: 1.1, h: 0.42, rectRadius: 0.1, fill: { color: c }, line: { color: c }, objectName: "Status " + id });
    txt(s, st, { x: x + 2.55, y: y + 0.32, w: 1.1, h: 0.42, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
  });
  txt(s, [
    { text: "A complete, working courier system for one company", options: { bullet: true, breakLine: true } },
    { text: "Every status change recorded; live tracking reaches only the right people", options: { bullet: true, breakLine: true } },
    { text: "All 66 tests passed on the real code", options: { bullet: true } }],
    { x: 0.6, y: 4.35, w: 12.1, h: 1.2, fontSize: 15, paraSpaceAfter: 6 });
  card(s, 0.6, 5.6, 12.1, 0.85, "Takeaway banner", C.accent1);
  txt(s, [{ text: "Takeaway: ", options: { bold: true } }, { text: "a secure, real-time courier system can be built with free, open-source tools; the next step is proving it with real users." }],
    { x: 0.9, y: 5.68, w: 11.5, h: 0.7, fontSize: 15, color: "FFFFFF", valign: "middle" });

  // ===== 12. THANK YOU =====
  s = pres.addSlide({ masterName: "TITLE_BLUE", sectionTitle: "Closing" });
  s.addImage({ path: LOGO_WHITE, x: 5.67, y: 0.9, w: 2.0, h: 1.1, objectName: "Uttara University logo", altText: "Uttara University logo" });
  txt(s, "Thank You", { x: 1.5, y: 2.35, w: 10.33, h: 1.0, fontSize: 48, bold: true, color: "FFFFFF", align: "center" });
  txt(s, "Questions & Discussion", { x: 1.5, y: 3.35, w: 10.33, h: 0.55, fontSize: 22, color: "FFFFFF", align: "center" });
  txt(s, "With thanks to our supervisor, Dr. Md. Obaidur Rahaman, and the Department of CSE, Uttara University.",
    { x: 2.2, y: 4.5, w: 8.93, h: 0.75, fontSize: 14, color: "FFFFFF", align: "center" });
  txt(s, "Sharmin Khatun  ·  Tasnim Jahan Mim", { x: 1.5, y: 5.6, w: 10.33, h: 0.4, fontSize: 13, bold: true, color: "FFFFFF", align: "center" });

  if (ALL.length !== SCRIPT.slides.length) throw new Error("script/slide count mismatch: " + ALL.length + " vs " + SCRIPT.slides.length);
  ALL.forEach((sl, i) => sl.addNotes(SCRIPT.notesFor(i)));
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
