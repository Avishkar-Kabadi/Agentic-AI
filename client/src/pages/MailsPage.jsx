import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { apiFetch } from "../api";

export const MailsPage = () => {
  const token = useSelector((s) => s?.auth?.token);
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState([]);

  const fetchEmails = async () => {
    const res = await apiFetch("/gmail/emails", { headers: { authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setEmails(data.items || []);
    }
  };

  useEffect(() => { fetchEmails(); }, [token]);
  useEffect(() => {
    const h = () => fetchEmails();
    window.addEventListener("app:live-update", h);
    return () => window.removeEventListener("app:live-update", h);
  }, [token]);

  const summarize = async () => {
    if (!selected) return;
    const res = await apiFetch(`/gmail/emails/${selected.id}/summarize`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setSelected({ ...selected, summary: data.summary });
      fetchEmails();
    }
  };

  const ask = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selected) return;
    const q = chatInput;
    setChat((c) => [...c, { role: "user", text: q }]);
    setChatInput("");
    const res = await apiFetch(`/gmail/emails/${selected.id}/chat`, { method: "POST", headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ message: q }) });
    if (res.ok) {
      const data = await res.json();
      setChat((c) => [...c, { role: "ai", text: data.reply }]);
    }
  };

  return <div className="grid grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
    <div className="col-span-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-y-auto">
      <div className="p-4 font-bold text-white border-b border-slate-800/50">All Mail</div>
      {emails.map((em) => <button key={em.id} onClick={() => { setSelected(em); setChat([]); }} className="w-full text-left p-4 border-b border-slate-800/40 hover:bg-slate-800/40">
        <div className="text-sm text-slate-300 truncate">{em.subject || "(No subject)"}</div>
        <div className="text-xs text-slate-500 truncate">{em.sender}</div>
      </button>)}
    </div>
    <div className="col-span-5 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 overflow-y-auto">
      {!selected ? <div className="text-slate-500">Select an email to view details.</div> : <>
        <h2 className="text-xl font-bold text-white mb-2">{selected.subject}</h2>
        <div className="text-xs text-slate-400 mb-4">From: {selected.sender}</div>
        <p className="text-slate-300 whitespace-pre-wrap mb-4">{selected.body}</p>
        <button onClick={summarize} className="px-4 py-2 bg-indigo-600 rounded-lg text-white">Summarize this mail</button>
        {selected.summary && <div className="mt-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-100 whitespace-pre-wrap">{selected.summary}</div>}
      </>}
    </div>
    <div className="col-span-3 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex flex-col">
      <div className="font-bold text-white mb-3">Mail Assistant</div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {chat.map((m, i) => <div key={i} className={`p-2 rounded-lg text-sm ${m.role === "user" ? "bg-slate-700 text-white" : "bg-indigo-500/10 text-indigo-100"}`}>{m.text}</div>)}
      </div>
      <form onSubmit={ask} className="mt-3 flex gap-2">
        <input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" placeholder="Ask about selected mail..."/>
        <button className="px-3 py-2 bg-indigo-600 rounded-lg text-white text-sm">Send</button>
      </form>
    </div>
  </div>
}
