import { isGoogleCalendarIcalUrl, parsePublicCalendar } from './ical.mjs';
import { portfolioResponse, syncPortfolio } from './portfolio.mjs';
import { YOUTUBE_CHANNEL_HANDLE, toPublicUpcomingStreams } from './youtube.mjs';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_CACHE_SECONDS = 1800;
const CALENDAR_CACHE_SECONDS = 120;
const ANALYTICS_PERIODS = [1, 7, 15, 30, 60, 90, 120, 365];
const ANALYTICS_DAILY_LIMIT = 8000;
const ANALYTICS_RETENTION_DAYS = 400;
const ANALYTICS_CATEGORIES = new Set([
  'page', 'navigation', 'launcher', 'portfolio', 'broadcast', 'video', 'schedule', 'contact', 'section'
]);
const ANALYTICS_ITEM_ID_RULES = {
  page: /^home$/,
  navigation: /^(nav_(experience|works|broadcasts|videos|schedule|contact)|hero_works)$/,
  launcher: /^launcher_(header|hero|strip)$/,
  portfolio: /^portfolio_([0-9]|[1-2][0-9])$/,
  broadcast: /^broadcast_([0-9]|[1-9][0-9])$/,
  video: /^(video_([0-9]|[1-2][0-9])|video_playlist)$/,
  schedule: /^schedule_(month_prev|month_next|agenda_all|day)$/,
  contact: /^contact_(line|facebook_page|facebook_personal|tiktok|youtube|phone_[12])$/,
  section: /^section_(home|experience|works|broadcasts|videos|schedule|contact)$/
};

let cachedAccessKeys = null;
let cachedAccessKeysUntil = 0;

const jsonResponse = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
    ...init.headers
  }
});

const scheduleResponse = async (request, env, context) => {
  if (request.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, { status: 405, headers: { allow: 'GET' } });
  if (!env.GOOGLE_CALENDAR_ICAL_URL) return jsonResponse({ connected: false, events: [] }, { status: 503, headers: { 'cache-control': 'no-store' } });
  if (!isGoogleCalendarIcalUrl(env.GOOGLE_CALENDAR_ICAL_URL)) return jsonResponse({ error: 'calendar_source_invalid' }, { status: 503, headers: { 'cache-control': 'no-store' } });

  const cacheKey = new Request(`${new URL(request.url).origin}/_internal/public-schedule-v3`);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  try {
    const upstream = await fetch(env.GOOGLE_CALENDAR_ICAL_URL, {
      headers: { accept: 'text/calendar' },
      signal: AbortSignal.timeout(7000)
    });
    if (!upstream.ok) return jsonResponse({ error: 'calendar_source_unavailable' }, { status: 502, headers: { 'cache-control': 'no-store' } });

    const contentLength = Number(upstream.headers.get('content-length') || 0);
    if (contentLength > 1_000_000) return jsonResponse({ error: 'calendar_source_too_large' }, { status: 502, headers: { 'cache-control': 'no-store' } });
    const calendarText = await upstream.text();
    if (calendarText.length > 1_000_000) return jsonResponse({ error: 'calendar_source_too_large' }, { status: 502, headers: { 'cache-control': 'no-store' } });

    const response = jsonResponse({
      connected: true,
      updatedAt: new Date().toISOString(),
      events: parsePublicCalendar(calendarText)
    }, { headers: { 'cache-control': `public, max-age=${CALENDAR_CACHE_SECONDS}, s-maxage=${CALENDAR_CACHE_SECONDS}` } });
    context.waitUntil(caches.default.put(cacheKey, response.clone()));
    return response;
  } catch {
    return jsonResponse({ error: 'calendar_sync_failed' }, { status: 502, headers: { 'cache-control': 'no-store' } });
  }
};

const youtubeApiJson = async (resource, parameters, apiKey) => {
  const url = new URL(`${YOUTUBE_API}/${resource}`);
  Object.entries({ ...parameters, key: apiKey }).forEach(([name, value]) => url.searchParams.set(name, value));
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error('youtube_api_unavailable');
  return response.json();
};

