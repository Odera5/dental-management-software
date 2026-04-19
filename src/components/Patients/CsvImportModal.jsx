import React, { useState } from "react";
import Papa from "papaparse";
import { Upload, FileText, X, AlertCircle, Download } from "lucide-react";
import Modal from "../PatientRecord/Modal";
import Button from "../ui/Button";
import api from "../../services/api";

export default function CsvImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState([]);

  const downloadSampleCsv = () => {
    const csvContent = "Name,Age,Gender,Phone,Email,Address\nJohn Doe,35,Male,+1234567890,john@example.com,123 Main St\nJane Smith,28,Female,+0987654321,jane@example.com,456 Oak Ave";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "primuxcare_sample_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError(null);
    if (!selected) return;
    
    if (selected.type !== "text/csv" && !selected.name.endsWith(".csv")) {
      setError("Please select a valid CSV file.");
      return;
    }
    
    setFile(selected);

    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 3));
      },
      error: () => {
        setError("Failed to parse the CSV file.");
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedPatients = results.data.map(row => {
            const getVal = (keys) => {
               const k = Object.keys(row).find(header => keys.some(match => header.toLowerCase().includes(match)));
               return k ? row[k] : "";
            };

            return {
              name: getVal(["name", "patient", "first"]),
              age: getVal(["age", "dob", "birth", "year"]),
              gender: getVal(["gender", "sex"]),
              phone: getVal(["phone", "mobile", "contact", "cell"]),
              email: getVal(["email", "mail"]),
              address: getVal(["address", "location", "street"]),
            };
          });

          const validPatients = formattedPatients.filter(p => p.name && p.age);

          if (validPatients.length === 0) {
            setLoading(false);
            setError("Could not find any valid rows. Please ensure your CSV has 'Name' and 'Age' columns.");
            return;
          }

          const res = await api.post('/patients/import', { patients: validPatients });
          onSuccess(res.data.count);
        } catch (err) {
          setError(err.response?.data?.message || "An error occurred during import.");
          setLoading(false);
        }
      },
      error: () => {
        setError("Failed to parse the CSV file.");
        setLoading(false);
      }
    });
  };

  return (
    <Modal onClose={onClose}>
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">Import CSV</h2>
        <div className="flex items-center justify-between mt-1">
          <p className="text-slate-500 text-sm">Upload a spreadsheet of your legacy patient records.</p>
          <button 
            onClick={downloadSampleCsv} 
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 focus:outline-none"
          >
            <Download size={14} /> Sample CSV
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload size={32} className="text-slate-400 mb-2" />
            <p className="mb-1 text-sm text-slate-600"><span className="font-bold">Click to select</span></p>
            <p className="text-xs text-slate-500">CSV files only</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
        </label>

        {file && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-sm font-medium">
             <FileText size={18} className="text-blue-500" />
             <span className="truncate">{file.name}</span>
             <button onClick={() => { setFile(null); setPreview([]); }} className="ml-auto p-1 hover:bg-blue-100 rounded-md"><X size={16} /></button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm font-medium">
             <AlertCircle size={18} className="text-red-500 shrink-0" />
             {error}
          </div>
        )}

        {preview.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
             <div className="bg-slate-50 p-2 text-xs font-bold text-slate-500 px-4 border-b border-slate-200 uppercase tracking-widest">
               Data Preview (First 3 rows)
             </div>
             <div className="p-4 bg-white space-y-2">
               {preview.map((row, idx) => (
                 <div key={idx} className="text-xs text-slate-600 font-mono truncate">
                    {Object.entries(row).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                 </div>
               ))}
             </div>
             <div className="bg-slate-50 p-2 text-xs text-slate-500 px-4 border-t border-slate-200 italic">
                * We will automatically map Name, Age, Phone, Email, Address, and Gender.
             </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
           <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
           <Button onClick={handleImport} disabled={!file || loading} isLoading={loading} className="shadow-md">
             Import Patients
           </Button>
        </div>
      </div>
    </Modal>
  );
}
