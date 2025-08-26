/**
 * دوال مساعدة عامة
 * General Helper Functions
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../core/logger');

/**
 * فئة الدوال المساعدة
 * Helper Functions Class
 */
class Helpers {
    
    /**
     * تأخير التنفيذ لفترة معينة
     * Delay execution for specified time
     * @param {number} ms - الوقت بالميلي ثانية - Time in milliseconds
     * @returns {Promise} - وعد يكتمل بعد التأخير - Promise that resolves after delay
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * تنظيف النص من المحارف الضارة
     * Clean text from harmful characters
     * @param {string} text - النص المراد تنظيفه - Text to clean
     * @returns {string} - النص المنظف - Cleaned text
     */
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/[<>]/g, '')
            .trim();
    }

    /**
     * التحقق من صحة عنوان البريد الإلكتروني
     * Validate email address
     * @param {string} email - عنوان البريد الإلكتروني - Email address
     * @returns {boolean} - هل العنوان صحيح؟ - Is email valid?
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * التحقق من صحة رقم الهاتف
     * Validate phone number
     * @param {string} phone - رقم الهاتف - Phone number
     * @returns {boolean} - هل الرقم صحيح؟ - Is phone valid?
     */
    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * تنسيق حجم الملف
     * Format file size
     * @param {number} bytes - حجم الملف بالبايت - File size in bytes
     * @returns {string} - حجم الملف منسق - Formatted file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * تنسيق التاريخ والوقت
     * Format date and time
     * @param {Date} date - التاريخ - Date object
     * @param {string} locale - اللغة - Locale
     * @returns {string} - التاريخ منسق - Formatted date
     */
    static formatDateTime(date = new Date(), locale = 'ar-SA') {
        return date.toLocaleString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * حساب الفرق الزمني
     * Calculate time difference
     * @param {Date} startDate - تاريخ البداية - Start date
     * @param {Date} endDate - تاريخ النهاية - End date
     * @returns {Object} - الفرق الزمني - Time difference
     */
    static timeDifference(startDate, endDate = new Date()) {
        const diff = Math.abs(endDate - startDate);
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        return {
            milliseconds: diff,
            seconds: seconds % 60,
            minutes: minutes % 60,
            hours: hours % 24,
            days: days,
            total: {
                seconds,
                minutes,
                hours,
                days
            }
        };
    }

    /**
     * توليد معرف فريد
     * Generate unique ID
     * @param {number} length - طول المعرف - ID length
     * @returns {string} - معرف فريد - Unique ID
     */
    static generateUniqueId(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * توليد رمز عشوائي
     * Generate random code
     * @param {number} length - طول الرمز - Code length
     * @param {boolean} numbersOnly - أرقام فقط؟ - Numbers only?
     * @returns {string} - رمز عشوائي - Random code
     */
    static generateRandomCode(length = 6, numbersOnly = true) {
        const chars = numbersOnly ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    /**
     * تشفير كلمة المرور
     * Hash password
     * @param {string} password - كلمة المرور - Password
     * @param {string} salt - الملح - Salt
     * @returns {string} - كلمة المرور المشفرة - Hashed password
     */
    static hashPassword(password, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(16).toString('hex');
        }
        
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    /**
     * التحقق من كلمة المرور
     * Verify password
     * @param {string} password - كلمة المرور - Password
     * @param {string} hashedPassword - كلمة المرور المشفرة - Hashed password
     * @returns {boolean} - هل كلمة المرور صحيحة؟ - Is password correct?
     */
    static verifyPassword(password, hashedPassword) {
        try {
            const [salt, hash] = hashedPassword.split(':');
            const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
            return hash === hashToVerify;
        } catch (error) {
            return false;
        }
    }

    /**
     * تشفير البيانات
     * Encrypt data
     * @param {string} text - النص المراد تشفيره - Text to encrypt
     * @param {string} key - مفتاح التشفير - Encryption key
     * @returns {string} - البيانات المشفرة - Encrypted data
     */
    static encrypt(text, key = process.env.ENCRYPTION_KEY || 'default-key') {
        try {
            const algorithm = 'aes-256-cbc';
            const keyHash = crypto.createHash('sha256').update(key).digest();
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipher(algorithm, keyHash);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            logger.error('خطأ في التشفير - Encryption error:', error);
            return null;
        }
    }

    /**
     * فك تشفير البيانات
     * Decrypt data
     * @param {string} encryptedText - البيانات المشفرة - Encrypted data
     * @param {string} key - مفتاح فك التشفير - Decryption key
     * @returns {string} - البيانات المفكوكة - Decrypted data
     */
    static decrypt(encryptedText, key = process.env.ENCRYPTION_KEY || 'default-key') {
        try {
            const algorithm = 'aes-256-cbc';
            const keyHash = crypto.createHash('sha256').update(key).digest();
            
            const [ivHex, encrypted] = encryptedText.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            
            const decipher = crypto.createDecipher(algorithm, keyHash);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            logger.error('خطأ في فك التشفير - Decryption error:', error);
            return null;
        }
    }

    /**
     * التحقق من وجود الملف
     * Check if file exists
     * @param {string} filePath - مسار الملف - File path
     * @returns {boolean} - هل الملف موجود؟ - Does file exist?
     */
    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * إنشاء مجلد إذا لم يكن موجوداً
     * Create directory if it doesn't exist
     * @param {string} dirPath - مسار المجلد - Directory path
     */
    static async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * قراءة ملف JSON
     * Read JSON file
     * @param {string} filePath - مسار الملف - File path
     * @returns {Object} - بيانات JSON - JSON data
     */
    static async readJsonFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error(`خطأ في قراءة ملف JSON - Error reading JSON file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * كتابة ملف JSON
     * Write JSON file
     * @param {string} filePath - مسار الملف - File path
     * @param {Object} data - البيانات - Data to write
     */
    static async writeJsonFile(filePath, data) {
        try {
            await this.ensureDirectory(path.dirname(filePath));
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            logger.error(`خطأ في كتابة ملف JSON - Error writing JSON file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * تحويل النص إلى slug
     * Convert text to slug
     * @param {string} text - النص - Text
     * @returns {string} - slug منسق - Formatted slug
     */
    static toSlug(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[\s\W-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * التحقق من صحة URL
     * Validate URL
     * @param {string} url - الرابط - URL
     * @returns {boolean} - هل الرابط صحيح؟ - Is URL valid?
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * استخراج اسم المجال من URL
     * Extract domain from URL
     * @param {string} url - الرابط - URL
     * @returns {string} - اسم المجال - Domain name
     */
    static extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return null;
        }
    }

    /**
     * تحويل المصفوفة إلى مجموعات
     * Chunk array into groups
     * @param {Array} array - المصفوفة - Array
     * @param {number} size - حجم المجموعة - Group size
     * @returns {Array} - مصفوفة المجموعات - Array of chunks
     */
    static chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * إزالة التكرارات من المصفوفة
     * Remove duplicates from array
     * @param {Array} array - المصفوفة - Array
     * @returns {Array} - مصفوفة بدون تكرارات - Array without duplicates
     */
    static removeDuplicates(array) {
        return [...new Set(array)];
    }

    /**
     * خلط المصفوفة عشوائياً
     * Shuffle array randomly
     * @param {Array} array - المصفوفة - Array
     * @returns {Array} - مصفوفة مخلوطة - Shuffled array
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * الحصول على عنصر عشوائي من المصفوفة
     * Get random element from array
     * @param {Array} array - المصفوفة - Array
     * @returns {*} - عنصر عشوائي - Random element
     */
    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * تحويل الوقت بالثواني إلى تنسيق قابل للقراءة
     * Convert seconds to human readable format
     * @param {number} seconds - الثواني - Seconds
     * @returns {string} - الوقت منسق - Formatted time
     */
    static formatDuration(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days} يوم`);
        if (hours > 0) parts.push(`${hours} ساعة`);
        if (minutes > 0) parts.push(`${minutes} دقيقة`);
        if (secs > 0) parts.push(`${secs} ثانية`);

        return parts.join(' و ') || '0 ثانية';
    }

    /**
     * التحقق من قوة كلمة المرور
     * Check password strength
     * @param {string} password - كلمة المرور - Password
     * @returns {Object} - تقييم قوة كلمة المرور - Password strength assessment
     */
    static checkPasswordStrength(password) {
        const score = {
            score: 0,
            feedback: [],
            strength: 'ضعيف' // weak
        };

        if (password.length >= 8) {
            score.score += 1;
        } else {
            score.feedback.push('يجب أن تكون 8 أحرف على الأقل');
        }

        if (/[a-z]/.test(password)) score.score += 1;
        else score.feedback.push('يجب أن تحتوي على حرف صغير');

        if (/[A-Z]/.test(password)) score.score += 1;
        else score.feedback.push('يجب أن تحتوي على حرف كبير');

        if (/[0-9]/.test(password)) score.score += 1;
        else score.feedback.push('يجب أن تحتوي على رقم');

        if (/[^A-Za-z0-9]/.test(password)) score.score += 1;
        else score.feedback.push('يجب أن تحتوي على رمز خاص');

        if (score.score < 2) score.strength = 'ضعيف جداً';
        else if (score.score < 3) score.strength = 'ضعيف';
        else if (score.score < 4) score.strength = 'متوسط';
        else if (score.score < 5) score.strength = 'قوي';
        else score.strength = 'قوي جداً';

        return score;
    }

    /**
     * تحويل النص العربي إلى أرقام إنجليزية
     * Convert Arabic numerals to English
     * @param {string} text - النص - Text
     * @returns {string} - النص بأرقام إنجليزية - Text with English numerals
     */
    static arabicToEnglishNumbers(text) {
        const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
        const englishNumbers = '0123456789';
        
        return text.replace(/[٠-٩]/g, (char) => {
            return englishNumbers[arabicNumbers.indexOf(char)];
        });
    }

    /**
     * تحويل الأرقام الإنجليزية إلى عربية
     * Convert English numerals to Arabic
     * @param {string} text - النص - Text
     * @returns {string} - النص بأرقام عربية - Text with Arabic numerals
     */
    static englishToArabicNumbers(text) {
        const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
        const englishNumbers = '0123456789';
        
        return text.replace(/[0-9]/g, (char) => {
            return arabicNumbers[englishNumbers.indexOf(char)];
        });
    }
}

module.exports = Helpers;
