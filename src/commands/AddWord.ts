import { CommandInteraction, Client, ApplicationCommandType, ApplicationCommandOptionType, GuildMember } from "discord.js";
import { Command } from "../Command";
import { addWord } from "../database/services/wordService";

export const AddWord: Command = {
  name: "addword",
  description: "Add a word to the server's random word list",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "word",
      description: "Word to add",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      const member = interaction.member as GuildMember;
      if (!member.permissions.has("Administrator")) {
        await interaction.followUp("You must have the `ADMINISTRATOR` permission to use this command.");
        return;
      }

      const word = interaction.options.get("word")?.value as string;
      await addWord(interaction.guildId!, word);
      await interaction.followUp(`Added **${word}** to the word list.`);
    } catch (error) {
      console.error("Error adding word:", error);
      await interaction.followUp("An error occurred while adding the word.");
    }
  },
};