const youtubeUpcomingResponse = async (request, env, context) => {
  if (request.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, { status: 405, headers: { allow: 'GET' } });
  if (!env.YOUTUBE_API_KEY) return jsonResponse({ connected: false, streams: [] }, { status: 503, headers: { 'cache-control': 'no-store' } });

  const cacheKey = new Request(`${new URL(request.url).origin}/_internal/youtube-upcoming-v1`);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  try {
    const channelData = await youtubeApiJson('channels', {
      part: 'id',
      forHandle: YOUTUBE_CHANNEL_HANDLE
    }, env.YOUTUBE_API_KEY);
    const channelId = channelData.items?.[0]?.id;
    if (!channelId) throw new Error('youtube_channel_unavailable');

    const upcomingData = await youtubeApiJson('search', {
      part: 'snippet',
      channelId,
      type: 'video',
      eventType: 'upcoming',
      maxResults: '10'
    }, env.YOUTUBE_API_KEY);
    const videoIds = (Array.isArray(upcomingData.items) ? upcomingData.items : [])
      .map((item) => item.id?.videoId)
      .filter((id) => /^[A-Za-z0-9_-]{11}$/.test(id || ''));

    const detailsData = videoIds.length
      ? await youtubeApiJson('videos', {
        part: 'snippet,liveStreamingDetails',
        id: videoIds.join(',')
      }, env.YOUTUBE_API_KEY)
      : { items: [] };

    const response = jsonResponse({
      connected: true,
      updatedAt: new Date().toISOString(),
      streams: toPublicUpcomingStreams(detailsData)
    }, { headers: { 'cache-control': `public, max-age=${YOUTUBE_CACHE_SECONDS}, s-maxage=${YOUTUBE_CACHE_SECONDS}` } });
    context.waitUntil(caches.default.put(cacheKey, response.clone()));
    return response;
  } catch {
    return jsonResponse({ connected: false, streams: [] }, { status: 502, headers: { 'cache-control': 'no-store' } });
  }
};

const visitorResponse = async (request, env) => {
  const isReadOnly = request.method === 'GET';
  if (!isReadOnly && request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405, headers: { allow: 'GET, POST' } });
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  if (!isReadOnly && origin && origin !== requestUrl.origin) {
    return jsonResponse({ error: 'origin_not_allowed' }, { status: 403, headers: { 'cache-control': 'no-store' } });
  }

  let visitorKey = '';
  let visitKey = '';
  let page = '/';
  if (!isReadOnly) {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 2048) return jsonResponse({ error: 'request_too_large' }, { status: 413 });
    let payload;
    try {
      const body = await request.text();
      if (body.length > 2048) return jsonResponse({ error: 'request_too_large' }, { status: 413 });
      payload = JSON.parse(body || '{}');
    } catch {
      return jsonResponse({ error: 'invalid_request' }, { status: 400 });
    }
    visitorKey = typeof payload.visitorKey === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(payload.visitorKey)
      ? payload.visitorKey
      : '';
    visitKey = typeof payload.visitKey === 'string' && /^[A-Za-z0-9._:-]{1,180}$/.test(payload.visitKey)
      ? payload.visitKey
      : '';
    page = typeof payload.page === 'string' && /^\/[A-Za-z0-9._/-]{0,180}$/.test(payload.page)
      ? payload.page
      : '/';
    if (!visitorKey) return jsonResponse({ error: 'visitor_key_required' }, { status: 400 });
  }

  try {
    const configResponse = await env.ASSETS.fetch(new Request(new URL('/data.json', requestUrl)));
    if (!configResponse.ok) throw new Error('visitor_config_unavailable');
    const config = await configResponse.json();
    const endpoint = new URL(config.analytics?.visitorEndpoint || '');
    if (endpoint.protocol !== 'https:'
      || endpoint.hostname !== 'script.google.com'
      || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint.pathname)) {
      return jsonResponse({ error: 'visitor_source_invalid' }, { status: 503, headers: { 'cache-control': 'no-store' } });
    }

    endpoint.searchParams.set('mode', isReadOnly ? 'visitor-read' : 'visitor');
    endpoint.searchParams.set('siteId', 'pepslive-tools');
    if (!isReadOnly) {
      endpoint.searchParams.set('countMode', 'day');
      endpoint.searchParams.set('visitorKey', visitorKey);
      if (visitKey) endpoint.searchParams.set('visitKey', visitKey);
      endpoint.searchParams.set('page', page);
    }

    const upstream = await fetch(endpoint, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok) throw new Error('visitor_source_unavailable');
    const result = await upstream.json();
    const count = Number(result.count ?? result.visitorCount);
    if (result.ok !== true || !Number.isSafeInteger(count) || count < 0) {
      throw new Error('visitor_count_invalid');
    }
    return jsonResponse({
      ok: true,
      count,
      counted: result.counted === true,
      deduped: result.deduped === true,
      updatedAt: result.updatedAt || new Date().toISOString()
    }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return jsonResponse({ error: 'visitor_counter_unavailable' }, { status: 502, headers: { 'cache-control': 'no-store' } });
  }
};

