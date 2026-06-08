import {
  VoiceConnection,
  AudioPlayer,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
  StreamType,
} from '@discordjs/voice';
import { Message, TextChannel, VoiceBasedChannel } from 'discord.js';
import { stream as playStream } from 'play-dl';
import { spawn, ChildProcess } from 'child_process';
import { LoopMode, Track } from './Track';
import { buildControlRow, buildNowPlayingEmbed } from './musicEmbeds';

export { LoopMode };

export class MusicPlayer {
  public queue: Track[] = [];
  public current: Track | null = null;
  public loopMode: LoopMode = 'off';
  public volume = 100;
  public paused = false;
  public textChannel: TextChannel | null = null;

  private connection: VoiceConnection | null = null;
  private player: AudioPlayer;
  private skipRequested = false;
  private idleTimer: NodeJS.Timeout | null = null;
  private activeProcs: ChildProcess[] = [];
  private npMessage: Message | null = null;

  constructor(private guildId: string) {
    this.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    this.player.on(AudioPlayerStatus.Idle, () => void this.onIdle());
    this.player.on('error', (err) => {
      console.error(`[Music:${this.guildId}] Player error:`, err.message);
      void this.onIdle();
    });
  }

  connect(channel: VoiceBasedChannel): void {
    if (
      this.connection &&
      this.connection.state.status !== VoiceConnectionStatus.Destroyed &&
      this.connection.joinConfig.channelId === channel.id
    ) return;

    this.connection?.destroy();
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator as any,
    });
    this.connection.subscribe(this.player);
    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.cleanup();
      }
    });
  }

  isConnected(): boolean {
    return !!this.connection && this.connection.state.status !== VoiceConnectionStatus.Destroyed;
  }

  enqueue(tracks: Track[]): void {
    this.queue.push(...tracks);
  }

  async startPlaying(): Promise<void> {
    if (!this.current) this.current = this.queue.shift() ?? null;
    if (this.current) await this.playCurrent(true);
  }

  async updateNpMessage(): Promise<void> {
    if (!this.npMessage || !this.current) return;
    try {
      await this.npMessage.edit({
        embeds: [buildNowPlayingEmbed(this.current)],
        components: [buildControlRow(this.paused, this.loopMode, this.queue.length)],
      });
    } catch {}
  }

  private async sendNowPlaying(track: Track): Promise<void> {
    // Disable buttons on previous NP message
    if (this.npMessage) {
      const old = this.npMessage;
      this.npMessage = null;
      old.edit({ components: [] }).catch(() => {});
    }
    if (!this.textChannel) return;
    try {
      this.npMessage = await this.textChannel.send({
        embeds: [buildNowPlayingEmbed(track)],
        components: [buildControlRow(this.paused, this.loopMode, this.queue.length)],
      });
    } catch {}
  }

  private killActiveProcs(): void {
    for (const p of this.activeProcs) {
      try { p.kill('SIGTERM'); } catch {}
    }
    this.activeProcs = [];
  }

  private async playCurrent(announce = true): Promise<void> {
    if (!this.current) return;
    this.clearIdleTimer();
    this.killActiveProcs();

    try {
      let resource: AudioResource;

      if (this.current.platform === 'youtube') {
        const ytdlp = spawn('yt-dlp', [
          this.current.url,
          '-f', '251/bestaudio[ext=webm][acodec=opus]/bestaudio[ext=webm]',
          '-o', '-',
          '--no-playlist',
          '-q', '--no-warnings',
        ]);
        this.activeProcs = [ytdlp];
        ytdlp.stderr.on('data', (d) => {
          const msg = (d as Buffer).toString().trim();
          if (msg) console.error(`[yt-dlp] ${msg}`);
        });
        ytdlp.on('error', (e) => console.error('[yt-dlp] spawn error:', e.message));
        resource = createAudioResource(ytdlp.stdout, {
          inputType: StreamType.WebmOpus,
          inlineVolume: false,
        });
      } else {
        const s = await playStream(this.current.url, { quality: 2 });
        resource = createAudioResource(s.stream, {
          inputType: s.type,
          inlineVolume: true,
        });
      }

      resource.volume?.setVolumeLogarithmic(this.volume / 100);
      this.player.play(resource);
      this.paused = false;

      if (announce) await this.sendNowPlaying(this.current);
    } catch (err: any) {
      console.error(`[Music:${this.guildId}] Stream error:`, err?.message);
      this.textChannel?.send(`⚠️ Cannot stream **${this.current?.title}**, skipping.`).catch(() => {});
      this.current = null;
      await this.onIdle();
    }
  }

  private async onIdle(): Promise<void> {
    if (this.loopMode === 'song' && this.current && !this.skipRequested) {
      await this.playCurrent(false);
      return;
    }
    if (this.loopMode === 'queue' && this.current && !this.skipRequested) {
      this.queue.push(this.current);
    }
    this.skipRequested = false;
    this.current = this.queue.shift() ?? null;
    if (this.current) await this.playCurrent(true);
    else this.scheduleIdleDisconnect();
  }

  skip(): boolean {
    if (!this.current) return false;
    this.killActiveProcs();
    this.skipRequested = true;
    this.player.stop();
    return true;
  }

  stop(): void {
    this.killActiveProcs();
    this.skipRequested = true;
    this.queue = [];
    this.current = null;
    this.player.stop();
    this.cleanup();
  }

  pause(): boolean {
    if (this.player.state.status !== AudioPlayerStatus.Playing) return false;
    this.player.pause();
    this.paused = true;
    return true;
  }

  resume(): boolean {
    if (this.player.state.status !== AudioPlayerStatus.Paused) return false;
    this.player.unpause();
    this.paused = false;
    return true;
  }

  setVolume(level: number): void {
    this.volume = Math.max(1, Math.min(100, level));
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      const res = (this.player.state as { resource: AudioResource }).resource;
      res.volume?.setVolumeLogarithmic(this.volume / 100);
    }
  }

  shuffle(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  remove(index: number): Track | null {
    if (index < 0 || index >= this.queue.length) return null;
    return this.queue.splice(index, 1)[0];
  }

  clear(): void {
    this.queue = [];
  }

  get isPlaying(): boolean {
    return this.player.state.status === AudioPlayerStatus.Playing;
  }

  private scheduleIdleDisconnect(): void {
    this.idleTimer = setTimeout(() => this.cleanup(), 5 * 60 * 1000);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
  }

  cleanup(): void {
    this.killActiveProcs();
    this.clearIdleTimer();
    // Disable buttons on current NP message
    if (this.npMessage) {
      const msg = this.npMessage;
      this.npMessage = null;
      msg.edit({ components: [] }).catch(() => {});
    }
    this.skipRequested = true;
    this.player.stop();
    this.queue = [];
    this.current = null;
    this.paused = false;
    try { this.connection?.destroy(); } catch {}
    this.connection = null;
  }
}
