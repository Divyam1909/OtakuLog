import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, MediaItem, SearchResultItem, UserProfile } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { SearchView } from './views/SearchView';
import { LibraryView } from './views/LibraryView';
import { SettingsView } from './views/SettingsView';
import { DetailView } from './views/DetailView';

const STORAGE_KEY = 'otakulog_library_v1';
const GROUPS_STORAGE_KEY = 'otakulog_groups_v1';
const PROFILE_STORAGE_KEY = 'otakulog_profile_v1';

export interface SearchState {
  query: string;
  results: SearchResultItem[];
  page: number;
  activeFilter: any;
  scrollTop: number;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  // Removed previousView state as we now use browser history
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', age: '' });
  
  // Detail View State
  const [selectedItem, setSelectedItem] = useState<MediaItem | SearchResultItem | null>(null);

  // Search Persistence State
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    page: 1,
    activeFilter: 'ALL',
    scrollTop: 0
  });

  // History Management
  useEffect(() => {
    // Initialize history state if needed
    if (!window.history.state) {
        window.history.replaceState({ view: 'DASHBOARD' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
        const state = event.state;
        if (state && state.view) {
            // Restore view
            setCurrentView(state.view);
            // Restore context if needed (e.g. for Detail view)
            if (state.view === 'DETAILS' && state.item) {
                setSelectedItem(state.item);
            }
        } else {
            // Fallback for initial state or external navigation
            setCurrentView('DASHBOARD');
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helper
  const navigateTo = useCallback((view: ViewState, item?: MediaItem | SearchResultItem) => {
      // Prevent duplicate history entries for main tabs
      if (view === currentView && view !== 'DETAILS') return;

      const newState = { view, item };
      window.history.pushState(newState, '');
      
      setCurrentView(view);
      if (item) setSelectedItem(item);
  }, [currentView]);


  // Load from local storage on mount
  useEffect(() => {
    const savedLib = localStorage.getItem(STORAGE_KEY);
    const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    
    if (savedLib) {
      try {
        setLibrary(JSON.parse(savedLib));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }

    if (savedGroups) {
      try {
        setGroups(JSON.parse(savedGroups));
      } catch (e) {
        console.error("Failed to parse groups", e);
      }
    } else {
        setGroups(['Favorites', 'Binge List', 'Watch Later']);
    }

    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse profile", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
  }, [userProfile]);


  const handleNavigate = (view: ViewState) => navigateTo(view);

  const handleSelectItem = (item: MediaItem | SearchResultItem) => navigateTo('DETAILS', item);

  const handleSaveItem = (item: MediaItem) => {
    setLibrary(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...item, group: i.group, updatedAt: Date.now() } : i);
      } else {
        return [...prev, { ...item, updatedAt: Date.now(), addedAt: Date.now() }];
      }
    });
  };

  const handleDeleteItem = (id: string) => {
    setLibrary(prev => prev.filter(i => i.id !== id));
  };

  const handleAddGroup = (name: string) => {
    if (!groups.includes(name)) setGroups(prev => [...prev, name]);
  };

  const handleRenameGroup = (oldName: string, newName: string) => {
    if (groups.includes(newName)) return;
    setGroups(prev => prev.map(g => g === oldName ? newName : g));
    setLibrary(prev => prev.map(item => item.group === oldName ? { ...item, group: newName } : item));
  };

  const handleDeleteGroup = (name: string) => {
    if (window.confirm(`Delete group "${name}"? Items will be moved to Uncategorized.`)) {
        setGroups(prev => prev.filter(g => g !== name));
        setLibrary(prev => prev.map(item => item.group === name ? { ...item, group: undefined } : item));
    }
  };

  const handleMoveItemToGroup = (itemId: string, groupName: string | undefined) => {
    setLibrary(prev => prev.map(item => item.id === itemId ? { ...item, group: groupName } : item));
  };

  const handleUpdateProfile = (name: string, age: string) => {
    setUserProfile({ name, age });
  };

  const handleImportData = (data: any) => {
      if (data.library) setLibrary(data.library);
      if (data.groups) setGroups(data.groups);
      if (data.profile) setUserProfile(data.profile);
      navigateTo('DASHBOARD');
  };

  const libraryIds = new Set(library.map(i => i.id));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={handleNavigate} 
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
      />
      
      <main className="flex-1 w-full h-full overflow-y-auto md:pl-64 pt-14 md:pt-0 pb-20 md:pb-0 transition-all duration-300">
        {currentView === 'DASHBOARD' && (
          <Dashboard 
            library={library} 
            onChangeView={handleNavigate} 
            onSelectItem={handleSelectItem}
          />
        )}
        {currentView === 'SEARCH' && (
          <SearchView 
            onSelectItem={handleSelectItem} 
            libraryIds={libraryIds}
            savedState={searchState}
            onSaveState={setSearchState}
          />
        )}
        {currentView === 'LIBRARY' && (
          <LibraryView 
            library={library} 
            groups={groups}
            onSelectItem={handleSelectItem}
            onAddGroup={handleAddGroup}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
            onMoveItem={handleMoveItemToGroup}
          />
        )}
        {currentView === 'SETTINGS' && (
            <SettingsView onImport={handleImportData} />
        )}
        {currentView === 'DETAILS' && selectedItem && (
            <DetailView 
                item={selectedItem}
                libraryItem={library.find(i => i.id === selectedItem.id)}
                onBack={() => window.history.back()}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
            />
        )}
      </main>
    </div>
  );
}