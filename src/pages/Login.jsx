import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X } from "lucide-react";
import API from "../api/index";

function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("customer");
  const [isLogin, setIsLogin] = useState(true);

  // Customer aur Worker empty rahenge, Admin ke default pre-fill honge
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Modal (Forgot Password only)
  const [otpStep, setOtpStep] = useState(0);
  const [resetData, setResetData] = useState({ email: "", otp: "", newPassword: "" });
  const [modalMsg, setModalMsg] = useState("");

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    setError("");

    // Admin tab click hote hi pre-fill credentials set honge
    if (role === "admin") {
      setFormData({ name: "", email: "admin@supportsphere.com", password: "admin123" });
      setIsLogin(true); // Admin sirf Login kar sakta hai
    } else {
      // Customer aur Worker default blank rahenge
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
        // --- LOGIN FLOW (role payload ke saath) ---
        const res = await API.post("/auth/login", { 
          email: cleanEmail, 
          password: cleanPassword,
          role: activeRole 
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const userRole = res.data.user?.role || activeRole;
        if (userRole === "admin") navigate("/admin-dashboard");
        else if (userRole === "worker") navigate("/worker-dashboard");
        else navigate("/customer-dashboard");
      } else {
        // --- SIGNUP FLOW ---
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
      setError(err.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD OTP HANDLERS ---
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
      await API.post("/auth/verify-otp", { email: resetData.email.trim().toLowerCase(), otp: resetData.otp.trim() });
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
    "w-full bg-[#0b1120] border border-[#334155] focus:border-[#38bdf8] rounded-xl px-4 py-3 text-sm text-[#f8fafc] placeholder-[#64748b] outline-none transition duration-200 focus:shadow-[0_0_15px_rgba(56,189,248,0.2)] font-medium";

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans bg-[#0b1120] text-[#f8fafc] p-4 sm:p-6 overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap');
        .heading-font { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* Ambient Glow */}
      <div className="absolute w-[450px] h-[450px] bg-[#38bdf8]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-[#0f172a]/95 border border-[#1e293b] rounded-3xl p-7 sm:p-8 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white p-2.5 rounded-xl shadow-[0_4px_12px_rgba(255,255,255,0.15)] flex items-center justify-center">
              <Search size={20} className="text-[#0f172a]" />
            </div>
            <div>
              <h2 className="heading-font text-xl font-extrabold text-white tracking-wider m-0 leading-none">
                SUPPORT<span className="text-[#38bdf8]">SPHERE</span>
              </h2>
              <span className="text-[10px] text-[#64748b] tracking-[1.5px] uppercase font-bold block mt-1">
                Unified Portal Authentication
              </span>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#0b1120] p-1.5 rounded-2xl border border-[#1e293b] relative">
            {["customer", "worker", "admin"].map((tab) => {
              const isActive = activeRole === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleRoleSwitch(tab)}
                  className="relative py-2.5 text-xs font-black uppercase tracking-wider transition-all z-10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span
                    className={`relative z-20 transition-colors ${
                      isActive ? "text-[#0f172a]" : "text-[#94a3b8]"
                    }`}
                  >
                    {tab}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-white rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Subheading */}
          <div className="text-center space-y-1">
            <h2 className="heading-font text-2xl font-extrabold text-white tracking-tight">
              {isLogin ? "Welcome Back" : `Register ${activeRole.toUpperCase()}`}
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8] font-medium">
              Accessing <span className="text-[#38bdf8] font-bold uppercase">{activeRole}</span> Portal
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-semibold"
            >
              {error}
            </motion.div>
          )}

          {/* Form Fields */}
          <AnimatePresence mode="wait">
            <motion.form
              key={activeRole + (isLogin ? "login" : "reg")}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              autoComplete="off"
              className="space-y-4"
            >
              {!isLogin && activeRole !== "admin" && (
                <div>
                  <label className="text-[11px] uppercase font-bold text-[#cbd5e1] tracking-wider block mb-1.5">
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
                <label className="text-[11px] uppercase font-bold text-[#cbd5e1] tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="enter email..."
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#cbd5e1] tracking-wider block mb-1.5">
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="heading-font w-full py-3.5 mt-2 bg-white hover:bg-slate-100 text-[#0f172a] font-extrabold rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    {isLogin ? `Sign In as ${activeRole}` : `Register as ${activeRole}`} <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Footer Links */}
        <div className="flex justify-between items-center pt-4 mt-6 border-t border-[#1e293b] text-xs sm:text-sm text-[#94a3b8]">
          {activeRole !== "admin" ? (
            <button onClick={() => setOtpStep(1)} className="hover:text-[#38bdf8] transition cursor-pointer font-medium">
              Forgot Password?
            </button>
          ) : (
            <span />
          )}

          {activeRole !== "admin" && (
            <button onClick={() => setIsLogin(!isLogin)} className="hover:text-[#38bdf8] font-bold transition cursor-pointer">
              {isLogin ? "Register →" : "Sign In →"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Forgot Password OTP Modals */}
      <AnimatePresence>
        {otpStep > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b1120]/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-[#1e293b] border border-[#334155] w-full max-w-sm rounded-3xl p-6 relative space-y-4 shadow-2xl text-[#f8fafc]"
            >
              <button
                onClick={() => setOtpStep(0)}
                className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#f8fafc] transition cursor-pointer p-1"
              >
                <X size={18} />
              </button>

              {modalMsg && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
                  {modalMsg}
                </div>
              )}

              {otpStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-3" autoComplete="off">
                  <h3 className="heading-font text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-[#94a3b8]">Enter email to receive OTP code.</p>
                  <input
                    type="email"
                    required
                    value={resetData.email}
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                    placeholder="Enter email..."
                    className={inputStyle}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="heading-font w-full py-3 bg-white text-[#0f172a] font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              )}

              {otpStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-3" autoComplete="off">
                  <h3 className="heading-font text-lg font-bold text-white">Enter Verification OTP</h3>
                  <p className="text-xs text-[#94a3b8]">Check inbox for code sent to {resetData.email}</p>
                  <input
                    type="text"
                    required
                    value={resetData.otp}
                    onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
                    placeholder="6-Digit OTP"
                    className={`${inputStyle} text-center tracking-widest`}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="heading-font w-full py-3 bg-white text-[#0f172a] font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              )}

              {otpStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-3" autoComplete="off">
                  <h3 className="heading-font text-lg font-bold text-white">New Password</h3>
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
                    className="heading-font w-full py-3 bg-white text-[#0f172a] font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
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