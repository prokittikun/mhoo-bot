interface SpamRecord {
  timestamps: number[];
  warned: boolean;
}

const tracker = new Map<string, SpamRecord>();

function key(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function record(guildId: string, userId: string, windowMs: number): number {
  const k = key(guildId, userId);
  const now = Date.now();
  const cutoff = now - windowMs;

  let rec = tracker.get(k);
  if (!rec) {
    rec = { timestamps: [], warned: false };
    tracker.set(k, rec);
  }

  rec.timestamps = rec.timestamps.filter((t) => t > cutoff);
  rec.timestamps.push(now);
  return rec.timestamps.length;
}

export function isWarned(guildId: string, userId: string): boolean {
  return tracker.get(key(guildId, userId))?.warned ?? false;
}

export function setWarned(guildId: string, userId: string): void {
  const rec = tracker.get(key(guildId, userId));
  if (rec) rec.warned = true;
}

export function clear(guildId: string, userId: string): void {
  tracker.delete(key(guildId, userId));
}
