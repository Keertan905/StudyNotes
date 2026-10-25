import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Landing & Onboarding
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';

// Public Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PersonalInfoPage from './pages/auth/PersonalInfoPage';

// Authenticated App Shell & Pages
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/app/DashboardPage';
import SubjectsPage from './pages/app/SubjectsPage';
import NotesPage from './pages/app/NotesPage';
import TutorPage from './pages/app/TutorPage';
import QuizPage from './pages/app/QuizPage';
import TimerPage from './pages/app/TimerPage';
import HistoryPage from './pages/app/HistoryPage';
import SettingsPage from './pages/app/SettingsPage';
import YouTubeFinderPage from './pages/app/YouTubeFinderPage';
import LectureSummarizerPage from './pages/app/LectureSummarizerPage';
import CodeExplainerPage from './pages/app/CodeExplainerPage';
import OfflineLibraryPage from './pages/app/OfflineLibraryPage';
import RewardsPage from './pages/app/RewardsPage';
import AdminDashboardPage from './pages/app/AdminDashboardPage';
import DiagramMakerPage from './pages/app/DiagramMakerPage';
import VirtualLabPage from './pages/app/VirtualLabPage';
import ProblemSolverPage from './pages/app/ProblemSolverPage';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Admin-only route guard
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Public-only route (redirect to /dashboard if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Landing page at root */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* Onboarding & Profile Completion route */}
      <Route path="/personal-info" element={<PersonalInfoPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      {/* Authenticated routes inside AppLayout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/tutor" element={<TutorPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/flashcards" element={<Navigate to="/dashboard" replace />} />
        <Route path="/knowledge-gaps" element={<Navigate to="/dashboard" replace />} />
        <Route path="/mistakes" element={<Navigate to="/dashboard" replace />} />
        <Route path="/planner" element={<Navigate to="/dashboard" replace />} />
        <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/youtube-finder" element={<YouTubeFinderPage />} />
        <Route path="/mindmap" element={<Navigate to="/dashboard" replace />} />
        <Route path="/lecture-summarizer" element={<LectureSummarizerPage />} />
        <Route path="/code-explainer" element={<CodeExplainerPage />} />
        <Route path="/image-qa" element={<Navigate to="/tutor" replace />} />
        <Route path="/diagrams" element={<DiagramMakerPage />} />
        <Route path="/virtual-lab" element={<VirtualLabPage />} />
        <Route path="/problem-solver" element={<ProblemSolverPage />} />
        <Route path="/offline" element={<OfflineLibraryPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
