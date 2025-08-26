const os = require('os');
const logger = require('./logger');
const config = require('../config/config');

/**
 * نظام الأمان وتقييد الوصول
 * Security System and Access Control
 */

class SecurityManager {
    constructor() {
        this.allowedIPs = config.security.allowedIPs || [];
        this.accessAttempts = new Map();
        this.blockedIPs = new Set();
        this.maxFailedAttempts = 5;
        this.blockDuration = 3600000; // ساعة واحدة بالميلي ثانية - 1 hour in milliseconds
    }

    /**
     * التحقق من الوصول المسموح
     * Validate allowed access
     */
    validateAccess() {
        try {
            if (!config.security.enableIPRestriction) {
                logger.info('تقييد IP معطل - IP restriction is disabled');
                return true;
            }

            const currentIP = this.getCurrentIP();
            logger.info(`التحقق من IP الحالي - Checking current IP: ${currentIP}`);

            // التحقق من قائمة الحظر
            // Check blocked list
            if (this.isBlocked(currentIP)) {
                logger.error(`IP محظور - IP is blocked: ${currentIP}`);
                return false;
            }

            // التحقق من القائمة المسموحة
            // Check allowed list
            if (this.isAllowed(currentIP)) {
                logger.info(`IP مسموح - IP is allowed: ${currentIP}`);
                return true;
            }

            // تسجيل محاولة وصول غير مصرح بها
            // Log unauthorized access attempt
            this.logFailedAttempt(currentIP);
            logger.warn(`محاولة وصول غير مصرح بها من - Unauthorized access attempt from: ${currentIP}`);
            
            return false;

        } catch (error) {
            logger.error('خطأ في التحقق من الأمان - Error in security validation:', error);
            return false;
        }
    }

    /**
     * الحصول على IP الحالي
     * Get current IP address
     */
    getCurrentIP() {
        try {
            const networkInterfaces = os.networkInterfaces();
            
            // البحث عن عنوان IP الرئيسي
            // Look for primary IP address
            for (const interfaceName in networkInterfaces) {
                const addresses = networkInterfaces[interfaceName];
                
                for (const address of addresses) {
                    // تجاهل عناوين loopback والعناوين الداخلية
                    // Skip loopback and internal addresses
                    if (!address.internal && address.family === 'IPv4') {
                        return address.address;
                    }
                }
            }
            
            // إرجاع localhost كقيمة افتراضية
            // Return localhost as fallback
            return '127.0.0.1';

        } catch (error) {
            logger.error('خطأ في الحصول على IP - Error getting IP address:', error);
            return '127.0.0.1';
        }
    }

    /**
     * التحقق من كون IP مسموح
     * Check if IP is allowed
     */
    isAllowed(ip) {
        return this.allowedIPs.includes(ip) || 
               this.allowedIPs.includes('*') || 
               ip === '127.0.0.1' || 
               ip === 'localhost';
    }

    /**
     * التحقق من كون IP محظور
     * Check if IP is blocked
     */
    isBlocked(ip) {
        const blockInfo = this.blockedIPs.get ? this.blockedIPs.get(ip) : null;
        
        if (!blockInfo) {
            return false;
        }

        // التحقق من انتهاء فترة الحظر
        // Check if block period has expired
        if (Date.now() > blockInfo.blockedUntil) {
            this.unblockIP(ip);
            return false;
        }

        return true;
    }

    /**
     * تسجيل محاولة فاشلة
     * Log failed attempt
     */
    logFailedAttempt(ip) {
        const attempts = this.accessAttempts.get(ip) || { count: 0, firstAttempt: Date.now() };
        attempts.count++;
        attempts.lastAttempt = Date.now();

        this.accessAttempts.set(ip, attempts);

        // حظر IP بعد عدد معين من المحاولات الفاشلة
        // Block IP after certain number of failed attempts
        if (attempts.count >= this.maxFailedAttempts) {
            this.blockIP(ip);
            logger.warn(`تم حظر IP بسبب المحاولات الفاشلة - IP blocked due to failed attempts: ${ip}`);
        }
    }

