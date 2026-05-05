import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useSelector } from "react-redux";
import { apiFetch } from "../api";

export const Overview = () => {


  const [stats, setStatsData] = useState({});
  const token = useSelector((store) => store?.auth?.token);

  const fetchData = async () => {
    try {
      const res = await apiFetch("/dashboard/stats", {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for live updates from Layout component
    const handleLiveUpdate = () => {
      fetchData();
    };

    window.addEventListener('app:live-update', handleLiveUpdate);
    return () => {
      window.removeEventListener('app:live-update', handleLiveUpdate);
    };
  }, [token]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Productivity Overview
        </h1>
        <p className="text-slate-400 mt-2">
          Welcome back! Here’s what’s happening with your tasks today.
        </p>
      </header>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <KPICard
          title="Total Tasks"
          value={stats.total_tasks || 0}
          icon={<ListTodo className="text-blue-400" />}
        />
        <KPICard
          title="Pending"
          value={stats.pending_tasks || 0}
          icon={<Clock className="text-amber-400" />}
        />
        <KPICard
          title="Completed"
          value={stats.completed_tasks || 0}
          icon={<CheckCircle2 className="text-emerald-400" />}
        />
        <KPICard
          title="High Priority"
          value={stats.high_priority_tasks || 0}
          icon={<AlertCircle className="text-rose-400" />}
        />
        <KPICard
          title="Overdue"
          value={stats.overdue_tasks || 0}
          icon={<AlertCircle className="text-purple-400" />}
        />
      </div>

      {/* --- CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-semibold mb-6 text-white">
            Task Completion Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trends || []}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorComp)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-semibold mb-6 text-white">
            Workload Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trends || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#1e293b" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                  }}
                />
                <Bar
                  dataKey="pending"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="completed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon }) => (
  <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-5 rounded-3xl shadow-lg hover:border-slate-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-xl bg-slate-800/80 shadow-inner">{icon}</div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {title}
      </span>
    </div>
    <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
  </div>
);
