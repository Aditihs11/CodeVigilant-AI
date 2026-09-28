import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 & parsing clean error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";
    return Promise.reject(new Error(message));
  }
);

// ============================================================
// AUTH API
// ============================================================
export const authAPI = {
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put("/auth/me", data);
    return response.data;
  },
};

// ============================================================
// RESUME API
// ============================================================
export const resumeAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/resume/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/resume/me");
    return response.data;
  },
  deleteMe: async () => {
    const response = await api.delete("/resume/me");
    return response.data;
  },
};

// ============================================================
// CANDIDATE CONTINUAL SKILL MASTERY API
// ============================================================
export const skillsAPI = {
  getMySkills: async () => {
    const response = await api.get("/skills/me");
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get("/skills/me/history");
    return response.data;
  },
};

// ============================================================
// ASSESSMENTS API (Multi-Mode, RAG, Adaptive & PDF)
// ============================================================
export const assessmentAPI = {
  create: async (data) => {
    const response = await api.post("/assessments/", data);
    return response.data;
  },
  generateMCQs: async (assessmentId) => {
    const response = await api.post(`/assessments/${assessmentId}/generate-mcqs`);
    return response.data;
  },
  generateCoding: async (assessmentId) => {
    const response = await api.post(`/assessments/${assessmentId}/generate-coding`);
    return response.data;
  },
  getQuestions: async (assessmentId) => {
    const response = await api.get(`/assessments/${assessmentId}/questions`);
    return response.data;
  },
  submitMCQ: async (assessmentId, answersData) => {
    const response = await api.post(`/assessments/${assessmentId}/submit-mcq`, answersData);
    return response.data;
  },
  submitCode: async (assessmentId, codeData) => {
    const response = await api.post(`/assessments/${assessmentId}/submit-code`, codeData);
    return response.data;
  },
  getNextAdaptiveQuestion: async (assessmentId) => {
    const response = await api.post(`/assessments/${assessmentId}/next-adaptive-question`);
    return response.data;
  },
  getAdaptiveDecision: async (assessmentId) => {
    const response = await api.get(`/assessments/${assessmentId}/adaptive-decision`);
    return response.data;
  },
  recordIntegrityEvent: async (assessmentId, eventData) => {
    const response = await api.post(`/assessments/${assessmentId}/integrity-events`, eventData);
    return response.data;
  },
  getResults: async (assessmentId) => {
    const response = await api.get(`/assessments/${assessmentId}/results`);
    return response.data;
  },
  downloadReport: async (assessmentId) => {
    const response = await api.get(`/assessments/${assessmentId}/report.pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get("/assessments/analytics/summary");
    return response.data;
  },
};

// ============================================================
// INTERVIEWS API (100% Backward Compatible)
// ============================================================
export const interviewAPI = {
  create: async (data) => {
    const response = await api.post("/interviews/", data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get("/interviews/");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/interviews/${id}`);
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get("/interviews/analytics/summary");
    return response.data;
  },
};

// ============================================================
// QUESTION & ANSWER API
// ============================================================
export const questionAPI = {
  generate: async (interviewId) => {
    const response = await api.post(`/interviews/${interviewId}/generate-questions`);
    return response.data;
  },
  getByInterview: async (interviewId) => {
    const response = await api.get(`/interviews/${interviewId}/questions`);
    return response.data;
  },
};

export const answerAPI = {
  submit: async (interviewId, answerData) => {
    const response = await api.post(`/interviews/${interviewId}/answers`, answerData);
    return response.data;
  },
  getByInterview: async (interviewId) => {
    const response = await api.get(`/interviews/${interviewId}/answers`);
    return response.data;
  },
  getResults: async (interviewId) => {
    const response = await api.get(`/interviews/${interviewId}/results`);
    return response.data;
  },
};

