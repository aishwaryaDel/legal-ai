import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { appRoutes } from './lib/config';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';
import { Copilot as LegalAI } from './pages/Copilot';
import { Review } from './pages/Review';
import { Draft } from './pages/Draft';
import { Builder } from './pages/Builder';
import { Repository } from './pages/Repository';
import { Intake } from './pages/Intake';
import { Search } from './pages/Search';
import { Clauses } from './pages/Clauses';
import { Playbooks } from './pages/Playbooks';
import { Workflows } from './pages/Workflows';
import { Analytics } from './pages/Analytics';
import { Partners } from './pages/Partners';
import { Discovery } from './pages/Discovery';
import { Research } from './pages/Research';
import { Admin } from './pages/Admin';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { Legal } from './pages/Legal';
import { NotFound } from './pages/NotFound';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-tesa-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={appRoutes.auth} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthPage = location.pathname === appRoutes.auth;

  if (isAuthPage) {
    return (
      <Routes>
        <Route path={appRoutes.auth} element={<Auth />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path={appRoutes.home} element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path={appRoutes.legalai} element={<ProtectedRoute><LegalAI /></ProtectedRoute>} />
        <Route path={appRoutes.review} element={<ProtectedRoute><Review /></ProtectedRoute>} />
        <Route path={`${appRoutes.review}/:id`} element={<ProtectedRoute><Review /></ProtectedRoute>} />
        <Route path={appRoutes.draft} element={<ProtectedRoute><Draft /></ProtectedRoute>} />
        <Route path={appRoutes.builder} element={<ProtectedRoute><Builder /></ProtectedRoute>} />
        <Route path={appRoutes.repository} element={<ProtectedRoute><Repository /></ProtectedRoute>} />
        <Route path={appRoutes.intake} element={<ProtectedRoute><Intake /></ProtectedRoute>} />
        <Route path={appRoutes.search} element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path={appRoutes.clauses} element={<ProtectedRoute><Clauses /></ProtectedRoute>} />
        <Route path={appRoutes.playbooks} element={<ProtectedRoute><Playbooks /></ProtectedRoute>} />
        <Route path={`${appRoutes.playbooks}/:id`} element={<ProtectedRoute><Playbooks /></ProtectedRoute>} />
        <Route path={appRoutes.workflows} element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
        <Route path={appRoutes.analytics} element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path={appRoutes.partners} element={<ProtectedRoute><Partners /></ProtectedRoute>} />
        <Route path={appRoutes.discovery} element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
        <Route path={appRoutes.research} element={<ProtectedRoute><Research /></ProtectedRoute>} />
        <Route path={appRoutes.admin} element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path={appRoutes.settings} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path={appRoutes.help} element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path={appRoutes.legal} element={<ProtectedRoute><Legal /></ProtectedRoute>} />
        <Route path={appRoutes.notFound} element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LocaleProvider>
            <AppRoutes />
          </LocaleProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
