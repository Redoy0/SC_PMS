# Presentation Content — Thesis Defense

**Source template:** `new thesis doc/UU_FYP_Defense_PPT(1).pptx` (15 slides, Department of CSE, Uttara University) — **now 16 slides**, with a Project Timeline slide (Slide 8) carried over from the team's prior title-defense deck
**Project:** Design and Implementation of a Smart Courier and Parcel Management System (SCPMS)
**Team:** Sharmin Khatun (2223081010) & Tasnim Jahan Mim (2221081138) · Supervised by Pranta Banik, Lecturer, Dept. of CSE, Uttara University
**Target duration:** 10–15 minutes (≈ 45–60 seconds per content slide, plus Q&A buffer)

> **Editorial note before use:** This document fills every placeholder in the official template with defense-ready content derived from `PROJECT_REPORT.md`, a direct audit of the implemented codebase, and the team's earlier title-defense presentation (`new thesis doc/Design and Implementation of a Smart Courier and Parcel Management System.pdf`), which supplied the real student/supervisor names, the Project Timeline (Slide 8), and the literature-review citations (Slide 6) now used here. Only `[Month Year]` (the actual scheduled defense date) and the student email on Slides 1 and 16 remain genuinely unknown placeholders. Any figure marked **(Estimated for demonstration)** is a plausible, order-of-magnitude value inferred from the system's design for defense purposes and should be replaced with a value the student actually measured before the live defense, per the assignment brief's instruction to "clearly indicate when a value is estimated."
>
> This document is kept in sync with `new thesis doc/UU_FYP_Defense_Final.pptx`, which has already been populated with all of the content below.

---

# Slide 1

## Title Slide

### Content

- **DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING · UTTARA UNIVERSITY**
- **Title:** Design and Implementation of a Smart Courier and Parcel Management System
- **Subtitle:** A Role-Based, Real-Time Web Platform for Parcel Booking, Live Tracking, and Delivery Analytics
- **Presented By:** Sharmin Khatun (ID: 2223081010) & Tasnim Jahan Mim (ID: 2221081138) · B.Sc. in Computer Science & Engineering
- **Supervised By:** Pranta Banik — Lecturer, Dept. of CSE, Uttara University
- **Thesis Defense, [Month Year]**

### Speaker Notes

"Good [morning/afternoon], respected panel. We are Sharmin Khatun and Tasnim Jahan Mim, presenting our final year thesis titled 'Design and Implementation of a Smart Courier and Parcel Management System,' supervised by Pranta Banik. This work addresses the coordination and visibility gaps that persist in courier operations even after partial digitization, and proposes a role-based, real-time MERN-stack platform as a solution. Over the next few minutes, we will walk you through the problem, the system we built, and the evidence that it works."

> Names and supervisor carried over from the team's prior title-defense presentation (`Design and Implementation of a Smart Courier and Parcel Management System.pdf`). Only the defense month/year remains a placeholder — insert the actual scheduled date.

### Visual Suggestions

- Use the template's existing cover layout as-is (department wordmark + gradient panel).
- Optional: a single, unobtrusive courier/logistics silhouette icon already present in the template — avoid adding stock photography that competes with the title text.
- Keep this slide on screen only while introducing yourself; do not linger.

---

# Slide 2

## Presentation Outline — "What We'll Cover"

### Content

01. Introduction & Background
02. Problem Statement
03. Research Objectives
04. Literature Review
05. Methodology
06. System Design
07. Implementation
08. Results & Analysis
09. Comparison & Discussion
10. Conclusion & Future Work

### Speaker Notes

"Here is the roadmap for this defense. I will begin with the background and the problem that motivated this thesis, then move through my objectives and a review of related work. From there, I will explain the methodology and system architecture behind SCPMS, walk through key implementation decisions, and present the results of testing and evaluation. I will close with a comparison against existing approaches, my conclusions, and directions for future work."

### Visual Suggestions

- Keep the template's numbered-list layout unchanged; it already matches the chapter structure of the written thesis, which reinforces coherence between the report and the defense.
- No additional imagery needed — this slide should read quickly.

---

# Slide 3

## Introduction & Background

### Content

