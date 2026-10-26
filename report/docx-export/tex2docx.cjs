// Converts the SCPMS thesis (LaTeX sources) into a structured Word document.
// Usage: node tex2docx.cjs <reportDir> <buildDirWithAuxAndBbl> <out.docx> <review.json>
// review.json: { needsSource: [{file, after, note}], checklist: {...} } -- review markers and end checklist.
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("docx");

const [, , ROOT, BUILD, OUT, REVIEW] = process.argv;
const review = JSON.parse(fs.readFileSync(REVIEW, "utf8"));

// ---------------------------------------------------------------- constants
const CM = 567;                         // dxa per cm
const TEXT_W = 15 * CM;                 // A4 width 21 cm minus 3 cm margins each side
const FONT = "Times New Roman";
const MONO = "Consolas";

// ---------------------------------------------------------------- aux / bbl
const aux = fs.readFileSync(path.join(BUILD, "main.aux"), "utf8");
const LABELS = {};
for (const m of aux.matchAll(/\\newlabel\{([^}]+)\}\{\{([^}]*)\}/g)) LABELS[m[1]] = m[2];
const BIBNUM = {};
for (const m of aux.matchAll(/\\bibcite\{([^}]+)\}\{([^}]+)\}/g)) BIBNUM[m[1]] = m[2];

const bbl = fs.readFileSync(path.join(BUILD, "main.bbl"), "utf8");
const BIB = [];
for (const m of bbl.matchAll(/\\bibitem\{([^}]+)\}([\s\S]*?)(?=\\bibitem\{|\\end\{thebibliography\})/g)) {
  BIB.push({ key: m[1], body: m[2].replace(/\\BIBentry(STD|ALT)interwordspacing/g, "").replace(/\\newblock/g, "")
    .replace(/\\hskip[^\\]*\\relax/g, " ").replace(/\\BIBforeignlanguage\{[^}]*\}/g, "").trim() });
}

// ---------------------------------------------------------------- macros
const mainTex = fs.readFileSync(path.join(ROOT, "main.tex"), "utf8");
const MACROS = {};
for (const m of mainTex.matchAll(/\\newcommand\{\\([a-zA-Z]+)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)) MACROS[m[1]] = m[2];
for (const k of ["code", "cmd", "placeholder", "penline", "frontchapter"]) delete MACROS[k];

function stripComments(s) { return s.replace(/(^|[^\\])%.*$/gm, "$1"); }
function expandMacros(s) {
  for (let pass = 0; pass < 3; pass++)
    for (const [k, v] of Object.entries(MACROS)) s = s.replace(new RegExp("\\\\" + k + "(?![a-zA-Z])(\\{\\})?", "g"), () => v);
  return s;
}
function readTex(rel) {
  let s = stripComments(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  // inline \input of generated tables
  s = s.replace(/\\input\{(tables\/[^}]+)\}/g, (_, p) => stripComments(fs.readFileSync(path.join(ROOT, p.endsWith(".tex") ? p : p + ".tex"), "utf8")));
  // review markers: insert \needsource after the given fragment
  for (const n of review.needsSource.filter((x) => x.file === rel)) {
    const flat = s.replace(/\s+/g, " ");
    if (!flat.includes(n.after)) throw new Error(`needsSource fragment not found in ${rel}: ${n.after.slice(0, 60)}`);
    // locate in original by whitespace-insensitive regex
    const re = new RegExp(n.after.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"));
    s = s.replace(re, (m) => m + "\\needsource{}");
  }
  return expandMacros(s);
}

// ---------------------------------------------------------------- brace helpers
function readGroup(s, i) {                     // s[i] === '{' -> [content, indexAfter]
  let depth = 0, j = i;
  for (; j < s.length; j++) {
    if (s[j] === "\\") { j++; continue; }
    if (s[j] === "{") depth++;
    else if (s[j] === "}") { depth--; if (depth === 0) return [s.slice(i + 1, j), j + 1]; }
  }
  throw new Error("unbalanced braces near: " + s.slice(i, i + 80));
}
function readOpt(s, i) {                       // optional [..] at i (after spaces)
  let k = i; while (s[k] === " ") k++;
  if (s[k] !== "[") return [null, i];
  let depth = 0;
  for (let j = k; j < s.length; j++) {
    if (s[j] === "[") depth++;
    else if (s[j] === "]") { depth--; if (depth === 0) return [s.slice(k + 1, j), j + 1]; }
  }
  return [null, i];
}
function skipSpaces(s, i) { while (i < s.length && /\s/.test(s[i])) i++; return i; }
function argAt(s, i) { i = skipSpaces(s, i); if (s[i] !== "{") return ["", i]; return readGroup(s, i); }
function splitTop(s, sepRe) {                  // split at top level (outside braces)
  const out = []; let depth = 0, last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") {
      if (depth === 0 && sepRe === "\\\\" && s[i + 1] === "\\") { out.push(s.slice(last, i)); i++; let [, a] = readOpt(s, i + 1); last = a; i = a - 1; continue; }
      i++; continue;
    }
    if (c === "{") depth++; else if (c === "}") depth--;
    else if (depth === 0 && sepRe === "&" && c === "&") { out.push(s.slice(last, i)); last = i + 1; }
  }
  out.push(s.slice(last));
  return out;
}

// ---------------------------------------------------------------- inline conversion
const SYM = { textgreater: ">", textless: "<", rightarrow: "\u2192", leq: "\u2264", geq: "\u2265", times: "\u00d7", dagger: "\u2020",
  aa: "\u00e5", textcopyright: "\u00a9", textasciicircum: "^", quad: "\u2003", qquad: "\u2003\u2003", ldots: "\u2026", dots: "\u2026",
  textperiodcentered: "\u00b7", textbackslash: "\\", textasciitilde: "~", S: "\u00a7", checkmark: "\u2713", cdot: "\u00b7", pm: "\u00b1", to: "\u2192" };
const IGNORE = new Set(["allowbreak", "noindent", "centering", "small", "large", "Large", "LARGE", "huge", "normalsize", "footnotesize", "scriptsize",
  "hfill", "par", "relax", "protect", "raggedright", "RaggedRight", "linebreak", "newline", "clearpage", "newpage", "bigskip", "medskip", "smallskip", "phantomsection", "upshape", "mdseries", "normalfont"]);
