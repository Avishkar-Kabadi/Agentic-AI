import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { apiFetch } from "../api";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

export const ChatPage = () => {
  const token = useSelector((store) => store?.auth?.token);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await apiFetch("/agent/history", { headers: { authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length) {
          setMessages(data.items.map((m, i) => ({ id: i + 1, role: m.role === "assistant" ? "ai" : "user", text: m.text })));
        } else {
          setMessages([{ id: 1, role: "ai", text: "Hello! I'm your AI Planner. How can I help you organize your day?" }]);
        }
      }
    };
    if (token) fetchHistory();
  }, [token]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setError("");
    try {
      const res = await apiFetch("/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "ai", text: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "ai", text: "Sorry, I encountered an error connecting to the planner backend." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", text: "Network error occurred." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-6rem)] flex flex-col max-w-5xl mx-auto">
      <header className="mb-6 shrink-0 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Planner</h1>
          <p className="text-slate-400 text-sm mt-1">Chat with your assistant to manage tasks and schedule.</p>
          <p className="text-xs text-indigo-300/80 mt-1">Tip: type <span className="font-semibold">add task: Submit report</span> to create a task instantly.</p>
        </div>
      </header>

      <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-xl overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === "user" ? "bg-slate-700" : "bg-gradient-to-tr from-indigo-500 to-purple-600"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === "user" 
                  ? "bg-slate-800 text-slate-200 border border-slate-700" 
                  : "bg-indigo-500/10 text-indigo-100 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
              }`}>
                {/* Minimal markdown parsing for basic lists/bolding if needed, but plain text for now */}
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-sm text-indigo-400 font-medium tracking-wide animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="px-6 py-2 text-sm text-rose-300 bg-rose-500/10 border-t border-rose-500/20">{error}</div>}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800/50 backdrop-blur-md">
          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to schedule a task, or summarize your day..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-6 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
