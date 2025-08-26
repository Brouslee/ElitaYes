const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const auth = require('./auth');
const CommandHandler = require('../handlers/commandHandler');
const EventHandler = require('../handlers/eventHandler');
const { languageManager, getText } = require('../utils/language');

/**
 * نواة البوت الرئيسية
 * Main Bot Core Class
 */

class InstagramBot extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.isInitialized = false;
        this.isRunning = false;
        this.session = null;
        this.commandHandler = null;
        this.eventHandler = null;
        this.rateLimiter = new Map();
    }

    /**
     * تهيئة البوت
     * Initialize bot
     */
    async initialize() {
        try {
            logger.info('بدء تهيئة البوت - Starting bot initialization...');

            // تهيئة المجلدات المطلوبة
            // Initialize required directories
            await this.createDirectories();

            // تهيئة نظام اللغات
            // Initialize language system
            languageManager.reloadLanguages();

            // تهيئة المعالجات
            // Initialize handlers
            this.commandHandler = new CommandHandler(this);
            this.eventHandler = new EventHandler(this);

            // تحميل الأوامر والأحداث
            // Load commands and events
            await this.commandHandler.loadCommands();
            await this.eventHandler.loadEvents();

            // تهيئة المصادقة
            // Initialize authentication
            await this.initializeAuth();

            // إعداد المستمعين للأحداث
            // Setup event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            logger.info('تم تهيئة البوت بنجاح - Bot initialized successfully');

            // إطلاق حدث التهيئة
            // Emit ready event
            this.emit('ready');

        } catch (error) {
            logger.error('فشل في تهيئة البوت - Failed to initialize bot:', error);
            throw error;
        }
    }

    /**
     * إنشاء المجلدات المطلوبة
     * Create required directories
     */
    async createDirectories() {
        const directories = [
            this.config.paths.scripts,
            this.config.paths.commands,
            this.config.paths.events,
            this.config.paths.languages,
            this.config.paths.backups,
            this.config.paths.data,
            this.config.paths.logs,
            this.config.paths.temp
        ];

        for (const dir of directories) {
            try {
                await fs.ensureDir(dir);
                logger.debug(`تم إنشاء المجلد - Directory created: ${dir}`);
            } catch (error) {
                logger.error(`خطأ في إنشاء المجلد - Error creating directory ${dir}:`, error);
            }
        }
    }

    /**
     * تهيئة المصادقة
     * Initialize authentication
     */
    async initializeAuth() {
        try {
            this.session = await auth.initialize();
            logger.info('تم تهيئة المصادقة بنجاح - Authentication initialized successfully');
        } catch (error) {
            logger.error('فشل في تهيئة المصادقة - Failed to initialize authentication:', error);
            throw error;
        }
    }

    /**
     * إعداد مستمعي الأحداث
     * Setup event listeners
     */
    setupEventListeners() {
        // حدث الاستعداد
        // Ready event
        this.on('ready', () => {
            logger.info('البوت جاهز للعمل - Bot is ready to work!');
            this.isRunning = true;
        });

        // حدث الرسائل الواردة
        // Incoming message event
        this.on('message', async (messageData) => {
            try {
                await this.handleMessage(messageData);
            } catch (error) {
                logger.error('خطأ في معالجة الرسالة - Error handling message:', error);
            }
        });

        // حدث الأخطاء
        // Error event
        this.on('error', (error) => {
            logger.error('خطأ في البوت - Bot error:', error);
        });
    }

    /**
     * معالجة الرسائل الواردة
     * Handle incoming messages
     */
    async handleMessage(messageData) {
        try {
            // التحقق من تحديد المعدل
            // Check rate limiting
            if (!this.checkRateLimit(messageData.userId)) {
                logger.warn(`تم رفض الرسالة بسبب تحديد المعدل - Message rejected due to rate limiting: ${messageData.userId}`);
                return;
            }

            // التحقق من وجود بادئة الأوامر
            // Check for command prefix
            if (messageData.text.startsWith(this.config.bot.prefix)) {
                await this.commandHandler.handleCommand(messageData);
            } else {
                // إطلاق حدث الرسالة العادية
                // Emit regular message event
                this.eventHandler.handleEvent('message', messageData);
            }

        } catch (error) {
            logger.error('خطأ في معالجة الرسالة - Error in message handling:', error);
        }
    }

    /**
     * التحقق من تحديد المعدل
     * Check rate limiting
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const userLimit = this.rateLimiter.get(userId) || { count: 0, resetTime: now + this.config.security.rateLimitWindow };

        if (now > userLimit.resetTime) {
            // إعادة تعيين العداد
            // Reset counter
            this.rateLimiter.set(userId, { count: 1, resetTime: now + this.config.security.rateLimitWindow });
            return true;
        }

        if (userLimit.count >= this.config.security.rateLimitMax) {
            return false;
        }

        userLimit.count++;
        this.rateLimiter.set(userId, userLimit);
        return true;
    }

    /**
     * إرسال رسالة
     * Send message
     */
    async sendMessage(userId, message, options = {}) {
        try {
            if (!this.session) {
                throw new Error('لم يتم تهيئة الجلسة - Session not initialized');
            }

            // هنا يتم تنفيذ إرسال الرسالة الفعلي
            // Here the actual message sending implementation would go
            logger.info(`إرسال رسالة إلى ${userId}: ${message}`);
            logger.info(`Sending message to ${userId}: ${message}`);

            // محاكاة إرسال الرسالة (يجب استبدالها بالتنفيذ الفعلي)
            // Simulate message sending (should be replaced with actual implementation)
            return {
                success: true,
                messageId: Date.now().toString(),
                timestamp: new Date()
            };

        } catch (error) {
            logger.error('فشل في إرسال الرسالة - Failed to send message:', error);
            throw error;
        }
    }

    /**
     * الحصول على معلومات المستخدم
     * Get user information
     */
    async getUserInfo(userId) {
        try {
            // هنا يتم جلب معلومات المستخدم من Instagram
            // Here user information would be fetched from Instagram
            logger.debug(`جلب معلومات المستخدم - Fetching user info: ${userId}`);

            // محاكاة جلب المعلومات (يجب استبدالها بالتنفيذ الفعلي)
            // Simulate fetching info (should be replaced with actual implementation)
            return {
                id: userId,
                username: 'example_user',
                fullName: 'Example User',
                isPrivate: false,
                followerCount: 0,
                followingCount: 0
            };

        } catch (error) {
            logger.error('فشل في جلب معلومات المستخدم - Failed to get user info:', error);
            throw error;
        }
    }

    /**
     * إعادة تحميل الأوامر
     * Reload commands
     */
    async reloadCommands() {
        try {
            await this.commandHandler.loadCommands();
            logger.info('تم إعادة تحميل الأوامر بنجاح - Commands reloaded successfully');
        } catch (error) {
            logger.error('فشل في إعادة تحميل الأوامر - Failed to reload commands:', error);
            throw error;
        }
    }

    /**
     * إعادة تحميل الأحداث
     * Reload events
     */
    async reloadEvents() {
        try {
            await this.eventHandler.loadEvents();
            logger.info('تم إعادة تحميل الأحداث بنجاح - Events reloaded successfully');
        } catch (error) {
            logger.error('فشل في إعادة تحميل الأحداث - Failed to reload events:', error);
            throw error;
        }
    }

    /**
     * إيقاف البوت
     * Shutdown bot
     */
    async shutdown() {
        try {
            logger.info('بدء إيقاف البوت - Starting bot shutdown...');
            
            this.isRunning = false;

            // إيقاف المعالجات
            // Stop handlers
            if (this.commandHandler) {
                await this.commandHandler.shutdown();
            }
            if (this.eventHandler) {
                await this.eventHandler.shutdown();
            }

            // إغلاق الجلسة
            // Close session
            if (this.session) {
                await auth.cleanup();
            }

            logger.info('تم إيقاف البوت بنجاح - Bot shutdown completed');

        } catch (error) {
            logger.error('خطأ في إيقاف البوت - Error during bot shutdown:', error);
            throw error;
        }
    }

    /**
     * الحصول على حالة البوت
     * Get bot status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            hasSession: !!this.session,
            commandsLoaded: this.commandHandler ? this.commandHandler.getCommandCount() : 0,
            eventsLoaded: this.eventHandler ? this.eventHandler.getEventCount() : 0,
            uptime: this.isRunning ? Date.now() - this.startTime : 0
        };
    }
}

module.exports = InstagramBot;
