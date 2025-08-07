const { Telegraf, session } = require('telegraf');
const config = require('./config');
const { initDatabase } = require('./database');
const { registerStartHandler } = require('./handlers/start');
const { registerAttendanceHandlers } = require('./handlers/attendance');
const { registerReportHandlers } = require('./handlers/reports');
const axios = require("axios");

const bot = new Telegraf(config.BOT_TOKEN);


bot.use(session());

bot.catch((err, ctx) => {
    console.error('Bot xatoligi:', err);
    ctx.reply('❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
});

async function initBot() {
    try {
        await initDatabase();
        console.log('✅ Ma\'lumotlar bazasi tayyor');
        
        registerStartHandler(bot);
        registerAttendanceHandlers(bot);
        registerReportHandlers(bot);
        
        if (config.USE_WEBHOOK) {
            bot.launch({
                webhook: {
                    domain: config.WEBHOOK_DOMAIN,
                    port: config.PORT || 3000,
                    hookPath: '/webhook'
                }
            });
        } else {
            bot.launch();
        }
        
        console.log('🤖 Bot ishga tushdi');
        
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        
    } catch (error) {
        console.error('Bot ishga tushishda xatolik:', error);
        process.exit(1);
    }
}

initBot();

module.exports = bot;
