
import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile } from '../types';
import { Icons } from './Icons';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userProfile: UserProfile;
  onUpdateProfile: (name: string, age: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userProfile, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editAge, setEditAge] = useState(userProfile.age);

  // Sync state when props change
  useEffect(() => {
    setEditName(userProfile.name);
    setEditAge(userProfile.age);
  }, [userProfile]);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    onUpdateProfile(editName, editAge.toString());
    setIsEditing(false);
  };

  const navItems: { id: ViewState; label: string; icon: React.ElementType }[] = [
    { id: 'DASHBOARD', label: 'Home', icon: Icons.Dashboard },
    { id: 'SEARCH', label: 'Discover', icon: Icons.Search },
    { id: 'LIBRARY', label: 'Library', icon: Icons.Library },
    { id: 'SETTINGS', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <>
    {/* Desktop Sidebar */}
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex-col z-40 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
          O
        </div>
        <span className="ml-3 font-bold text-lg tracking-tight text-white">
          Otaku<span className="text-indigo-400">Log</span>
        </span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-4">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center justify-start px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon size={22} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
              <span className={`ml-3 font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {isEditing ? (
           <form onSubmit={handleSave} className="bg-slate-800/80 p-3 rounded-xl border border-indigo-500/50 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Name</label>
                  <input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-900 text-white text-sm px-2 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 outline-none"
                      placeholder="Your Name"
                      autoFocus
                  />
              </div>
              <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Age</label>
                      <input 
                          type="number"
                          value={editAge}
                          onChange={(e) => setEditAge(e.target.value)}
                          className="w-full bg-slate-900 text-white text-sm px-2 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 outline-none"
                          placeholder="Age"
                      />
                  </div>
                  <div className="flex items-end">
                      <button 
                        type="submit"
                        className="h-[34px] w-[34px] flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                        title="Save Profile"
                      >
                          <Icons.Check size={16} />
                      </button>
                  </div>
              </div>
           </form>
        ) : (
            <div 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 relative group cursor-pointer hover:bg-slate-800 transition-all hover:border-slate-600"
                title="Click to edit profile"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-sm">
                    {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate text-slate-200 group-hover:text-white transition-colors">{userProfile.name}</p>
                    <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                        {userProfile.age ? `Age: ${userProfile.age}` : ''}
                    </p>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Edit size={14} />
                </div>
            </div>
        )}
      </div>
    </aside>

    {/* Mobile Top Header */}
    <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 z-50 px-4 flex items-center justify-between">
         <div className="flex items-center">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
              O
            </div>
            <span className="ml-2.5 font-bold text-base tracking-tight text-white">
              Otaku<span className="text-indigo-400">Log</span>
            </span>
         </div>
         <div 
             onClick={() => setIsEditing(true)}
             className="flex items-center gap-2 cursor-pointer"
         >
             <span className="text-xs font-medium text-slate-300">{userProfile.name}</span>
             <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900">
                {userProfile.name.charAt(0).toUpperCase()}
             </div>
         </div>
    </div>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
       <div className="flex justify-between items-center h-16 px-6">
          {navItems.map((item) => {
             const isActive = currentView === item.id;
             const Icon = item.icon;
             return (
               <button
                 key={item.id}
                 onClick={() => onChangeView(item.id)}
                 className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform
                   ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
               >
                 <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-slate-500'} />
               </button>
             );
          })}
       </div>
       
       {/* Mobile Profile Edit Modal Overlay */}
       {isEditing && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                    <button onClick={() => setIsEditing(false)} className="p-1 rounded-full bg-slate-800 text-slate-400">
                        <Icons.Close size={18} />
                    </button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-2 block">Name</label>
                        <input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none text-base"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-2 block">Age</label>
                        <input 
                            type="number"
                            value={editAge}
                            onChange={(e) => setEditAge(e.target.value)}
                            className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none text-base"
                        />
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">Save Profile</button>
                    </div>
                </form>
            </div>
         </div>
       )}
    </nav>
    </>
  );
};
