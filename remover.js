const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Bazaga ulanish
const dbPath = path.join(__dirname, 'attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error("❌ DB ulanish xatosi:", err.message);
  }
  console.log("✅ Baza ulandi");
});

// Takrorlanganlarni o'chirish
db.serialize(() => {
  const selectDuplicatesQuery = `
    SELECT MIN(id) as keep_id
    FROM students
    GROUP BY first_name, last_name, father_name, birthday, class_name
  `;

  db.all(selectDuplicatesQuery, [], (err, rows) => {
    if (err) {
      console.error("❌ SELECT xatosi:", err.message);
      db.close();
      return;
    }

    const keepIds = rows.map(row => row.keep_id);

    if (keepIds.length === 0) {
      console.log("🔍 Hech qanday takroriy yozuv topilmadi.");
      db.close();
      return;
    }

    const placeholders = keepIds.map(() => '?').join(',');
    const deleteQuery = `
      DELETE FROM students
      WHERE id NOT IN (${placeholders})
    `;

    db.run(deleteQuery, keepIds, function (err) {
      if (err) {
        console.error("❌ DELETE xatosi:", err.message);
      } else {
        console.log(`🗑️ ${this.changes} ta takrorlangan qator o'chirildi`);
      }

      // ❗️ Endi xavfsiz yopamiz
      db.close((err) => {
        if (err) return console.error("❌ Yopishda xato:", err.message);
        console.log("✅ Baza yopildi");
      });
    });
  });
});
