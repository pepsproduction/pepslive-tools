# PEPS LIVE Tools V6.1 Repo-Base Fix

ชุดนี้ใช้ข้อมูลจาก repo ปัจจุบันเป็นหลัก และแก้ปัญหาหน้าเว็บดูเหมือนบัค/พื้นหลังขาว/ไม่มี UI โดยเพิ่มความทนทานของ frontend

## สิ่งที่แก้ใน V6.1

- คงข้อมูลปัจจุบันจาก `data.json` เช่น Dock UI, AutoCue Dock, ลิงก์ Shopee, Donate, Social
- เพิ่ม/คง Visitor Counter ข้างโลโก้
- เพิ่ม Animated Background
- เพิ่ม Button Ripple / Hover / Active Menu / Card Glow
- แก้ fallback: ถ้า JavaScript หรือ data.json โหลดมีปัญหา เนื้อหาจะไม่ถูกซ่อนจนเหลือหน้าว่าง
- ใช้ `.peps-js .reveal` แทนการซ่อน `.reveal` โดยตรง เพื่อกันหน้าเปล่าหาก JS error
- ยังใช้ GitHub Pages + data.json เหมือนเดิม
- Visitor Counter รุ่นปัจจุบันใช้ Google Apps Script + แท็บ `Visitors` แยกจาก Clicks เพื่อเก็บยอดต่อเนื่องและกันนับซ้ำ

## วิธีอัปขึ้น GitHub

อัปโหลดไฟล์ทั้งหมดใน ZIP ทับของเดิมใน repo:

- index.html
- start.html
- dock-ui.html
- equipment.html
- support.html
- follow.html
- admin.html
- data.json
- assets/

สำคัญ: ต้องอัปโหลดทั้ง `assets/site.css` และ `assets/app.js` ด้วย ไม่งั้น UI/animation จะไม่ครบ

## รูปสไลด์หน้า Dock UI

- เปิด `index.html#admin` แล้วเข้าแท็บ Dock
- ในแต่ละเครื่องมือสามารถใส่รูปสไลด์ 16:9 ได้สูงสุด 10 รูป
- รองรับการใส่ URL/Path รูป เช่น `assets/dock-media/demo.png` หรืออัปโหลดไฟล์ PNG/JPEG ผ่าน Admin
- เลือกโหมดได้เป็น Manual ให้ผู้ใช้กดเอง หรือ Auto ให้เลื่อนอัตโนมัติ
- ถ้าเครื่องมือยังไม่มีรูป หน้าเว็บจะใช้ mockup เดิมเป็น fallback เพื่อไม่ให้ layout พัง

## Click Analytics / Dashboard

- Google Sheet หลังบ้าน: https://docs.google.com/spreadsheets/d/1QiONjsc7hc_9BjXBOF8QJW8LsbHC9uIwzq8FmhiUaJc
- หน้า Dashboard บนเว็บ: `dashboard.html#admin`
- Apps Script backend อยู่ที่ `apps-script/pepslive-click-analytics.gs`
- วิธี deploy และเชื่อม endpoint อยู่ที่ `docs/click-analytics-setup.md`
- ระบบไม่เก็บ secret ใน repo และใช้ GitHub Pages ได้เหมือนเดิม

## PepsProduction Home + Cloudflare

- `index.html` เป็นหน้าแนะนำ PepsProduction แยกหมวดผลงาน ถ่ายทอดสด วิดีโอ คิวงาน และช่องทางติดต่อ พร้อมปุ่มดาวน์โหลด PepsTool Launcher
- แก้ข้อมูลเปิดเผยได้ใน `site-content.json` โดยเพิ่มรายการใน `portfolio`, `broadcasts`, `videos` และ `schedule`
- หน้าเดิม เช่น คู่มือ Dock UI อุปกรณ์ Admin และ Dashboard ยังถูกคัดลอกไปเผยแพร่ด้วย
- `src/worker.mjs` ให้ API สำหรับคิว Google Calendar ไลฟ์ YouTube ที่กำหนดเวลาไว้ และตัวนับผู้เข้าชมจริง; ไม่ต้องเพิ่ม D1, KV หรือ R2
- ส่วนประสบการณ์ 3D ใหม่อยู่ใน `prototypes/studio-v2`; หน้าแรกใช้ชุด component เดียวกันสำหรับฉาก R3F, Shader Gradient, Liquid Glass JS และเดโมผู้กำกับภาพ โดยยังคงส่วนข้อมูลสดเดิม
- รายการติดต่อถูก render จาก `site-content.json` ครบ 7 รายการ รวม LINE, Facebook ทั้งสองบัญชี, TikTok, YouTube และโทรศัพท์ทั้งสองเบอร์
- Google Calendar ซิงก์ชื่องานถ่ายทอดสด/โปรดักชันอัตโนมัติ และเลือกเผยแพร่รายการอื่นด้วย `[เว็บ] ` ตาม `docs/GOOGLE-CALENDAR-WEB-SYNC.md`
- ตัวนับผู้เข้าชมใช้ Google Apps Script/Sheet เดิม นับไม่ซ้ำต่อ browser ต่อวัน และเก็บยอดเดิมไว้
- LINE QR กับโลโก้ Facebook, TikTok, LINE, YouTube และโทรศัพท์เก็บไว้ใน assets ของเว็บ ไม่เรียกภาพจากบริการภายนอก
- ไลฟ์สาธารณะของ YouTube ซิงก์อัตโนมัติเมื่อมี `YOUTUBE_API_KEY` ใน Cloudflare Secret; ดู `docs/YOUTUBE-LIVE-AUTO-SYNC.md`
- Worker `pepsproduction-home` ที่ใช้งานอยู่มี API routes แล้ว; ตรวจ production วันที่ 27 ต.ค. 2026 พบ Calendar, YouTube และ visitor read routes ตอบได้ และ secret ที่ต้องใช้ตั้งอยู่ใน Cloudflare โดยไม่เก็บค่าใน repo
- Launcher v2.6.0 ใช้ไฟล์ที่เผยแพร่อยู่บน Google Drive เดิม เพราะไฟล์ติดตั้งใหญ่กว่าขีดจำกัด asset ต่อไฟล์ของ Cloudflare

### Build / deploy

```powershell
npm ci --prefix prototypes/studio-v2
node scripts/build-cloudflare-site.mjs
npx wrangler deploy
```

คำสั่ง build จะสร้างไฟล์ฉากลง `assets/studio-v2/` ก่อนคัดลอกเว็บไป `dist/` ตัว build output ของฉากเป็นไฟล์ generated และไม่แก้ข้อมูลติดต่อ

ก่อนเผยแพร่ตรวจด้วยคำสั่ง:

```powershell
node scripts/test-public-calendar.mjs
node scripts/test-portfolio.mjs
node scripts/test-worker-visitor.mjs
node scripts/test-worker-analytics.mjs
node scripts/test-worker-schedule.mjs
node scripts/test-worker-youtube.mjs
```

Wrangler อ่านค่าจาก `wrangler.jsonc`; build script จะคัดลอกเฉพาะไฟล์เว็บที่กำหนดไว้ในรายการ ส่วน API key และ Secret ของ Calendar ต้องเพิ่มในหน้า Cloudflare เท่านั้น ห้ามใส่ใน source code หรือ `site-content.json`

## Changelog

รายละเอียดการแก้ไขย้อนหลังแยกไว้ใน CHANGELOG.md เพื่อให้หน้า README อ่านง่ายขึ้น
