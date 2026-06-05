# MHOO Bot — Claude Context

Discord welcome bot. Sends a custom welcome image when a new member joins a server. Each server configures its own background image, text, and word list.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Discord | discord.js v14 |
| Database | MongoDB via Mongoose |
| Object storage | MinIO (S3-compatible, self-hosted) — bucket `banner-mhoo-bot` |
| Image processing | canvas, Jimp, sharp |
| Infrastructure | Docker Compose (dev) / Portainer stack (prod) |

## Project Structure

```
src/
  Bot.ts                          # Entry point — Discord client, guildMemberAdd event
  Command.ts                      # Command interface (extends ChatInputApplicationCommandData)
  Commands.ts                     # Registry — all commands exported as array
  commands/
    Ping.ts                       # /ping
    MemberJoinServer.ts           # /set — set welcome channel + background image
    ExampleWelcome.ts             # /example — preview welcome image
    AddWord.ts                    # /addword
    RemoveWord.ts                 # /removeword — interactive dropdown + confirm button
    EditWord.ts                   # /editword — dropdown → modal
    ListWords.ts                  # /listwords
    SetWordMode.ts                # /setwordmode random|fixed
    SetText.ts                    # /settext — configure mainText/afterText
    Help.ts                       # /help — EN/TH toggle embed
    Reset.ts                      # /reset — wipe server config + S3 image
  listeners/
    ready.ts                      # Register commands, set bot presence (version)
    interactionCreate.ts          # Route: slash commands, autocomplete, select menus, buttons, modals
  database/
    models/serverInfo.ts          # ServerInfo Mongoose model
    services/database.service.ts  # MongoDB connect
    services/wordService.ts       # Word list CRUD + lazy migration from word.txt
  utils/
    S3-Client.ts                  # AWS S3 client (points to MinIO)
    createWelcomeImage.ts         # Canvas image generator

public/
  assets/
    word.txt                      # Default word list (seeds DB on first use per server)
    background/frame.png          # Circular avatar frame overlay
  fonts/Kanit/                    # Thai font (Kanit Bold, ExtraBold)
```

## Database Model — `serverinfos`

```typescript
{
  serverId: string          // Discord guild ID
  welcomeChannelId?: string // Channel to post welcome messages
  joinImageName?: string    // S3 object key for background image
  words: string[]           // Per-server word list (lazy-seeded from word.txt)
  wordMode: 'random'|'fixed' // default: 'random'
  fixedWord?: string        // Used when wordMode === 'fixed'
  mainText?: string         // Text before quoted word (default: 'พี่ดอมต้องการ')
  afterText?: string        // Text after quoted word (default: 'คุณ')
}
```

## Welcome Image

Canvas 1024×500px. Layers:
1. Background fetched from MinIO S3
2. Member avatar → circle crop with frame overlay (`frame.png`)
3. "WELCOME!" text (80px)
4. Member display name (45px)
5. `[mainText] "randomWord" [afterText]` — mainText/afterText white, randomWord red

`createWelcomeImage(memberProfile, displayName, joinImageName, wordOverride?, mainText?, afterText?)`

## Commands Reference

| Command | Auth | Description |
|---|---|---|
| `/set [channel] [background]` | Admin | Set welcome channel + upload background to MinIO |
| `/settext [before] [after]` | Admin | Configure text flanking the word |
| `/setwordmode [mode] [word?]` | Admin | random or fixed word |
| `/addword [word]` | Admin | Add word to server list |
| `/removeword` | Admin | Interactive: dropdown → confirm button |
| `/editword` | Admin | Interactive: dropdown → modal (pre-filled) |
| `/listwords` | All | Show word list (seeds from word.txt if empty) |
| `/example` | All | Preview welcome image with current settings |
| `/help [language?]` | All | Help embed EN/TH with language toggle buttons |
| `/reset` | Admin | Delete S3 image + wipe ServerInfo from DB |
| `/ping` | All | Bot alive check |

## Interaction Architecture

`interactionCreate.ts` routes all interactions before reaching slash command handler:

```
isAutocomplete()     → handleAutocomplete()
isStringSelectMenu() → handleSelectMenu()   [removeword_select, editword_select]
isButton()           → handleButton()       [removeword_confirm/cancel/page, editword_page, help_lang]
isModalSubmit()      → handleModal()        [editword_modal]
isChatInputCommand() → handleSlashCommand() → deferReply(ephemeral?) → command.run()
```

Admin commands set `ephemeral: true` on the `Command` object — `handleSlashCommand` reads this to `deferReply({ ephemeral })`.

## Word List — Lazy Migration

`wordService.getWordForServer(serverId)`:
1. If server has no words in DB → reads `public/assets/word.txt` → seeds into server's document
2. If `wordMode === 'fixed'` → returns `fixedWord`
3. Else → returns random word from `words[]`

## Versioning

- Semantic version: `package.json` — bump with `npm version patch|minor|major`
- Build identifier: `GIT_COMMIT` env var injected at Docker build time
- Bot status displays: `Watching v1.0.0 (abc1234)`

CI/CD build command:
```bash
docker build --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) -t prokittikun/mhoo-bot:latest .
```

## Environment Variables

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `MONGO_URL` | MongoDB connection string (use service name `mongodb` inside Docker) |
| `S3_ACCESSKEY` | MinIO access key |
| `S3_SECRETKEY` | MinIO secret key |
| `S3_URL` | MinIO endpoint (use `http://minio:9000` inside Docker) |
| `GIT_COMMIT` | Git short hash (injected at build time, default `unknown`) |

## Infrastructure

**Dev:** `docker compose up --build`
- Services: `mongodb`, `minio`, `minio-init` (auto-creates bucket), `rd-bot`
- MinIO console: `http://localhost:9001`

**Prod (Portainer):** paste `stack.yml` into Portainer stack editor, set env vars in the UI

**Watchtower** watches `rd-bot` container for new images. Requires label:
```yaml
rd-bot:
  labels:
    - "com.centurylinklabs.watchtower.enable=true"
```

## Adding a New Command

1. Create `src/commands/MyCommand.ts` — export `const MyCommand: Command = { name, description, type, ephemeral?, options?, run }`
2. Add to `src/Commands.ts` array
3. If needs component interactions (buttons/select/modal) → add handler in `interactionCreate.ts`
4. Commands auto-register with Discord API on bot ready

## Key Conventions

- All admin commands: check `member.permissions.has("Administrator")` + `ephemeral: true`
- Interactive UI commands use `interaction.editReply()` (after `deferReply`), not `followUp()`
- Component interactions use `interaction.update()` (keeps same message) or `interaction.showModal()`
- S3 bucket name: `banner-mhoo-bot`
- customId scheme: `<action>:<payload>` — split on `:`, use `parts.slice(1).join(':')` for payload with colons
