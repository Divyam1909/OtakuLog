
import React, { useRef } from 'react';
import { Icons } from '../components/Icons';

interface SettingsViewProps {
  onImport: (data: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const library = localStorage.getItem('otakulog_library_v1') || '[]';
    const groups = localStorage.getItem('otakulog_groups_v1') || '[]';
    const profile = localStorage.getItem('otakulog_profile_v1') || '{}';

    const data = {
      library: JSON.parse(library),
      groups: JSON.parse(groups),
      profile: JSON.parse(profile),
      exportedAt: new Date().toISOString(),
      version: 1
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otakulog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.library && Array.isArray(json.library)) {
           if (window.confirm("This will overwrite your current library. Are you sure?")) {
             onImport(json);
             alert("Library restored successfully!");
           }
        } else {
            alert("Invalid backup file.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    // Reset
    e.target.value = ''; 
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen animate-in fade-in">
      <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
      <p className="text-slate-400 mb-8">Manage your data and preferences.</p>

      <div className="space-y-6">
        {/* Data Management Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
           <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
             <Icons.Library className="text-indigo-400" /> Data Management
           </h2>
           <p className="text-sm text-slate-400 mb-6">
             Your data is stored locally in your browser. Use Backup to save a copy to your device, or Restore to load a previous backup.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all group"
              >
                 <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                    <Icons.Download size={24} />
                 </div>
                 <div className="text-left">
                    <div className="font-bold text-white">Backup Data</div>
                    <div className="text-xs text-slate-400">Download .json file</div>
                 </div>
              </button>

              <button 
                onClick={handleImportClick}
                className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all group"
              >
                 <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                    <Icons.Upload size={24} />
                 </div>
                 <div className="text-left">
                    <div className="font-bold text-white">Restore Data</div>
                    <div className="text-xs text-slate-400">Import .json file</div>
                 </div>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                 />
              </button>
           </div>
        </section>

        {/* About Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">About OtakuLog</h2>
            <div className="space-y-4 text-slate-400 text-sm">
                <p>
                    OtakuLog is a privacy-first tracking application. All your data lives on your device. 
                    We use Jikan API (MyAnimeList) and Google Books API to fetch metadata.
                </p>
                <div className="flex gap-4 pt-2">
                    <a href="#" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>
                    <a href="#" className="text-indigo-400 hover:text-indigo-300">Terms of Service</a>
                    <span className="text-slate-600">v1.0.0</span>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};
