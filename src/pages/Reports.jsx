import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Calendar, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Reports() {
  const navigate = useNavigate();
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const clinicPlan = storedUser?.clinic?.plan || "FREE";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (clinicPlan === "FREE") {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/analytics/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [clinicPlan]);

  const renderContent = () => {
    if (loading) {
      return <div className="p-8 text-center text-slate-500 animate-pulse">Loading analytics data...</div>;
    }

    if (clinicPlan === "FREE" || !data) {
      return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white min-h-[500px]">
          {/* FAKE BLURRED BACKGROUND */}
          <div className="absolute inset-0 p-8 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 blur-sm pointer-events-none select-none">
            <div className="bg-slate-100 rounded-2xl h-64 border border-slate-200 flex items-end p-4 gap-2">
              <div className="w-1/6 bg-primary-200 h-1/3 rounded-t-md"></div>
              <div className="w-1/6 bg-primary-300 h-1/2 rounded-t-md"></div>
              <div className="w-1/6 bg-primary-400 h-2/3 rounded-t-md"></div>
              <div className="w-1/6 bg-primary-500 h-[80%] rounded-t-md"></div>
              <div className="w-1/6 bg-primary-400 h-1/2 rounded-t-md"></div>
              <div className="w-1/6 bg-primary-600 h-full rounded-t-md"></div>
            </div>
            <div className="bg-slate-100 rounded-2xl h-64 border border-slate-200 flex flex-col justify-center items-center">
              <div className="w-32 h-32 rounded-full border-8 border-r-primary-500 border-t-amber-400 border-l-rose-500 border-b-cyan-500"></div>
            </div>
          </div>

          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-10 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-white text-center transform transition-all hover:scale-[1.02]">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
                <BarChart3 size={40} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Advanced Analytics</h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Unlock powerful financial charts, appointment trends, and patient demographic breakdowns. Make data-driven decisions to grow your clinic.
              </p>
              <Button 
                onClick={() => navigate("/upgrade")} 
                size="lg" 
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 border-none shadow-xl shadow-orange-500/20 text-white font-bold h-14 text-lg rounded-xl flex items-center justify-center gap-3"
              >
                <Lock size={20} />
                Unlock Pro Plan
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ACTUAL PRO CONTENT
    const maxRevenue = Math.max(...data.revenueByMonth.map(m => m.revenue), 1000);
    const totalRevenue = data.revenueByMonth.reduce((acc, curr) => acc + curr.revenue, 0);
    
    // Status color mapping
    const statusColors = {
      completed: "bg-emerald-500",
      scheduled: "bg-blue-500",
      "no-show": "bg-rose-500",
      cancelled: "bg-amber-500"
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="col-span-1 md:col-span-2 border-slate-200 shadow-sm bg-white overflow-hidden">
             <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <TrendingUp className="text-primary-500" size={20} />
                  Revenue Trends (Last 6 Months)
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="mb-4">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Total Period Revenue</span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">₦{totalRevenue.toLocaleString()}</div>
                </div>
                
                <div className="flex items-end gap-3 h-64 mt-8 pb-6 border-b border-slate-100">
                   {data.revenueByMonth.map((monthData, idx) => {
                     const heightPercentage = Math.max((monthData.revenue / maxRevenue) * 100, 2); // Min 2% height for visibility
                     return (
                       <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                          <div className="absolute -top-10 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                             ₦{monthData.revenue.toLocaleString()}
                          </div>
                          <div 
                            className="w-full max-w-[48px] bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md transition-all duration-500 ease-out group-hover:from-primary-500 group-hover:to-primary-300 shadow-sm"
                            style={{ height: `${heightPercentage}%` }}
                          ></div>
                          <span className="text-xs font-semibold text-slate-500 mt-3">{monthData.month}</span>
                       </div>
                     )
                   })}
                </div>
             </CardContent>
           </Card>

           <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm bg-white">
                 <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Calendar className="text-blue-500" size={20} />
                      Appointment Status
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    {data.appointments.length === 0 ? (
                      <div className="text-sm text-slate-400 italic text-center py-4">No appointment data available.</div>
                    ) : (
                      <div className="space-y-4">
                        {data.appointments.map((apt, idx) => {
                           const clr = statusColors[apt.status] || "bg-slate-400";
                           return (
                             <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className={`w-3 h-3 rounded-full ${clr} shadow-sm`}></div>
                                   <span className="text-sm font-bold text-slate-700 capitalize">{apt.status}</span>
                                </div>
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{apt.count}</span>
                             </div>
                           )
                        })}
                      </div>
                    )}
                 </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white">
                 <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Users className="text-rose-500" size={20} />
                      Demographics (Gender)
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    {data.demographics.length === 0 ? (
                       <div className="text-sm text-slate-400 italic text-center py-4">No demographic data available.</div>
                    ) : (
                       <div className="space-y-4">
                          {data.demographics.map((demo, idx) => (
                             <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                   <span className="font-semibold text-slate-700 capitalize">{demo.gender || "Not Specified"}</span>
                                   <span className="font-bold text-slate-900">{demo.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                   <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full" style={{ width: `${Math.max((demo.count / data.demographics.reduce((s, d) => s + d.count, 0)) * 100, 5)}%` }}></div>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 md:p-8 h-full overflow-y-auto">
      {renderContent()}
    </motion.div>
  );
}