const ACCENT = { '"': { o: "ö", a: "ä", u: "ü", O: "Ö", A: "Ä", U: "Ü", e: "ë", i: "ï" }, "'": { e: "é", a: "á", o: "ó", i: "í", u: "ú", E: "É" }, "`": { e: "è", a: "à" }, "~": { n: "ñ", a: "ã", o: "õ" } };

function citeText(keys) {
  return "[" + keys.split(",").map((k) => k.trim()).map((k) => { if (!BIBNUM[k]) throw new Error("unknown cite " + k); return BIBNUM[k]; }).join(", ") + "]";
}
function refText(key) { const v = LABELS[key]; if (v === undefined) throw new Error("unknown ref " + key); return v; }

// returns array of run specs {t, b, i, mono, br, hl, under}
function inline(s, fmt = {}) {
  const runs = [];
  const push = (t, f = fmt) => { if (t) runs.push({ t, ...f }); };
  let cur = { ...fmt };
  let buf = "";
  const flush = () => { if (buf) { push(buf, cur); buf = ""; } };
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "\\") {
      const n = s[i + 1];
      if (n === "\\") { flush(); runs.push({ br: true }); let [, a] = readOpt(s, i + 2); i = a; continue; }
      if ("&%_$#{} ".includes(n)) { buf += n === " " ? " " : n; i += 2; continue; }
      if (n === ",") { buf += "\u2009"; i += 2; continue; }
      if (n === "-" ) { i += 2; continue; }
      if (ACCENT[n] && !/[a-zA-Z]/.test(n)) {
        let j = i + 2, ch;
        if (s[j] === "{") { const [g, a] = readGroup(s, j); ch = g; j = a; } else { ch = s[j]; j++; }
        buf += (ACCENT[n][ch] || ch); i = j; continue;
      }
      const m = /^[a-zA-Z]+\*?/.exec(s.slice(i + 1));
      if (!m) { i++; continue; }
      const name = m[0].replace("*", ""); let j = i + 1 + m[0].length;
      if (["textbf", "emph", "textit", "texttt", "code", "cmd", "nolinkurl", "url", "MakeUppercase", "textsc", "underline", "textrm", "textnormal", "mbox"].includes(name)) {
        const [g, a] = argAt(s, j); flush();
        if (name === "code" || name === "nolinkurl" || name === "url" || name === "cmd") runs.push({ t: g.replace(/\\_/g, "_").replace(/\\([{}&%#$])/g, "$1"), ...cur, mono: true });
        else if (name === "texttt") runs.push(...inline(g, { ...cur, mono: true }));
        else if (name === "textbf") runs.push(...inline(g, { ...cur, b: true }));
        else if (name === "emph" || name === "textit") runs.push(...inline(g, { ...cur, i: !cur.i }));
        else if (name === "MakeUppercase") runs.push(...inline(g, cur).map((r) => (r.t ? { ...r, t: r.t.toUpperCase() } : r)));
        else if (name === "underline") runs.push(...inline(g, { ...cur, under: true }));
        else runs.push(...inline(g, cur));
        i = a; continue;
      }
      if (name === "cite") { let [, a0] = readOpt(s, j); const [g, a] = argAt(s, a0); buf += citeText(g); i = a; continue; }
      if (name === "ref" || name === "eqref" || name === "pageref") { const [g, a] = argAt(s, j); buf += refText(g); i = a; continue; }
      if (name === "label") { const [, a] = argAt(s, j); i = a; continue; }
      if (name === "needsource") { const [, a] = argAt(s, j); flush(); runs.push({ t: " [NEEDS SOURCE]", b: true, hl: true }); i = a; continue; }
      if (name === "vspace" || name === "hspace" || name === "addvspace") { const [, a] = argAt(s, j); i = a; continue; }
      if (name === "itshape") { flush(); cur = { ...cur, i: true }; i = j; continue; }
      if (name === "bfseries") { flush(); cur = { ...cur, b: true }; i = j; continue; }
      if (name === "ttfamily") { flush(); cur = { ...cur, mono: true }; i = j; continue; }
      if (name === "makebox") { let [w, a0] = readOpt(s, j); const [g, a] = argAt(s, a0); flush(); runs.push({ t: /dotfill/.test(g) ? ".".repeat(40) : "_".repeat(34), ...cur }); i = a; continue; }
      if (name === "rule") { const [w, a1] = argAt(s, j); const [, a2] = argAt(s, a1); flush(); runs.push({ t: "_".repeat(/\\textwidth/.test(w) ? 60 : 30), ...cur }); i = a2; continue; }
      if (name === "penline") { let [, a] = readOpt(s, j); flush(); runs.push({ t: ".".repeat(40), ...cur }); i = a; continue; }
      if (name === "hrulefill") { flush(); runs.push({ t: "_".repeat(34), ...cur }); i = j; continue; }
      if (name === "dotfill") { flush(); runs.push({ t: ".".repeat(40), ...cur }); i = j; continue; }
      if (name === "resizebox" || name === "scalebox") { const [, a1] = argAt(s, j); const [, a2] = argAt(s, a1); const [g, a3] = argAt(s, a2); runs.push(...inline(g, cur)); i = a3; continue; }
      if (name === "textcolor") { const [, a1] = argAt(s, j); const [g, a2] = argAt(s, a1); flush(); runs.push(...inline(g, cur)); i = a2; continue; }
      if (name === "href") { const [, a1] = argAt(s, j); const [g, a2] = argAt(s, a1); flush(); runs.push(...inline(g, cur)); i = a2; continue; }
      if (name === "multicolumn") { const [, a1] = argAt(s, j); const [, a2] = argAt(s, a1); const [g, a3] = argAt(s, a2); flush(); runs.push(...inline(g, cur)); i = a3; continue; }
      if (name === "bibinfo") { const [, a1] = argAt(s, j); const [g, a2] = argAt(s, a1); flush(); runs.push(...inline(g, cur)); i = a2; continue; }
      if (SYM[name] !== undefined) { buf += SYM[name]; i = j; if (s[i] === "{" && s[i + 1] === "}") i += 2; continue; }
      if (IGNORE.has(name)) { i = j; if (s[i] === "{" && s[i + 1] === "}") i += 2; continue; }
      if (name === "item") { i = j; continue; }
      throw new Error("unhandled command \\" + name + " near: " + s.slice(i, i + 60));
    }
    if (c === "{") { const [g, a] = readGroup(s, i); flush(); runs.push(...inline(g, cur)); i = a; continue; }
    if (c === "}") { i++; continue; }
    if (c === "$") { const e = s.indexOf("$", i + 1); flush(); runs.push(...inline(s.slice(i + 1, e), cur)); i = e + 1; continue; }
    if (c === "~") { buf += "\u00a0"; i++; continue; }
    if (c === "-" && s.startsWith("---", i)) { buf += "\u2014"; i += 3; continue; }
    if (c === "-" && s.startsWith("--", i)) { buf += "\u2013"; i += 2; continue; }
    if (c === "`" && s[i + 1] === "`") { buf += "\u201c"; i += 2; continue; }
    if (c === "'" && s[i + 1] === "'") { buf += "\u201d"; i += 2; continue; }
    if (c === "`") { buf += "\u2018"; i++; continue; }
    if (c === "'" && !cur.mono) { buf += "\u2019"; i++; continue; }
    if (/\s/.test(c)) { if (!buf.endsWith(" ")) buf += " "; i++; continue; }
    buf += c; i++;
  }
  flush();
  return runs;
}

function toRuns(specs, base = {}) {
  const out = [];
  specs.forEach((r, k) => {
    if (r.br) { out.push(new D.TextRun({ break: 1 })); return; }
    let t = r.t;
    if (k === 0) t = t.replace(/^\s+/, "");
    if (k === specs.length - 1) t = t.replace(/\s+$/, "");
    if (!t) return;
    out.push(new D.TextRun({
      text: t, bold: r.b || base.bold, italics: r.i || base.italics, underline: r.under ? {} : undefined,
      font: r.mono ? MONO : undefined, size: r.mono ? (base.size ? base.size - 2 : 21) : base.size,
      shading: r.hl ? { type: D.ShadingType.CLEAR, fill: "FFFF00", color: "auto" } : undefined,
    }));
  });
  return out;
}
function para(tex, opts = {}) {
  const runs = toRuns(inline(tex.trim(), opts.fmt || {}), opts.run || {});
  return new D.Paragraph({ children: runs, alignment: opts.align || D.AlignmentType.JUSTIFIED, style: opts.style, numbering: opts.numbering,
    indent: opts.indent, spacing: opts.spacing, keepNext: opts.keepNext, heading: opts.heading });
}

// ---------------------------------------------------------------- counters
const ctr = { chap: 0, appendix: false, sec: 0, fig: 0, tab: 0, listInst: 0 };
const chapLabel = () => (ctr.appendix ? String.fromCharCode(64 + ctr.chap) : String(ctr.chap));
const citesPerSection = [];                    // for the checklist
let currentSection = "";

// ---------------------------------------------------------------- environments
function findEnvEnd(s, name, from) {
  const open = "\\begin{" + name + "}", close = "\\end{" + name + "}";
  let depth = 1, i = from;
  while (depth > 0) {
    const o = s.indexOf(open, i), c = s.indexOf(close, i);
    if (c < 0) throw new Error("no \\end{" + name + "}");
    if (o >= 0 && o < c) { depth++; i = o + open.length; } else { depth--; i = c + close.length; if (depth === 0) return [c, i]; }
  }
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b };
}
function image(file, widthFrac, maxHcm = 19) {
  const { w, h, data } = pngSize(file);
  let wcm = 15 * Math.min(widthFrac, 1), hcm = (wcm * h) / w;
  if (hcm > maxHcm) { wcm = (wcm * maxHcm) / hcm; hcm = maxHcm; }
  const px = (cm) => Math.round((cm / 2.54) * 96);
  return new D.ImageRun({ type: "png", data, transformation: { width: px(wcm), height: px(hcm) } });
}
function widthFrac(opt) {
  const m = /([\d.]*)\s*\\(text|line)width/.exec(opt || "");
  return m ? (m[1] ? parseFloat(m[1]) : 1) : 1;
}

// Finds \caption{..} or \caption[short]{long}; returns {text, start, end} for the first (or last) one.
function findCaption(s, last = false) {
  const all = [...s.matchAll(/\\caption(\[[^\]]*\])?\{/g)];
  if (!all.length) return null;
  const m = last ? all[all.length - 1] : all[0];
  const open = m.index + m[0].length - 1;
  const [text, end] = readGroup(s, open);
  return { text, start: m.index, end };
}
function captionPara(kind, text) {
  const n = kind === "Table" ? ++ctr.tab : ++ctr.fig;
  const runs = [new D.TextRun({ text: `${kind} ${chapLabel()}.${n}: `, bold: true }), ...toRuns(inline(text.trim()))];
  return { para: new D.Paragraph({ children: runs, style: kind === "Table" ? "TableCaption" : "FigureCaption", keepNext: kind === "Table" }), num: `${chapLabel()}.${n}` };
}
function checkLabel(body, num) {
  const m = /\\label\{([^}]+)\}/.exec(body);
  if (m && LABELS[m[1]] !== undefined && LABELS[m[1]] !== num) throw new Error(`numbering mismatch ${m[1]}: aux ${LABELS[m[1]]} vs ${num}`);
}

function figure(body) {
  const out = [];
  if (body.includes("\\begin{subfigure}")) {
    const subs = [...body.matchAll(/\\begin\{subfigure\}(?:\[[^\]]*\])?\{([^}]*)\}([\s\S]*?)\\end\{subfigure\}/g)];
    const cells = subs.map((m, k) => {
      const g = /\\includegraphics(?:\[([^\]]*)\])?\{([^}]+)\}/.exec(m[2]);
      const cap = (findCaption(m[2]) || { text: "" }).text;
      const frac = widthFrac(m[1]) * 0.98;
      return new D.TableCell({
        width: { size: Math.round(TEXT_W / subs.length), type: D.WidthType.DXA }, borders: NOB,
        children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, children: [image(path.join(ROOT, g[2]), frac, 9)] }),
          new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { after: 60 }, children: toRuns(inline(`(${String.fromCharCode(97 + k)}) ${cap}`), { size: 20 }) })],
      });
    });
    out.push(new D.Table({ width: { size: TEXT_W, type: D.WidthType.DXA }, columnWidths: cells.map(() => Math.round(TEXT_W / cells.length)), borders: NOBT, rows: [new D.TableRow({ children: cells })] }));
  } else {
    let g = /\\includegraphics(?:\[([^\]]*)\])?\{([^}]+)\}/.exec(body), file, frac;
    if (g) { file = path.join(ROOT, g[2]); frac = widthFrac(g[1]); }
    else {
      const r = /\\resizebox\{([^}]*)\}\{[^}]*\}\{\\input\{figures\/([^}]+)\}\}/.exec(body);
      if (!r) throw new Error("figure without image: " + body.slice(0, 120));
      file = path.join(ROOT, "figures/export/out", r[2].replace(/\.tex$/, "") + ".png"); frac = widthFrac(r[1]);
    }
    out.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { before: 120 }, children: [image(file, frac)] }));
  }
  // main caption = last \caption at figure level (outside subfigures)
  const outer = body.replace(/\\begin\{subfigure\}[\s\S]*?\\end\{subfigure\}/g, "");
  const cap = captionPara("Figure", findCaption(outer, true).text);
  checkLabel(outer, cap.num);
  out.push(cap.para);
  return out;
}

