"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import { Plus, X, User, Calendar, ChevronDown, AlertCircle, Clock, CheckCircle, Eye } from "lucide-react";

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
  { id: "todo",       label: "To Do",      color: "text-gray-400",    bg: "#2a2a2a",  dot: "#888" },
  { id: "inprogress", label: "In Progress", color: "text-[#096cfe]",  bg: "#05429d22", dot: "#096cfe" },
  { id: "review",     label: "To Review",  color: "text-[#ffd801]",   bg: "#ffd80111", dot: "#ffd801" },
  { id: "done",       label: "Completed",  color: "text-green-400",   bg: "#16a34a11", dot: "#4ade80" },
];

const PRIORITY_BADGES: Record<string, string> = {
  low:    "bg-gray-500/20 text-gray-400",
  medium: "bg-[#ffd80120] text-[#ffd801]",
  high:   "bg-red-500/20 text-red-400",
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  low:    <span className="text-gray-400">↓</span>,
  medium: <span className="text-[#ffd801]">→</span>,
  high:   <AlertCircle size={11} className="text-red-400" />,
};

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskModal({
  task,
  users,
  onClose,
  onMove,
  onDelete,
  onUpdate,
  session,
}: {
  task: Task;
  users: UserItem[];
  onClose: () => void;
  onMove: (taskId: string, status: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, fields: Partial<Task>) => Promise<void>;
  session: Session;
}) {
  const [newStatus, setNewStatus] = useState(task.status);
  const [moving, setMoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editAssignee, setEditAssignee] = useState(task.assignee?.id ?? "");
  const [editDue, setEditDue] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  const currentCol = COLUMNS.find(c => c.id === task.status);

  async function handleMove() {
    if (newStatus === task.status) return;
    setMoving(true);
    await onMove(task.id, newStatus);
    setMoving(false);
    onClose();
  }

  async function handleSave() {
    setSaving(true);
    await onUpdate(task.id, {
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      assignee: users.find(u => u.id === editAssignee) as unknown as Assignee ?? null,
      dueDate: editDue || null,
    });
    setSaving(false);
    setEditing(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl fade-in overflow-hidden">
        {/* Modal header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: currentCol?.dot ?? "#888" }}
            />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${currentCol?.color ?? "text-gray-400"}`}>
              {currentCol?.label ?? task.status}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white shrink-0 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          {editing ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="input w-full text-base font-bold"
              placeholder="Task title"
            />
          ) : (
            <h2 className="text-lg font-black text-white leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {task.title}
            </h2>
          )}

          {/* Description */}
          {editing ? (
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              className="input w-full resize-none h-24 text-sm"
              placeholder="Description (optional)"
            />
          ) : (
            task.description && (
              <p className="text-gray-400 text-sm leading-relaxed">{task.description}</p>
            )
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1.5">Priority</p>
              {editing ? (
                <select
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value)}
                  className="bg-transparent text-white text-xs focus:outline-none cursor-pointer w-full"
                >
                  <option value="low" className="bg-[#111]">Low</option>
                  <option value="medium" className="bg-[#111]">Medium</option>
                  <option value="high" className="bg-[#111]">High</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  {PRIORITY_ICONS[task.priority]}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGES[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1.5">Assignee</p>
              {editing ? (
                <select
                  value={editAssignee}
                  onChange={e => setEditAssignee(e.target.value)}
                  className="bg-transparent text-white text-xs focus:outline-none cursor-pointer w-full"
                >
                  <option value="" className="bg-[#111]">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id} className="bg-[#111]">{u.name}</option>)}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <User size={11} className="text-gray-500" />
                  <span className="text-xs text-white">{task.assignee?.name ?? "Unassigned"}</span>
                </div>
              )}
            </div>

            {/* Due date */}
            <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1.5">Due Date</p>
              {editing ? (
                <input
                  type="date"
                  value={editDue}
                  onChange={e => setEditDue(e.target.value)}
                  className="bg-transparent text-white text-xs focus:outline-none cursor-pointer w-full"
                  style={{ colorScheme: "dark" }}
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-gray-500" />
                  <span className="text-xs text-white">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "No due date"}
                  </span>
                </div>
              )}
            </div>

            {/* Created */}
            <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1.5">Created</p>
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-gray-500" />
                <span className="text-xs text-gray-400">
                  {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Creator */}
          {session.role === "admin" && (
            <p className="text-[10px] text-gray-600">Created by {task.creator.name}</p>
          )}

          {/* Move to stage */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2.5">Move to Stage</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full appearance-none bg-[#0d0d0d] border border-[#2a2a2a] text-white text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#ffd801] cursor-pointer"
                >
                  {COLUMNS.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#111]">{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              <button
                onClick={handleMove}
                disabled={newStatus === task.status || moving}
                className="btn-gold text-xs px-4 py-2 disabled:opacity-40"
              >
                {moving ? "Moving…" : "Move"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 p-4 border-t border-[#1e1e1e]">
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <X size={11} /> Delete task
          </button>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-outline text-xs">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-gold text-xs disabled:opacity-50">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-outline text-xs flex items-center gap-1.5">
                <Eye size={11} /> Edit
              </button>
            )}
            <button onClick={onClose} className="btn-outline text-xs flex items-center gap-1.5">
              <CheckCircle size={11} /> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TaskBoardTab({ session }: { session: Session }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
    // If the moved task is the selected one, update it
    setSelectedTask(prev => prev?.id === taskId ? data.task : prev);
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(prev => prev?.id === taskId ? null : prev);
  }

  async function updateTask(taskId: string, fields: Partial<Task>) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fields.title,
        description: fields.description,
        priority: fields.priority,
        assigneeId: (fields.assignee as unknown as { id?: string })?.id ?? null,
        dueDate: fields.dueDate ?? null,
      }),
    });
    const data = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    setSelectedTask(data.task);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
      </div>
    );
  }

  return (
    <>
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          users={users}
          session={session}
          onClose={() => setSelectedTask(null)}
          onMove={moveTask}
          onDelete={deleteTask}
          onUpdate={updateTask}
        />
      )}

      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Task Board</h2>
            <p className="text-[#096cfe] text-sm mt-0.5">Click any card to open details · Drag to move between columns</p>
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
                onKeyDown={e => { if (e.key === "Enter") createTask(); }}
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
                style={{ colorScheme: "dark" }}
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
                className="kanban-col flex flex-col overflow-hidden rounded-xl border border-[#1e1e1e]"
                style={{ background: col.bg }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging) {
                    moveTask(dragging, col.id);
                    setDragging(null);
                  }
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#1e1e1e] shrink-0">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${col.color}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{col.label}</h3>
                  <span className="text-[10px] text-gray-600 bg-[#1a1a1a] rounded-full px-2 py-0.5 ml-auto">{colTasks.length}</span>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 p-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="kanban-card fade-in cursor-pointer hover:border-[#ffd801]/40 transition-colors group"
                      draggable
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <p className="text-xs font-semibold text-white leading-tight group-hover:text-[#ffd801] transition-colors" style={{ fontFamily: 'Oswald, sans-serif' }}>
                          {task.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="text-gray-600 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          <span className="text-[9px] text-gray-500 flex items-center gap-1 ml-auto">
                            <Calendar size={9} />{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="text-[10px] text-gray-700 text-center py-6 border border-dashed border-[#2a2a2a] rounded-lg m-1">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
