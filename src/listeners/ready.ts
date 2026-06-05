import { Client, ActivityType } from "discord.js";
import { Commands } from "../Commands";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

export default (client: Client): void => {
    client.on("ready", async () => {
        if (!client.user || !client.application) {
            return;
        }
        await client.application.commands.set(Commands);

        const gitCommit = process.env.GIT_COMMIT || "dev";
        const botVersion = `v${version} (${gitCommit})`;

        client.user.setPresence({
            activities: [{ name: botVersion, type: ActivityType.Watching }],
            status: "online",
        });

        console.log(`${client.user.username} is online — ${botVersion}`);
    });
};
