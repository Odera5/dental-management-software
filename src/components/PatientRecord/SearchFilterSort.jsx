import React, { useState, useEffect } from "react";
import { Search, Calendar, ArrowDownAZ, SortDesc } from "lucide-react";

export default function SearchFilterSort({ records, onFiltered }) {
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let filtered = [...records];

    if (searchText.trim()) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.presentingComplaint && r.presentingComplaint.toLowerCase().includes(text)) ||
          (r.diagnosis && r.diagnosis.toLowerCase().includes(text)) ||
          (r.history && r.history.toLowerCase().includes(text))
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((r) => new Date(r.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((r) => new Date(r.createdAt) <= end);
    }

    if (sortOption === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortOption === "diagnosis") {
      filtered.sort((a, b) => (a.diagnosis || "").localeCompare(b.diagnosis || ""));
    }

    onFiltered(filtered, searchText);
  }, [records, searchText, sortOption, startDate, endDate]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 group focus-within:border-primary-300 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-slate-400" /></div>
          <input
            type="text"
            placeholder="Search by complaint, diagnosis or history..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-colors"
          />
        </div>

        <div className="md:col-span-2 relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center"><Calendar size={12} className="mr-1"/> From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>

        <div className="md:col-span-2 relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center"><Calendar size={12} className="mr-1"/> To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>

        <div className="md:col-span-3 relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center"><SortDesc size={12} className="mr-1"/> Sort By</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-3 pr-8 py-2.5 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm appearance-none"
          >
            <option value="recent">Most Recent First</option>
            <option value="oldest">Oldest First</option>
            <option value="diagnosis">Diagnosis (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
