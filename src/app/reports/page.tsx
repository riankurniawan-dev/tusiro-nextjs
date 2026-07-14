"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function Reports() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Columns selection
  const [cols, setCols] = useState({
    temperature: true,
    moisture: true,
    voltage: true,
    current: true,
    mode: true,
    relay1: false,
    relay2: false
  });

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stations`)
      .then(res => {
        setStations(res.data);
        if (res.data.length > 0) setSelectedStation(res.data[0].id.toString());
      })
      .catch(err => console.error(err));
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/reports?station_id=${selectedStation}`;
      if (startDate) url += `&start_date=${new Date(startDate).toISOString()}`;
      if (endDate) url += `&end_date=${new Date(endDate).toISOString()}`;
      
      const res = await axios.get(url);
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      MySwal.fire({
        title: 'Error!',
        text: 'Failed to fetch report data',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (reportData.length === 0) {
      return MySwal.fire('No Data', 'There is no data to export.', 'info');
    }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");
    
    // Build Headers
    const headers = ["Timestamp", "Device ID"];
    if (cols.temperature) headers.push("Temperature (°C)");
    if (cols.moisture) headers.push("Moisture (%)");
    if (cols.voltage) headers.push("Voltage (V)");
    if (cols.current) headers.push("Current (A)");
    if (cols.mode) headers.push("Mode");
    if (cols.relay1) headers.push("Relay 1");
    if (cols.relay2) headers.push("Relay 2");
    
    sheet.addRow(headers);
    
    reportData.forEach(row => {
      const rowData = [
        new Date(row.timestamp).toLocaleString(),
        row.device_id
      ];
      if (cols.temperature) rowData.push(row.temperature);
      if (cols.moisture) rowData.push(row.moisture);
      if (cols.voltage) rowData.push(row.voltage);
      if (cols.current) rowData.push(row.current);
      if (cols.mode) rowData.push(row.mode);
      if (cols.relay1) rowData.push(row.relay1);
      if (cols.relay2) rowData.push(row.relay2);
      sheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_Station_${selectedStation}.xlsx`;
    link.click();
  };

  const exportPDF = () => {
    if (reportData.length === 0) {
      return MySwal.fire('No Data', 'There is no data to export.', 'info');
    }
    const doc = new jsPDF();
    doc.text(`Watering Logger Report - Station ${selectedStation}`, 14, 15);
    
    const headers = ["Timestamp"];
    if (cols.temperature) headers.push("Temp(°C)");
    if (cols.moisture) headers.push("Moisture(%)");
    if (cols.voltage) headers.push("Volt(V)");
    if (cols.current) headers.push("Curr(A)");
    
    const body = reportData.map(row => {
      const rowData = [new Date(row.timestamp).toLocaleString()];
      if (cols.temperature) rowData.push(row.temperature);
      if (cols.moisture) rowData.push(row.moisture);
      if (cols.voltage) rowData.push(row.voltage);
      if (cols.current) rowData.push(row.current);
      return rowData;
    });

    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    
    doc.save(`Report_Station_${selectedStation}.pdf`);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Reports & Export</h2>
        <p className="text-slate-500 dark:text-slate-400">Download historical data as Excel or PDF</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Select Station</label>
            <select 
              value={selectedStation} 
              onChange={e => setSelectedStation(e.target.value)}
              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Choose Station --</option>
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.name} ({st.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Start Date</label>
            <input 
              type="datetime-local" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">End Date</label>
            <input 
              type="datetime-local" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" 
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleFetch}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? "Loading..." : "Preview Data"}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 dark:text-slate-200">Select Sensors to Export</label>
          <div className="flex flex-wrap gap-4">
            {Object.keys(cols).map((col) => (
              <label key={col} className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-md border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={cols[col as keyof typeof cols]} 
                  onChange={() => setCols({...cols, [col]: !cols[col as keyof typeof cols]})}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium capitalize dark:text-slate-300">{col}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5" /> Export Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <FileText className="w-5 h-5" /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">Data Preview ({reportData.length} records)</div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm">
                <th className="p-3">Timestamp</th>
                {cols.temperature && <th className="p-3">Temp</th>}
                {cols.moisture && <th className="p-3">Moisture</th>}
                {cols.voltage && <th className="p-3">Voltage</th>}
                {cols.current && <th className="p-3">Current</th>}
                {cols.mode && <th className="p-3">Mode</th>}
              </tr>
            </thead>
            <tbody>
              {reportData.slice(0, 100).map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm dark:text-slate-300">
                  <td className="p-3">{new Date(row.timestamp).toLocaleString()}</td>
                  {cols.temperature && <td className="p-3">{row.temperature}</td>}
                  {cols.moisture && <td className="p-3">{row.moisture}</td>}
                  {cols.voltage && <td className="p-3">{row.voltage}</td>}
                  {cols.current && <td className="p-3">{row.current}</td>}
                  {cols.mode && <td className="p-3">{row.mode}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.length > 100 && (
            <div className="p-4 text-center text-slate-500 text-sm italic">Showing first 100 records...</div>
          )}
        </div>
      </div>
    </div>
  );
}
