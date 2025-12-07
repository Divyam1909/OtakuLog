
import React, { useState, useEffect } from 'react';
import { MediaItem, SearchResultItem, UserStatus, MediaType } from '../types';
import { Icons } from './Icons';
import { getPlaceholderImage } from '../utils';

interface EditModalProps {
  item: MediaItem | SearchResultItem | null;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  isInLibrary: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave, onDelete, isInLibrary }) => {
  const [formData, setFormData] = useState<Partial<MediaItem>>({});

  useEffect(() => {
    if (item) {
      if (isInLibrary) {
        setFormData({ ...item as MediaItem });
      } else {
        // Initialize default for new item
        setFormData({
          ...item,
          userStatus: UserStatus.PLAN_TO_READ,
          userProgress: 0,
          userScore: 0,
          addedAt: Date.now(),
          updatedAt: Date.now(),
        } as MediaItem);
      }
    }
  }, [item, isInLibrary]);

  // Auto-complete progress when status changes to COMPLETED
  const handleStatusChange = (status: UserStatus) => {
    let updates: Partial<MediaItem> = { userStatus: status };
    if (status === UserStatus.COMPLETED && formData.totalCount) {
        updates.userProgress = formData.totalCount;
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  if (!item) return null;

  const handleSave = () => {
    if (formData.id) {
      onSave(formData as MediaItem);
      onClose();
    }
  };

  const incrementProgress = () => {
    setFormData(prev => ({ ...prev, userProgress: (prev.userProgress || 0) + 1 }));
  };

  const decrementProgress = () => {
    setFormData(prev => ({ ...prev, userProgress: Math.max(0, (prev.userProgress || 0) - 1) }));
  };

  const imageSrc = item.coverUrl || getPlaceholderImage(item.title, item.type);
  const maxProgress = item.totalCount || 9999;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Visuals */}
        <div className="w-full md:w-1/3 bg-slate-950 relative overflow-hidden shrink-0">
          <div className="absolute inset-0">
             <img src={imageSrc} alt={item.title} className="w-full h-full object-cover opacity-30 blur-sm scale-110" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>
          <div className="relative z-10 p-6 h-full flex flex-col">
             <div className="flex-1 flex items-center justify-center mb-6">
                <img 
                  src={imageSrc} 
                  alt={item.title} 
                  className="w-32 md:w-48 rounded-lg shadow-2xl border border-slate-700/50 object-cover" 
                />
             </div>
             
             <h2 className="text-2xl font-bold text-white mb-2 leading-tight text-center md:text-left">{item.title}</h2>
             <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                 <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-semibold backdrop-blur-md border border-white/10">{item.type}</span>
                 <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-semibold backdrop-blur-md border border-white/10">{item.format}</span>
             </div>
          </div>
          <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-white/20 rounded-full text-white transition-colors"
          >
             <Icons.Plus className="rotate-45" size={24} />
          </button>
        </div>

        {/* Right Side: Controls */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-900 flex flex-col">
          <div className="space-y-6 flex-1">
            
            {/* Synopsis */}
            <div>
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Synopsis</h3>
                <p className="text-slate-300 text-sm leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar border-l-2 border-slate-800 pl-3">
                    {item.synopsis || "No synopsis available."}
                </p>
            </div>

            <div className="h-px bg-slate-800 w-full" />

            {/* User Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Status</label>
                    <select 
                        value={formData.userStatus}
                        onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    >
                        {Object.values(UserStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Score */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Score</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="0.5"
                            value={formData.userScore || 0}
                            onChange={(e) => setFormData({...formData, userScore: parseFloat(e.target.value)})}
                            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="w-10 text-center font-bold text-indigo-400 text-lg">{formData.userScore}</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-400">
                        Progress ({item.type === MediaType.ANIME ? 'Episodes' : 'Chapters'})
                    </label>
                    <div className="flex items-center gap-4">
                        <button onClick={decrementProgress} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                            <Icons.Plus className="rotate-45" size={20} /> {/* Used as Minus */}
                        </button>
                        
                        <div className="flex-1 relative h-10 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 group">
                            <input 
                                type="number"
                                min="0"
                                max={maxProgress}
                                value={formData.userProgress || 0}
                                onChange={(e) => setFormData({...formData, userProgress: parseInt(e.target.value) || 0})}
                                className="absolute inset-0 w-full h-full bg-transparent text-center text-white font-bold outline-none z-10"
                            />
                            <div 
                                className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 transition-all duration-300"
                                style={{ width: `${Math.min(((formData.userProgress || 0) / maxProgress) * 100, 100)}%`}}
                            />
                        </div>

                        <button onClick={incrementProgress} className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20">
                            <Icons.Plus size={20} />
                        </button>

                        <span className="text-slate-500 text-sm font-medium whitespace-nowrap min-w-[60px] text-right">
                           / {item.totalCount || '?'}
                        </span>
                    </div>
                </div>
            </div>
          </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-800">
                {isInLibrary && (
                    <button 
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this entry?')) {
                                if (item.id) onDelete(item.id);
                                onClose();
                            }
                        }}
                        className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <Icons.Delete size={16} /> Delete
                    </button>
                )}
                
                <div className={`flex gap-3 ${!isInLibrary ? 'w-full md:w-auto ml-auto' : ''}`}>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex-1 md:flex-none flex items-center justify-center gap-2"
                    >
                        <Icons.Check size={18} /> {isInLibrary ? 'Save Changes' : 'Add to Library'}
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
