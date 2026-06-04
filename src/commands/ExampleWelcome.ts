import { CommandInteraction, Client, ApplicationCommandType, AttachmentBuilder } from "discord.js";
import { Command } from "../Command";
import ServerInfoModel from "../database/models/serverInfo";
import { createWelcomeImage } from "../utils/createWelcomeImage";

export const ExampleWelcome: Command = {
  name: "example",
  description: "Preview the welcome image with the current background",
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      const serverInfo = await ServerInfoModel.findOne({
        serverId: interaction.guildId,
      });

      if (!serverInfo?.joinImageName) {
        await interaction.followUp(
          "No background image set. Use `/set` to set one first."
        );
        return;
      }

      const avatarUrl =
        interaction.user.displayAvatarURL({ extension: "png", size: 256 }) ??
        "https://cdn.discordapp.com/embed/avatars/0.png";

      const imageBuffer = await createWelcomeImage(
        avatarUrl,
        interaction.user.displayName,
        serverInfo.joinImageName
      );

      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "welcome-preview.png",
      });

      await interaction.followUp({
        content: "Here is a preview of the welcome image:",
        files: [attachment],
      });
    } catch (error) {
      console.error("Error generating example welcome image:", error);
      await interaction.followUp(
        "An error occurred while generating the preview."
      );
    }
  },
};
