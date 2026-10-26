// Single-presenter script for the SHORT SCPMS defense deck (12 slides, about 11 minutes).
// Plain language for a non-technical presenter. Used for speaker notes and the printable guide.

// PRESENTER=sharmin (default) or PRESENTER=tasnim picks who speaks; the other member is named as teammate.
const PEOPLE = {
  sharmin: { name: "Sharmin Khatun", id: "2223081010" },
  tasnim: { name: "Tasnim Jahan Mim", id: "2221081138" },
};
const presenterKey = process.env.PRESENTER === "tasnim" ? "tasnim" : "sharmin";
const presenter = PEOPLE[presenterKey];
const teammate = PEOPLE[presenterKey === "tasnim" ? "sharmin" : "tasnim"];

const slides = [
  {
    n: 1, title: "Title", time: "0:40",
    say: [
      "Assalamu Alaikum. Good morning, respected supervisor and honourable board members.",
      `I am ${presenter.name}, ID ${presenter.id}. My teammate is ${teammate.name}, ID ${teammate.id}. Today I will present our work on behalf of both of us.`,
      "Our thesis is \"Design and Implementation of a Smart Courier and Parcel Management System\", or SCPMS for short. We did this work under the supervision of Dr. Md. Obaidur Rahaman.",
    ],
    show: "Smile and look at the board. Say your name and ID slowly and clearly.",
  },
  {
    n: 2, title: "Why Courier Delivery Needs a Better System", time: "1:10",
    say: [
      "Online shopping means courier companies carry more parcels every day. The last part of the journey, from the courier to the customer's door, is called the last mile. Research says it is the least efficient part and can cost up to 28 percent of delivery.",
      "Many small couriers still manage parcels with phone calls, paper and chat messages. This causes four problems, shown on the right. Customers must call to know where their parcel is. It is not clear which agent has which parcel. Nobody records who changed a parcel's status. And managers have no numbers to look at.",
      "Because the system holds names, addresses and phone numbers, it also has to be secure. Our answer is SCPMS: one shared parcel record, with live updates for the right people only.",
    ],
    show: "Point to the three points on the left, then the four problem cards on the right, then the red line at the bottom.",
  },
  {
    n: 3, title: "What We Set Out to Build", time: "0:50",
    say: [
      "Our aim was to build and test a secure website that manages parcels from booking to delivery, with live updates.",
      "We had six objectives: safe sign-in, strict permissions for each role, fixed parcel steps with a full history, live updates and public tracking, QR code pickup with maps, and tools for the administrator, like figures and report download.",
      "At the end, I will show how far we reached each objective.",
    ],
    show: "Point to the six cards from O1 to O6.",
  },
  {
    n: 4, title: "What Exists and What Is Missing", time: "0:55",
    say: [
      "We looked at three kinds of existing work. Research papers focus on planning routes, and assume the data is already there. Big commercial courier systems work well, but they are closed, so a small company cannot use them. Smaller courier websites usually need a page refresh to show updates, and rarely explain their security or show test results.",
      "So the gap is a system that a small courier can run itself, with clear roles, a recorded parcel history, live and private tracking, and real proof that it works. That is what we built. The main references are listed at the bottom, and all 40 references are in the thesis.",
    ],
    show: "Point to the three cards, then the blue Gap box, then briefly to the references line.",
  },
  {
    n: 5, title: "How We Built It and for Whom", time: "1:00",
    say: [
      "We built the system step by step in six phases: plan, design, build, extend, secure and test. Each phase gave a working part before the next began.",
      "The system has four kinds of users. Customers book and track parcels. Delivery agents scan the QR code, update the status and share their location. The administrator assigns agents, manages users and downloads reports. And anyone with a tracking code can see the parcel's progress, but no personal information.",
      "We wrote 21 functional and 7 quality requirements, and the data is kept in three main database collections.",
    ],
    show: "Move your hand along the six numbered circles, then point to the four user cards.",
  },
  {
    n: 6, title: "How the System Fits Together", time: "1:00",
    say: [
      "Here is how the system is built. Think of a restaurant.",
      "The website is the front desk, which is what people see. The server is the kitchen, where the real work happens and every rule is checked. The database is the storeroom, where all users and parcels are kept.",
      "There is also an open live connection, the dashed line. It works like a phone line that stays open, so updates arrive at once without refreshing the page.",
    ],
    show: "Point to the top (website), the middle (server), the database at the bottom, and the dashed line on the right.",
  },
  {
    n: 7, title: "Every Parcel Follows Fixed, Protected Steps", time: "1:10",
    say: [
      "Every parcel follows fixed steps: Pending when booked, Assigned when given to an agent, then Picked Up, In Transit and finally Delivered, or Failed if something goes wrong.",
      "The server makes sure only the assigned agent can update a parcel. Delivered and Failed are final, so nobody can change them. And every change is saved with who did it and when. We also found one weakness: an agent can skip a step, which we list as future work.",
      "On the right is the security. Logins expire quickly, and a stolen login is detected. Users can only open their own parcels. Passwords are stored scrambled, and the account locks after five wrong tries. Live updates go only to the people allowed to see them.",
    ],
    show: "Trace the arrows from Pending to Delivered, then go down the red security list on the right.",
  },
  {
    n: 8, title: "Real Screens from the Working System", time: "1:00",
    say: [
      "These are real screenshots of our working system, not designs.",
      "Top left, the customer books a parcel and sees the list. Top right, the customer shows the parcel's QR code. The agent scans it with the phone camera to confirm the pickup. Bottom left, the agent's page with jobs and a live map. Bottom right, the administrator follows the agent live on the map.",
      "To be clear, the QR code helps to find the right parcel quickly. The real protection is the server, which accepts the pickup only from the assigned agent.",
    ],
    show: "Point to each screenshot in order: top left, top right, bottom left, bottom right.",
  },
  {
    n: 9, title: "Tested on the Real System", time: "1:15",
    say: [
      "Now the results. We wrote 66 automatic tests that use the real system like a robot user. All 66 passed. The software packages we ship have zero known security problems.",
      "We also report weak points honestly: a code checker found 98 style errors to clean up, and we recorded 14 issues in total.",
      "On the right are the most important things the tests proved. A customer cannot open someone else's parcel. A stolen login is detected. A disabled account is blocked at once. Live updates never reach the wrong people. And harmful input and password guessing are stopped.",
      "Speed was about 15 milliseconds per request, but only on our own computer, so we do not claim it for real internet use.",
    ],
    show: "Point to the four numbers at the top, then the chart, then the green list on the right.",
  },
  {
    n: 10, title: "What Is Next", time: "0:50",
    say: [
      "Our work has limits. We have not yet tested it with real users, with many users at once, or with real delivery agents in the field. The QR code identifies the parcel but does not prove the delivery. An agent can skip a step. And the free map services have usage limits.",
      "In the future we want to add a secure delivery confirmation code, stricter parcel steps, support for many users, SMS alerts and a mobile app for agents, and then test everything with real users.",
    ],
    show: "Point to the left box, then the right box.",
  },
  {
    n: 11, title: "What We Achieved", time: "0:50",
    say: [
      "To conclude: four of our six objectives are fully achieved, the parcel lifecycle is mostly achieved, and the QR and maps objective is partly achieved.",
      "We built a complete, working courier system for one company. Every status change is recorded, live tracking reaches only the right people, and all 66 tests passed.",
      "Our main message: a secure, real-time courier system can be built with free, open-source tools. The next step is to prove it with real users.",
    ],
    show: "Point to the green and orange status labels, then read the blue takeaway slowly.",
  },
  {
    n: 12, title: "Thank You", time: "0:20",
    say: [
      "That brings me to the end. I sincerely thank our supervisor, Dr. Md. Obaidur Rahaman, and the Department of CSE, Uttara University, for their guidance. Thank you for listening. I am happy to answer your questions.",
    ],
    show: "Stand facing the board, smile and wait for the first question.",
  },
];

