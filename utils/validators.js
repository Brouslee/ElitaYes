/**
 * مجموعة دوال التحقق من صحة البيانات
 * Data Validation Functions Collection
 */

const logger = require('../core/logger');

/**
 * فئة مدققات البيانات
 * Data Validators Class
 */
class Validators {
    
    /**
     * التحقق من صحة معرف Instagram
     * Validate Instagram ID
     * @param {string} id - معرف Instagram
     * @returns {boolean} - هل المعرف صحيح؟
     */
    static isValidInstagramId(id) {
        if (!id || typeof id !== 'string') return false;
        
        // معرف Instagram يجب أن يكون رقمي فقط
        // Instagram ID should be numeric only
        return /^\d+$/.test(id) && id.length >= 8 && id.length <= 20;
    }

    /**
     * التحقق من صحة اسم مستخدم Instagram
     * Validate Instagram username
     * @param {string} username - اسم المستخدم
     * @returns {boolean} - هل الاسم صحيح؟
     */
    static isValidInstagramUsername(username) {
        if (!username || typeof username !== 'string') return false;
        
        // اسم المستخدم: أحرف، أرقام، نقط، شرطات سفلية فقط
        // Username: letters, numbers, dots, underscores only
        const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
        
        // لا يمكن أن يبدأ أو ينتهي بنقطة
        // Cannot start or end with a dot
        if (username.startsWith('.') || username.endsWith('.')) return false;
        
        // لا يمكن أن يحتوي على نقطتين متتاليتين
        // Cannot contain consecutive dots
        if (username.includes('..')) return false;
        
        return usernameRegex.test(username);
    }

    /**
     * التحقق من صحة معرف الرسالة
     * Validate message ID
     * @param {string} messageId - معرف الرسالة
     * @returns {boolean} - هل المعرف صحيح؟
     */
    static isValidMessageId(messageId) {
        if (!messageId || typeof messageId !== 'string') return false;
        
        // معرف الرسالة يجب أن يكون بين 10-50 حرف
        // Message ID should be between 10-50 characters
        return messageId.length >= 10 && messageId.length <= 50;
    }

