// Printable SINGLE-PRESENTER guide for the short deck, in English or Bangla.
// Usage: node make-guide-single.js <outdir> <en|bn> <slides-png-dir>
// Bangla needs <outdir>/fonts/nirmala3.ttf + nirmala4.ttf (Nirmala Text, extracted from Windows Nirmala.ttc).
const fs = require("fs");
const path = require("path");

const [, , OUTDIR, LANG = "en", SLIDEDIR] = process.argv;
const S = require(LANG === "bn" ? "./script_short_bn.js" : "./script_short.js");
const num = LANG === "bn" ? S.bn : (x) => String(x);

const L = LANG === "bn" ? {
  file: `presenter-script-single-bn-${S.presenterKey}.tex`, presenterLbl: "উপস্থাপক", idLbl: "আইডি",
  footer: "SCPMS ফাইনাল ডিফেন্স \\textperiodcentered{} এক-উপস্থাপকের স্ক্রিপ্ট (বাংলা)", page: "পৃষ্ঠা",
  dept: "সিএসই বিভাগ \\textperiodcentered{} উত্তরা ইউনিভার্সিটি", title: "প্রেজেন্টার স্ক্রিপ্ট (একজন উপস্থাপক)",
  sub: "বিএসসি থিসিস ডিফেন্স \\textperiodcentered{} সংক্ষিপ্ত ১২ স্লাইড \\textperiodcentered{} ২৭ অক্টোবর ২০২৬",
  intro: "এই স্ক্রিপ্টটি একজন উপস্থাপকের জন্য, যিনি একাই পুরো ডিফেন্স উপস্থাপন করবেন। প্রতিটি স্লাইডে লেখা আছে \\textbf{কী বলবেন} আর \\textbf{স্লাইডের কোথায় দেখাবেন}। ভাষা ইচ্ছা করেই সহজ রাখা হয়েছে। কয়েকবার জোরে পড়ে অনুশীলন করুন, তারপর নিজের ভাষায় স্বাভাবিকভাবে বলুন।",
  note: `\\textbf{খেয়াল রাখুন:} স্লাইডগুলো ইংরেজিতে। বোর্ড ইংরেজিতে বলতে বললে ইংরেজি স্ক্রিপ্টটি ব্যবহার করুন; দুটি স্ক্রিপ্টে স্লাইড আর সময় একই। এই স্ক্রিপ্টটি ${S.presenter.name}-এর জন্য তৈরি (আইডি ${S.presenter.id})।`,
  plan: "সময় পরিকল্পনা", slideCol: "স্লাইড", topicCol: "বিষয়", timeCol: "সময়", total: "মোট", min: "মিনিট", about: "প্রায়",
  how: "কীভাবে ব্যবহার করবেন",
  howItems: ["\\textbf{বলুন} অংশে যা বলবেন তা লেখা। শব্দ বদলাতে পারেন, অর্থ একই রাখুন।",
    "\\textbf{দেখান} অংশ বলে দেয় স্লাইডের কোথায় দেখাবেন।",
    "একই বাংলা স্ক্রিপ্ট আলাদা PowerPoint ফাইলে \\textbf{স্পিকার নোট} হিসেবে আছে। Presenter View-তে দর্শক শুধু স্লাইড দেখবে, আপনি ল্যাপটপে নোট দেখবেন।"],
  scriptHead: "স্লাইড অনুযায়ী স্ক্রিপ্ট", slideWord: "স্লাইড", say: "বলুন", show: "দেখান", onScreen: "স্লাইডের শিরোনাম",
  card: "পকেট কার্ড (কেটে হাতে রাখুন)", cardIntro: "নার্ভাস লাগলে এক নজর তাকালেই বুঝবেন কোথায় আছেন আর এরপর কী।", remember: "শুরুর কথা",
  qaHead: "সম্ভাব্য প্রশ্ন ও সহজ উত্তর", qaIntro: "উত্তর সংক্ষিপ্ত ও সৎ রাখুন।", qCol: "প্রশ্ন", aCol: "সহজ উত্তর", noCol: "নং",
  unknown: "\\textbf{উত্তর জানা না থাকলে} বলুন: ``খুব ভালো প্রশ্ন। এই সংস্করণে আমরা তা করিনি, তবে এটি আমাদের ভবিষ্যৎ কাজের অংশ।'' কখনো সংখ্যা অনুমান করবেন না।",
  gloss: "কারিগরি শব্দের সহজ অর্থ", wCol: "স্লাইডের শব্দ", mCol: "এর অর্থ",
  tipsHead: "উপস্থাপনের পরামর্শ", tBefore: "ডিফেন্সের আগে", tDuring: "উপস্থাপনের সময়", tQ: "প্রশ্নের উত্তর দেওয়ার সময়", tDont: "এই কথাগুলো বলবেন না (সত্য বা প্রমাণিত নয়)",
} : {
  file: `presenter-script-single-${S.presenterKey}.tex`, presenterLbl: "Presenter", idLbl: "ID",
  footer: "SCPMS Final Defense \\textperiodcentered{} Single-Presenter Script", page: "Page",
  dept: "DEPARTMENT OF CSE \\textperiodcentered{} UTTARA UNIVERSITY", title: "Presenter Script (One Presenter)",
  sub: "B.Sc. Thesis Defense \\textperiodcentered{} Short 12-slide version \\textperiodcentered{} 27 October 2026",
  intro: "This script is for one person presenting the whole defense alone. For every slide it tells you \\textbf{what to say} and \\textbf{where to point}. The words are simple on purpose. Read it aloud a few times, then speak naturally in your own words.",
  note: `\\textbf{Note:} this copy is prepared for ${S.presenter.name} (ID ${S.presenter.id}) as the presenter. A Bangla version with the same slides and timing is also available.`,
  plan: "Timing plan", slideCol: "Slide", topicCol: "Topic", timeCol: "Time", total: "Total", min: "min", about: "about",
  how: "How to use this script",
  howItems: ["\\textbf{SAY} is what you speak. You may change the words, but keep the meaning.",
    "\\textbf{SHOW} tells you where to point on the slide.",
    "The same script is in the PowerPoint file as \\textbf{speaker notes}. In Presenter View the audience sees only the slide, and you see your notes on the laptop."],
  scriptHead: "The Script, Slide by Slide", slideWord: "Slide", say: "SAY", show: "SHOW", onScreen: "On screen",
  card: "Pocket Card (cut out and keep in your hand)", cardIntro: "If you get nervous, one glance tells you where you are and what comes next.", remember: "First sentence",
  qaHead: "Likely Questions with Easy Answers", qaIntro: "Keep answers short and honest.", qCol: "Question", aCol: "Simple answer", noCol: "No.",
  unknown: "\\textbf{If you do not know the answer}, say: ``That is a good question. We have not done that in this version, but it is part of our future work.'' Never guess numbers.",
  gloss: "Simple Meanings of Technical Words", wCol: "Word on the slide", mCol: "What it means",
  tipsHead: "Presenting Tips", tBefore: "Before the defense", tDuring: "While presenting", tQ: "Answering questions", tDont: "Do not say these things (not true or not proven)",
};

