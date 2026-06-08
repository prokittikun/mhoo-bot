import { Client, VoiceState } from 'discord.js';
import { destroyPlayer } from '../music/MusicManager';

export default (client: Client): void => {
  client.on('voiceStateUpdate', (_oldState: VoiceState, newState: VoiceState) => {
    const guild = newState.guild;
    const botMember = guild.members.me;
    if (!botMember?.voice.channelId) return;

    const botChannel = botMember.voice.channel;
    if (!botChannel) return;

    const nonBotCount = botChannel.members.filter((m) => !m.user.bot).size;
    if (nonBotCount > 0) return;

    console.log(`[Music:${guild.id}] Alone in voice channel — disconnecting`);
    destroyPlayer(guild.id);
  });
};
