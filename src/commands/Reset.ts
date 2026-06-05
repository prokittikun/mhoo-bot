import { CommandInteraction, Client, ApplicationCommandType, GuildMember } from "discord.js";
import { Command } from "../Command";
import ServerInfoModel from "../database/models/serverInfo";
import { s3 } from "../utils/S3-Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const Reset: Command = {
  name: "reset",
  description: "Remove all bot configuration for this server",
  type: ApplicationCommandType.ChatInput,
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      const member = interaction.member as GuildMember;
      if (!member.permissions.has("Administrator")) {
        await interaction.followUp("You must have the `ADMINISTRATOR` permission to use this command.");
        return;
      }

      const serverInfo = await ServerInfoModel.findOne({ serverId: interaction.guildId });
      if (!serverInfo) {
        await interaction.followUp("No configuration found for this server.");
        return;
      }

      if (serverInfo.joinImageName) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: "banner-mhoo-bot",
            Key: serverInfo.joinImageName,
          }));
        } catch (s3Error) {
          console.error("S3 deletion failed (continuing reset):", s3Error);
        }
      }

      await ServerInfoModel.deleteOne({ serverId: interaction.guildId });
      await interaction.followUp("Server configuration has been reset.");
    } catch (error) {
      console.error("Error resetting server config:", error);
      await interaction.followUp("An error occurred while resetting server configuration.");
    }
  },
};
