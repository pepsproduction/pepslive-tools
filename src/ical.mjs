const PUBLIC_EVENT_PREFIX = '[เว็บ]';
const PUBLIC_WORK_TITLE = /ถ่ายทอดสด|ถ่ายทอด|ไลฟ์|\blive\b|ฟุตบอล|ฟุตซอล|บาสเกตบอล|วอลเลย์บอล|กีฬา|การแข่งขัน|แข่ง|มวย|วิ่ง|ปั่น|ถ่ายภาพ|ถ่ายรูป|ช่างภาพ|photograph(?:y|er)?|production|โปรดักชัน/i;
const BANGKOK_OFFSET = '+07:00';

const unfoldLines = (ics) => {
  const unfolded = [];
  for (const line of String(ics).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    if (/^[ \t]/.test(line) && unfolded.length) unfolded[unfolded.length - 1] += line.slice(1);
    else unfolded.push(line);
  }
  return unfolded;
};

const parseProperty = (line) => {
  const divider = line.indexOf(':');
  if (divider < 1) return null;
  const [name, ...parameterParts] = line.slice(0, divider).split(';');
  const parameters = {};
  parameterParts.forEach((part) => {
    const index = part.indexOf('=');
    if (index > 0) parameters[part.slice(0, index).toUpperCase()] = part.slice(index + 1).replace(/^"|"$/g, '');
  });
  return { name: name.toUpperCase(), parameters, value: line.slice(divider + 1) };
};

const unescapeText = (value) => value
  .replace(/\\[nN]/g, '\n')
  .replace(/\\([\\,;])/g, '$1')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
  .trim();

const parseDateValue = (property) => {
  if (!property) return null;
  const value = property.value.trim();
  const allDay = property.parameters.VALUE?.toUpperCase() === 'DATE' || /^\d{8}$/.test(value);
  const dateMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (allDay && dateMatch) {
    return { value: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`, allDay: true };
  }

  const timeMatch = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(value);
  if (!timeMatch) return null;
  const [, year, month, day, hour, minute, second = '00', utc] = timeMatch;
  const local = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  if (utc) {
    const date = new Date(`${local}Z`);
    return Number.isNaN(date.getTime()) ? null : { value: date.toISOString(), allDay: false };
  }

  const timezone = property.parameters.TZID;
  if (timezone && timezone !== 'Asia/Bangkok') return null;
  const date = new Date(`${local}${BANGKOK_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : { value: date.toISOString(), allDay: false };
};

const normalizeEvent = (properties) => {
  const summary = unescapeText(properties.get('SUMMARY')?.value || '');
  const explicitlyPublished = summary.startsWith(PUBLIC_EVENT_PREFIX);
  if (!explicitlyPublished && !PUBLIC_WORK_TITLE.test(summary)) return null;
  if ((properties.get('STATUS')?.value || '').toUpperCase() === 'CANCELLED') return null;

  const title = summary
    .slice(explicitlyPublished ? PUBLIC_EVENT_PREFIX.length : 0)
    .replace(/\b\d{4,}\s*\/\s*\d{3,}\b/g, '')
    .replace(/\b(?:ราคา|ค่าจ้าง|ค่าตัว)\s*[:\-]?\s*[\d,]+(?:\s*\/\s*[\d,]+)?\s*(?:บาท)?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,;:–—-]+$/g, '')
    .trim()
    .slice(0, 120);
  const start = parseDateValue(properties.get('DTSTART'));
  const end = parseDateValue(properties.get('DTEND'));
  if (!title || !start || !end || start.allDay !== end.allDay) return null;

  const startTime = new Date(start.value).getTime();
  const endTime = new Date(end.value).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return null;

  return { start: start.value, end: end.value, allDay: start.allDay, title };
};

export function parsePublicCalendar(ics, { maxEvents = 200, now = new Date(), pastDays = 14, futureDays = 365 } = {}) {
  const events = [];
  let currentEvent = null;

  for (const line of unfoldLines(ics)) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = new Map();
      continue;
    }
    if (line === 'END:VEVENT') {
      if (currentEvent) {
        const event = normalizeEvent(currentEvent);
        if (event) events.push(event);
      }
      currentEvent = null;
      continue;
    }
    if (!currentEvent) continue;
    const property = parseProperty(line);
    if (property && !currentEvent.has(property.name)) currentEvent.set(property.name, property);
  }

  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const earliest = nowTime - pastDays * 24 * 60 * 60 * 1000;
  const latest = nowTime + futureDays * 24 * 60 * 60 * 1000;
  return events
    .filter((event) => new Date(event.end).getTime() >= earliest && new Date(event.start).getTime() <= latest)
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'th'))
    .slice(0, maxEvents);
}

export function isGoogleCalendarIcalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'calendar.google.com'
      && url.pathname.startsWith('/calendar/ical/')
      && url.pathname.endsWith('.ics');
  } catch {
    return false;
  }
}