const qa = [
  { q: "Why did you choose this topic?", a: "Online shopping is growing fast in Bangladesh, and many small courier companies still use phone calls and paper. We wanted a simple, secure system so everyone can follow a parcel live." },
  { q: "What is new or your contribution?", a: "We did not invent a new algorithm. Our contribution is a complete working system that combines clear roles, recorded status changes, live tracking and private public tracking, proved with 66 tests on the real code." },
  { q: "Why did you use the MERN stack and MongoDB?", a: "MERN uses one language, JavaScript, for both the website and the server, which is easier for a small team. MongoDB stores a parcel and its history together, which fits our data. All tools are free and open source." },
  { q: "How does live tracking work?", a: "The agent's phone browser shares its location every few seconds. The server sends it through an open connection called Socket.IO, but only to the administrator and the customer of that parcel." },
  { q: "How do you keep the data secure?", a: "Short-lived logins, a role and ownership check on every action, hashed passwords, account lock after five wrong tries, request limits and blocking of harmful input. We tested each of these." },
  { q: "What happens if someone steals a login?", a: "The main login pass lasts only 15 minutes. The long-term pass changes every time it is used. If an old one is used again, the system notices and ends that whole session." },
  { q: "Does the QR code prove the parcel was delivered?", a: "No. It is used at pickup to find the correct parcel quickly. The server only accepts the pickup from the assigned agent. A secure delivery confirmation is future work." },
  { q: "How did you test the system?", a: "A script acts like real users and runs 66 checks on the real system, using a temporary database on our computer. All 66 passed. We also ran a code checker and a security check of the packages." },
  { q: "Why did you not test with real users?", a: "We did not have enough time for a proper user study. The report explains how to do it with a standard questionnaire called SUS, and it is part of our future work." },
  { q: "Can it handle many users at the same time?", a: "We have not tested heavy load, so we do not claim it. It runs as one server now. To grow, we would add a shared message service such as Redis and run a load test." },
  { q: "Is the system live on the internet?", a: "It is set up for hosting on Render and Vercel, but for this defense we show and tested it on our own computer. We did not verify the live server for the report." },
  { q: "How is it different from Pathao or Steadfast?", a: "Those are large commercial systems, and their internal design is not public, so we do not compare speed or features directly. Ours is for a small company that wants to run its own system, and our design and tests are fully documented." },
  { q: "Your progress report showed 98.6% and 180 ms. Why not now?", a: "Those were estimates for the early presentation. For the final thesis we replaced them with real measured results: 66 out of 66 tests passed." },
  { q: "How is the delivery time (ETA) calculated?", a: "It is a simple estimate: straight-line distance from the agent to the address, divided by the agent's speed, or 25 km per hour if the speed is unknown. It does not consider traffic." },
  { q: "What is the biggest limitation?", a: "We have not yet tested with real users, with many users at once, or in the field with real agents. Also, the QR code does not prove delivery." },
  { q: "What would you do next?", a: "Add a secure delivery confirmation, make the parcel steps strict, fix the recorded issues, add SMS and a mobile app for agents, and then test with real users and real deliveries." },
];

