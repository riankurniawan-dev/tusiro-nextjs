"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("tusiro_token");
    if (!token && pathname !== "/login") {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">Loading...</div>;
  }

  // If on login page, don't show layout/sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 md:hidden">
          <h1 className="text-xl font-bold text-green-600 dark:text-green-500">Smart Tusiro</h1>
        </div>
        <div className="flex-1 overflow-y-auto relative flex flex-col">
          <Header />
          <div className="flex-1 p-6">
            {children}
          </div>
          <footer className="text-center py-4 text-xs font-medium text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
            © 2025 Pigeon Digitech Corp. Smart Tusiro Apps
          </footer>
        </div>
      </main>
    </>
  );
}
