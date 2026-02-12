const STORAGE_KEY = 'maum_search_history';
const MAX_ITEMS = 10;

interface SearchHistoryItem {
  region: string;
  category: string;
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchHistoryItem[];
  } catch {
    return [];
  }
}

export function addSearchHistory(region: string, category: string): void {
  if (!region || region.trim().length < 2) return;
  try {
    const history = getSearchHistory().filter(
      (h) => !(h.region === region.trim() && h.category === category)
    );
    history.unshift({ region: region.trim(), category, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage unavailable
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function getRecentRegions(category?: string): string[] {
  const history = getSearchHistory();
  const filtered = category ? history.filter((h) => h.category === category) : history;
  return [...new Set(filtered.map((h) => h.region))].slice(0, 5);
}
