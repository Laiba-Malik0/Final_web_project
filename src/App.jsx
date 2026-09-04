import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import Navbar from './components/Navbar';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

// Root Dashboard Redirect based on Role
const RoleBasedRedirect = () => {
  const { user } = useContext(AuthContext);

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'worker':
    case 'agent':
      return <WorkerDashboard />;
    case 'customer':
    default:
      return <CustomerDashboard />;
  }
};

function AppContent() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Hide global navbar on pages with dedicated sidebar layouts
  const sidebarRoutes = ['/', '/customer-dashboard', '/worker-dashboard', '/agent-dashboard', '/admin-dashboard'];
  const hideGlobalNavbar = sidebarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#0A0706] text-[#E8D8C8] font-sans">
      {!hideGlobalNavbar && <Navbar />}

      <main className={hideGlobalNavbar ? "w-full min-h-screen" : "container mx-auto px-4 py-6"}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

          {/* Dynamic Root Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* Role-Specific Dashboards */}
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

          {/* Ticket Features */}
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

          {/* Fallback */}
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