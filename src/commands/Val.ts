import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from 'discord.js';
import { Command } from '../Command';
import { getRank, buildRankEmbed } from '../services/valorantApi';

const REGIONS = ['ap', 'na', 'eu', 'kr', 'br', 'latam'] as const;

export const Val: Command = {
  name: 'val',
  description: 'Valorant rank lookup',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'rank',
      description: 'Look up Valorant rank by Riot ID',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'name',
          description: 'Riot ID name (e.g. MaoKlee)',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'tag',
          description: 'Riot ID tag without # (e.g. 7331)',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'region',
          description: 'Region (default: ap)',
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: REGIONS.map((r) => ({ name: r.toUpperCase(), value: r })),
        },
      ],
    },
  ],
  run: async (_client: Client, interaction: CommandInteraction) => {
    const name = (interaction.options as any).getString('name') as string;
    const tag = (interaction.options as any).getString('tag') as string;
    const region = ((interaction.options as any).getString('region') as string | null) ?? 'ap';

    await interaction.editReply('⏳ Fetching rank...');

    try {
      const rank = await getRank(region, name, tag);
      if (!rank) {
        await interaction.editReply(`❌ Could not find rank for **${name}#${tag}** in ${region.toUpperCase()}.`);
        return;
      }
      const embed = buildRankEmbed(rank, name, tag);
      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (err: any) {
      console.error('Rank fetch error:', err?.message ?? err);
      await interaction.editReply(`❌ ${err?.response?.data?.errors?.[0]?.message ?? err?.message ?? 'Failed to fetch rank.'}`);
    }
  },
};
