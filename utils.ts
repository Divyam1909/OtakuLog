import { MediaType, UserStatus } from './types';

export const getPlaceholderImage = (title: string, type: MediaType) => {
  // Simple hash to get a consistent seed for Picsum
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);
  return `https://picsum.photos/seed/${seed}/300/450`;
};

export const getStatusColor = (status: UserStatus) => {
  switch (status) {
    case UserStatus.READING: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case UserStatus.COMPLETED: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case UserStatus.PLAN_TO_READ: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case UserStatus.ON_HOLD: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case UserStatus.DROPPED: return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
};

export const getTypeColor = (type: MediaType) => {
    switch (type) {
        case MediaType.ANIME: return 'text-pink-400';
        case MediaType.MANGA: return 'text-orange-400';
        case MediaType.MANHWA: return 'text-indigo-400';
        case MediaType.BOOK: return 'text-cyan-400';
    }
}
