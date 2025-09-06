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
<<<<<<< HEAD
    <title>Document</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body data-theme="dark" class="bg-gray-900 text-white">
    <div class="w-screen h-screen flex items-center justify-center">
        <h1 class="text-3xl font-bold shadow-2xl">Assalomu Alaykum, Va Rohmatullohu Va Barakatuh</h1>
    </div>
=======
    <title>Hello World</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex flex-col items-center justify-center w-screen h-screen bg-gray-900 text-white">

    <h1 class="text-4xl md:text-6xl font-bold text-center text-white drop-shadow-lg">
        Assalomu alaykum
    </h1>

>>>>>>> 47654231a40d87251c04e2576520e6bea9eff611
</body>
</html>
    `));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server ${PORT}-portda ishlayapti`);
});

initBot();

module.exports = bot;
