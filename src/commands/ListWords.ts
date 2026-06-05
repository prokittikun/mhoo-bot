import { CommandInteraction, Client, ApplicationCommandType, GuildMember } from "discord.js";
import { Command } from "../Command";
import { listWords } from "../database/services/wordService";

export const ListWords: Command = {
  name: "listwords",
  description: "List all words in this server's random word list",
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      const words = await listWords(interaction.guildId!);

      if (words.length === 0) {
        await interaction.followUp("No words in the list.");
        return;
      }

      const formatted = words.map((w, i) => `${i + 1}. ${w}`).join("\n");
      const chunks: string[] = [];
      let current = "**Word list:**\n";
      for (const line of formatted.split("\n")) {
        if ((current + "\n" + line).length > 1900) {
          chunks.push(current);
          current = line;
        } else {
          current += (current === "" ? "" : "\n") + line;
        }
      }
      chunks.push(current);

      for (const chunk of chunks) {
        await interaction.followUp(chunk);
      }
    } catch (error) {
      console.error("Error listing words:", error);
      await interaction.followUp("An error occurred while listing words.");
    }
  },
};
