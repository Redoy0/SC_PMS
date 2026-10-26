// Presenter script for the SCPMS defense deck (two presenters, plain language).
// Used for BOTH the PowerPoint speaker notes (build.js) and the printable guide (make-guide.js).
// A = Sharmin Khatun, B = Tasnim Jahan Mim.

const A = "Sharmin";
const B = "Tasnim";

const slides = [
  {
    n: 1, title: "Title", speaker: A, time: "0:45",
    say: [
      "Assalamu Alaikum. Good morning, respected supervisor and honourable board members.",
      "I am Sharmin Khatun, ID 2223081010. With me is my teammate, Tasnim Jahan Mim, ID 2221081138.",
      "Our thesis is titled \"Design and Implementation of a Smart Courier and Parcel Management System\". We call it SCPMS for short. We did this work under the supervision of Dr. Md. Obaidur Rahaman.",
      "First, I will explain the problem, our goals and our design. Then Tasnim will show you the working system and our test results.",
    ],
    show: "Smile and look at the board. Tasnim nods when her name is said.",
  },
  {
    n: 2, title: "What We Will Cover", speaker: A, time: "0:30",
    say: [
      "This is our plan for today. We will start with the background and the problem, then our objectives, related work and method.",
      "After that we show the design, the working system and the testing. We finish with what still needs work, and our conclusion.",
    ],
    show: "Move your hand from the left column to the right column. Do not read all ten items.",
  },
  {
    n: 3, title: "Introduction & Background", speaker: A, time: "1:00",
    say: [
      "Because of online shopping, courier companies now carry many more parcels every day.",
      "The last part of a parcel's journey, from the courier to the customer's door, is called the \"last mile\". Research papers say this is the least efficient part of delivery. It can be up to 28 percent of the total delivery cost.",
      "Many small courier companies still manage parcels with phone calls, paper notes and chat messages. So nobody has the full and latest picture.",
      "Our solution is SCPMS, a website where every parcel has one shared record, and everyone sees updates live, but only the information they are allowed to see.",
    ],
    show: "At the end, point to the screenshot: \"This is the home page of our system.\"",
  },
  {
    n: 4, title: "The Problem We Address", speaker: A, time: "1:00",
    say: [
      "In one sentence, the problem is this: when parcels are managed by hand, customers cannot follow their parcel, nobody is clearly responsible, there is no reliable record, and the manager has no overview.",
      "Let me go through the four boxes. Visibility: a customer has to call the office to know where the parcel is. Responsibility: it is not clear which delivery agent has which parcel. Accountability: when a status changes, nobody records who changed it and when. Insight: the manager has no numbers, like how many parcels were booked or failed.",
      "And one more thing: the system keeps names, addresses and phone numbers, so it must be secure. Each person should only see what they are allowed to see.",
    ],
    show: "Point to each of the four boxes from left to right, then to the red line at the bottom.",
  },
  {
    n: 5, title: "Aim and Objectives", speaker: A, time: "1:00",
    say: [
      "Our aim was to build and test a secure website that manages parcels from booking to delivery, with live updates for the right people.",
      "We set six objectives. O1: safe sign-up and sign-in for three types of users. O2: every user can only do what their role allows. O3: the parcel moves through fixed steps that the server controls, and every change is recorded. O4: live updates, plus public tracking with a tracking code. O5: QR code at pickup and a map with the route. O6: tools for the administrator, like numbers, user management and report download.",
      "Later, in the testing part, Tasnim will show how we checked each objective.",
    ],
    show: "Point to each card as you say its number.",
  },
  {
    n: 6, title: "Related Work and the Gap", speaker: A, time: "1:00",
    say: [
      "We studied three kinds of existing work.",
      "First, research papers on last-mile delivery. They mainly focus on route planning, and they assume the data is already available.",
      "Second, big commercial courier systems. They work well, but they are closed. A small company cannot get or run them.",
      "Third, smaller courier websites built by students and developers. They usually refresh the page to show updates, and they rarely explain their security or show test results.",
      "So the gap is: a small courier company needs a system it can run itself, with clear roles, recorded status changes, live tracking, private public tracking, and real proof that it works. That is what we built.",
    ],
    show: "Point to each table row, then to the blue \"Gap\" box at the bottom.",
  },
  {
    n: 7, title: "Iterative and Incremental Development", speaker: A, time: "0:50",
    say: [
      "We built the system step by step, in six phases. In each phase we finished a working part before starting the next one.",
      "We planned, designed the database and screens, built the main features, added extra features like e-mail and the Bangla language, then improved security in two review rounds, and finally tested everything.",
      "For testing, we ran automatic checks on the real system on our own computer. We are honest that we did not test it with real users or with heavy traffic yet.",
    ],
    show: "Move your hand along the six boxes from 1 to 6, then point to the green box at the bottom.",
  },
  {
    n: 8, title: "Three Roles, One Shared Parcel Record", speaker: A, time: "0:50",
    say: [
      "The system has four kinds of users, all looking at the same parcel record.",
      "The customer signs up, verifies the e-mail with a code, books parcels and follows them on the map. The delivery agent is added by the administrator, scans the QR code at pickup and updates the parcel status. The administrator assigns agents, manages users and downloads reports. And anyone with a tracking code can see the parcel status, but without any personal information.",
      "In total we wrote 21 functional requirements and 7 quality requirements, and the data is stored in three main tables.",
    ],
    show: "Point to each of the four role cards, then to the three numbers on the right.",
  },
  {
    n: 9, title: "System Architecture", speaker: A, time: "1:00",
    say: [
      "This picture shows how the system is built. Think of a restaurant.",
      "The website in the browser is like the front desk. It is what the users see. The server is like the kitchen. It does the real work and checks the rules. The database is like the storeroom, where all users and parcels are kept.",
      "There is also a special open connection for live updates, shown by the dashed line. It is like a phone line that stays open, so new information arrives immediately without refreshing the page.",
      "Every request passes the same security checks before it reaches the server's rules.",
    ],
    show: "Point to the top part (browser), the middle part (server), the database at the bottom, and the dashed line on the right.",
    handover: "\"Now my teammate Tasnim will explain how a parcel moves through the system and show you the working system.\"",
  },
  {
    n: 10, title: "Server-Enforced Parcel Lifecycle", speaker: B, time: "1:00",
    say: [
      "Thank you, Sharmin. Every parcel goes through a journey of fixed steps.",
      "When the customer books it, it is Pending. When the administrator gives it to an agent, it becomes Assigned. When the agent collects it, it is Picked Up, then In Transit, and finally Delivered. If something goes wrong, the agent can mark it Failed.",
      "The server checks three rules. Only the assigned agent can change the parcel. Delivered and Failed are final, so nobody can change them, not even the administrator. And every change is saved with who did it and when.",
      "We also found one weakness: an agent can skip a step, for example from Assigned directly to Delivered. We have listed this as future work.",
    ],
    show: "Trace the arrows with your hand from Pending to Delivered, then point to the three rule boxes on the right.",
  },
  {
    n: 11, title: "Real-Time Scoping and Security Design", speaker: B, time: "1:00",
    say: [
      "Live updates must reach the right people only. We use something like group chats.",
      "There is a group for administrators, a personal group for each user, and a group for each parcel. An update about a parcel is only sent to the people in that parcel's group. A visitor from the public can only join a parcel's group if they type the correct tracking code.",
      "On the right are our main security protections in simple words. The login pass is short-lived. A user cannot open another user's parcel. Passwords are stored in scrambled form, and the account is locked after five wrong tries. The system blocks harmful input. And only the real agent can send their own location.",
    ],
    show: "Point to the three coloured groups in the middle of the picture, then go down the red list on the right.",
  },
  {
    n: 12, title: "The Running System", speaker: B, time: "1:00",
    say: [
      "These are real screenshots of our working system, not designs.",
      "Top left is the customer page, where they book a parcel and see their list. Top right is the administrator page, with today's numbers, the users and the parcel list where they assign agents. Bottom left is the delivery agent page, with their parcels and a live map. Bottom right is the public tracking page: anyone with the tracking code sees the status and the route on the map.",
    ],
    show: "Point to each screenshot in order: top left, top right, bottom left, bottom right.",
  },
  {
    n: 13, title: "QR-Assisted Pickup and Live Tracking", speaker: B, time: "1:00",
    say: [
      "Here is how a pickup works, in three steps.",
      "Step one: the customer opens the QR code of the parcel on their phone. Step two: the agent scans it with the phone camera and confirms the pickup. Step three: the administrator can follow the agent live on the map.",
      "To be honest about the QR code: it helps to find the correct parcel quickly. The real protection is on the server, which only accepts the pickup from the agent assigned to that parcel. We do not have a QR scan at delivery yet.",
    ],
    show: "Point to screenshots 1, 2 and 3, then to the grey note at the bottom.",
  },
  {
    n: 14, title: "What We Tested and What Passed", speaker: B, time: "1:00",
    say: [
      "Now the results. We wrote 66 automatic tests that use the real system, like a robot user. All 66 passed.",
      "We also checked the software packages we use: there are zero known security problems in the parts that go to users.",
      "We are also honest about weak points: the code checker found 98 style errors that we should clean up, and we recorded 14 issues in total.",
      "The chart shows how many tests we ran in each area. Most tests are about sign-in and security, because that is where mistakes are most dangerous.",
    ],
    show: "Point to the four numbers at the top, then to the longest bar in the chart.",
  },
  {
    n: 15, title: "Behaviours Verified Rather Than Assumed", speaker: B, time: "1:00",
    say: [
      "These six cards are the most important things our tests proved.",
      "A customer cannot see another customer's parcel. If someone steals and reuses an old login pass, the system notices and logs everyone out of that session. When the administrator disables an account, that person is blocked immediately. Live updates do not reach the wrong people. Harmful input is rejected. And repeated wrong passwords lock the account.",
      "On the right is speed. On our own computer a request took about 15 milliseconds, much faster than a blink. But we measured on one computer only, so we do not claim this speed on the internet or with many users.",
    ],
    show: "Point to the six cards, then to the speed box on the right.",
  },
  {
    n: 16, title: "What Still Needs Work", speaker: B, time: "0:50",
    say: [
      "No system is perfect, so here is what still needs work.",
      "On the left are issues we found: agents can skip steps, one tracking page needs a Google Maps key, the free map services have limits, there is a test button visible to customers, and the code style errors.",
      "On the right is what we have not tested yet: a study with real users, a test with many users at the same time, a test in the field with real delivery agents, and proof of delivery at the customer's door.",
    ],
    show: "Point to the left list, then to the four cards on the right.",
  },
  {
    n: 17, title: "Conclusion and Future Work", speaker: B, time: "1:00",
    say: [
      "To conclude: we built a complete, working courier system for one company. Every status change is recorded, live tracking reaches only the right people, and all 66 tests passed. Out of our six objectives, four are fully achieved, one is mostly achieved and one is partly achieved.",
      "In the future we want to add a secure delivery confirmation code, stricter parcel steps, support for more users, better reports, SMS messages and a mobile app for agents. We also want to test it with real users and real deliveries.",
      "Our main message is in the blue box: a secure real-time courier system can be built with free open-source tools. The next step is to prove it with real users at large scale.",
    ],
    show: "Point to the left box, then the right box, then read the blue takeaway slowly.",
  },
  {
    n: 18, title: "Selected References", speaker: B, time: "0:15",
    say: [
      "These are the main references we used. The full list of 40 references, all checked, is in our thesis report.",
    ],
    show: "Do not read the references. Pause for two seconds, then go to the next slide.",
  },
  {
    n: 19, title: "Thank You", speaker: "Both", time: "0:30",
    say: [
      "Tasnim: That brings us to the end of our presentation. Thank you very much for listening. Sharmin will say our final words.",
      "Sharmin: We sincerely thank our supervisor, Dr. Md. Obaidur Rahaman, and the Department of CSE, Uttara University, for their guidance and support. We are now happy to answer your questions.",
    ],
    show: "Both stand facing the board. Smile. Wait for the first question.",
  },
];

