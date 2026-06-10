export type ThreatType = 'phishing' | 'ip_grabber' | 'discord_invite' | 'scam_keyword'

export interface ThreatResult {
  detected: boolean
  type?: ThreatType
  reason?: string
}

const IP_GRABBERS = new Set([
  'grabify.link', 'api.grabify.link',
  'iplogger.org', 'iplogger.com', 'iplogger.ru',
  '2no.co', 'yip.su', 'ps3cfw.com', 'lovebird.guru',
  'trk.my', 'blasze.com', 'blasze.tk',
  'iplis.ru', '02ip.ru', 'ipgraber.ru',
  'redirect.li', 'linkvertise.com',
])

const PHISHING_DOMAINS = new Set([
  'discordnitro-free.com', 'discord-nitro.gift', 'discord-gifts.com',
  'discordgift.site', 'discordapp.io', 'discordapt.com',
  'steamgifts.com.ru', 'steamcommunity-free.com', 'steamgift-free.com',
  'free-nitro.ru', 'get-nitro.ru', 'nitro-discord.ru',
  'claimnitro.com', 'discord-promo.ru',
])

const SCAM_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /free\s*nitro/i, reason: 'Free Nitro scam' },
  { pattern: /steam\s*gift\s*card/i, reason: 'Steam gift card scam' },
  { pattern: /discord\.gift\/[a-zA-Z0-9]+/i, reason: 'Fake Discord gift link' },
  { pattern: /click\s*here\s*to\s*(claim|get|receive)/i, reason: 'Clickbait' },
  { pattern: /you\s*(have\s*)?(been\s*)?(selected|won|are\s*the\s*(lucky|winner))/i, reason: 'Prize scam' },
  { pattern: /claim\s*your\s*(free\s*)?(gift|prize|reward|nitro)/i, reason: 'Fake reward' },
  { pattern: /\@everyone.*\b(free|gift|win|click|claim)\b/i, reason: '@everyone bait' },
  { pattern: /\b(airdrop|crypto|nft)\b.*(free|earn|claim|send\s*wallet)/i, reason: 'Crypto scam' },
]

function extractDomains(text: string): string[] {
  const matches = text.matchAll(/https?:\/\/([^/\s?#]+)/gi)
  return [...matches].map((m) => m[1].toLowerCase().replace(/^www\./, ''))
}

export function detectThreat(
  content: string,
  opts: { blockInvites: boolean },
): ThreatResult {
  const domains = extractDomains(content)

  for (const domain of domains) {
    if (IP_GRABBERS.has(domain)) {
      return { detected: true, type: 'ip_grabber', reason: `IP grabber domain: ${domain}` }
    }
    if (PHISHING_DOMAINS.has(domain)) {
      return { detected: true, type: 'phishing', reason: `Phishing domain: ${domain}` }
    }
  }

  if (opts.blockInvites && /discord\.gg\/[a-zA-Z0-9]+/i.test(content)) {
    return { detected: true, type: 'discord_invite', reason: 'Discord invite link' }
  }

  for (const { pattern, reason } of SCAM_PATTERNS) {
    if (pattern.test(content)) {
      return { detected: true, type: 'scam_keyword', reason }
    }
  }

  return { detected: false }
}
