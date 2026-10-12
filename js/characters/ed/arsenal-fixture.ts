const ARSENAL_TEAM_ID = '133604';
const NEXT_EVENT_URL = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${ARSENAL_TEAM_ID}`;
const CACHE_DURATION_MS = 5 * 60 * 1000;

interface SportsDbEvent {
  readonly strHomeTeam?: string;
  readonly strAwayTeam?: string;
  readonly strTimestamp?: string;
}

interface SportsDbResponse {
  readonly events?: readonly SportsDbEvent[];
}

let cachedDialogue: string | null = null;
let cachedAt = 0;
let pendingRequest: Promise<string> | null = null;

function fixtureDate(timestamp: string): Date | null {
  const utcTimestamp = /(?:Z|[+-]\d\d:\d\d)$/.test(timestamp) ? timestamp : `${timestamp}Z`;
  const date = new Date(utcTimestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFixture(event: SportsDbEvent): string | null {
  if (!event.strHomeTeam || !event.strAwayTeam || !event.strTimestamp) return null;
  const date = fixtureDate(event.strTimestamp);
  if (!date) return null;
  const dateAndTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `Next Arsenal game: ${event.strHomeTeam} v ${event.strAwayTeam}, ${dateAndTime} uk time.`;
}

async function loadFixtureDialogue(): Promise<string> {
  const response = await fetch(NEXT_EVENT_URL);
  if (!response.ok) throw new Error(`Arsenal fixture request failed: ${response.status}`);
  const data = await response.json() as SportsDbResponse;
  const fixture = data.events?.map(formatFixture).find((line): line is string => line !== null);
  if (!fixture) throw new Error('No upcoming Arsenal fixture was returned');
  return fixture;
}

export function getNextArsenalFixtureDialogue(): Promise<string> {
  if (cachedDialogue && Date.now() - cachedAt < CACHE_DURATION_MS) return Promise.resolve(cachedDialogue);
  if (pendingRequest) return pendingRequest;
  pendingRequest = loadFixtureDialogue()
    .then((fixture) => {
      cachedDialogue = fixture;
      cachedAt = Date.now();
      return fixture;
    })
    .catch(() => "Ah! sorry mate don't know the results of the next game best to bother max irl to fix.")
    .finally(() => {
      pendingRequest = null;
    });
  return pendingRequest;
}
