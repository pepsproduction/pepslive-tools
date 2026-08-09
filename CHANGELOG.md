# Changelog

## V6.5 Stable Visitor Counter

- เปลี่ยนจาก CounterAPI v1 ที่ตอบ `410 Gone` เป็น Apps Script Web App เดิมของโปรเจกต์
- เพิ่มแท็บ `Visitors` สำหรับเก็บยอดผู้เข้าชมถาวร แยกจากยอดคลิก
- เพิ่ม lock และ `visit_key` เพื่อกันการนับซ้ำเมื่อเปิดหลายหน้า/รีเฟรช/รีทราย
- เก็บยอดล่าสุดไว้ใน browser เป็น fallback ชั่วคราว ไม่ย้อนกลับไปแสดง `000000` เมื่อ API ล่ม
- ตั้งค่า seed ยอดเดิมเป็น `436` คน โดยผู้เข้าชมใหม่ครั้งแรกจะเป็น `437`

## V6.2 Clean Counter

- เอาคำว่า `VISITS READY` ออกจากหน้าเว็บแล้ว
- ถ้ายังไม่ได้ใส่ GoatCounter Code ตัวนับจะถูกซ่อนไว้ ไม่แสดงคำ placeholder
- ถ้าใส่ GoatCounter Code แล้ว จะแสดง badge ข้างโลโก้เป็น `ผู้เข้าชม 1,234 views`
- ลบข้อความอธิบายเชิงงาน/เชิงแก้ไขออกจากหน้าเว็บตามที่ระบุ


## V6.3 Real Counter

- ตัวนับผู้เข้าชมแสดงเป็น `ผู้เข้าชม 000000 คน`
- ใช้ CounterAPI v1 แบบ public counter สำหรับ GitHub Pages
- ค่าเริ่มต้น:
  - namespace: `pepsproduction-pepslive-tools`
  - counterName: `site-visitors`
  - padDigits: `6`
- นับ 1 ครั้งต่อ browser ต่อวัน เพื่อลดการนับซ้ำเวลาเปิดหลายหน้า
- ถ้า API โหลดไม่ได้ จะแสดง `000000` ไว้ก่อน ไม่ปล่อยให้เป็นคำว่า READY

## V6.4 Dock Click Analytics

- เพิ่มระบบนับคลิกปุ่มเครื่องมือในหน้า Dock UI
- เพิ่มหน้า `dashboard.html#admin` สำหรับดูสรุป 1 / 7 / 30 / 60 / 90 วัน
- สร้าง Google Sheet หลังบ้านพร้อมแท็บ Dashboard, Clicks, Daily Summary, Tool Summary, Event Mix, Config และ Setup Guide พร้อมกราฟ 3 ตัว
- เพิ่ม Apps Script backend ที่รับ click event และส่ง summary กลับให้หน้า dashboard
- ตั้งค่า analytics ใน `data.json` พร้อม `spreadsheetId` และ URL ของ Google Sheet
