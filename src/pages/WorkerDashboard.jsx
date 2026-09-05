import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  HardHat, CheckCircle, XCircle, Clock, RefreshCw, User, Mail,
  AlertCircle, LogOut, ChevronRight, Menu, X, LayoutDashboard,
  ClipboardList, Filter, Lock, Wrench
} from 'lucide-react';

const SOCKET_URL = import.meta.env?.VITE_API_URL || 'https://final-web-backend-eta.vercel.app/api';

const API = axios.create({ baseURL: SOCKET_URL });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

const ALL_CATEGORIES = [
  'All Categories',
  'IT / Technical',
  'General Support',
  'Plumbing',
  'Electrical',
  'Carpentry / Maintenance'
];

const SidebarContent = ({ currentUser, activeTab, setActiveTab, setSidebarOpen, ticketCount, handleLogout }) => (
  <div className="h-full flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-2.5 mb-6">
        <div className="bg-amber-500 p-2 rounded-xl flex shadow-[0_0_12px_rgba(245,158,11,0.4)]">
          <HardHat size={20} className="text-[#0d131a]" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-white tracking-wide m-0">
            Support<span className="text-amber-500">Sphere</span>
          </h2>
          <span className="text-[9px] text-amber-500 tracking-wider uppercase font-extrabold block">Worker Control Room</span>
        </div>
      </div>

      <div className="bg-[#131c26] p-3 rounded-xl border border-[#223142] mb-5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="bg-amber-500 w-8.5 h-8.5 rounded-lg flex items-center justify-center font-extrabold text-[#0d131a] text-sm">
            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'W'}
          </div>
          <div>
            <p className="m-0 font-bold text-slate-100 text-xs">{currentUser?.name || 'Worker'}</p>
            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]"></span> Field Specialist
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-[#1e2d3d] pt-2 flex flex-col gap-1">
          <span className="flex items-center gap-1.2"><Mail size={11} className="text-amber-500" /> {currentUser?.email || 'worker@sphere.com'}</span>
          <span className="flex items-center gap-1.2"><Wrench size={11} className="text-amber-500" /> Active Status: Ready</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'complaints', label: `Complaints Queue (${ticketCount})`, icon: ClipboardList }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`flex items-center justify-between p-2.5 rounded-lg border-none font-extrabold text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-amber-500 text-[#0d131a] shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-[#131c26]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'text-[#0d131a]' : 'text-slate-400'} /> {item.label}
              </div>
              <ChevronRight size={14} className={isActive ? 'text-[#0d131a]' : 'text-slate-400'} />
            </button>
          );
        })}
      </nav>
    </div>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 p-2.5 rounded-lg border-none bg-red-500 text-white cursor-pointer font-bold text-xs shadow-[0_4px_12px_rgba(239,68,68,0.3)] mt-4"
    >
      <LogOut size={14} /> Log Out
    </motion.button>
  </div>
);

export default function WorkerDashboard({ user }) {
  const storedUser = useMemo(() => {
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

  // Memoized fetch function using useCallback to avoid linter warnings
  const fetchWorkerTickets = useCallback(async () => {
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
  }, []);

  // FIXED: Triggered without triggering synchronous cascading state warning
  useEffect(() => {
    let isMounted = true;
    
    const loadTickets = async () => {
      try {
        const res = await API.get('/tickets/my-assigned');
        if (isMounted) {
          const rawTickets = Array.isArray(res.data) ? res.data : (res.data?.tickets || []);
          setTickets(rawTickets);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Fetch Assigned Tickets Error:', err);
          setTickets([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTickets();

    return () => { isMounted = false; };
  }, []);

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
      ? { bg: 'bg-green-500/10 text-green-400 border-green-500/30', Icon: CheckCircle, dot: 'bg-green-400 shadow-[0_0_8px_#4ade80]', text: 'Approved' }
      : isRejected
        ? { bg: 'bg-red-500/10 text-red-400 border-red-500/30', Icon: XCircle, dot: 'bg-red-400 shadow-[0_0_8px_#f87171]', text: 'Rejected' }
        : { bg: 'bg-amber-500/15 text-amber-500 border-amber-500/40', Icon: Clock, dot: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]', text: 'Pending' };

    const { bg, Icon, dot, text } = config;

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border ${bg}`}>
        <span className={`w-2 h-2 rounded-full animate-pulse ${dot}`}></span>
        <Icon size={13} /> {text}
      </span>
    );
  };

  const sidebarProps = {
    currentUser,
    activeTab,
    setActiveTab,
    setSidebarOpen,
    ticketCount: tickets.length,
    handleLogout
  };

  return (
    <div className="flex min-h-screen bg-[#0d131a] text-slate-100 font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-[#090d12] border-r border-[#1a2634] p-4 flex-col">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#090d12] border-b border-[#1a2634] flex items-center justify-between px-4 z-40">
        <button onClick={() => setSidebarOpen(true)} className="bg-transparent border-none text-white cursor-pointer">
          <Menu size={22} />
        </button>
        <h2 className="text-base font-extrabold text-white m-0">
          Support<span className="text-amber-500">Sphere</span>
        </h2>
        <div className="w-5"></div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-[#090d12] border-r border-[#1a2634] p-4 z-50"
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setSidebarOpen(false)} className="bg-transparent border-none text-slate-400 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full pt-16 lg:pt-7 px-4 lg:px-8 pb-6">

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-gradient-to-br from-[#131c26] to-[#090d12] border border-[#223142] border-l-4 border-l-amber-500 rounded-xl p-6 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-amber-500 p-2.5 rounded-xl flex shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      <HardHat size={24} className="text-[#0d131a]" />
                    </div>
                    <div>
                      <h1 className="m-0 text-xl lg:text-2xl font-extrabold text-white">
                        Welcome back, <span className="text-amber-500">{currentUser?.name || 'Worker'}</span>!
                      </h1>
                      <p className="m-0 text-slate-400 text-xs mt-1">
                        Technician Terminal • Live assigned task console and real-time field operations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                  {[
                    { title: 'Total Assigned', count: tickets.length, color: 'text-white', Icon: ClipboardList, iconColor: 'text-amber-500', topBorder: 'border-t-amber-500' },
                    { title: 'Pending Action', count: pendingCount, color: 'text-amber-500', Icon: Clock, iconColor: 'text-amber-500', topBorder: 'border-t-amber-500' },
                    { title: 'Approved / Resolved', count: approvedCount, color: 'text-green-400', Icon: CheckCircle, iconColor: 'text-green-400', topBorder: 'border-t-green-400' }
                  ].map((stat, i) => {
                    const StatIcon = stat.Icon;
                    return (
                      <div key={i} className={`bg-[#131c26] border border-[#223142] p-4 rounded-xl border-t-2 ${stat.topBorder}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400 font-semibold">{stat.title}</span>
                          <StatIcon size={16} className={stat.iconColor} />
                        </div>
                        <p className={`text-2xl font-extrabold m-0 mt-2 ${stat.color}`}>
                          {stat.count}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#131c26] border border-[#223142] p-4.5 rounded-xl flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h3 className="m-0 text-white text-sm font-extrabold">Field Tasks Queue</h3>
                    <p className="m-0 text-slate-400 text-xs mt-0.5">Inspect and process active field complaints instantly.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('complaints')}
                    className="bg-amber-500 text-[#0d131a] border-none px-4 py-2 rounded-lg font-extrabold text-xs cursor-pointer flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                  >
                    Open Queue <ChevronRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                <div className="flex justify-between items-start mb-4.5 flex-wrap gap-3">
                  <div>
                    <h1 className="text-white m-0 text-xl lg:text-2xl font-extrabold">
                      Assigned Complaint Queue
                    </h1>
                    <p className="text-slate-400 text-xs m-0 mt-1">
                      Review & resolve user complaints directly assigned to you.
                    </p>
                  </div>

                  <button
                    onClick={fetchWorkerTickets}
                    disabled={loading}
                    className="bg-[#131c26] border border-[#223142] text-amber-500 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs font-bold hover:bg-[#1a2634] transition-colors"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Queue
                  </button>
                </div>

                <div className="bg-[#131c26] border border-[#223142] p-3 px-4 rounded-lg mb-4.5 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Filter size={14} className="text-amber-500" />
                    <span className="text-xs font-bold text-white">Filter By:</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-400">Status:</label>
                    <select
                      className="bg-[#0d131a] text-slate-100 border border-[#223142] px-3 py-1 rounded-md text-xs font-semibold outline-none cursor-pointer focus:border-amber-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-400">Priority:</label>
                    <select
                      className="bg-[#0d131a] text-slate-100 border border-[#223142] px-3 py-1 rounded-md text-xs font-semibold outline-none cursor-pointer focus:border-amber-500"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="normal">Normal</option>
                      <option value="emergency">Emergency</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-400">Category:</label>
                    <select
                      className="bg-[#0d131a] text-slate-100 border border-[#223142] px-3 py-1 rounded-md text-xs font-semibold outline-none cursor-pointer focus:border-amber-500"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <p className="text-slate-400 text-xs">Fetching assigned complaints...</p>
                ) : filteredTickets.length === 0 ? (
                  <div className="bg-[#131c26] border border-dashed border-[#223142] rounded-xl p-10 text-center text-slate-400">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="m-0 text-xs">No complaints found matching selected filters.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} className="grid gap-3.5">
                    {filteredTickets.map((ticket) => {
                      const currentStatus = String(ticket.status || 'Pending').toLowerCase().trim();
                      const isLocked = ['approved', 'rejected', 'reject', 'resolved', 'closed'].includes(currentStatus);

                      return (
                        <div
                          key={ticket._id}
                          className="bg-gradient-to-br from-[#131c26] to-[#0f1722] border border-[#223142] border-l-4 border-l-amber-500 rounded-xl p-4 lg:p-5 transition-transform hover:-translate-y-0.5 hover:border-amber-500"
                        >
                          <div className="flex justify-between items-center flex-wrap gap-2.5 mb-2.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h2 className="m-0 text-white text-base font-bold">
                                {ticket.title}
                              </h2>
                              <span className="bg-[#0d131a] text-amber-500 text-[10px] px-2.5 py-0.5 rounded-md border border-[#223142] font-bold">
                                {ticket.category || 'General Support'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                ticket.priority === 'Emergency'
                                  ? 'bg-red-500/20 text-red-400'
                                  : ticket.priority === 'High'
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-slate-500/20 text-slate-300'
                              }`}>
                                {ticket.priority || 'Normal'} Priority
                              </span>
                            </div>

                            {renderStatusBadge(ticket.status)}
                          </div>

                          <p className="m-0 mb-3 text-slate-300 text-xs leading-relaxed bg-[#0d131a] p-2.5 rounded-lg border border-[#1a2634]">
                            {ticket.description}
                          </p>

                          <div className="flex justify-between items-center flex-wrap gap-3 pt-2.5 border-t border-white/5">
                            <span className="flex items-center gap-1.2 text-xs text-slate-400">
                              <User size={13} className="text-amber-500" /> <strong className="text-slate-100">Customer:</strong> {ticket.userName || 'Customer'}
                            </span>

                            {isLocked ? (
                              <div className="flex items-center gap-1.2 text-xs text-slate-400 bg-[#0d131a] px-3 py-1 rounded-md border border-[#223142]">
                                <Lock size={12} className="text-red-400" /> Action Locked ({ticket.status})
                              </div>
                            ) : (
                              <div className="flex gap-2 min-w-[190px]">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleStatusChange(ticket._id, 'Approved')}
                                  disabled={updatingId === ticket._id}
                                  className="flex-1 py-1.5 px-3 rounded-md border-none font-extrabold text-xs cursor-pointer bg-green-500 text-[#0d131a] flex items-center justify-center gap-1.2 disabled:opacity-50"
                                >
                                  <CheckCircle size={13} /> {updatingId === ticket._id ? '...' : 'Approve'}
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleStatusChange(ticket._id, 'Rejected')}
                                  disabled={updatingId === ticket._id}
                                  className="flex-1 py-1.5 px-3 rounded-md border border-red-500/40 font-extrabold text-xs cursor-pointer bg-red-500/10 text-red-400 flex items-center justify-center gap-1.2 disabled:opacity-50"
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