function esc(t) {
  let open = true;
  return String(t).replace(/\\/g, "\\textbackslash{}").replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}").replace(/\^/g, "\\textasciicircum{}")
    .replace(/"/g, () => { const r = open ? "``" : "''"; open = !open; return r; });
}
const toSec = (t) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
const fmt = (sec) => num(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);
const all = fmt(S.slides.reduce((a, s) => a + toSec(s.time), 0));
const ttl = (s) => (LANG === "bn" ? s.titleBn : s.title);

const fontSetup = LANG === "bn"
  ? "\\usepackage{fontspec}\n\\setmainfont{nirmala3.ttf}[Path=./fonts/, BoldFont=nirmala4.ttf, Script=Bengali]\n\\linespread{1.12}"
  : "\\usepackage[T1]{fontenc}\n\\usepackage[scaled=0.95]{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}";
const pageNum = LANG === "bn" ? String.raw`
\renewcommand{\thepage}{\bengalinum{page}}
\makeatletter
\def\bengalinum#1{\expandafter\@bengalidigits\number\value{#1}\@nil}
\def\@bengalidigits#1{\ifx#1\@nil\else\@bdigit{#1}\expandafter\@bengalidigits\fi}
\def\@bdigit#1{\ifcase#1 ০\or ১\or ২\or ৩\or ৪\or ৫\or ৬\or ৭\or ৮\or ৯\fi}
\makeatother` : "";

