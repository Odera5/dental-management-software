import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function VitalsChart({ records }) {
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    return records
      .filter(record => {
        const vitals = typeof record.vitals === 'string' ? JSON.parse(record.vitals || "{}") : (record.vitals || {});
        return vitals.bloodPressure || vitals.weight || vitals.heartRate || vitals.temperature;
      })
      .map(record => {
        const vitals = typeof record.vitals === 'string' ? JSON.parse(record.vitals || "{}") : (record.vitals || {});
        let systolic = null;
        let diastolic = null;
        
        if (vitals.bloodPressure) {
          const parts = vitals.bloodPressure.split('/');
          if (parts.length === 2) {
            systolic = parseInt(parts[0], 10);
            diastolic = parseInt(parts[1], 10);
          }
        }

        return {
          date: format(parseISO(record.createdAt), 'MMM dd, yyyy'),
          timestamp: new Date(record.createdAt).getTime(),
          weight: vitals.weight ? parseFloat(vitals.weight) : null,
          heartRate: vitals.heartRate ? parseInt(vitals.heartRate, 10) : null,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          systolic,
          diastolic,
          bloodPressure: vitals.bloodPressure || null
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Sort chronological
  }, [records]);

  if (chartData.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => {
            let val = entry.value;
            if (entry.dataKey === 'systolic' && entry.payload.bloodPressure) {
               val = entry.payload.bloodPressure + ' mmHg';
            } else if (entry.dataKey === 'weight') {
               val = val + ' kg';
            } else if (entry.dataKey === 'heartRate') {
               val = val + ' bpm';
            } else if (entry.dataKey === 'temperature') {
               val = val + ' °C';
            }
            if (entry.dataKey === 'diastolic') return null; // Don't show duplicate for BP
            return (
              <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
                {entry.name}: {val}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 mb-6">
      <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center">
        <span className="bg-rose-100 text-rose-500 p-1.5 rounded-lg mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        </span>
        Vitals Trend
      </h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickMargin={10} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Line yAxisId="left" type="monotone" name="Systolic BP" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
            <Line yAxisId="left" type="monotone" name="Diastolic BP" dataKey="diastolic" stroke="#fb7185" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
            <Line yAxisId="right" type="monotone" name="Weight (kg)" dataKey="weight" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
            <Line yAxisId="left" type="monotone" name="Heart Rate (bpm)" dataKey="heartRate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