const NOB = { top: { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" } };
const NOBT = { ...NOB, insideHorizontal: { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" } };

function parseColSpec(spec) {
  const cols = []; let i = 0;
  while (i < spec.length) {
    const c = spec[i];
    if (c === "@" || c === ">" || c === "<") { const [, a] = readGroup(spec, spec.indexOf("{", i)); i = a; continue; }
    if (c === "p" || c === "P" || c === "m" || c === "b") { const [g, a] = readGroup(spec, spec.indexOf("{", i)); cols.push({ fixed: g }); i = a; continue; }
    if ("lcrXL".includes(c)) { cols.push({ align: c }); i++; continue; }
    i++;
  }
  return cols;
}
function dimToCm(d) {
  const m = /([\d.]+)\s*(cm|in|mm|pt)?/.exec(d); if (!m) return 3;
  const v = parseFloat(m[1]); return m[2] === "in" ? v * 2.54 : m[2] === "mm" ? v / 10 : m[2] === "pt" ? v / 28.45 : v;
}

function table(spec, bodyRaw, opts = {}) {
  const cols = parseColSpec(spec);
  let fixed = 0, flex = 0;
  // narrow ID columns (e.g. p{0.6cm}) get at least 1.1 cm so codes like "F10" do not wrap in Word
  cols.forEach((c) => { if (c.fixed !== undefined) { c.w = Math.max(1.1, /\\textwidth/.test(c.fixed) ? 15 * widthFrac(c.fixed) : dimToCm(c.fixed)); fixed += c.w; } else flex++; });
  const flexW = flex ? Math.max(1.6, (15 - fixed) / flex) : 0;
  cols.forEach((c) => { if (c.w === undefined) c.w = c.align === "X" || c.align === "L" ? flexW : Math.min(flexW, 2.2); });
  const tot = cols.reduce((a, c) => a + c.w, 0);
  const widths = cols.map((c) => Math.round((c.w / tot) * TEXT_W));
  widths[widths.length - 1] += TEXT_W - widths.reduce((a, b) => a + b, 0);

  let body = bodyRaw;
  let caption = null;
  // longtable sections
  if (/\\endfirsthead|\\endhead/.test(body)) {
    const fh = body.indexOf("\\endfirsthead"), eh = body.indexOf("\\endhead");
    let head, rest;
    if (fh >= 0) { head = body.slice(0, fh); rest = body.slice(eh + 8); }
    else { head = body.slice(0, eh); rest = body.slice(eh + 8); }
    const ef = rest.indexOf("\\endfoot"); if (ef >= 0) rest = rest.slice(ef + 8);
    const el = rest.indexOf("\\endlastfoot"); if (el >= 0) rest = rest.slice(el + 12);
    body = head + "\\HEADEND" + rest;
  }
  const fc = findCaption(body);
  if (fc) {
    const capIdx = fc.start, a = fc.end; caption = fc.text;
    let rest = body.slice(a);
    rest = rest.replace(/^\s*\\label\{[^}]*\}/, "").replace(/^\s*\\\\(\[[^\]]*\])?/, "");
    opts.labelSrc = body.slice(capIdx, a + 80);
    body = body.slice(0, capIdx) + rest;
  }
  const booktabs = /\\toprule|\\midrule|\\bottomrule/.test(body);
  const rowsTex = splitTop(body, "\\\\");
  const rows = [];
  let headerMarked = false, pendingTop = false;
  for (let r of rowsTex) {
    let isHeaderEnd = false;
    if (r.includes("\\HEADEND")) { isHeaderEnd = true; r = r.replace("\\HEADEND", ""); }
    const hasMid = /\\midrule|\\hline|\\cmidrule/.test(r);
    const topRule = /\\toprule/.test(r);
    r = r.replace(/\\(toprule|midrule|bottomrule|hline|addlinespace(\[[^\]]*\])?)/g, "").replace(/\\cmidrule(\([^)]*\))?\{[^}]*\}/g, "");
    if (hasMid && rows.length && !r.trim()) { rows[rows.length - 1].ruleBelow = true; if (!headerMarked) { rows.forEach((x) => (x.header = true)); headerMarked = true; } continue; }
    if (isHeaderEnd && rows.length) { rows.forEach((x) => (x.header = true)); headerMarked = true; }
    if (!r.trim()) { if (topRule) pendingTop = true; continue; }
    const cells = splitTop(r, "&").map((c) => c.trim());
    rows.push({ cells, ruleAbove: hasMid, header: false });
  }
  const line = (sz) => ({ style: D.BorderStyle.SINGLE, size: sz, color: "000000" });
  const trs = rows.map((row, ri) => {
    let ci = 0;
    const tcs = [];
    for (const cell of row.cells) {
      let span = 1, txt = cell;
      const mc = /^\\multicolumn\{(\d+)\}/.exec(cell);
      if (mc) span = parseInt(mc[1], 10);
      const w = widths.slice(ci, ci + span).reduce((a, b) => a + b, 0) || widths[widths.length - 1];
      const col = cols[ci] || {};
      const align = col.align === "c" ? D.AlignmentType.CENTER : col.align === "r" ? D.AlignmentType.RIGHT : D.AlignmentType.LEFT;
      const borders = { ...NOB };
      if (booktabs) {
        if (ri === 0) borders.top = line(12);
        if (row.ruleBelow || (row.header && !(rows[ri + 1] || {}).header)) borders.bottom = line(6);
        if (row.ruleAbove && ri > 0) borders.top = line(6);
        if (ri === rows.length - 1) borders.bottom = line(12);
      } else if (opts.boxed) { Object.assign(borders, { top: line(4), bottom: line(4), left: line(4), right: line(4) }); }
      const parts = txt.split(/\\newline|\\par\b/);
      tcs.push(new D.TableCell({
        columnSpan: span > 1 ? span : undefined, width: { size: w, type: D.WidthType.DXA }, borders,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        // header rows keep with the next row so a header is never stranded at the foot of a page
        // short tables are kept whole with their caption
        children: parts.map((p) => new D.Paragraph({ alignment: align, keepNext: row.header || (rows.length <= 15 && ri < rows.length - 1) || undefined, spacing: { after: 0, line: 240 }, children: toRuns(inline(p), { size: opts.size || 20 }) })),
      }));
      ci += span;
    }
    return new D.TableRow({ children: tcs, tableHeader: row.header || undefined, cantSplit: true });
  });
  const out = [];
  if (caption !== null) { const cap = captionPara("Table", caption); checkLabel(opts.labelSrc || "", cap.num); out.push(cap.para); }
  if (opts.captionFrom) { const cap = captionPara("Table", opts.captionFrom); checkLabel(opts.labelBody || "", cap.num); out.push(cap.para); }
  out.push(new D.Table({ width: { size: TEXT_W, type: D.WidthType.DXA }, columnWidths: widths, layout: D.TableLayoutType.FIXED, borders: NOBT, rows: trs }));
  out.push(new D.Paragraph({ spacing: { after: 120 }, children: [] }));
  return out;
}

