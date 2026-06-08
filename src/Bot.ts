import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { config } from "dotenv";
import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";
import voiceStateUpdate from "./listeners/voiceStateUpdate";
import connectDB from "./database/services/database.service";
import { createWelcomeImage } from "./utils/createWelcomeImage";
import ServerInfoModel from "./database/models/serverInfo";
import { getWordForServer } from "./database/services/wordService";
import { initPlayDl } from "./services/playDlService";

config();
console.log("Bot is starting...");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

ready(client);
interactionCreate(client);
voiceStateUpdate(client);
connectDB();
initPlayDl().catch(console.error);

client.on("guildMemberAdd", async (member) => {
  const memberInfo = member.user;

  const imageURL = memberInfo.displayAvatarURL({ size: 512, extension: 'png' });

  const serverInfo = await ServerInfoModel.findOne({ serverId: member.guild.id });
  if (!serverInfo?.joinImageName || !serverInfo?.welcomeChannelId) return;

  const word = await getWordForServer(member.guild.id);
  const result = await createWelcomeImage(
    imageURL,
    memberInfo.username,
    serverInfo.joinImageName,
    word,
    serverInfo.mainText,
    serverInfo.afterText
  );

  const channel = client.channels.cache.get(serverInfo.welcomeChannelId);
  if (!channel) return;
  (channel as TextChannel).send({ files: [result] });
});

client.login(process.env.DISCORD_BOT_TOKEN);
