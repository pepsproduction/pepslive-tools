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


## V6.2 Clean Counter

- เอาคำว่า `VISITS READY` ออกจากหน้าเว็บแล้ว
- ถ้ายังไม่ได้ใส่ GoatCounter Code ตัวนับจะถูกซ่อนไว้ ไม่แสดงคำ placeholder
- ถ้าใส่ GoatCounter Code แล้ว จะแสดง badge ข้างโลโก้เป็น `ผู้เข้าชม 1,234 views`
- ลบข้อความอธิบายเชิงงาน/เชิงแก้ไขออกจากหน้าเว็บตามที่ระบุ
