import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import { toPublicUpcomingStreams } from '../src/youtube.mjs';

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const apiKey = 'unit-test-youtube-key';
const channelId = 'UC0000000000000000000000';
const requests = [];
const cache = new Map();

globalThis.caches = {
  default: {
    async match(request) { return cache.get(request.url)?.clone() || null; },
    async put(request, response) {
      const url = typeof request === 'string' ? request : request.url;
      cache.set(url, response.clone());
    }
  }
};

const apiResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' }
});

globalThis.fetch = async (input) => {
  const url = new URL(input);
  requests.push(url);
  assert.equal(url.searchParams.get('key'), apiKey, 'the Worker supplies its secret only to Google API requests');

  if (url.pathname.endsWith('/channels')) {
    assert.equal(url.searchParams.get('forHandle'), '@pepsproduction');
    return apiResponse({ items: [{ id: channelId }] });
  }
  if (url.pathname.endsWith('/search')) {
    assert.equal(url.searchParams.get('channelId'), channelId);
    assert.equal(url.searchParams.get('eventType'), 'upcoming');
    assert.equal(url.searchParams.get('type'), 'video');
    return apiResponse({ items: [
      { id: { videoId: 'laterVideo1' } },
      { id: { videoId: 'earlyVideo1' } },
      { id: { videoId: 'bad' } }
    ] });
  }
  if (url.pathname.endsWith('/videos')) {
    return apiResponse({ items: [
      {
        id: 'laterVideo1',
        snippet: { title: 'ไลฟ์งานถ่ายทอดสด', description: 'ข้อมูลที่ไม่ควรส่งออก', thumbnails: { high: { url: 'https://i.ytimg.com/vi/laterVideo1/hqdefault.jpg' } } },
        liveStreamingDetails: { scheduledStartTime: '2026-11-15T12:00:00Z' }
      },
      {
        id: 'earlyVideo1',
        snippet: { title: 'ไลฟ์การแข่งขัน', thumbnails: { default: { url: 'https://evil.example/tracker.jpg' } } },
        liveStreamingDetails: { scheduledStartTime: '2026-11-14T12:00:00Z' }
      },
      {
        id: 'badVideo111',
        snippet: { title: 'ไม่มีเวลาไลฟ์', thumbnails: {} },
        liveStreamingDetails: {}
      }
    ] });
  }
  throw new Error('Unexpected upstream URL');
};

try {
  const request = new Request('https://pepsproduction.example/api/youtube-upcoming');
  const pending = [];
  const context = { waitUntil(promise) { pending.push(promise); } };
  const response = await worker.fetch(request, { YOUTUBE_API_KEY: apiKey, ASSETS: { fetch: async () => new Response('asset') } }, context);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.connected, true);
  assert.deepEqual(data.streams.map((stream) => stream.videoId), ['earlyVideo1', 'laterVideo1']);
  assert.equal(data.streams[0].thumbnail, '', 'unapproved thumbnail hosts are removed');
  assert.equal(data.streams[0].url, 'https://www.youtube.com/watch?v=earlyVideo1');
  assert.equal(JSON.stringify(data).includes('unit-test-youtube-key'), false);
  assert.equal(JSON.stringify(data).includes('ไม่ควรส่งออก'), false);
  await Promise.all(pending);
  assert.equal(requests.length, 3);

  const cached = await worker.fetch(request, { YOUTUBE_API_KEY: apiKey }, { waitUntil() {} });
  assert.deepEqual(await cached.json(), data, 'cached response reuses the sanitized stream feed');
  assert.equal(requests.length, 3, 'cache hit does not call the YouTube API again');

  const unconfigured = await worker.fetch(request, {}, { waitUntil() {} });
  assert.equal(unconfigured.status, 503);
  assert.deepEqual(await unconfigured.json(), { connected: false, streams: [] });

  const wrongMethod = await worker.fetch(new Request(request, { method: 'POST' }), { YOUTUBE_API_KEY: apiKey }, { waitUntil() {} });
  assert.equal(wrongMethod.status, 405);

  const transformed = toPublicUpcomingStreams({ items: [
    { id: 'a'.repeat(11), snippet: { title: 'scheduled' }, liveStreamingDetails: { scheduledStartTime: '2026-11-15T12:00:00Z' } },
    { id: 'bad', snippet: { title: 'bad id' }, liveStreamingDetails: { scheduledStartTime: '2026-11-15T12:00:00Z' } }
  ] });
  assert.equal(transformed.length, 1);
  console.log('Worker upcoming YouTube route checks passed.');
} finally {
  globalThis.fetch = originalFetch;
  if (originalCaches === undefined) delete globalThis.caches;
  else globalThis.caches = originalCaches;
}
