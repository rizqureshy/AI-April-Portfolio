// GTM AI Canvas — Living Canvas data manifest
// Each item: { type, title, author, file?, url? }
// type: 'image' | 'video' | 'app' | 'deck'

export const APP_NAME  = "GTM AI Canvas";
export const TEAM_NAME = "Equinix · GTM Enablement";
export const TAGLINE   = "A living 3D canvas of AI-powered work — apps, art, dashboards, strategy, and stories.";

export const CATEGORIES = [
  { id: "apps",        label: "Apps & Tools",       color: 0x6FF7FF, accent: "#6FF7FF" },
  { id: "art",         label: "AI Art Gallery",     color: 0xFF6FB5, accent: "#FF6FB5" },
  { id: "dashboards",  label: "Dashboards",         color: 0xFFC857, accent: "#FFC857" },
  { id: "decks",       label: "AI Decks",                    color: 0xE5202E, accent: "#E5202E" },
  { id: "animations",  label: "AI Animations, Music & Films", color: 0xB388FF, accent: "#B388FF" },
  { id: "courses",     label: "Courses & Lessons",  color: 0x7CFFB2, accent: "#7CFFB2" },
  { id: "portfolios",  label: "Portfolios & Code",  color: 0xFF8B6F, accent: "#FF8B6F" },
];

// Per-category folder map. Update here if folders ever move.
const FOLDERS = {
  art:        "assets/art/",
  dashboards: "assets/dashboards/",
  decks:      "assets/decks/",
  animations: "assets/animations/",
  courses:    "assets/courses/",
  presenters: "assets/presenters/",
};
const f = (cat, name) => encodeURI(FOLDERS[cat] + name);

// Presenter roster for Presentation Mode. Each member shows up as a tile in
// the canvas and as a row in the left panel. Photos prefer existing AI Art
// portraits; placeholder initials-avatars cover everyone else.
export const PRESENTERS = [
  {
    id: "capstone",
    group: "Capstone Presentation",
    display: "group",
    description: "The Capstone team has built a SCORM Analyzer that uses AI and decoding technologies to inspect courses built as SCORM packages — giving creators and administrators deeper visibility into the topics, links, health, and relevance of our course catalog.",
    members: [
      { id: "isabelle-puller", name: "Isabelle Puller", photo: f("presenters", "isabelle_puller.jpg") },
      { id: "ashley-mims",     name: "Ashley Mims",     photo: f("presenters", "ashley_mims.jpg") },
      { id: "lorna-joiner",    name: "Lorna Joiner",    photo: f("presenters", "lorna_joiner.jpg") },
      { id: "dalia-osorio",    name: "Dalia Osorio",    photo: f("presenters", "dalia_osorio.jpg") },
    ],
  },
  {
    id: "projects",
    group: "Project Presentations & Key Learning Insights",
    display: "individual",
    members: [
      { id: "michael-bourgeois", name: "Michael Bourgeois", photo: f("presenters", "michael_bourgeois.jpg"), description: "A Challenger Methodology course where sales can interact with an AI persona live — bringing direct AI conversation capabilities inside a course for the first time." },
      { id: "calley-hood",       name: "Calley Hood",       photo: f("presenters", "calley_hood.jpg"),       description: "Placeholder description. To be updated with what Calley will share." },
      { id: "elena-cazan",       name: "Elena Cazan",       photo: f("presenters", "elena_cazan.jpg"),       description: "Sharing her productivity tip on using AI to solve real business problems." },
      { id: "sol-helou",         name: "Sol Helou",         photo: f("presenters", "sol_helou.jpg"),         description: "A powerful Personal Professional Productivity tool that helps users organize themselves, their deliverables, project timelines, and priorities." },
      { id: "jason-sherwood",    name: "Jason Sherwood",    photo: f("presenters", "jason_sherwood.jpg"),    description: "Placeholder description. To be updated with what Jason will share." },
      { id: "veronica-john",     name: "Veronica John",     photo: f("presenters", "veronica_john.jpg"),     description: "Placeholder description. To be updated with what Veronica will share." },
    ],
  },
];