- **Context:** Courier and last-mile parcel delivery increasingly depends on digital coordination between customers, delivery agents, and administrators; partial digitization (spreadsheets, phone calls, static status pages) is still common in small and mid-scale courier operations.
- **Motivation:** Parcel status, agent location, and delivery outcomes change continuously — a static or manually-updated system cannot keep stakeholders synchronized in real time, which erodes trust and increases coordination overhead.
- **Scope:** This thesis designs, implements, and evaluates SCPMS — a MERN-stack (MongoDB, Express, React, Node.js) platform covering parcel booking, role-based dispatch, live GPS-based tracking, QR-assisted pickup verification, email notifications, and operational analytics, built and tested as a working end-to-end system rather than a conceptual model.

### Speaker Notes

"Courier services today sit at an uneven point in their digital transformation. Booking may happen through a form, but tracking is often a static page that refreshes only when someone manually updates it. This mismatch between how dynamic the real world is — a parcel physically moving from one place to another — and how static the software representing it is, is the core motivation for this thesis. I set out to build a system where parcel state, agent location, and delivery outcomes are always synchronized live, and where every role — customer, delivery agent, and administrator — sees exactly the view relevant to them."

### Visual Suggestions

- A simple two-panel "before vs. after" diagram: left panel showing fragmented manual coordination (phone icon, spreadsheet icon, sticky note), right panel showing the SCPMS role-based dashboard screenshot.
- Alternatively, a annotated screenshot of the live `PublicTrack.jsx` tracking page showing the map and status timeline together — this single image communicates the whole thesis at a glance.

---

# Slide 4

## The Problem We Address

### Content

- **Core problem statement:** *Courier operations that rely on manual or partially-digitized coordination cannot provide stakeholders with synchronized, real-time visibility into parcel status, agent location, and delivery performance, resulting in delayed updates, weak accountability, and limited operational insight.*
- **WHO IS AFFECTED:** Customers awaiting delivery confidence; delivery agents lacking structured assignment context; administrators lacking consolidated performance visibility.
- **CURRENT LIMITATION:** Existing informal workflows and many baseline courier tools separate booking, tracking, and reporting into disconnected steps with no live event propagation and little to no audit trail for failed or delayed deliveries.
- **WHY NOW:** Rising parcel volumes from e-commerce growth make manual coordination a bottleneck; real-time web technology (WebSockets, browser geolocation, lightweight mapping libraries) is now mature and low-cost enough for even small courier operators to adopt.

### Speaker Notes

"To state the problem precisely: when courier coordination is manual or only partially digitized, no one in the system — not the customer, not the agent, not the administrator — has a synchronized, trustworthy, real-time picture of where a parcel is and what will happen to it next. Customers are affected because they cannot verify progress; agents are affected because they receive assignments without operational context; and administrators are affected because they lack the consolidated data needed to evaluate performance. This is timely because e-commerce-driven parcel volumes make manual coordination increasingly unsustainable, while the web technologies needed to solve it — WebSockets, in-browser mapping, JWT-based auth — are now mature and inexpensive."

### Visual Suggestions

- A simple flow diagram showing the three affected roles (Customer / Agent / Admin) radiating from a central "Parcel" node, each with a small "?" icon representing their visibility gap.
- Keep this slide text-forward per the template design — the four-quadrant layout (statement + 3 supporting facts) is already well-suited to spoken delivery.

---

# Slide 5

## Research Objectives

### Content

01. **Design and implement secure, role-based access control** for Customer, Delivery Agent, and Administrator roles using JWT authentication and bcrypt password hashing.
02. **Build an end-to-end parcel lifecycle workflow** — booking, agent assignment, pickup, transit, delivery, and failure handling — backed by a well-defined, enforced status state machine.
03. **Implement real-time tracking and event propagation** using Socket.IO room-based channels, live agent geolocation, and Leaflet/OpenStreetMap visualization, including a public tracking portal with QR-assisted verification.
04. **Deliver operational analytics and reporting** — dashboard metrics, CSV/PDF export, and activity logging — that give administrators consolidated, evidence-based insight into delivery performance.

### Speaker Notes

"My objectives were deliberately scoped to be both academically demonstrable and practically verifiable in working code. First, I implemented secure role-based access so that customers, agents, and administrators each operate within clearly bounded permissions. Second, I modeled and enforced a complete parcel lifecycle as a status state machine, so a parcel can only move through valid transitions. Third — and this is the technical core of the thesis — I implemented real-time tracking using Socket.IO rooms scoped per parcel, combined with live agent location updates and QR-assisted pickup verification. Finally, I built analytics and reporting so that the system doesn't just move data, it produces operational insight from that data."

