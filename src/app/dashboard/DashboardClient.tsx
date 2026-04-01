"use client";

import { useState } from "react";
import { Session } from "@/lib/auth";
import StoriesTab from "@/components/StoriesTab";
import CarouselTab from "@/components/CarouselTab";
import ReelsTab from "@/components/ReelsTab";
import ReportsTab from "@/components/ReportsTab";
import FavoritesTab from "@/components/FavoritesTab";
import TaskBoardTab from "@/components/TaskBoardTab";
import IdeasTab from "@/components/IdeasTab";
import SettingsTab from "@/components/SettingsTab";
import {
  Smartphone, Layers, Film, BarChart2, Heart,
  Kanban, Lightbulb, Settings, LogOut, Menu, Clock,
} from "lucide-react";

type Tab = "stories" | "carousel" | "reels" | "reports" | "favorites" | "tasks" | "ideas" | "settings";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "stories",   label: "Stories",    icon: <Smartphone size={15} /> },
  { id: "carousel",  label: "Carousel",   icon: <Layers size={15} /> },
  { id: "reels",     label: "Reels",      icon: <Film size={15} /> },
  { id: "reports",   label: "Reports",    icon: <BarChart2 size={15} /> },
  { id: "favorites", label: "Favorites",  icon: <Heart size={15} /> },
  { id: "tasks",     label: "Task Board", icon: <Kanban size={15} /> },
  { id: "ideas",     label: "Ideas",      icon: <Lightbulb size={15} /> },
  { id: "settings",  label: "Settings",   icon: <Settings size={15} /> },
];

export default function DashboardClient({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState<Tab>("stories");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} transition-all duration-200 bg-[#080808] border-r border-[#181818] flex flex-col shrink-0`}>
        {/* Brand */}
        <div className={`border-b border-[#181818] flex items-center ${sidebarOpen ? "px-4 py-4 gap-3" : "px-0 py-4 justify-center"}`}>
          {sidebarOpen ? (
            <div>
              <p className="text-[#ffd801] font-black text-sm leading-tight tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
                BALI BUSINESS CLUB
              </p>
              <p className="text-[#096cfe] text-[9px] tracking-[0.2em] uppercase mt-0.5">Marketing Team</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#ffd801] flex items-center justify-center font-black text-black text-sm">B</div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                activeTab === item.id
                  ? "bg-[#ffd801] text-black font-bold"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate text-[13px]">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 pb-3 border-t border-[#181818] pt-3 space-y-1">
          {sidebarOpen && (
            <div className="px-2.5 py-1.5 mb-1">
              <p className="text-xs font-semibold text-white truncate">{session.name}</p>
              <p className="text-[10px] text-gray-600 truncate">{session.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={13} className="shrink-0" />
            {sidebarOpen && "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Topbar */}
        <div className="border-b border-[#181818] px-5 py-3 flex items-center gap-3 bg-[#080808] shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-white p-1 rounded transition-colors">
            <Menu size={17} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-[13px] font-black text-[#ffd801] tracking-[0.1em] uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-600">
            <Clock size={11} />
            <span>Auto-update <span className="text-[#096cfe]">08:30 daily</span></span>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto bg-[#050505]">
          {activeTab === "stories"   && <StoriesTab session={session} />}
          {activeTab === "carousel"  && <CarouselTab session={session} />}
          {activeTab === "reels"     && <ReelsTab session={session} />}
          {activeTab === "reports"   && <ReportsTab session={session} />}
          {activeTab === "favorites" && <FavoritesTab session={session} />}
          {activeTab === "tasks"     && <TaskBoardTab session={session} />}
          {activeTab === "ideas"     && <IdeasTab session={session} />}
          {activeTab === "settings"  && <SettingsTab session={session} />}
        </div>
      </main>
    </div>
  );
}
