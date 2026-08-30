import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LifeBuoy, PlusCircle, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 group-hover:scale-105 transition-transform">
            <LifeBuoy className="w-6 h-6 animate-spin-slow text-indigo-400" />
          </div>
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Support<span className="text-indigo-500">Flow</span>
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-full text-slate-300 font-medium shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{user.name}</span>
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>

            {user.role === 'CUSTOMER' && (
              <Link to="/create-ticket" className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 border border-indigo-400/30">
                <PlusCircle className="w-4 h-4" /> New Ticket
              </Link>
            )}

            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 px-3.5 py-2 rounded-xl text-xs font-semibold transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}