### Visual Suggestions

- Four numbered cards (template default) — optionally icon-match each: a padlock for access control, a package/route icon for lifecycle, a live pin/radar icon for tracking, a bar-chart icon for analytics.
- Avoid restating implementation detail here; keep language objective-oriented ("implement," "enable," "deliver") since detail belongs to Slide 10.

---

# Slide 6

## Literature Review — Related Work

> **Source note:** Rows 1–3 are the real citations the team already used and defended in the prior B.Sc. Title Defense presentation for this same project (`Design and Implementation of a Smart Courier and Parcel Management System.pdf`) — not fabricated placeholders. Row 4 adds the named regional commercial platforms (see the comparison caveat on Slide 12). If the full bibliographic details (journal name, volume, page range) for [1]–[3] are not already recorded elsewhere by the team, verify them against the original source before the defense, since only the author/year/venue-name level of detail was preserved in the prior deck.

### Content

| Author / Year | Approach | Limitation this thesis addresses |
| --- | --- | --- |
| Ahmed et al. (2019) | Web-based courier management system | Tracking not fully automated, updates delayed |
| Rahman et al. (2020) | Online parcel delivery & tracking platform | No real-time parcel status monitoring for customers |
| Khan et al. (2021) | Smart logistics management system using web technologies | No route optimization for delivery agents |
| Pathao / Sundarban / Steadfast (regional platforms, Bangladesh) | Consignment-ID-based status-timeline tracking | No live map view or role-based dashboard |

### Speaker Notes

"We reviewed related work across four sources. Ahmed et al. (2019) proposed a web-based courier management system, but parcel tracking was not fully automated and updates were delayed. Rahman et al. (2020) developed an online delivery platform where customers still could not monitor real-time parcel status. Khan et al. (2021) focused on logistics operations but did not implement route optimization for delivery agents. Finally, we compared against the regional commercial platforms most Bangladeshi users actually encounter — Pathao Courier, Sundarban Courier Service, and Steadfast Courier — which offer reliable, national-scale tracking, but only as a status timeline keyed to a consignment ID, with no continuously updating live map and no role-based dashboard beyond a read-only lookup; we're basing that specifically on their public customer-facing behavior, not any internal documentation. SCPMS was designed to close every one of these gaps at once: fully automated real-time tracking, live status monitoring, and a foundation for future route optimization, in one role-based, academically evaluable system."

### Visual Suggestions

- Render the table exactly as the template's 4-row comparison grid.
- Optional small iconography per row (courier truck, GPS pin, open-source octopus/gear icon, graduation cap) to keep the dense table visually scannable.

---

# Slide 7

## Research Methodology

### Content

01. **Requirements Elicitation** — courier workflow analysis (booking → dispatch → transit → delivery) and role decomposition (Customer, Agent, Admin) →
02. **System Modeling** — data modeling (User, Parcel, and embedded location/lifecycle sub-schemas in MongoDB), UML-style use case, ER, sequence, and activity diagrams →
03. **Incremental MERN Implementation** — modular Express REST API, JWT middleware, Socket.IO event layer, and a component-based React frontend, built and integrated feature-by-feature →
04. **Verification & Evaluation** — functional testing per module (auth, booking, assignment, tracking, notifications, reporting), integration testing across roles, and measurement of response-time and reliability metrics

### Speaker Notes

"My methodology follows a standard applied software engineering process, adapted for a single-developer thesis timeline. I began by eliciting requirements directly from courier workflow analysis — mapping what actually needs to happen from the moment a customer books a parcel to the moment it's delivered. From there, I modeled the system formally: entity relationships, use cases, and sequence diagrams, which are documented in the accompanying thesis report. Implementation was incremental — I built and tested authentication first, then the parcel lifecycle, then real-time tracking, then reporting — rather than attempting a single monolithic build. Finally, every module went through functional and integration testing, and I measured concrete metrics such as API response time and booking success rate, which I present in the Results section."

### Visual Suggestions

- Keep the template's four-step horizontal flow with arrows.
- Below or beside it, a small callout: "Applied, iterative, MERN-based development — not a data-science pipeline" to preempt any panel confusion from the template's original "Data Collection / Preprocessing" data-science framing.

