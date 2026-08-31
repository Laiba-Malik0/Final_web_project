import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/index";

function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("customer");
  const [isLogin, setIsLogin] = useState(true);

  // Form values initialised completely empty
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Modal State
  const [otpStep, setOtpStep] = useState(0);
  const [resetData, setResetData] = useState({ email: "", otp: "", newPassword: "" });
  const [modalMsg, setModalMsg] = useState("");

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    setError("");
    // Clear inputs when switching roles
    setFormData({ name: "", email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: cleanEmail, password: cleanPassword }
        : { name: formData.name.trim(), email: cleanEmail, password: cleanPassword, role: activeRole };

      const res = await API.post(endpoint, payload);

      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const userRole = res.data.user?.role || activeRole;
        if (userRole === "admin") navigate("/admin-dashboard");
        else if (userRole === "worker") navigate("/worker-dashboard");
        else navigate("/customer-dashboard");
      } else {
        setIsLogin(true);
        alert(`${activeRole.toUpperCase()} account created! Please Sign In.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed.");
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
    } catch (err) {
      setModalMsg(err.response?.data?.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#0F0A08] border border-[#2B1B13] focus:border-[#C5A059] rounded-xl px-4 py-3 text-sm text-[#E8D8C8] placeholder-[#543E31] outline-none transition duration-200 focus:shadow-[0_0_15px_rgba(197,160,89,0.35)]";

  return (
    <div className="min-h-[88vh] flex items-center justify-center relative font-sans bg-[#0F0A08] -m-6 p-6">
      {/* Background Glow */}
      <div className="absolute w-80 h-96 bg-[#C5A059]/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[370px] min-h-[520px] bg-[#18100C]/95 border border-[#3A261C] rounded-3xl p-7 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="space-y-6">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#0F0A08] p-1.5 rounded-2xl border border-[#2B1B13] relative">
            {["customer", "worker", "admin"].map((tab) => {
              const isActive = activeRole === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleRoleSwitch(tab)}
                  className="relative py-2.5 text-xs font-black uppercase tracking-wider transition-all z-10 flex items-center justify-center"
                >
                  <span
                    className={`relative z-20 transition-colors ${
                      isActive ? "text-[#0F0A08]" : "text-[#9E8573]"
                    }`}
                  >
                    {tab}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-gradient-to-r from-[#C5A059] to-[#E3C896] rounded-xl shadow-[0_0_15px_rgba(197,160,89,0.4)] z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#E8D8C8] tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs sm:text-sm text-[#9E8573] font-medium">
              Accessing <span className="text-[#C5A059] font-bold uppercase">{activeRole}</span> Portal
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
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
              {/* Fake hidden inputs to prevent browser autofill */}
              <input type="text" name="fakeusernameremembered" style={{ display: "none" }} tabIndex={-1} />
              <input type="password" name="fakepasswordremembered" style={{ display: "none" }} tabIndex={-1} />

              {!isLogin && activeRole !== "admin" && (
                <div>
                  <label className="text-[11px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="user_full_name_no_autofill"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className={inputStyle}
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="new-password"
                  name="user_email_no_autofill"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={activeRole === "admin" ? "admin@supportflow.com" : "enter your email..."}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  name="user_pass_no_autofill"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={activeRole === "admin" ? "admin123" : "••••••••••••"}
                  className={inputStyle}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#C5A059] to-[#D8B673] text-[#0F0A08] font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest shadow-lg transition"
              >
                {loading ? "Authenticating..." : isLogin ? `Sign In as ${activeRole}` : `Register ${activeRole}`}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 mt-4 border-t border-[#2B1B13] text-xs sm:text-sm text-[#9E8573]">
          {activeRole !== "admin" ? (
            <button onClick={() => setOtpStep(1)} className="hover:text-[#C5A059] transition">
              Forgot Password?
            </button>
          ) : (
            <span />
          )}

          {activeRole !== "admin" && (
            <button onClick={() => setIsLogin(!isLogin)} className="hover:text-[#C5A059] font-bold transition">
              {isLogin ? "Register →" : "Sign In →"}
            </button>
          )}
        </div>
      </motion.div>

      {/* OTP Modals */}
      <AnimatePresence>
        {otpStep > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#080504]/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-[#18100C] border border-[#3A261C] w-full max-w-sm rounded-3xl p-6 relative space-y-4 shadow-2xl"
            >
              <button
                onClick={() => setOtpStep(0)}
                className="absolute top-4 right-4 text-[#9E8573] hover:text-[#E8D8C8] transition"
              >
                ✕
              </button>

              {modalMsg && (
                <div className="p-2 bg-red-950/40 text-red-300 text-xs rounded-xl text-center">{modalMsg}</div>
              )}

              {otpStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-3" autoComplete="off">
                  <h3 className="text-lg font-bold text-[#E8D8C8]">Reset Password</h3>
                  <p className="text-xs text-[#9E8573]">Enter email to receive OTP code.</p>
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
                    className="w-full py-3 bg-[#C5A059] text-[#0F0A08] font-bold rounded-xl text-xs uppercase tracking-wider"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              )}

              {otpStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-3" autoComplete="off">
                  <h3 className="text-lg font-bold text-[#E8D8C8]">Enter Verification OTP</h3>
                  <p className="text-xs text-[#9E8573]">Check inbox for code sent to {resetData.email}</p>
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
                    className="w-full py-3 bg-[#C5A059] text-[#0F0A08] font-bold rounded-xl text-xs uppercase tracking-wider"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              )}

              {otpStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-3" autoComplete="off">
                  <h3 className="text-lg font-bold text-[#E8D8C8]">New Password</h3>
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
                    className="w-full py-3 bg-[#C5A059] text-[#0F0A08] font-bold rounded-xl text-xs uppercase tracking-wider"
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