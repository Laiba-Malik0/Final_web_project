import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await API.post('/auth/register', { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password: password.trim(), 
        role 
      });

      const userRole = (data.user?.role || role).toLowerCase().trim();
      login(data.user, data.token);

      if (userRole === 'admin') navigate('/admin-dashboard');
      else if (userRole === 'worker' || userRole === 'agent') navigate('/worker-dashboard');
      else navigate('/customer-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 bg-[#0b1120]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md my-auto"
      >
        <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-violet-400 mb-2">
              <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide">Create Account</h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Join SupportSphere intelligent workspace</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl mb-4 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  required 
                  placeholder="John Doe" 
                  className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-medium" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input 
                  type="email" 
                  required 
                  placeholder="john@example.com" 
                  className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-medium" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-medium" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Role Type</label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <select 
                  className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs appearance-none font-medium cursor-pointer" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="CUSTOMER">Customer (Submit Tickets)</option>
                  <option value="AGENT">Support Agent / Worker</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition border border-indigo-400/30 text-xs uppercase tracking-wider mt-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already registered? <Link to="/login" className="text-indigo-400 font-bold hover:underline">Log in here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}