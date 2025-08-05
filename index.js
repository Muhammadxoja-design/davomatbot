const { Telegraf, session } = require('telegraf');
const config = require('./config');
const { initDatabase } = require('./database');
const { registerStartHandler } = require('./handlers/start');
const { registerAttendanceHandlers } = require('./handlers/attendance');
const { registerReportHandlers } = require('./handlers/reports');

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
        
        // Handlerlarni ro'yxatdan o'tkazish
        registerStartHandler(bot);
        registerAttendanceHandlers(bot);
        registerReportHandlers(bot);
        
        // Botni ishga tushirish
        if (config.USE_WEBHOOK) {
            // Webhook rejimi
            bot.launch({
                webhook: {
                    domain: config.WEBHOOK_DOMAIN,
                    port: config.PORT || 8000,
                    hookPath: '/webhook'
                }
            });
        } else {
            bot.launch();
        }
        
        console.log('🤖 Bot ishga tushdi');
        
        // Graceful shutdown
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        
    } catch (error) {
        console.error('Bot ishga tushishda xatolik:', error);
        process.exit(1);
    }
}

// Botni ishga tushirish
initBot();

setInterval(() => {
  axios.get("https://bot-2g3q.onrender.com")
    .then(() => console.log("🔄 Self-ping OK"))
    .catch((err) => console.error("❌ Self-ping error:", err.message));
}, 60 * 1000);

module.exports = bot;