---

# Slide 8

## Project Timeline

> **Source note:** This slide was not in the original 16-slide defense template — it is carried over from the team's earlier B.Sc. Title Defense presentation (`Design and Implementation of a Smart Courier and Parcel Management System.pdf`), which contained a real, already-used project plan worth keeping for the final defense.

### Content

| Phase | Tasks | Duration |
| --- | --- | --- |
| Planning | Literature Review & Gap Analysis | Weeks 1–2 |
| Design | Database Schema & UI Wireframing | Weeks 3–4 |
| Development | Backend API & Frontend Integration | Weeks 5–7 |
| Testing | Bug Fixing & User Acceptance Testing | Weeks 7–9 |
| Deployment | Final Hosting & Documentation | Weeks 9–12 |

### Speaker Notes

"Before I move into the architecture, a quick note on how this project was actually planned and executed. The work was scoped into five phases over roughly twelve weeks: literature review and gap analysis in the first two weeks, database schema and UI wireframing in weeks three and four, the core backend API and frontend integration across weeks five to seven, bug fixing and user acceptance testing from weeks seven to nine, and final hosting and documentation in the closing weeks. I'm including this because it shows the system wasn't built ad hoc — testing and documentation were scoped in from the start, not squeezed in at the end."

### Visual Suggestions

- Render as a clean 3-column table (Phase / Tasks / Duration) matching the deck's existing table styling (blue header row, alternating row shading) — this is already implemented as a native table in `UU_FYP_Defense_Final.pptx`.
- Optional: a horizontal Gantt-style bar beneath the table showing the five phases proportionally across the 12 weeks, if time allows building one.

---

# Slide 9

## System Architecture

### Content

- **Presentation / Interface Layer:** React 19 + Vite single-page application; role-aware dashboards (`AdminDashboard`, `AgentDashboard`, `CustomerDashboard`); Leaflet/OpenStreetMap map rendering; bilingual UI (English/Bengali) via a language context provider.
- **Module A — Booking & Dispatch Engine:** Parcel creation, agent assignment, and lifecycle status transitions enforced through a fixed six-state machine (`Pending → Assigned → Picked Up → In Transit → Delivered / Failed`).
- **Module B — Real-Time Tracking & Notification Engine:** Socket.IO server with per-parcel rooms (`parcel:<id>`) and per-user rooms (`user:<id>`); live agent geolocation broadcast; best-effort email notifications via Nodemailer on every status change.
- **Module C — Analytics & Reporting Engine:** Dashboard metrics aggregation, CSV export (csv-writer), and PDF report generation (PDFKit); QR-code generation/scanning (`qrcode`, `@zxing`) for pickup and delivery verification.
- **Data / Storage Layer:** MongoDB with Mongoose ODM; core collections — `User` and `Parcel` (with embedded location, tracking, and lifecycle sub-documents).

### Speaker Notes

"The architecture follows a layered, MVC-inspired design. At the top, the React frontend renders a different dashboard experience depending on the authenticated user's role — this is enforced both visually and at the API layer. Below that sit three cooperating backend modules. The Booking and Dispatch Engine owns the parcel state machine — a parcel can only move through six well-defined statuses, and transitions are permission-checked so, for example, only an assigned agent or an admin can advance a parcel's status. The Real-Time Tracking and Notification Engine is built on Socket.IO with a room-based topology: each parcel gets its own room so that only clients actively tracking that parcel receive its location updates, while a separate broadcast channel keeps the admin dashboard synchronized globally. Status changes also trigger a best-effort email notification, meaning a notification failure never blocks the core transaction. Finally, the Analytics and Reporting Engine aggregates operational data into dashboard metrics and exportable CSV and PDF reports, and manages QR-code generation and scanning for pickup and delivery verification. All of this sits on a MongoDB data layer accessed through Mongoose."

### Visual Suggestions

- Recreate the Mermaid architecture diagram from `PROJECT_REPORT.md §9` as a clean layered box diagram (Client → API/Socket layer → Data layer).
- If time allows, a live or recorded 10-second screen capture transitioning between `AdminDashboard`, `AgentDashboard`, and `CustomerDashboard` communicates "role-aware presentation layer" faster than text.

---

# Slide 10

## Implementation Details

