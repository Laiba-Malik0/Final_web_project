import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  LifeBuoy, CheckCircle, XCircle, Clock, RefreshCw, Mail,
  AlertCircle, LogOut, ChevronRight, Menu, X, LayoutDashboard,
  ClipboardList, Filter, Trash2, Edit2, Check, Lock, Hash, PlusCircle
} from 'lucide-react';

import API from '../api';
import CreateTicket from './CreateTicket'; // Make sure the path matches your project structure

const SidebarContent = ({ currentUser, activeTab, setActiveTab, setSidebarOpen, ticketCount, handleLogout }) => (
  <div className="h-full flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-sky-500 p-2 rounded-xl flex shadow-[0_0_12px_rgba(14,165,233,0.4)]">
          <LifeBuoy size={20} className="text-[#0d131a]" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-white tracking-wide m-0">
            Support<span className="text-sky-400">Sphere</span>
          </h2>
          <span className="text-[9px] text-sky-400 tracking-wider uppercase font-extrabold block">Customer Portal</span>
        </div>
      </div>

      <div className="bg-[#131c26] p-3 rounded-xl border border-[#223142] mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-sky-500 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[#0d131a] text-sm">
            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <p className="m-0 font-bold text-slate-100 text-xs">{currentUser?.name || 'Customer'}</p>
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]"></span> Account Verified
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-[#1e2d3d] pt-2 flex items-center gap-1">
          <Mail size={11} className="text-sky-400" /> {currentUser?.email || 'user@sphere.com'}
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'my-tickets', label: `My Tickets (${ticketCount})`, icon: ClipboardList }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`flex items-center justify-between p-2.5 rounded-lg border-none font-extrabold text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-sky-500 text-[#0d131a] shadow-[0_4px_12px_rgba(14,165,233,0.3)]'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-[#131c26]'
              }`}
            >
              <div className="flex items-center gap-2">
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

