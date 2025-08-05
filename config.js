require('dotenv').config();

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    
    DB_PATH: process.env.DB_PATH || './attendance.db',
    
    PORT: process.env.PORT || 8000,
    USE_WEBHOOK: process.env.USE_WEBHOOK === 'true',
    WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN,
    
    DAILY_HOURS: 6,
    
    TIMEZONE: 'Asia/Tashkent',
    
    ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id)) : []
};
