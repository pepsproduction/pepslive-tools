import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

const accessDomain = 'https://pepsproduction.cloudflareaccess.com';
const allowedEmail = 'bank_natade_88@hotmail.com';
const audience = 'analytics-test-audience';
const keyPair = await crypto.subtle.generateKey({
  name: 'RSASSA-PKCS1-v1_5',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256'
}, true, ['sign', 'verify']);
const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
publicJwk.kid = 'analytics-test-key';
publicJwk.alg = 'RS256';
publicJwk.use = 'sig';

const base64Url = (value) => Buffer.from(value).toString('base64url');
const signedToken = async (email = allowedEmail) => {
  const header = base64Url(JSON.stringify({ alg: 'RS256', kid: publicJwk.kid, typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: accessDomain,
    aud: [audience],
    email,
    exp: Math.floor(Date.now() / 1000) + 300
  }));
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', keyPair.privateKey, new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64Url(signature)}`;
};

const originalFetch = globalThis.fetch;
const requests = [];
globalThis.fetch = async (input) => {
  const url = new URL(input);
  requests.push(url);
  assert.equal(url.origin, accessDomain);
  assert.equal(url.pathname, '/cdn-cgi/access/certs');
  return new Response(JSON.stringify({ keys: [publicJwk] }), {
    headers: { 'content-type': 'application/json' }
  });
};

const periods = [1, 7, 15, 30, 60, 90, 120, 365];
const dayParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date()).map(({ type, value }) => [type, value]));
const today = `${dayParts.year}-${dayParts.month}-${dayParts.day}`;
let dbBatches = 0;
const db = {
  prepare(sql) {
    return { sql, bind(...params) { return { sql, params }; } };
  },
  async batch(statements) {
    dbBatches += 1;
    if (statements.length === 6) return [{ meta: { changes: 1 } }];
    assert.equal(statements.length, 3);
    const unique = Object.fromEntries(periods.map((period) => [`uv_${period}`, period]));
    const item = { category: 'launcher', item_id: 'launcher_hero', item_label: 'PepsTool Launcher' };
    periods.forEach((period) => {
      item[`clicks_${period}`] = period * 2;
      item[`views_${period}`] = period;
    });
    return [
      { results: [unique] },
      { results: [{ event_date: today, page_views: 8, clicks: 2, section_views: 4, unique_visitors: 3 }] },
      { results: [item] }
    ];
  }
};
const env = {
  ANALYTICS_DB: db,
  ANALYTICS_TEAM_DOMAIN: accessDomain,
  ANALYTICS_ADMIN_EMAIL: allowedEmail,
  ANALYTICS_ACCESS_AUD: audience,
  ASSETS: {
    async fetch(request) {
      assert.equal(new URL(request.url).pathname, '/admin/analytics/');
      return new Response('<html>private analytics</html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' }
      });
    }
  }
};

try {
  const reportPath = 'https://pepsproduction.com/admin/analytics/api/report';
  const denied = await worker.fetch(new Request(reportPath), env, { waitUntil() {} });
  assert.equal(denied.status, 403, 'report endpoint denies requests without an Access JWT');
  assert.equal(dbBatches, 0, 'unauthorized requests never reach D1');

  const wrongEmail = await worker.fetch(new Request(reportPath, {
    headers: { 'cf-access-jwt-assertion': await signedToken('someone@example.com') }
  }), env, { waitUntil() {} });
  assert.equal(wrongEmail.status, 403, 'report endpoint denies valid JWTs for other identities');
  assert.equal(dbBatches, 0, 'rejected identities never reach D1');

  const report = await worker.fetch(new Request(reportPath, {
    headers: { 'cf-access-jwt-assertion': await signedToken() }
  }), env, { waitUntil() {} });
  assert.equal(report.status, 200);
  const data = await report.json();
  assert.deepEqual(data.periods, periods);
  assert.equal(data.periodTotals['30'].uniqueVisitors, 30);
  assert.equal(data.periodTotals['30'].pageViews, 8);
  assert.equal(data.periodTotals['30'].clicks, 2);
  assert.equal(data.items[0].clicks['30'], 60);
  assert.equal(requests.length, 1, 'Access signing keys are fetched only after basic claim checks');

  const adminPage = await worker.fetch(new Request('https://pepsproduction.com/admin/analytics/', {
    headers: { 'cf-access-jwt-assertion': await signedToken() }
  }), env, { waitUntil() {} });
  assert.equal(adminPage.status, 200);
  assert.match(await adminPage.text(), /private analytics/);

  const blockedCollector = await worker.fetch(new Request('https://pepsproduction.com/api/analytics/collect', {
    method: 'POST',
    headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
    body: '{}'
  }), env, { waitUntil() {} });
  assert.equal(blockedCollector.status, 403);
  console.log('Worker analytics Access, report, and collector checks passed.');
} finally {
  globalThis.fetch = originalFetch;
}
