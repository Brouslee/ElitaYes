const Bot = require('./core/bot');
const config = require('./config/config');
const logger = require('./core/logger');
const security = require('./core/security');
const { initDatabase } = require('./database/init');

/**
 * Instagram Bot Framework - Main Entry Point
 * تحذير: هذا البوت للأغراض التعليمية فقط. تأكد من الامتثال لشروط خدمة Instagram
 * Warning: This bot is for educational purposes only. Ensure compliance with Instagram's Terms of Service
 */

class InstagramBotFramework {
    constructor() {
        this.bot = null;
        this.isRunning = false;
    }

    async start() {
        try {
            // تم إلغاء التحقق من الأمان والIP
            // Security and IP validation disabled
            logger.info('تم تشغيل البوت بدون قيود IP - Bot running without IP restrictions');

            logger.info('بدء تشغيل Instagram Bot Framework...');
            logger.info('Starting Instagram Bot Framework...');

            // تهيئة قاعدة البيانات
            // Initialize database
            await initDatabase();
            logger.info('تم تهيئة قاعدة البيانات بنجاح - Database initialized successfully');

            // إنشاء وتشغيل البوت
            // Create and start bot
            this.bot = new Bot(config);
            await this.bot.initialize();
            
            this.isRunning = true;
            logger.info('تم تشغيل البوت بنجاح! - Bot started successfully!');
            
            // معالجة إغلاق التطبيق بشكل آمن
            // Handle graceful shutdown
            this.setupShutdownHandlers();
            
        } catch (error) {
            logger.error('خطأ في تشغيل البوت - Error starting bot:', error);
            process.exit(1);
        }
    }

    setupShutdownHandlers() {
        const shutdown = async (signal) => {
            logger.info(`تم استلام إشارة ${signal} - إغلاق البوت...`);
            logger.info(`Received ${signal} signal - Shutting down bot...`);
            
            if (this.bot) {
                await this.bot.shutdown();
            }
            
            this.isRunning = false;
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            logger.error('خطأ غير معالج - Uncaught exception:', error);
            shutdown('EXCEPTION');
        });
    }
}

// تشغيل البوت
// Start the bot
const framework = new InstagramBotFramework();
framework.start().catch(error => {
    console.error('فشل في تشغيل البوت - Failed to start bot:', error);
    process.exit(1);
});

module.exports = InstagramBotFramework;
