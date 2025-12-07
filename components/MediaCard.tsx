
import React from 'react';
import { MediaItem, SearchResultItem, UserStatus } from '../types';
import { Icons } from './Icons';
import { getPlaceholderImage, getStatusColor, getTypeColor } from '../utils';

interface MediaCardProps {
  item: MediaItem | SearchResultItem;
  isInLibrary?: boolean;
  onSelect: (item: MediaItem | SearchResultItem) => void;
  onQuickAdd?: (item: SearchResultItem) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ 
  item, 
  isInLibrary, 
  onSelect, 
  onQuickAdd,
  draggable,
  onDragStart
}) => {
  const isLibraryItem = (i: any): i is MediaItem => {
    return (i as MediaItem).userStatus !== undefined;
  };

  // Prioritize actual cover URL, fallback to placeholder
  const imageSrc = item.coverUrl || getPlaceholderImage(item.title, item.type);

  // Calculate Progress Width
  let progressPercentage = 0;
  if (isLibraryItem(item)) {
    if (item.userStatus === UserStatus.COMPLETED) {
        progressPercentage = 100;
    } else if (item.totalCount) {
        progressPercentage = Math.min((item.userProgress / item.totalCount) * 100, 100);
    }
  }

  return (
    <div 
      className={`group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col h-full ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => onSelect(item)}
      draggable={draggable}
      onDragStart={(e) => isLibraryItem(item) && onDragStart && onDragStart(e, item)}
    >
      {/* Drag Handle (Visual only, whole card is draggable) */}
      {draggable && (
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-1 text-slate-300">
           <Icons.Drag size={16} />
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-800">
        <img 
          src={imageSrc} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-slate-950/80 backdrop-blur-md rounded-md text-xs font-bold border border-slate-800 flex items-center gap-1 shadow-lg z-10">
             <span className={getTypeColor(item.type)}>●</span> {item.type}
        </div>

        {/* Status Badge (if in library) */}
        {isLibraryItem(item) && (
          <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-md text-xs font-bold border backdrop-blur-md ${getStatusColor(item.userStatus)} z-10`}>
            {item.userStatus === UserStatus.READING && item.type === 'Anime' ? 'Watching' : 
             item.userStatus === UserStatus.READING ? 'Reading' : item.userStatus}
          </div>
        )}

        {/* Score Badge (if in library and scored) */}
        {isLibraryItem(item) && item.userScore > 0 && (
           <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-lg z-10">
             {item.userScore}
           </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-white line-clamp-2 mb-1 leading-tight" title={item.title}>{item.title}</h3>
        <p className="text-xs text-slate-400 mb-3">{item.format} • {item.genres?.[0] || 'Unknown'}</p>
        
        {isLibraryItem(item) ? (
          <div className="mt-auto">
             <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>
                    {item.userStatus === UserStatus.COMPLETED 
                        ? 'Completed' 
                        : `${item.userProgress} / ${item.totalCount || '?'}`}
                </span>
             </div>
             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${item.userStatus === UserStatus.COMPLETED ? 'bg-blue-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progressPercentage}%` }} 
                />
             </div>
          </div>
        ) : (
          <div className="mt-auto">
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (onQuickAdd) onQuickAdd(item as SearchResultItem);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
             >
                <Icons.Plus size={16} /> Add to Library
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
