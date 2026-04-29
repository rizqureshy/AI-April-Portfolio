// GTM Enablement AI Portfolio — Living Canvas data manifest
// Each item: { type, title, author, file?, url?, thumb?, blurb? }
// type: 'image' | 'video' | 'app' | 'deck'

export const TEAM_NAME = "Equinix GTM Enablement";
export const TAGLINE  = "A Living Canvas of AI-powered work — apps, art, dashboards, strategy, and stories.";

export const CATEGORIES = [
  { id: "apps",        label: "Apps & Tools",       color: 0x6FF7FF, accent: "#6FF7FF" },
  { id: "art",         label: "AI Art Gallery",     color: 0xFF6FB5, accent: "#FF6FB5" },
  { id: "dashboards",  label: "Dashboards",         color: 0xFFC857, accent: "#FFC857" },
  { id: "decks",       label: "Strategy Decks",     color: 0xE5202E, accent: "#E5202E" },
  { id: "animations",  label: "Animations & Films", color: 0xB388FF, accent: "#B388FF" },
  { id: "courses",     label: "Courses & Lessons",  color: 0x7CFFB2, accent: "#7CFFB2" },
];

// Helper to build a relative URL with proper encoding for spaces.
const f = (name) => encodeURI(name);

export const ITEMS = {
  apps: [
    { type: "app", title: "AI Corporate Etiquette",                  author: "Team",                url: "https://html-course-builder.lovable.app/course.html" },
    { type: "app", title: "AI Essentials Course",                    author: "Calley Hood",         url: "https://aiessentialscourse.netlify.app/" },
    { type: "app", title: "AI Portfolio",                            author: "Calley Hood",         url: "https://idbycalley.github.io/AI-Portfolio/" },
    { type: "app", title: "Artemis II — Dark Side of the Moon",      author: "Rizwan Qureshy",      url: "https://artemis-ii-rizqureshy.replit.app/" },
    { type: "app", title: "Artemis II — Animated Lesson",            author: "Michael Bourgeois",   url: "https://fastidious-dolphin-eeaefa.netlify.app/" },
    { type: "app", title: "Artemis II — Journey to the Moon",        author: "Lorna Joiner",        url: "https://claude.ai/public/artifacts/5ffb82c7-e185-4b9b-81a1-8339e21d6aac" },
    { type: "app", title: "Artemis II — Moon Mission Game",          author: "Michael Bourgeois",   url: "https://roaring-babka-f88861.netlify.app/" },
    { type: "app", title: "Artemis II — Mission Control",            author: "Calley Hood",         url: "https://jovial-donut-b99905.netlify.app/" },
    { type: "app", title: "Challenger Sales Coaching",               author: "Team",                url: "https://id-preview--e21af167-a47d-42ba-a00f-070b0144e10a.lovable.app/" },
    { type: "app", title: "Fabric Sales Expert Course",              author: "Team",                url: "https://gemini.google.com/share/ab8b3dc4d1f6" },
    { type: "app", title: "Build-a-Band: Guitar & Piano",            author: "Ashley Mims",         url: "https://aprilaibuildaband.netlify.app/" },
    { type: "app", title: "Magic Guitar",                            author: "Calley Hood",         url: "https://strong-daffodil-a46c5c.netlify.app/" },
    { type: "app", title: "Order Taker — Partner Simulator",         author: "Michael Bourgeois",   url: "https://partner-simulator.netlify.app/" },
    { type: "app", title: "Pulse Pad Beat Studio",                   author: "Michael Bourgeois",   url: "https://reliable-cassata-1d012c.netlify.app/" },
    { type: "app", title: "Team Energy & Focus Dashboard",           author: "Calley Hood",         url: "https://idbycalley.github.io/Live-Team-Dashboard/" },
    { type: "app", title: "Web Piano & Drums",                       author: "Lorna Joiner",        url: "https://claude.ai/public/artifacts/87573b4b-d654-48cc-89e2-a98939b14547" },
  ],

  art: [
    { type: "image", title: "AI Art",            author: "Shiran",         file: f("AI Art - Shiran.jpg") },
    { type: "image", title: "AI Art",            author: "Calley Hood",    file: f("Calley Hood AI Art.png") },
    { type: "image", title: "AI Art",            author: "Dalia Osorio",   file: f("Dalia Osorio AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Eamonn Ward",    file: f("Eamonn Ward AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Joseph Chan",    file: f("Joseph Chan AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Justin Sit",     file: f("Justin Sit AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Kelly Grover",   file: f("Kelly Grover AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Lorna Joiner",   file: f("Lorna Joiner AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Michael",        file: f("Michael AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Paige Gregory",  file: f("Paige Gregory AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Rizwan Qureshy", file: f("Rizwan Qureshy AI Art.jpg") },
    { type: "image", title: "AI Art",            author: "Veronica John",  file: f("Veronica John AI Art.jpg") },
    { type: "image", title: "Sketch to Render",  author: "Team",           file: f("AI Sketch to Render.jpg") },
    { type: "image", title: "Design and Plan",   author: "Team",           file: f("Design and Plan.jpg") },
  ],

  dashboards: [
    { type: "image", title: "Veronica's AI Dashboard",       author: "Veronica John",  file: f("AI Dashboard - Veronica.png") },
    { type: "image", title: "AI ELC Dashboard",              author: "Team",           file: f("AI ELC Dashboard Pic.png") },
    { type: "image", title: "AI Dashboard",                  author: "Team",           file: f("AI Pic - Dashboard.png") },
    { type: "image", title: "Gemini Canvas Dashboard",       author: "Team",           file: f("Gemini Canvas Dashboard.png") },
    { type: "image", title: "Partner Enablement Dashboard",  author: "Team",           file: f("Partner Enablement Dashboard.jpg") },
  ],

  decks: [
    { type: "deck", title: "AI CRO Strategy Plan",                          author: "Rizwan Qureshy",     file: f("AI CRO Strategy Plan - Rizwan Qureshy.pptx") },
    { type: "deck", title: "AI Strategy Deck",                              author: "Eamonn Ward",        file: f("AI Strategy - Eamonn Deck.pptx") },
    { type: "deck", title: "AI Strategy",                                   author: "Morgan Gallegos",    file: f("AI Strategy - Morgan Gallegos.pptx") },
    { type: "deck", title: "AI Strategy Deck",                              author: "Justin Sit",         file: f("AI Strategy Deck - Justin Sit.pptx") },
    { type: "deck", title: "AI Strategy Deck — April 3rd",                  author: "Paige Gregory",      file: f("AI Strategy Deck_April 3rd - Paige Gregory.pptx") },
    { type: "deck", title: "AI for GTM Enablement Services",                author: "Kelly Grover",       file: f("AI for GTM Enablement Services - Kelly Grover.pptx") },
    { type: "deck", title: "AI in Our Team",                                author: "Calley Hood",        file: f("AI in our team - Calley Hood.pptx") },
    { type: "deck", title: "AI Strategy for GTM Enablement",                author: "Isabelle Puller",    file: f("AI-Strategy-for-GTM-Enablement - Isabelle Puller.pptx") },
    { type: "deck", title: "AI Strategy for Scalable Partner Enablement",   author: "Michael Bourgeois",  file: f("AI-Strategy-for-Scalable-Partner-Enablement - Michael Bourgeois.pptx") },
    { type: "deck", title: "AI Strategy Deck",                              author: "Jason Sherwood",     file: f("AI_Strategy_Deck_claude - Jason Sherwood.pptx") },
    { type: "deck", title: "AI in Our Team Strategy",                       author: "Lorna Joiner",       file: f("AI_in_Our_Team_Strategy - Lorna Joiner.pptx") },
  ],

  animations: [
    { type: "video", title: "Beyond the Chalkboard",       author: "Team",            file: f("Beyond_the_Chalkboard.mp4") },
    { type: "video", title: "Did It My Way",               author: "Rizwan Qureshy",  file: f("Did it my Way - Rizwan Qureshy.mp4") },
    { type: "video", title: "Folding Worries",             author: "Team",            file: f("Folding_Worries.mp4") },
    { type: "video", title: "Number 1 and Nothing Less",   author: "Rizwan Qureshy",  file: f("Number 1 and Nothing Less - Rizwan Qureshy.mp4") },
    { type: "image", title: "ACE Animation Concept",       author: "Team",            file: f("Animation Pic - ACE.png") },
  ],

  courses: [
    { type: "image", title: "AI Coding",                              author: "Team",          file: f("AI Coding.png") },
    { type: "image", title: "AI Course — Google",                     author: "Team",          file: f("AI Course - Google.png") },
    { type: "image", title: "AI Course — Media",                      author: "Team",          file: f("AI Course - Media.png") },
    { type: "image", title: "MS AI Business Professional",            author: "Team",          file: f("AI Course Pic - MS AI Business Professional.png") },
    { type: "image", title: "AI-Created Course",                      author: "Team",          file: f("AI Created Course.png") },
    { type: "image", title: "AI Strategy Deck",                       author: "Eamonn Ward",   file: f("AI Deck Pic - Eamonn Ward.jpg") },
    { type: "image", title: "Sales Academy Design",                   author: "Eamonn Ward",   file: f("Sales Academy Design Pic - Eamonn Ward.png") },
    { type: "image", title: "Transform Workflows with Gen AI",        author: "Team",          file: f("Transform Business Workflows with Gen AI - Course Pic.png") },
  ],
};
