import fs from 'fs';
import { insertStudent } from '../database.js';

export async function importStudentsFromSQL(filePath) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Extract INSERT VALUES from the SQL dump
    const insertPattern = /INSERT INTO `peoples` VALUES \((.*?)\);/gs;
    const matches = [...sqlContent.matchAll(insertPattern)];

    let importCount = 0;

    for (const match of matches) {
      const valuesString = match[1];

      // Parse the VALUES clause - this is a simplified parser
      // In production, you might want to use a proper SQL parser
      const values = parseInsertValues(valuesString);

      for (const studentValues of values) {
        try {
          const studentData = {
            class_name: studentValues[0]?.replace(/'/g, '') || null,
            class_count: parseInt(studentValues[1]) || null,
            first_name: studentValues[2]?.replace(/'/g, '') || '',
            last_name: studentValues[3]?.replace(/'/g, '') || '',
            father_name: studentValues[4]?.replace(/'/g, '') || null,
            sex: studentValues[5]?.replace(/'/g, '') || null,
            country: studentValues[6]?.replace(/'/g, '') || 'uz',
            is_teacher: parseInt(studentValues[7]) || 0,
            birthday: studentValues[8] === 'NULL' ? null : studentValues[8]?.replace(/'/g, ''),
            telegram: studentValues[9] === 'NULL' ? null : studentValues[9]?.replace(/'/g, ''),
            instagram: studentValues[10] === 'NULL' ? null : studentValues[10]?.replace(/'/g, ''),
            tel_number: studentValues[11] === 'NULL' ? null : studentValues[11]?.replace(/'/g, ''),
            clock: studentValues[12] === 'NULL' ? null : parseInt(studentValues[12]),
            password: studentValues[13]?.replace(/'/g, '') || null
          };

          await insertStudent(studentData);
          importCount++;
        } catch (error) {
          console.error('Error inserting student:', error);
        }
      }
    }

    console.log(`Successfully imported ${importCount} students`);
    return importCount;

  } catch (error) {
    console.error('Error importing students from SQL:', error);
    throw error;
  }
}

function parseInsertValues(valuesString) {
  const values = [];
  const rows = valuesString.split('),(');

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];

    // Clean up the row
    if (i === 0) row = row.substring(1); // Remove leading (
    if (i === rows.length - 1) row = row.slice(0, -1); // Remove trailing )

    // Split by comma, but be careful with quoted strings
    const rowValues = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let j = 0; j < row.length; j++) {
      const char = row[j];

      if ((char === "'" || char === '"') && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
      } else if (char === ',' && !inQuotes) {
        rowValues.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      rowValues.push(current.trim());
    }

    values.push(rowValues);
  }

  return values;
}
