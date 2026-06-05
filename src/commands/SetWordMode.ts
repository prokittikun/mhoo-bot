import { CommandInteraction, Client, ApplicationCommandType, ApplicationCommandOptionType, GuildMember } from "discord.js";
import { Command } from "../Command";
import { setWordMode } from "../database/services/wordService";

export const SetWordMode: Command = {
  name: "setwordmode",
  description: "Set word selection mode for the welcome image",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "mode",
      description: "random = pick random word each time, fixed = always use the same word",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Random", value: "random" },
        { name: "Fixed", value: "fixed" },
      ],
    },
    {
      name: "fixedword",
      description: "The word to always use (required when mode is fixed)",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      const member = interaction.member as GuildMember;
      if (!member.permissions.has("Administrator")) {
        await interaction.followUp("You must have the `ADMINISTRATOR` permission to use this command.");
        return;
      }

      const mode = interaction.options.get("mode")?.value as "random" | "fixed";
      const fixedWord = interaction.options.get("fixedword")?.value as string | undefined;

      if (mode === "fixed" && !fixedWord) {
        await interaction.followUp("`fixedword` is required when mode is `fixed`.");
        return;
      }

      await setWordMode(interaction.guildId!, mode, fixedWord);

      if (mode === "fixed") {
        await interaction.followUp(`Word mode set to **fixed**: will always use **${fixedWord}**.`);
      } else {
        await interaction.followUp("Word mode set to **random**.");
      }
    } catch (error) {
      console.error("Error setting word mode:", error);
      await interaction.followUp("An error occurred while setting word mode.");
    }
  },
};
