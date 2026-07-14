"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

type Station = {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  api_key: string;
  relay_address: string;
};

type Threshold = {
  id: number;
  station_id: number;
  sensor: string;
  operator: string;
  value1: number;
  value2: number | null;
};

type StationContextType = {
  stations: Station[];
  refreshStations: () => void;
  latestData: Record<number, any>;
  thresholds: Threshold[];
};

const StationContext = createContext<StationContextType>({
  stations: [],
  refreshStations: () => {},
  latestData: {},
  thresholds: []
});

export const useStations = () => useContext(StationContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [latestData, setLatestData] = useState<Record<number, any>>({});
  const [thresholds, setThresholds] = useState<Threshold[]>([]);

  const refreshStations = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stations`);
      setStations(res.data);
      
      const latestRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/latest-data`);
      setLatestData(latestRes.data);
      
      const thRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/thresholds`);
      setThresholds(thRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshStations();

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws");
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "new_data") {
            setLatestData(prev => ({
              ...prev,
              [message.data.station_id]: message.data
            }));
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimer = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on unmount
        ws.close();
      }
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StationContext.Provider value={{ stations, refreshStations, latestData, thresholds }}>
        {children}
      </StationContext.Provider>
    </ThemeProvider>
  );
}