// ============================================================
// ADMIN & REVIEWER API (With Observability & Health)
// ============================================================
export const adminAPI = {
  getOverview: async () => {
    const response = await api.get("/admin/overview");
    return response.data;
  },
  getCandidates: async () => {
    const response = await api.get("/admin/candidates");
    return response.data;
  },
  getAssessments: async () => {
    const response = await api.get("/admin/assessments");
    return response.data;
  },
  getReviewQueue: async (params = {}) => {
    const response = await api.get("/admin/questions/review", { params });
    return response.data;
  },
  approveQuestion: async (questionId) => {
    const response = await api.post(`/admin/questions/${questionId}/approve`);
    return response.data;
  },
  rejectQuestion: async (questionId) => {
    const response = await api.post(`/admin/questions/${questionId}/reject`);
    return response.data;
  },
  editQuestion: async (questionId, payload) => {
    const response = await api.put(`/admin/questions/${questionId}`, payload);
    return response.data;
  },
  getQuestionQuality: async () => {
    const response = await api.get("/admin/question-quality");
    return response.data;
  },
  getSystemHealth: async () => {
    const response = await api.get("/admin/system-health");
    return response.data;
  },
  getAIObservability: async () => {
    const response = await api.get("/admin/ai-observability");
    return response.data;
  },
  getAIErrors: async (params = {}) => {
    const response = await api.get("/admin/ai-errors", { params });
    return response.data;
  },
  getQuestionTrace: async (identifier) => {
    const response = await api.get(`/admin/question-trace/${identifier}`);
    return response.data;
  },
  cleanupLogs: async (retentionDays = 90) => {
    const response = await api.post(`/admin/observability/cleanup?retention_days=${retentionDays}`);
    return response.data;
  },
  runSecurityAudit: async () => {
    const response = await api.post("/admin/security-audit/run");
    return response.data;
  },
  getLatestSecurityAudit: async () => {
    const response = await api.get("/admin/security-audit/latest");
    return response.data;
  },
  getSecurityFindings: async (params = {}) => {
    const response = await api.get("/admin/security-audit/findings", { params });
    return response.data;
  },
  getSecurityAuditById: async (id) => {
    const response = await api.get(`/admin/security-audit/${id}`);
    return response.data;
  },
  promote: async (userId) => {
    const response = await api.post(`/admin/promote/${userId}`);
    return response.data;
  },
};

// ============================================================
// RESEARCH EXPERIMENTS & A/B TESTING API
// ============================================================
export const researchAPI = {
  getExperiments: async (params = {}) => {
    const response = await api.get("/research/experiments", { params });
    return response.data;
  },
  getExperiment: async (id) => {
    const response = await api.get(`/research/experiments/${id}`);
    return response.data;
  },
  createExperiment: async (data) => {
    const response = await api.post("/research/experiments", data);
    return response.data;
  },
  startExperiment: async (id) => {
    const response = await api.post(`/research/experiments/${id}/start`);
    return response.data;
  },
  stopExperiment: async (id) => {
    const response = await api.post(`/research/experiments/${id}/stop`);
    return response.data;
  },
  assignAssessment: async (id, data) => {
    const response = await api.post(`/research/experiments/${id}/assign`, data);
    return response.data;
  },
  getParticipants: async (id) => {
    const response = await api.get(`/research/experiments/${id}/participants`);
    return response.data;
  },
  getResults: async (id) => {
    const response = await api.get(`/research/experiments/${id}/results`);
    return response.data;
  },
  createSnapshot: async (id) => {
    const response = await api.post(`/research/experiments/${id}/snapshot`);
    return response.data;
  },
  getDataset: async (id) => {
    const response = await api.get(`/research/experiments/${id}/dataset`);
    return response.data;
  },
  getStatistics: async (id) => {
    const response = await api.get(`/research/experiments/${id}/statistics`);
    return response.data;
  },
  getConvergence: async (id) => {
    const response = await api.get(`/research/experiments/${id}/convergence`);
    return response.data;
  },
  getQuestionQuality: async (id) => {
    const response = await api.get(`/research/experiments/${id}/question-quality`);
    return response.data;
  },
  getDiscrimination: async (id) => {
    const response = await api.get(`/research/experiments/${id}/discrimination`);
    return response.data;
  },
  getMastery: async (id) => {
    const response = await api.get(`/research/experiments/${id}/mastery`);
    return response.data;
  },
  getReport: async (id) => {
    const response = await api.get(`/research/experiments/${id}/report`);
    return response.data;
  },
  exportCsv: async (id) => {
    const response = await api.get(`/research/experiments/${id}/export/csv`, {
      responseType: "blob",
    });
    return response.data;
  },
  exportJson: async (id) => {
    const response = await api.get(`/research/experiments/${id}/export/json`);
    return response.data;
  },
};

