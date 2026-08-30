import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import io from 'socket.io-client';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Clock, Inbox, Sparkles, ArrowRight } from 'lucide-react';

const socket = io('http://localhost:5000');

export default function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, pendingReview: 0 });

  const loadData = () => {
    API.get('/tickets').then(({ data }) => setTickets(data));
    API.get('/stats').then(({ data }) => setStats(data));
  };

  useEffect(() => {
    loadData();
    socket.on('ticket_created', () => loadData());
    socket.on('global_ticket_updated', () => loadData());

    return () => {
      socket.off('ticket_created');
      socket.off('global_ticket_updated');
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-black text-white tracking-tight">Agent Control Center</h1>
        <p className="text-slate-400 text-xs font-medium mt-1">Real-time incoming support tickets & Gemini AI suggestions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Tickets</span>
            <Inbox className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Open Tickets</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{stats.open}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{stats.resolved}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending AI Review</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-indigo-400">{stats.pendingReview}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <tr>
              <th className="p-4">Ticket ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Category</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">AI Review</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
            {tickets.map((t) => (
              <tr key={t._id} className="hover:bg-slate-900/40 transition">
                <td className="p-4 font-black text-indigo-400">{t.ticketNumber}</td>
                <td className="p-4 font-semibold text-slate-200">{t.customerId?.name}</td>
                <td className="p-4">{t.subject}</td>
                <td className="p-4"><span className="bg-slate-800/80 text-slate-300 font-bold px-2.5 py-1 rounded-md border border-slate-700/50 text-[10px]">{t.category}</span></td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] border ${t.priority === 'High' || t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {t.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] border ${t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4">
                  {t.aiTriage?.reviewedByAgent ? (
                    <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">✓ Done</span>
                  ) : (
                    <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1 animate-pulse">⚡ Pending</span>
                  )}
                </td>
                <td className="p-4">
                  <Link to={`/ticket/${t._id}`} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition shadow border border-indigo-400/30 inline-flex items-center gap-1">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}