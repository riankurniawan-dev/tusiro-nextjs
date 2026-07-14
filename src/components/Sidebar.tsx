"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Server, FileText, Activity, Moon, Sun, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Users, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useStations } from "./Providers";

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { stations, latestData } = useStations();
  const [isSiteOpen, setIsSiteOpen] = useState(true);

  useEffect(() => setMounted(true), []);

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex h-full">
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-green-600 dark:text-green-500 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          Smart Tusiro
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Map className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <div>
          <button
            onClick={() => setIsSiteOpen(!isSiteOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5" />
              <span>Site Monitoring</span>
            </div>
            {isSiteOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {isSiteOpen && (
            <div className="mt-1 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
              {stations.map(st => {
                const isActive = latestData[st.id] && (Date.now() - new Date(latestData[st.id].timestamp).getTime() < 30 * 60 * 1000);
                return (
                  <Link
                    key={st.id}
                    href={`/monitoring/${st.id}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname === `/monitoring/${st.id}` ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="truncate">{st.name}</span>
                  </Link>
                );
              })}
              {stations.length === 0 && (
                <div className="px-3 py-1.5 text-sm text-slate-400 italic">No stations</div>
              )}
            </div>
          )}
        </div>

        <Link href="/stations" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/stations' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Server className="w-5 h-5" />
          <span>Master Data</span>
        </Link>
        <Link href="/reports" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/reports' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <FileText className="w-5 h-5" />
          <span>Reports</span>
        </Link>
        <Link href="/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/users' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Users className="w-5 h-5" />
          <span>User Management</span>
        </Link>
        <Link href="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/settings' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Settings className="w-5 h-5" />
          <span>Notification Settings</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
