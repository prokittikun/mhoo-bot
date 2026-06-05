import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  GuildMember,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Command } from "../Command";
import { listWords } from "../database/services/wordService";

function buildEditWordComponents(words: string[], page: number) {
  const pageSize = 25;
  const totalPages = Math.ceil(words.length / pageSize);
  const pageWords = words.slice(page * pageSize, (page + 1) * pageSize);

  const select = new StringSelectMenuBuilder()
    .setCustomId("editword_select")
    .setPlaceholder("Select word to edit")
    .addOptions(pageWords.map((w) => ({ label: w, value: w })));

  const rows: ActionRowBuilder<any>[] = [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
  ];

  if (totalPages > 1) {
    const prevBtn = new ButtonBuilder()
      .setCustomId(`editword_page:${page - 1}`)
      .setLabel("◀ Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0);
    const pageInfo = new ButtonBuilder()
      .setCustomId("editword_page_info")
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    const nextBtn = new ButtonBuilder()
      .setCustomId(`editword_page:${page + 1}`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1);
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(prevBtn, pageInfo, nextBtn)
    );
  }

  return rows;
}

export { buildEditWordComponents };

export const EditWord: Command = {
  name: "editword",
  description: "Edit a word in the server's random word list",
  type: ApplicationCommandType.ChatInput,
  ephemeral: true,
  run: async (_client: Client, interaction: CommandInteraction) => {
    try {
      const member = interaction.member as GuildMember;
      if (!member.permissions.has("Administrator")) {
        await interaction.editReply("You must have the `ADMINISTRATOR` permission to use this command.");
        return;
      }

      const words = await listWords(interaction.guildId!);
      if (!words.length) {
        await interaction.editReply("No words in the list.");
        return;
      }

      const components = buildEditWordComponents(words, 0);
      await interaction.editReply({ content: "Select a word to edit:", components });
    } catch (error) {
      console.error("Error in editword command:", error);
      await interaction.editReply("An error occurred.");
    }
  },
};