function tableEnv(body) {
  const fc = findCaption(body);
  const cap = fc.text, ci = fc.start;
  const tm = /\\begin\{(tabularx|tabular|longtable)\}/.exec(body);
  let s = body.slice(tm.index + tm[0].length);
  let a = 0;
  if (tm[1] === "tabularx") { const [, a1] = argAt(s, 0); a = a1; }
  const [spec, a2] = argAt(s, a);
  const [endIdx] = findEnvEnd(s, tm[1], a2);
  return table(spec, s.slice(a2, endIdx), { captionFrom: cap, labelBody: body.slice(ci, ci + 200), size: /\\scriptsize|\\footnotesize/.test(body) ? 17 : 19 });
}

// ---------------------------------------------------------------- block parser
function blocks(s, ctx = {}) {
  const out = [];
  let pbuf = "";
  const flushPara = () => {
    const t = pbuf.trim(); pbuf = "";
    if (!t || /^(\\(vspace\*?\{[^}]*\}|noindent|centering|small|large|Large|normalsize|par|clearpage|newpage|thispagestyle\{[^}]*\})\s*)+$/.test(t)) return;
    countCites(t);
    out.push(para(t, { align: ctx.center ? D.AlignmentType.CENTER : D.AlignmentType.JUSTIFIED, fmt: ctx.fmt, indent: ctx.indent }));
  };
  let i = 0;
  while (i < s.length) {
    if (s[i] === "\n" && /^\n[ \t]*\n/.test(s.slice(i))) { flushPara(); i = s.indexOf("\n", i + 1); continue; }
    if (s[i] === "\\") {
      const m = /^\\([a-zA-Z]+)(\*?)/.exec(s.slice(i));
      const name = m ? m[1] : "";
      if (name === "section" || name === "subsection" || name === "chapter") {
        flushPara();
        const star = m[2] === "*";
        const [title, a] = argAt(s, i + m[0].length);
        let j = a; const lm = /^\s*\\label\{[^}]*\}/.exec(s.slice(j)); if (lm) j += lm[0].length;
        if (name === "chapter") { out.push(...chapterHeading(title, star)); }
        else if (name === "section") {
          let num = "";
          if (!star) { ctr.sec++; num = `${chapLabel()}.${ctr.sec} `; }
          currentSection = (num + title).trim();
          out.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: toRuns(inline(num + title)) }));
        } else out.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_3, children: toRuns(inline(title)) }));
        i = j; continue;
      }
      if (name === "begin") {
        flushPara();
        const [env, a] = argAt(s, i + 6);
        const [endIdx, after] = findEnvEnd(s, env, a);
        let body = s.slice(a, endIdx);
        if (env === "figure") { out.push(...figure(body.replace(/^\s*\[[^\]]*\]/, ""))); }
        else if (env === "table") { out.push(...tableEnv(body.replace(/^\s*\[[^\]]*\]/, ""))); }
        else if (env === "longtable" || env === "tabular" || env === "tabularx") {
          let b = body, k = 0;
          if (env === "tabularx") { const [, a1] = argAt(b, 0); k = a1; }
          const [o] = readOpt(b, k); if (o !== null) k = readOpt(b, k)[1];
          const [spec, a2] = argAt(b, k);
          out.push(...table(spec, b.slice(a2), { size: ctx.tableSize || 20 }));
        }
        else if (env === "itemize" || env === "enumerate" || env === "description") out.push(...list(env, body, ctx.level || 0, ctx));
        else if (env === "quote" || env === "quotation") out.push(...blocks(body, { ...ctx, indent: { left: 720, right: 720 }, fmt: { ...(ctx.fmt || {}) } }));
        else if (env === "center") out.push(...blocks(body, { ...ctx, center: true }));
        else if (["justify", "small", "scriptsize", "footnotesize", "flushleft", "minipage"].includes(env)) out.push(...blocks(body, ctx));
        else throw new Error("unhandled env " + env);
        i = after; continue;
      }
      if (name === "input") { flushPara(); const [p, a] = argAt(s, i + 6); out.push(...blocks(readTex(p.endsWith(".tex") ? p : p + ".tex"), ctx)); i = a; continue; }
      if (name === "appendix") { flushPara(); ctr.appendix = true; ctr.chap = 0; i += 9; continue; }
      if (name === "addtocontents") { const [, a1] = argAt(s, i + 14); const [, a2] = argAt(s, a1); i = a2; continue; }
    }
    pbuf += s[i]; i++;
  }
  flushPara();
  return out;
}

