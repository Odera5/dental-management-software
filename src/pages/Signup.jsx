import React, { useEffect, useState } from "react";
import { UserPlus, Users, Mail, Shield, ShieldAlert, Key, Link as LinkIcon, Trash2, Power, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toast from "../components/Toast";

const supportEmail = "primuxcare@gmail.com";
const whatsappNumber = "08068073362";
const whatsappLink = "https://wa.me/2348068073362";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("nurse");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [busyStaffId, setBusyStaffId] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const navigate = useNavigate();
  const currentUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user")) || "null");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }
    fetchStaff();
  }, [navigate, currentUser?.role]);

  const showToast = (message, type = "success") => setToast({ show: true, message, type });

  const fetchStaff = async () => {
    try { setStaffLoading(true); const response = await api.get("/auth/staff"); setStaff(response.data || []); } 
    catch (err) { showToast(err.response?.data?.message || "Failed to load staff accounts", "error"); } 
    finally { setStaffLoading(false); }
  };

  const resetForm = () => { setName(""); setEmail(""); setPassword(""); setRole("nurse"); };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return showToast("All fields are required", "error");
    try {
      setLoading(true);
      await api.post("/auth/signup", { name, email, password, role });
      showToast("Staff account created successfully", "success");
      resetForm();
      fetchStaff();
    } catch (err) { showToast(err.response?.data?.message || "Staff creation failed", "error"); } 
    finally { setLoading(false); }
  };

  const handleStatusChange = async (staffMember) => {
    const nextStatus = !staffMember.isActive;
    try {
      setBusyStaffId(staffMember.id);
      const response = await api.patch(`/auth/staff/${staffMember.id}/status`, { isActive: nextStatus });
      showToast(response.data?.message || `Staff account ${nextStatus ? "activated" : "deactivated"}`, "success");
      fetchStaff();
    } catch (err) { showToast(err.response?.data?.message || "Failed to update status", "error"); } 
    finally { setBusyStaffId(""); }
  };

  const handleDelete = async (staffMember) => {
    if (!window.confirm(`Delete ${staffMember.name}'s account permanently?`)) return;
    try {
      setBusyStaffId(staffMember.id);
      const response = await api.delete(`/auth/staff/${staffMember.id}`);
      showToast(response.data?.message || "Staff account deleted", "success");
      fetchStaff();
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete account", "error"); } 
    finally { setBusyStaffId(""); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Staff Directory & Access</h2>
          <p className="text-sm text-slate-500 max-w-xl">
             Manage clinic personnel. Only active accounts configured here can sign in to the platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* Left Col: Create & Support */}
        <div className="space-y-6">
          <Card className="border border-surface-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-6 flex items-center text-slate-900"><UserPlus size={18} className="mr-2 text-primary-500" /> Provision Account</h3>
              <form onSubmit={handleSignup} className="space-y-4">
                <Input label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} icon={UserPlus} className="bg-slate-50" />
                <Input label="Email Address *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} className="bg-slate-50" />
                
                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-700">Password *</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Key size={18} className="text-slate-400" /></div>
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 pl-10 pr-12 py-3 bg-slate-50 text-sm focus:ring-primary-500 shadow-sm h-[46px]" />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-medium text-xs uppercase tracking-wider">{showPassword ? "Hide" : "Show"}</button>
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-700">Account Role *</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Shield size={18} className="text-slate-400" /></div>
                      <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 bg-slate-50 text-sm focus:ring-primary-500 shadow-sm appearance-none h-[46px] capitalize">
                        <option value="nurse">Nurse / Front Desk</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Administrator</option>
                      </select>
                   </div>
                </div>

                <div className="pt-4">
                   <Button type="submit" isLoading={loading} className="w-full shadow-md h-12 text-sm sm:text-base font-semibold">Generate Staff Credentials</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
             <CardContent className="p-6">
                <h3 className="font-bold text-teal-900 mb-2 flex items-center"><ShieldAlert size={18} className="mr-2" /> Support Context</h3>
                <p className="text-sm text-teal-800 leading-relaxed mb-4">If you require structural administrative assistance or need to verify billing parameters, reach out to our team.</p>
                <div className="space-y-2">
                   <a href={`mailto:${supportEmail}`} className="flex items-center text-sm font-medium text-teal-700 hover:text-teal-900 bg-white/50 px-3 py-2 rounded-lg transition-colors border border-teal-100"><Mail size={16} className="mr-3" /> {supportEmail}</a>
                   <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-teal-700 hover:text-teal-900 bg-white/50 px-3 py-2 rounded-lg transition-colors border border-teal-100"><LinkIcon size={16} className="mr-3" /> WhatsApp Support</a>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Col: Staff List */}
        <Card className="border border-surface-200 shadow-sm">
           <CardContent className="p-0">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center text-slate-900"><Users size={18} className="mr-2 text-primary-500" /> Provisioned Accounts Directory</h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">{staff.length} Active Accounts</span>
             </div>

             {staffLoading ? (
               <div className="p-12 text-center flex flex-col items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mb-4" /><p className="text-slate-500 font-medium">Fetching directory...</p></div>
             ) : staff.length === 0 ? (
               <div className="p-16 text-center flex flex-col items-center"><Users size={48} className="text-slate-300 mb-4" /><p className="text-lg font-medium text-slate-700">No personnel accounts</p></div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                     <tr><th className="px-6 py-4 text-left font-semibold">User details</th><th className="px-6 py-4 text-left font-semibold">Role assignment</th><th className="px-6 py-4 text-center font-semibold">System Access</th><th className="px-6 py-4 text-right font-semibold">Actions</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     <AnimatePresence>
                       {staff.map((member) => {
                         const isCurrentUser = member.id === currentUser?.id;
                         const isBusy = busyStaffId === member.id;
                         
                         return (
                           <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`hover:bg-slate-50/50 transition-colors ${!member.isActive ? "bg-slate-50/80" : "bg-white"}`}>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold uppercase tracking-wider ${isCurrentUser ? "bg-primary-100 text-primary-700 border border-primary-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                                      {member.name.slice(0, 2)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-900 flex items-center">
                                         {member.name} {isCurrentUser && <span className="ml-2 text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                                      </p>
                                      <p className="text-xs text-slate-500">{member.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold capitalize tracking-wider ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : member.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {member.role === "nurse" ? "Nurse / Desk" : member.role}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center justify-center w-full max-w-[100px] px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest ${member.isActive ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                                   {member.isActive ? "Enabled" : "Suspended"}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant={member.isActive ? "outline" : "primary"} size="sm" onClick={() => handleStatusChange(member)} disabled={isBusy || isCurrentUser} className={member.isActive ? "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200" : "bg-green-600 hover:bg-green-700 text-white"}>
                                    {isBusy ? "..." : member.isActive ? <Power size={14} className="mr-1" /> : <CheckCircle2 size={14} className="mr-1" />}
                                    {member.isActive ? <span className="hidden sm:inline">Suspend</span> : <span className="hidden sm:inline">Enable</span>}
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(member)} disabled={isBusy || isCurrentUser} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                             </td>
                           </motion.tr>
                         );
                       })}
                     </AnimatePresence>
                   </tbody>
                 </table>
               </div>
             )}
           </CardContent>
        </Card>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast({ ...toast, show: false })} />}
    </motion.div>
  );
}
