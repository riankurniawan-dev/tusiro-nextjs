"use client";

import { Activity, Thermometer, Droplets, Zap, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useStations } from "@/components/Providers";
import { useState } from "react";
import { evaluateThresholds } from "@/lib/utils";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-500">Loading Map...</div>
});

export default function Dashboard() {
  const { stations, latestData, thresholds } = useStations();
  const [showStationsModal, setShowStationsModal] = useState(false);

  // Compute stats
  const activeStations = stations.filter(st => {
    const data = latestData[st.id];
    if (!data) return false;
    return (Date.now() - new Date(data.timestamp).getTime()) < 30 * 60 * 1000;
  }).length;

  const inactiveStations = stations.length - activeStations;

  // Use dynamic thresholds for alerts
  const alertStations = stations.filter(st => {
    const data = latestData[st.id];
    if (!data) return false;
    const stationThresholds = thresholds.filter(t => t.station_id === st.id);
    return evaluateThresholds(data, stationThresholds);
  }).length;

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Live Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Monitor all your watering loggers in real-time</p>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative z-0">
        <MapComponent stations={stations} latestData={latestData} thresholds={thresholds} />

        {/* Floating Card - Bottom Left */}
        <button
          onClick={() => setShowStationsModal(true)}
          className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 min-w-[200px] text-left hover:scale-105 transition-transform cursor-pointer"
        >
          <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm uppercase tracking-wider">Station Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white">{activeStations}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Inactive</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white">{inactiveStations}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Alert</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white">{alertStations}</span>
            </div>
          </div>
        </button>
      </div>

      {showStationsModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">All Stations Status</h3>
              <button
                onClick={() => setShowStationsModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-0 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b dark:border-slate-800">Station Name</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b dark:border-slate-800">Status</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b dark:border-slate-800">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500 dark:text-slate-400">No stations registered.</td>
                    </tr>
                  )}
                  {stations.map(st => {
                    const data = latestData[st.id];
                    let status = "Inactive";
                    let statusColor = "text-slate-500";
                    let Icon = XCircle;

                    if (data) {
                      const isStale = (Date.now() - new Date(data.timestamp).getTime()) > 30 * 60 * 1000;
                      const isAlert = data.moisture < 10 || data.voltage < 11;

                      if (isStale) {
                        status = "Inactive";
                        statusColor = "text-slate-500";
                        Icon = XCircle;
                      } else if (isAlert) {
                        status = "Alert";
                        statusColor = "text-red-500";
                        Icon = AlertCircle;
                      } else {
                        status = "Active";
                        statusColor = "text-green-600 dark:text-green-500";
                        Icon = CheckCircle2;
                      }
                    }

                    return (
                      <tr key={st.id} className="border-b dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{st.name}</td>
                        <td className="p-4">
                          <div className={`flex items-center gap-1.5 ${statusColor}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{status}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                          {data ? new Date(data.timestamp).toLocaleString() : "No Data"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setShowStationsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
