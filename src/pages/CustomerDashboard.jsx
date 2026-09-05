import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { 
  LayoutDashboard, FileText, LogOut, Menu, X, PlusCircle, Search, Edit2, 
  Trash2, Sparkles, Calendar, HardHat, CheckCircle, 
  XCircle, Clock, ChevronRight
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
      // eslint-disable-next-line no-unused-vars
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
      ? { bg: 'bg-green-500/10 text-green-400 border-green-500/30', icon: CheckCircle, label: status }
      : isRejected
        ? { bg: 'bg-red-500/10 text-red-400 border-red-500/30', icon: XCircle, label: status }
        : { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'Pending' };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm ${config.bg}`}>
        <Icon size={13} /> {config.label}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0b1120] text-slate-50 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden min-[851px]:flex w-[270px] bg-slate-900 border-r border-slate-800 flex-col justify-between p-7 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-2.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Search size={20} className="text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-wider m-0">SUPPORT<span className="text-sky-400">SPHERE</span></h2>
              <span className="text-[10px] text-sky-400 uppercase font-extrabold tracking-widest block">Customer Portal</span>
            </div>
          </div>

          <div className="bg-slate-800 p-3.5 rounded-xl flex items-center gap-3 mb-7 border border-slate-700">
            <div className="bg-white w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-slate-900 text-base">
              {currentUserName ? currentUserName[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="m-0 font-bold text-xs truncate">{currentUserName}</p>
              <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span> Active User
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border-0 font-bold cursor-pointer text-xs transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(255,255,255,0.15)]' 
                    : 'bg-transparent text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5"><tab.icon size={16} /> {tab.label}</div>
                {activeTab === tab.id && <ChevronRight size={15} />}
              </button>
            ))}
          </nav>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.97 }} 
          onClick={handleLogout} 
          className="flex items-center justify-center gap-2 p-2.5 rounded-lg border-0 bg-red-500 text-white cursor-pointer font-bold text-xs shadow-[0_4px_12px_rgba(239,68,68,0.25)]"
        >
          <LogOut size={15} /> Log Out
        </motion.button>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[998]" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} className="fixed top-0 left-0 bottom-0 w-[270px] z-[999] bg-slate-900 p-6 flex flex-col justify-between border-r border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-7">
                  <h2 className="text-base font-extrabold text-white m-0">SUPPORT<span className="text-sky-400">SPHERE</span></h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="bg-transparent border-0 text-slate-400 cursor-pointer"><X size={20} /></button>
                </div>

                <nav className="flex flex-col gap-2">
                  {[
                    { id: 'dashboard', label: 'Portal Overview', icon: LayoutDashboard }, 
                    { id: 'complaints', label: `My Complaints (${tickets.length})`, icon: FileText }
                  ].map((tab) => (
                    <button 
                      key={tab.id} 
                      onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} 
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border-0 font-bold cursor-pointer text-xs ${
                        activeTab === tab.id ? 'bg-white text-slate-900' : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5"><tab.icon size={16} /> {tab.label}</div>
                    </button>
                  ))}
                </nav>
              </div>

              <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-2.5 rounded-lg border-0 bg-red-500 text-white cursor-pointer font-bold text-xs shadow-[0_4px_12px_rgba(239,68,68,0.25)]">
                <LogOut size={15} /> Log Out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Mobile Topbar */}
        <header className="max-[850px]:flex hidden fixed top-0 left-0 right-0 h-[56px] px-4 bg-slate-900 border-b border-slate-800 items-center justify-between z-[90]">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-slate-800 border border-slate-700 text-white p-1.5 rounded-lg cursor-pointer">
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="font-extrabold text-white text-sm">SUPPORT<span className="text-sky-400">SPHERE</span></span>
          <div className="w-[30px]"></div>
        </header>

        <main className="flex-1 overflow-y-auto max-w-[1100px] mx-auto w-full max-[850px]:pt-[75px] max-[850px]:px-4 max-[850px]:pb-7 min-[851px]:p-[36px_40px]">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div key="tab-dash" variants={cardVariant} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-5">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-7 shadow-2xl">
                  <div className="inline-flex items-center gap-1.5 bg-sky-400/10 text-sky-400 border border-sky-400/20 px-3 py-1 rounded-full text-[11px] font-bold mb-3.5">
                    <Sparkles size={13} /> SUPPORT SPHERE SYSTEM
                  </div>
                  <h1 className="text-2xl min-[851px]:text-3xl m-0 mb-2 text-white font-extrabold">
                    Welcome back, <span className="text-sky-400">{currentUserName}</span>
                  </h1>
                  <p className="text-slate-400 m-0 text-xs min-[851px]:text-sm leading-relaxed">Lodge tickets and track live updates directly from workers.</p>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                  <button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-br from-sky-600 to-sky-700 border-0 rounded-2xl p-5 text-white text-left cursor-pointer transition-all shadow-[0_8px_20px_rgba(2,132,199,0.3)] hover:brightness-110">
                    <PlusCircle size={28} className="mb-3" />
                    <h3 className="m-0 mb-1 text-base font-bold">File New Complaint</h3>
                    <p className="m-0 text-xs opacity-80">Request maintenance or fix</p>
                  </button>

                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col justify-center">
                    <span className="text-xs text-slate-400 font-semibold">Total Complaints</span>
                    <h2 className="text-3xl font-extrabold mt-1 m-0 text-white">{tickets.length}</h2>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="tab-complaints" variants={cardVariant} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-5">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h1 className="text-2xl m-0 font-extrabold text-white">My Complaints</h1>
                    <p className="m-0 text-xs text-slate-400 mt-1">View and track all your support requests</p>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(true)} className="bg-sky-400 hover:bg-sky-500 text-slate-900 border-0 rounded-lg px-4 py-2.5 font-bold text-xs cursor-pointer flex items-center gap-2 transition-colors">
                    <PlusCircle size={16} /> New Complaint
                  </button>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-slate-400 text-sm">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="p-10 text-center bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="m-0 text-slate-400 text-sm">No complaints found. Click "New Complaint" to get started.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} className="flex flex-col gap-3">
                    {tickets.map((ticket, index) => (
                      <div key={ticket._id || index} className="bg-gradient-to-br from-slate-800 to-slate-900/80 border border-slate-700 hover:border-slate-600 rounded-2xl p-5.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                        <div className="flex justify-between items-start mb-3 gap-2.5">
                          <div>
                            <h3 className="m-0 mb-1 text-base text-white font-bold">{ticket.title}</h3>
                            <span className="text-xs text-sky-400 font-semibold">{ticket.category}</span>
                          </div>
                          {renderStatusBadge(ticket.status)}
                        </div>

                        <p className="text-xs text-slate-300 m-0 mb-4 leading-relaxed">{ticket.description}</p>

                        <div className="flex justify-between items-center flex-wrap gap-3 pt-3 border-t border-slate-700/60 text-xs text-slate-400">
                          <div className="flex gap-4 flex-wrap">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(ticket.date, ticket.createdAt)}</span>
                            <span className="flex items-center gap-1"><HardHat size={14} /> Worker: {ticket.assignedWorker || 'Unassigned'}</span>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => handleOpenEdit(ticket)} className="bg-transparent border border-slate-700 text-sky-400 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs flex items-center gap-1 hover:bg-slate-800 transition-colors">
                              <Edit2 size={13} /> Edit
                            </button>
                            <button onClick={() => handleDeleteTicket(ticket._id)} className="bg-transparent border border-slate-700 text-red-400 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs flex items-center gap-1 hover:bg-slate-800 transition-colors">
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-[500px] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4.5">
                <h2 className="m-0 text-lg font-bold text-white">File New Complaint</h2>
                <button onClick={closeModal} className="bg-transparent border-0 text-slate-400 cursor-pointer hover:text-white"><X size={18} /></button>
              </div>

              <CreateTicket user={user} onSuccess={handleTicketCreated} onClose={closeModal} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TICKET MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-[500px] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4.5">
                <h2 className="m-0 text-lg font-bold text-white">Edit Complaint</h2>
                <button onClick={closeModal} className="bg-transparent border-0 text-slate-400 cursor-pointer hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleUpdateTicket} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-bold">Issue Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3.5 py-2 rounded-lg bg-[#0b1120] border border-slate-700 text-white text-xs outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-bold">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3.5 py-2 rounded-lg bg-[#0b1120] border border-slate-700 text-white text-xs outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all">
                      <option value="Plumbing Fix">Plumbing Fix</option>
                      <option value="Electrical Issue">Electrical Issue</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="General Maintenance">General Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-bold">Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3.5 py-2 rounded-lg bg-[#0b1120] border border-slate-700 text-white text-xs outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all">
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-bold">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="w-full px-3.5 py-2 rounded-lg bg-[#0b1120] border border-slate-700 text-white text-xs outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all resize-none" />
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white cursor-pointer font-semibold text-xs hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-lg border-0 bg-sky-400 text-slate-900 cursor-pointer font-bold text-xs hover:bg-sky-500 transition-colors">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}