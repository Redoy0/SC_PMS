// Writes <outdir>/presenter-script-bn.tex (Bangla presenter guide, XeLaTeX/Tectonic) from script_bn.js.
// Needs Bengali-capable fonts in <outdir>/fonts (regular + bold), e.g. Nirmala Text extracted from Nirmala.ttc.
const fs = require("fs");
const path = require("path");
const { slides, qa, glossary, tips, A, B, NAME, FULL, bn } = require("./script_bn.js");

const OUTDIR = process.argv[2];
const REG = process.argv[3] || "nirmala3.ttf";
const BOLD = process.argv[4] || "nirmala4.ttf";

function esc(t) {
  let open = true;
  return String(t)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/"/g, () => { const r = open ? "``" : "''"; open = !open; return r; });
}
const col = (sp) => (sp === A ? "sharmin" : sp === B ? "tasnim" : "both");
const toSec = (t) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
const fmt = (sec) => bn(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);
const total = (who) => fmt(slides.filter((s) => s.speaker === who).reduce((a, s) => a + toSec(s.time), 0));
const all = fmt(slides.reduce((a, s) => a + toSec(s.time), 0));

let tex = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage{fontspec}
\setmainfont{${REG}}[Path=./fonts/, BoldFont=${BOLD}, Script=Bengali]
\usepackage[margin=1.8cm,top=1.6cm,bottom=1.8cm]{geometry}
\usepackage{xcolor,graphicx,longtable,array,booktabs,enumitem}
\usepackage[most]{tcolorbox}
\usepackage{fancyhdr}
\usepackage[hidelinks]{hyperref}
\definecolor{uublue}{HTML}{1200FF}
\definecolor{sharmin}{HTML}{1200FF}
\definecolor{tasnim}{HTML}{059669}
\definecolor{both}{HTML}{7C3AED}
\definecolor{muted}{HTML}{4A4A5C}
\definecolor{soft}{HTML}{F4F5FB}
\definecolor{warn}{HTML}{DC2626}
\setlength{\parindent}{0pt}\setlength{\parskip}{5pt}
\linespread{1.12}
\setlist{itemsep=2pt,topsep=3pt,leftmargin=1.4em}
\renewcommand{\arraystretch}{1.3}
\pagestyle{fancy}\fancyhf{}
\fancyfoot[L]{\footnotesize\color{muted} SCPMS ফাইনাল ডিফেন্স \textperiodcentered{} প্রেজেন্টার স্ক্রিপ্ট (বাংলা)}
\fancyfoot[R]{\footnotesize\color{muted} পৃষ্ঠা \thepage}
\renewcommand{\thepage}{\bengalinum{page}}
\makeatletter
\def\bengalinum#1{\expandafter\@bengalidigits\number\value{#1}\@nil}
\def\@bengalidigits#1{\ifx#1\@nil\else\@bdigit{#1}\expandafter\@bengalidigits\fi}
\def\@bdigit#1{\ifcase#1 ০\or ১\or ২\or ৩\or ৪\or ৫\or ৬\or ৭\or ৮\or ৯\fi}
\makeatother
\renewcommand{\headrulewidth}{0pt}
\newtcolorbox{slidebox}[2]{enhanced, breakable, colback=white, colframe=#1, boxrule=0.9pt, arc=3pt,
  left=6pt, right=6pt, top=4pt, bottom=6pt, colbacktitle=#1, coltitle=white,
  fonttitle=\bfseries, title={#2}, before skip=8pt, after skip=8pt}
\newcommand{\sectionhead}[1]{\vspace{4pt}{\Large\bfseries\color{uublue}#1}\par\vspace{2pt}}
\begin{document}
`;

// ---------- cover ----------
tex += String.raw`
\thispagestyle{empty}
\begin{tcolorbox}[colback=uublue, colframe=uublue, arc=4pt, left=14pt, right=14pt, top=14pt, bottom=14pt]
\color{white}
{\small\bfseries সিএসই বিভাগ \textperiodcentered{} উত্তরা ইউনিভার্সিটি}\par\vspace{10pt}
{\huge\bfseries প্রেজেন্টার স্ক্রিপ্ট (বাংলা)}\par\vspace{4pt}
{\Large Smart Courier and Parcel Management System (SCPMS)}\par\vspace{10pt}
{\normalsize বিএসসি থিসিস ডিফেন্স \textperiodcentered{} ২৭ অক্টোবর ২০২৬}\par
\end{tcolorbox}
\vspace{8pt}
এই স্ক্রিপ্টে প্রত্যেক উপস্থাপকের জন্য লেখা আছে \textbf{কী বলবেন}, \textbf{স্লাইডের কোথায় দেখাবেন} এবং \textbf{কখন সঙ্গীর হাতে দেবেন}। ভাষা ইচ্ছা করেই সহজ রাখা হয়েছে, তাই এটি উপস্থাপন করতে কারিগরি জ্ঞানের দরকার নেই। কয়েকবার জোরে পড়ে অনুশীলন করুন, তারপর নিজের ভাষায় স্বাভাবিকভাবে বলুন।

\begin{tcolorbox}[colback=warn!5, colframe=warn!60, arc=3pt]
\small\textbf{খেয়াল রাখুন:} স্লাইডগুলো ইংরেজিতে। বোর্ড যদি ইংরেজিতে উপস্থাপন করতে বলে, তাহলে ইংরেজি স্ক্রিপ্টটি ব্যবহার করুন; এই বাংলা সংস্করণ বিষয়টি ভালোভাবে বোঝা ও অনুশীলনের জন্য। দুটি স্ক্রিপ্টে স্লাইড নম্বর, বক্তা আর সময় একই।
\end{tcolorbox}

\begin{tcolorbox}[colback=soft, colframe=soft, arc=3pt]
\begin{tabular}{@{}p{4.3cm}p{2.0cm}p{5.4cm}p{3.0cm}@{}}
\textbf{উপস্থাপক} & \textbf{স্লাইড} & \textbf{বিষয়} & \textbf{সময়}\\
\textcolor{sharmin}{\textbf{${FULL.Sharmin}}} & ১--৯ & সমস্যা, লক্ষ্য, ডিজাইন & প্রায় ${total(A)} মিনিট\\
\textcolor{tasnim}{\textbf{${FULL.Tasnim}}} & ১০--১৮ & সিস্টেম, টেস্ট, উপসংহার & প্রায় ${total(B)} মিনিট\\
\textcolor{both}{\textbf{দুজনে}} & ১৯ & ধন্যবাদ ও প্রশ্নোত্তর & প্রায় ০:৩০ মিনিট\\
\midrule
\textbf{মোট সময়} & ১৯টি স্লাইড & & প্রায় ${all} মিনিট\\
\end{tabular}
\end{tcolorbox}

\sectionhead{এই স্ক্রিপ্ট কীভাবে ব্যবহার করবেন}
\begin{itemize}
\item \textbf{বলুন} অংশে যা বলবেন তা লেখা আছে। শব্দ বদলাতে পারেন, তবে অর্থ একই রাখুন।
\item \textbf{দেখান} অংশ বলে দেয় স্লাইডের কোথায় আঙুল বা হাত দিয়ে দেখাবেন।
\item \textbf{হস্তান্তর} হলো সেই বাক্য, যা দিয়ে আপনি সঙ্গীর হাতে প্রেজেন্টেশন তুলে দেবেন।
\item একই বাংলা স্ক্রিপ্ট \textbf{স্পিকার নোট} হিসেবে আলাদা একটি PowerPoint ফাইলে আছে। PowerPoint-এ \emph{Slide Show} $\rightarrow$ \emph{Use Presenter View} বেছে নিলে দর্শকরা শুধু স্লাইড দেখবে, আর আপনি ল্যাপটপে নিজের নোট দেখবেন।
\item শেষের পৃষ্ঠাগুলোতে সম্ভাব্য প্রশ্নের সহজ উত্তর, কারিগরি শব্দের অর্থ আর উপস্থাপনের পরামর্শ আছে।
\end{itemize}
\newpage
`;

// ---------- script ----------
tex += `\\sectionhead{স্লাইড অনুযায়ী স্ক্রিপ্ট}\n`;
for (const s of slides) {
  const c = col(s.speaker);
  const title = `স্লাইড ${bn(s.n)}: ${esc(s.titleBn)} \\hfill ${FULL[s.speaker]} \\textperiodcentered{} প্রায় ${bn(s.time)} মিনিট`;
  const img = path.join(OUTDIR, "slides", `s${String(s.n).padStart(2, "0")}.png`).replace(/\\/g, "/");
  tex += `\\begin{slidebox}{${c}}{${title}}\n`;
  tex += `\\begin{minipage}[t]{4.6cm}\\vspace{2pt}\\includegraphics[width=\\linewidth]{${img}}\\par{\\raggedright\\scriptsize\\color{muted} স্লাইডের শিরোনাম: ${esc(s.title)}\\par}\\end{minipage}\\hfill\n`;
  tex += `\\begin{minipage}[t]{\\dimexpr\\linewidth-4.9cm}\\vspace{0pt}\n{\\small\\bfseries\\color{${c}} বলুন}\\par\n`;
  tex += s.say.map((p) => {
    const m = p.match(/^(Sharmin|Tasnim):\s*(.*)$/);
    return m ? `\\textbf{\\color{${col(m[1])}}${NAME[m[1]]}:} ${esc(m[2])}` : esc(p);
  }).join("\\par\n") + "\n\\end{minipage}\n";
  if (s.show) tex += `\\par\\vspace{3pt}{\\small\\color{muted}\\textbf{দেখান:} ${esc(s.show)}}\n`;
  if (s.handover) tex += `\\par\\vspace{3pt}\\colorbox{${c}!10}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep}{\\small\\textbf{\\color{${c}}হস্তান্তর:} ${esc(s.handover)}}}\n`;
  tex += `\\end{slidebox}\n`;
}

// ---------- pocket cards ----------
tex += `\\newpage\\sectionhead{পকেট কার্ড (কেটে হাতে রাখুন)}\n`;
tex += `নার্ভাস লাগলে এই কার্ডে এক নজর তাকালেই বুঝবেন আপনি কোথায় আছেন আর এরপর কী আসছে।\\par\\vspace{4pt}\n`;
for (const who of [A, B]) {
  const c = col(who);
  tex += `\\begin{tcolorbox}[colframe=${c}, colback=white, boxrule=1pt, arc=3pt, title={${FULL[who]} \\textendash{} প্রায় ${total(who)} মিনিট}, colbacktitle=${c}, fonttitle=\\bfseries]\n\\small\\begin{tabular}{@{}p{1.2cm}p{5.0cm}p{8.4cm}@{}}\n\\textbf{স্লাইড} & \\textbf{বিষয়} & \\textbf{মনে রাখুন (শুরুর কথা)}\\\\\n`;
  for (const s of slides.filter((x) => x.speaker === who)) {
    const first = s.say[0].split(/(?<=[।?])\s/)[0];
    tex += `${bn(s.n)} & ${esc(s.titleBn)} & ${esc(first)}${s.handover ? " \\textbf{তারপর হস্তান্তর করুন।}" : ""}\\\\\n`;
  }
  tex += `১৯ & ধন্যবাদ & ${who === A ? "সুপারভাইজারকে ধন্যবাদ দিন এবং প্রশ্ন আহ্বান করুন।" : "বলুন: \\emph{এখানেই আমাদের প্রেজেন্টেশন শেষ... শারমিন আমাদের শেষ কথাগুলো বলবে।}"}\\\\\n\\end{tabular}\n\\end{tcolorbox}\n`;
}

// ---------- Q&A ----------
tex += `\\newpage\\sectionhead{সম্ভাব্য প্রশ্ন ও সহজ উত্তর}\n`;
tex += `উত্তর সংক্ষিপ্ত ও সৎ রাখুন। রঙিন নামটি বোঝায় কে প্রথমে উত্তর দেবেন; সঙ্গী চাইলে একটি বাক্য যোগ করতে পারেন।\\par\n`;
tex += `\\small\\begin{longtable}{@{}p{0.7cm}p{5.0cm}p{1.7cm}p{9.2cm}@{}}\n\\toprule\\textbf{নং} & \\textbf{প্রশ্ন} & \\textbf{উত্তর দেবেন} & \\textbf{সহজ উত্তর}\\\\\\midrule\\endhead\n`;
qa.forEach((x, i) => {
  tex += `${bn(i + 1)} & \\textbf{${esc(x.q)}} & \\textcolor{${col(x.who)}}{\\textbf{${NAME[x.who]}}} & ${esc(x.a)}\\\\\n\\addlinespace[3pt]\n`;
});
tex += `\\bottomrule\\end{longtable}\\normalsize\n`;
tex += "\\begin{tcolorbox}[colback=soft, colframe=soft, arc=3pt]\\textbf{উত্তর জানা না থাকলে} বলুন: " +
  esc("\"খুব ভালো প্রশ্ন। এই সংস্করণে আমরা তা করিনি, তবে এটি আমাদের ভবিষ্যৎ কাজের অংশ।\"") +
  " কখনো সংখ্যা অনুমান করবেন না; বলুন যে বিস্তারিত থিসিস রিপোর্টে আছে।\\end{tcolorbox}\n";

// ---------- glossary ----------
tex += `\\sectionhead{কারিগরি শব্দের সহজ অর্থ}\n\\begin{longtable}{@{}p{5.2cm}p{11.4cm}@{}}\\toprule\\textbf{স্লাইডের শব্দ} & \\textbf{এর অর্থ}\\\\\\midrule\\endhead\n`;
glossary.forEach(([w, m]) => { tex += `\\textbf{${esc(w)}} & ${esc(m)}\\\\\n`; });
tex += `\\bottomrule\\end{longtable}\n`;

// ---------- tips ----------
const list = (items) => `\\begin{itemize}\n${items.map((t) => `\\item ${esc(t)}`).join("\n")}\n\\end{itemize}\n`;
tex += `\\newpage\\sectionhead{উপস্থাপনের পরামর্শ}\n`;
tex += `\\begin{tcolorbox}[colframe=sharmin, colback=white, title=ডিফেন্সের আগে, colbacktitle=sharmin, fonttitle=\\bfseries]${list(tips.before)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=tasnim, colback=white, title=উপস্থাপনের সময়, colbacktitle=tasnim, fonttitle=\\bfseries]${list(tips.during)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=both, colback=white, title=প্রশ্নের উত্তর দেওয়ার সময়, colbacktitle=both, fonttitle=\\bfseries]${list(tips.questions)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=warn, colback=warn!4, title={এই কথাগুলো বলবেন না (এগুলো সত্য নয় বা প্রমাণিত নয়)}, colbacktitle=warn, fonttitle=\\bfseries]${list(tips.dont)}\\end{tcolorbox}\n`;
tex += `\\end{document}\n`;

fs.writeFileSync(path.join(OUTDIR, "presenter-script-bn.tex"), tex);
console.log("written", path.join(OUTDIR, "presenter-script-bn.tex"), "total", all);
