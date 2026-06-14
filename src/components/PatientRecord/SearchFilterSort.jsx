import React, { useEffect } from "react";
import { Search, Calendar, SortDesc } from "lucide-react";
import usePersistentState from "../../hooks/usePersistentState";

export default function SearchFilterSort({
  filters: externalFilters,
  onChange,
  storageKey = "primuxcare:draft:record-search",
}) {
  const [storedFilters, setStoredFilters] = usePersistentState(storageKey, {
    searchText: "",
    sortOption: "recent",
    startDate: "",
    endDate: "",
  });
  const activeFilters = externalFilters || storedFilters || {};
  const {
    searchText = "",
    sortOption = "recent",
    startDate = "",
    endDate = "",
  } = activeFilters;

  // Local state for responsive typing
  const [localSearchText, setLocalSearchText] = React.useState(searchText);

  useEffect(() => {
    if (!externalFilters) return;
    setStoredFilters(externalFilters);
  }, [externalFilters, setStoredFilters]);

  // Keep local search query in sync if the external searchText gets updated or reset
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  // Debounce API calls/updates when typing
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearchText !== searchText) {
        const nextFilters = { ...activeFilters, searchText: localSearchText };
        setStoredFilters(nextFilters);
        onChange?.(nextFilters);
      }
    }, 700); // 700ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchText]);

  const updateFilters = (patch) => {
    const nextFilters = { ...activeFilters, ...patch };
    setStoredFilters(nextFilters);
    onChange?.(nextFilters);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 group focus-within:border-primary-300 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-slate-400" /></div>
          <input
            type="text"
            placeholder="Search by complaint, diagnosis or history..."
            value={localSearchText}
            onChange={(e) => setLocalSearchText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-colors"
          />
        </div>

        <div className="md:col-span-2 relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center"><Calendar size={12} className="mr-1"/> From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateFilters({ startDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>

        <div className="md:col-span-2 relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center"><Calendar size={12} className="mr-1"/> To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateFilters({ endDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>

        <div className="md:col-span-3 relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center"><SortDesc size={12} className="mr-1"/> Sort By</label>
          <select
            value={sortOption}
            onChange={(e) => updateFilters({ sortOption: e.target.value })}
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
