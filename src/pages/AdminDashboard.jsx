import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ShieldCheck, CheckCircle, XCircle, Clock, RefreshCw, User, Mail,
  AlertCircle, LogOut, ChevronRight, Menu, X, LayoutDashboard,
  ClipboardList, Wrench, Search, Cpu, Database, UserPlus
} from 'lucide-react';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://final-web-backend-eta.vercel.app/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ALL_CATEGORIES = [
  'All Categories',
  'IT / Technical',
  'General Support',
  'Plumbing',
  'Electrical',
  'Carpentry / Maintenance'
];

export default function AdminDashboard({ user }) {
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = user || storedUser || { name: 'Admin Control', email: 'admin@system.com', role: 'admin' };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  const cardsContainerRef = useRef(null);
  const workersContainerRef = useRef(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [ticketsRes, workersRes] = await Promise.all([
        API.get('/tickets/all'),
        API.get('/users/workers')
      ]);

      const rawTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data?.tickets || []);
      const rawWorkers = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data?.workers || []);

      setTickets(rawTickets);
      setWorkers(rawWorkers);
    } catch (err) {
      setErrorMsg('MongoDB / Backend connection error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // GSAP Animations with proper cleanup
  useEffect(() => {
    let ctx = gsap.context(() => {
      if (activeTab === 'complaints' && cardsContainerRef.current && !loading) {
        const children = cardsContainerRef.current.children;
        if (children.length > 0) {
          gsap.fromTo(
            children,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
          );
        }
      }

      if (activeTab === 'workers' && workersContainerRef.current && !loading) {
        const children = workersContainerRef.current.children;
        if (children.length > 0) {
          gsap.fromTo(
            children,
            { opacity: 0, scale: 0.96, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'back.out(1.1)', clearProps: 'all' }
          );
        }
      }
    });

    return () => ctx.revert();
  }, [activeTab, loading, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const handleStatusUpdate = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    const previousTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      await API.put(`/tickets/update-status/${ticketId}`, { status: newStatus });
    } catch (err) {
      setTickets(previousTickets);
      alert('Failed to update status in database.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWorkerAssign = async (ticketId, workerId) => {
    setUpdatingId(ticketId);
    const selectedWorker = workers.find(w => w._id === workerId);
    const previousTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, assignedWorker: selectedWorker || workerId } : t))
    );

    try {
      await API.put(`/tickets/assign-worker/${ticketId}`, { workerId });
    } catch (err) {
      setTickets(previousTickets);
      alert('Failed to assign worker in database.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const dynamicAnalytics = {
    totalTickets: tickets.length,
    pending: tickets.filter(t => (t.status || 'Pending').toLowerCase() === 'pending').length,
    inProgress: tickets.filter(t => ['approved', 'in progress'].includes((t.status || '').toLowerCase())).length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes((t.status || '').toLowerCase())).length
  };

  const filteredTickets = tickets.filter((t) => {
    const s = (t.status || 'Pending').toLowerCase();
    const p = (t.priority || 'Normal').toLowerCase();
    const c = (t.category || '').toLowerCase();
    const title = (t.title || '').toLowerCase();

    if (statusFilter === 'pending' && s !== 'pending') return false;
    if (statusFilter === 'approved' && !['approved', 'in progress', 'resolved'].includes(s)) return false;
    if (statusFilter === 'rejected' && !['rejected', 'reject', 'closed'].includes(s)) return false;

    if (priorityFilter !== 'all' && p !== priorityFilter.toLowerCase()) return false;
    if (categoryFilter !== 'All Categories' && !c.includes(categoryFilter.toLowerCase().split(' ')[0])) return false;
    if (searchQuery && !title.includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  const renderStatusBadge = (status = 'Pending') => {
    const s = status.toLowerCase();
    const isApproved = ['approved', 'in progress', 'resolved'].includes(s);
    const isRejected = ['rejected', 'reject', 'closed'].includes(s);

    const config = isApproved
      ? { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', Icon: CheckCircle, pulse: '#10b981', text: status }
      : isRejected
        ? { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)', Icon: XCircle, pulse: '#f87171', text: status }
        : { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', Icon: Clock, pulse: '#f59e0b', text: 'Pending' };

    return (
      <span style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: config.pulse, boxShadow: `0 0 8px ${config.pulse}` }}></span>
        <config.Icon size={12} /> {config.text}
      </span>
    );
  };

  const renderSidebar = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', padding: '9px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)' }}>
            <Cpu size={20} color="#080a0f" />
          </div>
          <div>
            <h2 className="heading-font" style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
              ADMIN<span style={{ color: '#00f2fe' }}>CORE</span>
            </h2>
            <span style={{ fontSize: '9px', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '800' }}>Control Center</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1e293b', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: '#00f2fe', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#080a0f' }}>
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: '#f8fafc', fontSize: '13px' }}>{currentUser?.name}</p>
              <span style={{ fontSize: '10px', color: '#00f2fe', fontWeight: '700' }}>Super Admin Access</span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', borderTop: '1px solid #1e293b', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={11} color="#00f2fe" /> {currentUser?.email}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Database size={11} color="#00f2fe" /> MongoDB: Connected</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'dashboard', label: 'System Overview', icon: LayoutDashboard },
            { id: 'complaints', label: `Global Complaints (${tickets.length})`, icon: ClipboardList },
            { id: 'workers', label: `Field Workers (${workers.length})`, icon: Wrench },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid',
                  borderColor: isActive ? '#00f2fe' : 'transparent',
                  backgroundColor: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                  color: isActive ? '#00f2fe' : '#94a3b8',
                  fontWeight: isActive ? '800' : '600', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} color={isActive ? '#00f2fe' : '#64748b'} /> {item.label}
                </div>
                <ChevronRight size={14} color={isActive ? '#00f2fe' : '#475569'} />
              </motion.button>
            );
          })}
        </nav>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px',
          borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#f87171', cursor: 'pointer', fontWeight: '700', fontSize: '12px', transition: 'all 0.2s'
        }}
      >
        <LogOut size={14} /> Exit System Session
      </motion.button>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080a0f', color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .heading-font { font-family: 'Outfit', sans-serif; }
        .admin-card { background: #0f172a; border: 1px solid #1e293b; border-left: 3px solid #00f2fe; border-radius: 12px; padding: 16px 20px; transition: transform 0.2s ease, border-color 0.2s ease; }
        .admin-card:hover { transform: translateY(-2px); border-color: #00f2fe; }
        .filter-select { background-color: #080a0f; color: #f8fafc; border: 1px solid #1e293b; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; outline: none; }
        @media (max-width: 850px) { .desktop-sidebar { display: none !important; } .mobile-header { display: flex !important; } .main-content { padding: 75px 14px 24px 14px !important; } }
        @media (min-width: 851px) { .desktop-sidebar { display: flex !important; } .mobile-header { display: none !important; } .main-content { padding: 28px 32px !important; } }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="desktop-sidebar" style={{ width: '250px', backgroundColor: '#05070a', borderRight: '1px solid #1e293b', padding: '20px 16px', flexDirection: 'column' }}>
        {renderSidebar()}
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="mobile-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#05070a', borderBottom: '1px solid #1e293b', display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 99 }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
          <Menu size={22} color="#00f2fe" />
        </button>
        <h2 className="heading-font" style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0 }}>ADMINCORE</h2>
        <div style={{ width: 22 }}></div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100 }} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', backgroundColor: '#05070a', borderRight: '1px solid #1e293b', padding: '16px', zIndex: 101 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              {renderSidebar()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '12px' }}>
              <AlertCircle size={16} /> {errorMsg}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'dashboard' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderLeft: '4px solid #00f2fe', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: '#00f2fe', padding: '10px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)' }}>
                      <ShieldCheck size={24} color="#080a0f" />
                    </div>
                    <div>
                      <h1 className="heading-font" style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>
                        Command Terminal • <span style={{ color: '#00f2fe' }}>System Analytics</span>
                      </h1>
                      <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>Overall platform performance metrics and operation dispatches.</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                  {[
                    { title: 'Total System Tickets', count: dynamicAnalytics.totalTickets, color: '#ffffff', Icon: ClipboardList, iconColor: '#00f2fe' },
                    { title: 'Pending Clearance', count: dynamicAnalytics.pending, color: '#f59e0b', Icon: Clock, iconColor: '#f59e0b' },
                    { title: 'Approved / In-Progress', count: dynamicAnalytics.inProgress, color: '#38bdf8', Icon: CheckCircle, iconColor: '#38bdf8' },
                    { title: 'Resolved History Logs', count: dynamicAnalytics.resolved, color: '#10b981', Icon: CheckCircle, iconColor: '#10b981' }
                  ].map((stat, i) => (
                    <motion.div key={i} whileHover={{ y: -3 }} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '16px', borderRadius: '10px', borderTop: '2px solid ' + stat.iconColor }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{stat.title}</span>
                        <stat.Icon size={16} color={stat.iconColor} />
                      </div>
                      <p className="heading-font" style={{ fontSize: '26px', fontWeight: '800', margin: '8px 0 0 0', color: stat.color }}>{stat.count}</p>
                    </motion.div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '18px 20px', borderRadius: '12px' }}>
                    <h3 className="heading-font" style={{ margin: 0, color: '#ffffff', fontSize: '15px' }}>Live Complaints Dispatch</h3>
                    <p style={{ margin: '4px 0 16px 0', color: '#94a3b8', fontSize: '11px' }}>Inspect and process MongoDB live customer issues.</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab('complaints')} style={{ backgroundColor: '#00f2fe', color: '#080a0f', border: 'none', padding: '7px 14px', borderRadius: '6px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      Manage MongoDB Complaints ({tickets.length}) <ChevronRight size={13} />
                    </motion.button>
                  </div>

                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '18px 20px', borderRadius: '12px' }}>
                    <h3 className="heading-font" style={{ margin: 0, color: '#ffffff', fontSize: '15px' }}>Field Technicians Roster</h3>
                    <p style={{ margin: '4px 0 16px 0', color: '#94a3b8', fontSize: '11px' }}>Inspect active workforce database entries.</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab('workers')} style={{ backgroundColor: 'transparent', color: '#00f2fe', border: '1px solid #00f2fe', padding: '7px 14px', borderRadius: '6px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      Inspect Registered Workers ({workers.length}) <Wrench size={13} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: COMPLAINTS STREAM */}
            {activeTab === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 className="heading-font" style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' }}>Master Complaints Stream</h1>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Live records fetched directly from MongoDB database.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={fetchAdminData} disabled={loading} style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#00f2fe', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }}>
                    <RefreshCw size={13} /> Sync MongoDB
                  </motion.button>
                </div>

                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 200px', backgroundColor: '#080a0f', border: '1px solid #1e293b', padding: '4px 10px', borderRadius: '6px' }}>
                    <Search size={14} color="#00f2fe" />
                    <input type="text" placeholder="Search ticket titles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '11px', outline: 'none', width: '100%' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>STATUS:</label>
                    <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>PRIORITY:</label>
                    <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                      <option value="all">All Priorities</option>
                      <option value="normal">Normal</option>
                      <option value="emergency">Emergency</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>CATEGORY:</label>
                    <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      {ALL_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <p style={{ color: '#94a3b8', fontSize: '12px' }}>Fetching complaints...</p>
                ) : filteredTickets.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px dashed #1e293b', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ margin: 0, fontSize: '13px' }}>No matching complaints found.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} style={{ display: 'grid', gap: '12px' }}>
                    {filteredTickets.map((ticket) => (
                      <div key={ticket._id} className="admin-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <h2 className="heading-font" style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: '700' }}>{ticket.title}</h2>
                            <span style={{ backgroundColor: '#080a0f', color: '#00f2fe', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #1e293b', fontWeight: '700' }}>
                              {ticket.category || 'General'}
                            </span>
                            <span style={{ backgroundColor: ticket.priority === 'Emergency' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.1)', color: ticket.priority === 'Emergency' ? '#f87171' : '#94a3b8', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                              {ticket.priority || 'Normal'}
                            </span>
                          </div>
                          {renderStatusBadge(ticket.status)}
                        </div>

                        <p style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5', backgroundColor: '#080a0f', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                          {ticket.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
                              <User size={12} color="#00f2fe" /> <strong style={{ color: '#f8fafc' }}>Customer:</strong> {ticket.user?.name || ticket.userName || 'Customer User'}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Wrench size={12} color="#f59e0b" />
                              <strong style={{ color: '#f8fafc', fontSize: '11px' }}>Assign Worker:</strong>
                              <select 
                                className="filter-select"
                                value={ticket.assignedWorker?._id || ticket.assignedWorker || ''}
                                onChange={(e) => handleWorkerAssign(ticket._id, e.target.value)}
                                disabled={updatingId === ticket._id}
                                style={{ padding: '2px 6px', fontSize: '11px' }}
                              >
                                <option value="">Unassigned</option>
                                {workers.map((w) => (
                                  <option key={w._id} value={w._id}>{w.name} ({w.category || 'General'})</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusUpdate(ticket._id, 'Approved')}
                              disabled={updatingId === ticket._id}
                              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', padding: '5px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Approve
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusUpdate(ticket._id, 'Rejected')}
                              disabled={updatingId === ticket._id}
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #f87171', padding: '5px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Reject
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: WORKERS DIRECTORY */}
            {activeTab === 'workers' && (
              <motion.div key="workers" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: '18px' }}>
                  <h1 className="heading-font" style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' }}>Technicians Directory</h1>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Registered field workers from database.</p>
                </div>

                <div ref={workersContainerRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {loading ? (
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>Loading workers...</p>
                  ) : workers.map((w) => (
                    <div key={w._id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ background: '#f59e0b', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#080a0f' }}>
                          {w.name ? w.name[0].toUpperCase() : 'W'}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '14px', fontWeight: '700' }}>{w.name}</h3>
                          <span style={{ fontSize: '10px', color: '#00f2fe', fontWeight: '700' }}>{w.category || 'Technician'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                        <span><strong style={{ color: '#f8fafc' }}>Email:</strong> {w.email}</span>
                        <span><strong style={{ color: '#f8fafc' }}>Role:</strong> {w.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}