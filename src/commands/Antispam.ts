import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  GuildMember,
} from 'discord.js';
import { Command } from '../Command';
import ServerInfoModel from '../database/models/serverInfo';

export const Antispam: Command = {
  name: 'antispam',
  description: 'Configure anti-spam protection for this server',
  type: ApplicationCommandType.ChatInput,
  ephemeral: true,
  options: [
    {
      name: 'enable',
      description: 'Enable anti-spam protection',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'disable',
      description: 'Disable anti-spam protection',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'config',
      description: 'Configure anti-spam settings',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'threshold',
          description: 'Messages before action is taken (default: 5)',
          type: ApplicationCommandOptionType.Integer,
          required: false,
          minValue: 2,
          maxValue: 20,
        },
        {
          name: 'window',
          description: 'Time window in seconds to count messages (default: 5)',
          type: ApplicationCommandOptionType.Integer,
          required: false,
          minValue: 1,
          maxValue: 30,
        },
        {
          name: 'action',
          description: 'Action to take on spammer (default: timeout)',
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: 'Warn only', value: 'warn' },
            { name: 'Timeout', value: 'timeout' },
            { name: 'Kick', value: 'kick' },
          ],
        },
        {
          name: 'duration',
          description: 'Timeout duration in minutes (default: 5)',
          type: ApplicationCommandOptionType.Integer,
          required: false,
          minValue: 1,
          maxValue: 1440,
        },
        {
          name: 'log-channel',
          description: 'Channel to log spam actions (optional)',
          type: ApplicationCommandOptionType.Channel,
          required: false,
        },
      ],
    },
    {
      name: 'threat',
      description: 'Configure threat/content detection (phishing, IP grabbers, scam links)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'enabled',
          description: 'Enable or disable threat detection',
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
        {
          name: 'action',
          description: 'Action when threat detected (default: delete_warn)',
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: 'Delete only', value: 'delete' },
            { name: 'Delete + Warn', value: 'delete_warn' },
            { name: 'Delete + Timeout', value: 'delete_timeout' },
          ],
        },
        {
          name: 'block-invites',
          description: 'Block Discord invite links from non-admins',
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
        {
          name: 'timeout-duration',
          description: 'Timeout duration in minutes when action is delete_timeout (default: 10)',
          type: ApplicationCommandOptionType.Integer,
          required: false,
          minValue: 1,
          maxValue: 1440,
        },
      ],
    },
    {
      name: 'status',
      description: 'Show current anti-spam settings',
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async (_client: Client, interaction: CommandInteraction) => {
    const member = interaction.member as GuildMember;
    if (!member.permissions.has('Administrator')) {
      await interaction.editReply('❌ Administrator permission required.');
      return;
    }

    const sub = (interaction.options as any).getSubcommand() as string;
    const serverId = interaction.guildId!;

    if (sub === 'enable') {
      await ServerInfoModel.findOneAndUpdate(
        { serverId },
        { $set: { antispamEnabled: true } },
        { upsert: true },
      );
      await interaction.editReply('✅ Anti-spam **enabled**.');
      return;
    }

    if (sub === 'disable') {
      await ServerInfoModel.findOneAndUpdate(
        { serverId },
        { $set: { antispamEnabled: false } },
        { upsert: true },
      );
      await interaction.editReply('✅ Anti-spam **disabled**.');
      return;
    }

    if (sub === 'config') {
      const opts = interaction.options as any;
      const update: Record<string, unknown> = {};

      const threshold = opts.getInteger('threshold');
      const window = opts.getInteger('window');
      const action = opts.getString('action');
      const duration = opts.getInteger('duration');
      const logChannel = opts.getChannel('log-channel');

      if (threshold != null) update.antispamThreshold = threshold;
      if (window != null) update.antispamWindow = window;
      if (action != null) update.antispamAction = action;
      if (duration != null) update.antispamTimeoutMin = duration;
      if (logChannel != null) update.antispamLogChannelId = logChannel.id;

      if (Object.keys(update).length === 0) {
        await interaction.editReply('❌ Provide at least one setting to update.');
        return;
      }

      await ServerInfoModel.findOneAndUpdate({ serverId }, { $set: update }, { upsert: true });
      await interaction.editReply('✅ Anti-spam settings updated.');
      return;
    }

    if (sub === 'threat') {
      const opts = interaction.options as any;
      const update: Record<string, unknown> = {};

      const enabled = opts.getBoolean('enabled');
      const action = opts.getString('action');
      const blockInvites = opts.getBoolean('block-invites');
      const duration = opts.getInteger('timeout-duration');

      if (enabled != null) update.threatEnabled = enabled;
      if (action != null) update.threatAction = action;
      if (blockInvites != null) update.threatBlockInvites = blockInvites;
      if (duration != null) update.threatTimeoutMin = duration;

      if (Object.keys(update).length === 0) {
        await interaction.editReply('❌ Provide at least one setting to update.');
        return;
      }

      await ServerInfoModel.findOneAndUpdate({ serverId }, { $set: update }, { upsert: true });
      await interaction.editReply('✅ Threat detection settings updated.');
      return;
    }

    if (sub === 'status') {
      const info = await ServerInfoModel.findOne({ serverId });
      const lines = [
        '**── Spam (rate-limit) ──**',
        `Enabled: ${info?.antispamEnabled ? '✅' : '❌'}  |  Threshold: ${info?.antispamThreshold ?? 5} msgs  |  Window: ${info?.antispamWindow ?? 5}s`,
        `Action: ${info?.antispamAction ?? 'timeout'}  |  Timeout: ${info?.antispamTimeoutMin ?? 5}min`,
        `Log channel: ${info?.antispamLogChannelId ? `<#${info.antispamLogChannelId}>` : 'None'}`,
        '',
        '**── Threat (content) ──**',
        `Enabled: ${info?.threatEnabled ? '✅' : '❌'}  |  Block invites: ${info?.threatBlockInvites ? '✅' : '❌'}`,
        `Action: ${info?.threatAction ?? 'delete_warn'}  |  Timeout: ${info?.threatTimeoutMin ?? 10}min`,
        '',
        '**Detects:** phishing domains, IP grabbers, fake Nitro/Steam scams, crypto scams, @everyone bait',
      ];
      await interaction.editReply(lines.join('\n'));
    }
  },
};
