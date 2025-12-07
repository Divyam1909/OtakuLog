import React, { useMemo, useEffect, useState } from 'react';
import { MediaItem, SearchResultItem, UserStatus } from '../types';
import { Icons } from '../components/Icons';
import { getRecommendations } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { MediaCard } from '../components/MediaCard';

interface DashboardProps {
  library: MediaItem[];
  onChangeView: (view: any) => void;
  onSelectItem: (item: MediaItem | SearchResultItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ library, onChangeView, onSelectItem }) => {
  const [recommendations, setRecommendations] = useState<SearchResultItem[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const stats = useMemo(() => {
    const total = library.length;
    const reading = library.filter(i => i.userStatus === UserStatus.READING).length;
    const completed = library.filter(i => i.userStatus === UserStatus.COMPLETED).length;
    const planned = library.filter(i => i.userStatus === UserStatus.PLAN_TO_READ).length;
    
    // Status distribution for Chart
    const data = [
      { name: 'Reading', value: reading, color: '#10b981' }, // Emerald
      { name: 'Completed', value: completed, color: '#3b82f6' }, // Blue
      { name: 'Planned', value: planned, color: '#64748b' }, // Slate
      { name: 'On Hold', value: library.filter(i => i.userStatus === UserStatus.ON_HOLD).length, color: '#eab308' }, // Yellow
      { name: 'Dropped', value: library.filter(i => i.userStatus === UserStatus.DROPPED).length, color: '#ef4444' }, // Red
    ].filter(d => d.value > 0);

    return { total, reading, completed, planned, data };
  }, [library]);

  useEffect(() => {
    // Only fetch recommendations if we have items and haven't fetched yet
    if (library.length > 0 && recommendations.length === 0) {
        const fetchRecs = async () => {
            setLoadingRecs(true);
            const titles = library.map(l => l.title);
            const recs = await getRecommendations(titles);
            setRecommendations(recs);
            setLoadingRecs(false);
        };
        fetchRecs();
    }
  }, [library.length]); // Simple dependency on length to avoid loops

  const currentlyReading = library
    .filter(item => item.userStatus === UserStatus.READING)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
           <p className="text-slate-400">Here's an overview of your collection.</p>
        </div>
        <button 
           onClick={() => onChangeView('SEARCH')}
           className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 self-start"
        >
           <Icons.Search size={18} /> Discover New Titles
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Items" value={stats.total} icon={Icons.Library} color="bg-indigo-500/20 text-indigo-400" />
          <StatCard label="Active" value={stats.reading} icon={Icons.TrendingUp} color="bg-emerald-500/20 text-emerald-400" />
          <StatCard label="Completed" value={stats.completed} icon={Icons.Check} color="bg-blue-500/20 text-blue-400" />
          <StatCard label="Planning" value={stats.planned} icon={Icons.Clock} color="bg-slate-500/20 text-slate-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart Section */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
             <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Icons.Dashboard size={20} className="text-indigo-400" /> Library Distribution
             </h2>
             {stats.total > 0 ? (
                 <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
             ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Icons.Library size={48} className="mb-4 opacity-20" />
                    <p>No items in library yet.</p>
                </div>
             )}
          </div>

          {/* Continue Reading Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icons.Book size={20} className="text-emerald-400" /> Pick Up
             </h2>
             
             <div className="flex-1 space-y-4">
                {currentlyReading.length > 0 ? currentlyReading.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => onSelectItem(item)}
                        className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-all group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-slate-200 group-hover:text-white truncate pr-2">{item.title}</h3>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                {item.type}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full" 
                                    style={{ width: `${item.totalCount ? (item.userProgress / item.totalCount) * 100 : 0}%` }} 
                                />
                            </div>
                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                {item.userProgress} / {item.totalCount || '?'}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-slate-500">
                        <p>Nothing currently in progress.</p>
                    </div>
                )}
             </div>
             
             {currentlyReading.length > 0 && (
                 <button onClick={() => onChangeView('LIBRARY')} className="mt-4 w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    View All Reading →
                 </button>
             )}
          </div>
      </div>

      {/* AI Recommendations Section */}
      {library.length > 0 && (
          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <Icons.Star className="text-yellow-400" size={24} />
                  <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">AI Powered</span>
              </div>
              
              {loadingRecs ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-slate-800 rounded-xl"></div>
                        ))}
                   </div>
              ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {recommendations.map(item => (
                          <MediaCard 
                            key={item.id} 
                            item={item} 
                            onSelect={onSelectItem} 
                            onQuickAdd={onSelectItem}
                          />
                      ))}
                  </div>
              ) : (
                  <div className="text-slate-500">We need a bit more data in your library to make suggestions.</div>
              )}
          </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);