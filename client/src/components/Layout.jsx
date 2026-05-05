import React, { useEffect } from "react";
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

  useEffect(() => {
    // WebSocket logic for live updates
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
          console.log("Live update received:", message);
          // In a larger app, we might dispatch a global event here.
          // For now, pages that need to refresh can listen or we just dispatch a trigger.
          window.dispatchEvent(new CustomEvent('app:live-update', { detail: message }));
        }
      };
      
      ws.onclose = () => {
        console.log("WebSocket Disconnected");
      };
      
      return () => {
        ws.close();
      };
    }
  }, [token, dispatch]);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30">
      <aside className="w-72 border-r border-slate-800/50 bg-slate-950/40 backdrop-blur-xl flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-default">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <TrendingUp className="text-white w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Agentic AI
          </span>
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

        <button 
          onClick={() => dispatch(logout())}
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300 mt-auto group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto relative">
        {/* Subtle background glow */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
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