function list(env, body, level, ctx) {
  const items = [];
  let depth = 0, last = -1, i = 0;
  while (i < body.length) {
    if (body.startsWith("\\begin{", i)) { depth++; i += 7; continue; }
    if (body.startsWith("\\end{", i)) { depth--; i += 5; continue; }
    if (depth === 0 && body.startsWith("\\item", i) && !/[a-zA-Z]/.test(body[i + 5] || "")) { if (last >= 0) items.push(body.slice(last, i)); last = i + 5; i += 5; continue; }
    i++;
  }
  if (last >= 0) items.push(body.slice(last));
  const inst = ++ctr.listInst;
  const out = [];
  for (let it of items) {
    let label = null;
    const [opt, a] = readOpt(it, 0);
    if (opt !== null) { label = opt; it = it.slice(a); }
    // split nested lists from item text
    const nested = /\\begin\{(itemize|enumerate|description)\}/.exec(it);
    const text = nested ? it.slice(0, nested.index) : it;
    countCites(text);
    const ref = env === "enumerate" ? "numbered" : "bullets";
    const tex = label !== null && env === "description" ? `\\textbf{${label}} ${text}` : text;
    const paras = tex.trim().split(/\n\s*\n/);
    paras.forEach((pt, k) => out.push(para(pt, { numbering: k === 0 && env !== "description" ? { reference: ref, level, instance: inst } : undefined,
      indent: env === "description" || k > 0 ? { left: 720 * (level + 1) } : undefined, align: D.AlignmentType.LEFT })));
    if (nested) out.push(...blocks(it.slice(nested.index), { ...ctx, level: level + 1 }));
  }
  return out;
}

