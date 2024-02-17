import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  GuildMember,
} from "discord.js";
import { Command } from "../Command";
import { downloadImage } from "../utils/downloadImage";
import path from "path";
import ServerInfoModel from "../database/models/serverInfo";

export const JoinImage: Command = {
  name: "set",
  description: "Set join image for server",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "channel",
      description: "channel to send welcome message",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: "background",
      description: "join image background",
      type: ApplicationCommandOptionType.Attachment,
      required: true,
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      //check if the user has the required admin permissions
      const member = interaction.member as GuildMember;
      if (!member.permissions.has("Administrator")) {
        await interaction.followUp(
          "You must have the `ADMINISTRATOR` permission to use this command."
        );
        return;
      }
      if (interaction.options?.get("background")) {
        const imageOption = interaction.options.get("background");
        console.log(imageOption);

        if (imageOption?.type === ApplicationCommandOptionType.Attachment) {
          const imageUrl = imageOption.attachment?.proxyURL as string;
          console.log(`Received join image: ${imageUrl}`);
          const dateTimestamp = new Date().getTime().toString();
          const image = await downloadImage(
            imageUrl,
            "../../public/assets/background/",
            dateTimestamp
          );
          if (image) {
            const serverInfo = await ServerInfoModel.findOne({
              serverId: interaction.guildId,
            });
            if (!serverInfo) {
              const newServerInfo = new ServerInfoModel({
                serverId: interaction.guildId as string,
                welcomeChannelId: interaction.options.get("channel")
                  ?.value as string,
                joinImageName: `${dateTimestamp}.png`,
              });
              await newServerInfo.save();
            } else {
              serverInfo.welcomeChannelId = interaction.options.get("channel")
                ?.value as string;
              serverInfo.joinImageName = `${dateTimestamp}.png`;
              await serverInfo.save();
            }
            await interaction.followUp("Join image set successfully!");
          }
        } else {
          await interaction.followUp("Please provide a valid image URL.");
        }
      } else {
        await interaction.followUp(
          "Please attach an image to set as the join image."
        );
      }
    } catch (error) {
      console.error("Error setting join image:", error);
      await interaction.followUp(
        "An error occurred while setting the join image."
      );
    }
  },
};
