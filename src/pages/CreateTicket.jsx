import { useState, useEffect } from 'react';
import { PlusCircle, Calendar, User, Wrench, Tag, ShieldAlert, FileText, X } from 'lucide-react';
import API from '../api';

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
  const [loadingWorkers, setLoadingWorkers] = useState(true);
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

  // Fetch registered workers from MongoDB
  useEffect(() => {
    let isMounted = true;

    const fetchWorkers = async () => {
      try {
        setLoadingWorkers(true);
        const workersRes = await API.get('/auth/workers');
        const rawWorkers = workersRes.data?.workers || workersRes.data || [];
        
        if (isMounted) {
          const mongoWorkers = Array.isArray(rawWorkers) 
            ? rawWorkers.filter(w => w._id || w.id) 
            : [];
          setWorkersList(mongoWorkers);
        }
      } catch (err) {
        console.error('Error fetching MongoDB workers:', err);
      } finally {
        if (isMounted) setLoadingWorkers(false);
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

  const inputStyles = "w-full bg-[#080a0f] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400 transition-colors";

  return (
    <div className="w-full bg-[#131c26] border border-[#223142] rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100">
      
      {/* Form Header */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 m-0">
            <PlusCircle className="text-sky-400" size={18} /> Create Support Ticket
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 m-0">
            Fill out the form below to register your issue.
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            type="button" 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Username Field */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 font-bold flex items-center gap-1.5">
            <User size={13} className="text-sky-400" /> Customer / Username
          </label>
          <input 
            type="text" 
            value={formData.userName} 
            disabled 
            className={`${inputStyles} bg-slate-900/60 text-slate-400 cursor-not-allowed`} 
          />
        </div>

        {/* Issue Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-300 mb-1 font-bold flex items-center gap-1.5">
              <FileText size={13} className="text-sky-400" /> Issue Title *
            </label>
            <input 
              type="text" 
              name="title" 
              required 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g. Water Leakage" 
              className={inputStyles} 
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-300 mb-1 font-bold flex items-center gap-1.5">
              <Tag size={13} className="text-sky-400" /> Category
            </label>
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              className={`${inputStyles} cursor-pointer`}
            >
              <option value="Plumbing Fix">Plumbing Fix</option>
              <option value="Electrical Issue">Electrical Issue</option>
              <option value="Carpentry">Carpentry</option>
              <option value="General Maintenance">General Maintenance</option>
            </select>
          </div>
        </div>

        {/* Date & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-300 mb-1 font-bold flex items-center gap-1.5">
              <Calendar size={13} className="text-sky-400" /> Scheduled Date *
            </label>
            <input 
              type="date" 
              name="date" 
              required
              value={formData.date} 
              onChange={handleChange} 
              className={inputStyles} 
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-300 mb-1 font-bold flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-sky-400" /> Priority Level
            </label>
            <select 
              name="priority" 
              value={formData.priority} 
              onChange={handleChange} 
              className={`${inputStyles} cursor-pointer`}
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Worker Field (Fetched from MongoDB) */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 font-bold flex items-center gap-1.5">
            <Wrench size={13} className="text-sky-400" /> Assigned Worker
          </label>
          <select 
            name="assignedWorker" 
            value={formData.assignedWorker} 
            onChange={handleChange} 
            disabled={loadingWorkers}
            className={`${inputStyles} cursor-pointer disabled:opacity-50`}
          >
            <option value="">
              {loadingWorkers 
                ? 'Loading workers...' 
                : workersList.length === 0 
                  ? 'No workers available' 
                  : '-- Select Assigned Worker --'}
            </option>
            {workersList.map((w) => (
              <option key={w._id || w.id} value={w._id || w.id}>
                {w.name} ({w.specialization || w.role || 'Technician'})
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 font-bold block">
            Detailed Description *
          </label>
          <textarea 
            name="description" 
            rows="3" 
            required 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Explain the issue details..." 
            className={`${inputStyles} resize-none`}
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-2">
          {onClose && (
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 cursor-pointer font-bold text-xs hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={submitting} 
            className="flex-1 py-2.5 rounded-lg border-0 bg-sky-400 text-slate-950 cursor-pointer font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-sky-300 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Submitting...' : <><PlusCircle size={15} /> Submit Ticket</>}
          </button>
        </div>

      </form>
    </div>
  );
}