function countCites(t) {
  const n = (t.match(/\\cite\{([^}]*)\}/g) || []).reduce((a, c) => a + c.slice(6, -1).split(",").length, 0);
  if (n && currentSection) { const e = citesPerSection.find((x) => x.s === currentSection); if (e) e.n += n; else citesPerSection.push({ s: currentSection, n }); }
}

function chapterHeading(title, star) {
  ctr.sec = 0; ctr.fig = 0; ctr.tab = 0;
  if (star) return [new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, pageBreakBefore: true, children: toRuns(inline(title)) })];
  ctr.chap++;
  const lead = ctr.appendix ? `Appendix ${chapLabel()}` : `Chapter ${chapLabel()}`;
  currentSection = `${lead}: ${title}`;
  return [new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, pageBreakBefore: true, children: toRuns(inline(`${lead}: ${title}`)) })];
}
function frontHeading(title) {
  return new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, pageBreakBefore: true, alignment: D.AlignmentType.CENTER, children: [new D.TextRun(title)] });
}
const C = (tex, o = {}) => para(tex, { align: D.AlignmentType.CENTER, ...o });
const gap = (pt) => new D.Paragraph({ spacing: { before: 0, after: pt * 20 }, children: [] });

// ---------------------------------------------------------------- front matter
function titlePage() {
  const m = MACROS;
  return [
    new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [image(path.join(ROOT, "logo/logo.png"), 0.4)] }), gap(24),
    C(`\\textbf{${m.reporttitle}}`, { run: { size: 32 } }), gap(30),
    C("Submitted By", { run: { size: 26 } }),
    C(`\\textbf{${m.studentA}} (ID: ${m.studentAid})`, { run: { size: 26 } }),
    C(`\\textbf{${m.studentB}} (ID: ${m.studentBid})`, { run: { size: 26 } }), gap(24),
    C("Supervisor", { run: { size: 26 } }),
    C(`\\textbf{${m.supervisor.toUpperCase().replace(/\\ /g, " ")}}`, { run: { size: 26 } }),
    C(m.supervisordesig, { run: { size: 26 } }), gap(36),
    C("\\textbf{In Fulfillment of the Requirements for the Degree of}", { run: { size: 26 } }),
    C("\\textbf{Bachelor of Science in Computer Science and Engineering}", { run: { size: 26 } }),
    C("\\textbf{Uttara University, Dhaka, Bangladesh}", { run: { size: 26 } }), gap(30),
    C(`\\textbf{${m.submissiondate}}`, { run: { size: 26 } }),
  ];
}
function secondPage() {
  const src = readTex("frontmatters/2ndpage.tex");
  const emails = [...src.matchAll(/E-mail: ([^\\\n]+)/g)].map((x) => x[1].trim());
  const m = MACROS;
  return [
    new D.Paragraph({ pageBreakBefore: true, children: [] }),
    C(`\\textbf{${m.reporttitle}}`, { run: { size: 30 } }), gap(30),
    C("\\textbf{Submitted By}"), gap(4),
    C(m.studentA), C(`Student ID: ${m.studentAid}`), C(`E-mail: ${emails[0]}`), gap(8),
    C(m.studentB), C(`Student ID: ${m.studentBid}`), C(`E-mail: ${emails[1]}`), gap(20),
    C("\\textbf{Supervisor}"), gap(4), C(m.supervisor.toUpperCase().replace(/\\ /g, " ")), C(m.supervisordesig), gap(30),
    C("\\textbf{Department of Computer Science and Engineering}", { run: { size: 26 } }),
    C("\\textbf{Uttara University}", { run: { size: 26 } }),
    C("\\textbf{Dhaka, Bangladesh}", { run: { size: 26 } }), gap(24),
    C(`\\textbf{${m.submissiondate}}`, { run: { size: 26 } }),
  ];
}
function sigBlock(lines, role) {
  const left = new D.TableCell({ width: { size: 9 * CM, type: D.WidthType.DXA }, borders: NOB,
    children: [new D.Paragraph({ spacing: { before: 360, after: 0 }, children: [new D.TextRun("_".repeat(38))] }), ...lines.map((l) => new D.Paragraph({ spacing: { after: 0 }, children: toRuns(inline(l)) }))] });
  const right = new D.TableCell({ width: { size: 6 * CM, type: D.WidthType.DXA }, borders: NOB, verticalAlign: D.VerticalAlign.TOP,
    children: [new D.Paragraph({ spacing: { before: 360, after: 0 }, children: [new D.TextRun(role || "")] })] });
  return new D.TableRow({ children: [left, right], cantSplit: true });
}
function sigTable(rows) {
  return new D.Table({ width: { size: TEXT_W, type: D.WidthType.DXA }, columnWidths: [9 * CM, 6 * CM], borders: NOBT, rows });
}
function clearancePage() {
  const src = readTex("frontmatters/clearance.tex");
  const attest = /(We officially attest[\s\S]*?University\.)/.exec(src)[1];
  const roles = [];
  for (const m of src.matchAll(/\\makebox\[[^\]]*\]\{\\hrulefill\} &[^&]*& ([^\\]+)\\\\\s*Name: ([^&]+)&[^\n]*\n\s*Designation: ([^&]+)&/g))
    roles.push({ role: m[1].trim(), name: m[2].trim(), desig: m[3].trim() });
  if (roles.length !== 4) throw new Error("clearance roles parsed: " + roles.length);
  return [
    new D.Paragraph({ pageBreakBefore: true, children: [] }),
    C(`\\textbf{${MACROS.submissiondate}}`, { run: { size: 26 } }), C("\\textbf{Department of Computer Science and Engineering}", { run: { size: 26 } }), C("\\textbf{Uttara University}", { run: { size: 26 } }), gap(8),
    para(attest), gap(12),
    sigTable(roles.map((r) => sigBlock([`Name: ${r.name}`, `Designation: ${r.desig}`, "Department of Computer Science and Engineering", "Uttara University"], r.role))),
  ];
}
function declarationPage() {
  const src = readTex("frontmatters/declaration.tex");
  const body = /(We, the undersigned[\s\S]*?degree\.)/.exec(src)[1];
  return [
    new D.Paragraph({ pageBreakBefore: true, children: [] }),
    C(`\\textbf{${MACROS.submissiondate}}`, { run: { size: 26 } }), C("\\textbf{Department of Computer Science and Engineering}", { run: { size: 26 } }), C("\\textbf{Uttara University}", { run: { size: 26 } }), gap(8),
    para(body), gap(24),
    sigTable([sigBlock(["Name: Sharmin Khatun", `Student ID: ${MACROS.studentAid}`, "Department of CSE, Uttara University"]), sigBlock(["Name: Tasnim Jahan Mim", `Student ID: ${MACROS.studentBid}`, "Department of CSE, Uttara University"])]),
  ];
}
function copyrightPage() {
  const src = readTex("frontmatters/copyright.tex");
  const just = [...src.matchAll(/\\begin\{justify\}([\s\S]*?)\\end\{justify\}/g)].map((m) => m[1].trim());
  const items = [...src.matchAll(/\\item ([^\n]+)/g)].map((m) => m[1].trim());
  const affirmed = /Affirmed by ([^\\\n]+)/.exec(src)[1].trim();
  const copyLine = /(\\textcopyright\{\}[^\n]*?reserved\.)/.exec(src)[1];
  const inner = [
    C("\\textbf{UTTARA UNIVERSITY}", { run: { size: 30 } }), gap(6),
    C("\\textit{DECLARATION OF COPYRIGHT AND AFFIRMATION OF FAIR USE OF UNPUBLISHED RESEARCH}", { run: { size: 26 } }), gap(4),
    C(MACROS.reporttitle.toUpperCase()), gap(6),
    para(just[0]), C(copyLine), para(just[1]),
    ...items.map((t, k) => para(`${k + 1}. ${t}`, { indent: { left: 360, hanging: 360 } })),
    para(just[2]), gap(6),
    para(`Affirmed by ${affirmed}`, { align: D.AlignmentType.LEFT }), gap(18),
    new D.Paragraph({ tabStops: [{ type: D.TabStopType.LEFT, position: 9 * CM }], children: [new D.TextRun("_".repeat(30)), new D.TextRun({ text: "\t" + "_".repeat(14) })] }),
    new D.Paragraph({ tabStops: [{ type: D.TabStopType.LEFT, position: 9 * CM }], children: [new D.TextRun("Signature (on behalf of the team)\tDate")] }),
  ];
  const box = { style: D.BorderStyle.SINGLE, size: 8, color: "000000" };
  return [
    new D.Paragraph({ pageBreakBefore: true, children: [] }),
    new D.Table({ width: { size: TEXT_W, type: D.WidthType.DXA }, columnWidths: [TEXT_W],
      rows: [new D.TableRow({ children: [new D.TableCell({ width: { size: TEXT_W, type: D.WidthType.DXA }, borders: { top: box, bottom: box, left: box, right: box }, margins: { top: 200, bottom: 200, left: 240, right: 240 }, children: inner })] })] }),
  ];
}

