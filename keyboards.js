import { Markup } from 'telegraf';

export function createGradeKeyboard(grades) {
  const buttons = grades.map(grade => 
    Markup.button.callback(`${grade.grade}-sinflar`, `grade_${grade.grade}`)
  );
  
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  
  rows.push([Markup.button.callback('🏠 Bosh sahifa', 'main_menu')]);
  
  return Markup.inlineKeyboard(rows);
}

export function createClassKeyboard(classes, grade) {
  const buttons = classes.map(cls => 
    Markup.button.callback(cls.class_name, `class_${cls.class_name}`)
  );
  
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  
  rows.push([
    Markup.button.callback('⬅️ Orqaga', `grade_${grade}`),
    Markup.button.callback('🏠 Bosh sahifa', 'main_menu')
  ]);
  
  return Markup.inlineKeyboard(rows);
}

export function createStudentKeyboard(students, className, page = 0, pageSize = 10) {
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, students.length);
  const pageStudents = students.slice(startIndex, endIndex);
  
  const buttons = pageStudents.map(student => {
    const name = `${student.first_name} ${student.last_name}`;
    return Markup.button.callback(
      `${student.class_count}. ${name}`, 
      `student_${student.id}`
    );
  });
  
  const rows = buttons.map(button => [button]);
  
  const paginationButtons = [];
  if (page > 0) {
    paginationButtons.push(
      Markup.button.callback('⬅️ Oldingi', `students_${className}_${page - 1}`)
    );
  }
  if (endIndex < students.length) {
    paginationButtons.push(
      Markup.button.callback('Keyingi ➡️', `students_${className}_${page + 1}`)
    );
  }
  
  if (paginationButtons.length > 0) {
    rows.push(paginationButtons);
  }
  
  const grade = className.split('-')[0];
  rows.push([
    Markup.button.callback('⬅️ Sinfga qaytish', `grade_${grade}`),
    Markup.button.callback('🏠 Bosh sahifa', 'main_menu')
  ]);
  
  return Markup.inlineKeyboard(rows);
}

export function createAttendanceKeyboard(studentId, className) {
  const buttons = [];
  
  for (let hour = 1; hour <= 6; hour++) {
    buttons.push(
      Markup.button.callback(`${hour}-soat ✅`, `mark_${studentId}_${hour}_present`),
      Markup.button.callback(`${hour}-soat ❌`, `mark_${studentId}_${hour}_absent`)
    );
  }
  
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  
  rows.push([
    Markup.button.callback('Barcha soatlar ✅', `mark_all_${studentId}_present`),
    Markup.button.callback('Barcha soatlar ❌', `mark_all_${studentId}_absent`)
  ]);
  
  rows.push([
    Markup.button.callback('⬅️ O\'quvchilarga qaytish', `class_${className}`),
    Markup.button.callback('🏠 Bosh sahifa', 'main_menu')
  ]);
  
  return Markup.inlineKeyboard(rows);
}

export function createReportsKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 Kunlik hisobot', 'report_daily'),
      Markup.button.callback('📈 Haftalik hisobot', 'report_weekly')
    ],
    [
      Markup.button.callback('📋 Oylik hisobot', 'report_monthly'),
      Markup.button.callback('📄 Yillik hisobot', 'report_yearly')
    ],
    [Markup.button.callback('🏠 Bosh sahifa', 'main_menu')]
  ]);
}

export function createMainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📝 Davomat olish', 'attendance'),
      Markup.button.callback('📊 Hisobotlar', 'reports')
    ],
    [Markup.button.callback('ℹ️ Yordam', 'help')]
  ]);
}

export function createReportPeriodKeyboard(reportType) {
  const buttons = [
    [
      Markup.button.callback('Bugun', `${reportType}_today`),
      Markup.button.callback('Bu hafta', `${reportType}_week`)
    ],
    [
      Markup.button.callback('Bu oy', `${reportType}_month`),
      Markup.button.callback('Bu yil', `${reportType}_year`)
    ]
  ];
  
  buttons.push([Markup.button.callback('🏠 Bosh sahifa', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
}
