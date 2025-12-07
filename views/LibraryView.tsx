
import React, { useState, useMemo } from 'react';
import { MediaItem, UserStatus, MediaType } from '../types';
import { MediaCard } from '../components/MediaCard';
import { Icons } from '../components/Icons';

interface LibraryViewProps {
  library: MediaItem[];
  groups: string[];
  onSelectItem: (item: MediaItem) => void;
  onAddGroup: (name: string) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (name: string) => void;
  onMoveItem: (itemId: string, group: string | undefined) => void;
}

type ViewMode = 'GRID' | 'LIST';

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  library, 
  groups, 
  onSelectItem,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onMoveItem
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('GRID');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<MediaType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'UPDATED' | 'TITLE' | 'SCORE'>('UPDATED');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Header Add Group State
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Inline Rename State
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Accordion State
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const filteredLibrary = useMemo(() => {
    return library
      .filter(item => {
        const statusMatch = filterStatus === 'ALL' || item.userStatus === filterStatus;
        const typeMatch = filterType === 'ALL' || item.type === filterType;
        const searchMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && typeMatch && searchMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'TITLE') return a.title.localeCompare(b.title);
        if (sortBy === 'SCORE') return b.userScore - a.userScore;
        return b.updatedAt - a.updatedAt; // Default
      });
  }, [library, filterStatus, filterType, sortBy, searchTerm]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: MediaItem) => {
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetGroup: string | undefined) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (itemId) {
        onMoveItem(itemId, targetGroup);
        // If dropping into a closed group, optional: expand it
        if (targetGroup && expandedGroup !== targetGroup) setExpandedGroup(targetGroup);
    }
  };

  const submitNewGroup = () => {
    if (newGroupName.trim()) {
        onAddGroup(newGroupName.trim());
        setNewGroupName('');
        setIsAddingGroup(false);
    }
  };

  const startEditingGroup = (group: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    setEditingName(group);
  };

  const submitEditGroup = (oldName: string) => {
    if (editingName.trim() && editingName !== oldName) {
        onRenameGroup(oldName, editingName.trim());
    }
    setEditingGroup(null);
  };

  const toggleGroup = (group: string) => {
      if (editingGroup) return; // Don't toggle if editing
      setExpandedGroup(prev => prev === group ? null : group);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col pb-24">
      {/* Top Controls Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Icons.Library className="text-indigo-500" /> My Collection <span className="text-slate-500 text-base md:text-lg font-normal">({library.length})</span>
         </h1>
         
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
             {/* View Toggle */}
             <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex">
                <button 
                    onClick={() => setViewMode('GRID')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'GRID' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="All Items (Grid)"
                >
                    <Icons.Grid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'LIST' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="Groups (List)"
                >
                    <Icons.Board size={20} />
                </button>
             </div>

            {viewMode === 'LIST' && (
                <div className="flex items-center">
                    {isAddingGroup ? (
                        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-right-4">
                            <input 
                                type="text" 
                                autoFocus
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitNewGroup()}
                                placeholder="Group Name..."
                                className="bg-transparent text-sm pl-3 pr-2 py-1 text-white outline-none w-32 border-r border-slate-700"
                            />
                            <button onClick={submitNewGroup} className="p-1 hover:text-indigo-400 text-slate-400"><Icons.Check size={16} /></button>
                            <button onClick={() => setIsAddingGroup(false)} className="p-1 hover:text-red-400 text-slate-400"><Icons.Close size={16} /></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingGroup(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <Icons.Plus size={16} /> Add Group
                        </button>
                    )}
                </div>
            )}

             <div className="flex-1 md:flex-none flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:w-auto mt-2 md:mt-0">
                <div className="relative w-full">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search collection..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm pl-9 pr-4 py-2 text-white outline-none w-full md:w-56"
                    />
                </div>
             </div>
         </div>
      </div>

      {/* Horizontally Scrollable Filters for Mobile */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-xl -mx-6 px-6 md:mx-0 md:px-0 py-4 mb-6 border-b border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center gap-3">
         <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
         >
            <option value="ALL">All Statuses</option>
            {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
         </select>

         <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
         >
            <option value="ALL">All Types</option>
            {Object.values(MediaType).map(t => <option key={t} value={t}>{t}</option>)}
         </select>

         <div className="h-6 w-px bg-slate-800 mx-1"></div>

         <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider hidden md:inline">Sort</span>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                {(['UPDATED', 'TITLE', 'SCORE'] as const).map(sort => (
                    <button
                        key={sort}
                        onClick={() => setSortBy(sort)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            sortBy === sort ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {sort}
                    </button>
                ))}
            </div>
         </div>
      </div>

      {viewMode === 'GRID' ? (
          filteredLibrary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl mx-4 md:mx-0">
                <Icons.Library size={64} className="mb-4 opacity-50" />
                <p className="text-xl font-medium mb-2">Nothing found here.</p>
                <p className="text-sm">Try adjusting your filters or add items from Discover.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filteredLibrary.map(item => (
                    <MediaCard 
                        key={item.id} 
                        item={item} 
                        isInLibrary={true}
                        onSelect={onSelectItem} 
                    />
                ))}
            </div>
          )
      ) : (
        // LIST / GROUP VIEW (Vertical Accordion)
        <div className="flex flex-col space-y-4">
            
            {/* Uncategorized Group */}
            <div 
                className={`bg-slate-900/50 border ${expandedGroup === 'uncategorized' ? 'border-indigo-500/50' : 'border-slate-800'} rounded-xl transition-all duration-300 overflow-hidden`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, undefined)}
            >
                <div 
                    onClick={() => toggleGroup('uncategorized')}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                         <div className={`p-1.5 rounded-lg transition-transform duration-300 ${expandedGroup === 'uncategorized' ? 'rotate-90 text-indigo-400' : 'text-slate-500'}`}>
                            <Icons.ChevronRight size={20} />
                         </div>
                         <h3 className="font-bold text-white text-lg tracking-wide">Uncategorized</h3>
                         <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                            {filteredLibrary.filter(i => !i.group).length} items
                         </span>
                    </div>
                </div>

                {expandedGroup === 'uncategorized' && (
                    <div className="p-4 md:p-6 pt-0 border-t border-slate-800/50 bg-slate-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
                            {filteredLibrary.filter(i => !i.group).map(item => (
                                <MediaCard 
                                    key={item.id}
                                    item={item} 
                                    isInLibrary={true} 
                                    onSelect={onSelectItem} 
                                    draggable={true}
                                    onDragStart={handleDragStart}
                                />
                            ))}
                            {filteredLibrary.filter(i => !i.group).length === 0 && (
                                <div className="col-span-full py-8 text-center text-slate-500 italic">
                                    Drag items here to remove them from a group.
                                </div>
                            )}
                         </div>
                    </div>
                )}
            </div>

            {/* User Custom Groups */}
            {groups.map(group => {
                const itemCount = filteredLibrary.filter(i => i.group === group).length;
                const isExpanded = expandedGroup === group;

                return (
                    <div 
                        key={group}
                        className={`bg-slate-900/50 border ${isExpanded ? 'border-indigo-500/50' : 'border-slate-800'} rounded-xl transition-all duration-300 overflow-hidden`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, group)}
                    >
                        <div 
                            onClick={() => toggleGroup(group)}
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors group/header"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-400' : 'text-slate-500'}`}>
                                    <Icons.ChevronRight size={20} />
                                </div>

                                {editingGroup === group ? (
                                    <div onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            className="bg-slate-800 text-white text-lg font-bold px-2 py-1 rounded outline-none w-48 md:w-64 border border-indigo-500"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={() => submitEditGroup(group)}
                                            onKeyDown={(e) => e.key === 'Enter' && submitEditGroup(group)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-white text-lg tracking-wide truncate max-w-[150px] md:max-w-none">{group}</h3>
                                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                                            {itemCount}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 md:opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => startEditingGroup(group, e)}
                                    className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                                    title="Rename Group"
                                >
                                    <Icons.Edit size={16} />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteGroup(group);
                                    }}
                                    className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                                    title="Delete Group"
                                >
                                    <Icons.Delete size={16} />
                                </button>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="p-4 md:p-6 pt-0 border-t border-slate-800/50 bg-slate-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
                                    {filteredLibrary.filter(i => i.group === group).map(item => (
                                        <MediaCard 
                                            key={item.id}
                                            item={item} 
                                            isInLibrary={true} 
                                            onSelect={onSelectItem} 
                                            draggable={true}
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                    {itemCount === 0 && (
                                        <div className="col-span-full py-8 text-center text-slate-500 italic">
                                            This group is empty. Drag items here to add them!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};
