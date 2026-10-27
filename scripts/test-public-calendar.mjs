import assert from 'node:assert/strict';
import { parsePublicCalendar, isGoogleCalendarIcalUrl } from '../src/ical.mjs';

const feed = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:public-all-day@example.test',
  'DTSTART;VALUE=DATE:20261101',
  'DTEND;VALUE=DATE:20261106',
  'SUMMARY:[เว็บ] Virtus 2026 — ถ่ายทอดสดบาสเกตบอล',
  'DESCRIPTION:รายละเอียดภายในห้ามเผยแพร่',
  'LOCATION:สนามส่วนตัว',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:private-price@example.test',
  'DTSTART;TZID=Asia/Bangkok:20261107T213000',
  'DTEND;TZID=Asia/Bangkok:20261108T223000',
  'SUMMARY:ไลฟ์บอล กาฬสินธุ์ 17000/2000',
  'DESCRIPTION:ข้อมูลที่ไม่ควรเปิดเผย',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:private-appointment@example.test',
  'DTSTART;VALUE=DATE:20261109',
  'DTEND;VALUE=DATE:20261110',
  'SUMMARY:นัดส่วนตัวกับครอบครัว',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:public-timed@example.test',
  'DTSTART;TZID=Asia/Bangkok:20261107T213000',
  'DTEND;TZID=Asia/Bangkok:20261108T223000',
  'SUMMARY:[เว็บ] ถ่ายทอดสดฟุตบอล — เขาวง',
  'DESCRIPTION:ราคา 17000/2000 ไม่ควรออกจาก Worker',
  'LOCATION:ตำแหน่งส่วนตัว',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:cancelled@example.test',
  'DTSTART;VALUE=DATE:20261110',
  'DTEND;VALUE=DATE:20261111',
  'STATUS:CANCELLED',
  'SUMMARY:[เว็บ] ยกเลิกแล้ว',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:folded@example.test',
  'DTSTART;VALUE=DATE:20261112',
  'DTEND;VALUE=DATE:20261113',
  'SUMMARY:[เว็บ] ทดลอง\r\n  ถ่ายทอดสด',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:photo-booking@example.test',
  'DTSTART;VALUE=DATE:20261018',
  'DTEND;VALUE=DATE:20261019',
  'SUMMARY:ถ่ายภาพ POWER PLAY ARENA YOUTH CUP รุ่น 10+9 ปี',
  'DESCRIPTION:รายละเอียดงานภายในไม่ควรถูกเผยแพร่',
  'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');

const events = parsePublicCalendar(feed, { now: new Date('2026-10-15T00:00:00+07:00') });
assert.equal(events.length, 5, 'work events and explicitly published events should be returned');
assert.deepEqual(events.find((event) => event.title.startsWith('Virtus 2026')), {
  start: '2026-11-01',
  end: '2026-11-06',
  allDay: true,
  title: 'Virtus 2026 — ถ่ายทอดสดบาสเกตบอล'
});
assert.deepEqual(events.find((event) => event.title.startsWith('ถ่ายทอดสดฟุตบอล')), {
  start: '2026-11-07T14:30:00.000Z',
  end: '2026-11-08T15:30:00.000Z',
  allDay: false,
  title: 'ถ่ายทอดสดฟุตบอล — เขาวง'
});
assert.equal(events.find((event) => event.title.startsWith('ทดลอง'))?.title, 'ทดลอง ถ่ายทอดสด', 'folded iCalendar lines should be restored');
assert.ok(events.some((event) => event.title === 'ถ่ายภาพ POWER PLAY ARENA YOUTH CUP รุ่น 10+9 ปี'), 'photo production bookings should be automatically published');
assert.ok(events.some((event) => event.title === 'ไลฟ์บอล กาฬสินธุ์'), 'work event details with fee-like amounts must be removed');
assert.equal(events.some((event) => event.title.includes('ครอบครัว')), false, 'unrelated personal appointments must stay private');
assert.equal(JSON.stringify(events).includes('17000/2000'), false, 'unmarked and descriptive price data must not be returned');
assert.equal(JSON.stringify(events).includes('ตำแหน่งส่วนตัว'), false, 'locations must not be returned');
assert.equal(JSON.stringify(events).includes('UID'), false, 'calendar identifiers must not be returned');

assert.equal(isGoogleCalendarIcalUrl('https://calendar.google.com/calendar/ical/id/private/key/basic.ics'), true);
assert.equal(isGoogleCalendarIcalUrl('http://calendar.google.com/calendar/ical/id/private/key/basic.ics'), false);
assert.equal(isGoogleCalendarIcalUrl('https://evil.example/calendar/ical/id/private/key/basic.ics'), false);

console.log('Public Google Calendar filtering checks passed.');
