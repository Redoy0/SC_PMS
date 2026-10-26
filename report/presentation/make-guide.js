// Writes guide/presenter-script.tex (printable presenter guide) from script.js.
const fs = require("fs");
const path = require("path");
const { slides, qa, glossary, tips, A, B } = require("./script.js");

const OUTDIR = process.argv[2];
fs.mkdirSync(OUTDIR, { recursive: true });

function esc(t) {
  let open = true;
  return String(t)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/"/g, () => { const r = open ? "``" : "''"; open = !open; return r; })
    .replace(/'/g, "'")
    .replace(/→/g, "$\\rightarrow$");
}
const col = (sp) => (sp === A ? "sharmin" : sp === B ? "tasnim" : "both");
const spName = (sp) => (sp === A ? "Sharmin Khatun" : sp === B ? "Tasnim Jahan Mim" : "Sharmin \\& Tasnim");
const toSec = (t) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const total = (who) => fmt(slides.filter((s) => s.speaker === who).reduce((a, s) => a + toSec(s.time), 0));
const all = fmt(slides.reduce((a, s) => a + toSec(s.time), 0));

let tex = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[scaled=0.95]{helvet}
\renewcommand{\familydefault}{\sfdefault}
\usepackage[margin=1.8cm,top=1.6cm,bottom=1.8cm]{geometry}
\usepackage{xcolor,graphicx,longtable,array,booktabs,enumitem}
\usepackage[most]{tcolorbox}
\usepackage{fancyhdr}
\usepackage[hidelinks]{hyperref}
\definecolor{uublue}{HTML}{1200FF}
\definecolor{sharmin}{HTML}{1200FF}
\definecolor{tasnim}{HTML}{059669}
\definecolor{both}{HTML}{7C3AED}
\definecolor{ink}{HTML}{10101B}
\definecolor{muted}{HTML}{4A4A5C}
\definecolor{soft}{HTML}{F4F5FB}
\definecolor{warn}{HTML}{DC2626}
\setlength{\parindent}{0pt}\setlength{\parskip}{4pt}
\setlist{itemsep=2pt,topsep=3pt,leftmargin=1.4em}
\renewcommand{\arraystretch}{1.25}
\pagestyle{fancy}\fancyhf{}
\fancyfoot[L]{\footnotesize\color{muted} SCPMS Final Defense \textperiodcentered{} Presenter Script}
\fancyfoot[R]{\footnotesize\color{muted} Page \thepage}
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
{\small\bfseries DEPARTMENT OF CSE \textperiodcentered{} UTTARA UNIVERSITY}\par\vspace{10pt}
{\huge\bfseries Presenter Script}\par\vspace{4pt}
{\Large Smart Courier and Parcel Management System (SCPMS)}\par\vspace{10pt}
{\normalsize B.Sc. Thesis Defense \textperiodcentered{} 27 October 2026}\par
\end{tcolorbox}
\vspace{10pt}
This script tells each presenter exactly \textbf{what to say}, \textbf{what to point at} and \textbf{when to hand over}. The words are simple on purpose: you do not need to be technical to present this. Read it aloud a few times, then speak naturally in your own words.

\vspace{6pt}
\begin{tcolorbox}[colback=soft, colframe=soft, arc=3pt]
\begin{tabular}{@{}p{4.1cm}p{1.9cm}p{5.6cm}p{2.8cm}@{}}
\textbf{Presenter} & \textbf{Slides} & \textbf{Topic} & \textbf{Time}\\
\textcolor{sharmin}{\textbf{Sharmin Khatun}} & 1--9 & Problem, goals, design & about ${total(A)} min\\
\textcolor{tasnim}{\textbf{Tasnim Jahan Mim}} & 10--18 & System, tests, conclusion & about ${total(B)} min\\
\textcolor{both}{\textbf{Both}} & 19 & Thank you and questions & about 0:30 min\\
\midrule
\textbf{Total talk} & 19 slides & & about ${all} min\\
\end{tabular}
\end{tcolorbox}

\vspace{4pt}
\sectionhead{How to use this script}
\begin{itemize}
\item \textbf{SAY} is what you speak. You may change the words, but keep the meaning.
\item \textbf{SHOW} tells you where to point on the slide.
\item \textbf{HANDOVER} is the sentence that passes the talk to your partner.
\item The same script is inside the PowerPoint file as \textbf{speaker notes}. In PowerPoint, choose \emph{Slide Show} $\rightarrow$ \emph{Use Presenter View}: the audience sees the slide, and you see your notes on the laptop.
\item Pages at the end give easy answers to likely questions, a word list and presenting tips.
\end{itemize}
\newpage
`;

// ---------- script ----------
tex += `\\sectionhead{The Script, Slide by Slide}\n`;
for (const s of slides) {
  const c = col(s.speaker);
  const title = `Slide ${s.n}: ${esc(s.title)} \\hfill ${spName(s.speaker)} \\textperiodcentered{} about ${s.time} min`;
  const img = path.join(OUTDIR, "slides", `s${String(s.n).padStart(2, "0")}.png`).replace(/\\/g, "/");
  tex += `\\begin{slidebox}{${c}}{${title}}\n`;
  tex += `\\begin{minipage}[t]{4.6cm}\\vspace{2pt}\\includegraphics[width=\\linewidth]{${img}}\\end{minipage}\\hfill\n`;
  tex += `\\begin{minipage}[t]{\\dimexpr\\linewidth-4.9cm}\\vspace{0pt}\n{\\small\\bfseries\\color{${c}} SAY}\\par\n`;
  tex += s.say.map((p) => {
    const m = p.match(/^(Sharmin|Tasnim):\s*(.*)$/);
    return m ? `\\textbf{\\color{${col(m[1])}}${m[1]}:} ${esc(m[2])}` : esc(p);
  }).join("\\par\n") + "\n\\end{minipage}\n";
  if (s.show) tex += `\\par\\vspace{3pt}{\\small\\color{muted}\\textbf{SHOW:} ${esc(s.show)}}\n`;
  if (s.handover) tex += `\\par\\vspace{3pt}\\colorbox{${c}!10}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep}{\\small\\textbf{\\color{${c}}HANDOVER:} ${esc(s.handover)}}}\n`;
  tex += `\\end{slidebox}\n`;
}

// ---------- quick cards ----------
tex += `\\newpage\\sectionhead{Pocket Cards (cut out and keep in your hand)}\n`;
tex += `If you get nervous, a glance at this card tells you where you are and what comes next.\\par\\vspace{4pt}\n`;
for (const who of [A, B]) {
  const c = col(who);
  tex += `\\begin{tcolorbox}[colframe=${c}, colback=white, boxrule=1pt, arc=3pt, title={${spName(who)} \\textendash{} about ${total(who)} min}, colbacktitle=${c}, fonttitle=\\bfseries]\n\\small\\begin{tabular}{@{}p{1.1cm}p{5.6cm}p{8.3cm}@{}}\n\\textbf{Slide} & \\textbf{Title} & \\textbf{Remember}\\\\\n`;
  for (const s of slides.filter((x) => x.speaker === who)) {
    const first = s.say[0].split(/(?<=\.)\s/)[0];
    tex += `${s.n} & ${esc(s.title)} & ${esc(first)}${s.handover ? " \\textbf{Then hand over.}" : ""}\\\\\n`;
  }
  tex += `19 & Thank You & ${who === A ? "Thank the supervisor and invite questions." : "Say \\emph{That brings us to the end... Sharmin will say our final words.}"}\\\\\n\\end{tabular}\n\\end{tcolorbox}\n`;
}

// ---------- Q&A ----------
tex += `\\newpage\\sectionhead{Likely Questions with Easy Answers}\n`;
tex += `Keep answers short and honest. The coloured name shows who should answer first; the partner can add a sentence.\\par\n`;
tex += `\\small\\begin{longtable}{@{}p{0.6cm}p{5.0cm}p{1.8cm}p{9.2cm}@{}}\n\\toprule\\textbf{No.} & \\textbf{Question} & \\textbf{Answers} & \\textbf{Simple answer}\\\\\\midrule\\endhead\n`;
qa.forEach((x, i) => {
  tex += `${i + 1} & \\textbf{${esc(x.q)}} & \\textcolor{${col(x.who)}}{\\textbf{${x.who}}} & ${esc(x.a)}\\\\\n\\addlinespace[3pt]\n`;
});
tex += `\\bottomrule\\end{longtable}\\normalsize\n`;
tex += "\\begin{tcolorbox}[colback=soft, colframe=soft, arc=3pt]\\textbf{If you do not know the answer}, say: " +
  esc("\"That is a good question. We have not done that in this version, but it is part of our future work.\"") +
  " Never guess numbers; say that the details are in the thesis report.\\end{tcolorbox}\n";

// ---------- glossary ----------
tex += `\\sectionhead{Simple Meanings of Technical Words}\n\\begin{longtable}{@{}p{4.2cm}p{12.4cm}@{}}\\toprule\\textbf{Word on the slide} & \\textbf{What it means}\\\\\\midrule\\endhead\n`;
glossary.forEach(([w, m]) => { tex += `\\textbf{${esc(w)}} & ${esc(m)}\\\\\n`; });
tex += `\\bottomrule\\end{longtable}\n`;

// ---------- tips ----------
const list = (items) => `\\begin{itemize}\n${items.map((t) => `\\item ${esc(t)}`).join("\n")}\n\\end{itemize}\n`;
tex += `\\newpage\\sectionhead{Presenting Tips}\n`;
tex += `\\begin{tcolorbox}[colframe=sharmin, colback=white, title=Before the defense, colbacktitle=sharmin, fonttitle=\\bfseries]${list(tips.before)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=tasnim, colback=white, title=While presenting, colbacktitle=tasnim, fonttitle=\\bfseries]${list(tips.during)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=both, colback=white, title=Answering questions, colbacktitle=both, fonttitle=\\bfseries]${list(tips.questions)}\\end{tcolorbox}\n`;
tex += `\\begin{tcolorbox}[colframe=warn, colback=warn!4, title={Do not say these things (they are not true or not proven)}, colbacktitle=warn, fonttitle=\\bfseries]${list(tips.dont)}\\end{tcolorbox}\n`;
tex += `\\end{document}\n`;

fs.writeFileSync(path.join(OUTDIR, "presenter-script.tex"), tex);
console.log("written", path.join(OUTDIR, "presenter-script.tex"), "total", all);
