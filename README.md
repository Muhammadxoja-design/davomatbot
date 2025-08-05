# Maktab Davomat Bot

Maktab uchun Telegram orqali davomat olish tizimi.

## Imkoniyatlar

- 📝 **Davomat olish**: Sinflar bo'yicha o'quvchilarni tanlash va davomat belgilash
- 📊 **Hisobotlar**: Kunlik, haftalik, oylik va yillik hisobotlar
- 🏫 **Sinf boshqaruvi**: Barcha sinflar va o'quvchilar avtomatik import qilinadi
- ⏰ **6 soatlik davomat**: Har kun uchun 6 soat davomat olish imkoniyati

## Fayl tuzilishi

```
bot/
├── index.js              # Asosiy bot fayli
├── config.js             # Konfiguratsiya
├── database.js           # Ma'lumotlar bazasi funksiyalari
├── package.json          # NPM paketlari
├── .env                  # Muhit o'zgaruvchilari
├── handlers/             # Bot handlerlar
│   ├── start.js         # Start va asosiy menyu
│   ├── attendance.js    # Davomat olish
│   └── reports.js       # Hisobotlar
├── keyboards/           # Inline klaviaturalar
│   └── index.js        # Barcha klaviaturalar
├── utils/              # Yordamchi funksiyalar
│   ├── helpers.js      # Umumiy yordamchilar
│   └── import-data.js  # Ma'lumot import qilish
└── data/               # SQL ma'lumotlar
    └── students.sql    # O'quvchilar ma'lumotlari

attendance.db              # SQLite ma'lumotlar bazasi
```

## Ishlatish

1. Botni Telegram'da toping
2. `/start` buyrug'ini yuboring
3. Menyudan kerakli amaliyotni tanlang:

### Davomat olish:
- "📝 Davomat olish" tugmasini bosing
- Sinf darajasini tanlang (1-sinf, 2-sinf, ...)
- Sinf bo'limini tanlang (A, B, C, ...)
- O'quvchilarni belgilang
- Soatni tanlang (1-6)
- Tasdiqlang

### Hisobotlar:
- "📊 Hisobotlar" tugmasini bosing
- Hisobot turini tanlang (kunlik, haftalik, oylik)
- Sinfni tanlang
- Natijalarni ko'ring

## Ma'lumotlar bazasi

Bot SQLite ma'lumotlar bazasidan foydalanadi:

- **students**: O'quvchilar va o'qituvchilar
- **attendance**: Davomat yozuvlari
- **classes**: Sinflar ma'lumotlari
- **bot_users**: Bot foydalanuvchilari

## Bot komandatlari

- `/start` - Botni ishga tushirish
- `/help` - Yordam
- `/davomat` - Davomat olish
- `/hisobot` - Hisobotlar

## Texnik ma'lumotlar

- **Node.js** >= 16.0.0
- **Telegraf** 4.16.3
- **SQLite3** 5.1.6
- **Ma'lumotlar bazasi**: SQLite

## Muallif

Maktab Davomat Bot - 2025