"use client";

import { MapContainer, TileLayer, Marker, Popup, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Thermometer, Droplets, Zap } from "lucide-react";
import { evaluateThresholds } from "@/lib/utils";

// Helper function to create custom icons
const createCustomIcon = (status: "normal" | "inactive" | "alert") => {
  let auraHtml = "";
  
  if (status === "inactive") {
    // Red pulsating aura for inactive
    auraHtml = `
      <div class="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center z-0 translate-y-[-4px]">
        <div class="animate-ping absolute w-full h-full rounded-full bg-red-500 opacity-75"></div>
        <div class="absolute w-10 h-10 rounded-full bg-red-600 opacity-80"></div>
      </div>
    `;
  } else if (status === "alert") {
    // Yellow pulsating aura for alert
    auraHtml = `
      <div class="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center z-0 translate-y-[-4px]">
        <div class="animate-ping absolute w-full h-full rounded-full bg-yellow-400 opacity-75"></div>
        <div class="absolute w-10 h-10 rounded-full bg-yellow-500 opacity-80"></div>
      </div>
    `;
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative w-12 h-12 flex items-center justify-center">
             ${auraHtml}
             <img src="/marker.png" class="absolute z-10 drop-shadow-lg w-full h-full object-contain" />
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -40],
  });
};

const iconNormal = createCustomIcon("normal");
const iconInactive = createCustomIcon("inactive");
const iconAlert = createCustomIcon("alert");

export default function MapComponent({ stations, latestData, thresholds }: { stations: any[], latestData: Record<number, any>, thresholds: any[] }) {
  const center: [number, number] = stations.length > 0 
    ? [parseFloat(stations[0].latitude), parseFloat(stations[0].longitude)] 
    : [-7.0375, 107.5354];

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Street Mode (OSM)">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer checked name="Satellite Mode (Esri)">
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      {stations.map(station => {
        const data = latestData[station.id];
        const stationThresholds = thresholds.filter(t => t.station_id === station.id);
        
        let status: "normal" | "inactive" | "alert" = "inactive"; // Default to inactive if no data
        
        if (data) {
          const isStale = (Date.now() - new Date(data.timestamp).getTime()) > 30 * 60 * 1000;
          const isAlert = evaluateThresholds(data, stationThresholds);
          
          if (isStale) status = "inactive";
          else if (isAlert) status = "alert";
          else status = "normal";
        }

        let iconToUse = iconNormal;
        if (status === "inactive") iconToUse = iconInactive;
        if (status === "alert") iconToUse = iconAlert;

        return (
          <Marker 
            key={station.id} 
            position={[parseFloat(station.latitude), parseFloat(station.longitude)]}
            icon={iconToUse}
            eventHandlers={{
              click: (e) => {
                const map = e.target._map;
                map.flyTo(e.target.getLatLng(), 16, {
                  animate: true,
                  duration: 0.5
                });
              }
            }}
          >
            <Popup closeButton={true} className="custom-popup">
              <div className="font-sans">
                <h3 className="font-bold text-center text-base mb-3.5 text-slate-900 dark:text-white">
                  Site Information
                </h3>
                
                <table className="w-full text-[13px] border-collapse mb-3">
                  <tbody>
                    {[
                      { label: 'Name', value: station.name },
                      { label: 'Station Type', value: 'Normal Station' },
                      { label: 'Latitude', value: parseFloat(station.latitude).toFixed(6) },
                      { label: 'Longitude', value: parseFloat(station.longitude).toFixed(6) },
                      { label: 'Last Update', value: data ? new Date(data.timestamp).toLocaleString('sv-SE') : 'No Data' },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="py-1 text-slate-600 dark:text-slate-400 whitespace-nowrap align-top">{row.label}</td>
                        <td className="py-1 px-1.5 text-slate-500 dark:text-slate-500 align-top w-2">:</td>
                        <td className="py-1 font-semibold text-slate-900 dark:text-white align-top">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <Link 
                  href={`/monitoring/${station.id}`}
                  className="block w-full text-center bg-[#0d94a6] hover:bg-[#0b7a8a] text-white py-2 rounded-md font-semibold text-sm transition-colors shadow-sm !text-white"
                  style={{ marginBottom: status === 'inactive' && data ? '12px' : '0' }}
                >
                  Go to Monitoring
                </Link>

                {status === "inactive" && data && (
                  <div style={{ color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ fontWeight: 700, marginTop: -1 }}>•</span> 
                    <span style={{ lineHeight: 1.4 }}>
                      Station does not update in {
                        (() => {
                          const diffMs = Date.now() - new Date(data.timestamp).getTime();
                          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                          const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
                          const parts: string[] = [];
                          if (days > 0) parts.push(`${days} Days`);
                          if (hours > 0) parts.push(`${hours} Hour`);
                          parts.push(`${minutes} Minute`);
                          return parts.join(" ");
                        })()
                      }
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
