"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, User, Lock } from "lucide-react";
import axios from "axios";

const bgImages = ["/bg1-login.jpg", "/bg2-login.jpg", "/bg3-login.jpg"];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentBg, setCurrentBg] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Auto-rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        username,
        password
      });
      
      localStorage.setItem("tusiro_token", res.data.access_token);
      localStorage.setItem("tusiro_user", JSON.stringify(res.data.user));
      
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Background Slideshow */}
      {bgImages.map((img, index) => (
        <div
          key={img}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: `url(${img})`,
            opacity: index === currentBg ? 1 : 0,
            zIndex: 0
          }}
        />
      ))}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30 z-[1]" />

      {/* Login Card - Left Side */}
      <div className="relative z-10 flex items-center justify-start w-full px-8 md:px-20">
        <div className="w-full max-w-[420px] bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 md:p-10">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back!</h1>
            <p className="text-slate-400 text-sm mt-2">Please fill in your Username and Password to Sign In</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-xs text-slate-500 text-center mt-8 leading-relaxed">
            By continuing, you&apos;re confirming that you&apos;ve read our{" "}
            <span className="text-green-400 hover:underline cursor-pointer">Terms &amp; Conditions</span> and{" "}
            <span className="text-green-400 hover:underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* Slideshow Indicator Dots - Bottom Right */}
      <div className="absolute bottom-8 right-8 z-10 flex gap-2">
        {bgImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBg(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              index === currentBg 
                ? "bg-white w-8" 
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 text-center py-4">
        <p className="text-sm text-white/95 font-medium drop-shadow-md tracking-wide">© 2025 Pigeon Digitech Corp. Smart Tusiro Apps</p>
      </div>
    </div>
  );
}
