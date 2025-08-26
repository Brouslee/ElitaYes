const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * نظام المصادقة باستخدام الكوكيز
 * Cookie-based Authentication System
 */

class InstagramAuth {
    constructor() {
        this.cookiePath = path.join(__dirname, '../data/cookies.json');
        this.session = null;
        this.isAuthenticated = false;
    }

    /**
     * تهيئة نظام المصادقة
     * Initialize authentication system
     */
    async initialize() {
        try {
            logger.info('بدء تهيئة نظام المصادقة - Initializing authentication system...');

            // محاولة تحميل الكوكيز المحفوظة
            // Try to load saved cookies
            const cookies = await this.loadCookies();
            
            if (cookies) {
                // التحقق من صحة الكوكيز
                // Validate cookies
                const isValid = await this.validateCookies(cookies);
                
                if (isValid) {
                    this.session = {
                        cookies: cookies,
                        authenticated: true,
                        loginTime: new Date(),
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    };
                    this.isAuthenticated = true;
                    logger.info('تم تسجيل الدخول باستخدام الكوكيز المحفوظة - Authenticated using saved cookies');
                } else {
                    logger.warn('الكوكيز المحفوظة غير صحيحة - Saved cookies are invalid');
                    await this.clearCookies();
                }
            } else {
                logger.info('لا توجد كوكيز محفوظة - No saved cookies found');
            }

            return this.session;

        } catch (error) {
            logger.error('فشل في تهيئة نظام المصادقة - Failed to initialize authentication:', error);
            throw error;
        }
    }

