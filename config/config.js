const path = require('path');


const { NODE_ENV } = process.env;

module.exports = {
    // إعدادات البوت الأساسية
    // Basic bot settings
    bot: {
        name: 'ELITA 「⚡」',
        version: '2.0.0',
        prefix: '', // بادئة الأوامر - Command prefix
        timeout: 30000, // مهلة زمنية بالميلي ثانية - Timeout in milliseconds
        author: 'Mohammed Al-Akari',
        authorEmail: 'mohammed.alakari@example.com'
    },

    // إعدادات قاعدة البيانات
    // Database settings
    database: {
        type: 'sqlite', // sqlite, mongodb, json
        path: path.join(__dirname, '../data/bot.db'),
        autoSyncWhenStart: false,
        autoRefreshUserInfoFirstTime: true,
        options: {
            verbose: NODE_ENV === 'development'
        }
    },

    // إعدادات Instagram
    // Instagram settings
    instagram: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        requestDelay: 2000, // تأخير بين الطلبات - Delay between requests
        maxRetries: 3, // عدد المحاولات - Maximum retries
        cookiePath: path.join(__dirname, '../data/cookies.json'),
        intervalGetNewCookie: 1440, // minutes
        antiInbox: false
    },

    // إعدادات الأمان
    // Security settings
    security: {
        enableIPRestriction: false, // تم إلغاء تقييد IP - IP restriction disabled
        rateLimitWindow: 60000, // نافذة تحديد المعدل - Rate limit window
        rateLimitMax: 100 // عدد الطلبات المسموح - Max requests allowed
    },

    // إعدادات السجلات
    // Logging settings
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: path.join(__dirname, '../logs/bot.log'),
        maxSize: '10m',
        maxFiles: 5,
        enableColors: true
    },

    // إعدادات لوحة التحكم - Dashboard settings
    dashboard: {
        enable: true,
        port: 3001,
        expireVerifyCode: 300000,
        theme: 'dark'
    },

    // إعدادات إعادة التشغيل التلقائي
    // Auto restart settings
    autoRestart: {
        enable: false,
        time: null, // يمكن تعيين وقت معين أو cron pattern
        notes: "you can set time as interval with milliseconds or cron time, example: 86400000 (24h), 0 0 * * * (daily at midnight)"
    },

    // إعدادات النسخ الاحتياطي
    // Backup settings
    backup: {
        enable: true,
        interval: 3600000, // ساعة واحدة - 1 hour
        maxBackups: 10,
        includeDatabase: true,
        includeLogs: false,
        includeConfig: true
    },

    // إعدادات التحديث التلقائي
    // Auto update settings
    autoUpdate: {
        enable: false,
        checkInterval: 86400000, // يوم واحد - 1 day
        autoDownload: false,
        source: "https://api.github.com/repos/instagram-bot/framework/releases/latest"
    },

    // إعدادات تحميل السكريبتات التلقائي
    // Auto load scripts settings
    autoLoadScripts: {
        enable: true,
        ignoreCmds: "",
        ignoreEvents: "",
        watchInterval: 1000,
        notes: "automatically reload scripts when changed"
    },

    // إعدادات اللغة
    // Language settings
    language: "ar", // ar (Arabic), en (English)
    supportedLanguages: ["ar", "en"],
    
    // إعدادات المطورين والأدمن
    // Admin and developer settings
    adminBot: [67852152150], // معرفات المطورين - Developer IDs
    GOD: [67852152150], // معرفات المطورين الأساسيين - Main developer IDs
    DEV: [67852152150], // معرفات المطورين المساعدين - Assistant developer IDs

    // إعدادات الوضع الأبيض
    // Whitelist mode settings
    whiteListMode: {
        enable: false,
        whiteListIds: [],
        notes: "if enabled, only whitelisted users can use the bot"
    },

    // مجلدات النظام
    // System directories
    paths: {
        scripts: path.join(__dirname, '../scripts'),
        commands: path.join(__dirname, '../scripts/cmds'),
        events: path.join(__dirname, '../scripts/events'),
        languages: path.join(__dirname, '../languages'),
        backups: path.join(__dirname, '../backups'),
        dashboard: path.join(__dirname, '../dashboard'),
        data: path.join(__dirname, '../data'),
        logs: path.join(__dirname, '../logs'),
        temp: path.join(__dirname, '../temp')
    },

    // إعدادات المطورين
    // Developer settings
    dev: {
        enableDebug: NODE_ENV === 'development',
        reloadCommands: true, // إعادة تحميل الأوامر تلقائياً - Auto reload commands
        verboseLogging: false,
        testMode: false
    },

    // إعدادات المنطقة الزمنية
    timeZone: "Tripoli/Africa",

    // إخفاء رسائل التنبيهات
    // Hide notification messages
    hideNotiMessage: {
        commandNotFound: false,
        adminOnly: false,
        userBanned: false,
        rateLimited: false
    },

    // تسجيل الأحداث
    // Event logging
    logEvents: {
        disableAll: false,
        message: true,
        follow: true,
        unfollow: true,
        like: true,
        comment: true,
        dm: true
    }
};