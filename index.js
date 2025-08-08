const { Telegraf, session } = require('telegraf');
const config = require('./config');
const { initDatabase } = require('./database');
const { registerStartHandler } = require('./handlers/start');
const { registerAttendanceHandlers } = require('./handlers/attendance');
const { registerReportHandlers } = require('./handlers/reports');
const axios = require("axios");
const express = require('express');
const app = express();

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

app.get('/', (req, res) => res.send(`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100vw;
            height: 100vh;
            background-color: #252525;
            color: #fff;
        }
    </style>
</head>
<body>
    <h1>Assalomu alaykum</h1>
</body>
</html>
    `));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server ${PORT}-portda ishlayapti`);
});

initBot();

module.exports = bot;
