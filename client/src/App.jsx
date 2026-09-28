import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import StartInterview from "./pages/StartInterview";
import MCQAssessment from "./pages/MCQAssessment";
import CodingAssessment from "./pages/CodingAssessment";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewResults from "./pages/InterviewResults";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import LearningRoadmap from "./pages/LearningRoadmap";
import AdminDashboard from "./pages/AdminDashboard";
import ResearchDashboard from "./pages/ResearchDashboard";
import SystemHealthDashboard from "./pages/SystemHealthDashboard";
import SecurityAuditDashboard from "./pages/SecurityAuditDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobManagement from "./pages/JobManagement";
import ApplicationPipeline from "./pages/ApplicationPipeline";
import CandidateDetail from "./pages/CandidateDetail";
import CandidateComparison from "./pages/CandidateComparison";
import InterviewReplay from "./pages/InterviewReplay";
import AIBenchmarkDashboard from "./pages/AIBenchmarkDashboard";
import CandidateJobs from "./pages/CandidateJobs";
import InvitedAssessment from "./pages/InvitedAssessment";

function AppLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route
            path="/"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Candidate & Practice Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CandidateJobs />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/start"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StartInterview />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/mcq/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MCQAssessment />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/coding/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CodingAssessment />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InterviewRoom />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id/results"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InterviewResults />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:id/results"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InterviewResults />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning-roadmap"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LearningRoadmap />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <History />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Multimodal Interview Timeline Replay */}
          <Route
            path="/interview/:id/replay"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InterviewReplay />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Invited Assessment Link */}
          <Route
            path="/assessment/invite/:token"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InvitedAssessment />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Recruiter & Hiring Portal Routes */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RecruiterDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <JobManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/pipeline"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ApplicationPipeline />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/candidate/:applicationId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CandidateDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/comparison"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CandidateComparison />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/benchmarks"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AIBenchmarkDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Research & System Health Admin Routes */}
          <Route
            path="/research"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ResearchDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-health"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SystemHealthDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/security-audit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SecurityAuditDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found Routes */}
          <Route
            path="/404"
            element={
              <AppLayout>
                <NotFound />
              </AppLayout>
            }
          />
          <Route
            path="*"
            element={
              <AppLayout>
                <NotFound />
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;