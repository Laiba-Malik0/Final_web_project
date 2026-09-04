import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  HardHat, CheckCircle, XCircle, Clock, RefreshCw, User, Mail,
  AlertCircle, LogOut, ChevronRight, Menu, X, LayoutDashboard,
  ClipboardList, Filter, Lock, Wrench
} from 'lucide-react';

// Production Ready Base URL (Fallback to localhost for local dev)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => {
  return Promise.reject(error);
});

const ALL_CATEGORIES = [
  'All Categories',
  'IT / Technical',
  'General Support',
  'Plumbing',
  'Electrical',
  'Carpentry / Maintenance'
];

export default function WorkerDashboard({ user }) {
  const storedUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const currentUser = user || storedUser || { name: 'Worker', email: 'worker@sphere.com', role: 'Worker' };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  const cardsContainerRef = useRef(null);

  const fetchWorkerTickets = async () => {
    setLoading(true);
    try {
      const res = await API.get('/tickets/my-assigned');
      const rawTickets = Array.isArray(res.data) ? res.data : (res.data?.tickets || []);
      setTickets(rawTickets);
    } catch (err) {
      console.error('Fetch Assigned Tickets Error:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerTickets();
  }, []);

  // Safe GSAP Context Animation (Prevents React 18 memory leaks)
  useEffect(() => {
    if (activeTab === 'complaints' && cardsContainerRef.current && !loading) {
      const ctx = gsap.context(() => {
        const children = cardsContainerRef.current?.children;
        if (children && children.length > 0) {
          gsap.fromTo(children,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }
          );
        }
      }, cardsContainerRef);

      return () => ctx.revert();
    }
  }, [activeTab, loading, statusFilter, priorityFilter, categoryFilter]);

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    const previousTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      await API.put(`/tickets/update-status/${ticketId}`, { status: newStatus });
    } catch (err) {
      console.error('Primary Status Update Error, trying fallback:', err);
      try {
        await API.put(`/tickets/update/${ticketId}`, { status: newStatus });
      } catch (fallbackErr) {
        console.error('Fallback Update Error:', fallbackErr);
        setTickets(previousTickets);
        alert('Failed to update status in Database.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const filteredTickets = tickets.filter((t) => {
    const s = (t.status || 'Pending').toLowerCase();
    const p = (t.priority || 'Normal').toLowerCase();
    const c = (t.category || '').toLowerCase();

    if (statusFilter === 'pending' && s !== 'pending') return false;
    if (statusFilter === 'approved' && !['approved', 'in progress', 'resolved'].includes(s)) return false;
    if (statusFilter === 'rejected' && !['rejected', 'reject', 'closed'].includes(s)) return false;

    if (priorityFilter !== 'all' && p !== priorityFilter.toLowerCase()) return false;

    if (categoryFilter !== 'All Categories') {
      const selectedCat = categoryFilter.toLowerCase();
      if (!c.includes(selectedCat.split(' ')[0])) return false;
    }

    return true;
  });

  const pendingCount = tickets.filter(t => (t.status || 'Pending').toLowerCase() === 'pending').length;
  const approvedCount = tickets.filter(t => ['approved', 'in progress', 'resolved'].includes((t.status || '').toLowerCase())).length;

  const renderStatusBadge = (status = 'Pending') => {
    const s = status.toLowerCase();
    const isApproved = ['approved', 'in progress', 'resolved'].includes(s);
    const isRejected = ['rejected', 'reject', 'closed'].includes(s);

    const config = isApproved
      ? { bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)', Icon: CheckCircle, pulse: 'green', text: 'Approved' }
      : isRejected
        ? { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)', Icon: XCircle, pulse: 'red', text: 'Rejected' }
        : { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)', Icon: Clock, pulse: 'yellow', text: 'Pending' };

    const { bg, color, border, Icon, pulse, text } = config;

    return (
      <span style={{ backgroundColor: bg, color, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span className={`pulse-sensor ${pulse}`}></span>
        <Icon size={13} /> {text}
      </span>
    );
  };

  const SidebarContent = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#f59e0b', padding: '8px', borderRadius: '10px', display: 'flex', boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)' }}>
            <HardHat size={20} color="#0d131a" />
          </div>
          <div>
            <h2 className="heading-font" style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '0.5px' }}>
              Support<span style={{ color: '#f59e0b' }}>Sphere</span>
            </h2>
            <span style={{ fontSize: '9px', color: '#f59e0b', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: '800' }}>Worker Control Room</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#131c26', padding: '12px 14px', borderRadius: '12px', border: '1px solid #223142', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ backgroundColor: '#f59e0b', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#0d131a', fontSize: '15px' }}>
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'W'}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: '#f8fafc', fontSize: '13px' }}>{currentUser?.name || 'Worker'}</p>
              <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-sensor yellow" style={{ width: 6, height: 6 }}></span> Field Specialist
              </span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #1e2d3d', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={11} color="#f59e0b" /> {currentUser?.email || 'worker@sphere.com'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Wrench size={11} color="#f59e0b" /> Active Status: Ready</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'complaints', label: `Complaints Queue (${tickets.length})`, icon: ClipboardList }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: 'none',
                  backgroundColor: isActive ? '#f59e0b' : 'transparent',
                  color: isActive ? '#0d131a' : '#94a3b8',
                  fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} color={isActive ? '#0d131a' : '#94a3b8'} /> {item.label}
                </div>
                <ChevronRight size={14} color={isActive ? '#0d131a' : '#94a3b8'} />
              </button>
            );
          })}
        </nav>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px',
          borderRadius: '8px', border: 'none', backgroundColor: '#ef4444',
          color: '#ffffff', cursor: 'pointer', fontWeight: '700', fontSize: '12px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', marginTop: '16px'
        }}
      >
        <LogOut size={14} /> Log Out
      </motion.button>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d131a', color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .heading-font { font-family: 'Outfit', sans-serif; }
        .complaint-card { background: linear-gradient(145deg, #131c26 0%, #0f1722 100%); border: 1px solid #223142; border-left: 3px solid #f59e0b; border-radius: 12px; padding: 16px 20px; transition: transform 0.2s ease, border-color 0.2s ease; }
        .complaint-card:hover { transform: translateY(-2px); border-color: #f59e0b; }
        .filter-dropdown { background-color: #0d131a; color: #f8fafc; border: 1px solid #223142; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; outline: none; cursor: pointer; }
        .filter-dropdown:focus { border-color: #f59e0b; }
        .pulse-sensor { width: 8px; height: 8px; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; }
        .pulse-sensor.yellow { background-color: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        .pulse-sensor.green { background-color: #4ade80; box-shadow: 0 0 8px #4ade80; }
        .pulse-sensor.red { background-color: #f87171; box-shadow: 0 0 8px #f87171; }
        .pulse-sensor.cyan { background-color: #38bdf8; box-shadow: 0 0 8px #38bdf8; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } }
        
        @media (max-width: 850px) { 
          .desktop-sidebar { display: none !important; } 
          .mobile-header { display: flex !important; } 
          .main-content { padding: 75px 14px 24px 14px !important; } 
        }
        @media (min-width: 851px) { 
          .desktop-sidebar { display: flex !important; } 
          .mobile-header { display: none !important; } 
          .main-content { padding: 28px 32px !important; } 
        }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="desktop-sidebar" style={{ width: '250px', backgroundColor: '#090d12', borderRight: '1px solid #1a2634', padding: '20px 16px', flexDirection: 'column' }}>
        <SidebarContent />
      </aside>

      {/* MOBILE HEADER */}
      <div className="mobile-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#090d12', borderBottom: '1px solid #1a2634', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 99 }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
          <Menu size={22} />
        </button>
        <h2 className="heading-font" style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
          Support<span style={{ color: '#f59e0b' }}>Sphere</span>
        </h2>
        <div style={{ width: 22 }}></div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', zIndex: 100 }} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '250px', backgroundColor: '#090d12', borderRight: '1px solid #1a2634', padding: '16px', zIndex: 101 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ backgroundColor: '#131c26', border: '1px solid #223142', borderLeft: '4px solid #f59e0b', borderRadius: '14px', padding: '24px', marginBottom: '20px', background: 'linear-gradient(135deg, #131c26 0%, #090d12 100%)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ backgroundColor: '#f59e0b', padding: '10px', borderRadius: '10px', display: 'flex', boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)' }}>
                      <HardHat size={24} color="#0d131a" />
                    </div>
                    <div>
                      <h1 className="heading-font" style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>
                        Welcome back, <span style={{ color: '#f59e0b' }}>{currentUser?.name || 'Worker'}</span>!
                      </h1>
                      <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                        Technician Terminal • Live assigned task console and real-time field operations.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                  {[
                    { title: 'Total Assigned', count: tickets.length, color: '#ffffff', Icon: ClipboardList, iconColor: '#f59e0b' },
                    { title: 'Pending Action', count: pendingCount, color: '#f59e0b', Icon: Clock, iconColor: '#f59e0b' },
                    { title: 'Approved / Resolved', count: approvedCount, color: '#4ade80', Icon: CheckCircle, iconColor: '#4ade80' }
                  ].map((stat, i) => {
                    const StatIcon = stat.Icon;
                    return (
                      <div key={i} style={{ backgroundColor: '#131c26', border: '1px solid #223142', padding: '16px', borderRadius: '12px', borderTop: '2px solid ' + stat.iconColor }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{stat.title}</span>
                          <StatIcon size={16} color={stat.iconColor} />
                        </div>
                        <p className="heading-font" style={{ fontSize: '26px', fontWeight: '800', margin: '8px 0 0 0', color: stat.color }}>
                          {stat.count}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div style={{ backgroundColor: '#131c26', border: '1px solid #223142', padding: '18px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="heading-font" style={{ margin: 0, color: '#ffffff', fontSize: '15px' }}>Field Tasks Queue</h3>
                    <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>Inspect and process active field complaints instantly.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('complaints')} style={{ backgroundColor: '#f59e0b', color: '#0d131a', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
                    Open Queue <ChevronRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 className="heading-font" style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' }}>
                      Assigned Complaint Queue
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                      Review & resolve user complaints directly assigned to you.
                    </p>
                  </div>

                  <button onClick={fetchWorkerTickets} disabled={loading} style={{ background: '#131c26', border: '1px solid #223142', color: '#f59e0b', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }}>
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Queue
                  </button>
                </div>

                <div style={{ backgroundColor: '#131c26', border: '1px solid #223142', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={14} color="#f59e0b" />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff' }}>Filter By:</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Status:</label>
                    <select className="filter-dropdown" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Priority:</label>
                    <select className="filter-dropdown" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                      <option value="all">All Priorities</option>
                      <option value="normal">Normal</option>
                      <option value="emergency">Emergency</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Category:</label>
                    <select className="filter-dropdown" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <p style={{ color: '#94a3b8', fontSize: '12px' }}>Fetching assigned complaints...</p>
                ) : filteredTickets.length === 0 ? (
                  <div style={{ backgroundColor: '#131c26', border: '1px dashed #223142', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No complaints found matching selected filters.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} style={{ display: 'grid', gap: '14px' }}>
                    {filteredTickets.map((ticket) => {
                      const currentStatus = String(ticket.status || 'Pending').toLowerCase().trim();
                      const isLocked = ['approved', 'rejected', 'reject', 'resolved', 'closed'].includes(currentStatus);

                      return (
                        <div key={ticket._id} className="complaint-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <h2 className="heading-font" style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: '700' }}>
                                {ticket.title}
                              </h2>
                              <span style={{ backgroundColor: '#0d131a', color: '#f59e0b', fontSize: '10px', padding: '3px 9px', borderRadius: '6px', border: '1px solid #223142', fontWeight: '700' }}>
                                {ticket.category || 'General Support'}
                              </span>
                              <span style={{
                                backgroundColor: ticket.priority === 'Emergency' ? 'rgba(239, 68, 68, 0.18)' : ticket.priority === 'High' ? 'rgba(249, 115, 22, 0.18)' : 'rgba(148, 163, 184, 0.15)',
                                color: ticket.priority === 'Emergency' ? '#f87171' : ticket.priority === 'High' ? '#fb923c' : '#cbd5e1',
                                fontSize: '10px', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase'
                              }}>
                                {ticket.priority || 'Normal'} Priority
                              </span>
                            </div>

                            {renderStatusBadge(ticket.status)}
                          </div>

                          <p style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5', backgroundColor: '#0d131a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1a2634' }}>
                            {ticket.description}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8' }}>
                              <User size={13} color="#f59e0b" /> <strong style={{ color: '#f8fafc' }}>Customer:</strong> {ticket.userName || 'Customer'}
                            </span>

                            {isLocked ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8', backgroundColor: '#0d131a', padding: '5px 12px', borderRadius: '6px', border: '1px solid #223142' }}>
                                <Lock size={12} color="#f87171" /> Action Locked ({ticket.status})
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', minWidth: '190px' }}>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleStatusChange(ticket._id, 'Approved')}
                                  disabled={updatingId === ticket._id}
                                  style={{
                                    flex: 1, padding: '7px 14px', borderRadius: '6px', border: 'none', fontWeight: '800', fontSize: '11px', cursor: 'pointer',
                                    backgroundColor: '#22c55e', color: '#0d131a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                  }}
                                >
                                  <CheckCircle size={13} /> {updatingId === ticket._id ? '...' : 'Approve'}
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleStatusChange(ticket._id, 'Rejected')}
                                  disabled={updatingId === ticket._id}
                                  style={{
                                    flex: 1, padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: '800', fontSize: '11px', cursor: 'pointer',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                  }}
                                >
                                  <XCircle size={13} /> {updatingId === ticket._id ? '...' : 'Reject'}
                                </motion.button>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}