# واجهة برمجة التطبيقات - API Documentation

## نظرة عامة - Overview

هذا الدليل يوضح واجهات برمجة التطبيقات المتاحة في إطار عمل بوت Instagram.

This guide explains the available APIs in the Instagram Bot Framework.

## 🤖 Bot Core API

### البوت الأساسي - Core Bot

```javascript
// تهيئة البوت - Initialize bot
const bot = new InstagramBot(config);
await bot.initialize();

// إرسال رسالة - Send message
await bot.sendMessage(userId, message, options);

// الحصول على معلومات المستخدم - Get user info
const userInfo = await bot.getUserInfo(userId);

// إعادة تحميل الأوامر - Reload commands
await bot.reloadCommands();

// إيقاف البوت - Shutdown bot
await bot.shutdown();
