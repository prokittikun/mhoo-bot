import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  TextChannel,
  GuildMember,
} from 'discord.js';
import { Command } from '../Command';
import { MusicPlayer } from '../music/MusicPlayer';
import { getPlayer } from '../music/MusicManager';
import { buildNowPlayingEmbed, buildQueueEmbed } from '../music/musicEmbeds';
import { resolveQuery } from '../services/playDlService';

export const Music: Command = {
  name: 'music',
  description: 'Music player — YouTube, Spotify, SoundCloud',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'play',
      description: 'Play a song or playlist (URL or search query)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'query',
          description: 'YouTube/Spotify/SoundCloud URL, or search query',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'skip',
      description: 'Skip the current track',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'stop',
      description: 'Stop playback, clear queue, and disconnect',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'pause',
      description: 'Pause playback',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'resume',
      description: 'Resume playback',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'queue',
      description: 'Show the current queue',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'np',
      description: 'Show the currently playing track',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'loop',
      description: 'Set loop mode',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'mode',
          description: 'Loop mode',
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: 'Off', value: 'off' },
            { name: 'Song', value: 'song' },
            { name: 'Queue', value: 'queue' },
          ],
        },
      ],
    },
    {
      name: 'shuffle',
      description: 'Shuffle the queue',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'remove',
      description: 'Remove a track from the queue by position',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'position',
          description: 'Position in queue (1 = next up)',
          type: ApplicationCommandOptionType.Integer,
          required: true,
          minValue: 1,
        },
      ],
    },
    {
      name: 'clear',
      description: 'Clear the queue (current track keeps playing)',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'volume',
      description: 'Set playback volume (1–100)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'level',
          description: 'Volume level (1–100)',
          type: ApplicationCommandOptionType.Integer,
          required: true,
          minValue: 1,
          maxValue: 100,
        },
      ],
    },
  ],

  run: async (_client: Client, interaction: CommandInteraction) => {
    const sub = (interaction.options as any).getSubcommand() as string;
    const player = getPlayer(interaction.guildId!);

    switch (sub) {
      case 'play':    return handlePlay(interaction, player);
      case 'skip':    return handleSkip(interaction, player);
      case 'stop':    return handleStop(interaction, player);
      case 'pause':   return handlePause(interaction, player);
      case 'resume':  return handleResume(interaction, player);
      case 'queue':   return handleQueue(interaction, player);
      case 'np':      return handleNp(interaction, player);
      case 'loop':    return handleLoop(interaction, player);
      case 'shuffle': return handleShuffle(interaction, player);
      case 'remove':  return handleRemove(interaction, player);
      case 'clear':   return handleClear(interaction, player);
      case 'volume':  return handleVolume(interaction, player);
    }
  },
};

function getUserVoiceChannel(interaction: CommandInteraction) {
  return (interaction.member as GuildMember)?.voice.channel ?? null;
}

async function handlePlay(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  const voiceChannel = getUserVoiceChannel(interaction);
  if (!voiceChannel) {
    await interaction.editReply('❌ Join a voice channel first.');
    return;
  }

  const query = (interaction.options as any).getString('query') as string;
  await interaction.editReply('🔍 Searching...');

  let tracks;
  try {
    tracks = await resolveQuery(query, interaction.user.displayName);
  } catch (err: any) {
    await interaction.editReply(`❌ Failed to resolve: ${err?.message ?? 'Unknown error'}`);
    return;
  }

  if (!tracks.length) {
    await interaction.editReply('❌ No results found.');
    return;
  }

  player.connect(voiceChannel);
  player.textChannel = interaction.channel as TextChannel;

  const wasIdle = !player.current && player.queue.length === 0;
  player.enqueue(tracks);

  if (wasIdle) {
    await player.startPlaying();
    if (tracks.length === 1) {
      await interaction.editReply({ content: '', embeds: [buildNowPlayingEmbed(tracks[0])] });
    } else {
      await interaction.editReply(
        `▶️ Playing **${tracks[0].title}** + queued **${tracks.length - 1}** more tracks.`,
      );
    }
  } else {
    if (tracks.length === 1) {
      await interaction.editReply(
        `✅ Added **${tracks[0].title}** to queue (position **${player.queue.length}**).`,
      );
    } else {
      await interaction.editReply(`✅ Added **${tracks.length}** tracks to queue.`);
    }
  }
}

async function handleSkip(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  if (!player.skip()) {
    await interaction.editReply('❌ Nothing is playing.');
    return;
  }
  await interaction.editReply('⏭️ Skipped.');
}

async function handleStop(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  player.stop();
  await interaction.editReply('⏹️ Stopped and disconnected.');
}

async function handlePause(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  if (!player.pause()) {
    await interaction.editReply('❌ Not currently playing.');
    return;
  }
  await interaction.editReply('⏸️ Paused.');
}

async function handleResume(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  if (!player.resume()) {
    await interaction.editReply('❌ Not paused.');
    return;
  }
  await interaction.editReply('▶️ Resumed.');
}

async function handleQueue(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  if (!player.current && player.queue.length === 0) {
    await interaction.editReply('📭 Queue is empty.');
    return;
  }
  await interaction.editReply({ content: '', embeds: [buildQueueEmbed(player.current, player.queue, player.loopMode)] });
}

async function handleNp(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  if (!player.current) {
    await interaction.editReply('❌ Nothing is playing.');
    return;
  }
  await interaction.editReply({ content: '', embeds: [buildNowPlayingEmbed(player.current)] });
}

async function handleLoop(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  const mode = (interaction.options as any).getString('mode') as 'off' | 'song' | 'queue';
  player.loopMode = mode;
  const labels = { off: '🔁 Loop disabled', song: '🔂 Looping current song', queue: '🔁 Looping entire queue' };
  await interaction.editReply(labels[mode]);
}

async function handleShuffle(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  if (player.queue.length === 0) {
    await interaction.editReply('❌ Queue is empty.');
    return;
  }
  player.shuffle();
  await interaction.editReply(`🔀 Shuffled **${player.queue.length}** tracks.`);
}

async function handleRemove(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  const position = (interaction.options as any).getInteger('position') as number;
  const removed = player.remove(position - 1);
  if (!removed) {
    await interaction.editReply(`❌ No track at position **${position}**.`);
    return;
  }
  await interaction.editReply(`🗑️ Removed **${removed.title}** from queue.`);
}

async function handleClear(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  player.clear();
  await interaction.editReply('🗑️ Queue cleared.');
}

async function handleVolume(interaction: CommandInteraction, player: MusicPlayer): Promise<void> {
  const level = (interaction.options as any).getInteger('level') as number;
  player.setVolume(level);
  await interaction.editReply(`🔊 Volume set to **${level}%**.`);
}
