# PEPS LIVE Community Site V5

เวอร์ชันนี้เปลี่ยนจากหน้าเดียวเป็นหลายหน้า เพื่อให้อ่านง่ายและเป็นระเบียบขึ้น

## หน้าหลักในเว็บไซต์
- index.html = หน้าแรก
- start.html = เริ่มใช้งาน + ตั้งค่าก่อนการใช้งาน
- dock-ui.html = Dock UI
- equipment.html = อุปกรณ์
- support.html = ซัพพอร์ต
- follow.html = ช่องทางติดตาม
- admin.html = หน้าแอดมินแบบซ่อนจากเมนู

## เพิ่มใหม่
- หัวข้อ “ตั้งค่าก่อนการใช้งาน” ในหน้า start.html
- ใช้ภาพตัวอย่าง OBS WebSocket ที่ผู้ใช้อัปโหลดเป็นฐานประกอบคำอธิบาย
- สรุป Setting ชัดเจน:
  - Enable WebSocket Server
  - Server Port : 4455
  - Enable Authentication : Uncheck

## Admin
เข้าได้ที่ /admin.html
Username: admin
Password: pepslive2026

หมายเหตุ: หน้าแอดมินยังใช้ข้อมูลจาก data.json แบบ static เช่นเดิม
