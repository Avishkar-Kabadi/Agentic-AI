import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { apiFetch } from "../api";
import { Calendar, Trash2, CheckCircle, Circle, Mail } from "lucide-react";

export const TasksPage = () => {
  const token = useSelector((store) => store?.auth?.token);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await apiFetch("/task/all", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load tasks right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const handleLiveUpdate = () => {
      fetchTasks();
    };

    window.addEventListener("app:live-update", handleLiveUpdate);
    return () => {
      window.removeEventListener("app:live-update", handleLiveUpdate);
    };
  }, [token]);

  const toggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      const res = await apiFetch(`/task/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const res = await apiFetch(`/task/${taskId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Tasks</h1>
          <p className="text-slate-400 mt-2">Manage your manually created and AI-extracted tasks.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading tasks...</div>
        ) : error ? (
          <div className="col-span-full py-12 text-center text-rose-400">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No tasks found. Try syncing your emails!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-slate-900/40 backdrop-blur-xl border ${
                task.status === "completed" ? "border-emerald-500/30" : "border-slate-800/50"
              } p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group`}
            >
              <div className="flex justify-between items-start mb-4">
                <button onClick={() => toggleStatus(task.id, task.status)} className="mt-1">
                  {task.status === "completed" ? (
                    <CheckCircle className="text-emerald-500 w-6 h-6 shadow-[0_0_10px_rgba(16,185,129,0.3)] rounded-full" />
                  ) : (
                    <Circle className="text-slate-500 w-6 h-6 hover:text-indigo-400 transition-colors" />
                  )}
                </button>
                <div className="flex gap-2">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      task.priority === "high" || task.priority === "urgent"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : task.priority === "medium"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              <h3
                className={`text-lg font-semibold mb-2 ${
                  task.status === "completed" ? "text-slate-500 line-through" : "text-white"
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {task.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                </div>
                {task.is_ai_generated && (
                  <div className="flex items-center gap-1 text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    <Mail className="w-3 h-3" /> AI Extracted
                  </div>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors backdrop-blur-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
