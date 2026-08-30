import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Sparkles, Send, Loader2, MessageSquarePlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreateTicket() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/tickets', { subject, description, category });
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative">
        <div className="flex items-center gap-3.5 mb-6 border-b border-slate-800 pb-5">
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl text-indigo-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Create Support Ticket</h2>
            <p className="text-slate-400 text-xs">Gemini AI Triage will auto-classify & prioritize your issue instantly</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ticket Subject</label>
            <input type="text" required placeholder="e.g. Payment failed but amount deducted" className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 px-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs transition" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Suggested Category (Optional)</label>
            <select className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 px-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Let Gemini AI Triage auto-assign</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
              <option value="Account">Account</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Detailed Description</label>
            <textarea required rows="5" placeholder="Explain what happened in detail..." className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-4 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs transition resize-none" value={description} onChange={e => setDescription(e.target.value)}></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition border border-indigo-400/30 flex justify-center items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Triage Analyzing...</> : <><Send className="w-4 h-4" /> Submit Ticket</>}
          </button>
        </form>
      </div>
    </motion.div>
  );
}