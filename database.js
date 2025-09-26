    const sqlite3 = require('sqlite3').verbose();
    const { open } = require('sqlite');
    const config = require('./config');
    const { importStudentData } = require('./utils/import-data');

    let db;

    // Ma'lumotlar bazasini ishga tushirish
    async function initDatabase() {
        try {
            db = await open({
                filename: config.DB_PATH,
                driver: sqlite3.Database
            });
            
            // Jadvallarni yaratish
            await createTables();
            
            // O'quvchilar ma'lumotlarini import qilish
            await importStudentData(db);
            
            console.log('Ma\'lumotlar bazasi muvaffaqiyatli ishga tushdi');
            return db;
        } catch (error) {
            console.error('Ma\'lumotlar bazasi xatoligi:', error);
            throw error;
        }
    }

    // Jadvallarni yaratish
    async function createTables() {
        // O'quvchilar jadvali
        await db.exec(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name VARCHAR(10),
                class_count INTEGER,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                father_name VARCHAR(50),
                sex VARCHAR(10),
                country VARCHAR(20),
                is_teacher BOOLEAN DEFAULT 0,
                birthday DATE,
                telegram VARCHAR(50),
                instagram VARCHAR(50),
                phone VARCHAR(15),
                clock INTEGER,
                password VARCHAR(40),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Davomat jadvali
        await db.exec(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                date DATE,
                hour INTEGER,
                status VARCHAR(10) DEFAULT 'present',
                marked_by INTEGER,
                marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (student_id) REFERENCES students (id),
                UNIQUE(student_id, date, hour)
            )
        `);
        
        // Sinflar jadvali (tezkor qidiruv uchun)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                grade_level INTEGER,
                class_section VARCHAR(5),
                class_name VARCHAR(10) UNIQUE,
                teacher_id INTEGER,
                student_count INTEGER DEFAULT 0,
                FOREIGN KEY (teacher_id) REFERENCES students (id)
            )
        `);
        
        // Foydalanuvchilar jadvali (bot foydalanuvchilari)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS bot_users (
                id INTEGER PRIMARY KEY,
                telegram_id INTEGER UNIQUE,
                username VARCHAR(50),
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                role VARCHAR(20) DEFAULT 'user',
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Indekslar yaratish
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)`);
    }

    // Ma'lumotlar bazasi ob'ektini olish
    function getDatabase() {
        if (!db) {
            throw new Error('Ma\'lumotlar bazasi ishga tushirilmagan');
        }
        return db;
    }

    // O'quvchilarni olish
    async function getStudentsByClass(className) {
        const query = `
            SELECT * FROM students 
            WHERE class_name = ? AND is_teacher = 0 
            ORDER BY class_count ASC
        `;
        return await db.all(query, [className]);
    }

    // Sinflarni olish
    async function getClassesByGrade(gradeLevel) {
        const query = `
            SELECT DISTINCT class_name 
            FROM students 
            WHERE class_name LIKE ? 
            ORDER BY class_name
        `;
        return await db.all(query, [`${gradeLevel}-%`]);
    }

    // Darajalarni olish
    async function getGradeLevels() {
        const query = `
            SELECT DISTINCT CAST(
                CASE
                    WHEN LENGTH(class_name) >= 2 AND substr(class_name, 2, 1) BETWEEN '0' AND '9'
                    THEN substr(class_name, 1, 2)
                    ELSE substr(class_name, 1, 1)
                END AS INTEGER
            ) as grade_level
            FROM students
            WHERE class_name IS NOT NULL
            ORDER BY grade_level
        `;
        return await db.all(query);
    }


    // O'quvchi ma'lumotlarini olish
    async function getStudentById(studentId) {
        const query = `SELECT * FROM students WHERE id = ?`;
        return await db.get(query, [studentId]);
    }

    // Davomatni belgilash
    async function markAttendance(studentId, date, hour, status, markedBy, notes = null) {
        const query = `
            INSERT OR REPLACE INTO attendance 
            (student_id, date, hour, status, marked_by, notes, marked_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        return await db.run(query, [studentId, date, hour, status, markedBy, notes]);
    }

    // Davomat ma'lumotlarini olish
    async function getAttendanceByDate(date, className = null) {
        let query = `
            SELECT a.*, s.first_name, s.last_name, s.class_name 
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.date = ?
        `;
        let params = [date];
        
        if (className) {
            query += ` AND s.class_name = ?`;
            params.push(className);
        }
        
        query += ` ORDER BY s.class_name, s.class_count, a.hour`;
        
        return await db.all(query, params);
    }

    // Haftalik hisobot
    async function getWeeklyReport(startDate, endDate, className = null) {
        let query = `
            SELECT 
                s.id,
                s.first_name,
                s.last_name,
                s.class_name,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                COUNT(*) as total_hours
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id 
                AND a.date BETWEEN ? AND ?
            WHERE s.is_teacher = 0
        `;
        let params = [startDate, endDate];
        
        if (className) {
            query += ` AND s.class_name = ?`;
            params.push(className);
        }
        
        query += ` GROUP BY s.id ORDER BY s.class_name, s.class_count`;
        
        return await db.all(query, params);
    }

    // Oylik hisobot
    async function getMonthlyReport(year, month, className = null) {
        let query = `
            SELECT 
                s.id,
                s.first_name,
                s.last_name,
                s.class_name,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                COUNT(*) as total_hours,
                ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_percentage
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id 
                AND strftime('%Y', a.date) = ? 
                AND strftime('%m', a.date) = ?
            WHERE s.is_teacher = 0
        `;
        let params = [year.toString(), month.toString().padStart(2, '0')];
        
        if (className) {
            query += ` AND s.class_name = ?`;
            params.push(className);
        }
        
        query += ` GROUP BY s.id ORDER BY s.class_name, s.class_count`;
        
        return await db.all(query, params);
    }

    // Bot foydalanuvchisini ro'yxatdan o'tkazish
    async function registerBotUser(telegramId, username, firstName, lastName) {
        const query = `
            INSERT OR REPLACE INTO bot_users 
            (telegram_id, username, first_name, last_name, last_activity)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        return await db.run(query, [telegramId, username, firstName, lastName]);
    }

    module.exports = {
        initDatabase,
        getDatabase,
        getStudentsByClass,
        getClassesByGrade,
        getGradeLevels,
        getStudentById,
        markAttendance,
        getAttendanceByDate,
        getWeeklyReport,
        getMonthlyReport,
        registerBotUser
    };
