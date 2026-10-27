export const STREAMS_URL = 'https://www.youtube.com/@pepsproduction/streams';

// Read public page data without executing any code supplied by YouTube.
export function parseStreams(html) {
  const match = html.match(/var ytInitialData\s*=\s*(.*?);<\/script>/s);
  if (!match) throw new Error('youtube_page_format_changed');
  const data = JSON.parse(match[1]);
  const tab = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.find(({ tabRenderer: t }) =>
    t?.selected && t.endpoint?.commandMetadata?.webCommandMetadata?.url?.endsWith('/streams'));
  if (!tab) throw new Error('youtube_streams_tab_missing');
  const items = [];
  const seen = new Set();
  const add = (id, title, duration) => {
    // Completed broadcasts carry a duration; upcoming and currently live entries do not.
    if (!/^[\w-]{11}$/.test(id || '') || !title || !/^\d+(?::\d{2}){1,2}$/.test(duration || '') || seen.has(id)) return;
    seen.add(id);
    items.push({ videoId: id, title, duration, category: 'LIVE REPLAY',
      image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`, linkLabel: 'รับชมย้อนหลัง' });
  };
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.lockupViewModel) {
      const v = node.lockupViewModel;
      const badges = v.contentImage?.thumbnailViewModel?.overlays?.flatMap(o => o.thumbnailBottomOverlayViewModel?.badges || []) || [];
      add(v.contentId, v.metadata?.lockupMetadataViewModel?.title?.content,
        badges.map(b => b.thumbnailBadgeViewModel?.text).find(t => /^\d+(?::\d{2}){1,2}$/.test(t || '')));
      return;
    }
    if (node.videoRenderer) {
      const v = node.videoRenderer;
      if (!v.upcomingEventData && !v.badges?.some(b => /LIVE_NOW/.test(b.metadataBadgeRenderer?.style))) {
        add(v.videoId, v.title?.runs?.map(r => r.text).join('') || v.title?.simpleText, v.lengthText?.simpleText);
      }
      return;
    }
    Object.values(node).forEach(walk);
  };
  walk(tab);
  if (items.length < 8) throw new Error('youtube_incomplete_portfolio');
  return items.slice(0, 8);
}

export async function fetchPortfolio() {
  const response = await fetch(`${STREAMS_URL}?hl=en`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('youtube_unavailable');
  return { source: STREAMS_URL, updatedAt: new Date().toISOString(), items: parseStreams(await response.text()) };
}

export async function syncPortfolio(env) {
  if (!env.ANALYTICS_DB) throw new Error('portfolio_database_missing');
  const data = await fetchPortfolio();
  await env.ANALYTICS_DB.prepare('INSERT INTO public_content (key, payload) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET payload = excluded.payload')
    .bind('youtube-portfolio', JSON.stringify(data)).run();
  return data;
}

export async function portfolioResponse(request, env) {
  try {
    const row = await env.ANALYTICS_DB?.prepare('SELECT payload FROM public_content WHERE key = ?1').bind('youtube-portfolio').first();
    if (row) return new Response(row.payload, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  } catch { /* Serve the verified bundled snapshot until the migration/first cron runs. */ }
  return env.ASSETS.fetch(new Request(new URL('/assets/youtube-portfolio.json', request.url)));
}
