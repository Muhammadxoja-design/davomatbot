// Asosiy menyu klaviaturasi
function getMainMenuKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '📝 Davomat olish', callback_data: 'attendance' },
                { text: '📊 Hisobotlar', callback_data: 'reports' }
            ],
            [
                { text: '❓ Yordam', callback_data: 'help' }
            ]
        ]
    };
}

// Sinf darajasi klaviaturasi
function getGradeLevelKeyboard(gradeLevels, reportType = null) {
    const keyboard = [];
    
    gradeLevels.forEach(grade => {
        const callbackData = reportType ? 
            `report_grade_${grade.grade_level}_${reportType}` : 
            `grade_${grade.grade_level}`;
        
        keyboard.push([{
            text: `${grade.grade_level}-sinflar`,
            callback_data: callbackData
        }]);
    });
    
    keyboard.push([{ text: '🔙 Orqaga', callback_data: 'main_menu' }]);
    
    return { inline_keyboard: keyboard };
}

// Sinflar klaviaturasi
function getClassKeyboard(classes, gradeLevel, reportType = null) {
    const keyboard = [];
    
    classes.forEach(cls => {
        const callbackData = reportType ? 
            `report_class_${cls.class_name}_${reportType}` : 
            `class_${cls.class_name}`;
        
        keyboard.push([{
            text: cls.class_name,
            callback_data: callbackData
        }]);
    });
    
    const backCallback = reportType ? 
        `report_grade_${gradeLevel}_${reportType}` : 
        `grade_${gradeLevel}`;
    
    keyboard.push([{ text: '🔙 Orqaga', callback_data: backCallback }]);
    
    return { inline_keyboard: keyboard };
}

// O'quvchilar klaviaturasi
function getStudentKeyboard(students, selectedStudents = []) {
    const keyboard = [];
    
    // O'quvchilarni 1 tadan qator qilib joylashtirish (ko'proq ma'lumot ko'rish uchun)
    students.forEach(student => {
        const isSelected = selectedStudents.includes(student.id);
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
        const displayText = `${isSelected ? '⭕' :'✅' } ${student.class_count}. ${studentName}`;
        
        keyboard.push([{
            text: displayText,
            callback_data: `student_${student.id}`
        }]);
    });
    
    // Boshqaruv tugmalari
    const controlRow = [];
    
    // Barchasini tanlash tugmasi
    controlRow.push({ text: '✅ Barchasini tanlash', callback_data: 'select_all_students' });
    controlRow.push({ text: '❌ Barchasini bekor qilish', callback_data: 'deselect_all_students' });
    keyboard.push(controlRow);
    
    const actionRow = [];
    if (selectedStudents.length > 0) {
        actionRow.push({ text: `✅ Tasdiqlash (${selectedStudents.length})`, callback_data: 'confirm_attendance' });
    }
    
    actionRow.push({ text: '🔙 Orqaga', callback_data: 'attendance' });
    keyboard.push(actionRow);
    
    return { inline_keyboard: keyboard };
}

// Soat tanlash klaviaturasi
function getHourSelectionKeyboard() {
    const keyboard = [];
    
    // 6 soatni 3x2 formatda joylashtirish
    for (let i = 1; i <= 6; i += 3) {
        const row = [];
        for (let j = i; j < Math.min(i + 3, 7); j++) {
            row.push({
                text: `${j}-soat`,
                callback_data: `hour_${j}`
            });
        }
        keyboard.push(row);
    }
    
    keyboard.push([{ text: '🔙 Orqaga', callback_data: 'confirm_attendance' }]);
    
    return { inline_keyboard: keyboard };
}

// Davomatni tasdiqlash klaviaturasi
function getAttendanceConfirmKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '✅ Saqlash', callback_data: 'save_attendance' },
                { text: '❌ Bekor qilish', callback_data: 'start_attendance' }
            ],
            [{ text: '🔙 Orqaga', callback_data: 'confirm_attendance' }]
        ]
    };
}

// Hisobot turlari klaviaturasi
function getReportTypeKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '📅 Kunlik', callback_data: 'daily_report' },
                { text: '📈 Haftalik', callback_data: 'weekly_report' }
            ],
            [
                { text: '📊 Oylik', callback_data: 'monthly_report' },
                { text: '📋 Yillik', callback_data: 'yearly_report' }
            ],
            [{ text: '🔙 Orqaga', callback_data: 'main_menu' }]
        ]
    };
}

// Oy tanlash klaviaturasi
function getMonthKeyboard(year) {
    const months = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    
    const keyboard = [];
    
    // Oylarni 3x4 formatda joylashtirish
    for (let i = 0; i < 12; i += 3) {
        const row = [];
        for (let j = i; j < Math.min(i + 3, 12); j++) {
            row.push({
                text: months[j],
                callback_data: `month_${j + 1}_${year}`
            });
        }
        keyboard.push(row);
    }
    
    keyboard.push([{ text: '🔙 Orqaga', callback_data: 'monthly_report' }]);
    
    return { inline_keyboard: keyboard };
}

// Yil tanlash klaviaturasi
function getYearKeyboard() {
    const currentYear = new Date().getFullYear();
    const keyboard = [];
    
    // Joriy yil va oldingi 2 yil
    for (let year = currentYear; year >= currentYear - 2; year--) {
        keyboard.push([{
            text: `${year}-yil`,
            callback_data: `year_${year}`
        }]);
    }
    
    keyboard.push([{ text: '🔙 Orqaga', callback_data: 'monthly_report' }]);
    
    return { inline_keyboard: keyboard };
}

module.exports = {
    getMainMenuKeyboard,
    getGradeLevelKeyboard,
    getClassKeyboard,
    getStudentKeyboard,
    getHourSelectionKeyboard,
    getAttendanceConfirmKeyboard,
    getReportTypeKeyboard,
    getMonthKeyboard,
    getYearKeyboard
};