export const ITEMS = {
  apps: [
    { type: "app", title: "AI Corporate Etiquette",                  author: "Team",                url: "https://html-course-builder.lovable.app/course.html" },
    { type: "app", title: "AI Essentials Course",                    author: "Calley Hood",         url: "https://aiessentialscourse.netlify.app/" },
    { type: "app", title: "Artemis II — Dark Side of the Moon",      author: "Rizwan Qureshy",      url: "https://artemis-ii-rizqureshy.replit.app/" },
    { type: "app", title: "Artemis II — Animated Lesson",            author: "Michael Bourgeois",   url: "https://fastidious-dolphin-eeaefa.netlify.app/" },
    { type: "app", title: "Artemis II — Journey to the Moon",        author: "Lorna Joiner",        url: "https://claude.ai/public/artifacts/5ffb82c7-e185-4b9b-81a1-8339e21d6aac" },
    { type: "app", title: "Artemis II — Moon Mission Game",          author: "Michael Bourgeois",   url: "https://roaring-babka-f88861.netlify.app/" },
    { type: "app", title: "Artemis II — Mission Control",            author: "Calley Hood",         url: "https://jovial-donut-b99905.netlify.app/" },
    { type: "app", title: "Challenger Sales Coaching",               author: "Team",                url: "https://id-preview--e21af167-a47d-42ba-a00f-070b0144e10a.lovable.app/" },
    { type: "app", title: "Build-a-Band: Guitar & Piano",            author: "Ashley Mims",         url: "https://aprilaibuildaband.netlify.app/" },
    { type: "app", title: "Magic Guitar",                            author: "Calley Hood",         url: "https://strong-daffodil-a46c5c.netlify.app/" },
    { type: "app", title: "Order Taker — Partner Simulator",         author: "Michael Bourgeois",   url: "https://partner-simulator.netlify.app/" },
    { type: "app", title: "Pulse Pad Beat Studio",                   author: "Michael Bourgeois",   url: "https://reliable-cassata-1d012c.netlify.app/" },
    { type: "app", title: "Team Energy & Focus Dashboard",           author: "Calley Hood",         url: "https://idbycalley.github.io/Live-Team-Dashboard/" },
    { type: "app", title: "Web Piano & Drums",                       author: "Lorna Joiner",        url: "https://claude.ai/public/artifacts/87573b4b-d654-48cc-89e2-a98939b14547" },
  ],

  art: [
    { type: "image", title: "AI Art",            author: "Shiran",         file: f("art", "AI Art - Shiran.jpg") },
    { type: "image", title: "AI Art",            author: "Calley Hood",    file: f("art", "Calley Hood AI Art.png") },
    { type: "image", title: "AI Art",            author: "Dalia Osorio",   file: f("art", "Dalia Osorio AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Eamonn Ward",    file: f("art", "Eamonn Ward AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Joseph Chan",    file: f("art", "Joseph Chan AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Justin Sit",     file: f("art", "Justin Sit AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Kelly Grover",   file: f("art", "Kelly Grover AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Lorna Joiner",   file: f("art", "Lorna Joiner AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Michael",        file: f("art", "Michael AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Paige Gregory",  file: f("art", "Paige Gregory AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Rizwan Qureshy", file: f("art", "Rizwan Qureshy AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Veronica John",  file: f("art", "Veronica John AI Art.jpg") },
    { type: "image", title: "Sketch to Render",  author: "Team",           file: f("art", "AI Sketch to Render.jpg") },
    { type: "image", title: "Design and Plan",   author: "Team",           file: f("art", "Design and Plan.jpg") },
  ],

  dashboards: [
    { type: "image", title: "Veronica's AI Dashboard",       author: "Veronica John",  file: f("dashboards", "AI Dashboard - Veronica.png") },
    { type: "image", title: "AI ELC Dashboard",              author: "Team",           file: f("dashboards", "AI ELC Dashboard Pic.png") },
    { type: "image", title: "AI Dashboard",                  author: "Team",           file: f("dashboards", "AI Pic - Dashboard.png") },
    { type: "image", title: "Gemini Canvas Dashboard",       author: "Team",           file: f("dashboards", "Gemini Canvas Dashboard.png") },
    { type: "image", title: "Partner Enablement Dashboard",  author: "Team",           file: f("dashboards", "Partner Enablement Dashboard.jpg") },
  ],

  decks: [
    { type: "deck", title: "AI CRO Strategy Plan",                          author: "Rizwan Qureshy",     file: f("decks", "AI CRO Strategy Plan - Rizwan Qureshy.pptx"),                          thumb: f("decks", "thumbs/AI CRO Strategy Plan - Rizwan Qureshy.png") },
    { type: "deck", title: "AI Strategy Deck",                              author: "Eamonn Ward",        file: f("decks", "AI Strategy - Eamonn Deck.pptx"),                                    thumb: f("decks", "thumbs/AI Strategy - Eamonn Deck.png") },
    { type: "deck", title: "AI Strategy",                                   author: "Morgan Gallegos",    file: f("decks", "AI Strategy - Morgan Gallegos.pptx"),                                thumb: f("decks", "thumbs/AI Strategy - Morgan Gallegos.png") },
    { type: "deck", title: "AI Strategy Deck",                              author: "Justin Sit",         file: f("decks", "AI Strategy Deck - Justin Sit.pptx"),                                thumb: f("decks", "thumbs/AI Strategy Deck - Justin Sit.png") },
    { type: "deck", title: "AI Strategy Deck — April 3rd",                  author: "Paige Gregory",      file: f("decks", "AI Strategy Deck_April 3rd - Paige Gregory.pptx"),                   thumb: f("decks", "thumbs/AI Strategy Deck_April 3rd - Paige Gregory.png") },
    { type: "deck", title: "AI for GTM Enablement Services",                author: "Kelly Grover",       file: f("decks", "AI for GTM Enablement Services - Kelly Grover.pptx"),                thumb: f("decks", "thumbs/AI for GTM Enablement Services - Kelly Grover.png") },
    { type: "deck", title: "AI in Our Team",                                author: "Calley Hood",        file: f("decks", "AI in our team - Calley Hood.pptx"),                                 thumb: f("decks", "thumbs/AI in our team - Calley Hood.png") },
    { type: "deck", title: "AI Strategy for GTM Enablement",                author: "Isabelle Puller",    file: f("decks", "AI-Strategy-for-GTM-Enablement - Isabelle Puller.pptx"),             thumb: f("decks", "thumbs/AI-Strategy-for-GTM-Enablement - Isabelle Puller.png") },
    { type: "deck", title: "AI Strategy for Scalable Partner Enablement",   author: "Michael Bourgeois",  file: f("decks", "AI-Strategy-for-Scalable-Partner-Enablement - Michael Bourgeois.pptx"), thumb: f("decks", "thumbs/AI-Strategy-for-Scalable-Partner-Enablement - Michael Bourgeois.png") },
    { type: "deck", title: "AI Strategy Deck",                              author: "Jason Sherwood",     file: f("decks", "AI_Strategy_Deck_claude - Jason Sherwood.pptx"),                      thumb: f("decks", "thumbs/AI_Strategy_Deck_claude - Jason Sherwood.png") },
    { type: "deck", title: "AI in Our Team Strategy",                       author: "Lorna Joiner",       file: f("decks", "AI_in_Our_Team_Strategy - Lorna Joiner.pptx"),                       thumb: f("decks", "thumbs/AI_in_Our_Team_Strategy - Lorna Joiner.png") },
  ],

  animations: [
    { type: "video", title: "AI Super Hero",               author: "Team",            file: f("animations", "AI Super Hero.mp4") },
    { type: "video", title: "AI Eamonn",                   author: "Eamonn Ward",     file: f("animations", "AI Eamonn.mp4") },
    { type: "video", title: "Beyond the Chalkboard",       author: "Team",            file: f("animations", "Beyond_the_Chalkboard.mp4") },
    { type: "video", title: "Did It My Way",               author: "Rizwan Qureshy",  file: f("animations", "Did it my Way - Rizwan Qureshy.mp4") },
    { type: "video", title: "Folding Worries",             author: "Team",            file: f("animations", "Folding_Worries.mp4") },
    { type: "video", title: "Number 1 and Nothing Less",   author: "Rizwan Qureshy",  file: f("animations", "Number 1 and Nothing Less - Rizwan Qureshy.mp4") },
    { type: "image", title: "ACE Animation Concept",       author: "Team",            file: f("animations", "Animation Pic - ACE.png") },
  ],

  courses: [
    { type: "app",   title: "2026 CSM Compensation Plan",             author: "Morgan Gallegos", url: "https://equinixinc-my.sharepoint.com/personal/mogallegos_equinix_com/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fmogallegos%5Fequinix%5Fcom%2FDocuments%2F2025%20Comms%20Campaigns%2FAI%20Challenges%2Fequinix%5Fcsm%5Fcourse%2Ehtml&parent=%2Fpersonal%2Fmogallegos%5Fequinix%5Fcom%2FDocuments%2F2025%20Comms%20Campaigns%2FAI%20Challenges&ga=1" },
    { type: "app",   title: "Equinix Fabric Sales Expert Course",     author: "Team",            url: "https://gemini.google.com/share/ab8b3dc4d1f6" },
    { type: "app",   title: "ACE RAG Course",                         author: "Team",            url: "https://equinixinc.sharepoint.com/sites/GTMEnablement-All/Shared%20Documents/AI%20April%20Challenge/ace-rag-course.html" },
    { type: "image", title: "AI Coding",                              author: "Team",          file: f("courses", "AI Coding.png") },
    { type: "image", title: "AI Course — Google",                     author: "Team",          file: f("courses", "AI Course - Google.png") },
    { type: "image", title: "AI Course — Media",                      author: "Team",          file: f("courses", "AI Course - Media.png") },
    { type: "image", title: "MS AI Business Professional",            author: "Team",          file: f("courses", "AI Course Pic - MS AI Business Professional.png") },
    { type: "image", title: "AI-Created Course",                      author: "Team",          file: f("courses", "AI Created Course.png") },
    { type: "image", title: "AI Strategy Deck",                       author: "Eamonn Ward",   file: f("courses", "AI Deck Pic - Eamonn Ward.jpg") },
    { type: "image", title: "Sales Academy Design",                   author: "Eamonn Ward",   file: f("courses", "Sales Academy Design Pic - Eamonn Ward.png") },
    { type: "image", title: "Transform Workflows with Gen AI",        author: "Team",          file: f("courses", "Transform Business Workflows with Gen AI - Course Pic.png") },
  ],

  portfolios: [
    { type: "app", title: "AI Portfolio",            author: "Calley Hood",       url: "https://idbycalley.github.io/AI-Portfolio/" },
    { type: "app", title: "AI Portfolio",            author: "Michael Bourgeois", url: "https://mkbourgeois.github.io/portfolio/" },
    { type: "app", title: "GitHub — IDByCalley",     author: "Calley Hood",       url: "https://github.com/IDByCalley" },
    { type: "app", title: "GitHub — Portfolio",     author: "Michael Bourgeois", url: "https://github.com/MKBourgeois/portfolio" },
    { type: "app", title: "GitHub — My-Repository", author: "Elena Cazan",        url: "https://github.com/AlevC3/My-Repository" },
  ],
};
