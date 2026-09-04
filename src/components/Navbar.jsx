import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, PlusCircle, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0b1120]/95 backdrop-blur-xl border-b border-[#1e293b] shadow-lg text-[#f8fafc]">
      <div className="container mx-auto px-6 py-3.5 flex justify-between items-center">
        
        {/* Logo & Custom Radar Sensor */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#38bdf8]/40 animate-ping" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] border border-white shadow-[0_0_12px_#38bdf8]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-wider text-white group-hover:text-[#38bdf8] transition font-sans">
              SUPPORT<span className="text-[#38bdf8]">SPHERE</span>
            </span>
            <span className="text-[#38bdf8] font-black text-[9px] uppercase tracking-widest bg-[#38bdf8]/10 px-2 py-0.5 rounded-md border border-[#38bdf8]/30">
              PORTAL
            </span>
          </div>
        </Link>

        {/* Profile & Actions */}
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs bg-[#0f172a] border border-[#334155] px-3.5 py-1.5 rounded-full text-[#f8fafc] font-medium shadow-inner">
              <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
              <span>{currentUser.name}</span>
              <span className="bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>

            {(currentUser.role?.toLowerCase() === 'customer') && (
              <Link 
                to="/create-ticket" 
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-[#0f172a] px-4 py-2 rounded-xl text-xs font-bold transition shadow-md border border-slate-200"
              >
                <PlusCircle className="w-4 h-4" /> New Ticket
              </Link>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 bg-[#0f172a] hover:bg-red-950/40 border border-[#334155] hover:border-red-500/40 text-[#94a3b8] hover:text-red-400 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}