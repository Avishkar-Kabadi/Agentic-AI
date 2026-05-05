import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { apiFetch } from "../api";
import { Mail, RefreshCw, Unplug, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

export const SettingsPage = () => {
  const token = useSelector((store) => store?.auth?.token);
  const [gmailStatus, setGmailStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchStatus = async () => {
    setStatusMessage("");
    try {
      const res = await apiFetch("/gmail/status", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGmailStatus(data.connected);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Unable to fetch Gmail status.");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleConnect = async () => {
    try {
      const res = await apiFetch("/gmail/connect", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.auth_url;
      } else {
        setStatusMessage("Could not start Gmail connection.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await apiFetch("/gmail/disconnect", {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchStatus();
        setStatusMessage("Gmail disconnected.");
      } else {
        setStatusMessage("Failed to disconnect Gmail.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await apiFetch("/gmail/sync", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSyncResult(data);
        // Dispatch live update so other components refresh
        window.dispatchEvent(new CustomEvent('app:live-update', { detail: { type: 'SYNC_COMPLETE' } }));
        setStatusMessage("Sync completed successfully.");
      } else {
        setStatusMessage("Sync failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Sync failed due to network issue.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-2">Manage your integrations and application preferences.</p>
      </header>

      {statusMessage && <div className="mb-4 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">{statusMessage}</div>}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-800/50 flex items-start gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">Gmail Integration</h2>
              {gmailStatus ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold uppercase tracking-wider">
                  Disconnected
                </span>
              )}
            </div>
            <p className="text-slate-400 mb-6">
              Connect your Gmail account to allow the AI Agent to automatically extract tasks, deadlines, and actionable items from your recent emails.
            </p>

            <div className="flex flex-wrap gap-4">
              {!gmailStatus ? (
                <button
                  onClick={handleConnect}
                  className="bg-white text-slate-900 hover:bg-slate-100 font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Connect Gmail
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isSyncing ? "Syncing (may take a minute)..." : "Sync Recent Emails"}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Unplug className="w-4 h-4" /> Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {syncResult && (
          <div className="p-8 bg-indigo-500/5">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Last Sync Result</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-sm mb-1">Emails Scanned</div>
                <div className="text-2xl font-bold text-white">{syncResult.emails_scanned}</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-sm mb-1">Skipped (Already Processed)</div>
                <div className="text-2xl font-bold text-slate-300">{syncResult.emails_skipped}</div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <div className="text-indigo-400 text-sm font-semibold mb-1">Tasks Created</div>
                <div className="text-2xl font-bold text-indigo-300">{syncResult.tasks_created}</div>
              </div>
            </div>

            {syncResult.tasks?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Newly Extracted Tasks:</h4>
                <ul className="space-y-2">
                  {syncResult.tasks.map((task, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                      <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-white font-medium">{task.title}</span>
                      <span className="text-slate-500 hidden sm:inline ml-auto truncate max-w-xs">from: {task.from_email}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