let tex = `\\documentclass[11pt,a4paper]{article}
${fontSetup}
\\usepackage[margin=1.8cm,top=1.6cm,bottom=1.8cm]{geometry}
\\usepackage{xcolor,graphicx,longtable,array,booktabs,enumitem}
\\usepackage[most]{tcolorbox}
\\usepackage{fancyhdr}
\\usepackage[hidelinks]{hyperref}
\\definecolor{uublue}{HTML}{1200FF}\\definecolor{green}{HTML}{059669}\\definecolor{purple}{HTML}{7C3AED}
\\definecolor{muted}{HTML}{4A4A5C}\\definecolor{soft}{HTML}{F4F5FB}\\definecolor{warn}{HTML}{DC2626}
\\setlength{\\parindent}{0pt}\\setlength{\\parskip}{5pt}
\\setlist{itemsep=2pt,topsep=3pt,leftmargin=1.4em}
\\renewcommand{\\arraystretch}{1.3}
\\pagestyle{fancy}\\fancyhf{}
\\fancyfoot[L]{\\footnotesize\\color{muted} ${L.footer}}
\\fancyfoot[R]{\\footnotesize\\color{muted} ${L.page} \\thepage}
\\renewcommand{\\headrulewidth}{0pt}${pageNum}
\\newtcolorbox{slidebox}[1]{enhanced, breakable, colback=white, colframe=uublue, boxrule=0.9pt, arc=3pt,
  left=6pt, right=6pt, top=4pt, bottom=6pt, colbacktitle=uublue, coltitle=white, fonttitle=\\bfseries, title={#1}, before skip=8pt, after skip=8pt}
\\newcommand{\\sectionhead}[1]{\\vspace{4pt}{\\Large\\bfseries\\color{uublue}#1}\\par\\vspace{2pt}}
\\begin{document}
\\thispagestyle{empty}
\\begin{tcolorbox}[colback=uublue, colframe=uublue, arc=4pt, left=14pt, right=14pt, top=14pt, bottom=14pt]
\\color{white}{\\small\\bfseries ${L.dept}}\\par\\vspace{10pt}
{\\huge\\bfseries ${L.title}}\\par\\vspace{4pt}
{\\Large Smart Courier and Parcel Management System (SCPMS)}\\par\\vspace{10pt}
{\\normalsize ${L.sub}}\\par\\vspace{6pt}
{\\large\\bfseries ${L.presenterLbl}: ${S.presenter.name} \\textperiodcentered{} ${L.idLbl} ${S.presenter.id}}\\par
\\end{tcolorbox}
\\vspace{6pt}
${L.intro}

\\begin{tcolorbox}[colback=warn!5, colframe=warn!60, arc=3pt]\\small ${L.note}\\end{tcolorbox}

\\sectionhead{${L.plan}}
\\begin{tcolorbox}[colback=soft, colframe=soft, arc=3pt]\\small
\\begin{tabular}{@{}p{1.4cm}p{11.0cm}p{3.0cm}@{}}
\\textbf{${L.slideCol}} & \\textbf{${L.topicCol}} & \\textbf{${L.timeCol}}\\\\
`;
for (const s of S.slides) tex += `${num(s.n)} & ${esc(ttl(s))} & ${num(s.time)} ${L.min}\\\\\n`;
tex += `\\midrule\\textbf{${L.total}} & ${num(S.slides.length)} & \\textbf{${L.about} ${all} ${L.min}}\\\\\n\\end{tabular}\\end{tcolorbox}
\\sectionhead{${L.how}}
\\begin{itemize}\n${L.howItems.map((x) => `\\item ${x}`).join("\n")}\n\\end{itemize}
\\newpage\\sectionhead{${L.scriptHead}}
`;

