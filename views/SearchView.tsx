
import React, { useState, useEffect, useRef } from 'react';
import { SearchResultItem, MediaType } from '../types';
import { Icons } from '../components/Icons';
import { searchUniversal } from '../services/api';
import { MediaCard } from '../components/MediaCard';

interface SearchViewProps {
  onSelectItem: (item: SearchResultItem) => void;
  libraryIds: Set<string>;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectItem, libraryIds }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MediaType | 'ALL'>('ALL');
  const [includeNsfw] = useState(true);
  const [page, setPage] = useState(1);
  const searchTimeoutRef = useRef<number | null>(null);

  // New search vs Load More
  const executeSearch = async (isLoadMore: boolean = false) => {
    if (!query.trim()) return;

    setLoading(true);
    const filter = activeFilter === 'ALL' ? undefined : activeFilter;
    const targetPage = isLoadMore ? page + 1 : 1;

    try {
        const items = await searchUniversal(query, filter, includeNsfw, targetPage);
        
        if (isLoadMore) {
            setResults(prev => [...prev, ...items]);
            setPage(targetPage);
        } else {
            setResults(items);
            setPage(1);
        }
    } catch (err) {
        console.error("Search failed", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    executeSearch(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }

  // Auto-search when filters change
  useEffect(() => {
    if (query.trim()) {
        if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = window.setTimeout(() => {
            executeSearch(false);
        }, 500);
    }
    return () => {
        if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    }
  }, [activeFilter, includeNsfw]);

  const filters = ['ALL', ...Object.values(MediaType)];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen pb-24">
      <div className="flex flex-col items-center mb-8 md:mb-12 space-y-4 md:space-y-6">
        <h1 className="text-3xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Discover
        </h1>
        <div className="w-full max-w-2xl relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search titles..."
                className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-3 md:py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-lg shadow-xl"
            />
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
            <button 
                onClick={() => handleSearch()}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 md:px-6 rounded-xl font-medium transition-colors text-sm md:text-base"
                disabled={loading}
            >
                {loading && page === 1 ? '...' : 'Search'}
            </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
            {filters.map(f => (
                <button
                    key={f}
                    onClick={() => setActiveFilter(f as any)}
                    className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
                        activeFilter === f 
                        ? 'bg-slate-700 text-white ring-1 ring-slate-500' 
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                >
                    {f === 'ALL' ? 'All Types' : f}
                </button>
            ))}
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 animate-pulse">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-slate-800 rounded-xl"></div>
            ))}
        </div>
      ) : (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {results.map((item, idx) => (
                    <MediaCard 
                        key={`${item.id}-${idx}`} 
                        item={item} 
                        onSelect={onSelectItem} 
                        onQuickAdd={onSelectItem}
                        isInLibrary={libraryIds.has(item.id)}
                    />
                ))}
            </div>
            
            {results.length > 0 && (
                <div className="mt-12 text-center">
                    <button 
                        onClick={() => executeSearch(true)}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-medium transition-colors border border-slate-700 shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load More Results'}
                    </button>
                </div>
            )}
        </>
      )}
      
      {!loading && results.length === 0 && query && (
          <div className="text-center text-slate-500 mt-20">
              <p>No results found. Try a different query or check your filters.</p>
          </div>
      )}
    </div>
  );
};
