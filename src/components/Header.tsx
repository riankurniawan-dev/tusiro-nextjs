"use client";

import { useEffect, useState, useRef } from "react";
import { User, Clock, Settings, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const [time, setTime] = useState<Date | null>(null);
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Set initial time
    setTime(new Date());

    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Get user from local storage
    const storedUser = localStorage.getItem("tusiro_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!time) return null; // Avoid hydration mismatch

  const formatServerTime = (date: Date) => {
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `Server Time : ${timeStr} ${dateStr}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("tusiro_token");
    localStorage.removeItem("tusiro_user");
    window.location.href = "/login";
  };

  return (
    <header className="h-16 px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center justify-end gap-6 z-50 sticky top-0">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">
          {formatServerTime(time)}
        </span>
      </div>
      
      <div className="relative border-l border-slate-200 dark:border-slate-700 pl-6" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 focus:outline-none group"
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800 dark:text-white leading-none group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {user?.username || "Guest"}
            </span>
            <span className="text-xs text-slate-500 capitalize mt-1 leading-none">
              {user?.role || "Viewer"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 flex items-center justify-center border border-green-200 dark:border-green-800 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
            <User className="w-5 h-5" />
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden py-1 z-[100]">
            <Link 
              href="/profile" 
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Settings className="w-4 h-4" /> User Profile
            </Link>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
