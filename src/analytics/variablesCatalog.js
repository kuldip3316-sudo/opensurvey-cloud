// Survey Questions Catalog & Standard Demographics Banners

export const STANDARD_BANNERS = [
  {
    id: "banner_gender",
    name: "Gender",
    description: "Total vs Male vs Female",
    columns: [
      { id: "total", label: "Total", filterFn: () => true },
      { id: "male", label: "Male", filterFn: r => r.answers?.q3_gender === "Male" },
      { id: "female", label: "Female", filterFn: r => r.answers?.q3_gender === "Female" }
    ]
  },
  {
    id: "banner_age",
    name: "Age Group",
    description: "Lower Sec (13-14) vs Upper Sec (15-16) vs JC/Pre-U (17-19)",
    columns: [
      { id: "total", label: "Total", filterFn: () => true },
      { id: "age_13_14", label: "13–14 yrs", filterFn: r => Number(r.answers?.q1_age) <= 14 },
      { id: "age_15_16", label: "15–16 yrs", filterFn: r => Number(r.answers?.q1_age) >= 15 && Number(r.answers?.q1_age) <= 16 },
      { id: "age_17_19", label: "17–19 yrs", filterFn: r => Number(r.answers?.q1_age) >= 17 }
    ]
  },
  {
    id: "banner_school",
    name: "School Type",
    description: "Government Secondary vs Independent vs Junior College / Pre-U",
    columns: [
      { id: "total", label: "Total", filterFn: () => true },
      { id: "sch_govt", label: "Govt Secondary", filterFn: r => (r.answers?.q4_schooling || '').includes("Government") },
      { id: "sch_indep", label: "Independent Sec", filterFn: r => (r.answers?.q4_schooling || '').includes("Independent") },
      { id: "sch_jc", label: "Junior College / Pre-U", filterFn: r => (r.answers?.q4_schooling || '').includes("Junior college") || (r.answers?.q4_schooling || '').includes("Millennia") },
      { id: "sch_other", label: "International / Private", filterFn: r => (r.answers?.q4_schooling || '').includes("International") || (r.answers?.q4_schooling || '').includes("Private") }
    ]
  },
  {
    id: "banner_zenith",
    name: "Zenith User Status",
    description: "Current Users vs Recent Lapsed vs Past Users vs Considered/Non-users",
    columns: [
      { id: "total", label: "Total", filterFn: () => true },
      { id: "zen_current", label: "Currently Use Zenith", filterFn: r => r.answers?.q10_grid?.["Zenith tuition group"] === "Currently use" },
      { id: "zen_lapsed", label: "Used Last 6m", filterFn: r => r.answers?.q10_grid?.["Zenith tuition group"] === "Used in last 6 months, not current" },
      { id: "zen_past", label: "Past User (>6m)", filterFn: r => r.answers?.q10_grid?.["Zenith tuition group"] === "Used, not in last 6 months" },
      { id: "zen_nonuser", label: "Considered / Non-User", filterFn: r => ["Considered, never used", "Heard, not considered", "Never heard of it"].includes(r.answers?.q10_grid?.["Zenith tuition group"]) }
    ]
  },
  {
    id: "banner_decision",
    name: "Decision Role",
    description: "Who decides the tuition provider",
    columns: [
      { id: "total", label: "Total", filterFn: () => true },
      { id: "dec_together", label: "Parent & Student Together", filterFn: r => (r.answers?.q8_decision_role || '').includes("together") },
      { id: "dec_student", label: "Student by Myself", filterFn: r => (r.answers?.q8_decision_role || '').includes("myself") },
      { id: "dec_parent", label: "Parent Alone", filterFn: r => r.answers?.q8_decision_role === "My parent or guardian decides" }
    ]
  }
];

