# SCPMS Final Defense Report (LaTeX)

LaTeX source of the B.Sc. final defense report **"Design and Implementation of a Smart Courier and Parcel Management System"**. It is adapted from the Uttara University thesis template in `../../../Hepatocellular Carcinoma Nafi X Asif/`. That template is left unchanged.

## Layout

| Path | Content |
|---|---|
| `main.tex` | Entry point (class `classes/uuthesis.cls`, A4, 12 pt, 3 cm margins, IEEE bibliography) |
| `frontmatters/` | Title page, second page, abstract, clearance, declaration, copyright, dedication, acknowledgment, abbreviations |
| `chapter1/introduction.tex` … `chapter6/conclusion.tex` | The six chapters (file names kept from the template) |
| `appendix/appendix.tex` | Appendices A–D (test cases, API reference, reproduction, source index) |
| `backmatters/references.bib` | BibTeX database (verified entries only) |
| `figures/*.tex` | TikZ sources of all diagrams (editable, derived from the code) |
| `figures/diagram-style.tex` | Shared diagram palette, node styles, icons and sequence-diagram helpers (customer = blue, agent = green, admin = purple, public = amber, system = indigo, real-time = cyan, data = teal) |
| `figures/export/out/` | Every diagram as a stand-alone **transparent** PNG (300 dpi) and vector PDF for slides; regenerate with `node figures/export/export-diagrams.cjs` (needs `TECTONIC` and a `PYTHON` with PyMuPDF) |
| `figures/screenshots/` | Screenshots of the running system (copied from `evidence/screenshots/`) |
| `tables/*.tex` | **Generated** tables (test cases, test summary, latency). Do not edit by hand |
| `evidence/api-test/` | Test harness `run-api-tests.cjs`, results `results.json`, redacted `server.log`, table generator `make-tables.cjs` |
| `evidence/screenshots/` | Screenshot capture script and original PNGs |
| `evidence/static/` | ESLint, Vite build and `npm audit` outputs |

## Building the PDF

The sources compile with pdfLaTeX, XeLaTeX or Tectonic. The bibliography uses BibTeX with `IEEEtran.bst`.

```bash
# TeX Live / MiKTeX
latexmk -pdf main.tex
# or manually
pdflatex main && bibtex main && pdflatex main && pdflatex main

# Tectonic (used to produce the delivered PDF; runs BibTeX automatically)
tectonic -X compile main.tex
```

Packages used: fontenc, times, geometry, xcolor, amsmath, graphicx, float, caption, subcaption, multirow, array, tabularx, longtable, booktabs, setspace, parskip, ragged2e, tcolorbox, enumitem, xurl, tikz, titlesec, tocloft, hyperref, bookmark. All are in standard TeX Live or MiKTeX installations.

The delivered PDF `SCPMS_Final_Defense_Report.pdf` was built with **Tectonic 0.17.0** on Windows 11 on 19 October 2026, because no TeX distribution was installed on the authoring machine. It has not been compiled with pdfLaTeX. If your department requires pdfLaTeX, run `latexmk -pdf` once and check the output.

## Regenerating evidence

See Appendix C of the report. In short:

```bash
(cd "$DEPS" && npm install mongodb-memory-server@10.1.4 socket.io-client@4.8.1 puppeteer-core@23.11.1)
TEST_DEPS="$DEPS" node report/evidence/api-test/run-api-tests.cjs backend report/evidence/api-test
node report/evidence/api-test/make-tables.cjs      # rewrites report/tables/*.tex
```

The harness never loads `backend/.env`. It uses an in-memory MongoDB and sends no e-mail.

## Changes from the original template

- `\include{chapters/appendix}` referred to a non-existent folder. The appendices now live in `appendix/appendix.tex` and use the class's `\appendix` (numbered "Appendix A …").
- Duplicate package loads (`hyperref`, `float`, `titlesec`) were removed, and `hyperref` is loaded last.
- Chapter numbering was inconsistent: the heading printed "Chapter 1:", the class head printed "Chapter I" and the TOC printed "CHAPTER I:". It now uses one convention: "Chapter 1" in headings and "CHAPTER 1:" in the TOC, with arabic section, figure and table numbers.
- `\addcontentsline` is placed after `\cleardoublepage\phantomsection`, so TOC page numbers of unnumbered pages are correct. Previously it came before `\chapter*` and after `\bibliography`.
- `breakurl` (incompatible with pdfLaTeX) was replaced by `xurl`. Unused `lipsum`, `algorithm*`, `multicol` and `amssymb` were dropped, and the stray `\` line before the main matter was removed.
- The "Symbols" page was dropped because the report uses no mathematical notation. The abbreviation list was rewritten for this project.
- Float placement parameters and `\emergencystretch` were relaxed to avoid half-empty float pages and overfull lines.
- Added macros: `\code{}` (breakable typewriter text), `\cmd{}` (typewriter text with spaces), and `\placeholder{}`. The last prints **red, bracketed** text for administrative data that could not be verified.

## Placeholders still to be completed

Search for `\placeholder` (shown in red in the PDF):

- Submission month and year (`\submissiondate` in `main.tex`); copyright year.
- Students' university e-mail addresses (`frontmatters/2ndpage.tex`).
- Coordinator, examiner and head of department names and designations (`frontmatters/clearance.tex`).
- Confirmation of the supervisor's name and designation. The title-defense slides name *Pranta Banik, Lecturer*, while the progress report and final slides name *Dr. Md. Obaidur Rahaman, Professor*. The report uses the latter.
- Name of the student signing the copyright form; signatures and dates.
- Optional dedication and personal acknowledgments.

See `../docs/report_audit.md` for the full evidence audit.
