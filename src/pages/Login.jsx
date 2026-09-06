import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X, Shield, User, Briefcase } from "lucide-react";
import API from "../api/index";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext); // Context Integration

  const [activeRole, setActiveRole] = useState("customer");
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Modal State
  const [otpStep, setOtpStep] = useState(0);
  const [resetData, setResetData] = useState({ email: "", otp: "", newPassword: "" });
  const [modalMsg, setModalMsg] = useState("");

  // Fix 1: Auto Redirect if User is Already Logged In
  useEffect(() => {
    if (user) {
      const role = user.role?.toLowerCase()?.trim();
      if (role === "admin") navigate("/admin-dashboard");
      else if (role === "worker" || role === "agent") navigate("/worker-dashboard");
      else navigate("/customer-dashboard");
    }
  }, [user, navigate]);

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    setError("");

    if (role === "admin") {
      setFormData({ name: "", email: "admin@supportsphere.com", password: "admin123" });
      setIsLogin(true);
    } else {
      setFormData({ name: "", email: "", password: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    try {
      if (isLogin) {
        // Fix 2: Clean Payload Request
        const res = await API.post("/auth/login", { 
          email: cleanEmail, 
          password: cleanPassword,
          role: activeRole 
        });

        const userData = res.data.user || res.data;
        const userToken = res.data.token;

        // Context state update
        login(userData, userToken);

        const userRole = (userData?.role || activeRole).toLowerCase().trim();
        if (userRole === "admin") navigate("/admin-dashboard");
        else if (userRole === "worker" || userRole === "agent") navigate("/worker-dashboard");
        else navigate("/customer-dashboard");
      } else {
        await API.post("/auth/register", {
          name: formData.name.trim(),
          email: cleanEmail,
          password: cleanPassword,
          role: activeRole,
        });

        alert(`${activeRole.toUpperCase()} Account Created Successfully! Please Sign In.`);
        setIsLogin(true);
        setFormData({ name: "", email: cleanEmail, password: "" });
      }
    } catch (err) {
      console.error("Auth error:", err.response);
      setError(err.response?.data?.message || err.response?.data?.error || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setModalMsg("");
    setLoading(true);
    try {
      await API.post("/auth/send-otp", { email: resetData.email.trim().toLowerCase() });
      setOtpStep(2);
    } catch (err) {
      setModalMsg(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setModalMsg("");
    setLoading(true);
    try {
      await API.post("/auth/verify-otp", { 
        email: resetData.email.trim().toLowerCase(), 
        otp: resetData.otp.trim() 
      });
      setOtpStep(3);
    } catch (err) {
      setModalMsg(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setModalMsg("");
    setLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email: resetData.email.trim().toLowerCase(),
        otp: resetData.otp.trim(),
        newPassword: resetData.newPassword.trim(),
      });
      alert("Password updated! Please login with your new password.");
      setOtpStep(0);
      setResetData({ email: "", otp: "", newPassword: "" });
      setIsLogin(true);
    } catch (err) {
      setModalMsg(err.response?.data?.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#0b1120] border border-[#334155] focus:border-[#38bdf8] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#f8fafc] placeholder-[#64748b] outline-none transition-all duration-200 focus:shadow-[0_0_15px_rgba(56,189,248,0.25)] font-medium";

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative font-sans bg-[#0b1120] text-[#f8fafc] p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap');
        .heading-font { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* Ambient Lighting Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#38bdf8]/10 rounded-full blur-[120px] sm:blur-[150px] pointer-events-none -z-10" />

      {/* Main Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[400px] sm:max-w-[440px] bg-[#0f172a]/90 border border-[#1e293b] rounded-2xl sm:rounded-3xl p-5 sm:p-7 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="space-y-4 sm:space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3">
            <div className="bg-white p-2 sm:p-2.5 rounded-xl shadow-[0_4px_12px_rgba(255,255,255,0.15)] flex items-center justify-center shrink-0">
              <Search size={18} className="text-[#0f172a] sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="heading-font text-lg sm:text-xl font-extrabold text-white tracking-wider m-0 leading-none">
                SUPPORT<span className="text-[#38bdf8]">SPHERE</span>
              </h2>
              <span className="text-[9px] sm:text-[10px] text-[#64748b] tracking-[1.2px] uppercase font-bold block mt-1">
                Unified Portal Authentication
              </span>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#0b1120] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-[#1e293b] relative">
            {[
              { id: "customer", label: "Customer", icon: User },
              { id: "worker", label: "Worker", icon: Briefcase },
              { id: "admin", label: "Admin", icon: Shield }
            ].map((tab) => {
              const isActive = activeRole === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleRoleSwitch(tab.id)}
                  className="relative py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all z-10 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer select-none"
                >
                  <Icon size={12} className={`relative z-20 transition-colors sm:w-3.5 sm:h-3.5 ${isActive ? "text-[#0f172a]" : "text-[#64748b]"}`} />
                  <span
                    className={`relative z-20 transition-colors ${
                      isActive ? "text-[#0f172a]" : "text-[#94a3b8]"
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-white rounded-lg sm:rounded-xl shadow-[0_0_12px_rgba(255,255,255,0.3)] z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Title & Context */}
          <div className="text-center space-y-0.5 sm:space-y-1">
            <h2 className="heading-font text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isLogin ? "Welcome Back" : `Register ${activeRole.toUpperCase()}`}
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8] font-medium">
              Accessing <span className="text-[#38bdf8] font-bold uppercase">{activeRole}</span> Portal
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 sm:p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-semibold leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          {/* Dynamic Form Area */}
          <AnimatePresence mode="wait">
            <motion.form
              key={activeRole + (isLogin ? "login" : "reg")}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleSubmit}
              autoComplete="off"
              className="space-y-3 sm:space-y-4"
            >
              {!isLogin && activeRole !== "admin" && (
                <div>
                  <label className="text-[10px] sm:text-[11px] uppercase font-bold text-[#cbd5e1] tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className={inputStyle}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] sm:text-[11px] uppercase font-bold text-[#cbd5e1] tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address..."
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] uppercase font-bold text-[#cbd5e1] tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className={inputStyle}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="heading-font w-full py-3 sm:py-3.5 mt-1 bg-white hover:bg-slate-100 text-[#0f172a] font-extrabold rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    {isLogin ? `Sign In as ${activeRole}` : `Register as ${activeRole}`} <ArrowRight size={15} />
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Footer Switches */}
        <div className="flex justify-between items-center pt-3 sm:pt-4 mt-5 sm:mt-6 border-t border-[#1e293b] text-xs text-[#94a3b8]">
          {activeRole !== "admin" ? (
            <button 
              type="button"
              onClick={() => {
                setModalMsg("");
                setOtpStep(1);
              }} 
              className="hover:text-[#38bdf8] transition cursor-pointer font-medium text-[11px] sm:text-xs"
            >
              Forgot Password?
            </button>
          ) : (
            <span />
          )}

          {activeRole !== "admin" && (
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)} 
              className="hover:text-[#38bdf8] font-bold transition cursor-pointer text-[11px] sm:text-xs"
            >
              {isLogin ? "Register →" : "Sign In →"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Forgot Password Modal Overlay */}
      <AnimatePresence>
        {otpStep > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b1120]/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 10 }}
              className="bg-[#1e293b] border border-[#334155] w-full max-w-[360px] sm:max-w-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative space-y-4 shadow-2xl text-[#f8fafc]"
            >
              <button
                type="button"
                onClick={() => setOtpStep(0)}
                className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#f8fafc] transition cursor-pointer p-1 rounded-lg"
              >
                <X size={18} />
              </button>

              {modalMsg && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium leading-relaxed">
                  {modalMsg}
                </div>
              )}

              {otpStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-3" autoComplete="off">
                  <h3 className="heading-font text-base sm:text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-[#94a3b8]">Enter email address to receive OTP code.</p>
                  <input
                    type="email"
                    required
                    value={resetData.email}
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                    placeholder="Enter email address..."
                    className={inputStyle}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="heading-font w-full py-2.5 sm:py-3 bg-white text-[#0f172a] font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              )}

              {otpStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-3" autoComplete="off">
                  <h3 className="heading-font text-base sm:text-lg font-bold text-white">Enter OTP Code</h3>
                  <p className="text-xs text-[#94a3b8]">Code sent to {resetData.email}</p>
                  <input
                    type="text"
                    required
                    value={resetData.otp}
                    onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
                    placeholder="6-Digit OTP"
                    className={`${inputStyle} text-center tracking-widest text-sm font-bold`}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="heading-font w-full py-2.5 sm:py-3 bg-white text-[#0f172a] font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              )}

              {otpStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-3" autoComplete="off">
                  <h3 className="heading-font text-base sm:text-lg font-bold text-white">Set New Password</h3>
                  <input
                    type="password"
                    required
                    value={resetData.newPassword}
                    onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className={inputStyle}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="heading-font w-full py-2.5 sm:py-3 bg-white text-[#0f172a] font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition disabled:opacity-60"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Login;