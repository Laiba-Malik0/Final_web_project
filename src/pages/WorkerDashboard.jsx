import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/index";

function WorkerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkerTickets();
  }, []);

  const fetchWorkerTickets = async () => {
    try {
      const res = await API.get("/tickets/worker-tickets");
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to fetch worker tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/tickets/update-status/${id}`, { status });
      fetchWorkerTickets();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0B1017] text-[#F7F5EF] p-6 font-sans">
      
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto flex justify-between items-center pb-6 border-b border-[#1F2C35]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5F8F89]/20 border border-[#5F8F89]/40 flex items-center justify-center text-[#5F8F89] font-black">
            🛠️
          </div>
          <div>
            <h1 className="text-xl font-black text-[#F7F5EF] uppercase tracking-wider">
              Worker Control Desk
            </h1>
            <p className="text-xs text-[#6C827C]">
              Logged in as: <span className="text-[#5F8F89] font-semibold">{user.name}</span> ({user.email})
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition"
        >
          Logout
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto pt-6 space-y-4">
        
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#8EA49E] uppercase tracking-wider">
            Assigned Complaints Queue ({tickets.length})
          </h2>
          <button 
            onClick={fetchWorkerTickets} 
            className="text-xs text-[#5F8F89] hover:underline"
          >
            ↻ Refresh Queue
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-[#6C827C]">
            Loading assigned tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-[#111920] border border-[#202E36] rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#8EA49E]">No Complaints Assigned Yet</p>
            <p className="text-xs text-[#6C827C]">When customers assign complaints to you, they will appear here in real-time.</p>
          </div>
        ) : (
          tickets.map((t) => (
            <div key={t._id} className="bg-[#111920] border border-[#202E36] hover:border-[#5F8F89]/40 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-lg">
              
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase bg-[#5F8F89]/20 text-[#5F8F89] border border-[#5F8F89]/30 px-2.5 py-0.5 rounded-md">
                    {t.category}
                  </span>
                  <span className="text-xs text-[#6C827C]">
                    Customer: <strong className="text-[#F7F5EF]">{t.customerName}</strong>
                  </span>
                </div>

                <p className="text-xs text-[#F7F5EF] font-medium leading-relaxed bg-[#090E13] p-3 rounded-xl border border-[#1F2C35]">
                  "{t.description}"
                </p>

                <div className="flex items-center gap-3 text-[11px] text-[#6C827C]">
                  <span>Status: 
                    <strong className={`ml-1 ${
                      t.status === 'Approved' ? 'text-emerald-400' :
                      t.status === 'Rejected' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {t.status}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => handleStatusUpdate(t._id, "Approved")}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex-1 sm:flex-none"
                >
                  ✓ Approve
                </button>
                <button 
                  onClick={() => handleStatusUpdate(t._id, "Rejected")}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex-1 sm:flex-none"
                >
                  ✕ Reject
                </button>
              </div>

            </div>
          ))
        )}

      </div>
    </div>
  );
}

export default WorkerDashboard;