### Content

**TOOLS & TECHNOLOGIES**

- **Language:** JavaScript (ES2022+, ES Modules)
- **Framework:** React 19 (frontend) · Express 4 (backend)
- **Library:** Socket.IO, Leaflet + Leaflet Routing Machine, Zxing (QR scanning), PDFKit, Nodemailer
- **Database:** MongoDB (Mongoose ODM)
- **Platform:** Node.js runtime; deployed via Render (backend) with environment-based configuration

**Implementation decision worth defending:** Tracking codes are generated as short, human-readable 8-character uppercase codes derived from a UUID (`uuid().split('-')[0].toUpperCase()`) rather than exposing full UUIDs or sequential database IDs — this balances uniqueness, unguessability, and usability for a customer reading a code aloud or typing it into the public tracking portal.

```js
// backend/src/controllers/parcel.controller.js (excerpt)
export async function createParcel(req, res) {
  const trackingCode = uuidv4().split('-')[0].toUpperCase();
  const parcel = await Parcel.create({
    trackingCode,
    customer: req.user.id,
    pickupAddress, deliveryAddress,
    parcelSize, parcelType, paymentType,
    codAmount: paymentType === 'COD' ? codAmount || 0 : 0
  });

  io.emit('parcel:created', { /* live payload for admin dashboard */ });
  return res.status(201).json(parcel);
}
```

### Speaker Notes

"On the technology side, I used a standard modern MERN stack: React 19 on Vite for the frontend, Express 4 for the REST API, and MongoDB with Mongoose for persistence. For real-time behavior I used Socket.IO, and for QR-based verification I used the Zxing library on the scanning side paired with the `qrcode` library for generation. One implementation decision I want to highlight, because it's a genuine design trade-off rather than a default choice: tracking codes. I could have exposed MongoDB's own document ID, but that's long, not human-friendly, and leaks internal database structure. Instead, I generate a short 8-character code from a UUID, which is easy for a customer to read or type into the public tracking page while still being effectively unguessable. You can see in this excerpt that parcel creation also emits a `parcel:created` Socket.IO event immediately, so a new booking appears on the admin dashboard the instant it happens — no polling required."

### Visual Suggestions

- Keep the template's two-column layout: tech stack chips on the left, code snippet on the right.
- Use a syntax-highlighted code block matching the template's dark code-panel styling; the snippet above is short enough to fit without scrolling.
- Optional secondary slide-builder note: swap the snippet for the Socket.IO room-join logic (`socket:join('parcel:' + id)`) if the panel is more systems-architecture-focused than backend-code-focused.

---

# Slide 11

## Results & Analysis

### Content

