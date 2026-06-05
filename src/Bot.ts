import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { config } from "dotenv";
import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";
import { GuildMember } from "discord.js"; // Import the necessary event type
import connectDB from "./database/services/database.service";
import { createWelcomeImage } from "./utils/createWelcomeImage";
import ServerInfoModel from "./database/models/serverInfo";
import { getWordForServer } from "./database/services/wordService";
import path from "path";
config();
console.log("Bot is starting...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

ready(client);
interactionCreate(client);
connectDB();

client.on("guildMemberAdd", async (member) => {
  const memberInfo = member.user;
  
  const imageURL = memberInfo.avatarURL()
    ? memberInfo.avatarURL()
    : memberInfo.defaultAvatarURL;

  const serverInfo = await ServerInfoModel.findOne({serverId: member.guild.id});
  if(!serverInfo?.joinImageName || !serverInfo?.welcomeChannelId){
    return;
  }
  const word = await getWordForServer(member.guild.id);
  const result = await createWelcomeImage(
    imageURL!,
    memberInfo.username,
    serverInfo.joinImageName,
    word,
    serverInfo.mainText,
    serverInfo.afterText
  );

  const channel = client.channels.cache.get(serverInfo.welcomeChannelId);
  if(!channel) return;
  const welcomeChannel = channel as TextChannel;
  welcomeChannel.send({
    files: [result],
  });
 

  console.log(123);
});

client.login(process.env.DISCORD_BOT_TOKEN);
