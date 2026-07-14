"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Bell, Server } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function Stations() {
  const [stations, setStations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    latitude: "",
    longitude: "",
    api_key: "",
    relay_address: ""
  });
  const [userRole, setUserRole] = useState<string>("viewer");

  useEffect(() => {
    const storedUser = localStorage.getItem("tusiro_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch(e) {}
    }
  }, []);

  // Thresholds state
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [newThreshold, setNewThreshold] = useState({
    sensor: "moisture",
    operator: "smaller",
    value1: "",
    value2: ""
  });

  const fetchThresholds = async (stationId: number) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/thresholds?station_id=${stationId}`);
      setThresholds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenThresholds = (st: any) => {
    setSelectedStation(st);
    fetchThresholds(st.id);
    setShowThresholdsModal(true);
  };

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/thresholds`, {
        station_id: selectedStation.id,
        sensor: newThreshold.sensor,
        operator: newThreshold.operator,
        value1: parseFloat(newThreshold.value1),
        value2: newThreshold.value2 ? parseFloat(newThreshold.value2) : null
      });
      fetchThresholds(selectedStation.id);
      setNewThreshold({ sensor: "moisture", operator: "smaller", value1: "", value2: "" });
    } catch (err) {
      console.error(err);
      MySwal.fire('Error', 'Failed to save threshold', 'error');
    }
  };

  const handleDeleteThreshold = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/thresholds/${id}`);
      fetchThresholds(selectedStation.id);
    } catch (err) {
      console.error(err);
      MySwal.fire('Error', 'Failed to delete threshold', 'error');
    }
  };

  const fetchStations = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stations`);
      setStations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/stations`, {
        ...formData,
        id: parseInt(formData.id)
      });
      setShowModal(false);
      fetchStations();
      setFormData({id: "", name: "", latitude: "", longitude: "", api_key: "", relay_address: ""});
      
      MySwal.fire({
        title: 'Success!',
        text: 'Station has been saved successfully.',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });
    } catch (err) {
      console.error(err);
      MySwal.fire({
        title: 'Error!',
        text: 'Failed to save station.',
        icon: 'error',
        confirmButtonColor: '#d97706'
      });
    }
  };

  const handleEdit = (st: any) => {
    setFormData({
      id: st.id.toString(),
      name: st.name,
      latitude: st.latitude,
      longitude: st.longitude,
      api_key: st.api_key,
      relay_address: st.relay_address
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Here you would call your delete API. 
        // For now, since the Python API doesn't have a DELETE endpoint yet, we just show error or dummy success
        MySwal.fire(
          'Not Implemented',
          'Delete API is not implemented yet in this version.',
          'info'
        );
      }
    });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Server className="w-8 h-8 text-green-600 dark:text-green-500" />
            Master Stations
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage logger devices and locations</p>
        </div>
        {userRole === "admin" && (
          <button 
            onClick={() => {
              setFormData({ id: "", name: "", latitude: "", longitude: "", api_key: "", relay_address: "" });
              setShowModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Add Station
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Location</th>
              <th className="p-4 font-semibold">API Key</th>
              <th className="p-4 font-semibold">Relay API</th>
              {userRole === "admin" && (
                <th className="p-4 font-semibold text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {stations.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">No stations registered yet.</td>
              </tr>
            )}
            {stations.map(st => (
              <tr key={st.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">{st.id}</td>
                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{st.name}</td>
                <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{st.latitude}, {st.longitude}</td>
                <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{st.api_key}</td>
                <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{st.relay_address}</td>
                {userRole === "admin" && (
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleOpenThresholds(st)} className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-md" title="Thresholds">
                      <Bell className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(st)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(st.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Existing Station Modal... */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold dark:text-white">Add New Station</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Station ID (Read Only on Edit)</label>
                <input required type="number" readOnly={formData.id !== "" && stations.some(s => s.id.toString() === formData.id)} value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 ${formData.id !== "" && stations.some(s => s.id.toString() === formData.id) ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Station Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">Latitude</label>
                  <input required value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">Longitude</label>
                  <input required value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">API Key</label>
                <input required value={formData.api_key} onChange={e => setFormData({...formData, api_key: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Relay Address</label>
                <input required value={formData.relay_address} onChange={e => setFormData({...formData, relay_address: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Save Station</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thresholds Modal */}
      {showThresholdsModal && selectedStation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold dark:text-white">Alert Thresholds</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure alerts for {selectedStation.name} (Station {selectedStation.id})</p>
              </div>
              <button onClick={() => setShowThresholdsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Trash2 className="w-5 h-5 hidden" /> <span className="font-bold text-xl leading-none">&times;</span></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-8">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Current Thresholds</h4>
                {thresholds.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">No thresholds configured for this station.</p>
                ) : (
                  <ul className="space-y-2">
                    {thresholds.map(th => (
                      <li key={th.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-sm dark:text-slate-300 text-slate-700">
                          <strong>{th.sensor.toUpperCase()}</strong> must be <strong>{th.operator}</strong> {th.value1} {th.operator === 'between' && `and ${th.value2}`}
                        </span>
                        <button onClick={() => handleDeleteThreshold(th.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Add New Threshold</h4>
                <form onSubmit={handleSaveThreshold} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Sensor</label>
                      <select required value={newThreshold.sensor} onChange={e => setNewThreshold({...newThreshold, sensor: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                        <option value="moisture">Moisture</option>
                        <option value="temperature">Temperature</option>
                        <option value="voltage">Voltage</option>
                        <option value="current">Current</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Condition</label>
                      <select required value={newThreshold.operator} onChange={e => setNewThreshold({...newThreshold, operator: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                        <option value="smaller">Smaller Than (&lt;)</option>
                        <option value="greater">Greater Than (&gt;)</option>
                        <option value="equal">Equal To (==)</option>
                        <option value="between">Between</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Value 1</label>
                      <input required type="number" step="any" value={newThreshold.value1} onChange={e => setNewThreshold({...newThreshold, value1: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 30" />
                    </div>
                    {newThreshold.operator === 'between' && (
                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Value 2</label>
                        <input required type="number" step="any" value={newThreshold.value2} onChange={e => setNewThreshold({...newThreshold, value2: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 50" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Threshold
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
