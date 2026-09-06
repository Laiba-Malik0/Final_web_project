import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { 
  LayoutDashboard, FileText, LogOut, Menu, X, PlusCircle, Search, Edit2, 
  Trash2, Sparkles, Calendar, HardHat, CheckCircle, 
  XCircle, Clock, ChevronRight, User
} from 'lucide-react';

import CreateTicket from './CreateTicket';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://final-web-backend-eta.vercel.app/api';
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
      ? { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle, label: status }
      : isRejected
        ? { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: XCircle, label: status }
        : { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock, label: 'Pending' };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${config.bg}`}>
        <Icon size={14} /> <span className="capitalize">{config.label}</span>
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex-col justify-between p-6 sticky top-0 h-screen z-30">
        <div>
          <div className="flex items-center gap-3.5 mb-8 px-2">
            <div className="bg-gradient-to-tr from-sky-400 to-blue-600 p-2.5 rounded-2xl shadow-lg shadow-sky-500/20">
              <Search size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide m-0">SUPPORT<span className="text-sky-400">SPHERE</span></h2>
              <span className="text-[10px] text-sky-400/90 uppercase font-extrabold tracking-widest block mt-0.5">Customer Portal</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 mb-8 border border-slate-700/50 shadow-sm">
            <div className="bg-gradient-to-br from-sky-400 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md shadow-sky-500/10">
              {currentUserName ? currentUserName[0].toUpperCase() : <User size={18} />}
            </div>
            <div className="overflow-hidden">
              <p className="m-0 font-bold text-sm text-white truncate">{currentUserName}</p>
              <span className="text-[11px] text-sky-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span> Active User
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {[
              { id: 'dashboard', label: 'Portal Overview', icon: LayoutDashboard }, 
              { id: 'complaints', label: `My Complaints (${tickets.length})`, icon: FileText }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center justify-between px-4 py-3 rounded-xl border font-semibold cursor-pointer text-xs transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400/30 shadow-lg shadow-sky-500/25' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3"><tab.icon size={18} /> {tab.label}</div>
                {activeTab === tab.id && <ChevronRight size={16} />}
              </button>
            ))}
          </nav>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={handleLogout} 
          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white cursor-pointer font-bold text-xs transition-all shadow-sm"
        >
          <LogOut size={16} /> Log Out
        </motion.button>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[998] lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} className="fixed top-0 left-0 bottom-0 w-[280px] z-[999] bg-slate-900 p-6 flex flex-col justify-between border-r border-slate-800 lg:hidden shadow-2xl">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg font-black text-white m-0">SUPPORT<span className="text-sky-400">SPHERE</span></h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800 border border-slate-700 text-slate-400 hover:text-white p-2 rounded-xl cursor-pointer"><X size={18} /></button>
                </div>

                <nav className="flex flex-col gap-2">
                  {[
                    { id: 'dashboard', label: 'Portal Overview', icon: LayoutDashboard }, 
                    { id: 'complaints', label: `My Complaints (${tickets.length})`, icon: FileText }
                  ].map((tab) => (
                    <button 
                      key={tab.id} 
                      onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} 
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border font-semibold cursor-pointer text-xs ${
                        activeTab === tab.id ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400/30' : 'bg-transparent border-transparent text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3"><tab.icon size={18} /> {tab.label}</div>
                    </button>
                  ))}
                </nav>
              </div>

              <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white cursor-pointer font-bold text-xs transition-all">
                <LogOut size={16} /> Log Out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Mobile Topbar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 px-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between z-[90]">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-slate-800 border border-slate-700 text-white p-2 rounded-xl cursor-pointer">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-black text-white text-base tracking-wide">SUPPORT<span className="text-sky-400">SPHERE</span></span>
          <div className="w-8"></div>
        </header>

        <main className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full pt-20 lg:pt-10 px-4 sm:px-8 pb-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div key="tab-dash" variants={cardVariant} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                  <div className="inline-flex items-center gap-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4">
                    <Sparkles size={14} /> SUPPORT SPHERE SYSTEM
                  </div>
                  <h1 className="text-2xl sm:text-4xl m-0 mb-3 text-white font-black tracking-tight">
                    Welcome back, <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">{currentUserName}</span>
                  </h1>
                  <p className="text-slate-400 m-0 text-sm max-w-xl leading-relaxed">Lodge tickets and track live updates directly from workers in real time.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <button onClick={() => setIsCreateModalOpen(true)} className="group relative overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 border-0 rounded-3xl p-6 text-white text-left cursor-pointer transition-all duration-300 shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-1">
                    <PlusCircle size={32} className="mb-4 text-white group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="m-0 mb-1 text-lg font-bold">File New Complaint</h3>
                    <p className="m-0 text-xs text-sky-100/80">Request maintenance or fix</p>
                  </button>

                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 flex flex-col justify-center">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Complaints</span>
                    <h2 className="text-4xl font-black mt-2 m-0 text-white">{tickets.length}</h2>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="tab-complaints" variants={cardVariant} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl m-0 font-black text-white tracking-tight">My Complaints</h1>
                    <p className="m-0 text-xs sm:text-sm text-slate-400 mt-1">View and track all your support requests</p>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-slate-950 border-0 rounded-xl px-5 py-3 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20">
                    <PlusCircle size={18} /> New Complaint
                  </button>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-slate-400 text-sm bg-slate-900/40 rounded-3xl border border-slate-800/80">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80">
                    <p className="m-0 text-slate-400 text-sm">No complaints found. Click "New Complaint" to get started.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} className="grid grid-cols-1 gap-4">
                    {tickets.map((ticket, index) => (
                      <div key={ticket._id || index} className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div>
                            <h3 className="m-0 mb-1 text-base sm:text-lg text-white font-bold">{ticket.title}</h3>
                            <span className="text-xs text-sky-400 font-semibold">{ticket.category}</span>
                          </div>
                          <div className="self-start sm:self-center">
                            {renderStatusBadge(ticket.status)}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 m-0 mb-6 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">{ticket.description}</p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                          <div className="flex flex-wrap gap-4">
                            <span className="flex items-center gap-1.5"><Calendar size={15} className="text-slate-500" /> {formatDate(ticket.date, ticket.createdAt)}</span>
                            <span className="flex items-center gap-1.5"><HardHat size={15} className="text-slate-500" /> Worker: <strong className="text-slate-300">{ticket.assignedWorker || 'Unassigned'}</strong></span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button onClick={() => handleOpenEdit(ticket)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 px-3 py-2 rounded-xl cursor-pointer text-xs flex items-center gap-1.5 font-semibold transition-colors">
                              <Edit2 size={14} /> Edit
                            </button>
                            <button onClick={() => handleDeleteTicket(ticket._id)} className="bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-rose-400 px-3 py-2 rounded-xl cursor-pointer text-xs flex items-center gap-1.5 font-semibold transition-colors">
                              <Trash2 size={14} /> Delete
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="m-0 text-xl font-bold text-white">File New Complaint</h2>
                <button onClick={closeModal} className="bg-slate-800 border border-slate-700 text-slate-400 hover:text-white p-2 rounded-xl cursor-pointer"><X size={18} /></button>
              </div>

              <CreateTicket user={user} onSuccess={handleTicketCreated} onClose={closeModal} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TICKET MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="m-0 text-xl font-bold text-white">Edit Complaint</h2>
                <button onClick={closeModal} className="bg-slate-800 border border-slate-700 text-slate-400 hover:text-white p-2 rounded-xl cursor-pointer"><X size={18} /></button>
              </div>

              <form onSubmit={handleUpdateTicket} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Issue Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all">
                      <option value="Plumbing Fix">Plumbing Fix</option>
                      <option value="Electrical Issue">Electrical Issue</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="General Maintenance">General Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all">
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Description</label>
                  <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-none" />
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 cursor-pointer font-semibold text-xs hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl border-0 bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950 cursor-pointer font-bold text-xs hover:from-sky-500 hover:to-blue-600 transition-all shadow-md shadow-sky-500/20">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}