export const SURVEY_QUESTIONS = [
  // Demographics
  {
    id: "q1_age",
    section: "Demographics & Screening",
    title: "Q1. Age Distribution",
    type: "single_choice",
    categories: [
      { id: "13", label: "13 years old" },
      { id: "14", label: "14 years old" },
      { id: "15", label: "15 years old" },
      { id: "16", label: "16 years old" },
      { id: "17", label: "17 years old" },
      { id: "18", label: "18 years old" },
      { id: "19", label: "19 years old" }
    ],
    extractor: (r, catId) => String(r.answers?.q1_age) === catId
  },
  {
    id: "q3_gender",
    section: "Demographics & Screening",
    title: "Q3. Gender Identity",
    type: "single_choice",
    categories: [
      { id: "Female", label: "Female" },
      { id: "Male", label: "Male" },
      { id: "Other", label: "Non-binary / Other / Prefer not to say" }
    ],
    extractor: (r, catId) => {
      if (catId === "Other") return ["Non-binary or another identity", "Prefer not to say"].includes(r.answers?.q3_gender);
      return r.answers?.q3_gender === catId;
    }
  },
  {
    id: "q2a_status",
    section: "Demographics & Screening",
    title: "Q2a. Residency Status in Singapore",
    type: "single_choice",
    categories: [
      { id: "citizen", label: "Singapore citizen" },
      { id: "pr", label: "Permanent resident" },
      { id: "international", label: "Student Pass / Dependant Pass (International)" }
    ],
    extractor: (r, catId) => {
      if (catId === "citizen") return r.answers?.q2a_status === "Singapore citizen";
      if (catId === "pr") return r.answers?.q2a_status === "Permanent resident";
      return (r.flags?.isInternational || r.flags?.is_international);
    }
  },
  {
    id: "q4_schooling",
    section: "Demographics & Screening",
    title: "Q4. Current Schooling Institution",
    type: "single_choice",
    categories: [
      { id: "govt", label: "Government / autonomous secondary school" },
      { id: "indep", label: "Independent / specialised secondary school" },
      { id: "jc", label: "Junior college / pre-university programme" },
      { id: "intl", label: "International or foreign-system school" },
      { id: "private", label: "Private secondary school" },
      { id: "mi", label: "Millennia Institute" }
    ],
    extractor: (r, catId) => {
      const sch = r.answers?.q4_schooling || '';
      if (catId === "govt") return sch.includes("Government");
      if (catId === "indep") return sch.includes("Independent");
      if (catId === "jc") return sch.includes("Junior college");
      if (catId === "intl") return sch.includes("International");
      if (catId === "private") return sch.includes("Private");
      if (catId === "mi") return sch.includes("Millennia");
      return false;
    }
  },

  // Service usage & subjects
  {
    id: "q6b_subjects",
    section: "Tuition Services & Subjects",
    title: "Q6b. Specific Subjects Currently or Recently Used (Pick Any)",
    type: "multi_select",
    categories: [
      { id: "math", label: "Mathematics or Additional Mathematics" },
      { id: "english", label: "English Language or General Paper" },
      { id: "sciences", label: "Biology, Chemistry or Physics (Pure or Combined)" },
      { id: "humanities", label: "Humanities (Geog, Hist, Social Studies, Lit)" },
      { id: "economics", label: "Economics or Business Management" },
      { id: "olevel", label: "O-Level or N-Level preparation" },
      { id: "alevel", label: "A-Level or H2 subject preparation" },
      { id: "study_skills", label: "Study skills, note-taking & revision strategy" }
    ],
    extractor: (r, catId) => {
      const subjs = r.answers?.q6b_types || [];
      if (catId === "math") return subjs.some(s => s.includes("Mathematics"));
      if (catId === "english") return subjs.some(s => s.includes("English") || s.includes("General Paper"));
      if (catId === "sciences") return subjs.some(s => s.includes("Biology") || s.includes("Chemistry") || s.includes("Physics"));
      if (catId === "humanities") return subjs.some(s => s.includes("Humanities"));
      if (catId === "economics") return subjs.some(s => s.includes("Economics"));
      if (catId === "olevel") return subjs.some(s => s.includes("O-Level"));
      if (catId === "alevel") return subjs.some(s => s.includes("A-Level"));
      if (catId === "study_skills") return subjs.some(s => s.includes("Study skills"));
      return false;
    }
  },
  {
    id: "q7_hours",
    section: "Tuition Services & Subjects",
    title: "Q7. Approximate Weekly Hours Spent in Paid Services",
    type: "single_choice",
    categories: [
      { id: "h_1_2", label: "1 to less than 2 hours" },
      { id: "h_2_4", label: "2 to less than 4 hours" },
      { id: "h_4_6", label: "4 to less than 6 hours" },
      { id: "h_6_8", label: "6 to less than 8 hours" },
      { id: "h_8_plus", label: "8 hours or more" }
    ],
    extractor: (r, catId, label) => r.answers?.q7_hours === label
  },
  {
    id: "q8_decision",
    section: "Tuition Services & Subjects",
    title: "Q8. Tuition Provider Decision Maker",
    type: "single_choice",
    categories: [
      { id: "together", label: "Parent or guardian and I decide together" },
      { id: "myself", label: "I decide by myself" },
      { id: "parent", label: "My parent or guardian decides" },
      { id: "varies", label: "It varies depending on the provider" }
    ],
    extractor: (r, catId, label) => (r.answers?.q8_decision_role || '').toLowerCase().includes(catId)
  },

  // Providers & Zenith Performance
  {
    id: "q10_zenith_rel",
    section: "Provider Awareness & Relationship",
    title: "Q10. Zenith Tuition Group - Relationship Status",
    type: "single_choice",
    categories: [
      { id: "cur", label: "Currently use" },
      { id: "last6m", label: "Used in last 6 months, not current" },
      { id: "past", label: "Used, not in last 6 months" },
      { id: "considered", label: "Considered, never used" },
      { id: "heard", label: "Heard, not considered" }
    ],
    extractor: (r, catId, label) => r.answers?.q10_grid?.["Zenith tuition group"] === label
  },
  {
    id: "q16_zenith_csat",
    section: "Brand Evaluations (Zenith Focus)",
    title: "Q16. Zenith Tuition Group - Overall Satisfaction",
    type: "rating_scale",
    categories: [
      { id: "v_sat", label: "Very satisfied", scoreValue: 5 },
      { id: "sat", label: "Satisfied", scoreValue: 4 },
      { id: "neutral", label: "Neutral", scoreValue: 3 },
      { id: "dissat", label: "Dissatisfied / Very dissatisfied", scoreValue: 2 }
    ],
    extractor: (r, catId, label) => {
      const csat = r.answers?.brand_evaluations?.["Zenith tuition group"]?.q16_csat;
      if (catId === "v_sat") return csat === "Very satisfied";
      if (catId === "sat") return csat === "Satisfied";
      if (catId === "neutral") return csat === "Neutral";
      return csat === "Dissatisfied" || csat === "Very dissatisfied";
    }
  },
  {
    id: "q17_zenith_nps",
    section: "Brand Evaluations (Zenith Focus)",
    title: "Q17. Zenith Tuition Group - Net Promoter Score (NPS Segment)",
    type: "nps_scale",
    categories: [
      { id: "promoter", label: "Promoters (Score 9–10)", npsType: "promoter" },
      { id: "passive", label: "Passives (Score 7–8)", npsType: "passive" },
      { id: "detractor", label: "Detractors (Score 0–6)", npsType: "detractor" }
    ],
    extractor: (r, catId) => {
      const nps = r.answers?.brand_evaluations?.["Zenith tuition group"]?.q17_nps;
      if (nps === undefined || nps === null) return false;
      const num = Number(nps);
      if (catId === "promoter") return num >= 9;
      if (catId === "passive") return num >= 7 && num <= 8;
      return num <= 6;
    }
  },
  {
    id: "q14_kpc_top5",
    section: "Choice Criteria & Rankings",
    title: "Q14. Key Choice Criteria - Top 5 Ranked Factors (Pick Any)",
    type: "ranking_kpc",
    categories: [
      { id: "tutor_qual", label: "Tutor or instructor quality and expertise" },
      { id: "teach_style", label: "Teaching style that suits me" },
      { id: "track_record", label: "Proven track record of results or outcomes" },
      { id: "curriculum", label: "Curriculum quality & relevance to school/goals" },
      { id: "class_size", label: "Small class size or personal attention" },
      { id: "value_money", label: "Value for money" },
      { id: "location", label: "Convenient location" },
      { id: "hybrid", label: "Online or hybrid learning options" },
      { id: "reputation", label: "Brand reputation and trust" },
      { id: "materials", label: "Quality of notes, materials or technology" }
    ],
    extractor: (r, catId, label) => {
      const ranked = r.answers?.q14_ranked_kpcs || [];
      return ranked.some(k => k.toLowerCase().includes(catId.replace('_', ' ')) || k === label);
    }
  },
  {
    id: "q19_zenith_continue",
    section: "Retention & Switching",
    title: "Q19. Likelihood to Continue with Zenith Next 12 Months",
    type: "single_choice",
    categories: [
      { id: "ext_likely", label: "Extremely likely", scoreValue: 5 },
      { id: "likely", label: "Likely", scoreValue: 4 },
      { id: "neutral", label: "Neither likely nor unlikely", scoreValue: 3 },
      { id: "unlikely", label: "Unlikely / Not at all likely", scoreValue: 2 }
    ],
    extractor: (r, catId, label) => {
      const val = r.answers?.q19_continue?.["Zenith tuition group"];
      if (catId === "ext_likely") return val === "Extremely likely";
      if (catId === "likely") return val === "Likely";
      if (catId === "neutral") return val === "Neither likely nor unlikely";
      return val === "Unlikely" || val === "Not at all likely";
    }
  },
  {
    id: "q22_switched",
    section: "Retention & Switching",
    title: "Q22. Provider Switching in Past 12 Months",
    type: "single_choice",
    categories: [
      { id: "yes", label: "Yes (Switched provider in past 12m)" },
      { id: "no", label: "No (Did not switch)" }
    ],
    extractor: (r, catId) => (catId === "yes" ? r.answers?.q22_switched === "Yes" : r.answers?.q22_switched === "No")
  },
  {
    id: "q25_barriers",
    section: "Retention & Switching",
    title: "Q25. Barriers to Switching Away from Current Provider (Pick Any)",
    type: "multi_select",
    categories: [
      { id: "satisfied", label: "Satisfied with the teaching and my progress" },
      { id: "relation", label: "Good relationship with tutor or instructor" },
      { id: "history", label: "Tutor understands my learning needs & history" },
      { id: "disrupt", label: "Do not want to disrupt learning or exam prep" },
      { id: "convenient", label: "Location, timetable or format is convenient" }
    ],
    extractor: (r, catId, label) => {
      const bars = r.answers?.q25_barriers || [];
      return bars.some(b => b.toLowerCase().includes(catId) || b === label);
    }
  },
  {
    id: "q26_tutor_brand",
    section: "Perception & Brand Value",
    title: "Q26. Preference Driver: Specific Tutor vs Provider Brand",
    type: "single_choice",
    categories: [
      { id: "mostly_tutor", label: "Entirely / Mostly the tutor" },
      { id: "equal", label: "Roughly equal" },
      { id: "mostly_brand", label: "Mostly / Entirely the provider brand" }
    ],
    extractor: (r, catId) => {
      const val = (r.answers?.q26_tutor_vs_brand || '').toLowerCase();
      if (catId === "mostly_tutor") return val.includes("tutor");
      if (catId === "equal") return val.includes("equal");
      return val.includes("brand");
    }
  },
  {
    id: "q28_premium",
    section: "Perception & Brand Value",
    title: "Q28. Features that Justify a Higher Fee (Pick Any)",
    type: "multi_select",
    categories: [
      { id: "smaller", label: "Smaller classes or more individual attention" },
      { id: "experienced", label: "More experienced or highly skilled tutors" },
      { id: "results", label: "A strong record of improving students' results" },
      { id: "materials", label: "Better notes, learning materials or technology" },
      { id: "style", label: "A teaching style that suits how I learn" }
    ],
    extractor: (r, catId, label) => {
      const prems = r.answers?.q28_premium || [];
      return prems.some(p => p.toLowerCase().includes(catId) || p === label);
    }
  },
  {
    id: "q29_programmes",
    section: "Future Offerings",
    title: "Q29. Interest in Adjacent Educational Programmes (Pick Any)",
    type: "multi_select",
    categories: [
      { id: "ai", label: "Practical use of AI for study and productivity" },
      { id: "coding", label: "Coding and app or website development" },
      { id: "data", label: "Data analytics and digital skills" },
      { id: "debate", label: "Public speaking, debate and presentation skills" },
      { id: "finance", label: "Entrepreneurship and financial literacy" }
    ],
    extractor: (r, catId, label) => {
      const progs = r.answers?.q29_programmes || [];
      return progs.some(p => p.toLowerCase().includes(catId) || p === label);
    }
  }
];
