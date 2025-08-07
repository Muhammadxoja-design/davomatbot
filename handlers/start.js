const { command } = require('..');
const { DB_PATH } = require('../config');
const { registerBotUser } = require('../database');
const { getMainMenuKeyboard } = require('../keyboards/index');
const fs = require('fs');
const path = require('path');
const jsonPath = path.join(__dirname, '../classList.json');
const CHANNEL_USERNAME = '@hayoti_tajribam'; 


function registerStartHandler(bot) {
    let data = {};

    bot.hears(/^\/class (.+)$/i, async (ctx) => {
        const className = ctx.match[1].trim(); // "1-A"
        const chatId = ctx.chat.id;

        const response = {
            class: className,
            requested_by: {
                id: ctx.from.id,
                username: ctx.from.username || null,
                full_name: ctx.from.first_name || null,
                is_admin: true,
                language_code: ctx.from.language_code || "uz"
            },
            chat: {
                id: ctx.chat.id,
                title: ctx.chat.title || ctx.chat.first_name || "Private",
                type: ctx.chat.type
            },
            command: "/class",
            message: ctx.message.text,
            time: ctx.message.date
        };
        

        // Avvalgi faylni o‘qish
        if (fs.existsSync(jsonPath)) {
            try {
                const raw = fs.readFileSync(jsonPath, 'utf-8');
                data = JSON.parse(raw);
            } catch (err) {
                console.error('❌ JSON o‘qishda xato:', err.message);
            }
        }

        // Ma'lumotni yangilash
        data[className] = chatId;

        // JSON faylga yozish
        try {
            fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
            await ctx.reply(
                '```json\n' + JSON.stringify(response, null, 2) + '\n```',
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            console.error('❌ JSON yozishda xato:', err.message);
            await ctx.reply('❌ Saqlashda xatolik yuz berdi.');
        }
    });


    // /start komandasi
    bot.start(async (ctx) => {
        try {
            const user = ctx.from;

            // Foydalanuvchini ro'yxatdan o'tkazish
            await registerBotUser(
                user.id,
                user.username || null,
                user.first_name || null,
                user.last_name || null
            );

            const welcomeMessage = `
🏫 <b>Maktab Davomat Tizimiga Xush Kelibsiz!</b>

Assalomu alaykum, <b>barcha o'quvchilar</b>!

Bu bot orqali siz quyidagi amallarni bajarishingiz mumkin:

📊 <b>Asosiy imkoniyatlar:</b>
   • Kunlik davomat olish
   • Haftalik hisobotlar
   • Oylik hisobotlar
   • Yillik statistika

🎯 <b>Qanday foydalanish:</b>
   1. <b>"📝 Davomat olish"</b> tugmasini bosing
   2. Sinfni tanlang
   3. O'quvchilarni belgilang
   4. Hisobotlarni ko'ring

Agar botda xatolik yoki botni yaxshilash haqidagi fikiringizni <a href="https://t.me/m_kimyonazarov">Muhammadxo'ja</a>ga yuboring!

U albatta javob beradi 

Davom etish uchun quyidagi tugmalardan birini tanlang:`;
            
            await ctx.replyWithHTML(welcomeMessage, {
                reply_markup: getMainMenuKeyboard()
            });

        } catch (error) {
            console.error('Start handler xatoligi:', error);
            await ctx.reply('❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
        }
    });

    // Asosiy menyu tugmalari
    bot.action('main_menu', async (ctx) => {
        try {
            await ctx.editMessageText(
                '🏫 *Asosiy Menyu*\n\nKerakli bo\'limni tanlang:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getMainMenuKeyboard()
                }
            );
        } catch (error) {
            console.error('Main menu xatoligi:', error);
            await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        }
    });

    // Yordam komandasi
    bot.command('help', async (ctx) => {
        const helpMessage = `
🤖 <b>Bot Komandatlari</b>

/start - Botni qayta ishga tushirish
/davomat - Davomat olish
/hisobot - Hisobotlarni ko'rish
/help - Yordam

📝 <b>Davomat olish:</b>
1. Sinf darajasini tanlang (1-sinf, 2-sinf...)
2. Sinf bo'limini tanlang (A, B, C...)
3. O'quvchilarni belgilang
4. Tasdiqlang
📊 <b>Hisobotlar:</b>

• Kunlik davomat
• Haftalik hisobot
• Oylik hisobot
• Yillik statistika

❓ Savollar bo'lsa <a href="https://t.me/m_kimyonazarov">Muhammadxo'ja</a> ga murojaat qiling.

<b>Asosiy Menyu</b>ga qaytish uchun /start ni bosing!
        `;

        await ctx.replyWithHTML(helpMessage);
    });

    // Yordam tugmasi
    bot.action('help', async (ctx) => {
        const helpMessage = `
🤖 <b>Bot Komandatlari</b>

/start - Botni qayta ishga tushirish
/davomat - Davomat olish
/hisobot - Hisobotlarni ko'rish
/help - Yordam

📝 <b>Davomat olish:</b>
1. Sinf darajasini tanlang (1-sinf, 2-sinf...)
2. Sinf bo'limini tanlang (A, B, C...)
3. O'quvchilarni belgilang
4. Tasdiqlang

📊 <b>Hisobotlar:</b>
• Kunlik davomat
• Haftalik hisobot
• Oylik hisobot
• Yillik statistika

❓ Savollar bo'lsa <a href="https://t.me/m_kimyonazarov">Muhammadxo'ja</a> ga murojaat qiling.

<b>Asosiy Menyu</b>ga qaytish uchun /start ni bosing!
`;

        await ctx.editMessageText(helpMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Orqaga', callback_data: 'main_menu' }]
                ]
            }
        });
    });

    // UpYear
    bot.command('upyear', async(ctx) => {
        const userid = ctx.msg.from.id;

        if (userid == "6813216374"){
            await ctx.replyWithHTML('Uzur Hali upyear comandasi ishlagani yoq!')
        } else {
            await ctx.replyWithHTML('Sizda <b>Adminlik</b> Xuquqi yoq! <br><br> Bosh sahifaga qaytish uchun /start  ni bosing')
        }
    });
}

module.exports = { registerStartHandler };