const glossary = [
  ["Website / frontend", "The part users see and click in their browser."],
  ["Server / backend", "The program behind the website that does the work and checks the rules."],
  ["Database (MongoDB)", "Where all users, parcels and login sessions are stored."],
  ["MERN", "The four tools we used: MongoDB, Express, React and Node.js."],
  ["Real-time / live", "Updates appear immediately, without refreshing the page."],
  ["Socket.IO", "A tool that keeps a connection open so live updates arrive instantly."],
  ["Token / login pass", "A digital pass that proves who you are for a short time."],
  ["Role-based access", "Each type of user can only do what their role allows."],
  ["Hashing", "Storing passwords in scrambled form so they cannot be read."],
  ["QR code", "A square barcode that a phone camera can read quickly."],
  ["Code checker (lint)", "A tool that finds style problems and small mistakes in the code."],
  ["Open source", "Free software whose code anyone can see and use."],
];

const tips = {
  before: [
    "Practise the whole talk at least three times with a timer. Aim for about 11 minutes.",
    "Open the slides in PowerPoint Presenter View (Slide Show, then Use Presenter View). Your lines are in the notes under each slide.",
    "Test the laptop, projector and clicker before the board arrives. Keep a PDF copy of the slides on a USB stick.",
    "Read the questions section and practise the answers aloud.",
  ],
  during: [
    "Speak slowly and clearly. Pause for one second after each new slide.",
    "Look at the board members, not the screen. Glance at your notes only when needed.",
    "Point to the part of the slide you are talking about.",
    "If you lose your place, look at the slide title and say the first sentence of that slide.",
  ],
  questions: [
    "Listen to the whole question. It is fine to say: \"Could you please repeat the question?\"",
    "Answer short and honest. If you do not know: \"That is a good question. We have not done that in this version, but it is part of our future work.\"",
    "Never guess numbers. If unsure, say the details are in the thesis report.",
    "If your teammate is in the room, they can add to an answer when the board allows it.",
  ],
  dont: [
    "Do not say the system is \"production-ready\" or \"used by real companies\".",
    "Do not say the QR code \"verifies delivery\". It only identifies the parcel at pickup.",
    "Do not say it is faster or better than Pathao, Sundarban or Steadfast.",
    "Do not use the old numbers 98.6%, 0.96 or 180 ms. They were estimates.",
    "Do not say real users tested the system. They have not, yet.",
  ],
};

function notesFor(i) {
  const s = slides[i];
  let t = `SLIDE ${s.n} of ${slides.length}   (about ${s.time} min)\n\nSAY:\n` + s.say.join("\n\n");
  if (s.show) t += `\n\nSHOW: ${s.show}`;
  return t;
}

module.exports = { slides, qa, glossary, tips, notesFor, presenter, presenterKey, lang: "en" };
