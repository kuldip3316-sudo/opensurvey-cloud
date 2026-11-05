import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PROVIDERS, KPCS, SG_LOCATIONS, SG_IP_PREFIXES } from './constants.js';
import { ZENITH_VERBATIMS_HIGH, ZENITH_VERBATIMS_MID, GENERAL_VERBATIMS_HIGH, GENERAL_VERBATIMS_MID } from './verbatims.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const jsonFilePath = path.join(dataDir, 'survey_responses.json');
const csvFilePath = path.join(dataDir, 'survey_responses.csv');

function randomIp() {
  const prefix = SG_IP_PREFIXES[Math.floor(Math.random() * SG_IP_PREFIXES.length)];
  return `${prefix}${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSample(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDistributedTimestamp(index, total) {
  const now = Date.now();
  const offsetMs = (total - index) * (259200000 / total) + randomInt(10000, 600000);
  return new Date(now - offsetMs).toISOString();
}

export function generate400Dataset() {
  const responses = [];

  // PART 1: 50 DISQUALIFIED RESPONDENTS
  // 1.1 Age Screenouts (10)
  const ageOutValues = [11, 12, 11, 12, 20, 21, 22, 20, 21, 23];
  for (let i = 0; i < 10; i++) {
    const age = ageOutValues[i];
    responses.push({
      id: `RESP_DISQ_AGE_${100 + i}`,
      timestamp: getDistributedTimestamp(i, 400),
      status: 'TERMINATED_AGE_OUT_OF_RANGE',
      duration_seconds: randomInt(25, 65),
      ip_address: randomIp(),
      location: randomChoice(SG_LOCATIONS),
      flags: { age, terminationStage: 'Q1' },
      brand_loop: [],
      answers: { q1_age: age }
    });
  }

  // 1.2 Country Screenouts (8)
  const nonSgCountries = ["Malaysia", "Indonesia", "China", "India", "Australia", "Malaysia", "United Kingdom", "Indonesia"];
  for (let i = 0; i < 8; i++) {
    const age = randomInt(14, 18);
    const country = nonSgCountries[i];
    responses.push({
      id: `RESP_DISQ_CTRY_${200 + i}`,
      timestamp: getDistributedTimestamp(10 + i, 400),
      status: 'TERMINATED_NOT_SINGAPORE_RESIDENT',
      duration_seconds: randomInt(35, 80),
      ip_address: randomIp(),
      location: `${country} (Overseas)`,
      flags: { age, country, terminationStage: 'Q2' },
      brand_loop: [],
      answers: { q1_age: age, q2_country: country }
    });
  }

  // 1.3 Status Screenouts (6)
  for (let i = 0; i < 6; i++) {
    const age = randomInt(14, 17);
    responses.push({
      id: `RESP_DISQ_STAT_${300 + i}`,
      timestamp: getDistributedTimestamp(18 + i, 400),
      status: 'TERMINATED_STATUS_INELIGIBLE',
      duration_seconds: randomInt(45, 95),
      ip_address: randomIp(),
      location: randomChoice(SG_LOCATIONS),
      flags: { age, country: 'Singapore', terminationStage: 'Q2a' },
      brand_loop: [],
      answers: {
        q1_age: age,
        q2_country: 'Singapore',
        q2a_status: 'Not sure / Prefer not to say'
      }
    });
  }

  // 1.4 Schooling Screenouts (16)
  const ineligibleSchools = [
    "Polytechnic", "Polytechnic", "Polytechnic", "Polytechnic",
    "Polytechnic", "Polytechnic", "Polytechnic", "Polytechnic",
    "ITE", "ITE", "ITE", "ITE",
    "Private diploma or another post-secondary institution",
    "Private diploma or another post-secondary institution",
    "Special Education (SPED) school",
    "Not currently enrolled"
  ];
  for (let i = 0; i < 16; i++) {
    const age = randomInt(16, 19);
    const school = ineligibleSchools[i];
    responses.push({
      id: `RESP_DISQ_SCH_${400 + i}`,
      timestamp: getDistributedTimestamp(24 + i, 400),
      status: 'TERMINATED_SCHOOLING_INELIGIBLE',
      duration_seconds: randomInt(55, 120),
      ip_address: randomIp(),
      location: randomChoice(SG_LOCATIONS),
      flags: { age, country: 'Singapore', schooling: school, terminationStage: 'Q4' },
      brand_loop: [],
      answers: {
        q1_age: age,
        q2_country: 'Singapore',
        q2a_status: Math.random() < 0.85 ? 'Singapore citizen' : 'Permanent resident',
        q3_gender: Math.random() < 0.5 ? 'Female' : 'Male',
        q4_schooling: school
      }
    });
  }

  // 1.5 No Active Tuition Screenouts (5)
  for (let i = 0; i < 5; i++) {
    const age = randomInt(14, 17);
    responses.push({
      id: `RESP_DISQ_Q6_${500 + i}`,
      timestamp: getDistributedTimestamp(40 + i, 400),
      status: 'TERMINATED_NO_CURRENT_OR_RECENT_TUITION',
      duration_seconds: randomInt(70, 140),
      ip_address: randomIp(),
      location: randomChoice(SG_LOCATIONS),
      flags: { age, country: 'Singapore', terminationStage: 'Q6' },
      brand_loop: [],
      answers: {
        q1_age: age,
        q2_country: 'Singapore',
        q2a_status: 'Singapore citizen',
        q3_gender: Math.random() < 0.5 ? 'Female' : 'Male',
        q4_schooling: 'Government, government-aided or autonomous secondary school',
        q5_level: age <= 14 ? 'Secondary 2' : 'Secondary 4',
        q6_matrix: {
          "Academic subject tuition or tutoring (e.g. Mathematics, English, Science, Economics)": "Do not use and would not consider",
          "Examination or test-preparation services (e.g. O-Level, A-Level, IB preparation)": "Do not currently use, but would consider",
          "Academic-based enrichment (e.g. reading, writing, debate, languages, advanced mathematics, study skills)": "Do not use and would not consider",
          "Hobby or skill-based enrichment (e.g. music, art, drama, dance, sport, coding, robotics)": "Do not use and would not consider"
        }
      }
    });
  }

  // 1.6 No Active Provider Screenouts (5)
  for (let i = 0; i < 5; i++) {
    const age = randomInt(15, 18);
    const q10InactiveGrid = {};
    PROVIDERS.forEach(p => {
      q10InactiveGrid[p] = randomChoice(["Never heard of it", "Heard, not considered", "Considered, never used"]);
    });

    responses.push({
      id: `RESP_DISQ_Q10_${600 + i}`,
      timestamp: getDistributedTimestamp(45 + i, 400),
      status: 'TERMINATED_NO_ACTIVE_PROVIDER_RELATIONSHIP',
      duration_seconds: randomInt(120, 200),
      ip_address: randomIp(),
      location: randomChoice(SG_LOCATIONS),
      flags: { age, country: 'Singapore', terminationStage: 'Q10' },
      brand_loop: [],
      answers: {
        q1_age: age,
        q2_country: 'Singapore',
        q2a_status: 'Singapore citizen',
        q3_gender: Math.random() < 0.5 ? 'Female' : 'Male',
        q4_schooling: 'Government, government-aided or autonomous secondary school',
        q5_level: 'Secondary 3',
        q6_matrix: {
          "Academic subject tuition or tutoring (e.g. Mathematics, English, Science, Economics)": "Currently use",
          "Examination or test-preparation services (e.g. O-Level, A-Level, IB preparation)": "Currently use",
          "Academic-based enrichment (e.g. reading, writing, debate, languages, advanced mathematics, study skills)": "Do not currently use, but would consider",
          "Hobby or skill-based enrichment (e.g. music, art, drama, dance, sport, coding, robotics)": "Do not use and would not consider"
        },
        q6b_types: ["Mathematics or Additional Mathematics"],
        q7_hours: "2 to less than 4 hours",
        q8_decision_role: "My parent or guardian and I decide together",
        q9_unaided: ["The Learning Lab", "Mavis Tutorial Centre", "Mind Stretcher"],
        q10_grid: q10InactiveGrid
      }
    });
  }

  // PART 2: 350 QUALIFIED RESPONDENTS
  const secSchools = [
    "Government, government-aided or autonomous secondary school",
    "Independent, specialised independent or specialised secondary school",
    "International or foreign-system school",
    "Private secondary school"
  ];
  
  const jcSchools = [
    "Junior college / pre-university programme",
    "Millennia Institute"
  ];

  const subjectsBank = [
    "Mathematics or Additional Mathematics",
    "English Language or General Paper",
    "Biology, Chemistry or Physics (Pure or Combined)",
    "Humanities (e.g. Geography, History, Social Studies, Literature)",
    "Economics or Business Management",
    "O-Level or N-Level preparation",
    "A-Level or H2 subject preparation",
    "Study skills, note-taking and revision strategy"
  ];

  for (let idx = 0; idx < 350; idx++) {
    const respNum = idx + 1;
    const respId = `RESP_SG_2026_${String(respNum).padStart(3, '0')}`;
    const timestamp = getDistributedTimestamp(50 + idx, 400);

    const randAge = Math.random();
    let age = 16;
    if (randAge < 0.08) age = 13;
    else if (randAge < 0.20) age = 14;
    else if (randAge < 0.38) age = 15;
    else if (randAge < 0.64) age = 16;
    else if (randAge < 0.82) age = 17;
    else if (randAge < 0.96) age = 18;
    else age = 19;

    let q2a_status = 'Singapore citizen';
    let q2b_citizenship = '';
    let isInternational = false;
    const randRes = Math.random();
    if (randRes < 0.73) {
      q2a_status = 'Singapore citizen';
    } else if (randRes < 0.91) {
      q2a_status = 'Permanent resident';
    } else {
      q2a_status = randomChoice(["Student’s Pass holder", "Dependant’s Pass holder"]);
      isInternational = true;
      q2b_citizenship = randomChoice(["Malaysia", "China", "India", "Indonesia", "United Kingdom", "Australia", "Japan"]);
    }

    let q3_gender = 'Female';
    const randGen = Math.random();
    if (randGen < 0.51) q3_gender = 'Female';
    else if (randGen < 0.97) q3_gender = 'Male';
    else q3_gender = randomChoice(["Non-binary or another identity", "Prefer not to say"]);

    let q4_schooling = '';
    let q5_level = '';

    if (age <= 16) {
      const randSec = Math.random();
      if (randSec < 0.60) q4_schooling = secSchools[0];
      else if (randSec < 0.86) q4_schooling = secSchools[1];
      else if (randSec < 0.95) q4_schooling = secSchools[2];
      else q4_schooling = secSchools[3];

      if (age === 13) q5_level = 'Secondary 1';
      else if (age === 14) q5_level = 'Secondary 2';
      else if (age === 15) q5_level = 'Secondary 3';
      else q5_level = randomChoice(['Secondary 4', 'Secondary 4', 'Secondary 5']);
    } else {
      const randJc = Math.random();
      if (randJc < 0.78) q4_schooling = jcSchools[0];
      else if (randJc < 0.88) q4_schooling = jcSchools[1];
      else if (randJc < 0.95) q4_schooling = secSchools[1];
      else q4_schooling = secSchools[2];

      if (age === 17) q5_level = 'Junior college / Pre-university Year 1';
      else if (age === 18) q5_level = 'Junior college / Pre-university Year 2';
      else q5_level = randomChoice(['Junior college / Pre-university Year 2', 'Other year or equivalent level']);
    }

    const q6_matrix = {
      "Academic subject tuition or tutoring (e.g. Mathematics, English, Science, Economics)": "Currently use",
      "Examination or test-preparation services (e.g. O-Level, A-Level, IB preparation)": Math.random() < 0.65 ? "Currently use" : "Used in the last 6 months, but not currently",
      "Academic-based enrichment (e.g. reading, writing, debate, languages, advanced mathematics, study skills)": Math.random() < 0.40 ? "Currently use" : (Math.random() < 0.6 ? "Do not currently use, but would consider" : "Do not use and would not consider"),
      "Hobby or skill-based enrichment (e.g. music, art, drama, dance, sport, coding, robotics)": Math.random() < 0.30 ? "Currently use" : (Math.random() < 0.5 ? "Do not currently use, but would consider" : "Do not use and would not consider")
    };

    const numSubj = randomInt(2, 4);
    const q6b_types = randomSample(subjectsBank, numSubj);

    let q6a_types = [];
    if (Object.values(q6_matrix).includes("Do not currently use, but would consider")) {
      q6a_types = randomSample([
        "Coding, robotics or STEM",
        "Drama, public speaking or debate",
        "Academic examination preparation",
        "Language tuition or enrichment",
        "Visual arts (e.g. drawing, painting, design)"
      ], randomInt(1, 2));
    }

    let q7_hours = '2 to less than 4 hours';
    const randH = Math.random();
    if (randH < 0.12) q7_hours = '1 to less than 2 hours';
    else if (randH < 0.46) q7_hours = '2 to less than 4 hours';
    else if (randH < 0.80) q7_hours = '4 to less than 6 hours';
    else if (randH < 0.93) q7_hours = '6 to less than 8 hours';
    else q7_hours = '8 hours or more';

    let q8_decision_role = 'My parent or guardian and I decide together';
    const randDec = Math.random();
    if (randDec < 0.54) q8_decision_role = 'My parent or guardian and I decide together';
    else if (randDec < 0.78) q8_decision_role = 'I decide by myself';
    else if (randDec < 0.95) q8_decision_role = 'My parent or guardian decides';
    else q8_decision_role = 'It varies depending on the provider';

    const unaidedOptions = [
      ["Zenith tuition group", "The Learning Lab", "Mind Stretcher"],
      ["Zenith", "Indigo Education Group", "Mavis Tutorial Centre"],
      ["The Learning Lab", "Zenith", "Aspire Hub"],
      ["Mavis Tutorial Centre", "Mind Stretcher", "EduFirst"],
      ["Zenith tuition group", "Learners' Lodge", "Indigo"],
      ["Mind Stretcher", "The Learning Lab", "Stalford"],
      ["Zenith", "The Learning Lab", "Overmuggers"],
      ["Indigo", "Zenith tuition group", "Mavis"]
    ];
    const q9_unaided = randomChoice(unaidedOptions);

    const q10_grid = {};
    const randZenith = Math.random();
    let zenithStatus = "Currently use";
    if (randZenith < 0.38) zenithStatus = "Currently use";
    else if (randZenith < 0.52) zenithStatus = "Used in last 6 months, not current";
    else if (randZenith < 0.70) zenithStatus = "Used, not in last 6 months";
    else if (randZenith < 0.85) zenithStatus = "Considered, never used";
    else zenithStatus = "Heard, not considered";

    q10_grid["Zenith tuition group"] = zenithStatus;

    const otherProviders = PROVIDERS.filter(p => p !== "Zenith tuition group");
    const activeCandidates = [];
    if (zenithStatus === "Currently use" || zenithStatus === "Used in last 6 months, not current") {
      activeCandidates.push("Zenith tuition group");
    }

    otherProviders.forEach(prov => {
      const r = Math.random();
      let status = "Never heard of it";
      if (prov === "The Learning Lab" || prov === "Mind Stretcher" || prov === "Mavis Tutorial Centre") {
        if (r < 0.22) status = "Currently use";
        else if (r < 0.38) status = "Used in last 6 months, not current";
        else if (r < 0.58) status = "Used, not in last 6 months";
        else if (r < 0.80) status = "Considered, never used";
        else status = "Heard, not considered";
      } else if (prov === "Indigo Education Group" || prov === "Aspire Hub Education" || prov === "Learners' Lodge") {
        if (r < 0.16) status = "Currently use";
        else if (r < 0.28) status = "Used in last 6 months, not current";
        else if (r < 0.48) status = "Used, not in last 6 months";
        else if (r < 0.72) status = "Considered, never used";
        else status = "Heard, not considered";
      } else if (prov === "Independent/private tutor") {
        if (r < 0.30) status = "Currently use";
        else if (r < 0.45) status = "Used in last 6 months, not current";
        else status = "Heard, not considered";
      } else {
        if (r < 0.08) status = "Currently use";
        else if (r < 0.18) status = "Used in last 6 months, not current";
        else if (r < 0.32) status = "Used, not in last 6 months";
        else if (r < 0.55) status = "Considered, never used";
        else if (r < 0.80) status = "Heard, not considered";
        else status = "Never heard of it";
      }

      q10_grid[prov] = status;
      if (status === "Currently use" || status === "Used in last 6 months, not current") {
        activeCandidates.push(prov);
      }
    });

    if (activeCandidates.length === 0) {
      q10_grid["Zenith tuition group"] = "Currently use";
      activeCandidates.push("Zenith tuition group");
    }

    const currentProviders = Object.entries(q10_grid).filter(([_, v]) => v === "Currently use").map(([k]) => k);
    const recentLapsedProviders = Object.entries(q10_grid).filter(([_, v]) => v === "Used in last 6 months, not current").map(([k]) => k);
    const everUsedProviders = Object.entries(q10_grid).filter(([_, v]) => ["Currently use", "Used in last 6 months, not current", "Used, not in last 6 months"].includes(v)).map(([k]) => k);
    const consideredNeverUsedProviders = Object.entries(q10_grid).filter(([_, v]) => v === "Considered, never used").map(([k]) => k);

    let primary_provider = '';
    if (currentProviders.length === 1) {
      primary_provider = currentProviders[0];
    } else if (currentProviders.length > 1) {
      if (currentProviders.includes("Zenith tuition group") && Math.random() < 0.70) {
        primary_provider = "Zenith tuition group";
      } else {
        primary_provider = currentProviders[0];
      }
    } else if (recentLapsedProviders.length > 0) {
      primary_provider = recentLapsedProviders[0];
    } else {
      primary_provider = everUsedProviders[0] || "Zenith tuition group";
    }

    const brand_loop = [];
    if (everUsedProviders.includes("Zenith tuition group")) {
      brand_loop.push("Zenith tuition group");
    }
    const currentPool = currentProviders.filter(p => p !== "Zenith tuition group");
    for (const p of currentPool) {
      if (brand_loop.length < 4 && !brand_loop.includes(p)) brand_loop.push(p);
    }
    const recentPool = recentLapsedProviders.filter(p => p !== "Zenith tuition group");
    for (const p of recentPool) {
      if (brand_loop.length < 4 && !brand_loop.includes(p)) brand_loop.push(p);
    }
    if (brand_loop.length === 0) {
      brand_loop.push("Zenith tuition group");
    }

    const brand_evaluations = {};
    brand_loop.forEach(brand => {
      const isZenith = (brand === "Zenith tuition group");
      
      const q12_sources = randomSample([
        "Recommendation from a friend or classmate",
        "Recommendation or decision by a parent or guardian",
        "Social media, such as Instagram or TikTok",
        "Online search, such as Google",
        "A sibling or family member attended",
        "Saw the centre, its signage or premises"
      ], randomInt(1, 2));

      const q13_modes = randomSample([
        "Small-group lessons in person with 2-6 students",
        "Classroom lessons in person with 7 or more students",
        "Hybrid lessons combining in-person and online delivery",
        "Live online lessons"
      ], randomInt(1, 2));

      let q16_csat = 'Satisfied';
      let q17_nps = 8;
      let q18_reason = '';

      if (isZenith) {
        const randZ = Math.random();
        if (randZ < 0.48) {
          q16_csat = 'Very satisfied';
          q17_nps = randomChoice([9, 10]);
          q18_reason = randomChoice(ZENITH_VERBATIMS_HIGH);
        } else if (randZ < 0.88) {
          q16_csat = 'Satisfied';
          q17_nps = randomChoice([7, 8, 9]);
          q18_reason = randomChoice(ZENITH_VERBATIMS_HIGH);
        } else {
          q16_csat = 'Neutral';
          q17_nps = randomChoice([5, 6]);
          q18_reason = randomChoice(ZENITH_VERBATIMS_MID);
        }
      } else {
        const randO = Math.random();
        if (randO < 0.35) {
          q16_csat = 'Very satisfied';
          q17_nps = randomChoice([8, 9, 10]);
          q18_reason = randomChoice(GENERAL_VERBATIMS_HIGH);
        } else if (randO < 0.78) {
          q16_csat = 'Satisfied';
          q17_nps = randomChoice([7, 8]);
          q18_reason = randomChoice(GENERAL_VERBATIMS_HIGH);
        } else {
          q16_csat = 'Neutral';
          q17_nps = randomChoice([5, 6]);
          q18_reason = randomChoice(GENERAL_VERBATIMS_MID);
        }
      }

      brand_evaluations[brand] = {
        q12_sources,
        q13_modes,
        q16_csat,
        q17_nps,
        q18_reason
      };
    });

    const q11_reasons = {};
    consideredNeverUsedProviders.slice(0, 3).forEach(prov => {
      q11_reasons[prov] = randomSample([
        "Fees were too high or value was unclear",
        "Location was inconvenient",
        "Suitable class timings were unavailable",
        "I have greater confidence in another provider/tutor",
        "Teaching approach or curriculum did not seem suitable"
      ], randomInt(1, 2));
    });

    const q14_ranked_kpcs = randomSample(KPCS, 5);

    const q19_continue = {};
    const q20_reasons = {};
    const q21_reasons = {};

    currentProviders.slice(0, 3).forEach(prov => {
      const isZenith = (prov === "Zenith tuition group");
      const rLikely = Math.random();
      let rating = "Likely";
      if (isZenith) {
        rating = rLikely < 0.55 ? "Extremely likely" : (rLikely < 0.90 ? "Likely" : "Neither likely nor unlikely");
      } else {
        rating = rLikely < 0.40 ? "Extremely likely" : (rLikely < 0.80 ? "Likely" : "Neither likely nor unlikely");
      }
      q19_continue[prov] = rating;

      if (rating === "Likely" || rating === "Extremely likely") {
        q20_reasons[prov] = randomSample([
          "Quality of teaching",
          "Good results or progress",
          "Curriculum relevant to my schoolwork or goals",
          "Convenient location",
          "Enjoyable and motivating lessons",
          "Good value for money"
        ], randomInt(1, 3));
      } else {
        q21_reasons[prov] = randomSample([
          "Inconvenient schedule",
          "Poor value for money",
          "Preference for another provider or self-study"
        ], randomInt(1, 2));
      }
    });

    const hasSwitched = Math.random() < 0.25;
    const q22_switched = hasSwitched ? 'Yes' : 'No';
    let q23_switched_from = '';
    let q24_reasons = [];
    if (hasSwitched) {
      q23_switched_from = randomChoice(PROVIDERS.filter(p => p !== primary_provider));
      q24_reasons = randomSample([
        "Moved to a different education stage",
        "Poor results or slow progress",
        "Teaching style did not suit me",
        "Schedule difficulty",
        "Location or travel inconvenience",
        "Fees or a price increase"
      ], randomInt(1, 3));
    }

    const q25_barriers = randomSample([
      "I am satisfied with the teaching and my progress",
      "I have a good relationship with my tutor or instructor",
      "I do not want to disrupt my learning or exam preparation",
      "The location, timetable or class format is convenient",
      "My tutor understands my learning needs and history"
    ], randomInt(1, 3));

    const q26_tutor_vs_brand = randomChoice([
      "Mostly the tutor",
      "Roughly equal",
      "Mostly the provider brand",
      "Entirely the tutor; the provider brand does not matter to me"
    ]);

    const q27_tutor_traits = randomSample([
      "Ability to explain clearly",
      "Strong subject knowledge",
      "Engaging teaching style",
      "Patience and encouragement",
      "Understanding of examination requirements",
      "Personalised attention"
    ], 3);

    const q28_premium = randomSample([
      "Smaller classes or more individual attention",
      "More experienced or highly skilled tutors",
      "A strong record of improving students’ results",
      "Better notes, learning materials or technology",
      "A teaching style that suits how I learn"
    ], 3);

    const q29_programmes = randomSample([
      "Practical use of AI for study and productivity",
      "Coding and app or website development",
      "Data analytics and digital skills",
      "Public speaking, debate and presentation skills",
      "Career readiness and interview preparation",
      "Entrepreneurship and financial literacy"
    ], randomInt(1, 3));

    const q30_enrolment = {};
    q29_programmes.forEach(prog => {
      q30_enrolment[prog] = randomChoice(["Likely", "Very likely", "Not sure", "Likely"]);
    });

    responses.push({
      id: respId,
      timestamp,
      status: 'QUALIFIED',
      duration_seconds: randomInt(420, 890),
      ip_address: randomIp(),
      location: randomChoice(SG_LOCATIONS),
      flags: {
        age,
        country: 'Singapore',
        isInternational,
        currentServices: Object.entries(q6_matrix).filter(([_, v]) => v === "Currently use").map(([k]) => k),
        currentProviders,
        recentLapsedProviders,
        everUsedProviders,
        consideredNeverUsedProviders,
        brandLoop: brand_loop,
        primaryProvider: primary_provider
      },
      brand_loop,
      answers: {
        q1_age: age,
        q2_country: 'Singapore',
        q2a_status,
        ...(isInternational ? { q2b_citizenship } : {}),
        q3_gender,
        q4_schooling,
        q5_level,
        q6_matrix,
        q6b_types,
        ...(q6a_types.length > 0 ? { q6a_types } : {}),
        q7_hours,
        q8_decision_role,
        q9_unaided,
        q10_grid,
        ...(Object.keys(q11_reasons).length > 0 ? { q11_reasons } : {}),
        primary_provider,
        ...(currentProviders.length > 1 ? { q12_1_primary: primary_provider } : {}),
        brand_evaluations,
        q14_ranked_kpcs,
        q19_continue,
        q20_reasons,
        q21_reasons,
        q22_switched,
        ...(hasSwitched ? { q23_switched_from, q24_reasons } : {}),
        q25_barriers,
        q26_tutor_vs_brand,
        q27_tutor_traits,
        q28_premium,
        q29_programmes,
        q30_enrolment
      }
    });
  }

  return responses;
}

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

function flattenResponseForCsv(r) {
  const q6 = r.answers?.q6_matrix || {};
  const getQ6 = (term) => {
    for (const [k, v] of Object.entries(q6)) {
      if (k.toLowerCase().includes(term.toLowerCase())) return v;
    }
    return '';
  };

  const evals = r.answers?.brand_evaluations || {};
  const zenithEval = evals['Zenith tuition group'] || {};
  const primaryProv = r.answers?.primary_provider || '';
  const primaryEval = evals[primaryProv] || {};

  return {
    respondent_id: r.id || '',
    timestamp: r.timestamp || new Date().toISOString(),
    status: r.status || 'QUALIFIED',
    duration_seconds: r.duration_seconds || 0,
    ip_address: r.ip_address || '',
    location: r.location || '',
    
    // Demographics & Screening
    q1_age: r.answers?.q1_age ?? '',
    q2_country: r.answers?.q2_country ?? '',
    q2a_status: r.answers?.q2a_status ?? '',
    q2b_citizenship: r.answers?.q2b_citizenship ?? '',
    is_international: (r.flags?.isInternational || r.flags?.is_international) ? 'YES' : 'NO',
    q3_gender: r.answers?.q3_gender ?? '',
    q4_schooling: r.answers?.q4_schooling ?? '',
    q5_current_level: r.answers?.q5_level ?? '',
    
    // Q6 Matrix (Tuition categories)
    q6_academic_tuition: getQ6('Academic subject tuition'),
    q6_exam_prep: getQ6('Examination or test-prep'),
    q6_academic_enrichment: getQ6('Academic-based enrichment'),
    q6_hobby_enrichment: getQ6('Hobby or skill-based enrichment'),
    
    // Q6 Deep dives
    q6a_considered_types: Array.isArray(r.answers?.q6a_types) ? r.answers.q6a_types.join('; ') : (r.answers?.q6a_types ?? ''),
    q6b_used_types: Array.isArray(r.answers?.q6b_types) ? r.answers.q6b_types.join('; ') : (r.answers?.q6b_types ?? ''),
    q6c_stopping_reasons: Array.isArray(r.answers?.q6c_reasons) ? r.answers.q6c_reasons.join('; ') : (r.answers?.q6c_reasons ?? ''),
    
    // Frequency & Decision
    q7_weekly_hours: r.answers?.q7_hours ?? '',
    q8_decision_role: r.answers?.q8_decision_role ?? '',
    
    // Provider Awareness & Relationship
    q9_unaided_brand_1: r.answers?.q9_unaided?.[0] ?? '',
    q9_unaided_brand_2: r.answers?.q9_unaided?.[1] ?? '',
    q9_unaided_brand_3: r.answers?.q9_unaided?.[2] ?? '',
    q10_provider_relationships: r.answers?.q10_grid ? JSON.stringify(r.answers.q10_grid) : '',
    q11_reasons_not_choosing: r.answers?.q11_reasons ? JSON.stringify(r.answers.q11_reasons) : '',
    
    // Primary & Loops
    primary_provider: primaryProv,
    brand_loop_providers: Array.isArray(r.brand_loop) ? r.brand_loop.join('; ') : '',
    
    // Key Cross-Tabulation Metrics
    zenith_relationship: r.answers?.q10_grid?.['Zenith tuition group'] ?? '',
    zenith_csat: zenithEval.q16_csat ?? '',
    zenith_nps: zenithEval.q17_nps ?? '',
    zenith_reason: zenithEval.q18_reason ?? '',
    
    primary_csat: primaryEval.q16_csat ?? '',
    primary_nps: primaryEval.q17_nps ?? '',
    primary_reason: primaryEval.q18_reason ?? '',
    
    brand_evaluations_json: r.answers?.brand_evaluations ? JSON.stringify(r.answers.brand_evaluations) : '',
    
    // Choice Criteria & Rankings
    q14_top_5_kpcs: Array.isArray(r.answers?.q14_ranked_kpcs) ? r.answers.q14_ranked_kpcs.join('; ') : '',
    
    // Retention & Switching
    q19_likelihood_to_continue: r.answers?.q19_continue ? JSON.stringify(r.answers.q19_continue) : '',
    q20_continuation_reasons: r.answers?.q20_reasons ? (typeof r.answers.q20_reasons === 'object' ? JSON.stringify(r.answers.q20_reasons) : r.answers.q20_reasons) : '',
    q21_discontinuation_reasons: r.answers?.q21_reasons ? (typeof r.answers.q21_reasons === 'object' ? JSON.stringify(r.answers.q21_reasons) : r.answers.q21_reasons) : '',
    q22_switched_12m: r.answers?.q22_switched ?? '',
    q23_switched_from: r.answers?.q23_switched_from ?? '',
    q24_switching_reasons: Array.isArray(r.answers?.q24_reasons) ? r.answers.q24_reasons.join('; ') : '',
    q25_switching_barriers: Array.isArray(r.answers?.q25_barriers) ? r.answers.q25_barriers.join('; ') : '',
    
    // Tutor vs Brand & Premium
    q26_tutor_vs_brand: r.answers?.q26_tutor_vs_brand ?? '',
    q27_tutor_characteristics: Array.isArray(r.answers?.q27_tutor_traits) ? r.answers.q27_tutor_traits.join('; ') : '',
    q28_premium_justifications: Array.isArray(r.answers?.q28_premium) ? r.answers.q28_premium.join('; ') : '',
    
    // Future Programmes (Q29, Q30)
    q29_new_programmes_interested: Array.isArray(r.answers?.q29_programmes) ? r.answers.q29_programmes.join('; ') : '',
    q30_enrolment_likelihood: r.answers?.q30_enrolment ? JSON.stringify(r.answers.q30_enrolment) : '',
    
    raw_payload: JSON.stringify(r.answers || {})
  };
}

function syncCsv(responses) {
  const flattenedList = responses.map(flattenResponseForCsv);
  const headers = Object.keys(flattenedList[0]);
  const rows = [headers.join(',')];

  for (const item of flattenedList) {
    const line = headers.map(h => escapeCsvCell(item[h])).join(',');
    rows.push(line);
  }

  fs.writeFileSync(csvFilePath, rows.join('\n') + '\n', 'utf8');
}

// Generate & Write
const dataset = generate400Dataset();
console.log(`Generated total: ${dataset.length} records`);
const qualified = dataset.filter(r => r.status === 'QUALIFIED').length;
const terminated = dataset.filter(r => r.status && r.status.startsWith('TERMINATED')).length;
console.log(`Qualified: ${qualified} (Target: 350)`);
console.log(`Terminated: ${terminated} (Target: 50)`);

fs.writeFileSync(jsonFilePath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`Successfully saved JSON to ${jsonFilePath}`);

syncCsv(dataset);
console.log(`Successfully saved CSV to ${csvFilePath}`);
