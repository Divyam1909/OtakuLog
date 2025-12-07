
import React, { useState, useEffect } from 'react';
import { MediaItem, SearchResultItem, MediaDetails, UserStatus, MediaType } from '../types';
import { getMediaDetails } from '../services/api';
import { Icons } from '../components/Icons';
import { getPlaceholderImage } from '../utils';

interface DetailViewProps {
  item: MediaItem | SearchResultItem;
  libraryItem?: MediaItem; // Existing data if in library
  onBack: () => void;
  onSave: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ item, libraryItem, onBack, onSave, onDelete }) => {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [formData, setFormData] = useState<Partial<MediaItem>>({});
  const [loading, setLoading] = useState(true);
  
  // Mobile Tracking Sheet State
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  // Initialize Data
  useEffect(() => {
    const init = async () => {
        setLoading(true);
        // 1. Setup Form Data from Library or Default
        if (libraryItem) {
            setFormData({ ...libraryItem });
        } else {
            setFormData({
                ...item,
                userStatus: UserStatus.PLAN_TO_READ,
                userProgress: 0,
                userScore: 0,
                addedAt: Date.now(),
                updatedAt: Date.now(),
            } as MediaItem);
        }

        // 2. Fetch Rich Details
        const enriched = await getMediaDetails(item);
        setDetails(enriched);
        setLoading(false);
    };
    init();
  }, [item, libraryItem]);

  const handleSave = () => {
    if (formData.id) {
        // Merge enriched details (like coverUrl upgrade) if saving
        const toSave = { ...formData, coverUrl: details?.coverUrl || formData.coverUrl } as MediaItem;
        onSave(toSave);
        setShowMobileSheet(false);
        // Optional: onBack(); 
        // alert('Saved to Library!'); 
    }
  };

  const handleStatusChange = (status: UserStatus) => {
    let updates: Partial<MediaItem> = { userStatus: status };
    if (status === UserStatus.COMPLETED && formData.totalCount) {
        updates.userProgress = formData.totalCount;
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  if (loading || !details) {
      return (
          <div className="flex items-center justify-center min-h-screen text-slate-500 gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              Loading Details...
          </div>
      );
  }

  const imageSrc = details.coverUrl || getPlaceholderImage(details.title, details.type);
  const backdropSrc = imageSrc;

  return (
    <div className="min-h-screen bg-slate-950 pb-32 md:pb-20 animate-in fade-in duration-300">
        
        {/* Mobile: Full Screen Hero Image Background */}
        <div className="md:hidden fixed inset-0 z-0">
             <img src={backdropSrc} className="w-full h-full object-cover opacity-20" alt="" />
             <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/80 to-slate-950" />
        </div>

        {/* Desktop: Hero Backdrop */}
        <div className="hidden md:block relative h-64 md:h-96 w-full overflow-hidden">
            <div className="absolute inset-0 bg-slate-900">
                <img src={backdropSrc} className="w-full h-full object-cover opacity-20 blur-xl scale-110" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            </div>
        </div>
        
        {/* Back Button */}
        <div className="fixed top-4 left-4 md:absolute md:top-6 md:left-10 z-30">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 hover:bg-white/10 text-white backdrop-blur-md border border-white/10 transition-colors shadow-lg"
            >
                <Icons.ArrowLeft size={18} /> <span className="hidden md:inline">Back</span>
            </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 md:-mt-48 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 pt-24 md:pt-0">
            
            {/* Left Column: Cover & Tracking (Desktop) */}
            <div className="hidden lg:col-span-3 lg:flex flex-col gap-6">
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-900">
                    <img src={imageSrc} alt={details.title} className="w-full h-full object-cover" />
                </div>
                {/* Desktop Tracking Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Icons.Edit size={16} className="text-indigo-400" />
                        Track Entry
                    </h3>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                        <select 
                            value={formData.userStatus}
                            onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            {Object.values(UserStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Score: <span className="text-indigo-400 text-sm ml-1">{formData.userScore}</span></label>
                        <input 
                            type="range" min="0" max="10" step="0.5"
                            value={formData.userScore || 0}
                            onChange={(e) => setFormData({...formData, userScore: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                    <div className="space-y-1">
                         <label className="text-xs font-bold text-slate-500 uppercase">Progress</label>
                         <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                value={formData.userProgress}
                                onChange={(e) => setFormData({...formData, userProgress: parseInt(e.target.value) || 0})}
                                className="w-20 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-center outline-none focus:border-indigo-500"
                             />
                             <span className="text-slate-500 text-sm">/ {details.totalCount || '?'}</span>
                         </div>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                    >
                        {libraryItem ? 'Update Entry' : 'Add to Library'}
                    </button>
                    {libraryItem && (
                         <button 
                            onClick={() => {
                                if(window.confirm('Delete this entry?')) {
                                    onDelete(formData.id!);
                                    onBack();
                                }
                            }}
                            className="w-full py-2 text-red-400 hover:text-red-300 text-sm font-medium"
                         >
                            Remove from Library
                         </button>
                    )}
                </div>
            </div>

            {/* Right Column: Info */}
            <div className="lg:col-span-9 space-y-8 md:space-y-10">
                
                {/* Title Section */}
                <div className="flex flex-col md:block items-center md:items-start text-center md:text-left">
                     {/* Mobile Cover */}
                     <div className="md:hidden w-40 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700/50 mb-6">
                        <img src={imageSrc} alt={details.title} className="w-full h-auto object-cover" />
                     </div>

                    <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                        <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20">
                            {details.type}
                        </span>
                        <span className="text-slate-300 font-medium text-sm">{details.format}</span>
                    </div>
                    <h1 className="text-3xl md:text-6xl font-black text-white leading-tight mb-4">{details.title}</h1>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {details.genres.map(g => (
                            <span key={g} className="px-3 py-1 rounded-lg bg-slate-800/80 md:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700">
                                {g}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Synopsis */}
                <div className="bg-slate-900/50 md:bg-slate-900/50 border-t md:border border-slate-800/50 md:border-slate-800 rounded-none md:rounded-2xl p-0 md:p-8 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white mb-4 hidden md:block">Synopsis</h2>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                        {details.synopsis}
                    </p>
                </div>

                {/* Trailer */}
                {details.trailerUrl && (
                    <div className="md:rounded-2xl overflow-hidden border-y md:border border-slate-800 bg-black aspect-video shadow-2xl -mx-6 md:mx-0">
                         <iframe 
                            src={details.trailerUrl.replace('autoplay=1', 'autoplay=0')} 
                            title="Trailer"
                            className="w-full h-full"
                            allowFullScreen
                         />
                    </div>
                )}

                {/* Characters Grid */}
                {details.characters && details.characters.length > 0 && (
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                            <Icons.Users className="text-emerald-400" /> Characters
                        </h2>
                        {/* Horizontal Scroll on Mobile */}
                        <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-4 lg:grid-cols-5 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
                            {details.characters.map((char, i) => (
                                <div key={i} className="min-w-[100px] md:min-w-0 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden group transition-colors">
                                    <div className="aspect-square overflow-hidden bg-slate-800">
                                        {char.imageUrl ? (
                                            <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl font-bold bg-slate-800">
                                                {char.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 md:p-3">
                                        <p className="text-white font-medium text-xs md:text-sm truncate">{char.name}</p>
                                        <p className="text-slate-500 text-[10px] md:text-xs truncate">{char.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 p-4 pb-safe lg:hidden z-40 flex items-center gap-4">
             <div className="flex-1">
                 {libraryItem ? (
                     <div className="flex flex-col">
                         <span className="text-xs text-slate-400">Current Status</span>
                         <span className="font-bold text-white flex items-center gap-2">
                             {formData.userStatus} <span className="text-slate-600">•</span> {formData.userScore || 0}/10
                         </span>
                     </div>
                 ) : (
                     <div className="text-white font-bold">Add to Collection</div>
                 )}
             </div>
             <button 
                onClick={() => setShowMobileSheet(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
             >
                 {libraryItem ? 'Update' : 'Track'}
             </button>
        </div>

        {/* Mobile Bottom Sheet (Tracking Form) */}
        {showMobileSheet && (
            <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowMobileSheet(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6 pb-safe animate-in slide-in-from-bottom duration-300">
                     <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
                     
                     <h3 className="text-lg font-bold text-white mb-6">Update Entry</h3>
                     
                     <div className="space-y-5">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                            <select 
                                value={formData.userStatus}
                                onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-base"
                            >
                                {Object.values(UserStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                         </div>

                         <div className="flex gap-4">
                             <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Score ({formData.userScore})</label>
                                <input 
                                    type="range" min="0" max="10" step="0.5"
                                    value={formData.userScore || 0}
                                    onChange={(e) => setFormData({...formData, userScore: parseFloat(e.target.value)})}
                                    className="w-full h-10 bg-transparent"
                                />
                             </div>
                             <div className="w-1/3 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Progress</label>
                                <input 
                                    type="number" 
                                    value={formData.userProgress}
                                    onChange={(e) => setFormData({...formData, userProgress: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 text-center outline-none focus:border-indigo-500 text-base"
                                    placeholder={details.totalCount?.toString() || '0'}
                                />
                             </div>
                         </div>

                         <div className="pt-2 flex gap-3">
                             {libraryItem && (
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Delete?')) {
                                            onDelete(formData.id!);
                                            onBack();
                                        }
                                    }}
                                    className="flex-1 py-3.5 rounded-xl bg-slate-800 text-red-400 font-bold"
                                >
                                    Delete
                                </button>
                             )}
                             <button 
                                onClick={handleSave}
                                className="flex-[2] py-3.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/25"
                             >
                                Save Changes
                             </button>
                         </div>
                     </div>
                </div>
            </div>
        )}

    </div>
  );
};
