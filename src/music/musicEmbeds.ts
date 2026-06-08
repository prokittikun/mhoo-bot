import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { LoopMode, Track, formatDuration } from './Track';

export function buildNowPlayingEmbed(track: Track): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle('🎵 Now Playing')
    .setDescription(`**[${track.title}](${track.url})**`)
    .setThumbnail(track.thumbnail ?? null)
    .addFields(
      { name: 'Duration', value: formatDuration(track.duration), inline: true },
      { name: 'Requested by', value: track.requestedBy, inline: true },
      { name: 'Platform', value: capitalize(track.platform), inline: true },
    );
}

export function buildControlRow(
  paused: boolean,
  loopMode: LoopMode,
  queueLength: number,
): ActionRowBuilder<ButtonBuilder> {
  const loopLabels: Record<LoopMode, string> = {
    off: '🔁 Loop',
    song: '🔂 Song',
    queue: '🔁 Queue',
  };
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('music_pause')
      .setLabel(paused ? '▶️ Resume' : '⏸️ Pause')
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_skip')
      .setLabel('⏭️ Skip')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_stop')
      .setLabel('⏹️ Stop')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('music_loop')
      .setLabel(loopLabels[loopMode])
      .setStyle(loopMode === 'off' ? ButtonStyle.Secondary : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_shuffle')
      .setLabel('🔀 Shuffle')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(queueLength === 0),
  );
}

export function buildQueueEmbed(current: Track | null, queue: Track[], loopMode: string): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(0x1db954).setTitle('🎶 Queue');

  if (current) {
    embed.addFields({
      name: '▶️ Now Playing',
      value: `[${current.title}](${current.url}) \`${formatDuration(current.duration)}\``,
    });
  }

  if (queue.length === 0) {
    embed.addFields({ name: 'Up Next', value: 'Queue is empty.' });
  } else {
    const visible = queue.slice(0, 10);
    const lines = visible.map(
      (t, i) => `\`${i + 1}.\` [${t.title}](${t.url}) \`${formatDuration(t.duration)}\``,
    );
    if (queue.length > 10) lines.push(`*...and ${queue.length - 10} more*`);
    embed.addFields({
      name: `Up Next — ${queue.length} track${queue.length !== 1 ? 's' : ''}`,
      value: lines.join('\n'),
    });
  }

  embed.setFooter({ text: `Loop: ${loopMode}` });
  return embed;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