const dateKeyInBangkok = (date = new Date()) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const shiftDateKey = (dateKey, amount) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const decoded = atob(normalized);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const parseJwtPart = (value) => JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));

const getAccessKeys = async (teamDomain) => {
  if (cachedAccessKeys && cachedAccessKeysUntil > Date.now()) return cachedAccessKeys;
  const response = await fetch(new URL('/cdn-cgi/access/certs', teamDomain), {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(4000)
  });
  if (!response.ok) throw new Error('access_keys_unavailable');
  const result = await response.json();
  if (!Array.isArray(result.keys)) throw new Error('access_keys_invalid');
  cachedAccessKeys = result.keys;
  cachedAccessKeysUntil = Date.now() + 10 * 60 * 1000;
  return cachedAccessKeys;
};

const isAnalyticsAdmin = async (request, env) => {
  const teamDomain = env.ANALYTICS_TEAM_DOMAIN || '';
  const allowedEmail = (env.ANALYTICS_ADMIN_EMAIL || '').trim().toLowerCase();
  const audience = env.ANALYTICS_ACCESS_AUD || '';
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(teamDomain)
    || !allowedEmail || !audience) return false;

  const token = request.headers.get('cf-access-jwt-assertion') || '';
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3 || token.length > 12000) return false;

  try {
    const header = parseJwtPart(tokenParts[0]);
    const claims = parseJwtPart(tokenParts[1]);
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string'
      || claims.iss !== teamDomain
      || !(Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(audience)
      || !Number.isFinite(claims.exp) || claims.exp <= now
      || (Number.isFinite(claims.nbf) && claims.nbf > now + 60)
      || typeof claims.email !== 'string'
      || claims.email.trim().toLowerCase() !== allowedEmail) return false;

    const key = (await getAccessKeys(teamDomain)).find((candidate) => candidate.kid === header.kid);
    if (!key) return false;
    const cryptoKey = await crypto.subtle.importKey('jwk', key, {
      name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'
    }, false, ['verify']);
    const signedData = new TextEncoder().encode(`${tokenParts[0]}.${tokenParts[1]}`);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, decodeBase64Url(tokenParts[2]), signedData);
  } catch {
    return false;
  }
};

const analyticsUnauthorized = () => jsonResponse({ error: 'analytics_access_denied' }, {
  status: 403,
  headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' }
});

const sanitizeAnalyticsEvent = (payload) => {
  const eventType = payload?.eventType;
  const category = payload?.category;
  const itemId = typeof payload?.itemId === 'string' ? payload.itemId : '';
  const itemLabel = typeof payload?.itemLabel === 'string'
    ? payload.itemLabel.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
    : '';
  const visitorId = typeof payload?.visitorId === 'string' ? payload.visitorId : '';
  const page = payload?.page === '/' ? '/' : '';
  if (!['page_view', 'click', 'section_view'].includes(eventType)
    || !ANALYTICS_CATEGORIES.has(category)
    || !ANALYTICS_ITEM_ID_RULES[category]?.test(itemId)
    || !/^[A-Za-z0-9_-]{20,64}$/.test(visitorId)
    || !page) return null;
  return { eventType, category, itemId, itemLabel: itemLabel || itemId, visitorId, page };
};