// Likely questions, with short, honest answers and who should answer.
const qa = [
  { q: "Why did you choose this topic?", who: A,
    a: "Online shopping is growing fast in Bangladesh, and many small courier companies still use phone calls and paper. We wanted a simple, secure system that lets everyone follow a parcel live." },
  { q: "What is new or your contribution?", who: A,
    a: "We did not invent a new algorithm. Our contribution is a complete working system that combines clear roles, recorded status changes, live tracking and private public tracking, and we proved it with 66 tests on the real code." },
  { q: "Why did you use the MERN stack and MongoDB?", who: A,
    a: "MERN uses one language, JavaScript, for both the website and the server, so it is easier for a small team. MongoDB stores a parcel and its history together, which fits our data well. All tools are free and open source." },
  { q: "How does live tracking work?", who: B,
    a: "The agent's phone browser shares its location every few seconds. The server sends it through an open connection called Socket.IO, but only to the administrator and to the customer of that parcel." },
  { q: "What is Socket.IO?", who: B,
    a: "It is a tool that keeps a connection open between the website and the server, so new information arrives immediately without refreshing the page." },
  { q: "How do you keep the data secure?", who: B,
    a: "Short-lived login passes, a check of the user's role and ownership on every action, scrambled (hashed) passwords, account lock after five wrong tries, request limits, and blocking of harmful input. We tested each of these." },
  { q: "What happens if someone steals a user's login?", who: B,
    a: "The main login pass only lasts 15 minutes. The long-term pass is replaced every time it is used. If an old one is used again, the system notices and ends that whole session." },
  { q: "Does the QR code prove that the parcel was delivered?", who: B,
    a: "No. In our system the QR code is used at pickup to find the correct parcel quickly. The server only accepts the pickup from the assigned agent. A secure delivery confirmation is part of our future work." },
  { q: "How did you test the system?", who: B,
    a: "We wrote a script that acts like real users and runs 66 checks on the real system, using a temporary database on our own computer. All 66 passed. We also ran a code checker and a security check of the packages." },
  { q: "Why did you not test with real users?", who: A,
    a: "We did not have enough time for a proper user study. We describe how to do it in the report, using a standard questionnaire called SUS, and it is part of our future work." },
  { q: "Can the system handle many users at the same time?", who: B,
    a: "We have not tested heavy load yet, so we do not claim that. Right now it runs as one server. To grow, we would add a shared message service such as Redis and run a load test." },
  { q: "Is the system live on the internet?", who: A,
    a: "It is set up for online hosting on Render and Vercel, but for this defense we show and test it on our own computer. We did not verify the live server for the report." },
  { q: "How is your system different from Pathao or Steadfast?", who: A,
    a: "Those are large commercial systems, and their internal design is not public, so we do not compare speed or features directly. Our system is for a small company that wants to run its own system, and our design and tests are fully documented." },
  { q: "In your progress report you showed 98.6% and 180 ms. Why are they not here?", who: B,
    a: "Those numbers were estimates for the early presentation. For the final thesis we replaced them with real, measured results: 66 out of 66 tests passed." },
  { q: "How is the delivery time (ETA) calculated?", who: B,
    a: "It is a simple estimate: the straight-line distance from the agent to the delivery address, divided by the agent's speed, or 25 km per hour if the speed is unknown. It does not consider traffic." },
  { q: "Why does the system support Bangla?", who: A,
    a: "Our users are in Bangladesh, and many people are more comfortable in Bangla. The whole interface can switch between English and Bangla." },
  { q: "What is the biggest limitation?", who: A,
    a: "We have not yet tested it with real users, with many users at the same time, or in the field with real agents. Also, the QR code does not prove delivery." },
  { q: "What would you do next?", who: B,
    a: "Add a secure delivery confirmation, make the parcel steps strict, fix the recorded issues, add SMS and a mobile app for agents, and then test with real users and real deliveries." },
];

