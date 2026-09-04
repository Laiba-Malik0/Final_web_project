import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, PlusCircle } from 'lucide-react';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://final-web-backend-eta.vercel.app/api',
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function CreateTicket({ user, onSuccess, onClose }) {
  const getUserName = () => {
    if (user && user.name) return user.name;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) return parsed.name;
      } catch (e) {}
    }
    return localStorage.getItem('userName') || 'Customer';
  };

  const currentUserName = getUserName();
  const [workersList, setWorkersList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userName: currentUserName,
    title: '',
    category: 'Plumbing Fix',
    priority: 'Normal',
    date: new Date().toISOString().split('T')[0],
    assignedWorker: '',
    description: ''
  });

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const workersRes = await API.get('/auth/workers');
        const rawWorkers = workersRes.data?.workers || workersRes.data || [];
        setWorkersList(Array.isArray(rawWorkers) ? rawWorkers : []);
      } catch (err) {
        console.error('Error fetching workers:', err);
      }
    };
    fetchWorkers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post('/tickets/create', formData);
      if (onSuccess) onSuccess(res.data?.ticket || formData);
    } catch (err) {
      console.error('Create error:', err);
      if (onSuccess) onSuccess({ ...formData, _id: Date.now().toString(), status: 'Pending' });
    } finally {
      setSubmitting(false);
      if (onClose) onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Customer Name</label>
        <input type="text" value={formData.userName} disabled className="compact-input locked-input" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Issue Title</label>
          <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Pipe Leakage" className="compact-input" />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className="compact-input">
            <option value="Plumbing Fix">Plumbing Fix</option>
            <option value="Electrical Issue">Electrical Issue</option>
            <option value="Carpentry">Carpentry</option>
            <option value="General Maintenance">General Maintenance</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="compact-input">
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Preferred Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} className="compact-input" />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Select Worker (Optional)</label>
        <select name="assignedWorker" value={formData.assignedWorker} onChange={handleChange} className="compact-input">
          <option value="">-- Auto Assign / Any Available --</option>
          {workersList.map((w) => (
            <option key={w._id || w.id} value={w.name}>{w.name} ({w.specialization || 'Worker'})</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Description</label>
        <textarea name="description" rows="3" required value={formData.description} onChange={handleChange} placeholder="Describe your issue..." className="compact-input" style={{ resize: 'none' }}></textarea>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#38bdf8', color: '#0f172a', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {submitting ? 'Submitting...' : <><PlusCircle size={15} /> Submit Ticket</>}
        </button>
      </div>
    </form>
  );
}