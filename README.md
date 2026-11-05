# OpenSurvey Cloud 📊

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18%2F19-blue.svg)](https://react.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/kuldip3316-sudo/opensurvey-cloud/pulls)

> **Open-source research survey builder and runtime engine with conditional skip logic, quotas, and cross-tab analytics.**

OpenSurvey Cloud is a self-hostable, developer-friendly alternative to costly enterprise survey suites (like Qualtrics, Decipher, and Forsta). Designed specifically for academic researchers, universities, non-profits, and field interviewers who need complex logic routing without proprietary subscription lock-ins.

---

## 🌟 Key Features

* **Visual Drag & Configure Survey Builder**:
  * 8 core question types: Single Choice, Multiple Choice, Rating Scales, NPS, Matrix Grids, Item Ranking, Open Text, and Numeric/Currency fields.
  * Real-time metadata, slug configuration, and custom branding preview.

* **Advanced Conditional Logic Engine**:
  * Dynamic skip patterns, forward jumps, and branching based on answer triggers.
  * Polite screener terminations with custom disqualification reason codes.
  * Question-level and cross-sectional piping.

* **Demographic Quota Management**:
  * Real-time quota enforcement with in-memory TTL caching.
  * Automatic `QUOTA_FULL` routing to prevent over-sampling specific demographic segments.

* **Resilient Respondent Runtime**:
  * **Zero-Loss Draft Tracking**: Background question-by-question draft auto-save via `navigator.sendBeacon` to analyze drop-off points.
  * **Anti-PII Scrubbing**: Built-in regex filters preventing accidental phone number or email disclosure in open-ended responses.
  * **Device & Fraud Controls**: Prevents duplicate submissions and catches speeders.

* **AI Questionnaire Ingestion (Optional)**:
  * Ingest Word (`.docx`) and PDF research briefs into structured survey schemas.
  * Built-in 20+ Virtual Bot Simulator that validates logic routing and screenouts prior to launch.

* **Enterprise Data Export & Analytics**:
  * Standard 1-Header CSV export for Excel, R, and PowerBI.
  * 3-Header CSV export compatible with Qualtrics and Q Research Software (featuring binary dummies for multi-select questions).
  * Interactive cross-tabulation table generator with banner question breakouts.

---

## 🏗️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│               OpenSurvey Cloud Frontend                │
│    React 18/19 • Vite • Tailwind CSS • Lucide Icons    │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                Express.js Ingestion API                │
│   • Logic & Quota Cache   • Zero-Loss Ingestion Queue  │
│   • Multi-Format Exporter • Document Parser            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             PostgreSQL (Supabase Cloud)                │
│   • surveys   • survey_responses   • survey_reports    │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **yarn**

### 1. Clone & Install
```bash
git clone https://github.com/kuldip3316-sudo/opensurvey-cloud.git
cd opensurvey-cloud
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5055
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For AI brief ingestion
OPENAI_API_KEY=your_openai_api_key
```

### 3. Run Locally
```bash
# Starts both frontend (port 5173) and backend API (port 5055)
npm run dev
```

* **Frontend Builder & Studio**: `http://localhost:5173`
* **Backend API**: `http://localhost:5055`
* **Local Data Backups**: `./data/survey_responses.csv`

---

## 📂 Project Structure

```text
├── server/
│   ├── server.js              # Express API & quota caching engine
│   ├── aiSurveyIngestion.js   # Document text extraction & schema normalization
│   ├── surveySimulator.js     # Virtual Bot logic testing suite
│   ├── qualtricsExport.js     # 3-header Qualtrics CSV format builder
│   └── supabase.js            # Database client
├── src/
│   ├── components/
│   │   ├── builder/           # SurveyBuilder, LogicRuleEditor, QuotaModal
│   │   ├── runtime/           # DynamicSurveyRuntime (respondent-facing)
│   │   ├── studio/            # Cross-tabs, response table, metrics
│   │   └── dashboard/         # Project library & AI import modal
│   ├── App.jsx                # Root router & layout
│   └── main.jsx               # Entrypoint
├── supabase_schema.sql        # Database table definitions
└── package.json
```

---

## 🤝 Contributing

Contributions, bug reports, and pull requests are warmly welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
