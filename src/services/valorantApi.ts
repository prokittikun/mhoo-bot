import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

function henrikHeaders(): Record<string, string> {
  const key = process.env.HENRIK_API_KEY;
  return key ? { Authorization: key } : {};
}

export interface PlayerRank {
  currenttier: number;
  currenttierpatched: string;
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo: number;
  images: { small: string; large: string; triangle_up: string; triangle_down: string };
}

export async function getRank(
  region: string,
  gameName: string,
  tagLine: string
): Promise<PlayerRank | null> {
  const res = await axios.get(
    `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { headers: henrikHeaders() }
  );
  return (res.data.data?.current_data as PlayerRank) ?? null;
}

export function buildRankEmbed(rank: PlayerRank, gameName: string, tagLine: string): EmbedBuilder {
  const changeSign = rank.mmr_change_to_last_game >= 0 ? '+' : '';
  return new EmbedBuilder()
    .setColor(0xff4655)
    .setTitle(`${gameName}#${tagLine}`)
    .setThumbnail(rank.images?.large ?? null)
    .addFields(
      { name: 'Rank', value: rank.currenttierpatched ?? 'Unranked', inline: true },
      { name: 'RR', value: `${rank.ranking_in_tier} RR`, inline: true },
      { name: 'Last Game', value: `${changeSign}${rank.mmr_change_to_last_game} RR`, inline: true },
      { name: 'Elo', value: `${rank.elo}`, inline: true }
    );
}
