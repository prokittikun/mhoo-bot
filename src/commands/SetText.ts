import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  GuildMember,
} from "discord.js";
import { Command } from "../Command";
import ServerInfoModel from "../database/models/serverInfo";

export const SetText: Command = {
  name: "settext",
  description: "Set the text shown before/after the random word on the welcome image",
  type: ApplicationCommandType.ChatInput,
  ephemeral: true,
  options: [
    {
      name: "beforeword",
      description: 'Text before the random word. Result: "[beforeword] \\"word\\" [afterword]"',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "afterword",
      description: 'Text after the random word. Result: "[beforeword] \\"word\\" [afterword]"',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (_client: Client, interaction: CommandInteraction) => {
    try {
      const member = interaction.member as GuildMember;
      if (!member.permissions.has("Administrator")) {
        await interaction.editReply("You must have the `ADMINISTRATOR` permission to use this command.");
        return;
      }

      const beforeWord = interaction.options.get("beforeword")?.value as string;
      const afterWord = interaction.options.get("afterword")?.value as string;

      await ServerInfoModel.findOneAndUpdate(
        { serverId: interaction.guildId },
        { $set: { mainText: beforeWord, afterText: afterWord } },
        { upsert: true }
      );

      await interaction.editReply(
        `Text updated. Welcome image will show:\n> ${beforeWord} **"word"** ${afterWord}`
      );
    } catch (error) {
      console.error("Error setting text:", error);
      await interaction.editReply("An error occurred while setting the text.");
    }
  },
};
