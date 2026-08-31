import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import API from "../api/index";

function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [workers, setWorkers] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form State (Create & Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState(null); // Track if Editing
  const [formData, setFormData] = useState({
    title: "",
    category: "Electrical",
    priority: "Normal",
    description: "",
    assignedWorker: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const modalRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      navigate("/");
    } else {
      setUser(userData);
      fetchWorkers();
      fetchMyTickets();
    }
  }, []);

  // GSAP Modal Animation
  useEffect(() => {
    if (showForm && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.85, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" }
      );
    }
  }, [showForm]);

  // Toast Auto Hide
  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => setMsg({ type: "", text: "" }), 3500);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const fetchWorkers = async () => {
    try {
      const res = await API.get("/auth/workers");
      setWorkers(res.data || []);
      if (res.data?.length > 0 && !editingTicketId) {
        setFormData((prev) => ({ ...prev, assignedWorker: res.data[0]._id }));
      }
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  const fetchMyTickets = async () => {
    try {
      const res = await API.get("/tickets/customer-tickets");
      setMyTickets(res.data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Open Form for Creating New Ticket
  const handleOpenCreateForm = () => {
    setEditingTicketId(null);
    setFormData({
      title: "",
      category: "Electrical",
      priority: "Normal",
      description: "",
      assignedWorker: workers[0]?._id || "",
    });
    setShowForm(true);
  };

  // Open Form for Editing Existing Ticket
  const handleOpenEditForm = (ticket) => {
    setEditingTicketId(ticket._id);
    setFormData({
      title: ticket.title || "",
      category: ticket.category || "Electrical",
      priority: ticket.priority || "Normal",
      description: ticket.description || "",
      assignedWorker: ticket.assignedWorker?._id || ticket.assignedWorker || "",
    });
    setShowForm(true);
  };

  // Delete Ticket Handler
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    try {
      await API.delete(`/tickets/${ticketId}`);
      setMsg({ type: "success", text: "Ticket deleted successfully!" });
      setMyTickets((prev) => prev.filter((t) => t._id !== ticketId));
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to delete ticket",
      });
    }
  };

  // Submit Form (Handles Create & Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      if (editingTicketId) {
        // UPDATE TICKET
        const res = await API.put(`/tickets/${editingTicketId}`, formData);
        if (res.status === 200) {
          setMsg({ type: "success", text: "Ticket updated successfully!" });
        }
      } else {
        // CREATE TICKET
        const res = await API.post("/tickets/create", formData);
        if (res.status === 201 || res.status === 200) {
          setMsg({ type: "success", text: "Ticket submitted successfully!" });
        }
      }
      setShowForm(false);
      fetchMyTickets();
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Operation failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          sensor: "bg-emerald-500 shadow-[0_0_8px_#10B981]",
        };
      case "in progress":
      case "accepted":
        return {
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
          sensor: "bg-sky-500 shadow-[0_0_8px_#0EA5E9]",
        };
      case "rejected":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          sensor: "bg-rose-500 shadow-[0_0_8px_#F43F5E]",
        };
      default:
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          sensor: "bg-amber-500 shadow-[0_0_8px_#F59E0B] animate-pulse",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0706] text-[#E8D8C8] flex font-sans overflow-hidden">
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 bg-[#140D0A] border border-[#2C1C14] text-[#C5A059] rounded-xl text-xl shadow-lg"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ---------------- LEFT SIDEBAR ---------------- */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#140D0A] border-r border-[#2C1C14] p-6 flex flex-col justify-between z-40 transition-transform duration-300 md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-8">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C5A059] to-[#E3C896] text-[#0F0A08] flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(197,160,89,0.3)]">
              S
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-wider text-[#E8D8C8]">SUPPORT</h2>
              <p className="text-[10px] text-[#C5A059] tracking-widest font-bold">PORTAL</p>
            </div>
          </div>

          <div className="bg-[#0D0806] p-3.5 rounded-xl border border-[#23150E] flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] flex items-center justify-center font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-xs text-[#E8D8C8] truncate">{user?.name || "Customer"}</h4>
              <span className="text-[9px] uppercase font-bold tracking-wider text-[#C5A059]">
                {user?.role || "Customer"}
              </span>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: "home", label: "Dashboard Home", icon: "🏠" },
              { id: "my-complaints", label: "My Complaints", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative w-full text-left px-4 py-3 rounded-xl font-medium text-xs uppercase tracking-wider transition duration-200 flex items-center space-x-3 ${
                  activeTab === tab.id ? "text-[#0F0A08] font-bold" : "text-[#9E8573] hover:text-[#E8D8C8]"
                }`}
              >
                <span className="relative z-20 text-sm">{tab.icon}</span>
                <span className="relative z-20">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#C5A059] to-[#D8B673] rounded-xl z-10 shadow-[0_0_15px_rgba(197,160,89,0.35)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-red-900/30 hover:border-red-500/40 transition"
        >
          Logout
        </button>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 md:ml-64 h-screen overflow-y-auto p-6 sm:p-10 relative">
        <AnimatePresence>
          {msg.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`max-w-md mx-auto mb-6 p-3.5 rounded-xl border text-xs font-semibold text-center shadow-lg ${
                msg.type === "error"
                  ? "bg-red-500/10 border-red-500/40 text-red-300"
                  : "bg-[#C5A059]/10 border-[#C5A059]/40 text-[#E3C896]"
              }`}
            >
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* TAB 1: HOME */}
          {activeTab === "home" && (
            <motion.div
              key="homeTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              <div className="relative rounded-2xl p-6 sm:p-10 border border-[#3A261C] bg-gradient-to-br from-[#1A100B] via-[#140D0A] to-[#0A0706] shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#C5A059] px-2.5 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20">
                    Customer Service Center
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-[#E8D8C8] tracking-tight">
                    Welcome Back, <span className="text-[#C5A059]">{user?.name || "Customer"}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#9E8573] max-w-xl leading-relaxed">
                    Easily submit maintenance issues, edit tickets, delete outdated requests, and track status updates.
                  </p>
                </div>
              </div>

              <div className="bg-[#140D0A] border border-[#2C1C14] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-[#E8D8C8]">Facing an issue at your site?</h3>
                <p className="text-xs text-[#9E8573] max-w-md mx-auto">
                  Click below to generate a new support request or manage existing tickets.
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleOpenCreateForm}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#C5A059] to-[#D8B673] text-[#0F0A08] font-extrabold rounded-xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(197,160,89,0.3)] transition"
                >
                  Register New Complaint
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: MY COMPLAINTS */}
          {activeTab === "my-complaints" && (
            <motion.div
              key="complaintsTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-5 max-w-5xl mx-auto"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg font-bold text-[#E8D8C8]">My Complaints History</h2>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleOpenCreateForm}
                  className="px-4 py-2 bg-gradient-to-r from-[#C5A059] to-[#D8B673] text-[#0F0A08] font-bold rounded-lg text-xs uppercase tracking-wider shadow"
                >
                  + New Ticket
                </motion.button>
              </div>

              {myTickets.length === 0 ? (
                <div className="p-10 bg-[#140D0A] border border-[#2C1C14] rounded-2xl text-center text-[#9E8573] text-xs">
                  No active tickets found. Click "+ New Ticket" to create one.
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {myTickets.map((ticket, index) => {
                    const style = getStatusStyle(ticket.status);
                    return (
                      <motion.div
                        key={ticket._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -3 }}
                        className="bg-[#140D0A] border border-[#2C1C14] p-5 rounded-2xl space-y-4 shadow-lg hover:border-[#C5A059]/30 transition relative flex flex-col justify-between"
                      >
                        <div>
                          {/* Header badges */}
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/20">
                              {ticket.category}
                            </span>

                            {/* Status Tag */}
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${style.bg} text-[11px] font-bold capitalize`}>
                              <span className={`w-2 h-2 rounded-full ${style.sensor}`} />
                              <span>{ticket.status || "Pending"}</span>
                            </div>
                          </div>

                          <h4 className="font-bold text-sm text-[#E8D8C8]">{ticket.title}</h4>
                          <p className="text-xs text-[#9E8573] leading-relaxed line-clamp-2 mt-1">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Card Bottom Details & Action Buttons */}
                        <div className="pt-3 border-t border-[#23150E] space-y-3">
                          <div className="text-[10px] text-[#7A6253] flex justify-between items-center">
                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            <span>Worker: {ticket.assignedWorker?.name || "Assigned"}</span>
                          </div>

                          {/* EDIT & DELETE BUTTONS */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenEditForm(ticket)}
                              className="flex-1 py-1.5 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#C5A059] rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1"
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket._id)}
                              className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ---------------- CREATE / EDIT FORM MODAL ---------------- */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div
              ref={modalRef}
              className="bg-[#140D0A] border border-[#3A261C] w-full max-w-md rounded-2xl p-6 relative space-y-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] my-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-[#23150E] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] shadow-[0_0_8px_#C5A059]" />
                  <h3 className="text-sm sm:text-base font-bold text-[#E8D8C8]">
                    {editingTicketId ? "Edit Ticket Details" : "Generate Support Ticket"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-7 h-7 rounded-lg bg-[#0D0806] text-[#9E8573] hover:text-[#E8D8C8] flex items-center justify-center font-bold text-sm transition"
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name || ""}
                    className="w-full bg-[#0D0806] border border-[#23150E] rounded-xl px-3.5 py-2.5 text-xs text-[#9E8573] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Switchboard Issue"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0D0806] border border-[#23150E] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs text-[#E8D8C8] outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#0D0806] border border-[#23150E] focus:border-[#C5A059] rounded-xl px-3 py-2.5 text-xs text-[#E8D8C8] outline-none transition"
                    >
                      <option value="Electrical">Electrical Work</option>
                      <option value="Plumbing">Plumbing Fix</option>
                      <option value="Maintenance">General Maintenance</option>
                      <option value="Cleaning">Cleaning Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-[#0D0806] border border-[#23150E] focus:border-[#C5A059] rounded-xl px-3 py-2.5 text-xs text-[#E8D8C8] outline-none transition"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Emergency">🚨 Emergency</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1">
                    Assign Worker
                  </label>
                  <select
                    value={formData.assignedWorker}
                    onChange={(e) => setFormData({ ...formData, assignedWorker: e.target.value })}
                    className="w-full bg-[#0D0806] border border-[#23150E] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs text-[#E8D8C8] outline-none transition truncate"
                  >
                    {workers.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#9E8573] tracking-wider block mb-1">
                    Issue Description
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Describe the issue in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0D0806] border border-[#23150E] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs text-[#E8D8C8] outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#D8B673] text-[#0F0A08] font-bold rounded-xl text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:opacity-90 transition mt-2"
                >
                  {loading
                    ? "Updating..."
                    : editingTicketId
                    ? "Update Ticket"
                    : "Submit Complaint"}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomerDashboard;