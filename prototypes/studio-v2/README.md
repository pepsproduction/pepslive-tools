# PepsProduction Studio V2 — interactive prototype

โค้ดนี้เริ่มจากต้นแบบเพื่อพัฒนาทิศทางภาพและการโต้ตอบ ปัจจุบัน Hero และ Director ถูกผสานเข้าหน้า PepsProduction ที่ `https://pepsproduction.com/` โดย build หลักเรียก `scripts/build-cloudflare-site.mjs` และสร้าง bundle ลง `assets/studio-v2/` ดู [แผนพัฒนา](PLAN.md)

## เปิดใช้งาน

ใช้ Node.js 22.12+ หรือ 24 และรันจากโฟลเดอร์นี้:

```powershell
npm ci
npm run dev
```

เปิด http://127.0.0.1:4186/ — ต้องเปิดเซิร์ฟเวอร์ไว้ขณะดูต้นแบบ

`npm run build` สร้างต้นแบบเดี่ยวใน `dist/` ด้วย relative asset paths (`base: './'`). เว็บหลักใช้ `node scripts/build-cloudflare-site.mjs` เพื่อ build component แบบ production แล้ว deploy ผ่าน Cloudflare Worker; API และข้อมูล Calendar/YouTube/analytics ของหน้าเว็บหลักยังทำงานผ่าน Worker เดิม

## สิ่งที่ลองได้

- Hero: สลับสนามแข่งขัน / เวทีอีเวนต์ / ห้องควบคุม เพื่อเปลี่ยนแสงและฉาก 3D
- ปุ่มปรับแสงและกระจก: ปรับความเร็ว Shader Gradient และความหนาของการหักเห
- Director: สลับกล้องสามมุม เพิ่มคะแนน ซ่อนสกอร์ พักฉาก และย้อนหกวินาทีในเหตุการณ์จำลองด้วยความเร็ว 0.45 เท่า
- ผลงาน: กรองประเภท เปิดรายละเอียด แล้วไปชมต้นฉบับ YouTube
- ปุ่มหยุดการเคลื่อนไหว เมนูมือถือ และแผนพัฒนาที่ท้ายหน้า

## โครงสร้าง

- `src/main.jsx`, `src/styles.css`: หน้าเว็บ เนื้อหา และการควบคุม
- `src/Studio.jsx`, `src/MatchScene.jsx`: ฉาก React Three Fiber
- `src/Atmosphere.jsx`: Shader Gradient และส่งภาพเฟรมให้กระจก
- `src/LiveGlass.jsx`: adapter รับภาพ canvas สดและควบคุมอายุ GPU resources
- `src/content.json`, `public/media/`: สำเนาข้อมูลสาธารณะและภาพประกอบ ไม่ sync กับเว็บหลักอัตโนมัติ
- `src/vendor/liquid-glass/`: upstream พร้อมใบอนุญาต ดู [ที่มาและการปรับ](THIRD_PARTY_NOTICES.md)

## ข้อจำกัด

สนาม ผู้เล่น สกอร์ และ replay เป็นเหตุการณ์จำลอง ไม่ใช่สัญญาณถ่ายทอดจริง กระจกหักเหเฉพาะพื้นหลัง Shader Gradient ที่ส่งผ่าน canvas ไม่ได้จับ DOM ทั้งหน้า หรือหักเหฉาก 3D ด้านหน้า

มีการแยกโหลดฉาก หยุด loop เมื่อพ้นจอ/ซ่อนแท็บ และรองรับ reduced motion จากระบบ ตรวจการแสดงผล production และการควบคุมหลักแล้ว ส่วนสมรรถนะบนโทรศัพท์จริงและ OBS, การบังคับ WebGL context loss/restore และการ emulation reduced motion ระดับระบบยังไม่ยืนยัน ต้นแบบเดี่ยวไม่ได้เรียก API; เมื่อผสานในหน้าเว็บหลักจะใช้ API เดิมของ Worker

ผลตรวจอยู่ใน [VERIFICATION.md](VERIFICATION.md)
