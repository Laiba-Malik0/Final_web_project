import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const localUser = user || JSON.parse(localStorage.getItem('user') || 'null');

  if (!localUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(localUser.role)) return <Navigate to="/" />;
  return children;
};

function AppContent() {
  const { user } = useContext(AuthContext);
  const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
  const location = useLocation();

  // Jin pages par dedicated Sidebar Layout majood hai wahan Global Navbar hide kar do
  const hideGlobalNavbar = 
    location.pathname === '/' ||
    location.pathname === '/customer-dashboard' ||
    location.pathname === '/worker-dashboard' ||
    location.pathname === '/agent-dashboard';

  return (
    <div className="min-h-screen bg-[#0A0706] text-[#E8D8C8] font-sans">
      {/* Navbar sirf tab dikhega jab dashboard se bahar ho (jaise Login, Register, Ticket Detail) */}
      {!hideGlobalNavbar && <Navbar />}

      <main className={hideGlobalNavbar ? "w-full min-h-screen" : "container mx-auto px-4 py-6"}>
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />

          {/* Main Root Redirection based on Role */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {currentUser?.role === 'admin' ? (
                  <Navigate to="/admin-dashboard" replace />
                ) : currentUser?.role === 'worker' ? (
                  <WorkerDashboard />
                ) : (
                  <CustomerDashboard />
                )}
              </ProtectedRoute>
            }
          />

          {/* Specific Dashboard Routes */}
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
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent-dashboard"
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />

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