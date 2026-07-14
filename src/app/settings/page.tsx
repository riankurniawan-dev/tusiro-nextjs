"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Save, Bell, Mail, MessageSquare } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function NotificationSettings() {
  const [formData, setFormData] = useState({
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: "",
    telegram_bot_token: "",
    telegram_chat_id: ""
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("viewer");

  useEffect(() => {
    const storedUser = localStorage.getItem("tusiro_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch(e) {}
    }
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notification-settings`);
        if (res.data) {
          setFormData({
            smtp_host: res.data.smtp_host || "",
            smtp_port: res.data.smtp_port ? res.data.smtp_port.toString() : "",
            smtp_user: res.data.smtp_user || "",
            smtp_pass: res.data.smtp_pass || "",
            telegram_bot_token: res.data.telegram_bot_token || "",
            telegram_chat_id: res.data.telegram_chat_id || ""
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notification-settings`, {
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port ? parseInt(formData.smtp_port) : null,
        smtp_user: formData.smtp_user,
        smtp_pass: formData.smtp_pass,
        telegram_bot_token: formData.telegram_bot_token,
        telegram_chat_id: formData.telegram_chat_id
      });
      
      MySwal.fire({
        title: 'Success!',
        text: 'Notification settings have been updated.',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });
    } catch (err) {
      console.error(err);
      MySwal.fire({
        title: 'Error!',
        text: 'Failed to update settings.',
        icon: 'error',
        confirmButtonColor: '#d97706'
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-green-600 dark:text-green-500" />
            Notification Settings
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure SMTP and Telegram for alert notifications</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex-1 overflow-y-auto">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* SMTP Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" /> Email (SMTP) Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">SMTP Host</label>
                <input disabled={userRole !== "admin"} value={formData.smtp_host} onChange={e => setFormData({...formData, smtp_host: e.target.value})} className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 ${userRole !== 'admin' ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">SMTP Port</label>
                <input disabled={userRole !== "admin"} type="number" value={formData.smtp_port} onChange={e => setFormData({...formData, smtp_port: e.target.value})} className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 ${userRole !== 'admin' ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} placeholder="587" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">SMTP Username</label>
                <input disabled={userRole !== "admin"} value={formData.smtp_user} onChange={e => setFormData({...formData, smtp_user: e.target.value})} className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 ${userRole !== 'admin' ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">SMTP Password</label>
                <input disabled={userRole !== "admin"} type="password" value={formData.smtp_pass} onChange={e => setFormData({...formData, smtp_pass: e.target.value})} className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 ${userRole !== 'admin' ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} placeholder="••••••••" />
              </div>
            </div>
          </div>

          {/* Telegram Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" /> Telegram Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Bot Token</label>
                <input disabled={userRole !== "admin"} value={formData.telegram_bot_token} onChange={e => setFormData({...formData, telegram_bot_token: e.target.value})} className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 ${userRole !== 'admin' ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Chat ID</label>
                <input disabled={userRole !== "admin"} value={formData.telegram_chat_id} onChange={e => setFormData({...formData, telegram_chat_id: e.target.value})} className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 ${userRole !== 'admin' ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} placeholder="-100123456789" />
              </div>
            </div>
          </div>

          {userRole === "admin" && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                <Save className="w-5 h-5" /> Save Settings
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
