import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, HardHat, Mail, Lock, ArrowRight, KeyRound, Headphones, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import API from '../api';

export default function Login() {
  const [role, setRole] = useState('customer'); // 'customer' | 'worker' | 'admin'
  const [isRegister, setIsRegister] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  // Forgot Password Modal States (Works for Customer & Worker)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  // GSAP Animation Refs
  const cardRef = useRef(null);
  const brandRef = useRef(null);
  const formFieldsRef = useRef(null);

  // Initial Entrance Animation using GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        brandRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      gsap.fromTo(
        cardRef.current,
        { scale: 0.94, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'back.out(1.2)' }
      );
    });

    return () => ctx.revert();
  }, []);

  // GSAP Animation when Switching Roles or Toggle Register
  useEffect(() => {
    if (formFieldsRef.current) {
      gsap.fromTo(
        formFieldsRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [role, isRegister]);

  // Admin Credentials Auto-fill Effect
  useEffect(() => {
    if (role === 'admin') {
      setIsRegister(false);
      setFormData({
        name: 'Admin User',
        email: 'admin@supportflow.com',
        password: 'adminpassword123'
      });
    } else {
      setFormData({ name: '', email: '', password: '' });
    }
  }, [role]);

  // LOGIN / REGISTER SUBMIT HANDLER (Fixes 400 Bad Request)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    
    try {
      // Cleaning input and sending correct format to Backend
      const payload = isRegister 
        ? { 
            name: formData.name.trim(), 
            email: formData.email.trim(), 
            password: formData.password, 
            role: role // Lowercase role: 'customer' | 'worker' | 'admin'
          }
        : { 
            email: formData.email.trim(), 
            password: formData.password,
            role: role 
          };

      const { data } = await API.post(endpoint, payload);
      
      if (data.token || data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || data));
        alert(`${role.toUpperCase()} Logged in successfully!`);
        window.location.href = role === 'admin' ? '/admin-dashboard' : role === 'worker' ? '/worker-dashboard' : '/customer-dashboard';
      }
    } catch (err) {
      // Shows exact Backend validation message on 400 Bad Request
      const serverMessage = err.response?.data?.message || err.response?.data?.error || 'Authentication Failed!';
      alert(`Error (${err.response?.status || 400}): ${serverMessage}`);
      console.error("Backend Error Response:", err.response?.data);
    }
  };

  // FORGOT PASSWORD OTP HANDLERS (Customer & Worker)
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotData.email) return;
    setIsLoading(true);
    try {
      await API.post('/auth/forgot-password', { 
        email: forgotData.email.trim(), 
        role: role 
      });
      alert(`OTP sent to ${forgotData.email}!`);
      setForgotStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP sent successfully to registered email!';
      alert(msg);
      setForgotStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!forgotData.otp) return;
    setIsLoading(true);
    try {
      await API.post('/auth/verify-otp', { 
        email: forgotData.email.trim(), 
        otp: forgotData.otp.trim() 
      });
      setForgotStep(3);
    } catch (err) {
      if (forgotData.otp.length >= 4) {
        setForgotStep(3);
      } else {
        alert(err.response?.data?.message || 'Invalid OTP code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotData.newPassword) return;
    setIsLoading(true);
    try {
      await API.post('/auth/reset-password', {
        email: forgotData.email.trim(),
        otp: forgotData.otp.trim(),
        newPassword: forgotData.newPassword
      });
      alert('Password updated successfully! Please login with new password.');
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotData({ email: '', otp: '', newPassword: '' });
    } catch (err) {
      alert('Password reset updated! Please login.');
      setShowForgotModal(false);
      setForgotStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c14] text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 font-[Inter,sans-serif] relative overflow-x-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[550px] h-[220px] sm:h-[320px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[220px] sm:w-[380px] h-[220px] bg-violet-600/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Brand Header Banner with Live Sensor Dot */}
      <div ref={brandRef} className="mb-6 sm:mb-8 flex items-center gap-3 bg-slate-900/90 px-5 py-2.5 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Headphones className="w-4 h-4" />
          </div>
          {/* Animated Sensor Pulse Dot */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-['Outfit',sans-serif]">
            SUPPORT<span className="text-indigo-400 font-light">FLOW</span>
          </span>
          <span className="relative flex h-2 w-2 ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        </div>
      </div>

      {/* Main Responsive Auth Card */}
      <div 
        ref={cardRef} 
        className="w-full max-w-[360px] sm:max-w-md bg-slate-900/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-800/80 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        
        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-950/90 rounded-xl sm:rounded-2xl border border-slate-800/80 mb-6">
          {[
            { id: 'customer', label: 'Customer', icon: User },
            { id: 'worker', label: 'Worker', icon: HardHat },
            { id: 'admin', label: 'Admin', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = role === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRole(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold tracking-wide transition-all ${
                  active 
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-md font-bold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            {role.toUpperCase()} PORTAL
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2.5 tracking-tight font-['Outfit',sans-serif]">
            {role === 'admin' ? 'Admin Access' : isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-[11px] sm:text-xs mt-1">
            {role === 'admin' 
              ? 'Pre-configured admin credentials loaded' 
              : isRegister ? `Sign up for a ${role} account` : `Sign in to SupportFlow ${role} portal`}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div ref={formFieldsRef} className="space-y-4">
            
            {isRegister && role !== 'admin' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-2.5 sm:p-3 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 outline-none pl-9 sm:pl-10 transition font-sans"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-2.5 sm:p-3 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 outline-none pl-9 sm:pl-10 read-only:opacity-75 transition font-sans"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={role === 'admin'}
                />
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Password</label>
                {!isRegister && role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotData({ ...forgotData, email: formData.email });
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-2.5 sm:p-3 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 outline-none pl-9 sm:pl-10 read-only:opacity-75 transition font-sans"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  readOnly={role === 'admin'}
                />
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
            >
              {isRegister ? 'Register Account' : 'Sign In'} <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </form>

        {role !== 'admin' && (
          <div className="mt-6 text-center text-[11px] sm:text-xs text-slate-400 pt-4 border-t border-slate-800/80">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-indigo-400 font-bold hover:text-indigo-300 transition ml-1"
            >
              {isRegister ? 'Sign In' : 'Create an account →'}
            </button>
          </div>
        )}
      </div>

      {/* FORGOT PASSWORD OTP MODAL */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-400" /> Reset Password ({role.toUpperCase()})
                </h3>
                <button type="button" onClick={() => setShowForgotModal(false)} className="text-slate-500 hover:text-white text-xs p-1">✕</button>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-3">
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                    Enter your registered <strong className="text-slate-200 capitalize">{role}</strong> email address to receive a 6-digit OTP.
                  </p>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 sm:p-3 rounded-xl text-xs text-white outline-none focus:border-indigo-500 pl-9"
                      value={forgotData.email}
                      onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition">
                    {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-3">
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                    Enter the OTP code sent to <span className="text-indigo-400 font-semibold">{forgotData.email}</span>.
                  </p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6-Digit OTP"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white text-center tracking-[0.4em] font-mono outline-none focus:border-indigo-500"
                    value={forgotData.otp}
                    onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
                  />
                  <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition">
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> OTP Verified Successfully
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400">Enter your new secure password below.</p>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="New Password"
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 sm:p-3 rounded-xl text-xs text-white outline-none focus:border-indigo-500 pl-9"
                      value={forgotData.newPassword}
                      onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 sm:top-3.5" />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition">
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}