// ============================================================
// PUBLIC SYSTEM HEALTH API
// ============================================================
export const healthAPI = {
  getBasic: async () => {
    const response = await api.get("/health");
    return response.data;
  },
  getDatabase: async () => {
    const response = await api.get("/health/database");
    return response.data;
  },
  getGemini: async () => {
    const response = await api.get("/health/gemini");
    return response.data;
  },
  getRag: async () => {
    const response = await api.get("/health/rag");
    return response.data;
  },
  getCodeExecutor: async () => {
    const response = await api.get("/health/code-executor");
    return response.data;
  },
};

// ============================================================
// JOBS & ASSESSMENT CONFIGURATION API
// ============================================================
export const jobsAPI = {
  list: async (params = {}) => {
    const response = await api.get("/jobs", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/jobs", data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },
  publish: async (id) => {
    const response = await api.post(`/jobs/${id}/publish`);
    return response.data;
  },
  close: async (id) => {
    const response = await api.post(`/jobs/${id}/close`);
    return response.data;
  },
  archive: async (id) => {
    const response = await api.post(`/jobs/${id}/archive`);
    return response.data;
  },
  getApplications: async (id, params = {}) => {
    const response = await api.get(`/jobs/${id}/applications`, { params });
    return response.data;
  },
};

// ============================================================
// CANDIDATE APPLICATIONS & HIRING PIPELINE API
// ============================================================
export const applicationsAPI = {
  apply: async (jobId, data = {}) => {
    const response = await api.post(`/applications/apply/${jobId}`, data);
    return response.data;
  },
  getMyApplications: async () => {
    const response = await api.get("/applications/my");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },
  screenEligibility: async (id) => {
    const response = await api.post(`/applications/${id}/screen-eligibility`);
    return response.data;
  },
  invite: async (id, data = {}) => {
    const response = await api.post(`/applications/${id}/invite`, data);
    return response.data;
  },
  scoreAndShortlist: async (id) => {
    const response = await api.post(`/applications/${id}/score-and-shortlist`);
    return response.data;
  },
  recordDecision: async (id, data) => {
    const response = await api.post(`/applications/${id}/decision`, data);
    return response.data;
  },
};

// ============================================================
// ASSESSMENT INVITATIONS & SECURE LAUNCH API
// ============================================================
export const invitationsAPI = {
  verifyToken: async (token) => {
    const response = await api.get(`/invitations/${token}/verify`);
    return response.data;
  },
  startAssessment: async (token) => {
    const response = await api.post(`/invitations/${token}/start`);
    return response.data;
  },
};

// ============================================================
// MULTIMODAL VOICE INTERVIEW & TIMELINE REPLAY API
// ============================================================
export const voiceInterviewAPI = {
  transcribeSpeech: async (formData) => {
    const response = await api.post("/voice-interview/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  getTTSConfig: async (text, voice = "en-US-Standard-C") => {
    const response = await api.post("/voice-interview/tts", { text, voice });
    return response.data;
  },
  submitAnswer: async (interviewId, data) => {
    const response = await api.post(`/voice-interview/interviews/${interviewId}/submit-answer`, data);
    return response.data;
  },
  getTimeline: async (interviewId) => {
    const response = await api.get(`/voice-interview/interviews/${interviewId}/timeline`);
    return response.data;
  },
};

// ============================================================
// RECRUITER COMPARISON, RANKING & AUDITING API
// ============================================================
export const recruiterAPI = {
  getFunnelOverview: async () => {
    const response = await api.get("/recruiter/funnel-overview");
    return response.data;
  },
  compareCandidates: async (data) => {
    const response = await api.post("/recruiter/candidate-comparison", data);
    return response.data;
  },
  getComparisonSnapshot: async (snapshotId) => {
    const response = await api.get(`/recruiter/candidate-comparison/${snapshotId}`);
    return response.data;
  },
  getAuditLogs: async (params = {}) => {
    const response = await api.get("/recruiter/audit-logs", { params });
    return response.data;
  },
};

// ============================================================
// EMPIRICAL AI BENCHMARKS API
// ============================================================
export const benchmarksAPI = {
  runBenchmark: async (data = {}) => {
    const response = await api.post("/benchmarks/run", data);
    return response.data;
  },
  getRuns: async (params = {}) => {
    const response = await api.get("/benchmarks/runs", { params });
    return response.data;
  },
  getRunDetails: async (runId) => {
    const response = await api.get(`/benchmarks/runs/${runId}`);
    return response.data;
  },
};

export default api;

