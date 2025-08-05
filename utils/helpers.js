function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Tashkent'
    };
    
    return date.toLocaleDateString('uz-UZ', options);
}

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function getWeekStartEnd() {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
        startDate: formatDateForDB(startOfWeek),
        endDate: formatDateForDB(endOfWeek)
    };
}

function getMonthStartEnd(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return {
        startDate: formatDateForDB(startDate),
        endDate: formatDateForDB(endDate)
    };
}

function formatDateForDB(date) {
    if (typeof date === 'string') {
        return date;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function formatAttendanceReport(attendance, type = 'daily') {
    if (!attendance || attendance.length === 0) {
        return '❌ Ma\'lumotlar topilmadi.';
    }
    
    let report = '';
    
    if (type === 'daily') {
        const groupedByHour = {};
        attendance.forEach(record => {
            if (!groupedByHour[record.hour]) {
                groupedByHour[record.hour] = [];
            }
            groupedByHour[record.hour].push(record);
        });
        
        for (let hour = 1; hour <= 6; hour++) {
            const hourData = groupedByHour[hour] || [];
            report += `⏰ *${hour}-soat:*\n`;
            
            if (hourData.length === 0) {
                report += '   ❌ Ma\'lumot yo\'q\n\n';
                continue;
            }
            
            const presentCount = hourData.filter(r => r.status === 'present').length;
            const absentCount = hourData.filter(r => r.status === 'absent').length;
            
            report += `   ✅ Kelgan: ${presentCount} ta\n`;
            report += `   ❌ Kelmagan: ${absentCount} ta\n`;
            report += `   📊 Jami: ${hourData.length} ta\n\n`;
        }
    }
    
    return report;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatError(error) {
    if (error.message) {
        return error.message;
    }
    return 'Noma\'lum xatolik yuz berdi';
}

function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}

async function sendLongMessage(ctx, text, options = {}) {
    const maxLength = 4096; 
    
    if (text.length <= maxLength) {
        return await ctx.reply(text, options);
    }
    
    const chunks = [];
    let currentChunk = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
        if ((currentChunk + line + '\n').length <= maxLength) {
            currentChunk += line + '\n';
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = line + '\n';
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    for (let i = 0; i < chunks.length; i++) {
        const chunkOptions = i === chunks.length - 1 ? options : {};
        await ctx.reply(chunks[i], chunkOptions);
        
        if (i < chunks.length - 1) {
            await sleep(100);
        }
    }
}

module.exports = {
    formatDate,
    getCurrentDate,
    getWeekStartEnd,
    getMonthStartEnd,
    formatDateForDB,
    formatAttendanceReport,
    sleep,
    formatError,
    truncateText,
    sendLongMessage
};
