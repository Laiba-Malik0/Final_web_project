import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { 
  LayoutDashboard, FileText, LogOut, Menu, X, PlusCircle, Search, Edit2, 
  Trash2, Sparkles, Calendar, HardHat, CheckCircle, 
  XCircle, Clock, ChevronRight
} from 'lucide-react';

// CreateTicket Component Import
import CreateTicket from './CreateTicket';

// API Base URL (Dynamic Environment Variable with Fallback)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API = axios.create({ baseURL: API_BASE_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const cardVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

export default function CustomerDashboard({ user }) {
  const getUserName = () => {
    if (user && user.name) return user.name;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) return parsed.name;
      } catch (e) {
        // Fallback catch
      }
    }
    return localStorage.getItem('userName') || 'Customer';
  };

  const currentUserName = getUserName();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('complaints');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState(null);

  const cardsContainerRef = useRef(null);

  const [formData, setFormData] = useState(() => ({
    userName: currentUserName,
    title: '',
    category: 'Plumbing Fix',
    priority: 'Normal',
    date: new Date().toISOString().split('T')[0],
    assignedWorker: '',
    description: ''
  }));

  // Main Fetch function
  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const ticketsRes = await API.get('/tickets/customer-tickets').catch(() => ({ data: [] }));
      const rawTickets = ticketsRes.data?.tickets || ticketsRes.data || [];
      setTickets(Array.isArray(rawTickets) ? rawTickets : []);
    } catch (err) {
      console.error('API Fetch Error:', err);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  };

  // Auto-Sync Polling
  useEffect(() => {
    fetchData(false);

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeTab === 'complaints' && cardsContainerRef.current && tickets.length > 0 && !loading && !isSyncing) {
      gsap.fromTo(
        cardsContainerRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [activeTab, loading, isSyncing, tickets.length]);

  const resetForm = () => setFormData({
    userName: currentUserName,
    title: '',
    category: 'Plumbing Fix',
    priority: 'Normal',
    date: new Date().toISOString().split('T')[0],
    assignedWorker: '',
    description: ''
  });

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingTicketId(null);
    resetForm();
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleTicketCreated = (newTicket) => {
    if (newTicket) {
      setTickets([newTicket, ...tickets]);
    } else {
      fetchData(false);
    }
    closeModal();
  };

  const handleOpenEdit = (ticket) => {
    setEditingTicketId(ticket._id);
    setFormData({
      userName: currentUserName,
      title: ticket.title || '',
      category: ticket.category || 'Plumbing Fix',
      priority: ticket.priority || 'Normal',
      date: ticket.date ? ticket.date.split('T')[0] : (ticket.createdAt ? ticket.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      assignedWorker: ticket.assignedWorker || '',
      description: ticket.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/tickets/update/${editingTicketId}`, formData);
      setTickets(tickets.map(t => t._id === editingTicketId ? (res.data.ticket || { ...t, ...formData }) : t));
    } catch (err) {
      setTickets(tickets.map(t => t._id === editingTicketId ? { ...t, ...formData } : t));
    } finally {
      closeModal();
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Delete this complaint permanently?')) return;
    try {
      await API.delete(`/tickets/delete/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setTickets(tickets.filter(t => t._id !== id));
    }
  };

  const formatDate = (rawDate, rawCreatedAt) => {
    const val = rawDate || rawCreatedAt;
    if (!val) return 'N/A';
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStatusBadge = (status = 'Pending') => {
    const s = String(status).toLowerCase().trim();
    
    const isApproved = ['approved', 'in progress', 'resolved'].includes(s);
    const isRejected = ['rejected', 'reject', 'closed'].includes(s);

    const config = isApproved
      ? { bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)', icon: CheckCircle, label: status }
      : isRejected
        ? { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)', icon: XCircle, label: status }
        : { bg: 'rgba(234, 179, 8, 0.12)', color: '#facc15', border: 'rgba(234, 179, 8, 0.3)', icon: Clock, label: 'Pending' };

    const Icon = config.icon;

    return (
      <span style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(4px)' }}>
        <Icon size={13} /> {config.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1120', color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .heading-font { font-family: 'Outfit', sans-serif; }
        
        .compact-input { width: 100%; padding: 10px 14px; border-radius: 10px; background-color: #0b1120; border: 1px solid #334155; color: #fff; font-size: 13px; outline: none; transition: all 0.2s ease; }
        .compact-input:focus { border-color: #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
        
        .complaint-card { 
          background: linear-gradient(145deg, #1e293b 0%, #151f30 100%); 
          border: 1px solid #334155; 
          border-radius: 16px; 
          padding: 22px 24px; 
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .complaint-card:hover {
          transform: translateY(-2px);
          border-color: #475569;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(56, 189, 248, 0.05);
        }
        
        @media (max-width: 850px) { 
          .desktop-sidebar { display: none !important; } 
          .mobile-topbar { display: flex !important; } 
          .main-content { padding: 75px 16px 28px 16px !important; }
        }
        @media (min-width: 851px) { 
          .desktop-sidebar { display: flex !important; } 
          .mobile-topbar { display: none !important; } 
          .mobile-drawer { display: none !important; }
          .main-content { padding: 36px 40px !important; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar" style={{ width: '270px', backgroundColor: '#0f172a', borderRight: '1px solid #1e293b', flexDirection: 'column', justifyContent: 'space-between', padding: '28px 20px', position: 'sticky', top: 0, height: '100vh' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '9px', borderRadius: '12px', boxShadow: '0 0 15px rgba(255,255,255,0.2)' }}><Search size={20} color="#0f172a" /></div>
            <div>
              <h2 className="heading-font" style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '0.5px' }}>SUPPORT<span style={{ color: '#38bdf8' }}>SPHERE</span></h2>
              <span style={{ fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>Customer Portal</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', border: '1px solid #334155' }}>
            <div style={{ backgroundColor: '#ffffff', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>
              {currentUserName ? currentUserName[0].toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUserName}</p>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block' }}></span> Active User
              </span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[{ id: 'dashboard', label: 'Portal Overview', icon: LayoutDashboard }, { id: 'complaints', label: `My Complaints (${tickets.length})`, icon: FileText }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#94a3b8', fontWeight: '700', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', boxShadow: activeTab === tab.id ? '0 4px 12px rgba(255, 255, 255, 0.15)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><tab.icon size={16} /> {tab.label}</div>
                {activeTab === tab.id && <ChevronRight size={15} />}
              </button>
            ))}
          </nav>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
          <LogOut size={15} /> Log Out
        </motion.button>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 998 }} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} className="mobile-drawer" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '270px', zIndex: 999, backgroundColor: '#0f172a', padding: '24px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #1e293b' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <h2 className="heading-font" style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0 }}>SUPPORT<span style={{ color: '#38bdf8' }}>SPHERE</span></h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[{ id: 'dashboard', label: 'Portal Overview', icon: LayoutDashboard }, { id: 'complaints', label: `My Complaints (${tickets.length})`, icon: FileText }].map((tab) => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#94a3b8', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><tab.icon size={16} /> {tab.label}</div>
                    </button>
                  ))}
                </nav>
              </div>

              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
                <LogOut size={15} /> Log Out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Fixed Mobile Topbar */}
        <header className="mobile-topbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', padding: '0 16px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', alignItems: 'center', justifyContent: 'space-between', zIndex: 90 }}>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="heading-font" style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>SUPPORT<span style={{ color: '#38bdf8' }}>SPHERE</span></span>
          <div style={{ width: 30 }}></div>
        </header>

        <main className="main-content" style={{ flex: 1, overflowY: 'auto', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div key="tab-dash" variants={cardVariant} initial="hidden" animate="visible" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155', borderRadius: '18px', padding: '32px 28px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', marginBottom: '14px' }}>
                    <Sparkles size={13} /> SUPPORT SPHERE SYSTEM
                  </div>
                  <h1 className="heading-font" style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#ffffff', fontWeight: '800' }}>
                    Welcome back, <span style={{ color: '#38bdf8' }}>{currentUserName}</span>
                  </h1>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>Lodge tickets and track live updates directly from workers.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <button onClick={() => setIsCreateModalOpen(true)} style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', border: 'none', borderRadius: '16px', padding: '20px', color: '#fff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)' }}>
                    <PlusCircle size={28} style={{ marginBottom: '12px' }} />
                    <h3 className="heading-font" style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>File New Complaint</h3>
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Request maintenance or fix</p>
                  </button>

                  <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Total Complaints</span>
                    <h2 className="heading-font" style={{ fontSize: '28px', margin: '4px 0 0 0', color: '#fff' }}>{tickets.length}</h2>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="tab-complaints" variants={cardVariant} initial="hidden" animate="visible" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 className="heading-font" style={{ fontSize: '24px', margin: 0, fontWeight: '800' }}>My Complaints</h1>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>View and track all your support requests</p>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(true)} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={16} /> New Complaint
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
                    <p style={{ margin: 0, color: '#94a3b8' }}>No complaints found. Click "New Complaint" to get started.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tickets.map((ticket) => (
                      <div key={ticket._id || Math.random()} className="complaint-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '10px' }}>
                          <div>
                            <h3 className="heading-font" style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#fff' }}>{ticket.title}</h3>
                            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>{ticket.category}</span>
                          </div>
                          {renderStatusBadge(ticket.status)}
                        </div>

                        <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 16px 0', lineHeight: '1.5' }}>{ticket.description}</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid #334155', fontSize: '12px', color: '#94a3b8' }}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {formatDate(ticket.date, ticket.createdAt)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><HardHat size={14} /> Worker: {ticket.assignedWorker || 'Unassigned'}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenEdit(ticket)} style={{ background: 'none', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Edit2 size={13} /> Edit
                            </button>
                            <button onClick={() => handleDeleteTicket(ticket._id)} style={{ background: 'none', border: '1px solid #334155', color: '#ef4444', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '18px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 className="heading-font" style={{ margin: 0, fontSize: '18px', color: '#fff' }}>File New Complaint</h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <CreateTicket user={user} onSuccess={handleTicketCreated} onClose={closeModal} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TICKET MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '18px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 className="heading-font" style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Edit Complaint</h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <form onSubmit={handleUpdateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Issue Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="compact-input" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="compact-input">
                      <option value="Plumbing Fix">Plumbing Fix</option>
                      <option value="Electrical Issue">Electrical Issue</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="General Maintenance">General Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="compact-input">
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Description</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="compact-input" style={{ resize: 'none' }}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={closeModal} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#38bdf8', color: '#0f172a', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}