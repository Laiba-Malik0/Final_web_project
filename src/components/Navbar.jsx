import React, { useContext } from 'react';
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
    <nav className="sticky top-0 z-50 bg-[#140D0A]/95 backdrop-blur-xl border-b border-[#3A261C] shadow-lg">
      <div className="container mx-auto px-6 py-3.5 flex justify-between items-center">
        
        {/* Logo & Custom Radar Sensor */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#C5A059]/40 animate-ping" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-tr from-[#A68038] to-[#E8C88A] border border-[#FFF3D6] shadow-[0_0_12px_#C5A059]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-serif italic text-2xl font-black tracking-tight text-[#E8D8C8] group-hover:text-white transition">
              Support<span className="text-[#C5A059] not-italic font-sans font-extrabold ml-0.5">Sphere</span>
            </span>
            <span className="text-[#C5A059] font-black text-[9px] uppercase tracking-widest bg-[#C5A059]/15 px-2 py-0.5 rounded-md border border-[#C5A059]/30">
              PORTAL
            </span>
          </div>
        </Link>

        {/* Profile & Actions */}
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs bg-[#0F0A08] border border-[#2B1B13] px-3.5 py-1.5 rounded-full text-[#E8D8C8] font-medium shadow-inner">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>{currentUser.name}</span>
              <span className="bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>

            {(currentUser.role === 'customer' || currentUser.role === 'CUSTOMER') && (
              <Link 
                to="/create-ticket" 
                className="flex items-center gap-2 bg-gradient-to-r from-[#C5A059] to-[#D8B673] hover:opacity-90 text-[#0F0A08] px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-[#C5A059]/10 border border-[#C5A059]/40"
              >
                <PlusCircle className="w-4 h-4" /> New Ticket
              </Link>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 bg-[#0F0A08] hover:bg-red-950/40 border border-[#2B1B13] hover:border-red-500/40 text-[#9E8573] hover:text-red-400 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}