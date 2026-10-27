# ซิงก์งานจาก YouTube

## ไลฟ์ที่กำหนดเวลาไว้ (Upcoming)

Worker จะค้นหาเฉพาะไลฟ์สาธารณะที่ตั้งเวลาไว้ในช่อง `@pepsproduction` แล้วแสดงชื่อ เวลาเริ่ม ภาพปก และลิงก์หน้าไลฟ์บนเว็บอัตโนมัติ ไม่ต้องกรอกข้อมูลซ้ำในหน้าเว็บ และไม่ขอ OAuth เข้าถึงไลฟ์ส่วนตัวหรือข้อมูลใน Studio

## สิ่งที่ต้องตั้งค่า

1. ใช้หรือสร้างโปรเจกต์ใน Google Cloud Console แล้วเปิด **YouTube Data API v3**
2. สร้าง API key และจำกัด API key ให้ใช้ได้เฉพาะ YouTube Data API v3
3. เผยแพร่ Worker ที่มี API route นี้ก่อน จากนั้นเปิด Cloudflare Worker `pepsproduction-home` ไปที่ **Settings > Variables and Secrets**
4. ตรวจว่ามี Secret ชื่อ `YOUTUBE_API_KEY` แล้ว; เพิ่มหรือหมุนค่าเฉพาะเมื่อยังไม่มีหรือต้องเปลี่ยน API key โดยห้ามใส่ใน source code, แชต หรือไฟล์หน้าเว็บ

ไม่ต้องเพิ่มบริการ Cloudflare อย่าง D1, KV หรือ R2; Worker cache รายการไว้ 30 นาที ส่วน YouTube Data API มีโควตาคำขอรายวันของ Google และหน้าเว็บใช้เฉพาะรายการสาธารณะเท่านั้น

เมื่อเริ่มไลฟ์แล้ว YouTube จะไม่นับรายการนั้นเป็น upcoming อีกต่อไป รายการที่กำหนดเวลาใหม่หรือเปลี่ยนเวลาอาจใช้เวลาสูงสุดประมาณ 30 นาทีจึงปรากฏตามรอบ cache

## Portfolio: 8 ไลฟ์ย้อนหลังล่าสุด

- `src/portfolio.mjs` อ่านข้อมูลสาธารณะจากแท็บ `/streams` เรียงตามหน้า YouTube และเลือก 8 รายการที่มีระยะเวลาจบแล้ว ไม่ใช้ API key และไม่ใช้รายการที่กรอกเองใน `site-content.json`
- ใช้ Cron เดิม `0 18 * * *` (01:00 น. เวลาไทย) เก็บ JSON ในตาราง `public_content` ของ D1 เดิม แยกจาก Analytics; การโหลดเว็บไม่เรียก YouTube และไม่มี polling
- หาก YouTube เปลี่ยนรูปแบบหรือบล็อกคำขอ รอบนั้นจะ fail โดยไม่เขียนทับข้อมูลล่าสุด ตรวจ failure ได้จาก Worker logs
- `/api/youtube-portfolio` คืน snapshot; ก่อน cron ครั้งแรกหรือเมื่อ D1 ใช้ไม่ได้ คืนไฟล์ `assets/youtube-portfolio.json` ซึ่งมีข้อมูลจริงที่ดึงไว้
- หน้า static/GitHub Pages ใช้ไฟล์สำรองเดียวกัน แต่การอัปเดตอัตโนมัติรายวันต้องใช้ Worker ที่ deploy แล้ว; static อย่างเดียวต้องรัน script และเผยแพร่ไฟล์ใหม่

### เตรียมและทดสอบ

```powershell
node scripts/sync-youtube-portfolio.mjs
node scripts/test-portfolio.mjs
node scripts/build-cloudflare-site.mjs
```

### เผยแพร่การเปลี่ยนแปลงครั้งถัดไป

```powershell
npx wrangler d1 migrations apply pepsproduction-analytics --remote
npx wrangler deploy
```

ตรวจ `/api/youtube-portfolio` ว่ามี 8 รายการ และตรวจ `updatedAt` หลังรอบ 01:00 น. ครั้งถัดไป การผ่าน unit test/local fetch ไม่ยืนยันว่า YouTube ยอมรับคำขอจาก Cloudflare หรือ cron production ทำงานแล้ว หากต้นทางบล็อก Worker จะคงข้อมูลเดิมและต้องเปลี่ยนตัวดึงไป YouTube Data API

### สถานะ production

ณ 27 ตุลาคม 2026 หน้า `https://pepsproduction.com/#works` แสดง 8 ไลฟ์ล่าสุดจาก YouTube แล้ว ตาราง `public_content` ถูกสร้างและบันทึกข้อมูลตั้งต้นใน D1 `pepsproduction-analytics` เรียบร้อย เส้นทาง `/api/youtube-portfolio` ตอบครบ 8 รายการ ส่วน Cron ของ Worker ตั้งไว้ทุกวันเวลา 18:00 UTC (01:00 น. ประเทศไทย)

ตรวจ production วันที่ 27 ต.ค. 2026 แล้วว่า secret `YOUTUBE_API_KEY` มีอยู่, `/api/youtube-upcoming` ตอบ `connected: true`, `/api/youtube-portfolio` ส่ง snapshot 8 รายการ และ D1 มี snapshot 8 รายการ; ตอนตรวจไม่มีไลฟ์สาธารณะที่ตั้งเวลาไว้ จึงได้ `streams: []` ซึ่งเป็นสถานะปกติเมื่อไม่มีรายการ upcoming

Cloudflare ยืนยันว่า trigger `0 18 * * *` ผูกกับ `pepsproduction-home` และไม่มี D1 migration ค้าง การเรียก `scheduled()` ใน Wrangler แบบ local สำเร็จเมื่อ 27 ต.ค. เวลา 05:03 UTC และได้ snapshot 8 รายการ ซึ่งยืนยันโค้ดกับ D1 local เท่านั้น ไม่ใช่ Cron production

snapshot ใน D1 production ล่าสุดที่อ่านได้ยังเป็น `2026-10-27T03:59:59.788Z`; Worker รุ่นปัจจุบัน deploy เวลา 05:10 UTC หลัง snapshot นี้ รอบ Cron production ถัดไปคือ 27 ต.ค. เวลา 18:00 UTC (28 ต.ค. เวลา 01:00 ประเทศไทย) จึงยังต้องอ่าน timestamp ใน D1 หรือ scheduled log หลังรอบดังกล่าวเพื่อยืนยันการรันจริง
