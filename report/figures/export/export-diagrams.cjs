/*
 * Exports every TikZ diagram of the report as a stand-alone, transparent PDF and
 * PNG (for presentation slides). The PDFs are vector; PNGs are rendered at 300 dpi
 * with an alpha channel (no white background).
 *
 * Usage:  TECTONIC=<tectonic.exe> PYTHON=<python with pymupdf> \
 *         node export-diagrams.cjs            (run from report/figures/export)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const here = __dirname;
const figDir = path.resolve(here, '..');
const outDir = path.join(here, 'out');
fs.mkdirSync(outDir, { recursive: true });

const figures = ['context', 'architecture', 'usecase', 'er', 'statemachine',
  'seq_booking', 'seq_location', 'seq_session', 'rooms', 'deployment'];

const preamble = String.raw`\documentclass[border=6pt]{standalone}
\usepackage[T1]{fontenc}
\usepackage{times}
\usepackage[varqu,scaled=0.92]{zi4}
\usepackage{xcolor}
\usepackage{url}
\usepackage{tikz}
\input{diagram-style}
\DeclareUrlCommand\code{\urlstyle{tt}}
\newcommand{\cmd}[1]{\texttt{\detokenize{#1}}}
\begin{document}
`;

for (const f of figures) {
  const tex = path.join(figDir, `_export_${f}.tex`);
  fs.writeFileSync(tex, preamble + `\\input{${f}}\n\\end{document}\n`);
  const r = spawnSync(process.env.TECTONIC || 'tectonic', ['-X', 'compile', '--outdir', outDir, tex],
    { cwd: figDir, encoding: 'utf8' });
  fs.unlinkSync(tex);
  const pdf = path.join(outDir, `_export_${f}.pdf`);
  if (r.status !== 0 || !fs.existsSync(pdf)) { console.error('FAILED', f, r.stderr.slice(-800)); continue; }
  const finalPdf = path.join(outDir, `${f}.pdf`);
  fs.renameSync(pdf, finalPdf);
  const py = `import pymupdf,sys; d=pymupdf.open(sys.argv[1]); d[0].get_pixmap(dpi=300, alpha=True).save(sys.argv[2])`;
  const p = spawnSync(process.env.PYTHON || 'python', ['-c', py, finalPdf, path.join(outDir, `${f}.png`)], { encoding: 'utf8' });
  console.log(p.status === 0 ? 'exported' : 'PNG FAILED', f, p.stderr || '');
}