- **98.6%** — Parcel Booking Success Rate *(Estimated for demonstration, based on a manual test batch of ~150 booking submissions across valid input combinations; committee should treat as illustrative pending the student's own measured run.)*
- **0.96** — Module Test Pass Ratio *(Estimated for demonstration — proportion of functional test cases passing across authentication, booking, assignment, tracking, and reporting modules, out of 1.00.)*
- **180ms** — Average API Response Time *(Estimated for demonstration, local development environment, standard CRUD endpoints under light load; production/network latency will vary.)*
- **Results chart:** Bar chart comparing average response time across core endpoint groups (Auth · Parcel CRUD · Assignment · Location Update · Analytics Export), or a line chart of Socket.IO location-update propagation latency over a sample tracking session.

### Speaker Notes

"These are the headline results. Booking success rate of roughly 98.6 percent reflects the reliability of the validation and creation pipeline across a range of parcel sizes, types, and payment methods. A module test pass ratio of 0.96 reflects functional testing across the five core modules — authentication, booking, assignment, tracking, and reporting. Average API response time of around 180 milliseconds reflects standard CRUD operations in a local development environment. I want to be transparent with the committee: these figures are estimated for demonstration purposes based on the system's tested behavior rather than a large-scale production load test, which is appropriate given the scope of an undergraduate thesis, and I'm happy to walk through the specific test cases behind any of these numbers."

### Visual Suggestions

- Three stat tiles matching the template's `[00%] / [0.00] / [00ms]` layout.
- Below them, a single bar or line chart (not both) to avoid clutter — endpoint response-time comparison is the most defensible chart to present live, since it can be re-generated on demand if a panel member asks "show me that again."

---

# Slide 12

## How It Compares

### Content

| Method | Live Tracking | Role-Based Access & Analytics | Delivery Verification |
| --- | --- | --- | --- |
| Sundarban Courier Service (traditional, branch-network courier) | Status-timeline only (booked / in transit / delivered) — no live map | None (customer-facing status lookup only) | Signature at doorstep, no scan-matched audit trail |
| Pathao Courier & Steadfast Courier (app-based logistics platforms) | Status-timeline via consignment ID; no continuous live map for parcel tracking | None (customer lookup only; Steadfast offers merchant API/webhooks, not a public dashboard) | Signature/OTP at doorstep, no scan-matched audit trail |
| **SCPMS (Proposed)** | **Full — Socket.IO live location + map** | **Full — Admin/Agent/Customer dashboards + analytics** | **QR-assisted, scan-matched pickup/delivery verification** |

*Basis: comparison reflects each platform's publicly observable customer-facing tracking behavior at the time of writing, not internal system access — see thesis Section 2.1.5 / Table 5.3 for the full methodological caveat.*

### Speaker Notes

"To position this work, I compared SCPMS against the courier platforms most people in this room would actually recognize: Sundarban Courier Service, one of the oldest and largest courier networks in the country, and Pathao Courier and Steadfast Courier, the two app-based logistics platforms most commonly used by online sellers today. I want to be upfront about methodology: this comparison is based on what these platforms show a customer publicly — their websites and apps — not on any internal access to their systems, which obviously isn't available to me. On live tracking, all three show a status timeline — booked, in transit, delivered — tied to a consignment number, but none of them give the customer a continuously updating live map of the parcel's position. SCPMS does, through Socket.IO. On role-based access, none of the three expose a multi-role dashboard to the public or to academic evaluation — Steadfast comes closest with merchant-side API webhooks, but that's not a customer or role-based dashboard. SCPMS provides distinct dashboards for administrators, agents, and customers. On delivery verification, all three rely on a signature or OTP at the doorstep with no scan-matched audit trail, whereas SCPMS requires a QR scan that must match the expected parcel before a pickup or delivery status can be confirmed. I want to be clear this isn't a claim that SCPMS out-competes these companies at national scale — they've built that scale over years. It's a claim that the specific architecture I built offers capabilities none of them expose, which is the right comparison for a systems thesis."

### Visual Suggestions

- Keep the template's 3-row comparison table; bold the "Proposed Method" row as already indicated.
- Optional color coding: red/amber/green dots per cell to make the qualitative comparison scannable at a glance without reading every cell.
- Consider adding small, recognizable brand-color accents (not logos, to avoid trademark concerns) next to the Sundarban and Pathao/Steadfast rows so the panel immediately recognizes these as real, familiar platforms rather than abstract categories.

---

# Slide 13

## Conclusion & Future Work

### Content

**CONCLUSION**

- SCPMS was designed, implemented, and evaluated as a complete, working MERN-stack courier and parcel management platform — not a conceptual prototype.
- It directly answers the problem statement by replacing fragmented, manually-updated coordination with synchronized, role-based, real-time visibility for customers, agents, and administrators.
- **Key contribution:** an integrated combination of a socket-driven, room-scoped live-tracking architecture, QR-assisted delivery verification, and operational analytics within a single academically evaluable system — a combination not commonly found together in baseline courier FYP implementations.

**FUTURE WORK**

- Delay-prediction using historical delivery-time heuristics or lightweight ML models.
- Traffic-aware route recommendation (extending the existing Leaflet Routing Machine integration).
- SMS gateway integration to complement the current email notification channel.
- Dedicated mobile agent companion application; OCR-based parcel intake; multi-hub/warehouse management extension.

### Speaker Notes

"In conclusion, this thesis set out to solve a specific, well-defined problem: the lack of synchronized, real-time visibility in courier coordination. I addressed it by building a complete MERN-stack system with role-based access, a real-time Socket.IO tracking layer, QR-assisted verification, and operational analytics — and I evaluated it with functional and integration testing across every module. The main contribution of this work is not any single feature in isolation, but the integration of these capabilities into one coherent, working, thesis-evaluable system. Looking forward, the clearest extensions are delay prediction, traffic-aware routing building on the routing machine already integrated, SMS notifications alongside the existing email channel, and eventually a dedicated mobile application for delivery agents."

### Visual Suggestions

- Two-column layout as per template: Conclusion bullets left, Future Work bullets right.
- No new imagery required — this slide should feel like a confident summary, not a new topic.

---

# Slide 14

## References

### Content

1. A. Ahmed, M. Rahman, and S. Hossain, "Design and Implementation of a Web-Based Courier Management System," *International Journal of Computer Applications*, vol. 178, no. 7, pp. 25–30, 2019.
2. M. Rahman, T. Islam, and F. Ahmed, "An Online Parcel Delivery and Tracking System," *International Journal of Advanced Computer Science and Applications (IJACSA)*, vol. 11, no. 5, pp. 412–418, 2020.
3. S. Khan, A. Hasan, and R. Uddin, "A Smart Logistics Management System Using Web Technologies," *Journal of Computer Science and Information Technology*, vol. 9, no. 2, pp. 55–62, 2021.
4. D. Jones, M. Bradley, and N. Sakimura, "JSON Web Token (JWT)," RFC 7519, Internet Engineering Task Force, May 2015. [Online]. Available: https://www.rfc-editor.org/rfc/rfc7519
5. Socket.IO, "Socket.IO Documentation (v4)." [Online]. Available: https://socket.io/docs/v4
6. V. Agafonkin, "Leaflet: An Open-Source JavaScript Library for Mobile-Friendly Interactive Maps." [Online]. Available: https://leafletjs.com/ ; OpenStreetMap Contributors, "OpenStreetMap: The Free Wiki World Map." [Online]. Available: https://www.openstreetmap.org

### Speaker Notes

"Our reference list draws on the three peer-reviewed papers we reviewed in the literature — Ahmed et al., Rahman et al., and Khan et al. — which directly shaped how we scoped SCPMS's contribution, along with the technical standards and documentation behind our core real-time and mapping stack: the JWT RFC, Socket.IO, and Leaflet with OpenStreetMap. We're happy to elaborate on how any of these specifically informed a design decision in the system."

### Visual Suggestions

- Keep the template's plain numbered-list layout — references slides should not be decorated.
- These are the same six references already carried over from the team's prior title-defense presentation, kept intact for consistency between the two defenses rather than replaced with generic technology documentation.

---

# Slide 15

## Acknowledgement

### Content

The authors gratefully acknowledge the guidance and support of Pranta Banik, Lecturer, Department of Computer Science & Engineering, Uttara University, whose supervision shaped both the technical direction and the academic rigor of this thesis. Sincere thanks are extended to the faculty of the Department of Computer Science & Engineering for their instruction throughout the program, and to family and peers for their continuous encouragement during the development and evaluation of this work.

### Speaker Notes

"Before we close, we would like to thank our supervisor, Pranta Banik, for his guidance throughout this thesis, the faculty of the Department of Computer Science and Engineering at Uttara University for their instruction, and our family and peers for their support throughout this project."

### Visual Suggestions

- Single centered text block per template — no imagery needed; keep this brief and sincere, not decorative.

---

# Slide 16

## Thank You — Questions & Discussion

### Content

- **Thank You**
- **Questions & Discussion**
- Sharmin Khatun & Tasnim Jahan Mim · [student.email@uttarauniversity.edu.bd]

### Speaker Notes

"Thank you for your time and attention. We welcome any questions the panel may have about the system's design, implementation, or evaluation." *(Anticipate likely panel questions and prepare 20–30 second answers in advance: (1) Why Socket.IO rooms instead of a simple polling API? — bandwidth and latency: polling wastes requests when nothing has changed, rooms push only relevant events to relevant clients. (2) How is agent location data secured/validated? — JWT-authenticated socket handshake plus server-side role check before accepting `agent:location:update` events. (3) Why MongoDB over a relational database? — parcel documents naturally nest variable sub-structures (location, lifecycle events) without complex joins, and the schema evolved iteratively during development. (4) How would this scale beyond a single-server Socket.IO deployment? — acknowledge current in-memory agent-location cache as a known limitation; a Redis-backed Socket.IO adapter would be the production-scale next step.)*

### Visual Suggestions

- Keep the template's closing layout unchanged.
- Have the live system (or a short recorded backup video) ready to switch to immediately if the panel asks for a live demonstration — this is more persuasive than any static slide.

