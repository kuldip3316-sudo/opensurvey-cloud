// Singapore Student Tuition & Enrichment Survey Catalog & Definitions

export const SURVEY_METADATA = {
  title: "Singapore Student Tuition & Enrichment Survey",
  subtitle: "Targeting students aged 13–19 residing in Singapore",
  targetN: 400,
  description: "This study gathers student perspectives on tuition, test preparation, and academic enrichment programmes in Singapore."
};

export const PROVIDER_LIST = [
  { id: "the_learning_lab", name: "The Learning Lab", category: "Academic Subject Tutoring; Academic-based Enrichment" },
  { id: "aspire_hub", name: "Aspire Hub Education", category: "Academic Subject Tutoring" },
  { id: "mind_stretcher", name: "Mind Stretcher", category: "Academic Subject Tutoring" },
  { id: "indigo", name: "Indigo Education Group", category: "Academic Subject Tutoring" },
  { id: "mavis", name: "Mavis Tutorial Centre", category: "Academic Subject Tutoring" },
  { id: "edufirst", name: "EduFirst Learning Centre", category: "Academic Subject Tutoring" },
  { id: "agrader", name: "AGrader Learning Centre", category: "Academic Subject Tutoring" },
  { id: "mae", name: "MAE", category: "Academic-based Enrichment" },
  { id: "stalford", name: "Stalford Learning Centre", category: "" },
  { id: "learners_lodge", name: "Learners' Lodge", category: "" },
  { id: "beacon", name: "Beacon Education", category: "" },
  { id: "vivota", name: "Vivota Education", category: "" },
  { id: "private_tutor", name: "Independent/private tutor", category: "" },
  { id: "zenith", name: "Zenith tuition group", category: "Special Focus Brand" },
  { id: "other_provider", name: "Other provider, please specify", isOther: true }
];

export const KPC_LIST = [
  "Tutor or instructor quality and expertise",
  "Teaching style that suits me",
  "Proven track record of results or outcomes",
  "Curriculum quality and relevance to my school or goals",
  "Small class size or personal attention",
  "Convenient location",
  "Convenient timetable and flexibility",
  "Online or hybrid learning options",
  "Fees and overall affordability",
  "Value for money",
  "Brand reputation and trust",
  "Availability of a trial lesson",
  "Quality of notes, materials or technology",
  "Enjoyment and motivation while learning"
];

export const SERVICE_CATEGORIES = [
  { id: "academic_tutoring", name: "Academic subject tuition or tutoring (e.g. Mathematics, English, Science, Economics)" },
  { id: "exam_prep", name: "Examination or test-preparation services (e.g. O-Level, A-Level, IB preparation)" },
  { id: "academic_enrichment", name: "Academic-based enrichment (e.g. reading, writing, debate, languages, advanced mathematics, study skills)" },
  { id: "hobby_enrichment", name: "Hobby or skill-based enrichment (e.g. music, art, drama, dance, sport, coding, robotics)" }
];

export const SERVICE_USAGE_COLUMNS = [
  { code: 1, label: "Currently use" },
  { code: 2, label: "Used in the last 6 months, but not currently" },
  { code: 3, label: "Used before the last 6 months, but not currently" },
  { code: 4, label: "Do not currently use, but would consider" },
  { code: 5, label: "Do not use and would not consider" }
];

export const PROVIDER_RELATIONSHIP_COLUMNS = [
  { code: 1, label: "Never heard of it" },
  { code: 2, label: "Heard, not considered" },
  { code: 3, label: "Considered, never used" },
  { code: 4, label: "Used, not in last 6 months" },
  { code: 5, label: "Used in last 6 months, not current" },
  { code: 6, label: "Currently use" }
];

export const COUNTRIES = [
  "Singapore",
  "Malaysia",
  "Indonesia",
  "China",
  "India",
  "United Kingdom",
  "United States",
  "Australia",
  "Hong Kong",
  "Japan",
  "South Korea",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Taiwan",
  "Canada",
  "New Zealand",
  "Other country"
];
