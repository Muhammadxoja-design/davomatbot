const { 
    getWeeklyReport, 
    getMonthlyReport, 
    getAttendanceByDate,
    getClassesByGrade,
    getGradeLevels 
} = require('../database');
const { 
    getReportTypeKeyboard,
    getGradeLevelKeyboard,
    getClassKeyboard,
    getMonthKeyboard,
    getYearKeyboard
} = require('../keyboards/index');
const { 
    formatDate, 
    getCurrentDate, 
    getWeekStartEnd, 
    getMonthStartEnd,
    formatAttendanceReport 
} = require('../utils/helpers');

function registerReportHandlers(bot) {
    bot.action('reports', async (ctx) => {
        try {
            await ctx.editMessageText(
                '📊 *Hisobotlar*\n\nQaysi turdagi hisobot kerak?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getReportTypeKeyboard()
                }
            );
        } catch (error) {
            console.error('Reports start xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.action('daily_report', async (ctx) => {
        try {
            const gradeLevels = await getGradeLevels();
            
            ctx.session = ctx.session || {};
            ctx.session.reportType = 'daily';
            
            await ctx.editMessageText(
                '📅 *Kunlik Hisobot*\n\nQaysi sinf darajasi uchun?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getGradeLevelKeyboard(gradeLevels, 'daily')
                }
            );
        } catch (error) {
            console.error('Daily report xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.action('weekly_report', async (ctx) => {
        try {
            const gradeLevels = await getGradeLevels();
            
            ctx.session = ctx.session || {};
            ctx.session.reportType = 'weekly';
            
            await ctx.editMessageText(
                '📈 *Haftalik Hisobot*\n\nQaysi sinf darajasi uchun?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getGradeLevelKeyboard(gradeLevels, 'weekly')
                }
            );
        } catch (error) {
            console.error('Weekly report xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.action('monthly_report', async (ctx) => {
        try {
            const gradeLevels = await getGradeLevels();
            
            ctx.session = ctx.session || {};
            ctx.session.reportType = 'monthly';
            
            await ctx.editMessageText(
                '📊 *Oylik Hisobot*\n\nQaysi sinf darajasi uchun?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getGradeLevelKeyboard(gradeLevels, 'monthly')
                }
            );
        } catch (error) {
            console.error('Monthly report xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.action(/^report_grade_(\d+)_(.+)$/, async (ctx) => {
        try {
            const gradeLevel = ctx.match[1];
            const reportType = ctx.match[2];
            const classes = await getClassesByGrade(gradeLevel);
            
            ctx.session = ctx.session || {};
            ctx.session.reportGrade = gradeLevel;
            ctx.session.reportType = reportType;
            
            await ctx.editMessageText(
                `📚 *${gradeLevel}-sinf ${reportType === 'daily' ? 'Kunlik' : reportType === 'weekly' ? 'Haftalik' : 'Oylik'} Hisobot*\n\nQaysi sinfni tanlaysiz?`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getClassKeyboard(classes, gradeLevel, reportType)
                }
            );
        } catch (error) {
            console.error('Report grade selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.action(/^report_class_(.+)_(.+)$/, async (ctx) => {
        try {
            const className = ctx.match[1];
            const reportType = ctx.match[2];
            
            ctx.session = ctx.session || {};
            ctx.session.reportClass = className;
            
            if (reportType === 'daily') {
                await generateDailyReport(ctx, className);
            } else if (reportType === 'weekly') {
                await generateWeeklyReport(ctx, className);
            } else if (reportType === 'monthly') {
                await ctx.editMessageText(
                    `📊 *${className} sinfi - Oylik Hisobot*\n\nQaysi yilni tanlaysiz?`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getYearKeyboard()
                    }
                );
            }
        } catch (error) {
            console.error('Report class selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.action(/^year_(\d{4})$/, async (ctx) => {
        try {
            const year = ctx.match[1];
            ctx.session = ctx.session || {};
            ctx.session.reportYear = year;
            
            await ctx.editMessageText(
                `📊 *${ctx.session.reportClass} sinfi - ${year}-yil*\n\nQaysi oyni tanlaysiz?`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getMonthKeyboard(year)
                }
            );
        } catch (error) {
            console.error('Year selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.action(/^month_(\d+)_(\d{4})$/, async (ctx) => {
        try {
            const month = ctx.match[1];
            const year = ctx.match[2];
            const className = ctx.session?.reportClass;
            
            await generateMonthlyReport(ctx, className, year, month);
        } catch (error) {
            console.error('Month selection xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });
    
    bot.command('hisobot', async (ctx) => {
        await ctx.reply(
            '📊 Hisobotlarni ko\'rish uchun tugmani bosing:',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📊 Hisobotlarni ko\'rish', callback_data: 'reports' }]
                    ]
                }
            }
        );
    });
}

async function generateDailyReport(ctx, className) {
    try {
        const currentDate = getCurrentDate();
        const attendance = await getAttendanceByDate(currentDate, className);
        
        if (attendance.length === 0) {
            await ctx.editMessageText(
                `📅 *${className} sinfi - Kunlik Hisobot*\n\n` +
                `📅 Sana: ${formatDate(currentDate)}\n\n` +
                `❌ Bugun uchun davomat ma'lumotlari topilmadi.`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔙 Orqaga', callback_data: 'reports' }],
                            [{ text: '🏠 Asosiy menyu', callback_data: 'main_menu' }]
                        ]
                    }
                }
            );
            return;
        }
        
        const report = formatAttendanceReport(attendance, 'daily');
        
        await ctx.editMessageText(
            `📅 *${className} sinfi - Kunlik Hisobot*\n\n` +
            `📅 Sana: ${formatDate(currentDate)}\n\n` +
            report,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Orqaga', callback_data: 'reports' }],
                        [{ text: '🏠 Asosiy menyu', callback_data: 'main_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Daily report generation xatoligi:', error);
        await ctx.answerCbQuery('❌ Hisobot yaratishda xatolik');
    }
}

async function generateWeeklyReport(ctx, className) {
    try {
        const { startDate, endDate } = getWeekStartEnd();
        const report = await getWeeklyReport(startDate, endDate, className);
        
        if (report.length === 0) {
            await ctx.editMessageText(
                `📈 *${className} sinfi - Haftalik Hisobot*\n\n` +
                `📅 Davr: ${formatDate(startDate)} - ${formatDate(endDate)}\n\n` +
                `❌ Bu hafta uchun davomat ma'lumotlari topilmadi.`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔙 Orqaga', callback_data: 'reports' }],
                            [{ text: '🏠 Asosiy menyu', callback_data: 'main_menu' }]
                        ]
                    }
                }
            );
            return;
        }
        
        let reportText = `📈 *${className} sinfi - Haftalik Hisobot*\n\n`;
        reportText += `📅 Davr: ${formatDate(startDate)} - ${formatDate(endDate)}\n\n`;
        
        report.forEach((student, index) => {
            const percentage = student.total_hours > 0 ? 
                Math.round((student.present_count / student.total_hours) * 100) : 0;
            
            reportText += `${index + 1}. *${student.first_name} ${student.last_name}*\n`;
            reportText += `   ✅ Kelgan: ${student.present_count} soat\n`;
            reportText += `   ❌ Kelmagan: ${student.absent_count} soat\n`;
            reportText += `   📊 Davomat: ${percentage}%\n\n`;
        });
        
        await ctx.editMessageText(reportText, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Orqaga', callback_data: 'reports' }],
                    [{ text: '🏠 Asosiy menyu', callback_data: 'main_menu' }]
                ]
            }
        });
    } catch (error) {
        console.error('Weekly report generation xatoligi:', error);
        await ctx.answerCbQuery('❌ Hisobot yaratishda xatolik');
    }
}

