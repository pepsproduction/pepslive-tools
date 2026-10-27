import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const bangkokParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date()).map(({ type, value }) => [type, value]));
const calendarDateOffset = (days) => new Date(Date.UTC(
  Number(bangkokParts.year), Number(bangkokParts.month) - 1, Number(bangkokParts.day) + days
)).toISOString().slice(0, 10).replace(/-/g, '');
const today = calendarDateOffset(0);
const tomorrow = calendarDateOffset(1);
const ics = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  `DTSTART;VALUE=DATE:${today}`,
  `DTEND;VALUE=DATE:${tomorrow}`,
  'SUMMARY:[เว็บ] งานถ่ายทอดสด',
  'DESCRIPTION:ราคา 17000/2000',
  'END:VEVENT',
  'BEGIN:VEVENT',
  `DTSTART;VALUE=DATE:${today}`,
  `DTEND;VALUE=DATE:${tomorrow}`,
  'SUMMARY:นัดส่วนตัว',
  'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');

let cachedResponse = null;
globalThis.caches = {
  default: {
    async match() { return null; },
    async put(_key, value) { cachedResponse = value; }
  }
};
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://calendar.google.com/calendar/ical/id/private/key/basic.ics');
  assert.equal(options.headers.accept, 'text/calendar');
  return new Response(ics, { status: 200, headers: { 'content-type': 'text/calendar' } });
};

try {
  const pending = [];
  const request = new Request('https://pepsproduction.example/api/schedule');
  const env = {
    GOOGLE_CALENDAR_ICAL_URL: 'https://calendar.google.com/calendar/ical/id/private/key/basic.ics',
    ASSETS: { fetch: async () => new Response('asset') }
  };
  const response = await worker.fetch(request, env, { waitUntil(promise) { pending.push(promise); } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /max-age=120.*s-maxage=120/);
  const body = await response.json();
  assert.equal(body.connected, true);
  assert.equal(body.events.length, 1);
  assert.equal(body.events[0].title, 'งานถ่ายทอดสด');
  assert.equal(JSON.stringify(body).includes('17000/2000'), false);
  assert.equal(JSON.stringify(body).includes('private/key'), false);
  await Promise.all(pending);
  assert.ok(cachedResponse, 'successful filtered schedule should be cached');

  const notConfigured = await worker.fetch(request, { ASSETS: env.ASSETS }, { waitUntil() {} });
  assert.equal(notConfigured.status, 503);
  assert.deepEqual(await notConfigured.json(), { connected: false, events: [] });

  const wrongMethod = await worker.fetch(new Request(request, { method: 'POST' }), env, { waitUntil() {} });
  assert.equal(wrongMethod.status, 405);
  console.log('Worker public schedule route checks passed.');
} finally {
  globalThis.fetch = originalFetch;
  if (originalCaches === undefined) delete globalThis.caches;
  else globalThis.caches = originalCaches;
}
