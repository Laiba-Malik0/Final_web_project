import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ShieldCheck, CheckCircle, XCircle, Clock, RefreshCw, User, Mail,
  AlertCircle, LogOut, ChevronRight, Menu, X, LayoutDashboard,
  ClipboardList, Wrench, Search, Cpu, Database
} from 'lucide-react';

import API from '../api'; 
import { AuthContext } from '../context/AuthContext';

const ALL_CATEGORIES = [
  'All Categories',
  'IT / Technical',
  'General Support',
  'Plumbing',
  'Electrical',
  'Carpentry / Maintenance'
];

export default function AdminDashboard() {
  const { user: contextUser, logout } = useContext(AuthContext);
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = contextUser || storedUser || { name: 'Admin Control', email: 'admin@system.com', role: 'admin' };

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

  // 1. Safe Data Fetching Effect (Fixed Cascading Render Warning)
  useEffect(() => {
    let isMounted = true;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [ticketsRes, workersRes] = await Promise.all([
          API.get('/tickets/all'),
          API.get('/admin/users/workers'),
        ]);

        if (!isMounted) return;

        const rawTickets = Array.isArray(ticketsRes.data)
          ? ticketsRes.data
          : Array.isArray(ticketsRes.data?.tickets)
          ? ticketsRes.data.tickets
          : [];

        const rawWorkers = Array.isArray(workersRes.data)
          ? workersRes.data
          : Array.isArray(workersRes.data?.workers)
          ? workersRes.data.workers
          : [];

        setTickets(rawTickets);
        setWorkers(rawWorkers);
        setErrorMsg('');
      } catch (err) {
        console.error('Admin data fetch error:', err);
        if (isMounted) {
          setTickets([]);
          setWorkers([]);
          setErrorMsg(err.response?.data?.message || 'MongoDB / Backend connection error.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Button Handler
  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const [ticketsRes, workersRes] = await Promise.all([
        API.get('/tickets/all'),
        API.get('/admin/users/workers'),
      ]);

      const rawTickets = Array.isArray(ticketsRes.data)
        ? ticketsRes.data
        : Array.isArray(ticketsRes.data?.tickets)
        ? ticketsRes.data.tickets
        : [];

      const rawWorkers = Array.isArray(workersRes.data)
        ? workersRes.data
        : Array.isArray(workersRes.data?.workers)
        ? workersRes.data.workers
        : [];

      setTickets(rawTickets);
      setWorkers(rawWorkers);
      setErrorMsg('');
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setTickets([]);
      setWorkers([]);
      setErrorMsg(err.response?.data?.message || 'MongoDB / Backend connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Filtering Calculation
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

  // GSAP Stagger Animations
  useEffect(() => {
    let ctx = gsap.context(() => {
      if (activeTab === 'complaints' && cardsContainerRef.current && !loading && filteredTickets.length > 0) {
        const children = cardsContainerRef.current.children;
        if (children && children.length > 0) {
          gsap.fromTo(
            children,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
          );
        }
      }

      if (activeTab === 'workers' && workersContainerRef.current && !loading && workers.length > 0) {
        const children = workersContainerRef.current.children;
        if (children && children.length > 0) {
          gsap.fromTo(
            children,
            { opacity: 0, scale: 0.96, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'back.out(1.1)', clearProps: 'all' }
          );
        }
      }
    });

    return () => ctx.revert();
  }, [activeTab, loading, filteredTickets.length, workers.length]);

  // Action Handlers
  const handleStatusUpdate = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    const previousTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      await API.put(`/tickets/update-status/${ticketId}`, { status: newStatus });
    } catch (err) {
      console.error('Update Status Error:', err);
      setTickets(previousTickets);
      alert('Failed to update status in database.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWorkerAssign = async (ticketId, workerId) => {
    setUpdatingId(ticketId);
    const selectedWorker = workers.find((w) => w._id === workerId);
    const previousTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, assignedWorker: selectedWorker || workerId } : t))
    );

    try {
      await API.put(`/admin/tickets/assign/${ticketId}`, { workerId });
    } catch (err) {
      console.error('Assign Worker Error:', err);
      setTickets(previousTickets);
      alert('Failed to assign worker in database.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    window.location.href = '/login';
  };

  // Analytics Calculation
  const dynamicAnalytics = {
    totalTickets: tickets.length,
    pending: tickets.filter((t) => (t.status || 'Pending').toLowerCase() === 'pending').length,
    inProgress: tickets.filter((t) => ['approved', 'in progress'].includes((t.status || '').toLowerCase())).length,
    resolved: tickets.filter((t) => ['resolved', 'closed'].includes((t.status || '').toLowerCase())).length,
  };

  const renderStatusBadge = (status = 'Pending') => {
    const s = status.toLowerCase();
    const isApproved = ['approved', 'in progress', 'resolved'].includes(s);
    const isRejected = ['rejected', 'reject', 'closed'].includes(s);

    if (isApproved) {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <CheckCircle size={12} /> {status}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]" />
          <XCircle size={12} /> {status}
        </span>
      );
    }
    return (
      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
        <Clock size={12} /> Pending
      </span>
    );
  };

  const renderSidebar = () => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2 rounded-lg shadow-[0_0_15px_rgba(0,242,254,0.3)]">
            <Cpu size={20} className="text-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white m-0">
              ADMIN<span className="text-cyan-400">CORE</span>
            </h2>
            <span className="text-[9px] text-slate-500 tracking-wider uppercase font-extrabold block">Control Center</span>
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="bg-cyan-400 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-slate-950 text-sm shrink-0">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="m-0 font-bold text-slate-100 text-xs truncate">{currentUser?.name}</p>
              <span className="text-[10px] text-cyan-400 font-bold block">Super Admin Access</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex flex-col gap-1">
            <span className="flex items-center gap-1.5 truncate">
              <Mail size={11} className="text-cyan-400 shrink-0" /> {currentUser?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Database size={11} className="text-cyan-400 shrink-0" /> MongoDB: Connected
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
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
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs font-semibold cursor-pointer w-full ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                  <span className="truncate">{item.label}</span>
                </div>
                <ChevronRight size={14} className={isActive ? 'text-cyan-400' : 'text-slate-600'} />
              </motion.button>
            );
          })}
        </nav>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer font-bold text-xs transition-all mt-4"
      >
        <LogOut size={14} /> Exit System Session
      </motion.button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#080a0f] text-slate-100 font-sans">
      <aside className="hidden md:flex w-64 bg-[#05070a] border-r border-slate-800 p-5 flex-col shrink-0 h-screen sticky top-0">
        {renderSidebar()}
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#05070a] border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <button onClick={() => setSidebarOpen(true)} className="bg-transparent border-0 text-white cursor-pointer p-1">
          <Menu size={22} className="text-cyan-400" />
        </button>
        <h2 className="text-sm font-extrabold text-white m-0">ADMINCORE</h2>
        <div className="w-5" />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-[#05070a] border-r border-slate-800 p-4 z-50 md:hidden overflow-y-auto"
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setSidebarOpen(false)} className="bg-transparent border-0 text-slate-400 cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              {renderSidebar()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full pt-20 px-4 pb-8 md:pt-8 md:px-8">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg mb-4 flex items-center gap-2 text-red-400 text-xs"
            >
              <AlertCircle size={16} /> {errorMsg}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-cyan-400 rounded-xl p-6 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-cyan-400 p-2.5 rounded-lg shadow-[0_0_15px_rgba(0,242,254,0.3)] shrink-0">
                      <ShieldCheck size={24} className="text-slate-950" />
                    </div>
                    <div>
                      <h1 className="m-0 text-xl font-extrabold text-white">
                        Command Terminal • <span className="text-cyan-400">System Analytics</span>
                      </h1>
                      <p className="mt-1 mb-0 text-slate-400 text-xs">Overall platform performance metrics and operation dispatches.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
                  {[
                    { title: 'Total System Tickets', count: dynamicAnalytics.totalTickets, color: 'text-white', Icon: ClipboardList, borderTop: 'border-t-cyan-400', iconColor: '#00f2fe' },
                    { title: 'Pending Clearance', count: dynamicAnalytics.pending, color: 'text-amber-500', Icon: Clock, borderTop: 'border-t-amber-500', iconColor: '#f59e0b' },
                    { title: 'Approved / In-Progress', count: dynamicAnalytics.inProgress, color: 'text-sky-400', Icon: CheckCircle, borderTop: 'border-t-sky-400', iconColor: '#38bdf8' },
                    { title: 'Resolved History Logs', count: dynamicAnalytics.resolved, color: 'text-emerald-500', Icon: CheckCircle, borderTop: 'border-t-emerald-500', iconColor: '#10b981' },
                  ].map((stat, i) => (
                    <motion.div key={i} whileHover={{ y: -3 }} className={`bg-slate-900 border border-slate-800 p-4 rounded-lg border-t-2 ${stat.borderTop}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-500 font-bold uppercase">{stat.title}</span>
                        <stat.Icon size={16} color={stat.iconColor} />
                      </div>
                      <p className={`text-2xl font-extrabold mt-2 mb-0 ${stat.color}`}>{stat.count}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <h3 className="m-0 text-white text-sm font-bold">Live Complaints Dispatch</h3>
                    <p className="mt-1 mb-4 text-slate-400 text-xs">Inspect and process MongoDB live customer issues.</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab('complaints')}
                      className="bg-cyan-400 text-slate-950 border-0 px-3.5 py-2 rounded-md font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Manage MongoDB Complaints ({tickets.length}) <ChevronRight size={13} />
                    </motion.button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <h3 className="m-0 text-white text-sm font-bold">Field Technicians Roster</h3>
                    <p className="mt-1 mb-4 text-slate-400 text-xs">Inspect active workforce database entries.</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab('workers')}
                      className="bg-transparent text-cyan-400 border border-cyan-400 px-3.5 py-2 rounded-md font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Inspect Registered Workers ({workers.length}) <Wrench size={13} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'complaints' && (
              <motion.div
                key="complaints"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                  <div>
                    <h1 className="text-white m-0 text-xl font-extrabold">Master Complaints Stream</h1>
                    <p className="text-slate-400 text-xs m-0">Live records fetched directly from MongoDB database.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="bg-slate-900 border border-slate-800 text-cyan-400 px-3 py-1.5 rounded-md cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Sync MongoDB
                  </motion.button>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg mb-4 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px] bg-[#080a0f] border border-slate-800 px-2.5 py-1 rounded-md">
                    <Search size={14} className="text-cyan-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search ticket titles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-0 text-white text-xs outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500 font-bold">STATUS:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#080a0f] border border-slate-800 text-white rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500 font-bold">PRIORITY:</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="bg-[#080a0f] border border-slate-800 text-white rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
                    >
                      <option value="all">All Priorities</option>
                      <option value="normal">Normal</option>
                      <option value="emergency">Emergency</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500 font-bold">CATEGORY:</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-[#080a0f] border border-slate-800 text-white rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <p className="text-slate-400 text-xs">Fetching complaints...</p>
                ) : filteredTickets.length === 0 ? (
                  <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-10 text-center text-slate-400">
                    <p className="m-0 text-xs">No matching complaints found.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} className="grid gap-3">
                    {filteredTickets.map((ticket) => (
                      <div key={ticket._id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-colors">
                        <div className="flex justify-between items-center flex-wrap gap-2.5 mb-2.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="m-0 text-white text-base font-bold">{ticket.title}</h2>
                            <span className="bg-[#080a0f] text-cyan-400 text-[10px] px-2 py-0.5 rounded border border-slate-800 font-bold">
                              {ticket.category || 'General'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              ticket.priority === 'Emergency'
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {ticket.priority || 'Normal'}
                            </span>
                          </div>
                          {renderStatusBadge(ticket.status)}
                        </div>

                        <p className="mt-0 mb-3 text-slate-300 text-xs leading-relaxed bg-[#080a0f] p-3 rounded-lg border border-slate-800">
                          {ticket.description}
                        </p>

                        <div className="flex justify-between items-center flex-wrap gap-3 pt-2.5 border-t border-white/5">
                          <div className="flex gap-4 flex-wrap items-center">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                              <User size={12} className="text-cyan-400 shrink-0" />
                              <strong className="text-slate-100">Customer:</strong> {ticket.user?.name || ticket.userName || 'Customer User'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Wrench size={12} className="text-amber-500 shrink-0" />
                              <strong className="text-slate-100 text-xs">Assign Worker:</strong>
                              <select
                                value={ticket.assignedWorker?._id || ticket.assignedWorker || ''}
                                onChange={(e) => handleWorkerAssign(ticket._id, e.target.value)}
                                disabled={updatingId === ticket._id}
                                className="bg-[#080a0f] border border-slate-800 text-white rounded px-1.5 py-0.5 text-xs outline-none cursor-pointer"
                              >
                                <option value="">Unassigned</option>
                                {workers.map((w) => (
                                  <option key={w._id} value={w._id}>{w.name} ({w.category || 'General'})</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusUpdate(ticket._id, 'Approved')}
                              disabled={updatingId === ticket._id}
                              className="bg-emerald-500/15 text-emerald-400 border border-emerald-500 px-3 py-1 rounded-md font-bold text-xs cursor-pointer"
                            >
                              Approve
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStatusUpdate(ticket._id, 'Rejected')}
                              disabled={updatingId === ticket._id}
                              className="bg-red-500/15 text-red-400 border border-red-500 px-3 py-1 rounded-md font-bold text-xs cursor-pointer"
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

            {activeTab === 'workers' && (
              <motion.div
                key="workers"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4">
                  <h1 className="text-white m-0 text-xl font-extrabold">Technicians Directory</h1>
                  <p className="text-slate-400 text-xs m-0">Registered field workers from database.</p>
                </div>

                <div ref={workersContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {loading ? (
                    <p className="text-slate-400 text-xs">Loading workers...</p>
                  ) : workers.map((w) => (
                    <div key={w._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-amber-500 w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-slate-950 text-sm shrink-0">
                          {w.name ? w.name[0].toUpperCase() : 'W'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="m-0 text-white text-sm font-bold truncate">{w.name}</h3>
                          <span className="text-[10px] text-cyan-400 font-bold block truncate">{w.category || 'Technician'}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-col gap-1 border-t border-slate-800 pt-2.5">
                        <span className="truncate"><strong className="text-slate-100">Email:</strong> {w.email}</span>
                        <span><strong className="text-slate-100">Role:</strong> {w.role}</span>
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