"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import { Plus, X, User, Calendar } from "lucide-react";

interface Assignee {
  id: string;
  name: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: Assignee | null;
  creator: { id: string; name: string };
  dueDate?: string | null;
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  role: string;
}

const COLUMNS = [
  { id: "todo", label: "To Do", color: "text-gray-400" },
  { id: "inprogress", label: "In Progress", color: "text-[#096cfe]" },
  { id: "review", label: "To Review", color: "text-[#ffd801]" },
  { id: "done", label: "Completed", color: "text-green-400" },
];

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-[#ffd80120] text-[#ffd801]",
  high: "bg-red-500/20 text-red-400",
};

export default function TaskBoardTab({ session }: { session: Session }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", assigneeId: "", dueDate: "" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [tasksRes, usersRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/users"),
    ]);
    const tasksData = await tasksRes.json();
    const usersData = await usersRes.json();
    setTasks(tasksData.tasks ?? []);
    setUsers(usersData.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function createTask() {
    if (!newTask.title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assigneeId: newTask.assigneeId || null,
        dueDate: newTask.dueDate || null,
      }),
    });
    const data = await res.json();
    setTasks((prev) => [data.task, ...prev]);
    setNewTask({ title: "", description: "", priority: "medium", assigneeId: "", dueDate: "" });
    setShowNew(false);
  }

  async function moveTask(taskId: string, newStatus: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Task Board</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">Drag cards between columns · Assign tasks to team members</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-gold flex items-center gap-1.5">
          <Plus size={14} />New Task
        </button>
      </div>

      {showNew && (
        <div className="card p-4 mb-6 fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task title *"
              className="input sm:col-span-2"
            />
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Description (optional)"
              className="input sm:col-span-2 resize-none h-16"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="input"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <select
              value={newTask.assigneeId}
              onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
              className="input"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={createTask} className="btn-gold">Create Task</button>
            <button onClick={() => setShowNew(false)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="kanban-col flex flex-col overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragging) {
                  moveTask(dragging, col.id);
                  setDragging(null);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${col.color}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{col.label}</h3>
                <span className="text-[10px] text-gray-600 bg-[#2a2a2a] rounded-full px-2 py-0.5">{colTasks.length}</span>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="kanban-card fade-in"
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    onDragEnd={() => setDragging(null)}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <p className="text-xs font-semibold text-white leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>{task.title}</p>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-600 hover:text-red-400 shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge text-[9px] ${PRIORITY_BADGES[task.priority]}`}>{task.priority}</span>
                      {task.assignee && (
                        <span className="text-[9px] text-gray-400 bg-[#2a2a2a] rounded px-1.5 py-0.5 flex items-center gap-1">
                          <User size={9} />{task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-[9px] text-gray-500 flex items-center gap-1">
                          <Calendar size={9} />{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => moveTask(task.id, c.id)}
                          className="text-[9px] text-gray-600 hover:text-[#ffd801] transition-colors"
                          title={`Move to ${c.label}`}
                        >
                          → {c.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                    {session.role === "admin" && (
                      <p className="text-[9px] text-gray-700 mt-1">by {task.creator.name}</p>
                    )}
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="text-[10px] text-gray-700 text-center py-4 border border-dashed border-[#2a2a2a] rounded-lg">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
