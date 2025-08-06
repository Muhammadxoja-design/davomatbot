const { registerBotUser } = require("../database");
const { getMainMenuKeyboard } = require("../keyboards/index");
const path = require("path");
const fs = require("fs");
const filePath = path.join(__dirname, "..", "classes.json");

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    try {
      const user = ctx.from;

      await registerBotUser(
        user.id,
        user.username || null,
        user.first_name || null,
        user.last_name || null
      );

      const welcomeMessage =
        "🏫 <b>Maktab Davomat Tizimiga Xush Kelibsiz!</b>\n\n" +
        "Assalomu alaykum, <b>" +
        (user.first_name || "Foydalanuvchi") +
        "</b>!\n\n" +
        "📊 <b>Asosiy imkoniyatlar:</b>\n" +
        "• Kunlik davomat olish\n" +
        "• Haftalik hisobotlar\n" +
        "• Oylik hisobotlar\n" +
        "• Yillik statistika\n\n" +
        "🎯 <b>Qanday foydalanish:</b>\n" +
        "1. <b>📝 Davomat olish</b> tugmasini bosing\n" +
        "2. Sinfni tanlang\n" +
        "3. O'quvchilarni belgilang\n" +
        "4. Hisobotlarni ko'ring\n\n" +
        'Botni yaxshilash uchun <a href="https://t.me/m_kimyonazarov">@m_kimyonazarov</a> ga yozing.\n\n' +
        "Davom etish uchun quyidagi tugmalardan birini tanlang:";

      await ctx.reply(welcomeMessage, {
        parse_mode: "HTML",
        reply_markup: getMainMenuKeyboard(),
      });
    } catch (error) {
      console.error("Start handler xatoligi:", error);
      await ctx.reply("❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    }
  });

  bot.action("main_menu", async (ctx) => {
    try {
      await ctx.editMessageText(
        "🏫 <b>Asosiy Menyu</b>\n\nKerakli bo'limni tanlang:",
        {
          parse_mode: "HTML",
          reply_markup: getMainMenuKeyboard(),
        }
      );
    } catch (error) {
      console.error("Main menu xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  bot.command("help", async (ctx) => {
    const helpMessage = `
🤖 <b>Bot Komandatlari</b>

/start - Botni qayta ishga tushirish<br>
/davomat - Davomat olish<br>
/hisobot - Hisobotlarni ko'rish<br>
/help - Yordam

📝 <b>Davomat olish:</b><br>
1. Sinf darajasini tanlang (1-sinf, 2-sinf...)<br>
2. Sinf bo'limini tanlang (A, B, C...)<br>
3. O'quvchilarni belgilang<br>
4. Tasdiqlang

📊 <b>Hisobotlar:</b><br>
• Kunlik davomat<br>
• Haftalik hisobot<br>
• Oylik hisobot<br>
• Yillik statistika

❓ Savollar bo'lsa <a href="https://t.me/m_kimyonazarov">Muhammadxo'ja</a> ga murojaat qiling.
        `;

    await ctx.reply(helpMessage, { parse_mode: "HTML" });
  });

  bot.action("help", async (ctx) => {
    const helpMessage = `
🤖 <b>Bot Komandatlari</b>

/start - Botni qayta ishga tushirish<br>
/davomat - Davomat olish<br>
/hisobot - Hisobotlarni ko'rish<br>
/help - Yordam

📝 <b>Davomat olish:</b><br>
1. Sinf darajasini tanlang (1-sinf, 2-sinf...)<br>
2. Sinf bo'limini tanlang (A, B, C...)<br>
3. O'quvchilarni belgilang<br>
4. Tasdiqlang

📊 <b>Hisobotlar:</b><br>
• Kunlik davomat<br>
• Haftalik hisobot<br>
• Oylik hisobot<br>
• Yillik statistika

❓ Savollar bo'lsa <a href="https://t.me/m_kimyonazarov">@m_kimyonazarov</a> ga murojaat qiling.
        `;

    await ctx.editMessageText(helpMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 Orqaga", callback_data: "main_menu" }]],
      },
    });
  });
  bot.command("class", async (ctx) => {
    const input = ctx.message.text.split(" ");
    if (input.length < 2) {
      return ctx.reply("Iltimos, klass nomini yozing. Masalan: /class 8-A");
    }

    const className = input[1];
    const chatId = ctx.chat.id;

    let data = {};
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (err) {
        console.error("JSON o‘qishda xato:", err);
        return ctx.reply("❌ Xatolik yuz berdi.");
      }
    }
      const jsonFormatted = `\`\`\`json
{
  "ok": true,
  "result": {
    "chat_id": ${ctx.chat.id},
    "is_admin": true,
    "first_name": "${ctx.from.first_name}",
    "username": "${ctx.from.username}",
    "class": "${className}"
  },
  "message": {
    "command": "/class",
    "text": "${ctx.message.text}"
  }
  "error": null
}
\`\`\``;

    data[className] = chatId;

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      ctx.reply(jsonFormatted, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Yozishda xato:", err);
      ctx.reply("Yozishda xatolik yuz berdi.");
    }
  });
}

module.exports = { registerStartHandler };
