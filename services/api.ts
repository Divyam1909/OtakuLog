
import { MediaType, SearchResultItem, MediaDetails, Character } from '../types';

const JIKAN_API_BASE = 'https://api.jikan.moe/v4';
const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';

// Helper to prevent spamming Jikan (Rate limit is roughly 3 requests/second)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mapJikanType = (type: string): MediaType => {
  const lower = type?.toLowerCase();
  if (lower === 'manhwa') return MediaType.MANHWA;
  if (lower === 'manga' || lower === 'novel' || lower === 'light novel' || lower === 'oneshot') return MediaType.MANGA;
  return MediaType.ANIME;
};

const mapJikanItem = (item: any, forceType?: MediaType): SearchResultItem => {
  // Prefer WebP Large > JPG Large > WebP Default > JPG Default
  const coverUrl = 
    item.images?.webp?.large_image_url || 
    item.images?.jpg?.large_image_url || 
    item.images?.webp?.image_url || 
    item.images?.jpg?.image_url;

  return {
    id: `mal-${item.mal_id}`,
    title: item.title_english || item.title,
    type: forceType || mapJikanType(item.type),
    format: item.type || 'Unknown',
    synopsis: item.synopsis || 'No synopsis available.',
    totalCount: item.episodes || item.chapters || null,
    coverUrl: coverUrl,
    genres: item.genres?.map((g: any) => g.name) || [],
  };
};

const mapGoogleBookItem = (item: any): SearchResultItem => {
  const info = item.volumeInfo;
  let cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
  
  if (cover) {
    // Convert to HTTPS and remove edge=curl (often adds curled page effect)
    cover = cover.replace('http:', 'https:').replace('&edge=curl', '');
  }

  return {
    id: `gb-${item.id}`,
    title: info.title,
    type: MediaType.BOOK,
    format: 'Book',
    synopsis: info.description || 'No description available.',
    totalCount: info.pageCount || null,
    coverUrl: cover,
    genres: info.categories || [],
  };
};

export const searchAnimeManhwa = async (query: string, type: 'anime' | 'manga', page: number = 1, includeNsfw: boolean = false): Promise<SearchResultItem[]> => {
  try {
    // Jikan supports sfw parameter. If we want NSFW, sfw must be false.
    const sfwParam = includeNsfw ? 'sfw=false' : 'sfw=true';
    const response = await fetch(`${JIKAN_API_BASE}/${type}?q=${encodeURIComponent(query)}&limit=15&page=${page}&${sfwParam}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.data.map((item: any) => mapJikanItem(item));
  } catch (error) {
    console.error(`Jikan ${type} search failed:`, error);
    return [];
  }
};

export const searchBooks = async (query: string, page: number = 1): Promise<SearchResultItem[]> => {
  try {
    const startIndex = (page - 1) * 15;
    // Google Books doesn't have a strict "NSFW" filter like Jikan, it returns matches relevance.
    const response = await fetch(`${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=15&printType=books`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.items ? data.items.map(mapGoogleBookItem) : [];
  } catch (error) {
    console.error("Google Books search failed:", error);
    return [];
  }
};

export const searchUniversal = async (query: string, filterType?: MediaType, includeNsfw: boolean = false, page: number = 1): Promise<SearchResultItem[]> => {
  const promises: Promise<SearchResultItem[]>[] = [];

  // Determine what to fetch based on filter
  if (!filterType || filterType === MediaType.ANIME) {
    promises.push(searchAnimeManhwa(query, 'anime', page, includeNsfw));
  }
  
  if (!filterType || filterType === MediaType.MANGA || filterType === MediaType.MANHWA) {
    promises.push(searchAnimeManhwa(query, 'manga', page, includeNsfw));
  }

  if (!filterType || filterType === MediaType.BOOK) {
    promises.push(searchBooks(query, page));
  }

  const results = await Promise.all(promises);
  const flatResults = results.flat();

  // Deduplicate by ID (Important when pagination + multiple sources might overlap weirdly)
  const unique = new Map();
  flatResults.forEach(item => {
    if (!unique.has(item.id)) unique.set(item.id, item);
  });

  // If specific filter (like MANHWA which shares 'manga' endpoint), filter strictly now
  let final = Array.from(unique.values());
  if (filterType === MediaType.MANHWA) {
    final = final.filter(i => i.type === MediaType.MANHWA);
  }

  return final;
};

// --- Detailed Info Fetching ---

export const getMediaDetails = async (item: SearchResultItem): Promise<MediaDetails> => {
    const details: MediaDetails = { ...item };

    if (item.id.startsWith('mal-')) {
        const id = item.id.replace('mal-', '');
        const type = item.type === MediaType.ANIME ? 'anime' : 'manga';
        
        try {
            // Fetch Full Details
            await delay(300); // Rate limiting
            const fullRes = await fetch(`${JIKAN_API_BASE}/${type}/${id}/full`);
            if (fullRes.ok) {
                const fullData = await fullRes.json();
                const d = fullData.data;
                
                details.relations = d.relations?.map((r: any) => ({
                    title: r.entry?.[0]?.name,
                    type: r.relation,
                    id: r.entry?.[0]?.mal_id ? `mal-${r.entry[0].mal_id}` : undefined
                })) || [];
                
                if (type === 'anime') {
                    details.trailerUrl = d.trailer?.embed_url;
                }
            }

            // Fetch Characters (Separate endpoint for Jikan)
            await delay(300);
            const charRes = await fetch(`${JIKAN_API_BASE}/${type}/${id}/characters`);
            if (charRes.ok) {
                const charData = await charRes.json();
                details.characters = charData.data?.slice(0, 10).map((c: any) => ({
                    name: c.character.name,
                    role: c.role,
                    imageUrl: c.character.images?.webp?.image_url
                })) || [];
            }
        } catch (e) {
            console.error("Failed to fetch Jikan details", e);
        }
    } else if (item.id.startsWith('gb-')) {
        // Google Books details are often already in search, but we can try fetching specific volume for consistency
        const id = item.id.replace('gb-', '');
        try {
            const res = await fetch(`${GOOGLE_BOOKS_API_BASE}/${id}`);
            if (res.ok) {
                const data = await res.json();
                // Google books doesn't strictly have "characters" in API, but description is richer
                // We'll stick to basic info enhancement if any
                const info = data.volumeInfo;
                 let cover = info.imageLinks?.thumbnail || info.imageLinks?.medium || info.imageLinks?.large;
                if (cover) details.coverUrl = cover.replace('http:', 'https:').replace('&edge=curl', '');
            }
        } catch (e) {
            console.error("Failed to fetch Book details", e);
        }
    }

    return details;
};
