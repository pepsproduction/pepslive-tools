import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseStreams, syncPortfolio, portfolioResponse } from '../src/portfolio.mjs';

const videos = Array.from({ length: 10 }, (_, i) => ({ videoRenderer: {
  videoId: `replay000${String(i).padStart(2, '0')}`, title: { simpleText: `งาน ${i}` }, lengthText: { simpleText: '2:30:00' }
} }));
const page = (contents) => `var ytInitialData = ${JSON.stringify({ contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: {
  selected: true, endpoint: { commandMetadata: { webCommandMetadata: { url: '/@pepsproduction/streams' } } }, content: contents
} }] } } })};</script>`;
const upcoming = { videoRenderer: { ...videos[0].videoRenderer, upcomingEventData: {} } };
assert.equal(parseStreams(page([upcoming, ...videos, videos[0]])).length, 8);
assert.equal(parseStreams(page(videos))[0].title, 'งาน 0');
assert.throws(() => parseStreams(page(videos.slice(0, 3))), /incomplete/);
assert.throws(() => parseStreams('consent or unavailable page'), /format/);
const modern = videos.map(({ videoRenderer: v }) => ({ lockupViewModel: {
  contentId: v.videoId, metadata: { lockupMetadataViewModel: { title: { content: v.title.simpleText } } },
  contentImage: { thumbnailViewModel: { overlays: [{ thumbnailBottomOverlayViewModel: { badges: [{ thumbnailBadgeViewModel: { text: '2:30:00' } }] } }] } }
} }));
assert.deepEqual(parseStreams(page(modern)), parseStreams(page(videos)));
let stored = JSON.stringify({ items: ['last good snapshot'] });
const env = { ANALYTICS_DB: { prepare: () => ({ bind: (...args) => ({
  first: async () => ({ payload: stored }), run: async () => { stored = args[1]; }
}) }) } };
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response(page(videos));
  await syncPortfolio(env);
  assert.equal(JSON.parse(stored).items.length, 8);
  const saved = stored;
  globalThis.fetch = async () => new Response('blocked', { status: 429 });
  await assert.rejects(syncPortfolio(env));
  assert.equal(stored, saved);
  const response = await portfolioResponse(new Request('https://example.com/api/youtube-portfolio'), env);
  assert.equal((await response.json()).items.length, 8);
  let fallbackPath;
  await portfolioResponse(new Request('https://example.com/api/youtube-portfolio'), { ASSETS: { fetch: async request => {
    fallbackPath = new URL(request.url).pathname; return new Response('{}');
  } } });
  assert.equal(fallbackPath, '/assets/youtube-portfolio.json');
} finally { globalThis.fetch = originalFetch; }
const snapshot = JSON.parse(await readFile(new URL('../assets/youtube-portfolio.json', import.meta.url)));
assert.equal(snapshot.items.length, 8);
assert.equal(new Set(snapshot.items.map(v => v.videoId)).size, 8);
console.log('PASS: both page formats, ordering, upcoming exclusion, deduplication, failed refresh preserves data, API and static fallback, actual snapshot.');
