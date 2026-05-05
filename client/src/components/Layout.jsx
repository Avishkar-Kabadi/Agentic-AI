import React, { useEffect, useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearEmailNotifications, upsertEmailFromNotification } from "../store/emailsSlice";
import { logout } from "../store/authSlice";
import { LayoutDashboard, ListTodo, Settings, MessageSquare, LogOut, TrendingUp, Mail, Bell, Menu, X } from "lucide-react";
import { buildWebSocketUrl } from "../api";

export const Layout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const token = useSelector((store) => store?.auth?.token);
  const unreadCount = useSelector((store) => store?.emails?.unreadNotifications || 0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (text, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  useEffect(() => {
    if (token) {
      const ws = new WebSocket(buildWebSocketUrl(`/ws/${token}`));
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (["NEW_TASK", "EMAIL_PROCESSED", "NEW_EMAIL"].includes(message.type)) {
          if (message.type === "NEW_EMAIL") {
            dispatch(upsertEmailFromNotification(message));
            pushToast(`New email: ${message.subject}`, "success");
          }
          window.dispatchEvent(new CustomEvent("app:live-update", { detail: message }));
        }
      };
      return () => ws.close();
    }
  }, [token, dispatch]);

  useEffect(() => {
    const onToast = (e) => pushToast(e.detail?.text || "Update", e.detail?.type || "info");
    window.addEventListener("app:toast", onToast);
    return () => window.removeEventListener("app:toast", onToast);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30">
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-40 p-2 bg-slate-800 rounded-lg"><Menu size={18} /></button>
      <aside className={`${collapsed ? "w-20" : "w-72"} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-all duration-300 fixed md:sticky z-30 top-0 h-screen border-r border-slate-800/50 bg-slate-950/95 backdrop-blur-xl flex flex-col p-4`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><TrendingUp className="text-white w-5 h-5" /> {!collapsed && <span className="font-bold">Agentic AI</span>}</div>
          <div className="flex gap-1">
            <button onClick={() => setCollapsed((v) => !v)} className="hidden md:block p-1"><Menu size={16} /></button>
            <button onClick={() => setMobileOpen(false)} className="md:hidden p-1"><X size={16} /></button>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Overview" active={location.pathname === "/"} collapsed={collapsed} />
          <NavItem to="/tasks" icon={<ListTodo size={20} />} label="Tasks" active={location.pathname === "/tasks"} collapsed={collapsed} />
          <NavItem to="/mails" icon={<Mail size={20} />} label="Mails" active={location.pathname === "/mails"} notification={unreadCount > 0} onClick={() => dispatch(clearEmailNotifications())} collapsed={collapsed} />
          <NavItem to="/chat" icon={<MessageSquare size={20} />} label="AI Agent" active={location.pathname === "/chat"} collapsed={collapsed} />
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" active={location.pathname === "/settings"} collapsed={collapsed} />
        </nav>
        <button onClick={() => dispatch(logout())} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300 mt-auto group"><LogOut size={20} /> {!collapsed && <span className="font-medium">Logout</span>}</button>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative md:ml-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto h-full"><Outlet /></div>
      </main>
      <div className="fixed bottom-4 right-4 z-50 space-y-2">{toasts.map(t => <div key={t.id} className={`px-4 py-2 rounded-lg text-sm shadow-lg ${t.type==="error"?"bg-rose-500/90":"bg-indigo-600/90"}`}>{t.text}</div>)}</div>
    </div>
  );
};

const NavItem = ({ to, icon, label, active = false, notification = false, onClick, collapsed = false }) => (
  <Link to={to} onClick={onClick}>
    <div className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${active ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"}`}>
      <div>{icon}</div>
      {!collapsed && <span className="font-medium">{label}</span>}
      {notification && <Bell size={14} className="ml-auto text-amber-400" />}
    </div>
  </Link>
);
