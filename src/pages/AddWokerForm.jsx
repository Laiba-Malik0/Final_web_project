// import React, { useState } from 'react';
// import API from '../api'; 
// import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

// const AddWorkerModal = ({ isOpen, onClose, onWorkerAdded }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     department: 'Maintenance'
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', text: '' });

//   if (!isOpen) return null;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: '', text: '' });

//     try {
//       await API.post('/admin/create-worker', formData);
      
//       setMessage({ type: 'success', text: 'Worker added successfully!' });
//       setFormData({ name: '', email: '', password: '', department: 'Maintenance' });
//       if (onWorkerAdded) onWorkerAdded();
      
//       setTimeout(() => onClose(), 1500);
//     } catch (err) {
//       setMessage({ 
//         type: 'error', 
//         text: err.response?.data?.error || 'Failed to create worker' 
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
//       <div className="bg-[#0f172a] border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
//         <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
//           <UserPlus className="w-5 h-5 text-indigo-400" /> Add New Worker
//         </h3>
//         <p className="text-slate-400 text-xs mb-6">Create a technician profile to assign complaints.</p>

//         {message.text && (
//           <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
//             message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
//           }`}>
//             {message.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
//             <span>{message.text}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
//             <input 
//               type="text" 
//               required
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="e.g. Ali Ahmed"
//               className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
//             <input 
//               type="email" 
//               required
//               value={formData.email}
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//               placeholder="ali@organization.com"
//               className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
//             <input 
//               type="password" 
//               required
//               value={formData.password}
//               onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//               placeholder="••••••••"
//               className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
//             <select 
//               value={formData.department}
//               onChange={(e) => setFormData({ ...formData, department: e.target.value })}
//               className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
//             >
//               <option value="Electricity">Electricity</option>
//               <option value="Plumbing">Plumbing</option>
//               <option value="IT / Network">IT / Network</option>
//               <option value="Maintenance">Maintenance</option>
//             </select>
//           </div>

//           <div className="pt-4 flex items-center justify-end gap-3">
//             <button 
//               type="button" 
//               onClick={onClose}
//               className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit"
//               disabled={loading}
//               className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
//             >
//               {loading ? 'Creating...' : 'Add Worker'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddWorkerModal;