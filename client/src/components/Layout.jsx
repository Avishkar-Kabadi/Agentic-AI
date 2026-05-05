import React, { useEffect, useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearEmailNotifications, upsertEmailFromNotification } from "../store/emailsSlice";
import { logout } from "../store/authSlice";
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  MessageSquare,
  LogOut,
  TrendingUp,
  Mail,
  Bell,
} from "lucide-react";
import { buildWebSocketUrl } from "../api";

export const Layout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const token = useSelector((store) => store?.auth?.token);
  const unreadCount = useSelector((store) => store?.emails?.unreadNotifications || 0);
  const [hasMailNotification, setHasMailNotification] = React.useState(false);

  useEffect(() => {
    if (token) {
      const ws = new WebSocket(buildWebSocketUrl(`/ws/${token}`));
      
      ws.onopen = () => {
        console.log("WebSocket Connected");
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "NEW_TASK" || message.type === "EMAIL_PROCESSED" || message.type === "NEW_EMAIL") {
          if (message.type === "NEW_EMAIL") {
            dispatch(upsertEmailFromNotification(message));
          }
        if (message.type === "NEW_TASK" || message.type === "EMAIL_PROCESSED") {
          setHasMailNotification(true);
          console.log("Live update received:", message);
          // In a larger app, we might dispatch a global event here.
          // For now, pages that need to refresh can listen or we just dispatch a trigger.
          window.dispatchEvent(new CustomEvent('app:live-update', { detail: message }));
        }
      };
      return () => ws.close();
    }
  }, [token, dispatch]);

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
          <NavItem
            to="/"
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            active={location.pathname === "/"}
          />
          <NavItem
            to="/tasks"
            icon={<ListTodo size={20} />}
            label="Tasks"
            active={location.pathname === "/tasks"}
          />
          <NavItem
            to="/mails"
            icon={<Mail size={20} />}
            label="Mails"
            active={location.pathname === "/mails"}
            notification={unreadCount > 0}
            onClick={() => dispatch(clearEmailNotifications())}
            notification={hasMailNotification}
            onClick={() => setHasMailNotification(false)}
          />
          <NavItem
            to="/chat"
            icon={<MessageSquare size={20} />}
            label="AI Agent"
            active={location.pathname === "/chat"}
          />
          <NavItem
            to="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            active={location.pathname === "/settings"}
          />
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

const NavItem = ({ to, icon, label, active = false, notification = false, onClick }) => (
  <Link to={to} onClick={onClick}>
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
        active
          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
      }`}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
      )}
      <div className={`${active ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"} transition-colors duration-300`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>{notification && <Bell size={14} className="ml-auto text-amber-400" />}
    </div>
  </Link>
);