    /**
     * حظر IP
     * Block IP
     */
    blockIP(ip) {
        const blockInfo = {
            blockedAt: Date.now(),
            blockedUntil: Date.now() + this.blockDuration,
            reason: 'محاولات وصول مشبوهة - Suspicious access attempts'
        };

        this.blockedIPs.set(ip, blockInfo);
        logger.warn(`تم حظر IP - IP blocked: ${ip} until ${new Date(blockInfo.blockedUntil)}`);
    }

    /**
     * إلغاء حظر IP
     * Unblock IP
     */
    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        this.accessAttempts.delete(ip);
        logger.info(`تم إلغاء حظر IP - IP unblocked: ${ip}`);
    }

    /**
     * إضافة IP إلى القائمة المسموحة
     * Add IP to allowed list
     */
    addAllowedIP(ip) {
        if (!this.allowedIPs.includes(ip)) {
            this.allowedIPs.push(ip);
            logger.info(`تم إضافة IP إلى القائمة المسموحة - IP added to allowed list: ${ip}`);
        }
    }

    /**
     * إزالة IP من القائمة المسموحة
     * Remove IP from allowed list
     */
    removeAllowedIP(ip) {
        const index = this.allowedIPs.indexOf(ip);
        if (index > -1) {
            this.allowedIPs.splice(index, 1);
            logger.info(`تم إزالة IP من القائمة المسموحة - IP removed from allowed list: ${ip}`);
        }
    }

    /**
     * التحقق من معدل الطلبات
     * Check request rate
     */
    checkRateLimit(identifier, maxRequests = 60, windowMs = 60000) {
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!this.rateLimiters) {
            this.rateLimiters = new Map();
        }

        let requests = this.rateLimiters.get(identifier) || [];
        
        // إزالة الطلبات القديمة
        // Remove old requests
        requests = requests.filter(time => time > windowStart);

        if (requests.length >= maxRequests) {
            logger.warn(`تم تجاوز حد معدل الطلبات - Rate limit exceeded for: ${identifier}`);
            return false;
        }

        requests.push(now);
        this.rateLimiters.set(identifier, requests);

        return true;
    }

    /**
     * تشفير البيانات الحساسة
     * Encrypt sensitive data
     */
    encryptSensitiveData(data) {
        try {
            // تطبيق تشفير أساسي (يجب استخدام مكتبة تشفير قوية في الإنتاج)
            // Apply basic encryption (should use strong encryption library in production)
            const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
            return encoded;
        } catch (error) {
            logger.error('خطأ في تشفير البيانات - Error encrypting data:', error);
            return null;
        }
    }

    /**
     * فك تشفير البيانات الحساسة
     * Decrypt sensitive data
     */
    decryptSensitiveData(encryptedData) {
        try {
            // فك التشفير الأساسي
            // Basic decryption
            const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
            return JSON.parse(decoded);
        } catch (error) {
            logger.error('خطأ في فك التشفير - Error decrypting data:', error);
            return null;
        }
    }

    /**
     * تنظيف البيانات من المدخلات الضارة
     * Sanitize input data
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        // إزالة المحارف الضارة
        // Remove harmful characters
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }

    /**
     * الحصول على إحصائيات الأمان
     * Get security statistics
     */
    getSecurityStats() {
        return {
            allowedIPs: this.allowedIPs.length,
            blockedIPs: this.blockedIPs.size,
            failedAttempts: this.accessAttempts.size,
            rateLimiters: this.rateLimiters ? this.rateLimiters.size : 0,
            securityEnabled: config.security.enableIPRestriction
        };
    }

    /**
     * تنظيف البيانات القديمة
     * Cleanup old data
     */
    cleanup() {
        const now = Date.now();
        
        // تنظيف المحاولات القديمة
        // Cleanup old attempts
        for (const [ip, attempts] of this.accessAttempts.entries()) {
            if (now - attempts.lastAttempt > this.blockDuration) {
                this.accessAttempts.delete(ip);
            }
        }

        // تنظيف عناوين IP المحظورة المنتهية الصلاحية
        // Cleanup expired blocked IPs
        for (const [ip, blockInfo] of this.blockedIPs.entries()) {
            if (now > blockInfo.blockedUntil) {
                this.blockedIPs.delete(ip);
            }
        }

        logger.debug('تم تنظيف بيانات الأمان القديمة - Old security data cleaned up');
    }
}

module.exports = new SecurityManager();
