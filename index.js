// تحميل النظام العام أولاً
require('./core/globals');

const Bot = require('./core/bot');
const config = require('./config/config');
const logger = require('./core/logger');
const security = require('./core/security');
const { initDatabase } = require('./database/init');
const UptimeServer = require('./core/uptime');
const configWatcher = require('./utils/configWatcher');
const { 
    displayStartupBanner, 
    displaySection, 
    displayBotInfo, 
    displayLoading, 
    displaySuccess, 
    displayError,
    displayWarning 
} = require('./utils/consoleDisplay');

/**
 * ELITA Instagram Bot Framework - Main Entry Point
 * Created by Mohammed Al-Akari
 * Warning: This bot is for educational purposes only. Ensure compliance with Instagram's Terms of Service
 */

class InstagramBotFramework {
    constructor() {
        this.bot = null;
        this.isRunning = false;
        this.uptimeServer = new UptimeServer();
        
        // تهيئة النظام العام
        this.initializeGlobalSystem();
    }

    initializeGlobalSystem() {
        // تحديث معلومات ELITA
        global.ELITA.config = config;
        global.ELITA.isRunning = false;
        
        // تهيئة الأدوات المساعدة
        global.utils.initialize();
        
        // بدء مراقبة ملفات الإعدادات
        configWatcher.initializeWatching();
        
        logger.info('SYSTEM', 'تم تهيئة النظام العام بنجاح');
    }

    async start() {
        try {
            // Display beautiful startup banner
            displayStartupBanner();
            
            // Display bot information
            displayBotInfo({
                name: config.bot.name,
                version: config.bot.version,
                author: config.bot.author
            });

            displayLoading('Initializing ELITA Bot Framework');
            
            // Security and IP validation disabled
            displayWarning('IP restrictions disabled - Bot running in open mode');

            // Initialize database
            displayLoading('Setting up database');
            await initDatabase();
            displaySuccess('Database initialized successfully');

            // Start uptime server
            displayLoading('Starting uptime server');
            await this.uptimeServer.start();
            displaySuccess('Uptime server started successfully');

            // Create and start bot
            displayLoading('Creating bot instance');
            this.bot = new Bot(config);
            await this.bot.initialize();
            
            this.isRunning = true;
            global.ELITA.isRunning = true;
            displaySuccess('ELITA Bot started successfully!');
            
            // معالجة إغلاق التطبيق بشكل آمن
            // Handle graceful shutdown
            this.setupShutdownHandlers();
            
        } catch (error) {
            displayError('Failed to start ELITA Bot: ' + error.message);
            logger.error('Error starting bot:', error);
            process.exit(1);
        }
    }

    setupShutdownHandlers() {
        const shutdown = async (signal) => {
            logger.info(`تم استلام إشارة ${signal} - إغلاق البوت...`);
            logger.info(`Received ${signal} signal - Shutting down bot...`);
            
            this.isRunning = false;
            global.ELITA.isRunning = false;
            
            // إيقاف خادم Uptime
            if (this.uptimeServer) {
                await this.uptimeServer.stop();
            }
            
            // إيقاف البوت
            if (this.bot) {
                await this.bot.shutdown();
            }
            
            // إيقاف مراقبة الملفات
            configWatcher.stopAll();
            
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
