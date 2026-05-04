# PEPS LIVE Community Site V4

เวอร์ชันนี้ปรับหน้าเว็บให้เป็นระเบียบ อ่านง่ายขึ้น และยังคงโทนดำ-ส้ม GenZ Sports Production

## จุดที่ปรับจาก V3

- หน้าแรกอ่านง่ายขึ้น ไม่รก ไม่โดนพื้นหลังกลืน
- แยกส่วนชัดเจน:
  1. Hero บอกว่าเว็บคืออะไร
  2. Quick Start บอกวิธีเริ่มใช้งาน
  3. Main Dock UI แสดงเครื่องมือหลัก
  4. Coming Next สำหรับระบบที่จะเพิ่มทีหลัง
  5. Equipment แนะนำอุปกรณ์
  6. Support / Donate แบบสุภาพ
  7. Guide
  8. Social Links
- เปลี่ยนฟอนต์เป็นแนว GenZ มากขึ้น:
  - Prompt สำหรับหัวข้อ
  - Chakra Petch สำหรับข้อมูลแนวระบบ/สปอร์ต
  - IBM Plex Sans Thai สำหรับเนื้อหา อ่านง่าย
- เพิ่มเอฟเฟกต์:
  - Scroll reveal
  - Animated diagonal line
  - Hover card lift
  - Glow button
- หน้าเว็บคนทั่วไปไม่มี Login
- หน้า Admin ยังเข้าผ่าน /admin.html เท่านั้น

## วิธีอัปขึ้น GitHub Pages

อัปโหลดทุกไฟล์ใน ZIP ไปที่ root ของ repo แล้วเปิด Settings > Pages > Deploy from branch

## Admin

URL:

`https://ชื่อผู้ใช้.github.io/ชื่อ-repo/admin.html`

ค่าเริ่มต้น:

- Username: admin
- Password: pepslive2026

หลังแก้ข้อมูลใน admin:
1. กด Export data.json
2. อัปโหลด data.json ทับใน GitHub
3. Commit changes
