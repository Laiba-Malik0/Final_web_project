import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import { Bot, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamic Socket URL with Fallback
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const socket = io(SOCKET_URL);

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  const loadTicket = useCallback(() => {
    API.get(`/tickets/${id}`).then(({ data }) => {
      setTicket(data.ticket);
      setMessages(data.messages);
      setCategory(data.ticket.category);
      setPriority(data.ticket.priority);
      setStatus(data.ticket.status);
      setResolutionNote(data.ticket.resolutionNote || '');
    }).catch(err => {
      console.error('Error loading ticket:', err);
    });
  }, [id]);

  useEffect(() => {
    loadTicket();
    socket.emit('join_room', id);

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('ticket_updated', (updatedTicket) => {
      setTicket(updatedTicket);
      setStatus(updatedTicket.status);
    });

    return () => {
      socket.off('receive_message');
      socket.off('ticket_updated');
    };
  }, [id, loadTicket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    socket.emit('send_message', {
      ticketId: id,
      senderId: user.id,
      senderRole: user.role,
      message: newMsg
    });
    setNewMsg('');
  };

  const handleUpdateTriage = async () => {
    try {
      const { data } = await API.patch(`/tickets/${id}/update`, {
        category,
        priority,
        status,
        resolutionNote,
        assignToSelf: true
      });
      setTicket(data);
      if (status === 'Resolved') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
      alert('Ticket & AI Triage updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  if (!ticket) return <div className="p-12 text-center text-slate-500 font-bold">Loading Workspace...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Live Chat Area */}
      <div className="md:col-span-2 glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col h-[680px]">
        <div className="border-b border-slate-800 pb-4 mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-black text-indigo-400 text-sm">{ticket.ticketNumber}</span>
            <span className="bg-slate-800 border border-slate-700 text-slate-300 font-bold px-3 py-1 rounded-full text-[10px]">
              {ticket.status}
            </span>
          </div>
          <h2 className="text-xl font-black text-white">{ticket.subject}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Raised by: {ticket.customerId?.name} ({ticket.customerId?.email})</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-xs text-slate-200">
            <strong className="block text-indigo-400 mb-1 text-[10px] uppercase font-extrabold tracking-wider">Initial Issue Detail:</strong>
            {ticket.description}
          </div>

          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.senderRole === user.role ? 'items-end' : 'items-start'}`}>
              <div className={`p-3.5 rounded-2xl max-w-md text-xs shadow-md border ${m.senderRole === 'AGENT' ? 'bg-indigo-600 text-white border-indigo-500/50' : 'bg-slate-800 text-slate-200 border-slate-700'}`}>
                <p className="font-bold text-[9px] opacity-75 mb-1 uppercase tracking-wider">{m.senderId?.name} ({m.senderRole})</p>
                <p className="leading-relaxed">{m.message}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <input type="text" placeholder={ticket.status === 'Resolved' ? 'Ticket is resolved (Chat locked)' : 'Type your message...'} disabled={ticket.status === 'Resolved'} className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 p-3.5 rounded-xl focus:border-indigo-500 outline-none text-xs disabled:opacity-50" value={newMsg} onChange={e => setNewMsg(e.target.value)} />
          <button type="submit" disabled={ticket.status === 'Resolved'} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-1.5 text-xs shadow-lg shadow-indigo-600/20 border border-indigo-400/30">
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>

      {/* AI Triage & Controls Side Panel */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-5 h-fit">
        <div className="bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/30 p-4 rounded-2xl flex items-center gap-3">
          <Bot className="w-6 h-6 text-indigo-400" />
          <div>
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Gemini AI Triage</h3>
            <p className="text-[10px] text-indigo-300">Automated Natural Language Analysis</p>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2.5 text-slate-300">
          <p className="flex justify-between"><strong>Category:</strong> <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-indigo-300 font-bold">{ticket.aiTriage?.suggestedCategory}</span></p>
          <p className="flex justify-between"><strong>Priority:</strong> <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-amber-400 font-bold">{ticket.aiTriage?.suggestedPriority}</span></p>
          <div className="pt-2 border-t border-slate-800">
            <strong className="block text-slate-400 mb-1 text-[10px] uppercase">AI Executive Summary:</strong>
            <p className="text-slate-300 leading-relaxed text-[11px]">{ticket.aiTriage?.summary}</p>
          </div>
        </div>

        {user.role === 'AGENT' ? (
          <div className="space-y-3.5 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Human Override Controls</h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Category</label>
              <select className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Billing">Billing</option>
                <option value="Technical">Technical</option>
                <option value="Account">Account</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Priority</label>
              <select className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Ticket Status</label>
              <select className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {status === 'Resolved' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Resolution Summary</label>
                <textarea required rows="3" className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none resize-none" placeholder="Explain solution..." value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}></textarea>
              </div>
            )}

            <button onClick={handleUpdateTriage} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 border border-emerald-400/30 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Save & Finalize Update
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-800 text-xs space-y-3">
            {ticket.resolutionNote && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-emerald-300">
                <strong className="block font-bold text-emerald-400 mb-1">Resolution Note:</strong>
                {ticket.resolutionNote}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}