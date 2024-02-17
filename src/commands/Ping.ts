import { CommandInteraction, Client, ApplicationCommandType } from "discord.js";
import { Command } from "../Command";

export const Ping: Command = {
    name: "ping",
    description: "Returns a greeting",
    type: ApplicationCommandType.ChatInput,
    run: async (client: Client, interaction: CommandInteraction) => {
        const content = "Pong";

        await interaction.followUp({
            ephemeral: true,
            content
        });
    }
};