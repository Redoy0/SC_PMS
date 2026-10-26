# Final Defense Report — Writing Plan

## Title
**Design and Implementation of a Smart Courier and Parcel Management System with Role-Based Access Control and Real-Time Parcel Tracking**

(The registered title in all project documents is "Design and Implementation of a Smart Courier and Parcel Management System"; the report keeps that as the main title. A subtitle may be dropped if the department requires the registered title verbatim.)

## Purpose and framing
An undergraduate software-engineering thesis that documents the problem-oriented design, implementation and evidence-based evaluation of SCPMS. The contribution is stated honestly as the **design, integration and verification of a working system** — no novel algorithm or research gap is claimed.

Engineering questions (answered in Ch. 6 from Ch. 5 evidence):
- **EQ1** How can a web system give customers, agents and administrators consistent, role-appropriate visibility of the parcel lifecycle?
- **EQ2** How can live parcel/agent status be propagated in real time without exposing data to unauthorised parties?
- **EQ3** To what extent does the implementation satisfy its functional and security requirements, as measured by executable tests?

## Evidence base
`docs/report_audit.md`; source code; `report/evidence/api-test/results.json` (66 executed tests); `report/evidence/static/*` (lint, build, audit); `report/evidence/screenshots/*.png` (13 genuine screenshots); verified literature (Crossref/DOI-checked) and official documentation.

## Chapter outline → template files

| Template file | Chapter | Sections | Evidence | Figures / tables |
|---|---|---|---|---|
| `frontmatters/*` | Front matter | Title, 2nd page, abstract, clearance, declaration, copyright, dedication, acknowledgment, symbols (none → removed), abbreviations | Progress report (names, IDs), placeholders for unknowns | — |
| `chapter1/introduction.tex` | 1 Introduction | 1.1 Overview/background, 1.2 Problem statement, 1.3 Motivation, 1.4 Aim and objectives (O1–O6), 1.5 Engineering questions, 1.6 Scope and boundaries, 1.7 Stakeholders, 1.8 Contribution, 1.9 Methodological overview, 1.10 Organisation | Proposal, code | Tab. objectives→components→evaluation |
| `chapter2/review.tex` | 2 Literature review | 2.1 Overview, 2.2 Last-mile logistics and courier operations, 2.3 Visibility, tracking and tracing, 2.4 Comparable courier/parcel systems, 2.5 Real-time web communication, 2.6 Access control and web security, 2.7 Mapping and geolocation, 2.8 Comparison and derived requirements, 2.9 Summary | Verified references | Tab. comparison of approach categories |
| `chapter3/methodology.tex` | 3 Analysis & design | 3.1 Overview, 3.2 Development methodology, 3.3 Stakeholders, 3.4 Functional requirements (FR-01…FR-17), 3.5 Non-functional requirements, 3.6 Use cases, 3.7 Architecture, 3.8 Database design, 3.9 Lifecycle state machine, 3.10 Sequence diagrams (booking→delivery, live location), 3.11 API & real-time design, 3.12 Security design, 3.13 Technology selection, 3.14 Constraints and assumptions, 3.15 Summary | Code | Figs: context, architecture, use case, ER, state machine, 2 sequence diagrams, room scoping. Tabs: FR, NFR, endpoints, socket events, tech choices |
| `chapter4/system.tex` | 4 Implementation | 4.1 Overview, 4.2 Environment, 4.3 Project structure, 4.4 Backend, 4.5 Authentication & sessions, 4.6 Authorisation, 4.7 Parcel lifecycle, 4.8 Real-time layer, 4.9 Location & maps, 4.10 QR-assisted pickup, 4.11 Notifications, 4.12 Analytics & export, 4.13 Frontend & i18n, 4.14 Validation, errors & hardening, 4.15 Deployment, 4.16 Challenges, 4.17 Summary | Code, screenshots | 10–12 screenshots; no source code — logic explained in prose, step lists and tables (transition checks, location handling, token rotation) |
| `chapter5/result.tex` | 5 Testing & evaluation | 5.1 Overview, 5.2 Evaluation objectives, 5.3 Test environment, 5.4 Strategy, 5.5 Static analysis & build, 5.6 Functional/integration API tests, 5.7 Security & access-control tests, 5.8 Real-time tests, 5.9 Performance observations, 5.10 Defects & findings, 5.11 Requirements traceability, 5.12 Not performed (usability, load, field), 5.13 Discussion, 5.14 Summary | `results.json`, static logs | Tabs: environment, test summary by area, detailed tests (appendix), latency, lint, defects, traceability |
| `chapter6/conclusion.tex` | 6 Conclusion | 6.1 Overview, 6.2 Summary, 6.3 Objectives achieved, 6.4 Answers to EQs, 6.5 Contributions, 6.6 Limitations, 6.7 Lessons learned, 6.8 Future work, 6.9 Final conclusion | Ch. 5 | Tab. objective achievement |
| `backmatters/references.bib` | References | IEEE style, BibTeX | Verified only | — |
| `appendix/appendix.tex` | Appendices | A Full test-case table, B API reference, C Installation & reproduction, D Environment variables (names only), E Source-code index | Evidence files | Long tables |

## Figures (all diagrams in TikZ — editable source in `report/figures/*.tex`)
Context diagram; layered architecture; use-case diagram; ER diagram; lifecycle state machine; booking→delivery sequence; live-location sequence; socket room scoping; deployment diagram. Screenshots from `report/evidence/screenshots` (genuine, local run).

## Testing & evaluation strategy
Executed: static analysis (ESLint), build, syntax check, dependency audit, 66 black-box API/socket tests on the unmodified backend, local latency sampling. Proposed but not executed (clearly marked): usability study (SUS), load test (k6/Artillery), field trial with agents' phones, cross-browser camera test, test against live deployment.

## Completion checklist
- [x] Audit and plan saved
- [x] Evidence collected and stored (`report/evidence/`)
- [x] Front matter with verified names; red `\placeholder{}` for unknowns
- [x] Six chapters with project-specific content
- [x] Diagrams compiled from TikZ (10 diagrams, `report/figures/*.tex`)
- [x] Bibliography with verified references only (40 entries, all cited)
- [x] Appendices A–D
- [x] README with build instructions (`report/README.md`)
- [x] Compiled PDF (Tectonic 0.17.0, 82 pages, no undefined references), visually inspected page by page
- [ ] **Team/supervisor to complete:** submission month/year, university e-mails, committee names and designations, supervisor confirmation (Rahaman vs Banik), copyright signatory, signatures, optional dedication/acknowledgments
- [ ] Optional: confirm compilation with pdfLaTeX (`latexmk -pdf`) if the department requires it
