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
          name: "🎵 เพลง",
          value: [
            "`/music play` `[คำค้นหา/URL]` — เล่นเพลงจาก YouTube, Spotify, SoundCloud",
            "`/music skip` — ข้ามเพลงปัจจุบัน",
            "`/music stop` — หยุดและออกจากช่องเสียง",
            "`/music pause` / `/music resume` — หยุดชั่วคราว / เล่นต่อ",
            "`/music queue` — ดูคิวเพลง",
            "`/music np` — ดูเพลงที่กำลังเล่น (พร้อมปุ่มควบคุม)",
            "`/music loop` `[โหมด]` — วนซ้ำ: off / song / queue",
            "`/music shuffle` — สลับลำดับคิว",
            "`/music volume` `[1-100]` — ปรับระดับเสียง",
            "`/music remove` `[ตำแหน่ง]` — ลบเพลงออกจากคิว",
            "`/music clear` — ล้างคิวทั้งหมด",
          ].join("\n"),
        },
        {
          name: "🛡️ ป้องกันสแปม  •  Admin เท่านั้น",
          value: [
            "`/antispam enable` / `/antispam disable` — เปิด/ปิดการป้องกันสแปมข้อความ (rate-limit)",
            "`/antispam config` — ตั้งค่า threshold, window, action, timeout",
            "`/antispam threat enabled:True` — เปิดตรวจจับเนื้อหาอันตราย",
            "`/antispam threat action:delete_warn` — action เมื่อเจอภัยคุกคาม",
            "`/antispam threat block-invites:True` — บล็อก invite link จากคนที่ไม่ใช่ Admin",
            "`/antispam status` — ดูการตั้งค่าปัจจุบัน",
            "ตรวจจับ: ฟิชชิ่ง, IP grabber, ลิงก์ปลอม, Nitro/Steam สแปม, crypto สแปม",
          ].join("\n"),
        },
        {
          name: "👁 ดูตัวอย่าง",
          value: "`/example` — ดูตัวอย่างภาพต้อนรับด้วยการตั้งค่าปัจจุบัน",
        },
        {
          name: "🏓 อื่นๆ",
          value: [
            "`/ping` — ตรวจสอบสถานะบอท",
            "`/invite` — รับลิงก์เชิญบอทไปยังเซิร์ฟเวอร์ของคุณ",
          ].join("\n"),
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
        name: "🎵 Music",
        value: [
          "`/music play` `[query/URL]` — Play from YouTube, Spotify, SoundCloud",
          "`/music skip` — Skip the current track",
          "`/music stop` — Stop and disconnect",
          "`/music pause` / `/music resume` — Pause / Resume",
          "`/music queue` — Show the queue",
          "`/music np` — Now playing (with control buttons)",
          "`/music loop` `[mode]` — Loop: off / song / queue",
          "`/music shuffle` — Shuffle the queue",
          "`/music volume` `[1-100]` — Set volume",
          "`/music remove` `[position]` — Remove a track from queue",
          "`/music clear` — Clear the queue",
        ].join("\n"),
      },
      {
        name: "🛡️ Anti-Spam  •  Admin only",
        value: [
          "`/antispam enable` / `/antispam disable` — Enable/disable rate-limit spam protection",
          "`/antispam config` — Set threshold, window, action, timeout duration",
          "`/antispam threat enabled:True` — Enable content threat detection",
          "`/antispam threat action:delete_warn` — Action when threat is detected",
          "`/antispam threat block-invites:True` — Block Discord invites from non-admins",
          "`/antispam status` — View current settings",
          "Detects: phishing, IP grabbers, fake Nitro/Steam, crypto scams, @everyone bait",
        ].join("\n"),
      },
      {
        name: "👁 Preview",
        value: "`/example` — Preview the welcome image with current settings",
      },
      {
        name: "🏓 Other",
        value: [
          "`/ping` — Check if the bot is alive",
          "`/invite` — Get the invite link to add this bot to your server",
        ].join("\n"),
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
