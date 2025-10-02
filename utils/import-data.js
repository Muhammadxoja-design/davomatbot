const fs = require('fs').promises;
const path = require('path');

async function importStudentData(db) {
    async function createDefaultData(db) {
        const filePath = path.join(__dirname, '../hello.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const defaultStudents = JSON.parse(data);
        const insertQuery = `
        INSERT INTO students (
            class_name, class_count, first_name, last_name, father_name, 
            sex, country, is_teacher, birthday, telegram, instagram, 
            phone, clock, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    for (const s of defaultStudents) {
        await db.run(insertQuery, [
            s.class_name,
            s.class_count,
            s.first_name,
            s.last_name,
            s.father_name,
            s.sex,
            s.country,
            s.is_teacher,
            s.birthday,
            s.telegram,
            s.instagram,
            s.phone,
            s.clock,
            s.password
        ]);
    }
    
    }
    try {
        const existingCount = await db.get('SELECT COUNT(*) as count FROM students');

        if (existingCount.count > 0) {
            console.log('O\'quvchilar ma\'lumotlari allaqachon mavjud');
            return;
        }

        console.log('O\'quvchilar ma\'lumotlarini import qilish...');

        const sqlPath = path.join(__dirname, '../data/students.sql');

        try {
            const sqlContent = await fs.readFile(sqlPath);
            await processSQLContent(db, sqlContent);
        } catch (error) {
            console.log('SQL fayl topilmadi, default ma\'lumotlarni yaratish...');
            await createDefaultData(db);
        }

        await updateClassesTable(db);

        console.log('✅ O\'quvchilar ma\'lumotlari muvaffaqiyatli import qilindi');

    } catch (error) {
        console.error('Import xatoligi:', error);
        throw error;
    }
}

async function processSQLContent(db, sqlContent) {
    const insertMatch = sqlContent.match(/INSERT INTO `peoples` VALUES\s*(.+);/);

    if (!insertMatch) {
        throw new Error('SQL faylda INSERT qatorlari topilmadi');
    }

    const valuesString = insertMatch[1];
    const rows = parseInsertValues(valuesString);

    const insertQuery = `
        INSERT INTO students (
            class_name, class_count, first_name, last_name, father_name, 
            sex, country, is_teacher, birthday, telegram, instagram, 
            phone, clock, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const row of rows) {
        try {
            await db.run(insertQuery, row);
        } catch (error) {
            console.error('Qator import xatoligi:', error.message);
        }
    }

    console.log(`${rows.length} ta o'quvchi ma'lumoti import qilindi`);
}

function parseInsertValues(valuesString) {
    const rows = [];
    let currentPos = 0;

    while (currentPos < valuesString.length) {
        const startPos = valuesString.indexOf('(', currentPos);
        if (startPos === -1) break;

        let endPos = startPos + 1;
        let parenCount = 1;
        let inQuotes = false;
        let quoteChar = null;

        while (endPos < valuesString.length && parenCount > 0) {
            const char = valuesString[endPos];

            if (!inQuotes) {
                if (char === "'" || char === '"') {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === '(') {
                    parenCount++;
                } else if (char === ')') {
                    parenCount--;
                }
            } else {
                if (char === quoteChar && valuesString[endPos - 1] !== '\\') {
                    inQuotes = false;
                    quoteChar = null;
                }
            }

            endPos++;
        }

        if (parenCount === 0) {
            const rowString = valuesString.substring(startPos + 1, endPos - 1);
            const rowData = parseRowData(rowString);
            if (rowData.length === 14) {
                rows.push(rowData);
            }
        }

        currentPos = endPos;
    }

    return rows;
}

function parseRowData(rowString) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = null;
    let i = 0;

    while (i < rowString.length) {
        const char = rowString[i];

        if (!inQuotes) {
            if (char === "'" || char === '"') {
                inQuotes = true;
                quoteChar = char;
            } else if (char === ',') {
                values.push(processValue(currentValue.trim()));
                currentValue = '';
                i++;
                continue;
            } else if (char !== ' ' || currentValue !== '') {
                currentValue += char;
            }
        } else {
            if (char === quoteChar && (i === 0 || rowString[i - 1] !== '\\')) {
                inQuotes = false;
                quoteChar = null;
            } else {
                currentValue += char;
            }
        }

        i++;
    }

    if (currentValue.trim()) {
        values.push(processValue(currentValue.trim()));
    }

    return values;
}

function processValue(value) {
    if (value === 'NULL' || value === '') {
        return null;
    }

    if ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
    }

    if (value === '0' || value === 'false') {
        return 0;
    }
    if (value === '1' || value === 'true') {
        return 1;
    }

    if (/^\d+$/.test(value)) {
        return parseInt(value);
    }

    return value;
}



async function updateClassesTable(db) {
    try {
        const classes = await db.all(`
            SELECT 
                class_name,
                SUBSTR(class_name, 1, 1) as grade_level,
                SUBSTR(class_name, 3) as class_section,
                COUNT(CASE WHEN is_teacher = 0 THEN 1 END) as student_count,
                MAX(CASE WHEN is_teacher = 1 THEN id END) as teacher_id
            FROM students 
            WHERE class_name IS NOT NULL 
            GROUP BY class_name
        `);

        await db.run('DELETE FROM classes');

        const insertClassQuery = `
            INSERT INTO classes (grade_level, class_section, class_name, teacher_id, student_count)
            VALUES (?, ?, ?, ?, ?)
        `;

        for (const cls of classes) {
            await db.run(insertClassQuery, [
                parseInt(cls.grade_level),
                cls.class_section,
                cls.class_name,
                cls.teacher_id,
                cls.student_count
            ]);
        }

        console.log(`${classes.length} ta sinf ma'lumoti yangilandi`);

    } catch (error) {
        console.error('Sinflar jadvalini yangilashda xatolik:', error);
    }
}

module.exports = {
    importStudentData
};