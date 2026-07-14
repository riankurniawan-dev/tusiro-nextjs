"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Thermometer, Droplets, Zap, Activity } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// Custom SVG Gauge Component
const Gauge = ({ value, max, label, color, unit }: { value: number | null, max: number, label: string, color: string, unit: string }) => {
  const val = value || 0;
  const percentage = Math.min(100, Math.max(0, (val / max) * 100));
  const r = 45;
  const cx = 50;
  const cy = 50;
  const circumference = Math.PI * r;
  const dashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 100 55" className="w-full max-w-[160px] drop-shadow-sm">
        {/* Background track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-100 dark:text-slate-800"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="-mt-5 text-center flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800 dark:text-white">{val.toFixed(2)}</span>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{unit}</span>
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
      <div className="flex justify-between w-full max-w-[140px] text-[10px] font-semibold text-slate-400 mt-2 px-2">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default function StationMonitoring() {
  const params = useParams();
  const stationId = params.id as string;
  
  const [station, setStation] = useState<any>(null);
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [currentData, setCurrentData] = useState<any>(null);
  
  // Relay states
  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);

  useEffect(() => {
    // Fetch station info
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stations`)
      .then(res => {
        const st = res.data.find((s: any) => s.id === parseInt(stationId));
        setStation(st);
      })
      .catch(err => console.error(err));

    // Fetch initial latest data
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reports?station_id=${stationId}`)
      .then(res => {
        const history = res.data; // returns descending order
        if (history && history.length > 0) {
          const latest = history[0];
          setCurrentData(latest);
          if (latest.relay1) setRelay1(latest.relay1 === "ON");
          if (latest.relay2) setRelay2(latest.relay2 === "ON");
          
          // Build chart data (take up to 20, reverse for chronological order)
          const chartData = history.slice(0, 20).reverse().map((d: any) => ({
            time: new Date(d.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temperature: d.temperature,
            moisture: d.moisture
          }));
          setDataHistory(chartData);
        }
      })
      .catch(err => console.error(err));

    // WebSocket connection
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws");
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_data" && message.data.station_id === parseInt(stationId)) {
          const newData = message.data;
          setCurrentData(newData);
          
          // Update relay state from logger report
          if (newData.relay1) setRelay1(newData.relay1 === "ON");
          if (newData.relay2) setRelay2(newData.relay2 === "ON");
          
          // Append to history for chart (keep last 20)
          setDataHistory(prev => {
            const newHistory = [...prev, {
              time: new Date(newData.timestamp).toLocaleTimeString(),
              temperature: newData.temperature,
              moisture: newData.moisture
            }];
            if (newHistory.length > 20) return newHistory.slice(-20);
            return newHistory;
          });
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    return () => ws.close();
  }, [stationId]);

  const toggleRelay = async (relayNum: number, state: boolean) => {
    if (relayNum === 1) setRelay1(state);
    if (relayNum === 2) setRelay2(state);
    
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/relay?station_id=${stationId}&relay_num=${relayNum}&state=${state ? "ON" : "OFF"}`);
      MySwal.fire({
        title: 'Success!',
        text: `Relay ${relayNum} turned ${state ? "ON" : "OFF"}`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      MySwal.fire({
        title: 'Error!',
        text: 'Failed to toggle relay',
        icon: 'error',
      });
      // Revert state on error
      if (relayNum === 1) setRelay1(!state);
      if (relayNum === 2) setRelay2(!state);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-10">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/50">
        <div>
          <div className="text-sm font-semibold text-green-600 dark:text-green-500 mb-1">
            <Link href="/" className="hover:underline">Dashboard</Link> / Station {stationId}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{station?.name || "Loading..."}</h2>
            {currentData && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Last Update: {new Date(currentData.timestamp).toLocaleString('sv-SE')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-white dark:bg-slate-800 px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center space-x-3">
            <Switch id="relay1" checked={relay1} onCheckedChange={(c) => toggleRelay(1, c)} />
            <Label htmlFor="relay1" className="font-semibold text-slate-700 dark:text-slate-300">Relay 1 (Pump)</Label>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${relay1 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
              {relay1 ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>
          <div className="flex items-center space-x-3">
            <Switch id="relay2" checked={relay2} onCheckedChange={(c) => toggleRelay(2, c)} />
            <Label htmlFor="relay2" className="font-semibold text-slate-700 dark:text-slate-300">Relay 2 (Valve)</Label>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${relay2 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
              {relay2 ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full"><Thermometer className="w-8 h-8 text-orange-500" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Temperature</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{currentData?.temperature || "--"} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">°C</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full"><Droplets className="w-8 h-8 text-blue-500" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Moisture</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{currentData?.moisture || "--"} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">%</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full"><Zap className="w-8 h-8 text-yellow-500" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Voltage</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{currentData?.voltage || "--"} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">V</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full"><Activity className="w-8 h-8 text-green-500" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Current</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{currentData?.current || "--"} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">A</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Live Sensor Trends</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }} 
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={3} dot={false} name="Temperature (°C)" />
                <Line yAxisId="right" type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} dot={false} name="Moisture (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gauge Charts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Power Metrics</h3>
          <div className="flex flex-col gap-10 flex-1 justify-center">
            <Gauge 
              value={currentData?.voltage} 
              max={14} 
              label="Voltage" 
              color="#eab308" 
              unit="V" 
            />
            <Gauge 
              value={currentData?.current} 
              max={5} 
              label="Current" 
              color="#22c55e" 
              unit="A" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
