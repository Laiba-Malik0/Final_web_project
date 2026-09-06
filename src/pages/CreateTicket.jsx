import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle } from 'lucide-react';

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
      } catch (e) { /* empty */ }
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
    assignedWorker: '', // Worker ID hold karega
    description: ''
  });

  useEffect(() => {
    let isMounted = true;

    const fetchWorkers = async () => {
      try {
        const workersRes = await API.get('/auth/workers');
        const rawWorkers = workersRes.data?.workers || workersRes.data || [];
        if (isMounted) {
          setWorkersList(Array.isArray(rawWorkers) ? rawWorkers : []);
        }
      } catch (err) {
        console.error('Error fetching workers:', err);
      }
    };

    fetchWorkers();

    return () => {
      isMounted = false;
    };
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

  const inputStyles = "w-full bg-[#080a0f] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className="text-[11px] text-slate-400 block mb-1 font-bold">Customer Name</label>
        <input 
          type="text" 
          value={formData.userName} 
          disabled 
          className={`${inputStyles} bg-slate-900/50 text-slate-400 cursor-not-allowed`} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-bold">Issue Title</label>
          <input 
            type="text" 
            name="title" 
            required 
            value={formData.title} 
            onChange={handleChange} 
            placeholder="e.g. Pipe Leakage" 
            className={inputStyles} 
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-bold">Category</label>
          <select 
            name="category" 
            value={formData.category} 
            onChange={handleChange} 
            className={inputStyles}
          >
            <option value="Plumbing Fix">Plumbing Fix</option>
            <option value="Electrical Issue">Electrical Issue</option>
            <option value="Carpentry">Carpentry</option>
            <option value="General Maintenance">General Maintenance</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-bold">Priority</label>
          <select 
            name="priority" 
            value={formData.priority} 
            onChange={handleChange} 
            className={inputStyles}
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-bold">Preferred Date</label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
            className={inputStyles} 
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] text-slate-400 block mb-1 font-bold">Select Worker (Optional)</label>
        <select 
          name="assignedWorker" 
          value={formData.assignedWorker} 
          onChange={handleChange} 
          className={inputStyles}
        >
          <option value="">-- Auto Assign / Any Available --</option>
          {workersList.map((w) => (
            <option key={w._id || w.id} value={w._id || w.id}>
              {w.name} ({w.specialization || 'Worker'})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[11px] text-slate-400 block mb-1 font-bold">Description</label>
        <textarea 
          name="description" 
          rows="3" 
          required 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Describe your issue..." 
          className={`${inputStyles} resize-none`}
        ></textarea>
      </div>

      <div className="flex gap-2.5 mt-2">
        <button 
          type="button" 
          onClick={onClose} 
          className="flex-1 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white cursor-pointer font-semibold text-xs hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={submitting} 
          className="flex-1 py-2.5 rounded-lg border-0 bg-sky-400 text-slate-950 cursor-pointer font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-sky-300 disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Submitting...' : <><PlusCircle size={15} /> Submit Ticket</>}
        </button>
      </div>
    </form>
  );
}