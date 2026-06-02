const SPREADSHEET_ID = '1QiONjsc7hc_9BjXBOF8QJW8LsbHC9uIwzq8FmhiUaJc';
const SITE_ID = 'pepslive-tools';
const CLICK_SHEET = 'Clicks';
const CONFIG_SHEET = 'Config';
const CLICK_HEADERS = [
  'timestamp',
  'event_date',
  'site_id',
  'tool_id',
  'tool_title',
  'event_type',
  'link_label',
  'target_url',
  'page',
  'referrer',
  'user_agent',
  'session_id',
  'visitor_key',
  'device_hint',
  'notes'
];
const EVENT_TYPES = ['open_tool', 'manual_link', 'video_link', 'dock_card', 'other'];
const PERIODS = [1, 7, 30, 60, 90];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    if (payload.siteId && payload.siteId !== SITE_ID) {
      return respond_({ ok: false, error: 'site_not_allowed' });
    }
    const row = appendClick_(payload);
    return respond_({ ok: true, row });
  } catch (error) {
    return respond_({ ok: false, error: String(error && error.message || error) });
  }
}

function doGet(e) {
  const params = e && e.parameter || {};
  const callback = sanitizeCallback_(params.callback || '');
  const mode = params.mode || 'summary';
  if (mode === 'health') {
    return respond_({ ok: true, siteId: SITE_ID, updatedAt: new Date().toISOString() }, callback);
  }
  return respond_(buildSummary_(), callback);
}

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const clicks = getOrCreateSheet_(ss, CLICK_SHEET);
  ensureHeader_(clicks, CLICK_HEADERS);
  clicks.setFrozenRows(1);
  clicks.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  clicks.getRange('B:B').setNumberFormat('yyyy-mm-dd');
  clicks.autoResizeColumns(1, CLICK_HEADERS.length);
  return { ok: true, spreadsheetUrl: ss.getUrl() };
}

function appendClick_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet_(ss, CLICK_SHEET);
    ensureHeader_(sheet, CLICK_HEADERS);
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventType = normalizeEvent_(payload.eventType);
    const row = [
      now,
      day,
      clean_(payload.siteId || SITE_ID, 80),
      clean_(payload.toolId, 120),
      clean_(payload.toolTitle, 180),
      eventType,
      clean_(payload.linkLabel, 160),
      cleanUrl_(payload.targetUrl),
      clean_(payload.page, 120),
      cleanUrl_(payload.referrer),
      clean_(payload.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''), 260),
      clean_(payload.sessionId, 120),
      clean_(payload.visitorKey, 120),
      clean_(payload.deviceHint, 120),
      clean_(payload.notes, 240)
    ];
    sheet.appendRow(row);
    return sheet.getLastRow();
  } finally {
    lock.releaseLock();
  }
}