for (const s of S.slides) {
  const img = path.join(SLIDEDIR, `s${String(s.n).padStart(2, "0")}.png`).replace(/\\/g, "/");
  tex += `\\begin{slidebox}{${L.slideWord} ${num(s.n)}: ${esc(ttl(s))} \\hfill ${L.about} ${num(s.time)} ${L.min}}\n`;
  tex += `\\begin{minipage}[t]{4.6cm}\\vspace{2pt}\\includegraphics[width=\\linewidth]{${img}}`;
  if (LANG === "bn") tex += `\\par{\\raggedright\\scriptsize\\color{muted} ${L.onScreen}: ${esc(s.title)}\\par}`;
  tex += `\\end{minipage}\\hfill\n\\begin{minipage}[t]{\\dimexpr\\linewidth-4.9cm}\\vspace{0pt}\n{\\small\\bfseries\\color{uublue} ${L.say}}\\par\n`;
  tex += s.say.map(esc).join("\\par\n") + "\n\\end{minipage}\n";
  if (s.show) tex += `\\par\\vspace{3pt}{\\small\\color{muted}\\textbf{${L.show}:} ${esc(s.show)}}\n`;
  tex += `\\end{slidebox}\n`;
}

tex += `\\newpage\\sectionhead{${L.card}}\n${L.cardIntro}\\par\\vspace{4pt}
\\begin{tcolorbox}[colframe=uublue, colback=white, boxrule=1pt, arc=3pt, title={${L.about} ${all} ${L.min}}, colbacktitle=uublue, fonttitle=\\bfseries]
\\small\\begin{tabular}{@{}p{1.1cm}p{5.4cm}p{8.6cm}@{}}\n\\textbf{${L.slideCol}} & \\textbf{${L.topicCol}} & \\textbf{${L.remember}}\\\\\n`;
for (const s of S.slides) {
  const first = s.say[0].split(LANG === "bn" ? /(?<=[।?])\s/ : /(?<=[.?])\s/)[0];
  tex += `${num(s.n)} & ${esc(ttl(s))} & ${esc(first)}\\\\\n`;
}
tex += `\\end{tabular}\\end{tcolorbox}\n`;

tex += `\\newpage\\sectionhead{${L.qaHead}}\n${L.qaIntro}\\par\n\\small\\begin{longtable}{@{}p{0.7cm}>{\\raggedright\\arraybackslash}p{5.4cm}p{10.4cm}@{}}\n\\toprule\\textbf{${L.noCol}} & \\textbf{${L.qCol}} & \\textbf{${L.aCol}}\\\\\\midrule\\endhead\n`;
S.qa.forEach((x, i) => { tex += `${num(i + 1)} & \\textbf{${esc(x.q)}} & ${esc(x.a)}\\\\\n\\addlinespace[3pt]\n`; });
tex += `\\bottomrule\\end{longtable}\\normalsize\n\\begin{tcolorbox}[colback=soft, colframe=soft, arc=3pt]${L.unknown}\\end{tcolorbox}\n`;
tex += `\\sectionhead{${L.gloss}}\n\\begin{longtable}{@{}>{\\raggedright\\arraybackslash}p{5.2cm}p{11.4cm}@{}}\\toprule\\textbf{${L.wCol}} & \\textbf{${L.mCol}}\\\\\\midrule\\endhead\n`;
S.glossary.forEach(([w, m]) => { tex += `\\textbf{${esc(w)}} & ${esc(m)}\\\\\n`; });
tex += `\\bottomrule\\end{longtable}\n`;
const list = (items) => `\\begin{itemize}\n${items.map((t) => `\\item ${esc(t)}`).join("\n")}\n\\end{itemize}\n`;
tex += `\\newpage\\sectionhead{${L.tipsHead}}\n`;
tex += `\\begin{tcolorbox}[colframe=uublue, colback=white, title={${L.tBefore}}, colbacktitle=uublue, fonttitle=\\bfseries]${list(S.tips.before)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=green, colback=white, title={${L.tDuring}}, colbacktitle=green, fonttitle=\\bfseries]${list(S.tips.during)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=purple, colback=white, title={${L.tQ}}, colbacktitle=purple, fonttitle=\\bfseries]${list(S.tips.questions)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=warn, colback=warn!4, title={${L.tDont}}, colbacktitle=warn, fonttitle=\\bfseries]${list(S.tips.dont)}\\end{tcolorbox}\n`;
tex += `\\end{document}\n`;

fs.writeFileSync(path.join(OUTDIR, L.file), tex);
console.log("written", L.file, "total", all);
