import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthProvider, { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import Navbar from './components/Navbar';

// Protected Route Wrapper with Dynamic Role Redirection
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1120] text-[#38bdf8] font-bold">
        Loading Session...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const normalizedRole = user.role?.toLowerCase()?.trim();
  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Root Redirect Helper
const RoleBasedRedirect = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase()?.trim();

  switch (role) {
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    case 'worker':
    case 'agent':
      return <Navigate to="/worker-dashboard" replace />;
    case 'customer':
      return <Navigate to="/customer-dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function AppContent() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const sidebarRoutes = ['/customer-dashboard', '/worker-dashboard', '/agent-dashboard', '/admin-dashboard'];
  const hideGlobalNavbar = sidebarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f8fafc] font-sans">
      {!hideGlobalNavbar && <Navbar />}

      <main className={hideGlobalNavbar ? "w-full min-h-screen" : "container mx-auto px-4 py-6"}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={!user ? <Login /> : <RoleBasedRedirect />} />
          <Route path="/register" element={!user ? <Register /> : <RoleBasedRedirect />} />

          {/* Root Route */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Dashboards */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/worker-dashboard"
            element={
              <ProtectedRoute allowedRoles={['worker', 'agent']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent-dashboard"
            element={
              <ProtectedRoute allowedRoles={['worker', 'agent']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Features */}
          <Route
            path="/create-ticket"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CreateTicket />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ticket/:id"
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}