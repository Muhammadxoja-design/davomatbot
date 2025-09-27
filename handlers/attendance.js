const { Markup } = require("telegraf");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");

const {
  getGradeLevels,
  getClassesByGrade,
  getStudentsByClass,
  getStudentById,
  markAttendance,
} = require("../database");
const {
  getGradeLevelKeyboard,
  getClassKeyboard,
  getStudentKeyboard,
  getAttendanceConfirmKeyboard,
  getHourSelectionKeyboard,
} = require("../keyboards/index");
const { formatDate, getCurrentDate } = require("../utils/helpers");

// classList.json faylining to'liq yo'li
const groupsPath = path.resolve(__dirname, "..", "classList.json");
let groups = {};
try {
  groups = JSON.parse(fs.readFileSync(groupsPath, "utf8"));
} catch (err) {
  console.warn(`classList.json o'qishda muammo: ${err.message}`);
}

function registerAttendanceHandlers(bot) {
  // Davomat olishni boshlash
  bot.action(["attendance", "start_attendance"], async (ctx) => {
    try {
      const gradeLevels = await getGradeLevels();

      if (!gradeLevels || gradeLevels.length === 0) {
        await ctx.editMessageText("❌ Hech qanday sinf topilmadi.");
        return;
      }

      await ctx.editMessageText(
        "📝 *Davomat Olish*\n\nQaysi sinf darajasini tanlaysiz?",
        {
          parse_mode: "Markdown",
          reply_markup: getGradeLevelKeyboard(gradeLevels),
        }
      );
    } catch (error) {
      console.error("Attendance start xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  // Sinf darajasini tanlash
  bot.action(/^grade_(\d+)$/, async (ctx) => {
  try {
    const gradeLevel = ctx.match[1]; // Masalan: "10"
    const classes = await getClassesByGrade(gradeLevel);

    if (!classes || classes.length === 0) {
      await ctx.answerCbQuery("❌ Bu darajada sinflar topilmadi");
      return;
    }

    // ❌ sizda faqat classes bor edi
    // ✅ gradeLevel ham yuboramiz
    const keyboard = getClassKeyboard(classes, gradeLevel);

    await ctx.editMessageText(
      `📚 <b>${gradeLevel}-sinf</b>\n\nQaysi bo'limni tanlaysiz?`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
  } catch (error) {
    console.error("Grade selection xatoligi:", error);
    await ctx.answerCbQuery("❌ Xatolik yuz berdi");
  }
});


  // Sinfni tanlash
  bot.action(/^class_(.+)$/, async (ctx) => {
    try {
      const className = ctx.match[1];
      const students = await getStudentsByClass(className);

      if (!students || students.length === 0) {
        await ctx.answerCbQuery("❌ Bu sinfda o'quvchilar topilmadi");
        return;
      }

      // Sessiyada tanlangan sinfni saqlash
      ctx.session = ctx.session || {};
      ctx.session.selectedClass = className;
      ctx.session.selectedStudents = [];

      await ctx.editMessageText(
        `👥 *${className} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
          `📊 Jami: ${students.length} o'quvchi\n` +
          `✅ Tanlangan: 0`,
        {
          parse_mode: "Markdown",
          reply_markup: getStudentKeyboard(students, []),
        }
      );
    } catch (error) {
      console.error("Class selection xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  // O'quvchini tanlash/bekor qilish
  bot.action(/^student_(\d+)$/, async (ctx) => {
    try {
      const studentId = parseInt(ctx.match[1], 10);
      ctx.session = ctx.session || {};
      ctx.session.selectedStudents = ctx.session.selectedStudents || [];

      const index = ctx.session.selectedStudents.indexOf(studentId);
      if (index === -1) {
        ctx.session.selectedStudents.push(studentId);
      } else {
        ctx.session.selectedStudents.splice(index, 1);
      }

      const students = await getStudentsByClass(ctx.session.selectedClass);
      const selectedCount = ctx.session.selectedStudents.length;

      await ctx.editMessageText(
        `👥 *${ctx.session.selectedClass} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
          `📊 Jami: ${students.length} o'quvchi\n` +
          `✅ Tanlangan: ${selectedCount}`,
        {
          parse_mode: "Markdown",
          reply_markup: getStudentKeyboard(
            students,
            ctx.session.selectedStudents
          ),
        }
      );

      await ctx.answerCbQuery(
        index === -1 ? "✅ Tanlandi" : "❌ Bekor qilindi"
      );
    } catch (error) {
      console.error("Student selection xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  // Barchasini tanlash
  bot.action("select_all_students", async (ctx) => {
    try {
      ctx.session = ctx.session || {};
      const students = await getStudentsByClass(ctx.session.selectedClass);
      ctx.session.selectedStudents = students.map((student) => student.id);

      await ctx.editMessageText(
        `👥 *${ctx.session.selectedClass} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
          `📊 Jami: ${students.length} o'quvchi\n` +
          `✅ Darsga Kitmaganlar: ${ctx.session.selectedStudents.length}`,
        {
          parse_mode: "Markdown",
          reply_markup: getStudentKeyboard(
            students,
            ctx.session.selectedStudents
          ),
        }
      );

      await ctx.answerCbQuery("✅ Barcha o'quvchilar tanlandi");
    } catch (error) {
      console.error("Select all students xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  // Barchasini bekor qilish
  bot.action("deselect_all_students", async (ctx) => {
    try {
      ctx.session = ctx.session || {};
      const students = await getStudentsByClass(ctx.session.selectedClass);
      ctx.session.selectedStudents = [];

      await ctx.editMessageText(
        `👥 *${ctx.session.selectedClass} sinfi*\n\nO'quvchilarni tanlang:\n\n` +
          `📊 Jami: ${students.length} o'quvchi\n` +
          `✅ Tanlangan: 0`,
        {
          parse_mode: "Markdown",
          reply_markup: getStudentKeyboard(
            students,
            ctx.session.selectedStudents
          ),
        }
      );

      await ctx.answerCbQuery("❌ Barcha tanlov bekor qilindi");
    } catch (error) {
      console.error("Deselect all students xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  // Davomatni tasdiqlash
  bot.action("confirm_attendance", async (ctx) => {
    try {
      ctx.session = ctx.session || {};

      await ctx.editMessageText(
        "⏰ *Soat tanlash*\n\nQaysi soat uchun davomat belgilaysiz?",
        {
          parse_mode: "Markdown",
          reply_markup: getHourSelectionKeyboard(),
        }
      );
    } catch (error) {
      console.error("Attendance confirmation xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  // Soatni tanlash
  bot.action(/^hour_(\d+)$/, async (ctx) => {
    try {
      const hour = parseInt(ctx.match[1], 10);
      ctx.session = ctx.session || {};
      ctx.session.selectedHour = hour;

      const selectedStudents = ctx.session.selectedStudents || [];
      const className = ctx.session.selectedClass;

      let studentNames = [];
      for (const studentId of selectedStudents) {
        const student = await getStudentById(studentId);
        if (student) {
          studentNames.push(`${student.first_name} ${student.last_name}`);
        }
      }

      const confirmMessage = `\n<b>📝 Davomat Tasdiqlash</b>\n\n🏫 Sinf: ${className}\n⏰ Soat: ${hour}\n📅 Sana: ${formatDate(
        getCurrentDate()
      )}\n\n👥 <b>Drsga Kirmagan o'quvchilar (${
        selectedStudents.length
      } ta):</b>\n${studentNames
        .map((name, index) => `${index + 1}. ${name}`)
        .join("\n")}\n\nTasdiqlaysizmi?\n`;

      await ctx.editMessageText(confirmMessage, {
        parse_mode: "HTML",
        reply_markup: getAttendanceConfirmKeyboard(),
      });
    } catch (error) {
      console.error("Hour selection xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  bot.action("hour_all", async (ctx) => {
    try {
      ctx.session = ctx.session || {};
      ctx.session.selectedHour = "Butun kun";

      const selectedStudents = ctx.session.selectedStudents || [];
      const className = ctx.session.selectedClass;

      let studentNames = [];
      for (const studentId of selectedStudents) {
        const student = await getStudentById(studentId);
        if (student) {
          studentNames.push(`${student.first_name} ${student.last_name}`);
        }
      }

      const confirmMessage = `\n<b>📝 Davomat Tasdiqlash</b>\n\n🏫 Sinf: ${className}\n⏰ Soat: Butun kun\n📅 Sana: ${formatDate(
        getCurrentDate()
      )}\n\n👥 <b>Darsga kirmagan o'quvchilar (${
        selectedStudents.length
      } ta):</b>\n${studentNames
        .map((name, index) => `${index + 1}. ${name}`)
        .join("\n")}\n\nTasdiqlaysizmi?\n`;

      await ctx.editMessageText(confirmMessage, {
        parse_mode: "HTML",
        reply_markup: getAttendanceConfirmKeyboard(),
      });
    } catch (error) {
      console.error("Hour_all selection xatoligi:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });
  // Davomatni saqlash
  bot.action("save_attendance", async (ctx) => {
    try {
      ctx.session = ctx.session || {};
      const selectedStudents = ctx.session.selectedStudents || [];
      const hour = ctx.session.selectedHour;
      const className = ctx.session.selectedClass;
      const currentDate = getCurrentDate();
      const userId = ctx.from.id;

      let savedCount = 0;

      for (const studentId of selectedStudents) {
        try {
          await markAttendance(studentId, currentDate, hour, "present", userId);
          savedCount++;
        } catch (error) {
          console.error(
            `Student ${studentId} uchun davomat saqlashda xatolik:`,
            error
          );
        }
      }

      await ctx.reply(`✅ Davomat saqlandi. Jami: ${savedCount} ta yozuv.`);

      // Izoh so'raymiz
      await ctx.reply("✍️ Davomat uchun izoh yozing (yoki /skip ni yuboring):");
      ctx.session.awaitingComment = true;
    } catch (error) {
      console.error("Save attendance xatoligi:", error);
      await ctx.answerCbQuery("❌ Davomatni saqlashda xatolik");
    }
  });

  async function sendToClassGroup(ctx, className, resultMessage) {
    try {
      if (groups && groups[className]) {
        if (ctx.session.photoPath) {
          await ctx.telegram.sendPhoto(
            groups[className],
            { source: ctx.session.photoPath },
            { caption: resultMessage, parse_mode: "HTML" }
          );
        } else {
          await ctx.telegram.sendMessage(groups[className], resultMessage, {
            parse_mode: "HTML",
          });
        }
      } else {
        console.warn(
          `⚠️ ${className} uchun chat_id topilmadi (classList.json ga qo'shilmagan).`
        );
        await ctx.reply(
          `⚠️ \"${className}\" sinfi uchun guruh belgilanmagan. Admin qo'shishi kerak.`
        );
      }
    } catch (error) {
      console.error(
        `❌ ${className} guruhiga xabar yuborishda xatolik:`,
        error
      );
      await ctx.reply("⚠️ Guruhga xabar yuborishda muammo yuz berdi.");
    }
  }

  async function sendFinalReport(ctx) {
    ctx.session = ctx.session || {};
    const className = ctx.session.selectedClass;
    const hour = ctx.session.selectedHour;
    const currentDate = getCurrentDate();
    const comment = ctx.session.comment || null;
    const selectedStudents = ctx.session.selectedStudents || [];

    let studentNames = [];
    for (const studentId of selectedStudents) {
      const student = await getStudentById(studentId);
      if (student) {
        studentNames.push(`${student.first_name} ${student.last_name}`);
      }
    }

    let resultMessage;
    if (selectedStudents.length === 0) {
      resultMessage = `\n✅ <b>Davomat saqlandi</b>\n\n🏫 Sinf: ${className}\n⏰ Soat: ${hour}\n📅 Sana: ${formatDate(
        currentDate
      )}\n${
        comment ? "📝 Izoh: " + comment : ""
      }\n\n👥 Barcha o'quvchilar darsda ishtirok etdi ✅\n\n<b>Davomat <a href="https://t.me/${
        ctx.from.username
      }">${ctx.from.first_name}</a> tomonidan olindi.</b>`;
    } else {
      resultMessage = `\n✅ <b>Davomat saqlandi</b>\n\n🏫 Sinf: ${className}\n⏰ Soat: ${hour}\n📅 Sana: ${formatDate(
        currentDate
      )}\n${
        comment ? "📝 Izoh: " + comment : ""
      }\n\n👥 <b>Darsga qatnashmagan o'quvchilar (${
        selectedStudents.length
      } ta):</b>\n${studentNames
        .map((n, i) => `${i + 1}. ${n}`)
        .join("\n")}\n\n<b>Davomat <a href="https://t.me/${
        ctx.from.username
      }">${
        ctx.from.first_name
      }</a> tomonidan olindi.</b>\n\n⚠️ Ushbu o'quvchilar faqat ${hour}-soat darsiga kelishmadi! ⚠️`;
    }

    // Har doim umumiy guruhga yuborish

    if (ctx.session.photoPath) {
      // Guruhga rasm yuboriladi
      await ctx.telegram.sendPhoto(
        groups["all"],
        { source: ctx.session.photoPath },
        { caption: resultMessage, parse_mode: "HTML" }
      );

      // Foydalanuvchiga rasm + tugma yuboriladi
await ctx.sendPhoto(
  { source: ctx.session.photoPath },
  {
    caption: resultMessage,
    parse_mode: "HTML"
    )
  }
);

    } else {
      // Guruhga xabar yuboriladi
      await ctx.telegram.sendMessage(groups["all"], resultMessage, {
        parse_mode: "HTML",
      });

      // Foydalanuvchiga xabar + tugma yuboriladi
      await ctx.sendMessage(ctx.from.id, resultMessage, {
        parse_mode: "HTML"
        ]),
      });
    }

    // Sinf guruhiga yuborish
    await sendToClassGroup(ctx, className, resultMessage);

    // Faylni o'chirish (ixtiyoriy)
    try {
      if (ctx.session.photoPath && fs.existsSync(ctx.session.photoPath)) {
        // fs.unlinkSync(ctx.session.photoPath);
      }
    } catch (e) {
      console.warn("Foto faylni o'chirishda muammo:", e.message);
    }

    ctx.session = {};
  }

  // Foydalanuvchi izoh yuborganda
  bot.on("text", async (ctx) => {
    ctx.session = ctx.session || {};
    if (ctx.session.awaitingComment) {
      ctx.session.comment =
        ctx.message.text === "/skip" ? null : ctx.message.text;
      ctx.session.awaitingComment = false;

      await ctx.reply("📸 Endi rasm yuboring majburiy!");
      ctx.session.awaitingPhoto = true;
      return;
    }
  });

  // Rasm yuborganda
  bot.on("photo", async (ctx) => {
    ctx.session = ctx.session || {};
    if (ctx.session.awaitingPhoto) {
      const photo = ctx.message.photo.pop();
      const fileId = photo.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);

      const imgDir = path.join(__dirname, "..", "img");
      if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

      const filePath = path.join(
        imgDir,
        `${ctx.session.selectedClass || "class"}_${Date.now()}.jpg`
      );

      const response = await fetch(fileLink.href);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));

      ctx.session.photoPath = filePath;
      ctx.session.awaitingPhoto = false;

      await sendFinalReport(ctx);
    }
  });

  // Agar foydalanuvchi rasm tashlamay o'tkazsa
  bot.command("skip", async (ctx) => {
    if (ctx.session?.student) {
      const { grade, className, student } = ctx.session;
      await sendFinalReport(ctx, grade, className, student, "Yo'q", null);
      ctx.session = {};
    }
  });

  // /davomat komandasi
  bot.command("davomat", async (ctx) => {
    await ctx.reply("📝 Davomat olishni boshlash uchun tugmani bosing:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📝 Davomat olishni boshlash",
              callback_data: "start_attendance",
            },
          ],
        ],
      },
    });
  });
}

module.exports = { registerAttendanceHandlers };
