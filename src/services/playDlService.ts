import {
  validate,
  video_info,
  playlist_info,
  spotify,
  soundcloud,
  search,
  setToken,
} from 'play-dl';
import { Track } from '../music/Track';

export async function initPlayDl(): Promise<void> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (clientId && clientSecret) {
    await setToken({
      spotify: {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: '',
        market: 'US',
      },
    });
    console.log('[play-dl] Spotify initialized');
  }
}

export async function resolveQuery(query: string, requestedBy: string): Promise<Track[]> {
  const type = await validate(query);

  if (type === 'yt_video') {
    const info = await video_info(query);
    return [ytToTrack(info.video_details, requestedBy)];
  }

  if (type === 'yt_playlist') {
    const pl = await playlist_info(query, { incomplete: true });
    const videos = await pl.all_videos();
    return videos.map((v) => ytToTrack(v, requestedBy));
  }

  if (type === 'sp_track') {
    const sp = await spotify(query) as any;
    const term = `${sp.name} ${sp.artists?.[0]?.name ?? ''}`;
    const res = await search(term, { source: { youtube: 'video' }, limit: 1 });
    return res.length ? [ytToTrack(res[0], requestedBy)] : [];
  }

  if (type === 'sp_playlist' || type === 'sp_album') {
    const sp = await spotify(query) as any;
    const spTracks = await sp.all_tracks();
    const tracks: Track[] = [];
    for (const t of (spTracks as any[]).slice(0, 50)) {
      try {
        const res = await search(
          `${t.name} ${t.artists?.[0]?.name ?? ''}`,
          { source: { youtube: 'video' }, limit: 1 },
        );
        if (res.length) tracks.push(ytToTrack(res[0], requestedBy));
      } catch { /* skip failed track */ }
    }
    return tracks;
  }

  if (type === 'so_track') {
    const sc = await soundcloud(query) as any;
    return [{
      title: sc.name ?? 'Unknown',
      url: query,
      thumbnail: sc.thumbnail,
      duration: Math.floor((sc.durationInMs ?? 0) / 1000),
      requestedBy,
      platform: 'soundcloud',
    }];
  }

  // Fall back to YouTube search
  const res = await search(query, { source: { youtube: 'video' }, limit: 1 });
  return res.length ? [ytToTrack(res[0], requestedBy)] : [];
}

function ytToTrack(video: any, requestedBy: string): Track {
  let url: string = video.url ?? '';

  // Normalize to clean watch URL — strip list/index params that confuse play-dl.stream()
  try {
    const u = new URL(url);
    if (u.searchParams.has('v')) {
      url = `https://www.youtube.com/watch?v=${u.searchParams.get('v')}`;
    }
  } catch {
    url = '';
  }

  // Fallback: construct from video.id if url is still not a watch URL
  if (!url.includes('/watch?v=') && video.id) {
    url = `https://www.youtube.com/watch?v=${video.id}`;
  }

  console.log(`[play-dl] Track resolved: "${video.title}" → ${url}`);

  return {
    title: video.title ?? 'Unknown',
    url,
    thumbnail: video.thumbnails?.[0]?.url,
    duration: video.durationInSec ?? 0,
    requestedBy,
    platform: 'youtube',
  };
}
