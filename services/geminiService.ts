import { GoogleGenAI, Type } from "@google/genai";
import { SearchResultItem } from "../types";
import { searchUniversal } from "./api";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getRecommendations = async (userLibraryTitles: string[]): Promise<SearchResultItem[]> => {
    if (!apiKey || userLibraryTitles.length === 0) return [];

    // 1. Ask Gemini for titles with advanced personalized context
    const prompt = `
      You are an expert Otaku and Librarian with deep knowledge of Reddit (r/anime, r/manga, r/books), MyAnimeList stacks, and social media trends.
      
      The user has the following items in their library: ${userLibraryTitles.slice(0, 20).join(", ")}.

      Task: Recommend 5 distinct, high-quality Anime, Manga, Manhwa, or Books.
      
      Criteria:
      1. SOCIAL PROOF: Prioritize titles that are often recommended in "If you like X, you'll love Y" threads on Reddit.
      2. CROSS-MEDIA SYNERGY: If they like a lot of Manga, maybe suggest a related Light Novel or a similar Anime adaptation that expands the story.
      3. HIDDEN GEMS vs POPULAR HITS: Mix 1-2 widely acclaimed "must-reads" compatible with their taste, and 3-4 "hidden gems" or niche masterpieces that share the same specific vibe/tropes as their current list.
      4. Avoid items they already have.
      
      Return ONLY a JSON array of strings (titles).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        
        const titles: string[] = JSON.parse(text);

        // 2. Hydrate these titles with real data from Jikan/Google Books
        const hydratedItems: SearchResultItem[] = [];

        for (const title of titles) {
            // A simple search for the title
            const results = await searchUniversal(title);
            // Take the best match
            if (results.length > 0) {
                // Heuristic: Prefer exact title match if possible, else first
                const exact = results.find(r => r.title.toLowerCase() === title.toLowerCase());
                hydratedItems.push(exact || results[0]);
            }
        }

        return hydratedItems;

    } catch (e) {
        console.error("Recommendation failed", e);
        return [];
    }
}