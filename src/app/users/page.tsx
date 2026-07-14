"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "viewer"
  });
  const [userRole, setUserRole] = useState<string>("viewer");

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    const storedUser = localStorage.getItem("tusiro_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch(e) {}
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, formData);
      setShowModal(false);
      fetchUsers();
      setFormData({ username: "", password: "", role: "viewer" });
      
      MySwal.fire({
        title: 'Success!',
        text: 'User created successfully.',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });
    } catch (err: any) {
      console.error(err);
      MySwal.fire({
        title: 'Error!',
        text: err.response?.data?.detail || 'Failed to save user.',
        icon: 'error',
        confirmButtonColor: '#d97706'
      });
    }
  };

  const handleDelete = (id: number, username: string) => {
    if (username === 'admin') {
      MySwal.fire('Error', 'Cannot delete default admin user', 'error');
      return;
    }
    MySwal.fire({
      title: 'Are you sure?',
      text: `You want to delete user ${username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`);
          fetchUsers();
          MySwal.fire('Deleted!', 'User has been deleted.', 'success');
        } catch (err) {
          MySwal.fire('Error', 'Failed to delete user.', 'error');
        }
      }
    });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600 dark:text-green-500" />
            User Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage admin and viewer access</p>
        </div>
        {userRole === "admin" && (
          <button 
            onClick={() => {
              setFormData({ username: "", password: "", role: "viewer" });
              setShowModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Add User
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Username</th>
              <th className="p-4 font-semibold">Role</th>
              {userRole === "admin" && (
                <th className="p-4 font-semibold text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">Loading users...</td>
              </tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{u.id}</td>
                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{u.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                {userRole === "admin" && (
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleDelete(u.id, u.username)} disabled={u.username === 'admin'} className={`p-2 rounded-md ${u.username === 'admin' ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">Add New User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><span className="text-2xl leading-none">&times;</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Username</label>
                <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="johndoe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
