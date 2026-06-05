import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Command } from "../Command";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

export function buildHelpEmbed(lang: "en" | "th", client: Client): EmbedBuilder {
  const botAvatar = client.user?.displayAvatarURL() ?? undefined;
  const gitCommit = process.env.GIT_COMMIT || "dev";
  const footer = `v${version} (${gitCommit})`;

  if (lang === "th") {
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 วิธีใช้ MHOO Bot")
      .setThumbnail(botAvatar ?? null)
      .addFields(
        {
          name: "⚙️ ตั้งค่า  •  Admin เท่านั้น",
          value: [
            "`/set` `[ช่อง]` `[รูปพื้นหลัง]` — กำหนดช่องต้อนรับและรูปพื้นหลัง",
            "`/settext` `[ก่อนคำ]` `[หลังคำ]` — ข้อความหน้า/หลังคำสุ่มในรูป",
            "`/setwordmode` `[โหมด]` `[คำ?]` — โหมดสุ่มหรือคงที่",
            "`/reset` — ล้างการตั้งค่าทั้งหมดของเซิร์ฟเวอร์",
          ].join("\n"),
        },
        {
          name: "🔤 จัดการคำ  •  Admin เท่านั้น",
          value: [
            "`/addword` `[คำ]` — เพิ่มคำในรายการ",
            "`/removeword` — ลบคำ (dropdown + ปุ่มยืนยัน)",
            "`/editword` — แก้ไขคำ (dropdown → popup กรอกคำใหม่)",
            "`/listwords` — ดูคำทั้งหมดในรายการ",
          ].join("\n"),
        },
        {
          name: "👁 ดูตัวอย่าง",
          value: "`/example` — ดูตัวอย่างภาพต้อนรับด้วยการตั้งค่าปัจจุบัน",
        },
        {
          name: "🏓 อื่นๆ",
          value: "`/ping` — ตรวจสอบสถานะบอท",
        },
        {
          name: "💡 รูปแบบข้อความในภาพ",
          value: '`[ก่อนคำ]` **"คำ"** `[หลังคำ]`\nค่าเริ่มต้น: `พี่ดอมต้องการ "word" คุณ`',
        }
      )
      .setFooter({ text: footer });
  }

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🤖 MHOO Bot Help")
    .setThumbnail(botAvatar ?? null)
    .addFields(
      {
        name: "⚙️ Setup  •  Admin only",
        value: [
          "`/set` `[channel]` `[background]` — Set welcome channel & background image",
          "`/settext` `[before]` `[after]` — Text shown before/after the word on the image",
          "`/setwordmode` `[mode]` `[word?]` — Set word mode: random or fixed",
          "`/reset` — Remove all server configuration",
        ].join("\n"),
      },
      {
        name: "🔤 Word List  •  Admin only",
        value: [
          "`/addword` `[word]` — Add a word to the list",
          "`/removeword` — Remove a word (dropdown + confirm button)",
          "`/editword` — Edit a word (dropdown → modal)",
          "`/listwords` — View all words in the list",
        ].join("\n"),
      },
      {
        name: "👁 Preview",
        value: "`/example` — Preview the welcome image with current settings",
      },
      {
        name: "🏓 Other",
        value: "`/ping` — Check if the bot is alive",
      },
      {
        name: "💡 Welcome Image Text Format",
        value: '`[before]` **"word"** `[after]`\nDefault: `พี่ดอมต้องการ "word" คุณ`',
      }
    )
    .setFooter({ text: footer });
}

export function buildLangRow(current: "en" | "th"): ActionRowBuilder<ButtonBuilder> {
  const enBtn = new ButtonBuilder()
    .setCustomId("help_lang:en")
    .setLabel("🇬🇧 English")
    .setStyle(current === "en" ? ButtonStyle.Primary : ButtonStyle.Secondary);
  const thBtn = new ButtonBuilder()
    .setCustomId("help_lang:th")
    .setLabel("🇹🇭 ภาษาไทย")
    .setStyle(current === "th" ? ButtonStyle.Primary : ButtonStyle.Secondary);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(enBtn, thBtn);
}

export const Help: Command = {
  name: "help",
  description: "Show bot usage guide",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "language",
      description: "Display language (default: en)",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "English", value: "en" },
        { name: "ภาษาไทย", value: "th" },
      ],
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      const lang = (interaction.options.get("language")?.value as "en" | "th") ?? "en";
      const embed = buildHelpEmbed(lang, client);
      const row = buildLangRow(lang);
      await interaction.followUp({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("Error in help command:", error);
      await interaction.followUp("An error occurred.");
    }
  },
};
