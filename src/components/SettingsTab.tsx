"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import { Plus, X, Clock, Play, Loader2, CheckCircle, AlertCircle, Key, Smartphone, Layers, Film, BarChart2, Lightbulb } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ScheduleCounts {
  stories: number;
  carousels: number;
  reels: number;
  reports: number;
  ideas: number;
}

const DEFAULT_COUNTS: ScheduleCounts = {
  stories: 1,
  carousels: 1,
  reels: 1,
  reports: 5,
  ideas: 3,
};

const COUNT_OPTIONS = [0, 1, 2, 3, 5, 10];

export default function SettingsTab({ session }: { session: Session }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "member" });
  const [creating, setCreating] = useState(false);
  const [userError, setUserError] = useState("");
  const [scheduleRunning, setScheduleRunning] = useState(false);
  const [scheduleResult, setScheduleResult] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "ok" | "missing">("checking");
  const [counts, setCounts] = useState<ScheduleCounts>(DEFAULT_COUNTS);
  const [countsSaved, setCountsSaved] = useState(false);

  // Load saved counts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bbc_schedule_counts");
      if (saved) setCounts(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ping" }),
    }).then(async (res) => {
      const data = await res.json();
      if (data.error?.includes("not configured") || data.error?.includes("API key")) {
        setApiKeyStatus("missing");
      } else {
        setApiKeyStatus("ok");
      }
    }).catch(() => setApiKeyStatus("missing"));
  }, []);

  function saveCounts() {
    localStorage.setItem("bbc_schedule_counts", JSON.stringify(counts));
    setCountsSaved(true);
    setTimeout(() => setCountsSaved(false), 2000);
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setCreating(true);
    setUserError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setUserError(data.error ?? "Failed to create user"); return; }
    setUsers((prev) => [...prev, data.user]);
    setNewUser({ name: "", email: "", password: "", role: "member" });
    setShowNewUser(false);
  }

  async function deleteUser(id: string) {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function runScheduleNow() {
    setScheduleRunning(true);
    setScheduleResult("");
    const res = await fetch("/api/admin/trigger-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counts }),
    });
    const data = await res.json();
    if (res.ok) {
      setScheduleResult(`Generated ${data.generated} items successfully.${data.errors?.length ? ` (${data.errors.length} errors)` : ""}`);
    } else {
      setScheduleResult(`Error: ${data.error}`);
    }
    setScheduleRunning(false);
  }

  const contentTypes: Array<{ key: keyof ScheduleCounts; label: string; icon: React.ReactNode; color: string }> = [
    { key: "stories",   label: "Stories",   icon: <Smartphone size={13} />,  color: "#ffd801" },
    { key: "carousels", label: "Carousels", icon: <Layers size={13} />,      color: "#096cfe" },
    { key: "reels",     label: "Reels",     icon: <Film size={13} />,        color: "#8b5cf6" },
    { key: "reports",   label: "Reports",   icon: <BarChart2 size={13} />,   color: "#10b981" },
    { key: "ideas",     label: "Ideas",     icon: <Lightbulb size={13} />,   color: "#f59e0b" },
  ];

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="section-title text-xl">Settings</h2>
        <p className="section-sub mt-0.5">Manage your team and dashboard configuration</p>
      </div>

      {/* API Key Status */}
      <div className={`card p-4 border ${apiKeyStatus === "ok" ? "border-green-500/20" : apiKeyStatus === "missing" ? "border-red-500/30" : "border-[#1c1c1c]"}`}>
        <div className="flex items-center gap-3">
          <Key size={18} className={apiKeyStatus === "ok" ? "text-green-400" : apiKeyStatus === "missing" ? "text-red-400" : "text-gray-600"} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Anthropic API Key</p>
              {apiKeyStatus === "ok" && <span className="badge-green text-[9px]">Connected</span>}
              {apiKeyStatus === "missing" && <span className="badge-red text-[9px]">Not configured</span>}
              {apiKeyStatus === "checking" && <span className="badge text-[9px] bg-gray-500/20 text-gray-400">Checking…</span>}
            </div>
            {apiKeyStatus === "missing" && (
              <p className="text-xs text-gray-500 mt-1">
                Add <code className="bg-[#111] px-1 py-0.5 rounded text-[#ffd801]">ANTHROPIC_API_KEY=sk-ant-...</code> to your <code className="bg-[#111] px-1 py-0.5 rounded text-[#ffd801]">.env</code> file and restart.
              </p>
            )}
            {apiKeyStatus === "ok" && <p className="text-xs text-gray-500 mt-0.5">AI generation is active and ready.</p>}
          </div>
          {apiKeyStatus === "ok" ? <CheckCircle size={16} className="text-green-400 shrink-0" /> : apiKeyStatus === "missing" ? <AlertCircle size={16} className="text-red-400 shrink-0" /> : null}
        </div>
      </div>

      {/* Profile */}
      <div className="card p-5">
        <h3 className="text-xs font-bold text-[#ffd801] uppercase tracking-widest mb-4">Your Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#ffd80115] border border-[#ffd80130] flex items-center justify-center text-base font-black text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{session.name}</p>
            <p className="text-gray-500 text-sm">{session.email}</p>
            <span className={`badge mt-1 inline-block ${session.role === "admin" ? "badge-gold" : "badge-blue"}`}>{session.role}</span>
          </div>
        </div>
      </div>

      {/* Auto-Update Schedule */}
      <div className="card p-5">
        <h3 className="text-xs font-bold text-[#ffd801] uppercase tracking-widest mb-1">Auto-Update Schedule</h3>
        <p className="text-gray-600 text-xs mb-4">Configure how many of each content type to generate daily at 08:30 AM</p>

        <div className="space-y-3 mb-5">
          {contentTypes.map(({ key, label, icon, color }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28">
                <span style={{ color }}>{icon}</span>
                <span className="text-sm text-white">{label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCounts((prev) => ({ ...prev, [key]: n }))}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                      counts[key] === n
                        ? "text-black border-transparent"
                        : "bg-[#111] border-[#2a2a2a] text-gray-500 hover:text-white"
                    }`}
                    style={counts[key] === n ? { background: color, borderColor: color } : {}}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-gray-600 text-xs ml-auto">
                {counts[key] === 0 ? "Skip" : `${counts[key]} ${counts[key] === 1 ? "item" : "items"}`}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[#1e1e1e]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            <span>Daily at 08:30 AM · <strong className="text-white">{totalItems} items</strong> total</span>
          </div>
          <button
            onClick={saveCounts}
            className={`ml-auto text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              countsSaved ? "bg-green-500/20 text-green-400" : "btn-outline"
            }`}
          >
            {countsSaved ? "✓ Saved" : "Save Settings"}
          </button>
        </div>

        {session.role === "admin" && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1a1a1a]">
            <button
              onClick={runScheduleNow}
              disabled={scheduleRunning}
              className="btn-outline text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {scheduleRunning ? <><Loader2 size={12} className="spin" />Running…</> : <><Play size={12} />Run Now</>}
            </button>
            {scheduleResult && (
              <p className={`text-xs ${scheduleResult.includes("Error") ? "text-red-400" : "text-green-400"}`}>
                {scheduleResult}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Team */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-[#ffd801] uppercase tracking-widest">Team Members</h3>
          {session.role === "admin" && (
            <button onClick={() => setShowNewUser(!showNewUser)} className="btn-gold text-xs py-1.5 px-3 flex items-center gap-1">
              <Plus size={12} />Add User
            </button>
          )}
        </div>

        {showNewUser && session.role === "admin" && (
          <div className="bg-[#0a0a0a] rounded-xl p-4 mb-4 border border-[#2a2a2a] fade-in">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" className="input" />
              <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" type="email" className="input" />
              <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" type="password" className="input" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="input">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {userError && <p className="text-red-400 text-xs mb-2">{userError}</p>}
            <div className="flex gap-2">
              <button onClick={createUser} disabled={creating} className="btn-gold text-xs py-1.5 flex items-center gap-1">
                {creating ? <><Loader2 size={12} className="spin" />Creating…</> : "Create User"}
              </button>
              <button onClick={() => setShowNewUser(false)} className="btn-ghost text-xs py-1.5">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6"><span className="inline-block w-5 h-5 border-2 border-[#ffd801] border-t-transparent rounded-full spin" /></div>
        ) : (
          <div className="divide-y divide-[#141414]">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#151515] border border-[#2a2a2a] flex items-center justify-center text-xs font-bold text-gray-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${user.role === "admin" ? "badge-gold" : "badge-blue"}`}>{user.role}</span>
                  {session.role === "admin" && user.id !== session.userId && (
                    <button onClick={() => deleteUser(user.id)} className="text-gray-700 hover:text-red-400 transition-colors p-1">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
