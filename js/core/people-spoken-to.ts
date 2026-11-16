import manifest from '../../char/manifest.json';
import { readStorage, writeStorage } from './storage.js';

const STORAGE_KEY = 'max-game:people-spoken-to';
export const PEOPLE_TO_MEET = 42;
// Maddy is shared by her map and cave appearances. Marina is a different
// person from Marina D. The remaining cinema seat belongs to Tim.
const people = new Set([
  ...Object.keys(manifest.characters).filter(id => id !== 'siblings'),
  'marina', 'charity-cook', 'charity-computer', 'charity-teacher',
  ...[0, 2, 3, 4, 5].map(index => `cinema-audience-${index}`),
]);
const aliases: Readonly<Record<string, string>> = { alexs: 'alex-s', marinad: 'marina-d' };

function readPeople(): Set<string> {
  try {
    const saved: unknown = JSON.parse(readStorage(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && people.has(id)) : []);
  } catch {
    return new Set();
  }
}

export function recordPersonSpokenTo(name?: string): void {
  if (!name) return;
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '-');
  const id = aliases[normalized] ?? normalized;
  if (!people.has(id)) return;
  const spoken = readPeople();
  if (spoken.has(id)) return;
  spoken.add(id);
  writeStorage(STORAGE_KEY, JSON.stringify([...spoken]));
}

export function getPeopleSpokenCount(): number {
  return readPeople().size;
}