function buildSummary_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = getToolConfig_(ss);
  const clicks = readClicks_(ss);
  const now = new Date();
  const today = startOfDay_(now);
  const periodTotals = {};
  const tools = {};
  const events = {};
  const daily = {};
  const recent = [];

  PERIODS.forEach((period) => {
    periodTotals[String(period)] = { total: 0 };
  });
  config.forEach((tool) => {
    tools[tool.toolId] = {
      toolId: tool.toolId,
      toolTitle: tool.toolTitle,
      category: tool.category,
      status: tool.status,
      primaryUrl: tool.primaryUrl,
      counts: emptyCounts_(),
      events: emptyEventCounts_(),
      lastClick: ''
    };
  });
  EVENT_TYPES.forEach((eventType) => {
    events[eventType] = { eventType, counts: emptyCounts_() };
  });
  for (let i = 89; i >= 0; i -= 1) {
    const date = addDays_(today, -i);
    daily[formatDate_(date)] = { date: formatDate_(date), total: 0, open_tool: 0, manual_link: 0, video_link: 0, dock_card: 0, other: 0 };
  }

  clicks.forEach((click) => {
    const date = startOfDay_(click.eventDate || click.timestamp || now);
    const dateKey = formatDate_(date);
    const toolId = click.toolId || slug_(click.toolTitle || 'unknown-tool');
    const eventType = normalizeEvent_(click.eventType);
    if (!tools[toolId]) {
      tools[toolId] = {
        toolId,
        toolTitle: click.toolTitle || toolId,
        category: '',
        status: '',
        primaryUrl: '',
        counts: emptyCounts_(),
        events: emptyEventCounts_(),
        lastClick: ''
      };
    }
    const tool = tools[toolId];
    PERIODS.forEach((period) => {
      if (date >= addDays_(today, -(period - 1))) {
        tool.counts[String(period)] += 1;
        periodTotals[String(period)].total += 1;
        events[eventType].counts[String(period)] += 1;
      }
    });
    tool.events[eventType] = (tool.events[eventType] || 0) + 1;
    const iso = click.timestamp ? click.timestamp.toISOString() : '';
    if (iso && (!tool.lastClick || iso > tool.lastClick)) tool.lastClick = iso;
    if (daily[dateKey]) {
      daily[dateKey].total += 1;
      daily[dateKey][eventType] = (daily[dateKey][eventType] || 0) + 1;
    }
    recent.push({
      timestamp: iso,
      toolId,
      toolTitle: tool.toolTitle,
      eventType,
      linkLabel: click.linkLabel || '',
      page: click.page || ''
    });
  });

  const toolList = Object.keys(tools).map((key) => tools[key]).sort((a, b) => b.counts['90'] - a.counts['90']);
  recent.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return {
    ok: true,
    siteId: SITE_ID,
    updatedAt: now.toISOString(),
    spreadsheetId: SPREADSHEET_ID,
    sheetUrl: ss.getUrl(),
    periods: periodTotals,
    tools: toolList,
    events: EVENT_TYPES.map((eventType) => events[eventType]),
    daily: Object.keys(daily).sort().map((date) => daily[date]),
    recent: recent.slice(0, 20)
  };
}

function parsePayload_(e) {
  const text = e && e.postData && e.postData.contents || '{}';
  try {
    return JSON.parse(text);
  } catch (error) {
    return {};
  }
}

function respond_(data, callback) {
  const json = JSON.stringify(data);
  const body = callback ? `${callback}(${json});` : json;
  const output = ContentService.createTextOutput(body);
  output.setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  return output;
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeader_(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (current.join('') !== headers.join('')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
  }
}

function readClicks_(ss) {
  const sheet = getOrCreateSheet_(ss, CLICK_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, CLICK_HEADERS.length).getValues();
  return rows.map((row) => ({
    timestamp: asDate_(row[0]),
    eventDate: asDate_(row[1]),
    siteId: row[2],
    toolId: row[3],
    toolTitle: row[4],
    eventType: row[5],
    linkLabel: row[6],
    targetUrl: row[7],
    page: row[8]
  })).filter((row) => row.toolId || row.toolTitle);
}

function getToolConfig_(ss) {
  const sheet = ss.getSheetByName(CONFIG_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  return rows.map((row) => ({
    toolId: clean_(row[0], 120),
    toolTitle: clean_(row[1], 180),
    category: clean_(row[2], 120),
    status: clean_(row[4], 120),
    primaryUrl: cleanUrl_(row[5])
  })).filter((row) => row.toolId);
}

function emptyCounts_() {
  return { '1': 0, '7': 0, '30': 0, '60': 0, '90': 0 };
}

function emptyEventCounts_() {
  const counts = {};
  EVENT_TYPES.forEach((eventType) => counts[eventType] = 0);
  return counts;
}

function normalizeEvent_(value) {
  const eventType = clean_(value, 40) || 'other';
  return EVENT_TYPES.indexOf(eventType) >= 0 ? eventType : 'other';
}

function clean_(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength || 160);
}

function cleanUrl_(value) {
  const raw = clean_(value, 500);
  return /^https?:\/\//i.test(raw) || /^[\w.-]+\.html/i.test(raw) || raw.indexOf('assets/') === 0 ? raw : '';
}

function sanitizeCallback_(value) {
  const callback = clean_(value, 80);
  return /^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*)*$/.test(callback) ? callback : '';
}

function asDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value;
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed) ? null : parsed;
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays_(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function slug_(value) {
  return String(value || 'tool')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'tool';
}