// Plain-language meanings of the technical words on the slides.
const glossary = [
  ["Website / frontend", "The part users see and click in their browser."],
  ["Server / backend", "The computer program that does the work behind the website and checks the rules."],
  ["Database (MongoDB)", "Where all users, parcels and login sessions are stored."],
  ["MERN", "The four tools we used: MongoDB, Express, React and Node.js."],
  ["API", "The fixed list of requests the website can send to the server, like \"book a parcel\"."],
  ["Real-time / live", "Updates appear immediately, without refreshing the page."],
  ["Socket.IO", "A tool that keeps a connection open so live updates can be sent instantly."],
  ["Token / JWT", "A digital login pass that proves who you are for a short time."],
  ["Role-based access", "Each type of user can only do what their role allows."],
  ["IDOR", "A common mistake where one user can open another user's data by changing a number in the link. We block it."],
  ["Hashing / bcrypt", "Storing passwords in scrambled form, so they cannot be read even if the database is stolen."],
  ["Rate limit", "A limit on how many requests one person can send in a short time, to stop attacks."],
  ["QR code", "A square barcode that a phone camera can read quickly."],
  ["Lint / code checker", "A tool that finds style problems and small mistakes in the code."],
  ["Open source", "Free software whose code anyone can see and use."],
];

const tips = {
  before: [
    "Practise the full talk together at least three times with a timer. Aim for 16 to 17 minutes in total.",
    "Open the slides in PowerPoint Presenter View (Slide Show, then Use Presenter View). Your lines are in the notes under each slide.",
    "Agree who clicks. The current speaker clicks, or one person clicks for both.",
    "Test the laptop, the projector and the clicker before the board arrives. Keep the PDF of the slides on a USB stick as a backup.",
    "Read the questions section together and decide who answers each type of question.",
  ],
  during: [
    "Speak slowly and clearly. Pause for one second after each slide changes.",
    "Look at the board members, not at the screen. Glance at your notes only when needed.",
    "Point to the part of the slide you are talking about.",
    "Use the handover lines, so the change between speakers feels smooth.",
    "When your partner is speaking, stand still and look at the screen or the board.",
  ],
  questions: [
    "Listen to the whole question. It is fine to say: \"Could you please repeat the question?\"",
    "Answer short and honest. If you do not know: \"That is a good question. We have not done that in this version, but it is part of our future work.\"",
    "Never guess numbers. If you are unsure, say the number is in the report.",
    "If the question is for your partner's part, say: \"Tasnim (or Sharmin) can answer this.\"",
  ],
  dont: [
    "Do not say the system is \"production-ready\" or \"used by real companies\".",
    "Do not say the QR code \"verifies delivery\". It only identifies the parcel at pickup.",
    "Do not say it is faster or better than Pathao, Sundarban or Steadfast.",
    "Do not use the old numbers 98.6%, 0.96 or 180 ms. They were estimates.",
    "Do not say real users tested the system. They did not, yet.",
  ],
};

function notesFor(i) {
  const s = slides[i];
  const who = s.speaker === "Both" ? "SHARMIN and TASNIM" : s.speaker.toUpperCase();
  let t = `SPEAKER: ${who}   (about ${s.time} min)\n\nSAY:\n` + s.say.join("\n\n");
  if (s.show) t += `\n\nSHOW: ${s.show}`;
  if (s.handover) t += `\n\nHANDOVER: ${s.handover}`;
  return t;
}

module.exports = { slides, qa, glossary, tips, notesFor, A, B };
