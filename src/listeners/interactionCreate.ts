import {
  CommandInteraction,
  Client,
  Interaction,
  AutocompleteInteraction,
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Commands } from "../Commands";
import { listWords, removeWord, addWord } from "../database/services/wordService";
import { buildRemoveWordComponents } from "../commands/RemoveWord";
import { buildEditWordComponents } from "../commands/EditWord";
import { buildHelpEmbed, buildLangRow } from "../commands/Help";

export default (client: Client): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction as AutocompleteInteraction);
      return;
    }
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction as StringSelectMenuInteraction);
      return;
    }
    if (interaction.isButton()) {
      await handleButton(interaction as ButtonInteraction);
      return;
    }
    if (interaction.isModalSubmit()) {
      await handleModal(interaction as ModalSubmitInteraction);
      return;
    }
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(client, interaction);
    }
  });
};

const handleAutocomplete = async (_interaction: AutocompleteInteraction): Promise<void> => {
  // kept for any future autocomplete commands
};

const handleSelectMenu = async (interaction: StringSelectMenuInteraction): Promise<void> => {
  const [action] = interaction.customId.split(":");

  if (action === "removeword_select") {
    const word = interaction.values[0];
    const confirmBtn = new ButtonBuilder()
      .setCustomId(`removeword_confirm:${word}`)
      .setLabel(`🗑 Remove "${word}"`)
      .setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder()
      .setCustomId("removeword_cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);
    await interaction.update({ content: `Remove **${word}**?`, components: [row] });
    return;
  }

  if (action === "editword_select") {
    const word = interaction.values[0];
    const modal = new ModalBuilder()
      .setCustomId(`editword_modal:${word}`)
      .setTitle("Edit Word");
    const input = new TextInputBuilder()
      .setCustomId("editword_input")
      .setLabel("New word")
      .setStyle(TextInputStyle.Short)
      .setValue(word)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
    return;
  }
};

const handleButton = async (interaction: ButtonInteraction): Promise<void> => {
  const parts = interaction.customId.split(":");
  const action = parts[0];
  const serverId = interaction.guildId!;

  if (action === "removeword_confirm") {
    const word = parts.slice(1).join(":");
    await removeWord(serverId, word);
    await interaction.update({ content: `✅ Removed **${word}**.`, components: [] });
    return;
  }

  if (action === "removeword_cancel") {
    await interaction.update({ content: "Cancelled.", components: [] });
    return;
  }

  if (action === "removeword_page") {
    const page = parseInt(parts[1]);
    const words = await listWords(serverId);
    const components = buildRemoveWordComponents(words, page);
    await interaction.update({ content: "Select a word to remove:", components });
    return;
  }

  if (action === "editword_page") {
    const page = parseInt(parts[1]);
    const words = await listWords(serverId);
    const components = buildEditWordComponents(words, page);
    await interaction.update({ content: "Select a word to edit:", components });
    return;
  }

  if (action === "help_lang") {
    const lang = parts[1] as "en" | "th";
    const embed = buildHelpEmbed(lang, interaction.client);
    const row = buildLangRow(lang);
    await interaction.update({ embeds: [embed], components: [row] });
    return;
  }
};

const handleModal = async (interaction: ModalSubmitInteraction): Promise<void> => {
  const parts = interaction.customId.split(":");
  const action = parts[0];
  const serverId = interaction.guildId!;

  if (action === "editword_modal") {
    const oldWord = parts.slice(1).join(":");
    const newWord = interaction.fields.getTextInputValue("editword_input").trim();

    if (!newWord) {
      await interaction.reply({ content: "Word cannot be empty.", ephemeral: true });
      return;
    }
    if (newWord === oldWord) {
      await interaction.reply({ content: "No change.", ephemeral: true });
      return;
    }

    await removeWord(serverId, oldWord);
    await addWord(serverId, newWord);
    await interaction.reply({ content: `✅ Changed **${oldWord}** → **${newWord}**.`, ephemeral: true });
  }
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
  const slashCommand = Commands.find((c) => c.name === interaction.commandName);
  if (!slashCommand) {
    interaction.followUp({ content: "An error has occurred" });
    return;
  }

  await interaction.deferReply({ ephemeral: slashCommand.ephemeral ?? false });

  slashCommand.run(client, interaction);
};
