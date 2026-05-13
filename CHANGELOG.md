# Changelog

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
