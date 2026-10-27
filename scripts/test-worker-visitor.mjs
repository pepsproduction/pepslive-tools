import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

const endpoint = 'https://script.google.com/macros/s/test-script-id/exec';
let upstreamCalls = [];
globalThis.fetch = async (url) => {
  const parsed = new URL(url);
  upstreamCalls.push(parsed);
  const readOnly = parsed.searchParams.get('mode') === 'visitor-read';
  return new Response(JSON.stringify({
    ok: true,
    count: readOnly ? 1135 : 1136,
    counted: !readOnly,
    deduped: false,
    updatedAt: '2026-10-15T00:00:00.000Z',
    spreadsheetId: 'must-not-leak'
  }), { headers: { 'content-type': 'application/json' } });
};

const env = {
  ASSETS: {
    fetch: async (request) => new URL(request.url).pathname === '/data.json'
      ? new Response(JSON.stringify({ analytics: { visitorEndpoint: endpoint } }), { headers: { 'content-type': 'application/json' } })
      : new Response('not found', { status: 404 })
  }
};
const context = { waitUntil() {} };
const origin = 'https://pepsproduction.example';

const post = await worker.fetch(new Request(`${origin}/api/visitor`, {
  method: 'POST',
  headers: { origin, 'content-type': 'application/json' },
  body: JSON.stringify({ visitorKey: 'device-123', visitKey: 'device-123:2026-10-15', page: '/' })
}), env, context);
assert.equal(post.status, 200);
const counted = await post.json();
assert.equal(counted.count, 1136);
assert.equal(counted.counted, true);
assert.equal(JSON.stringify(counted).includes('must-not-leak'), false);
assert.equal(upstreamCalls[0].searchParams.get('mode'), 'visitor');
assert.equal(upstreamCalls[0].searchParams.get('siteId'), 'pepslive-tools');
assert.equal(upstreamCalls[0].searchParams.get('countMode'), 'day');
assert.equal(upstreamCalls[0].searchParams.get('visitorKey'), 'device-123');

const read = await worker.fetch(new Request(`${origin}/api/visitor`), env, context);
assert.equal(read.status, 200);
assert.equal((await read.json()).count, 1135);
assert.equal(upstreamCalls[1].searchParams.get('mode'), 'visitor-read');
assert.equal(upstreamCalls[1].searchParams.has('visitorKey'), false);

const beforeBlocked = upstreamCalls.length;
const blockedOrigin = await worker.fetch(new Request(`${origin}/api/visitor`, {
  method: 'POST',
  headers: { origin: 'https://other.example', 'content-type': 'application/json' },
  body: JSON.stringify({ visitorKey: 'device-123' })
}), env, context);
assert.equal(blockedOrigin.status, 403);
assert.equal(upstreamCalls.length, beforeBlocked);

const missingKey = await worker.fetch(new Request(`${origin}/api/visitor`, {
  method: 'POST',
  headers: { origin, 'content-type': 'application/json' },
  body: JSON.stringify({ page: '/' })
}), env, context);
assert.equal(missingKey.status, 400);
assert.equal(upstreamCalls.length, beforeBlocked);

const invalidSource = await worker.fetch(new Request(`${origin}/api/visitor`), {
  ASSETS: { fetch: async () => new Response(JSON.stringify({ analytics: { visitorEndpoint: 'https://evil.example/run' } })) }
}, context);
assert.equal(invalidSource.status, 503);

console.log('Worker visitor proxy checks passed.');
