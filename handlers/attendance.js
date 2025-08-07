const { 
    getGradeLevels, 
    getClassesByGrade, 
    getStudentsByClass, 
    getStudentById,
    markAttendance 
} = require('../database');
const { 
    getGradeLevelKeyboard, 
    getClassKeyboard, 
    getStudentKeyboard,
    getAttendanceConfirmKeyboard,
    getHourSelectionKeyboard
} = require('../keyboards/index');
const { formatDate, getCurrentDate } = require('../utils/helpers');

function registerAttendanceHandlers(bot) {
    // Davomat olishni boshlash
    bot.action('attendance', async (ctx) => {
        try {
            const gradeLevels = await getGradeLevels();
            
            if (gradeLevels.length === 0) {
                await ctx.editMessageText('❌ Hech qanday sinf topilmadi.');
                return;
            }
            
            await ctx.editMessageText(
                '📝 *Davomat Olish*\n\nQaysi sinf darajasini tanlaysiz?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getGradeLevelKeyboard(gradeLevels)
                }
            );
            
        } catch (error) {
            console.error('Attendance start xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // Sinf darajasini tanlash
    bot.action(/^grade_(\d+)$/, async (ctx) => {
        try {
            const gradeLevel = ctx.match[1];
            const classes = await getClassesByGrade(gradeLevel);
            
            if (classes.length === 0) {
                await ctx.answerCbQuery('❌ Bu darajada sinflar topilmadi');
                return;
            }
            
            await ctx.editMessageText(
                `📚 *${gradeLevel}-sinf*\n\nQaysi bo'limni tanlaysiz?`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getClassKeyboard(classes, gradeLevel)
                }
            );
            
        } catch (error) {
            console.error('Grade selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // Sinfni tanlash
    bot.action(/^class_(.+)$/, async (ctx) => {
        try {
            const className = ctx.match[1];
            const students = await getStudentsByClass(className);
            
            if (students.length === 0) {
                await ctx.answerCbQuery('❌ Bu sinfda o\'quvchilar topilmadi');
                return;
            }
            
            // Sessiyada tanlangan sinfni saqlash
            ctx.session = ctx.session || {};
            ctx.session.selectedClass = className;
            ctx.session.selectedStudents = [];
            
            await ctx.editMessageText(
                `👥 *${className} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
                `📊 Jami: ${students.length} o'quvchi\n` +
                `✅ Tanlangan: 0`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getStudentKeyboard(students, [])
                }
            );
            
        } catch (error) {
            console.error('Class selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // O'quvchini tanlash/bekor qilish
    bot.action(/^student_(\d+)$/, async (ctx) => {
        try {
            const studentId = parseInt(ctx.match[1]);
            ctx.session = ctx.session || {};
            ctx.session.selectedStudents = ctx.session.selectedStudents || [];
            
            const index = ctx.session.selectedStudents.indexOf(studentId);
            if (index === -1) {
                ctx.session.selectedStudents.push(studentId);
            } else {
                ctx.session.selectedStudents.splice(index, 1);
            }
            
            const students = await getStudentsByClass(ctx.session.selectedClass);
            const selectedCount = ctx.session.selectedStudents.length;
            
            await ctx.editMessageText(
                `👥 *${ctx.session.selectedClass} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
                `📊 Jami: ${students.length} o'quvchi\n` +
                `✅ Tanlangan: ${selectedCount}`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getStudentKeyboard(students, ctx.session.selectedStudents)
                }
            );
            
            await ctx.answerCbQuery(
                index === -1 ? '✅ Tanlandi' : '❌ Bekor qilindi'
            );
            
        } catch (error) {
            console.error('Student selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // Barchasini tanlash
    bot.action('select_all_students', async (ctx) => {
        try {
            ctx.session = ctx.session || {};
            const students = await getStudentsByClass(ctx.session.selectedClass);
            ctx.session.selectedStudents = students.map(student => student.id);
            
            await ctx.editMessageText(
                `👥 *${ctx.session.selectedClass} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
                `📊 Jami: ${students.length} o'quvchi\n` +
                `✅ Tanlangan: ${ctx.session.selectedStudents.length}`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getStudentKeyboard(students, ctx.session.selectedStudents)
                }
            );
            
            await ctx.answerCbQuery('✅ Barcha o\'quvchilar tanlandi');
        } catch (error) {
            console.error('Select all students xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // Barchasini bekor qilish
    bot.action('deselect_all_students', async (ctx) => {
        try {
            ctx.session = ctx.session || {};
            const students = await getStudentsByClass(ctx.session.selectedClass);
            ctx.session.selectedStudents = [];
            
            await ctx.editMessageText(
                `👥 *${ctx.session.selectedClass} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
                `📊 Jami: ${students.length} o'quvchi\n` +
                `✅ Tanlangan: 0`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getStudentKeyboard(students, ctx.session.selectedStudents)
                }
            );
            
            await ctx.answerCbQuery('❌ Barcha tanlov bekor qilindi');
        } catch (error) {
            console.error('Deselect all students xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // Davomatni tasdiqlash
    bot.action('confirm_attendance', async (ctx) => {
        try {
            ctx.session = ctx.session || {};
            
            if (!ctx.session.selectedStudents || ctx.session.selectedStudents.length === 0) {
                await ctx.answerCbQuery('❌ Hech qanday o\'quvchi tanlanmadi');
                return;
            }
            
            await ctx.editMessageText(
                '⏰ *Soat tanlash*\n\nQaysi soat uchun davomat belgilaysiz?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getHourSelectionKeyboard()
                }
            );
            
        } catch (error) {
            console.error('Attendance confirmation xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // Soatni tanlash
    bot.action(/^hour_(\d+)$/, async (ctx) => {
        try {
            const hour = parseInt(ctx.match[1]);
            ctx.session = ctx.session || {};
            ctx.session.selectedHour = hour;
            
            const selectedStudents = ctx.session.selectedStudents || [];
            const className = ctx.session.selectedClass;
            
            let studentNames = [];
            for (const studentId of selectedStudents) {
                const student = await getStudentById(studentId);
                if (student) {
                    studentNames.push(`${student.first_name} ${student.last_name}`);
                }
            }
            
            const confirmMessage = `
📝 *Davomat Tasdiqlash*

🏫 Sinf: ${className}
⏰ Soat: ${hour}
📅 Sana: ${formatDate(getCurrentDate())}

👥 *Tanlangan o'quvchilar (${selectedStudents.length} ta):*
${studentNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Tasdiqlaysizmi?
            `;
            
            await ctx.editMessageText(confirmMessage, {
                parse_mode: 'Markdown',
                reply_markup: getAttendanceConfirmKeyboard()
            });
            
        } catch (error) {
            console.error('Hour selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    // Davomatni saqlash
    bot.action('save_attendance', async (ctx) => {
        try {
            ctx.session = ctx.session || {};
            const selectedStudents = ctx.session.selectedStudents || [];
            const hour = ctx.session.selectedHour;
            const className = ctx.session.selectedClass;
            const currentDate = getCurrentDate();
            const userId = ctx.from.id;
            
            let savedCount = 0;
            let errorCount = 0;
            
            for (const studentId of selectedStudents) {
                try {
                    await markAttendance(studentId, currentDate, hour, 'present', userId);
                    savedCount++;
                } catch (error) {
                    console.error(`Student ${studentId} uchun davomat saqlashda xatolik:`, error);
                    errorCount++;
                }
            }
            
            const resultMessage = `
✅ *Davomat Saqlandi*

📊 *Natijalar:*
• Muvaffaqiyatli: ${savedCount} ta
• Xatolik: ${errorCount} ta
• Jami: ${selectedStudents.length} ta

🏫 Sinf: ${className}
⏰ Soat: ${hour}
📅 Sana: ${formatDate(currentDate)}

Rahmat! Davomat muvaffaqiyatli saqlandi.

Agar botda hatolik bo'lsa yoki botni yaxshilash xaqidagi fikiringizni [Muhammadxo'ja](https://t.me/m_kimyonazarov) ga yozing!

U albatta javob berad 
            `;
            
            await ctx.editMessageText(resultMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏠 Asosiy menyu', callback_data: 'main_menu' }],
                        [{ text: '📝 Yana davomat olish', callback_data: 'start_attendance' }]
                    ]
                }
            });
            
            // Sessiyani tozalash
            ctx.session = {};
            
        } catch (error) {
            console.error('Save attendance xatoligi:', error);
            await ctx.answerCbQuery('❌ Davomatni saqlashda xatolik');
        }
    });
    
    // /davomat komandasi
    bot.command('davomat', async (ctx) => {
        await ctx.reply(
            '📝 Davomat olishni boshlash uchun tugmani bosing:',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📝 Davomat olishni boshlash', callback_data: 'start_attendance' }]
                    ]
                }
            }
        );
    });
}

module.exports = { registerAttendanceHandlers };
