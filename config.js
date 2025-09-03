require('dotenv').config();

module.exports = {
    // Telegram bot tokeni
    BOT_TOKEN: process.env.BOT_TOCEN,
    
    // Ma'lumotlar bazasi
    DB_PATH: process.env.DB_PATH || './attendance.db',
    SDB_PATH: process.env.SDB_PATH || './chiqib_ketgan.db',
    
    // Server sozlamalari
    PORT: process.env.PORT || 8000,
    USE_WEBHOOK: process.env.USE_WEBHOOK === 'true',
    WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN,
    
    // Davomat sozlamalari
    DAILY_HOURS: 6,
    
    // Vaqt zonasi
    TIMEZONE: 'Asia/Tashkent',
    
    // Admin
    ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id)) : [],
    
    // Foydalanuvchilar
    USERS: process.env.USERS ? process.env.USERS.split(',').map(id =>  parseInt(id)) : []
};