const analyticsCollectResponse = async (request, env) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, { status: 405, headers: { allow: 'POST' } });
  if (!env.ANALYTICS_DB) return jsonResponse({ error: 'analytics_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  const origin = request.headers.get('origin');
  if (!['https://pepsproduction.com', 'https://www.pepsproduction.com'].includes(origin || '')) {
    return jsonResponse({ error: 'origin_not_allowed' }, { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 2048) return jsonResponse({ error: 'request_too_large' }, { status: 413 });
  let payload;
  try {
    const body = await request.text();
    if (body.length > 2048) return jsonResponse({ error: 'request_too_large' }, { status: 413 });
    payload = JSON.parse(body || '{}');
  } catch {
    return jsonResponse({ error: 'invalid_request' }, { status: 400 });
  }
  const event = sanitizeAnalyticsEvent(payload);
  if (!event) return jsonResponse({ error: 'invalid_event' }, { status: 400 });

  const eventDate = dateKeyInBangkok();
  const statements = [
    env.ANALYTICS_DB.prepare(`
      INSERT INTO analytics_daily_quota (event_date, event_count) VALUES (?1, 1)
      ON CONFLICT(event_date) DO UPDATE SET event_count = event_count + 1
      WHERE event_count < ?2
    `).bind(eventDate, ANALYTICS_DAILY_LIMIT),
    env.ANALYTICS_DB.prepare(`
      INSERT INTO analytics_daily_rollups (event_date, event_type, category, item_id, item_label, event_count)
      SELECT ?1, ?2, ?3, ?4, ?5, 1 WHERE changes() = 1
      ON CONFLICT(event_date, event_type, category, item_id)
      DO UPDATE SET event_count = event_count + 1, item_label = excluded.item_label
    `).bind(eventDate, event.eventType, event.category, event.itemId, event.itemLabel),
    env.ANALYTICS_DB.prepare(`
      INSERT INTO analytics_daily_summary (event_date, page_views, clicks, section_views, unique_visitors)
      SELECT ?1, ?2, ?3, ?4, 0 WHERE changes() = 1
      ON CONFLICT(event_date) DO UPDATE SET
        page_views = page_views + excluded.page_views,
        clicks = clicks + excluded.clicks,
        section_views = section_views + excluded.section_views
    `).bind(eventDate, Number(event.eventType === 'page_view'), Number(event.eventType === 'click'), Number(event.eventType === 'section_view')),
    env.ANALYTICS_DB.prepare(`
      INSERT OR IGNORE INTO analytics_daily_visitors (event_date, visitor_id)
      SELECT ?1, ?2 WHERE ?3 = 'page_view' AND changes() = 1
    `).bind(eventDate, event.visitorId, event.eventType),
    env.ANALYTICS_DB.prepare(`
      UPDATE analytics_daily_summary SET unique_visitors = unique_visitors + 1
      WHERE event_date = ?1 AND changes() = 1
    `).bind(eventDate),
    env.ANALYTICS_DB.prepare(`
      INSERT INTO analytics_visitors (visitor_id, last_seen_date)
      SELECT ?1, ?2 WHERE ?3 = 'page_view' AND changes() = 1
      ON CONFLICT(visitor_id) DO UPDATE SET last_seen_date = excluded.last_seen_date
      WHERE analytics_visitors.last_seen_date < excluded.last_seen_date
    `).bind(event.visitorId, eventDate, event.eventType)
  ];
  try {
    const results = await env.ANALYTICS_DB.batch(statements);
    const accepted = Number(results?.[0]?.meta?.changes) > 0;
    return jsonResponse({ ok: accepted, counted: accepted }, {
      status: accepted ? 202 : 429,
      headers: { 'cache-control': 'no-store' }
    });
  } catch {
    return jsonResponse({ error: 'analytics_write_failed' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
};

const analyticsReportResponse = async (request, env) => {
  if (request.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, { status: 405, headers: { allow: 'GET' } });
  if (!await isAnalyticsAdmin(request, env)) return analyticsUnauthorized();
  if (!env.ANALYTICS_DB) return jsonResponse({ error: 'analytics_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });

  const today = dateKeyInBangkok();
  const oldest = shiftDateKey(today, -364);
  const periodStarts = ANALYTICS_PERIODS.map((period) => shiftDateKey(today, -(period - 1)));
  const uniqueColumns = ANALYTICS_PERIODS.map((period, index) => (
    `COUNT(CASE WHEN last_seen_date >= ?${index + 1} THEN 1 END) AS uv_${period}`
  )).join(', ');
  const clickColumns = ANALYTICS_PERIODS.map((period, index) => (
    `SUM(CASE WHEN event_date >= ?${index + 1} AND event_type = 'click' THEN event_count ELSE 0 END) AS clicks_${period}`
  )).join(', ');
  const viewColumns = ANALYTICS_PERIODS.map((period, index) => (
    `SUM(CASE WHEN event_date >= ?${index + 1} AND event_type = 'section_view' THEN event_count ELSE 0 END) AS views_${period}`
  )).join(', ');
  const statements = [
    env.ANALYTICS_DB.prepare(`
      SELECT ${uniqueColumns} FROM analytics_visitors WHERE last_seen_date BETWEEN ?9 AND ?10
    `).bind(...periodStarts, oldest, today),
    env.ANALYTICS_DB.prepare(`
      SELECT event_date, page_views, clicks, section_views, unique_visitors
      FROM analytics_daily_summary WHERE event_date BETWEEN ?1 AND ?2 ORDER BY event_date
    `).bind(oldest, today),
    env.ANALYTICS_DB.prepare(`
      SELECT category, item_id, item_label, ${clickColumns}, ${viewColumns}
      FROM analytics_daily_rollups WHERE event_date BETWEEN ?9 AND ?10
      GROUP BY category, item_id, item_label ORDER BY category, item_label
    `).bind(...periodStarts, oldest, today)
  ];
  try {
    const [uniqueResult, dailyResult, itemResult] = await env.ANALYTICS_DB.batch(statements);
    const uniqueRow = uniqueResult.results?.[0] || {};
    const daily = (dailyResult.results || []).map((row) => ({
      date: row.event_date,
      pageViews: Number(row.page_views) || 0,
      clicks: Number(row.clicks) || 0,
      sectionViews: Number(row.section_views) || 0,
      uniqueVisitors: Number(row.unique_visitors) || 0
    }));
    const items = (itemResult.results || []).map((row) => {
      const clicks = {};
      const sectionViews = {};
      ANALYTICS_PERIODS.forEach((period) => {
        clicks[String(period)] = Number(row[`clicks_${period}`]) || 0;
        sectionViews[String(period)] = Number(row[`views_${period}`]) || 0;
      });
      return { category: row.category, itemId: row.item_id, itemLabel: row.item_label, clicks, sectionViews };
    });
    const periodTotals = {};
    ANALYTICS_PERIODS.forEach((period) => {
      const start = periodStarts[ANALYTICS_PERIODS.indexOf(period)];
      const rows = daily.filter((row) => row.date >= start && row.date <= today);
      periodTotals[String(period)] = {
        uniqueVisitors: Number(uniqueRow[`uv_${period}`]) || 0,
        pageViews: rows.reduce((total, row) => total + row.pageViews, 0),
        clicks: rows.reduce((total, row) => total + row.clicks, 0),
        sectionViews: rows.reduce((total, row) => total + row.sectionViews, 0)
      };
    });
    return jsonResponse({ ok: true, updatedAt: new Date().toISOString(), today, periods: ANALYTICS_PERIODS, periodTotals, daily, items }, {
      headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' }
    });
  } catch {
    return jsonResponse({ error: 'analytics_read_failed' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
};

const cleanupAnalytics = async (env) => {
  if (!env.ANALYTICS_DB) return;
  const cutoff = shiftDateKey(dateKeyInBangkok(), -ANALYTICS_RETENTION_DAYS);
  for (let batchIndex = 0; batchIndex < 12; batchIndex += 1) {
    const results = await env.ANALYTICS_DB.batch([
      env.ANALYTICS_DB.prepare(`DELETE FROM analytics_daily_visitors WHERE rowid IN (SELECT rowid FROM analytics_daily_visitors WHERE event_date < ?1 LIMIT 1000)`).bind(cutoff),
      env.ANALYTICS_DB.prepare(`DELETE FROM analytics_daily_rollups WHERE rowid IN (SELECT rowid FROM analytics_daily_rollups WHERE event_date < ?1 LIMIT 1000)`).bind(cutoff),
      env.ANALYTICS_DB.prepare(`DELETE FROM analytics_daily_summary WHERE event_date < ?1`).bind(cutoff),
      env.ANALYTICS_DB.prepare(`DELETE FROM analytics_daily_quota WHERE event_date < ?1`).bind(cutoff),
      env.ANALYTICS_DB.prepare(`DELETE FROM analytics_visitors WHERE rowid IN (SELECT rowid FROM analytics_visitors WHERE last_seen_date < ?1 LIMIT 1000)`).bind(cutoff)
    ]);
    if (!results.some((result) => Number(result.meta?.changes) > 0)) break;
  }
};

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.pathname === '/admin/analytics/api/report') return analyticsReportResponse(request, env);
    if (url.pathname.startsWith('/admin/analytics')) {
      if (!await isAnalyticsAdmin(request, env)) return analyticsUnauthorized();
      if (url.pathname === '/admin/analytics') return Response.redirect(new URL('/admin/analytics/', request.url), 308);
      return env.ASSETS.fetch(request);
    }
    if (url.pathname === '/api/analytics/collect') return analyticsCollectResponse(request, env);
    if (url.pathname === '/api/schedule') return scheduleResponse(request, env, context);
    if (url.pathname === '/api/youtube-upcoming') return youtubeUpcomingResponse(request, env, context);
    if (url.pathname === '/api/youtube-portfolio') return portfolioResponse(request, env);
    if (url.pathname === '/api/visitor') return visitorResponse(request, env);
    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, context) {
    context.waitUntil(cleanupAnalytics(env));
    context.waitUntil(syncPortfolio(env));
  }
};
