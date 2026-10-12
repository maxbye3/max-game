export const GEORGIA_POWER_DURATION = 10_000;
export const GEORGIA_POWER_REVEAL = "Georgia's power: you rode a flying carpet for ten seconds! You could soar over rivers, roofs and obstacles with a fast, banking glide. Your slipstream unfurled a fleet of carpets beneath nearby characters, sent clouds and golden threads racing across the world, and set the landscape rippling beneath you. The carpet brought you down on clear ground when the flight ended.";

interface Position { x: number; y: number }
export interface GeorgiaFlightBounds { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number }
export interface GeorgiaPassenger { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
interface FlightThread extends Position { readonly time: number }
let startedAt = Infinity;
let endsAt = 0;
let wasFlying = false;
let safeLanding: Position | null = null;
let passengers: readonly GeorgiaPassenger[] = [];
const velocity = { x: 0, y: 0 };
const rider = { x: 0, y: 0 };
const threads: FlightThread[] = [];

export function activateGeorgiaPower(now = performance.now()): void {
  if (!isGeorgiaPowerActive(now)) { safeLanding = null; velocity.x = 0; velocity.y = 0; }
  startedAt = now;
  endsAt = now + GEORGIA_POWER_DURATION;
  passengers = [];
  threads.length = 0;
}

export const isGeorgiaPowerActive = (now = performance.now()): boolean => now >= startedAt && now < endsAt;
export const georgiaPowerSecondsLeft = (now = performance.now()): number => isGeorgiaPowerActive(now) ? (endsAt - now) / 1000 : 0;
export const georgiaFlightElapsed = (now: number): number => Math.max(0, now - startedAt);
export const georgiaFlightStrength = (now: number): number => isGeorgiaPowerActive(now)
  ? Math.min(1, georgiaFlightElapsed(now) / 500, georgiaPowerSecondsLeft(now) / 0.7) : 0;

/** Flying bypasses ground obstacles, but remains inside the current scene. */
export function moveGeorgiaFlight(position: Position, dx: number, dy: number, speed: number, deltaTime: number, bounds: GeorgiaFlightBounds, now = performance.now()): void {
  if (!isGeorgiaPowerActive(now)) return;
  const length = Math.hypot(dx, dy) || 1;
  const acceleration = 1 - Math.exp(-deltaTime * 7);
  velocity.x += (dx / length * speed * 2.6 - velocity.x) * acceleration;
  velocity.y += (dy / length * speed * 2.6 - velocity.y) * acceleration;
  position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x + velocity.x * deltaTime));
  position.y = Math.max(bounds.minY, Math.min(bounds.maxY, position.y + velocity.y * deltaTime));
}

/** Record clear ground during flight; find the nearest clear landing if expiry happens above an obstacle. */
export function settleGeorgiaFlight(position: Position, isBlocked: (x: number, y: number) => boolean, bounds: GeorgiaFlightBounds, now = performance.now()): void {
  const clear = (x: number, y: number): boolean => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY && !isBlocked(x, y);
  if (isGeorgiaPowerActive(now)) {
    wasFlying = true;
    if (clear(position.x, position.y)) safeLanding = { x: position.x, y: position.y };
    return;
  }
  if (!wasFlying) return;
  wasFlying = false;
  velocity.x = 0;
  velocity.y = 0;
  if (!clear(position.x, position.y)) {
    let landing: Position | null = null;
    for (let radius = 8; radius <= 320 && !landing; radius += 8) {
      for (let angle = 0; angle < 32; angle++) {
        const x = position.x + Math.cos(angle * Math.PI / 16) * radius;
        const y = position.y + Math.sin(angle * Math.PI / 16) * radius;
        if (clear(x, y)) { landing = { x, y }; break; }
      }
    }
    if (!landing && safeLanding && clear(safeLanding.x, safeLanding.y)) landing = safeLanding;
    // A very large roof can cover the whole local search. Search the bounded scene as a final fallback.
    if (!landing) {
      for (let y = bounds.minY; y <= bounds.maxY && !landing; y += 8) {
        for (let x = bounds.minX; x <= bounds.maxX; x += 8) {
          if (clear(x, y)) { landing = { x, y }; break; }
        }
      }
    }
    if (landing) { position.x = landing.x; position.y = landing.y; }
  }
  safeLanding = null;
  passengers = [];
  threads.length = 0;
}

export function updateGeorgiaWorld(now: number, x: number, y: number, targets: readonly GeorgiaPassenger[]): void {
  if (!isGeorgiaPowerActive(now)) { passengers = []; threads.length = 0; return; }
  rider.x = x;
  rider.y = y;
  passengers = targets.filter((target) => Math.hypot(target.x - x, target.y - y) < 520).slice(0, 24);
  while (threads.length && now - (threads[0]?.time ?? now) > 1500) threads.shift();
  const last = threads[threads.length - 1];
  if (!last || (now - last.time > 45 && Math.hypot(x - last.x, y - last.y) > 2)) threads.push({ x, y, time: now });
}

export function georgiaFlightPose(id: string, now = performance.now()): { lift: number; bank: number; strength: number } {
  const strength = georgiaFlightStrength(now);
  if (!strength || (id !== 'player' && !passengers.some((passenger) => passenger.id === id))) return { lift: 0, bank: 0, strength: 0 };
  const phase = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const elapsed = georgiaFlightElapsed(now);
  return {
    lift: strength * (id === 'player' ? 54 + Math.sin(elapsed / 260) * 4 : 26 + Math.sin(elapsed / 420 + phase) * 10),
    bank: strength * (id === 'player' ? Math.max(-0.18, Math.min(0.18, velocity.x / 2800)) : Math.sin(elapsed / 500 + phase) * 0.13),
    strength,
  };
}

export const getGeorgiaPassengers = (): readonly GeorgiaPassenger[] => passengers;
export const getGeorgiaThreads = (): readonly FlightThread[] => threads;
export const getGeorgiaRider = (): Readonly<Position> => rider;
export const getGeorgiaVelocity = (): Readonly<Position> => velocity;