async function generateMonthlyReport(ctx, className, year, month) {
    try {
        const report = await getMonthlyReport(year, month, className);
        
        const monthNames = [
            'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
        ];
        
        if (report.length === 0) {
            await ctx.editMessageText(
                `📊 *${className} sinfi - Oylik Hisobot*\n\n` +
                `📅 Davr: ${monthNames[parseInt(month) - 1]} ${year}\n\n` +
                `❌ Bu oy uchun davomat ma'lumotlari topilmadi.`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔙 Orqaga', callback_data: 'reports' }],
                            [{ text: '🏠 Asosiy menyu', callback_data: 'main_menu' }]
                        ]
                    }
                }
            );
            return;
        }
        
        let reportText = `📊 *${className} sinfi - Oylik Hisobot*\n\n`;
        reportText += `📅 Davr: ${monthNames[parseInt(month) - 1]} ${year}\n\n`;
        
        report.forEach((student, index) => {
            reportText += `${index + 1}. *${student.first_name} ${student.last_name}*\n`;
            reportText += `   ✅ Kelgan: ${student.present_count} soat\n`;
            reportText += `   ❌ Kelmagan: ${student.absent_count} soat\n`;
            reportText += `   📊 Davomat: ${student.attendance_percentage || 0}%\n\n`;
        });
        
        await ctx.editMessageText(reportText, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Orqaga', callback_data: 'reports' }],
                    [{ text: '🏠 Asosiy menyu', callback_data: 'main_menu' }]
                ]
            }
        });
    } catch (error) {
        console.error('Monthly report generation xatoligi:', error);
        await ctx.answerCbQuery('❌ Hisobot yaratishda xatolik');
    }
}

module.exports = { registerReportHandlers };
