"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ffd801]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.svg" alt="Bali Business Club" className="h-14 w-auto" />
            <div className="flex items-center gap-2">
              <div className="h-px w-12 bg-[#096cfe]/50" />
              <span className="text-[#096cfe] text-xs tracking-[0.25em] uppercase font-medium">Marketing Team</span>
              <div className="h-px w-12 bg-[#096cfe]/50" />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black mb-1 text-white tracking-wide" style={{ fontFamily: 'Oswald, sans-serif' }}>
            SIGN IN
          </h1>
          <p className="text-gray-500 text-xs mb-6">Access the content dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-widest">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="input"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-widest">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="input"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <span className="text-red-500">!</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 text-sm font-bold disabled:opacity-50 tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="spin" />Signing in…</> : <><LogIn size={16} />SIGN IN</>}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-6 tracking-wider uppercase">
          © 2026 Bali Business Club · Internal Use Only
        </p>
      </div>
    </div>
  );
}
