# CodeVigilant AI

<div align="center">

**Production-Grade AI Technical Hiring, Adaptive Multi-Modal Assessment & Observability Platform**

[![React](https://img.shields.io/badge/Frontend-React_19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_8-646CFF?logo=vite)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_3.6_Flash-8E75B2?logo=google)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📌 Overview

**CodeVigilant AI** is an end-to-end, intelligent technical recruitment and skill evaluation platform designed to replace subjective, high-friction hiring processes with transparent, adaptive, and tamper-resistant assessments.

The platform bridges the entire technical recruitment lifecycle:
1. **Recruiter Workflow**: Job requisition authoring, AI-assisted resume parsing & skill-vector matching, candidate screening, custom assessment invitation links, multi-candidate weighted ranking matrices, and deep-dive candidate dossiers.
2. **Candidate Assessment Experience**: Adaptive multi-topic MCQs, real-time code editor with isolated multi-language sandbox execution, voice-enabled AI technical mock interviews with speech-to-text / text-to-speech, and personalized skill gap roadmaps.
3. **AI Observability & Benchmarking**: Real-time LLM latency telemetry, prompt drift evaluation, deterministic fallback validation, and empirical AI reliability benchmarking suites.
4. **Security & Adversarial Defenses**: Prompt injection defenses, IDOR protection, salted pseudonymous research exports, and execution sandboxing.

---

## 🏗 System Architecture & Repository Layout

```
CodeVigilant-AI/
├── client/                     # Frontend Application (React 19 + Vite 8)
│   ├── src/
│   │   ├── components/         # Shared UI components (Navbar, ProtectedRoute, etc.)
│   │   ├── context/            # AuthContext (JWT session state & RBAC)
│   │   ├── pages/              # Candidate, Recruiter, Admin & Practice views
│   │   │   ├── Home.jsx                    # Landing page & feature showcase
│   │   │   ├── Login.jsx / Register.jsx    # Authentication views
│   │   │   ├── Dashboard.jsx               # Candidate overview & stats
│   │   │   ├── CandidateJobs.jsx           # Job board & 1-click apply
│   │   │   ├── StartInterview.jsx          # Assessment topic & mode selector
│   │   │   ├── MCQAssessment.jsx           # Adaptive MCQ assessment engine
│   │   │   ├── CodingAssessment.jsx        # Code sandbox assessment
│   │   │   ├── InterviewRoom.jsx           # Voice & text AI interview room
│   │   │   ├── InterviewReplay.jsx         # Multimodal interview event replay
│   │   │   ├── InterviewResults.jsx        # Granular scoring & PDF download
│   │   │   ├── LearningRoadmap.jsx         # Visual skill development roadmap
│   │   │   ├── RecruiterDashboard.jsx      # Hiring pipeline & job funnels
│   │   │   ├── JobManagement.jsx           # Job creation & requirement editor
│   │   │   ├── ApplicationPipeline.jsx     # Candidate application stage tracker
│   │   │   ├── CandidateDetail.jsx         # Candidate evaluation dossier & decision
│   │   │   ├── CandidateComparison.jsx     # Weighted candidate comparison matrix
│   │   │   ├── AIBenchmarkDashboard.jsx    # LLM reliability benchmark suite
│   │   │   ├── SystemHealthDashboard.jsx   # Live system telemetry & API latency
│   │   │   ├── SecurityAuditDashboard.jsx  # Security test harness & verification
│   │   │   ├── ResearchDashboard.jsx       # A/B experiments & anonymized exports
│   │   │   └── NotFound.jsx                # 404 error page
│   │   ├── services/           # Axios API client modules
│   │   └── App.jsx             # React Router route registry
│   ├── .env.example            # Client environment template
│   └── package.json            # Client dependencies and build scripts
│
├── backend/                    # Backend REST API (FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── api/v1/endpoints/   # Modular API routes (auth, jobs, interview, recruiter, etc.)
│   │   ├── core/               # Configuration, security utils, database session
│   │   ├── models/             # SQLAlchemy relational database models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── services/           # Gemini AI generation, sandbox runner, RAG retrieval
│   ├── tests/                  # Automated unit, integration, and security test suite
│   ├── .env.example            # Backend environment template
│   └── requirements.txt        # Python dependencies
│
├── docs/                       # Project documentation & audit reports
│   └── SECURITY_AUDIT.md       # Threat modeling & security verification report
│
├── .gitignore                  # Monorepo secret & artifact exclusion rules
├── package.json                # Root workspace convenience scripts
└── README.md                   # Project documentation
```

---

## 🚀 Features & Status

### ✅ Implemented & Verified

- **Public & Authentication Foundation**:
  - Landing page with responsive feature highlights, architecture breakdown, and call-to-actions.
  - JWT-based authentication, user registration, role-based access control (`CANDIDATE` vs `ADMIN` / `RECRUITER`), and session expiry handling.
  - Clean 404 error routing and dual-state navigation bar.

- **Candidate Assessment Platform**:
  - **Adaptive MCQ Engine**: Dynamic difficulty scaling based on candidate performance, question timers, and instant answer validation.
  - **Coding Assessment Sandbox**: Integrated code editor supporting Python, JavaScript, Java, and C++, with standard input handling and execution timeout safeguards.
  - **Multimodal AI Mock Interview**: Interactive interview room with Web Speech API integration (voice STT candidate input and TTS interviewer audio playback) and adaptive follow-up probing.
  - **Comprehensive Result Dossier**: Breakdown by category, accuracy rate, integrity logs, skill radar visualizations, and PDF report downloads.
  - **Personalized Learning Roadmap**: Dynamically generated milestone roadmap targeting identified skill gaps.

- **Recruiter & Enterprise Hiring Workflow**:
  - **Job Requisition Management**: Author job postings with title, department, target skills, experience level, and customized passing cutoffs.
  - **Candidate Pipeline**: Visual application funnels across `APPLIED`, `SCREENING`, `INVITED`, `ASSESSED`, `SHORTLISTED`, `SELECTED`, and `REJECTED` stages.
  - **Automated Resume Matching**: Resume PDF/DOCX parsing with Gemini AI extracting candidate skills and calculating match scores against job requirements.
  - **Invitation Link Dispatch**: One-click token-based assessment invitations allowing candidates to jump directly into assessments.
  - **Candidate Comparison Matrix**: Multi-candidate comparative ranking table with real-time customizable evaluation weights (Aptitude, CS Fundamentals, DSA, DBMS, Coding, and Interview).
  - **Multimodal Interview Replay**: Chronological timeline audit of question prompts, spoken transcripts, latency telemetry, and dynamic follow-up probe trees.

- **AI Observability & Reliability**:
  - **Live Telemetry**: Real-time tracking of AI request latencies, token consumption, error rates, and prompt drift.
  - **Empirical Benchmarking**: Automated execution of benchmark suites measuring LLM accuracy and API availability.
  - **Deterministic Fallbacks**: Automatic fallback to validated question bank items if LLM generation encounters timeouts or formatting anomalies.

- **Security & Threat Mitigations**:
  - Passive structural prompt boundary framing to mitigate prompt injection.
  - Resource-level IDOR validation preventing unauthorized access across candidate submissions.
  - Salted pseudonymous research exports stripping all PII (names, emails, passwords).
  - Sanitized file upload paths to prevent path traversal.

### 🚧 Planned Roadmap

- [ ] **Distributed Sandbox Runners**: Dedicated Firecracker microVM / Docker worker pools for multi-tenant high-concurrency code execution.
- [ ] **Server-Side Audio Streaming**: Native WebRTC bidirectional audio streaming with real-time neural voice models.
- [ ] **ATS Integrations**: Two-way synchronization with Greenhouse, Lever, and Workday.
- [ ] **Live Multi-User Collaborative Code Pairing**: Real-time collaborative editor for live recruiter-candidate coding rounds.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Axios, Lucide Icons, CSS3 Variables |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, Python-Jose (JWT), Passlib (Bcrypt) |
| **Database** | PostgreSQL, ChromaDB (Vector Store) |
| **AI / LLM** | Google Gemini 3.6 Flash |
| **Testing** | Pytest, ESLint 9+ |

---

## ⚡ Quick Start & Installation

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10 or higher ([Download Python](https://www.python.org/))
- **PostgreSQL**: v14 or higher ([Download PostgreSQL](https://www.postgresql.org/download/))
- **Google Gemini API Key**: ([Obtain from Google AI Studio](https://aistudio.google.com/))

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/CodeVigilant-AI.git
cd CodeVigilant-AI
```

---

### 2. Backend Setup

1. **Navigate to the backend directory and create a virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS:**
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Copy the example environment file and fill in your PostgreSQL credentials and Gemini API key:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` with your preferred editor:*
   ```env
   SECRET_KEY=your_super_secret_jwt_key_here
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DB=codevigilant_db
   GEMINI_API_KEY=your_gemini_api_key_here
   CHROMA_HOST=localhost
   CHROMA_PORT=8000
   BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
   ```

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The API will be available at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).*

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional):**
   ```bash
   cp .env.example .env
   ```
   *Default API endpoint is `http://127.0.0.1:8000/api/v1`.*

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   *The web application will open at `http://localhost:5173`.*

---

## 🧪 Verification & Testing

### Running Frontend Checks

```bash
# In client/ directory:
npm run lint       # Run ESLint validation (0 errors)
npm run build      # Test production bundle build
```

### Running Backend Regression Tests

```bash
# In backend/ directory with active venv:
pytest -v
```

---

## 🔒 Security & Privacy

For an exhaustive audit of platform attack surfaces, threat modeling matrices, and defense verification, please review our [Security Audit Documentation](docs/SECURITY_AUDIT.md).

Key security practices:
- Never commit `.env` or credential files to version control.
- Ensure `SECRET_KEY` in production uses cryptographically secure entropy.
- All candidate research telemetry is anonymized using salted non-reversible hashes.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
