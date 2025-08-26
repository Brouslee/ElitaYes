const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../core/logger');

/**
 * نظام إدارة اللغات متعدد اللغات
 * Multi-language Management System
 */

class LanguageManager {
    constructor() {
        this.currentLanguage = config.language || 'ar';
        this.languages = new Map();
        this.loadLanguages();
    }

    /**
     * تحميل جميع ملفات اللغات
     * Load all language files
     */
    loadLanguages() {
        try {
            const languagesPath = config.paths.languages;
            
            if (!fs.existsSync(languagesPath)) {
                fs.mkdirSync(languagesPath, { recursive: true });
                logger.warn('مجلد اللغات غير موجود، تم إنشاؤه - Languages folder not found, created');
                return;
            }

            const languageFiles = fs.readdirSync(languagesPath)
                .filter(file => file.endsWith('.json'));

            for (const file of languageFiles) {
                const langCode = path.basename(file, '.json');
                const langPath = path.join(languagesPath, file);
                
                try {
                    const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
                    this.languages.set(langCode, langData);
                    logger.info(`تم تحميل لغة - Language loaded: ${langCode}`);
                } catch (error) {
                    logger.error(`خطأ في تحميل لغة - Error loading language ${langCode}:`, error);
                }
            }

            // التأكد من وجود اللغة الافتراضية
            // Ensure default language exists
            if (!this.languages.has(this.currentLanguage)) {
                logger.warn(`اللغة الافتراضية غير موجودة، التبديل إلى الإنجليزية - Default language not found, switching to English`);
                this.currentLanguage = 'en';
                
                if (!this.languages.has('en')) {
                    logger.error('ملف اللغة الإنجليزية غير موجود - English language file not found');
                    this.currentLanguage = 'ar';
                }
            }

            logger.info(`اللغة النشطة - Active language: ${this.currentLanguage}`);

        } catch (error) {
            logger.error('خطأ في تحميل اللغات - Error loading languages:', error);
        }
    }

    /**
     * الحصول على نص باللغة المحددة
     * Get text in specified language
     */
    getText(section, key, ...args) {
        try {
            const language = this.languages.get(this.currentLanguage);
            
            if (!language) {
                logger.warn(`لغة غير موجودة - Language not found: ${this.currentLanguage}`);
                return `[${section}.${key}]`;
            }

            const sectionData = language[section];
            if (!sectionData) {
                logger.warn(`قسم غير موجود - Section not found: ${section}`);
                return `[${section}.${key}]`;
            }

            let text = sectionData[key];
            if (!text) {
                logger.warn(`مفتاح غير موجود - Key not found: ${section}.${key}`);
                return `[${section}.${key}]`;
            }

            // استبدال المتغيرات
            // Replace variables
            if (args.length > 0) {
                args.forEach((arg, index) => {
                    text = text.replace(new RegExp(`%${index + 1}`, 'g'), arg);
                });
            }

            return text;

        } catch (error) {
            logger.error('خطأ في الحصول على النص - Error getting text:', error);
            return `[${section}.${key}]`;
        }
    }

    /**
     * تغيير اللغة الحالية
     * Change current language
     */
    setLanguage(langCode) {
        if (this.languages.has(langCode)) {
            this.currentLanguage = langCode;
            logger.info(`تم تغيير اللغة إلى - Language changed to: ${langCode}`);
            return true;
        } else {
            logger.warn(`لغة غير مدعومة - Unsupported language: ${langCode}`);
            return false;
        }
    }

    /**
     * الحصول على اللغة الحالية
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * الحصول على قائمة باللغات المتاحة
     * Get list of available languages
     */
    getAvailableLanguages() {
        return Array.from(this.languages.keys());
    }

    /**
     * إعادة تحميل ملفات اللغات
     * Reload language files
     */
    reloadLanguages() {
        this.languages.clear();
        this.loadLanguages();
        logger.info('تم إعادة تحميل ملفات اللغات - Language files reloaded');
    }

    /**
     * التحقق من وجود مفتاح في اللغة الحالية
     * Check if key exists in current language
     */
    hasKey(section, key) {
        const language = this.languages.get(this.currentLanguage);
        return language && language[section] && language[section][key];
    }

    /**
     * إضافة مفتاح نص جديد
     * Add new text key
     */
    addKey(section, key, text, langCode = null) {
        const targetLang = langCode || this.currentLanguage;
        const language = this.languages.get(targetLang);
        
        if (!language) {
            logger.warn(`لغة غير موجودة لإضافة المفتاح - Language not found for adding key: ${targetLang}`);
            return false;
        }

        if (!language[section]) {
            language[section] = {};
        }

        language[section][key] = text;
        logger.info(`تم إضافة مفتاح جديد - Added new key: ${section}.${key}`);
        return true;
    }

    /**
     * حفظ تغييرات اللغة
     * Save language changes
     */
    saveLanguage(langCode = null) {
        try {
            const targetLang = langCode || this.currentLanguage;
            const language = this.languages.get(targetLang);
            
            if (!language) {
                logger.warn(`لغة غير موجودة للحفظ - Language not found for saving: ${targetLang}`);
                return false;
            }

            const langPath = path.join(config.paths.languages, `${targetLang}.json`);
            fs.writeFileSync(langPath, JSON.stringify(language, null, 2), 'utf8');
            
            logger.info(`تم حفظ ملف اللغة - Language file saved: ${targetLang}`);
            return true;

        } catch (error) {
            logger.error('خطأ في حفظ ملف اللغة - Error saving language file:', error);
            return false;
        }
    }
}

// إنشاء instance واحد للاستخدام العام
// Create single instance for global use
const languageManager = new LanguageManager();

// تصدير دالة مختصرة للحصول على النص
// Export shorthand function for getting text
const getText = (section, key, ...args) => {
    return languageManager.getText(section, key, ...args);
};

module.exports = {
    LanguageManager,
    languageManager,
    getText
};