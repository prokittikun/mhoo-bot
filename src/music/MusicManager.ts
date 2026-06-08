import { MusicPlayer } from './MusicPlayer';

const players = new Map<string, MusicPlayer>();

export function getPlayer(guildId: string): MusicPlayer {
  if (!players.has(guildId)) {
    players.set(guildId, new MusicPlayer(guildId));
  }
  return players.get(guildId)!;
}

export function destroyPlayer(guildId: string): void {
  const p = players.get(guildId);
  if (p) { p.cleanup(); players.delete(guildId); }
}
