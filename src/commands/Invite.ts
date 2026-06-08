import { CommandInteraction, Client, ApplicationCommandType, EmbedBuilder, OAuth2Scopes, PermissionFlagsBits } from 'discord.js';
import { Command } from '../Command';

export const Invite: Command = {
  name: 'invite',
  description: 'Get the invite link to add this bot to your server',
  type: ApplicationCommandType.ChatInput,

  run: async (client: Client, interaction: CommandInteraction) => {
    const link = client.generateInvite({
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
      permissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
      ],
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('➕ Add MHOO Bot to your server')
      .setDescription(`[Click here to invite](${link})`)
      .setThumbnail(client.user?.displayAvatarURL() ?? null);

    await interaction.editReply({ embeds: [embed] });
  },
};
