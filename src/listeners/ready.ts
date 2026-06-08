import { Client, ActivityType } from "discord.js";
import { Commands } from "../Commands";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

const ACTIVITIES: { name: string; type: ActivityType }[] = [
  { name: "/music play — play music", type: ActivityType.Playing },
  { name: "อู๊ดๆ", type: ActivityType.Playing },
  { name: "your welcome messages", type: ActivityType.Watching },
  { name: "/help — need help?", type: ActivityType.Watching },
  { name: "to your requests", type: ActivityType.Listening },
  { name: "/invite — add me to your server!", type: ActivityType.Playing },
];

export default (client: Client): void => {
  client.on("ready", async () => {
    if (!client.user || !client.application) {
      return;
    }
    await client.application.commands.set(Commands);

    const gitCommit = process.env.GIT_COMMIT || "dev";
    const botVersion = `v${version} (${gitCommit})`;

    const versionActivity = { name: botVersion, type: ActivityType.Watching };
    const all = [versionActivity, ...ACTIVITIES];
    let index = 0;

    const rotate = () => {
      client.user?.setPresence({
        activities: [all[index % all.length]],
        status: "online",
      });
      index++;
    };

    rotate();
    setInterval(rotate, 2 * 60 * 1000);

    console.log(`${client.user.username} is online — ${botVersion}`);
  });
};
