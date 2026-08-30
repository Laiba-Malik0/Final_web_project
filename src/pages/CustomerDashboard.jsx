import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Ticket, Clock, CheckCircle2, AlertCircle, Edit2, 
  Trash2, X, User, MessageSquare, Sparkles, RefreshCw, Send, Tag, FileText
} from 'lucide-react';

axios.defaults.baseURL = 'http://localhost:5000';

const CustomerDashboard = () => {
  const [user, setUser] = useState({});
  const [tickets, setTickets] = useState([]);
  
  // State for controlling Complaint Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Input States
  const [category, setCategory] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error('LocalStorage User Parse Error:', e);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMessage('');
    const token = localStorage.getItem('token');
    
    if (!token) {
      setErrorMessage('Authorization token missing. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const ticketsRes = await axios.get('/api/tickets/my-tickets', getAuthHeader());
      setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
    } catch (err) {
      console.error('Fetch Error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Submit Complaint Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTicket) {
        // Edit Complaint
        await axios.put(`/api/tickets/update/${editingTicket._id}`, { 
          category, 
          workerName, 
          description 
        }, getAuthHeader());
      } else {
        // Create Complaint with User Name, Category, Worker Name & Description
        await axios.post('/api/tickets/create', { 
          userName: user?.name || 'Customer',
          category, 
          workerName, 
          description 
        }, getAuthHeader());
      }
      
      setShowModal(false);
      resetForm();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await axios.delete(`/api/tickets/delete/${id}`, getAuthHeader());
        setTickets(tickets.filter((t) => t._id !== id));
      } catch (err) {
        alert('Failed to delete ticket');
      }
    }
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setCategory(ticket.category || '');
    setWorkerName(ticket.workerName || ticket.assignedWorkerName || '');
    setDescription(ticket.description || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setCategory('');
    setWorkerName('');
    setDescription('');
    setEditingTicket(null);
  };

  const getStatusBadge = (status) => {
    const s = status ? status.toUpperCase() : 'OPEN';
    switch (s) {
      case 'CLOSED':
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background Lighting Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Support Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{user?.name || 'User'}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              File a new complaint or track your submitted complaints below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={loadDashboardData}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Click to open Complaint Form */}
            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Create Complaint</span>
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Complaints</span>
              <Ticket className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{tickets.length}</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
            </div>
          </div>
        </div>

        {/* Complaints List on Dashboard */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>Your Complaints</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {tickets.length}
            </span>
          </h2>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading complaints...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No Complaints Found</h3>
              <p className="text-sm text-slate-400 mb-6">
                You haven't submitted any complaints yet.
              </p>
              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider underline underline-offset-4"
              >
                + Register New Complaint
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((t) => (
                <div 
                  key={t._id} 
                  className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {t.category}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                        {t.status || 'OPEN'}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {t.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-1.5 text-xs text-slate-400 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Worker:</span>
                        <span className="font-semibold text-slate-300">{t.workerName || t.assignedWorkerName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Date:</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(t)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(t._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* COMPLAINT FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {editingTicket ? 'Edit Complaint Request' : 'File a New Complaint'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Please enter the complaint details below.
            </p>

            {/* FORM STARTS HERE */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 1. User Name (Read-Only) */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> User Name
                </label>
                <input 
                  type="text" 
                  disabled
                  value={user?.name || 'Customer'} 
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* 2. Complaint Category */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" /> Complaint Category
                </label>
                <input 
                  type="text" 
                  required 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="e.g. Electricity, Maintenance, Network Issue" 
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* 3. Worker Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Worker Name
                </label>
                <input 
                  type="text" 
                  required 
                  value={workerName} 
                  onChange={(e) => setWorkerName(e.target.value)} 
                  placeholder="Enter worker or technician name" 
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* 4. Complaint Details / Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Complaint Details / Description
                </label>
                <textarea 
                  required 
                  rows="4" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Describe your complaint here in detail..." 
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : editingTicket ? 'Update Complaint' : 'Submit Complaint'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;