// ---------------------------------------------------------------- references
function referencesSection() {
  const out = [frontHeading("References")];
  out[0] = new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new D.TextRun("References")] });
  for (const e of BIB) {
    const runs = [new D.TextRun({ text: `[${BIBNUM[e.key]}]\t` }), ...toRuns(inline(e.body.replace(/\s+/g, " ")), { size: 22 })];
    out.push(new D.Paragraph({ children: runs, alignment: D.AlignmentType.LEFT, indent: { left: 620, hanging: 620 }, tabStops: [{ type: D.TabStopType.LEFT, position: 620 }], spacing: { after: 80 } }));
  }
  return out;
}

// ---------------------------------------------------------------- checklist
function checklistSection() {
  const R = review.checklist;
  const H = (t) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [new D.TextRun(t)] });
  const P = (t, o = {}) => para(t, { align: D.AlignmentType.LEFT, ...o });
  const B = (t) => para(t, { align: D.AlignmentType.LEFT, numbering: { reference: "bullets", level: 0 } });
  const out = [new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new D.TextRun("Review Checklist (remove before final submission)")] })];
  out.push(P("This checklist is a working aid for the authors and the supervisor. It is not part of the thesis and should be deleted before the final copy is printed."));
  out.push(H("1. Abstract word count"));
  out.push(P(R.abstract));
  out.push(H("2. Items marked [NEEDS SOURCE]"));
  out.push(P("Each item below is highlighted in yellow in the text. Either add a verified citation, or reword the sentence so that it only states what the authors' own work or an existing citation supports. No citation was invented to fill these gaps."));
  R.needsSource.forEach((x) => out.push(B(x)));
  out.push(H("3. Sections that rely heavily on sources (for review)"));
  out.push(P("Citation counts per section, highest first. These sections summarise published work and should be read against the cited sources:"));
  citesPerSection.filter((x) => x.n >= 3).sort((a, b) => b.n - a.n).forEach((x) => out.push(B(`${x.s}: ${x.n} citations`)));
  R.heavyNotes.forEach((x) => out.push(B(x)));
  out.push(H("4. Wording that may follow a source closely"));
  R.closeWording.forEach((x) => out.push(B(x)));
  out.push(H("5. AI-use disclosure"));
  R.ai.forEach((x) => out.push(B(x)));
  out.push(H("6. Other items to confirm"));
  R.other.forEach((x) => out.push(B(x)));
  return out;
}

