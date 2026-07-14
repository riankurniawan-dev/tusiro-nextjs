"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { User, Lock, Save, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function UserProfile() {
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("tusiro_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setFormData({ ...formData, username: parsed.username });
      } catch (e) {}
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updatePayload: any = {};
      if (formData.username !== user.username) {
        updatePayload.username = formData.username;
      }
      if (formData.password) {
        updatePayload.password = formData.password;
      }

      if (Object.keys(updatePayload).length === 0) {
        MySwal.fire({
          title: 'No Changes',
          text: 'There is nothing to update.',
          icon: 'info',
        });
        return;
      }

      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}`, updatePayload);
      
      // Update local storage
      const updatedUser = { ...user, username: res.data.username };
      localStorage.setItem("tusiro_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setFormData({ ...formData, password: "" }); // Clear password field
      
      MySwal.fire({
        title: 'Success!',
        text: 'Profile updated successfully.',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });
      
      // We might need to refresh the page so the Header picks up the new username
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      MySwal.fire({
        title: 'Error!',
        text: err.response?.data?.detail || 'Failed to update profile.',
        icon: 'error',
        confirmButtonColor: '#d97706'
      });
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <User className="w-8 h-8 text-green-600 dark:text-green-500" />
            User Profile
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Update your account credentials</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 md:p-8">
          
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 flex items-center justify-center border border-green-200 dark:border-green-800">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user.username}</h3>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                Role: <span className="uppercase text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md text-xs">{user.role}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  required 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all" 
                  placeholder="Your username" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">New Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {user.username === "admin" && formData.username !== "admin" && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">You are about to change the default admin username. Please remember your new username for future logins.</p>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-green-500/20"
              >
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
