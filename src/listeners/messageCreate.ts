import { Client, TextChannel } from 'discord.js';
import ServerInfoModel from '../database/models/serverInfo';
import { record, isWarned, setWarned, clear } from '../antispam/SpamTracker';
import { detectThreat } from '../antispam/ThreatDetector';

async function logAction(
  client: Client,
  logChannelId: string | undefined,
  text: string,
): Promise<void> {
  if (!logChannelId) return;
  const ch = client.channels.cache.get(logChannelId) as TextChannel | undefined;
  ch?.send(text).catch(() => {});
}

export default (client: Client): void => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.member) return;

    const serverInfo = await ServerInfoModel.findOne({ serverId: message.guild.id });
    if (!serverInfo) return;

    const member = message.member;
    const guildId = message.guild.id;
    const userId = message.author.id;

    // ── Threat detection (content-based) ──────────────────────────────────
    if (serverInfo.threatEnabled && message.content) {
      const threat = detectThreat(message.content, {
        blockInvites: serverInfo.threatBlockInvites,
      });

      if (threat.detected) {
        const threatAction = serverInfo.threatAction ?? 'delete_warn';
        const threatTimeout = serverInfo.threatTimeoutMin ?? 10;

        try { await message.delete(); } catch {}

        const tag = message.author.tag;

        if (threatAction === 'delete_warn' || threatAction === 'delete_timeout') {
          try {
            await message.channel.send(
              `⚠️ ${message.author} Your message was removed — **${threat.reason}**.`,
            );
          } catch {}
        }

        if (threatAction === 'delete_timeout') {
          try {
            await member.timeout(threatTimeout * 60 * 1000, `Threat: ${threat.reason}`);
            await message.channel.send(
              `🔇 ${message.author} timed out for **${threatTimeout}min** — ${threat.reason}.`,
            );
          } catch (err: any) {
            console.error(`[Threat] Timeout failed for ${tag}:`, err?.message);
          }
        }

        await logAction(
          client,
          serverInfo.antispamLogChannelId,
          `🚨 **Threat detected** | User: ${tag} (\`${userId}\`) | Type: **${threat.type}** | Reason: ${threat.reason} | Action: **${threatAction}** | Guild: ${message.guild.name}`,
        );

        return;
      }
    }

    // ── Rate-limit spam detection ──────────────────────────────────────────
    if (!serverInfo.antispamEnabled) return;

    const threshold = serverInfo.antispamThreshold;
    const windowMs = serverInfo.antispamWindow * 1000;
    const action = serverInfo.antispamAction;
    const timeoutMin = serverInfo.antispamTimeoutMin;

    const count = record(guildId, userId, windowMs);
    if (count < threshold) return;

    if (!isWarned(guildId, userId)) {
      setWarned(guildId, userId);
      try {
        await message.reply('⚠️ Slow down! Sending too fast — next violation will be actioned.');
      } catch {}
      return;
    }

    clear(guildId, userId);

    try {
      if (action === 'timeout') {
        await member.timeout(timeoutMin * 60 * 1000, 'Anti-spam: rate limit');
        await message.channel.send(`🔇 ${message.author} timed out for **${timeoutMin}min** — spam.`);
      } else if (action === 'kick') {
        await member.kick('Anti-spam: rate limit');
        await message.channel.send(`👢 ${message.author.tag} kicked — spam.`);
      } else {
        await message.reply('⛔ Final warning: stop spamming or you will be actioned.');
      }
    } catch (err: any) {
      console.error(`[Antispam] Action failed for ${message.author.tag}:`, err?.message);
    }

    await logAction(
      client,
      serverInfo.antispamLogChannelId,
      `🛡️ **Spam** | User: ${message.author.tag} (\`${userId}\`) | Action: **${action}** | Guild: ${message.guild.name}`,
    );
  });
};