// ---------------------------------------------------------------- assemble
const front = [];
front.push(...titlePage());
front.push(...secondPage());
front.push(frontHeading("Abstract"), ...blocks(readTex("frontmatters/abstract.tex")));
front.push(...clearancePage());
front.push(...declarationPage());
front.push(...copyrightPage());
front.push(frontHeading("Dedication"), gap(150), ...blocks(readTex("frontmatters/dedication.tex").replace(/\\vspace\*\{\\fill\}/g, "")));
front.push(frontHeading("Acknowledgment"), ...blocks(readTex("frontmatters/acknowledgment.tex")));
front.push(frontHeading("Table of Contents"), new D.TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }));
front.push(frontHeading("List of Tables"), new D.TableOfContents("List of Tables", { hyperlink: true, stylesWithLevels: [new D.StyleLevel("TableCaption", 1)] }));
front.push(frontHeading("List of Figures"), new D.TableOfContents("List of Figures", { hyperlink: true, stylesWithLevels: [new D.StyleLevel("FigureCaption", 1)] }));
front.push(frontHeading("List of Abbreviations"), ...blocks(readTex("frontmatters/abbreviation.tex"), { tableSize: 22 }));

const body = [];
// same order and titles as main.tex; a chapter may span several source files
const chapters = [["Introduction", ["chapter1/introduction.tex"]], ["Literature Review", ["chapter2/review.tex"]],
  ["Methodology", ["chapter3/methodology.tex", "chapter4/system.tex"]], ["Analysis, Results and Discussion", ["chapter5/result.tex"]],
  ["Limitations", ["chapter5/limitations.tex"]], ["Conclusion", ["chapter6/conclusion.tex"]]];
for (const [t, fs_] of chapters) { body.push(...chapterHeading(t, false)); for (const f of fs_) body.push(...blocks(readTex(f))); }
body.push(...referencesSection());
// review mode adds the appendices and the review checklist; final mode (review.final) ends at the References
if (!review.final) {
  ctr.appendix = true; ctr.chap = 0;
  body.push(...blocks(readTex("appendix/appendix.tex")));
  body.push(...checklistSection());
}

const footer = (fmt) => new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ children: [D.PageNumber.CURRENT], size: 22 })] })] });
const page = { size: { width: 21 * CM, height: 29.7 * CM }, margin: { top: 3 * CM, bottom: 3 * CM, left: 3 * CM, right: 3 * CM } };

const doc = new D.Document({
  creator: "Sharmin Khatun; Tasnim Jahan Mim", title: MACROS.reporttitle, description: "B.Sc. thesis defense report",
  styles: {
    default: { document: { run: { font: FONT, size: 24 }, paragraph: { spacing: { after: 120, line: 288 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: FONT }, paragraph: { spacing: { before: 0, after: 360 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: FONT }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: FONT }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true } },
      { id: "TableCaption", name: "TableCaption", basedOn: "Normal", next: "Normal", run: { size: 22 }, paragraph: { alignment: D.AlignmentType.CENTER, spacing: { before: 200, after: 100 } } },
      { id: "FigureCaption", name: "FigureCaption", basedOn: "Normal", next: "Normal", run: { size: 22 }, paragraph: { alignment: D.AlignmentType.CENTER, spacing: { before: 80, after: 240 } } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [0, 1, 2].map((l) => ({ level: l, format: D.LevelFormat.BULLET, text: ["\u2022", "\u2013", "\u2022"][l], alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 * (l + 1), hanging: 360 } } } })) },
      { reference: "numbered", levels: [0, 1, 2].map((l) => ({ level: l, format: [D.LevelFormat.DECIMAL, D.LevelFormat.LOWER_LETTER, D.LevelFormat.LOWER_ROMAN][l], text: `%${l + 1}.`, alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 * (l + 1), hanging: 360 } } } })) },
    ],
  },
  sections: [
    { properties: { page: { ...page, pageNumbers: { start: 1, formatType: D.NumberFormat.LOWER_ROMAN } } }, footers: { default: footer() }, children: front },
    { properties: { page: { ...page, pageNumbers: { start: 1, formatType: D.NumberFormat.DECIMAL } } }, footers: { default: footer() }, children: body },
  ],
});

D.Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("written", OUT, (buf.length / 1024).toFixed(0) + " KB", "| chapters", ctr.chap, "| bib", BIB.length);
  console.log("cites per section (top):", citesPerSection.sort((a, b) => b.n - a.n).slice(0, 6).map((x) => `${x.s}=${x.n}`).join("; "));
});
