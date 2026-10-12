export interface LetterboxdReview {
  readonly title: string;
  readonly year: string;
  readonly poster: string;
  readonly rating: number;
  readonly review: string;
  readonly url: string;
}

export const LETTERBOXD_REVIEWS_STORAGE_KEY = 'max-game:letterboxd-reviews';

export function readCachedLetterboxdReviews(): readonly LetterboxdReview[] | null {
  try {
    const raw = window.localStorage.getItem(LETTERBOXD_REVIEWS_STORAGE_KEY);
    if (!raw) return null;
    const reviews = JSON.parse(raw) as unknown;
    return Array.isArray(reviews) ? reviews as readonly LetterboxdReview[] : null;
  } catch {
    return null;
  }
}

export function cacheLetterboxdReviews(reviews: readonly LetterboxdReview[]): void {
  try {
    window.localStorage.setItem(LETTERBOXD_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // A full or unavailable local storage should not interrupt dialogue.
  }
}

export async function fetchLatestLetterboxdReviews(path: string, signal?: AbortSignal): Promise<readonly LetterboxdReview[] | null> {
  if (window.location.protocol === 'file:') return null;
  try {
    const request: RequestInit = { cache: 'no-store' };
    if (signal) request.signal = signal;
    const response = await fetch(`${path}?updated=${Date.now()}`, request);
    if (!response.ok) throw new Error(`Letterboxd feed returned ${response.status}`);
    const feed = await response.json() as { reviews?: unknown };
    if (!Array.isArray(feed.reviews)) return null;
    return feed.reviews as readonly LetterboxdReview[];
  } catch {
    return null;
  }
}

export async function refreshLetterboxdReviews(path: string): Promise<void> {
  const reviews = await fetchLatestLetterboxdReviews(path);
  if (reviews) cacheLetterboxdReviews(reviews);
}