    /**
     * تحميل الكوكيز من الملف
     * Load cookies from file
     */
    async loadCookies() {
        try {
            const cookieData = await fs.readFile(this.cookiePath, 'utf8');
            const cookies = JSON.parse(cookieData);
            
            logger.debug('تم تحميل الكوكيز بنجاح - Cookies loaded successfully');
            return cookies;

        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.debug('ملف الكوكيز غير موجود - Cookie file does not exist');
                return null;
            }
            logger.error('خطأ في تحميل الكوكيز - Error loading cookies:', error);
            return null;
        }
    }

    /**
     * حفظ الكوكيز في ملف
     * Save cookies to file
     */
    async saveCookies(cookies) {
        try {
            // إنشاء مجلد البيانات إذا لم يكن موجوداً
            // Create data directory if it doesn't exist
            const dataDir = path.dirname(this.cookiePath);
            await fs.mkdir(dataDir, { recursive: true });

            // حفظ الكوكيز مع معلومات إضافية
            // Save cookies with additional information
            const cookieData = {
                cookies: cookies,
                savedAt: new Date().toISOString(),
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                version: '1.0.0'
            };

            await fs.writeFile(this.cookiePath, JSON.stringify(cookieData, null, 2));
            logger.info('تم حفظ الكوكيز بنجاح - Cookies saved successfully');

        } catch (error) {
            logger.error('فشل في حفظ الكوكيز - Failed to save cookies:', error);
            throw error;
        }
    }

    /**
     * التحقق من صحة الكوكيز
     * Validate cookies
     */
    async validateCookies(cookieData) {
        try {
            // التحقق من وجود الكوكيز المطلوبة
            // Check for required cookies
            const requiredCookies = ['sessionid', 'csrftoken'];
            const cookies = cookieData.cookies || cookieData;

            if (!cookies || typeof cookies !== 'object') {
                return false;
            }

            // التحقق من وجود الكوكيز المطلوبة
            // Check if required cookies exist
            for (const required of requiredCookies) {
                if (!cookies[required]) {
                    logger.debug(`كوكي مطلوب مفقود - Missing required cookie: ${required}`);
                    return false;
                }
            }

            // التحقق من تاريخ انتهاء الصلاحية
            // Check expiration date
            const savedAt = new Date(cookieData.savedAt);
            const now = new Date();
            const hoursDiff = (now - savedAt) / (1000 * 60 * 60);

            if (hoursDiff > 24) { // انتهاء الصلاحية بعد 24 ساعة
                logger.debug('انتهت صلاحية الكوكيز - Cookies have expired');
                return false;
            }

            logger.debug('الكوكيز صحيحة - Cookies are valid');
            return true;

        } catch (error) {
            logger.error('خطأ في التحقق من الكوكيز - Error validating cookies:', error);
            return false;
        }
    }

    /**
     * تسجيل دخول جديد
     * New login (manual cookie input)
     */
    async login(cookies) {
        try {
            logger.info('محاولة تسجيل دخول جديد - Attempting new login...');

            // التحقق من صحة الكوكيز المرسلة
            // Validate provided cookies
            if (!this.validateCookieFormat(cookies)) {
                throw new Error('تنسيق الكوكيز غير صحيح - Invalid cookie format');
            }

            // حفظ الكوكيز
            // Save cookies
            await this.saveCookies(cookies);

            // إنشاء جلسة جديدة
            // Create new session
            this.session = {
                cookies: cookies,
                authenticated: true,
                loginTime: new Date(),
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };

            this.isAuthenticated = true;
            logger.info('تم تسجيل الدخول بنجاح - Login successful');

            return this.session;

        } catch (error) {
            logger.error('فشل في تسجيل الدخول - Login failed:', error);
            throw error;
        }
    }

    /**
     * التحقق من تنسيق الكوكيز
     * Validate cookie format
     */
    validateCookieFormat(cookies) {
        if (!cookies || typeof cookies !== 'object') {
            return false;
        }

        // التحقق من وجود الكوكيز الأساسية
        // Check for essential cookies
        const essentialCookies = ['sessionid', 'csrftoken'];
        
        for (const cookie of essentialCookies) {
            if (!cookies[cookie] || typeof cookies[cookie] !== 'string') {
                return false;
            }
        }

        return true;
    }

    /**
     * تسجيل خروج
     * Logout
     */
    async logout() {
        try {
            logger.info('تسجيل خروج - Logging out...');

            // مسح الكوكيز
            // Clear cookies
            await this.clearCookies();

            // إعادة تعيين الجلسة
            // Reset session
            this.session = null;
            this.isAuthenticated = false;

            logger.info('تم تسجيل الخروج بنجاح - Logout successful');

        } catch (error) {
            logger.error('خطأ في تسجيل الخروج - Error during logout:', error);
            throw error;
        }
    }

    /**
     * مسح الكوكيز
     * Clear cookies
     */
    async clearCookies() {
        try {
            await fs.unlink(this.cookiePath);
            logger.debug('تم مسح ملف الكوكيز - Cookie file deleted');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('خطأ في مسح الكوكيز - Error clearing cookies:', error);
            }
        }
    }

    /**
     * الحصول على الكوكيز الحالية
     * Get current cookies
     */
    getCurrentCookies() {
        return this.session ? this.session.cookies : null;
    }

    /**
     * التحقق من حالة المصادقة
     * Check authentication status
     */
    isLoggedIn() {
        return this.isAuthenticated && this.session !== null;
    }

    /**
     * الحصول على معلومات الجلسة
     * Get session information
     */
    getSessionInfo() {
        if (!this.session) {
            return null;
        }

        return {
            authenticated: this.session.authenticated,
            loginTime: this.session.loginTime,
            userAgent: this.session.userAgent,
            cookieCount: Object.keys(this.session.cookies).length
        };
    }

    /**
     * تنظيف الموارد
     * Cleanup resources
     */
    async cleanup() {
        try {
            logger.info('تنظيف موارد المصادقة - Cleaning up authentication resources...');
            
            // لا نحذف الكوكيز عند التنظيف للحفاظ على الجلسة
            // We don't delete cookies during cleanup to preserve session
            this.session = null;
            this.isAuthenticated = false;

        } catch (error) {
            logger.error('خطأ في تنظيف الموارد - Error during cleanup:', error);
        }
    }
}

module.exports = new InstagramAuth();