export default function CustomerDashboard({ user }) {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const currentUser = user || storedUser || { name: 'Customer', email: 'user@sphere.com' };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Create Ticket Form
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit State
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Filters State
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const cardsContainerRef = useRef(null);

  const fetchMyTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/tickets/my-tickets');
      const rawTickets = Array.isArray(res.data) ? res.data : (res.data?.tickets || []);
      setTickets(rawTickets);
    } catch (err) {
      console.error('Fetch Customer Tickets Error:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  useEffect(() => {
    if (activeTab === 'my-tickets' && cardsContainerRef.current && !loading) {
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
  }, [activeTab, loading, statusFilter, priorityFilter]);

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await API.delete(`/tickets/delete/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
    } catch (err) {
      console.error('Delete Ticket Error:', err);
      alert('Failed to delete complaint.');
    }
  };

  const handleStartEdit = (ticket) => {
    setEditingTicketId(ticket._id);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
  };

  const handleSaveEdit = async (ticketId) => {
    try {
      await API.put(`/tickets/update/${ticketId}`, {
        title: editTitle,
        description: editDescription
      });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, title: editTitle, description: editDescription } : t))
      );
      setEditingTicketId(null);
    } catch (err) {
      console.error('Update Ticket Error:', err);
      alert('Failed to update complaint.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleTicketCreated = (newTicket) => {
    fetchMyTickets();
    setActiveTab('my-tickets');
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const s = (t.status || 'Pending').toLowerCase();
      const p = (t.priority || 'Normal').toLowerCase();

      if (statusFilter === 'pending' && s !== 'pending') return false;
      if (statusFilter === 'approved' && !['approved', 'in progress', 'completed'].includes(s)) return false;
      if (statusFilter === 'rejected' && s !== 'rejected') return false;

      if (priorityFilter !== 'all' && p !== priorityFilter.toLowerCase()) return false;

      return true;
    });
  }, [tickets, statusFilter, priorityFilter]);

  const pendingCount = useMemo(() => 
    tickets.filter(t => (t.status || 'Pending').toLowerCase() === 'pending').length,
    [tickets]
  );
  
  const resolvedCount = useMemo(() => 
    tickets.filter(t => ['approved', 'in progress', 'completed'].includes((t.status || '').toLowerCase())).length,
    [tickets]
  );

  const renderStatusBadge = (status = 'Pending') => {
    const s = status.toLowerCase();
    const isApproved = ['approved', 'in progress', 'completed'].includes(s);
    const isRejected = s === 'rejected';

    const config = isApproved
      ? { bg: 'bg-green-500/10 text-green-400 border-green-500/30', Icon: CheckCircle, dot: 'bg-green-400 shadow-[0_0_8px_#4ade80]', text: status }
      : isRejected
        ? { bg: 'bg-red-500/10 text-red-400 border-red-500/30', Icon: XCircle, dot: 'bg-red-400 shadow-[0_0_8px_#f87171]', text: 'Rejected' }
        : { bg: 'bg-sky-500/15 text-sky-400 border-sky-500/40', Icon: Clock, dot: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]', text: 'Pending' };

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
    <div className="flex min-h-screen bg-[#0d131a] text-slate-100 font-sans relative">
      <aside className="hidden lg:flex w-64 bg-[#090d12] border-r border-[#1a2634] p-4 flex-col">
        <SidebarContent {...sidebarProps} />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#090d12] border-b border-[#1a2634] flex items-center justify-between px-4 z-40">
        <button onClick={() => setSidebarOpen(true)} className="bg-transparent border-none text-white cursor-pointer">
          <Menu size={22} />
        </button>
        <h2 className="text-base font-extrabold text-white m-0">
          Support<span className="text-sky-400">Sphere</span>
        </h2>
        <div className="w-5"></div>
      </div>

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

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full pt-16 lg:pt-7 px-4 lg:px-8 pb-6">

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-gradient-to-br from-[#131c26] to-[#090d12] border border-[#223142] border-l-4 border-l-sky-500 rounded-xl p-6 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-sky-500 p-2.5 rounded-xl flex shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                      <LifeBuoy size={24} className="text-[#0d131a]" />
                    </div>
                    <div>
                      <h1 className="m-0 text-xl lg:text-2xl font-extrabold text-white">
                        Hello, <span className="text-sky-400">{currentUser?.name || 'Customer'}</span>!
                      </h1>
                      <p className="m-0 text-slate-400 text-xs mt-1">
                        Customer Helpdesk • Lodge complaints and assign them directly to field technicians.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                  {[
                    { title: 'Total Lodged', count: tickets.length, color: 'text-white', Icon: ClipboardList, iconColor: 'text-sky-400', topBorder: 'border-t-sky-500' },
                    { title: 'Pending Approval', count: pendingCount, color: 'text-sky-400', Icon: Clock, iconColor: 'text-sky-400', topBorder: 'border-t-sky-500' },
                    { title: 'Approved Tasks', count: resolvedCount, color: 'text-green-400', Icon: CheckCircle, iconColor: 'text-green-400', topBorder: 'border-t-green-400' }
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

                <div className="bg-[#131c26] border border-[#223142] p-4 rounded-xl flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h3 className="m-0 text-white text-sm font-extrabold">Need Help with Something?</h3>
                    <p className="m-0 text-slate-400 text-xs mt-0.5">Submit a new complaint ticket directly to our designated technicians.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-sky-500 hover:bg-sky-400 text-[#0d131a] px-4 py-2 rounded-lg font-extrabold text-xs cursor-pointer flex items-center gap-2 transition-colors shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                  >
                    <PlusCircle size={15} /> Create Ticket
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'my-tickets' && (
              <motion.div key="my-tickets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                  <div>
                    <h1 className="text-white m-0 text-xl lg:text-2xl font-extrabold">
                      My Submitted Tickets
                    </h1>
                    <p className="text-slate-400 text-xs m-0 mt-1">
                      Track technician updates, edit details or manage lodged complaints.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-sky-500 hover:bg-sky-400 text-[#0d131a] px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-colors"
                    >
                      <PlusCircle size={14} /> New Ticket
                    </button>
                    <button
                      onClick={fetchMyTickets}
                      disabled={loading}
                      className="bg-[#131c26] border border-[#223142] text-sky-400 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs font-bold hover:bg-[#1a2634] transition-colors"
                    >
                      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh List
                    </button>
                  </div>
                </div>

                <div className="bg-[#131c26] border border-[#223142] p-3 px-4 rounded-lg mb-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Filter size={14} className="text-sky-400" />
                    <span className="text-xs font-bold text-white">Filter By:</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-400">Status:</label>
                    <select
                      className="bg-[#0d131a] text-slate-100 border border-[#223142] px-3 py-1 rounded-md text-xs font-semibold outline-none cursor-pointer focus:border-sky-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved / Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-400">Priority:</label>
                    <select
                      className="bg-[#0d131a] text-slate-100 border border-[#223142] px-3 py-1 rounded-md text-xs font-semibold outline-none cursor-pointer focus:border-sky-500"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <p className="text-slate-400 text-xs">Fetching your complaints...</p>
                ) : filteredTickets.length === 0 ? (
                  <div className="bg-[#131c26] border border-dashed border-[#223142] rounded-xl p-10 text-center text-slate-400">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="m-0 text-xs">No submitted tickets found matching your selected filters.</p>
                  </div>
                ) : (
                  <div ref={cardsContainerRef} className="grid gap-3.5">
                    {filteredTickets.map((ticket) => {
                      const isEditing = editingTicketId === ticket._id;
                      const statusClean = String(ticket.status || 'Pending').toLowerCase();
                      const isActionLocked = ['approved', 'rejected', 'in progress', 'completed'].includes(statusClean);

                      return (
                        <div
                          key={ticket._id}
                          className="bg-gradient-to-br from-[#131c26] to-[#0f1722] border border-[#223142] border-l-4 border-l-sky-500 rounded-xl p-4 lg:p-5 transition-transform hover:-translate-y-0.5 hover:border-sky-500"
                        >
                          <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ticket.ticketNumber && (
                                <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 flex items-center gap-0.5">
                                  <Hash size={11} />{ticket.ticketNumber}
                                </span>
                              )}

                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="bg-[#0d131a] border border-[#223142] text-xs font-bold text-white p-1 rounded outline-none focus:border-sky-500"
                                />
                              ) : (
                                <h2 className="m-0 text-white text-base font-bold">{ticket.title}</h2>
                              )}

                              <span className="bg-[#0d131a] text-slate-300 text-[10px] px-2.5 py-0.5 rounded-md border border-[#223142] font-bold">
                                {ticket.category || 'Electrical'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                ['Urgent', 'High'].includes(ticket.priority)
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-slate-500/20 text-slate-300'
                              }`}>
                                {ticket.priority || 'Normal'}
                              </span>
                            </div>

                            {renderStatusBadge(ticket.status)}
                          </div>

                          {isEditing ? (
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full bg-[#0d131a] border border-[#223142] text-xs text-white p-2.5 rounded-lg outline-none focus:border-sky-500 my-2"
                              rows={3}
                            />
                          ) : (
                            <p className="m-0 text-slate-300 text-xs leading-relaxed bg-[#0d131a] p-2.5 rounded-lg border border-[#1a2634] my-2">
                              {ticket.description}
                            </p>
                          )}

                          <div className="flex justify-between items-center flex-wrap gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                            <div className="flex items-center gap-3">
                              <span>
                                <strong className="text-slate-200">Assigned Tech:</strong> {ticket.assignedWorker?.name || ticket.assignedWorkerName || 'Unassigned'}
                              </span>
                              {(ticket.targetDate || ticket.date) && (
                                <span>
                                  <strong className="text-slate-200">Scheduled Date:</strong> {ticket.targetDate || ticket.date}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveEdit(ticket._id)}
                                  className="bg-green-500 text-[#0d131a] px-2.5 py-1 rounded text-xs font-bold border-none cursor-pointer flex items-center gap-1"
                                >
                                  <Check size={12} /> Save
                                </button>
                              ) : !isActionLocked ? (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(ticket)}
                                    className="bg-[#1a2634] text-sky-400 hover:text-white px-2 py-1 rounded text-xs font-bold border border-[#223142] cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit2 size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTicket(ticket._id)}
                                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded text-xs font-bold border border-red-500/30 cursor-pointer flex items-center gap-1"
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Lock size={10} /> Locked
                                </span>
                              )}
                            </div>
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

      {/* Modal Popup for Ticket Creation */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl"
            >
              <CreateTicket
                user={currentUser}
                onSuccess={(newTicket) => {
                  handleTicketCreated(newTicket);
                }}
                onClose={() => setShowCreateModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}