    /**
     * التحقق من صحة محتوى الرسالة
     * Validate message content
     * @param {string} content - محتوى الرسالة
     * @returns {Object} - نتيجة التحقق
     */
    static validateMessageContent(content) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!content || typeof content !== 'string') {
            result.isValid = false;
            result.errors.push('محتوى الرسالة مطلوب - Message content is required');
            return result;
        }

        // فحص الطول - Check length
        if (content.length === 0) {
            result.isValid = false;
            result.errors.push('الرسالة فارغة - Message is empty');
        }

        if (content.length > 2200) { // Instagram message limit
            result.isValid = false;
            result.errors.push('الرسالة طويلة جداً - Message too long');
        }

        // فحص المحتوى المشبوه - Check suspicious content
        const suspiciousPatterns = [
            /(?:https?:\/\/)?(?:bit\.ly|tinyurl|t\.co)/i, // Shortened URLs
            /(?:password|login|click here|urgent)/i,      // Phishing indicators
            /<script|javascript:|on\w+=/i,               // Script injection
            /\b(?:free money|lottery|winner|congratulations)\b/i // Spam indicators
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(content)) {
                result.warnings.push('محتوى مشبوه تم اكتشافه - Suspicious content detected');
                break;
            }
        }

        // فحص المحارف الخاصة - Check special characters
        const specialCharCount = (content.match(/[^\w\s\u0600-\u06FF]/g) || []).length;
        if (specialCharCount > content.length * 0.3) {
            result.warnings.push('نسبة عالية من المحارف الخاصة - High ratio of special characters');
        }

        return result;
    }

    /**
     * التحقق من صحة نوع الرسالة
     * Validate message type
     * @param {string} type - نوع الرسالة
     * @returns {boolean} - هل النوع صحيح؟
     */
    static isValidMessageType(type) {
        const validTypes = [
            'text',
            'image',
            'video',
            'audio',
            'file',
            'location',
            'contact',
            'sticker',
            'gif'
        ];

        return validTypes.includes(type);
    }

    /**
     * التحقق من صحة عنوان URL
     * Validate URL
     * @param {string} url - العنوان
     * @returns {Object} - نتيجة التحقق
     */
    static validateUrl(url) {
        const result = {
            isValid: false,
            isSecure: false,
            domain: null,
            isSafe: true,
            warnings: []
        };

        try {
            const urlObj = new URL(url);
            result.isValid = true;
            result.domain = urlObj.hostname;
            result.isSecure = urlObj.protocol === 'https:';

            // فحص النطاقات المشبوهة - Check suspicious domains
            const suspiciousDomains = [
                'bit.ly',
                'tinyurl.com',
                't.co',
                'shortened.link'
            ];

            if (suspiciousDomains.includes(result.domain)) {
                result.isSafe = false;
                result.warnings.push('رابط مختصر قد يكون خطير - Shortened URL may be dangerous');
            }

            // فحص البروتوكول - Check protocol
            if (!result.isSecure) {
                result.warnings.push('الرابط غير آمن (HTTP) - Insecure URL (HTTP)');
            }

        } catch (error) {
            result.isValid = false;
            result.warnings.push('تنسيق الرابط غير صحيح - Invalid URL format');
        }

        return result;
    }

    /**
     * التحقق من صحة البريد الإلكتروني
     * Validate email address
     * @param {string} email - البريد الإلكتروني
     * @returns {Object} - نتيجة التحقق
     */
    static validateEmail(email) {
        const result = {
            isValid: false,
            domain: null,
            isBusinessEmail: false,
            warnings: []
        };

        if (!email || typeof email !== 'string') {
            result.warnings.push('البريد الإلكتروني مطلوب - Email is required');
            return result;
        }

        // تنسيق البريد الإلكتروني - Email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            result.warnings.push('تنسيق البريد الإلكتروني غير صحيح - Invalid email format');
            return result;
        }

        result.isValid = true;
        result.domain = email.split('@')[1];

        // فحص نطاقات الأعمال - Check business domains
        const businessDomains = [
            'gmail.com',
            'outlook.com',
            'yahoo.com',
            'hotmail.com'
        ];

        result.isBusinessEmail = !businessDomains.includes(result.domain);

        // فحص النطاقات المشبوهة - Check suspicious domains
        const suspiciousDomains = [
            '10minutemail.com',
            'tempmail.org',
            'guerrillamail.com'
        ];

        if (suspiciousDomains.includes(result.domain)) {
            result.warnings.push('بريد إلكتروني مؤقت - Temporary email detected');
        }

        return result;
    }

    /**
     * التحقق من صحة رقم الهاتف
     * Validate phone number
     * @param {string} phone - رقم الهاتف
     * @returns {Object} - نتيجة التحقق
     */
    static validatePhoneNumber(phone) {
        const result = {
            isValid: false,
            country: null,
            formatted: null,
            type: 'unknown'
        };

        if (!phone || typeof phone !== 'string') {
            return result;
        }

        // إزالة المسافات والمحارف الخاصة - Remove spaces and special characters
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

        // فحص الأرقام فقط - Check numbers only
        if (!/^\+?\d{7,15}$/.test(cleanPhone)) {
            return result;
        }

        result.isValid = true;
        result.formatted = cleanPhone;

        // فحص رمز الدولة - Check country code
        if (cleanPhone.startsWith('+966') || cleanPhone.startsWith('966')) {
            result.country = 'SA';
            result.type = 'saudi';
        } else if (cleanPhone.startsWith('+1')) {
            result.country = 'US';
            result.type = 'us';
        } else if (cleanPhone.startsWith('+44')) {
            result.country = 'UK';
            result.type = 'uk';
        }

        return result;
    }

    /**
     * التحقق من صحة كلمة المرور
     * Validate password
     * @param {string} password - كلمة المرور
     * @returns {Object} - نتيجة التحقق
     */
    static validatePassword(password) {
        const result = {
            isValid: false,
            score: 0,
            strength: 'weak',
            requirements: {
                length: false,
                lowercase: false,
                uppercase: false,
                numbers: false,
                symbols: false
            },
            suggestions: []
        };

        if (!password || typeof password !== 'string') {
            result.suggestions.push('كلمة المرور مطلوبة - Password is required');
            return result;
        }

        // فحص الطول - Check length
        if (password.length >= 8) {
            result.requirements.length = true;
            result.score += 1;
        } else {
            result.suggestions.push('يجب أن تكون 8 أحرف على الأقل - Must be at least 8 characters');
        }

        // فحص الأحرف الصغيرة - Check lowercase
        if (/[a-z]/.test(password)) {
            result.requirements.lowercase = true;
            result.score += 1;
        } else {
            result.suggestions.push('يجب أن تحتوي على حرف صغير - Must contain lowercase letter');
        }

        // فحص الأحرف الكبيرة - Check uppercase
        if (/[A-Z]/.test(password)) {
            result.requirements.uppercase = true;
            result.score += 1;
        } else {
            result.suggestions.push('يجب أن تحتوي على حرف كبير - Must contain uppercase letter');
        }

        // فحص الأرقام - Check numbers
        if (/[0-9]/.test(password)) {
            result.requirements.numbers = true;
            result.score += 1;
        } else {
            result.suggestions.push('يجب أن تحتوي على رقم - Must contain number');
        }

        // فحص الرموز - Check symbols
        if (/[^A-Za-z0-9]/.test(password)) {
            result.requirements.symbols = true;
            result.score += 1;
        } else {
            result.suggestions.push('يجب أن تحتوي على رمز خاص - Must contain special character');
        }

        // تحديد قوة كلمة المرور - Determine password strength
        if (result.score < 2) {
            result.strength = 'very_weak';
        } else if (result.score < 3) {
            result.strength = 'weak';
        } else if (result.score < 4) {
            result.strength = 'medium';
        } else if (result.score < 5) {
            result.strength = 'strong';
        } else {
            result.strength = 'very_strong';
        }

        result.isValid = result.score >= 3;

        return result;
    }

    /**
     * التحقق من صحة إعدادات المستخدم
     * Validate user settings
     * @param {Object} settings - الإعدادات
     * @returns {Object} - نتيجة التحقق
     */
    static validateUserSettings(settings) {
        const result = {
            isValid: true,
            errors: [],
            sanitized: {}
        };

        if (!settings || typeof settings !== 'object') {
            result.isValid = false;
            result.errors.push('إعدادات غير صحيحة - Invalid settings');
            return result;
        }

        // قائمة الإعدادات المسموحة - Allowed settings
        const allowedSettings = {
            language: ['ar', 'en', 'fr', 'es'],
            theme: ['light', 'dark', 'auto'],
            notifications: [true, false],
            privacy: ['public', 'friends', 'private'],
            autoReply: [true, false],
            timezone: 'string'
        };

        for (const [key, value] of Object.entries(settings)) {
            if (!allowedSettings.hasOwnProperty(key)) {
                result.errors.push(`إعداد غير مدعوم - Unsupported setting: ${key}`);
                continue;
            }

            const allowedValues = allowedSettings[key];

            if (Array.isArray(allowedValues)) {
                if (allowedValues.includes(value)) {
                    result.sanitized[key] = value;
                } else {
                    result.errors.push(`قيمة غير صحيحة للإعداد ${key} - Invalid value for setting ${key}`);
                }
            } else if (allowedValues === 'string') {
                if (typeof value === 'string' && value.length <= 50) {
                    result.sanitized[key] = value.trim();
                } else {
                    result.errors.push(`قيمة نصية غير صحيحة للإعداد ${key} - Invalid string value for setting ${key}`);
                }
            }
        }

        if (result.errors.length > 0) {
            result.isValid = false;
        }

        return result;
    }

    /**
     * التحقق من صحة الكوكيز
     * Validate cookies
     * @param {Object} cookies - الكوكيز
     * @returns {Object} - نتيجة التحقق
     */
    static validateInstagramCookies(cookies) {
        const result = {
            isValid: false,
            hasRequiredCookies: false,
            missingCookies: [],
            warnings: []
        };

        if (!cookies || typeof cookies !== 'object') {
            result.warnings.push('كوكيز غير صحيحة - Invalid cookies');
            return result;
        }

        // الكوكيز المطلوبة - Required cookies
        const requiredCookies = ['sessionid', 'csrftoken'];
        const optionalCookies = ['mid', 'ig_did', 'ig_nrcb', 'rur'];

        // فحص الكوكيز المطلوبة - Check required cookies
        for (const cookieName of requiredCookies) {
            if (!cookies[cookieName] || typeof cookies[cookieName] !== 'string') {
                result.missingCookies.push(cookieName);
            }
        }

        if (result.missingCookies.length === 0) {
            result.hasRequiredCookies = true;
        }

        // فحص صحة sessionid - Validate sessionid
        if (cookies.sessionid) {
            if (cookies.sessionid.length < 20) {
                result.warnings.push('sessionid قصير جداً - sessionid too short');
            }
        }

        // فحص صحة csrftoken - Validate csrftoken
        if (cookies.csrftoken) {
            if (cookies.csrftoken.length !== 32) {
                result.warnings.push('csrftoken بطول غير صحيح - csrftoken invalid length');
            }
        }

        result.isValid = result.hasRequiredCookies && result.warnings.length === 0;

        return result;
    }

    /**
     * التحقق من صحة إعدادات الأمان
     * Validate security settings
     * @param {Object} securitySettings - إعدادات الأمان
     * @returns {Object} - نتيجة التحقق
     */
    static validateSecuritySettings(securitySettings) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!securitySettings || typeof securitySettings !== 'object') {
            result.isValid = false;
            result.errors.push('إعدادات أمان غير صحيحة - Invalid security settings');
            return result;
        }

        // فحص عناوين IP المسموحة - Check allowed IPs
        if (securitySettings.allowedIPs) {
            if (!Array.isArray(securitySettings.allowedIPs)) {
                result.errors.push('قائمة IP غير صحيحة - Invalid IP list');
            } else {
                for (const ip of securitySettings.allowedIPs) {
                    if (!this.isValidIP(ip)) {
                        result.errors.push(`عنوان IP غير صحيح - Invalid IP: ${ip}`);
                    }
                }
            }
        }

        // فحص إعدادات تحديد المعدل - Check rate limit settings
        if (securitySettings.rateLimitMax) {
            if (typeof securitySettings.rateLimitMax !== 'number' || securitySettings.rateLimitMax < 1) {
                result.errors.push('حد المعدل غير صحيح - Invalid rate limit');
            }
        }

        if (result.errors.length > 0) {
            result.isValid = false;
        }

        return result;
    }

    /**
     * التحقق من صحة عنوان IP
     * Validate IP address
     * @param {string} ip - عنوان IP
     * @returns {boolean} - هل العنوان صحيح؟
     */
    static isValidIP(ip) {
        if (!ip || typeof ip !== 'string') return false;

        // IPv4
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipv4Regex.test(ip)) {
            return ip.split('.').every(octet => {
                const num = parseInt(octet, 10);
                return num >= 0 && num <= 255;
            });
        }

        // IPv6 (مبسط - simplified)
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv6Regex.test(ip);
    }

    /**
     * تنظيف البيانات من المحتوى الضار
     * Sanitize data from malicious content
     * @param {any} data - البيانات
     * @returns {any} - البيانات المنظفة
     */
    static sanitizeInput(data) {
        if (typeof data === 'string') {
            return data
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .replace(/[<>]/g, '')
                .trim();
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeInput(item));
        }

        if (data && typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }

        return data;
    }

    /**
     * التحقق الشامل من بيانات المستخدم
     * Comprehensive user data validation
     * @param {Object} userData - بيانات المستخدم
     * @returns {Object} - نتيجة التحقق الشامل
     */
    static validateUserData(userData) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: {}
        };

        if (!userData || typeof userData !== 'object') {
            result.isValid = false;
            result.errors.push('بيانات المستخدم مطلوبة - User data required');
            return result;
        }

        // التحقق من معرف Instagram - Validate Instagram ID
        if (userData.instagramId) {
            if (!this.isValidInstagramId(userData.instagramId)) {
                result.errors.push('معرف Instagram غير صحيح - Invalid Instagram ID');
            } else {
                result.sanitized.instagramId = userData.instagramId;
            }
        }

        // التحقق من اسم المستخدم - Validate username
        if (userData.username) {
            if (!this.isValidInstagramUsername(userData.username)) {
                result.errors.push('اسم المستخدم غير صحيح - Invalid username');
            } else {
                result.sanitized.username = userData.username;
            }
        }

        // التحقق من الاسم الكامل - Validate full name
        if (userData.fullName) {
            if (typeof userData.fullName === 'string' && userData.fullName.length <= 150) {
                result.sanitized.fullName = this.sanitizeInput(userData.fullName);
            } else {
                result.warnings.push('الاسم الكامل طويل جداً - Full name too long');
            }
        }

        // التحقق من البريد الإلكتروني - Validate email
        if (userData.email) {
            const emailValidation = this.validateEmail(userData.email);
            if (emailValidation.isValid) {
                result.sanitized.email = userData.email;
            } else {
                result.warnings.push(...emailValidation.warnings);
            }
        }

        if (result.errors.length > 0) {
            result.isValid = false;
        }

        return result;
    }

    /**
     * تسجيل أخطاء التحقق
     * Log validation errors
     * @param {string} context - السياق
     * @param {Object} validation - نتيجة التحقق
     */
    static logValidationErrors(context, validation) {
        if (!validation.isValid) {
            logger.warn(`فشل في التحقق - Validation failed in ${context}:`, {
                errors: validation.errors,
                warnings: validation.warnings
            });
        }
    }
}

module.exports = Validators;
