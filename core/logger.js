const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * نظام التسجيل المتقدم
 * Advanced Logging System
 */

class Logger {
    constructor() {
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        this.currentLevel = this.logLevels[process.env.LOG_LEVEL || 'info'];
        this.logDir = path.join(__dirname, '../logs');
        this.logFile = path.join(this.logDir, 'bot.log');
        
        // إنشاء مجلد السجلات
        // Create logs directory
        this.ensureLogDirectory();
    }

    /**
     * إنشاء مجلد السجلات
     * Ensure logs directory exists
     */
    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.error('فشل في إنشاء مجلد السجلات - Failed to create logs directory:', error);
        }
    }

    /**
     * تنسيق الرسالة
     * Format log message
     */
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const levelStr = level.toUpperCase().padEnd(5);
        
        let formattedMessage = `[${timestamp}] [${levelStr}] ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                formattedMessage += '\n' + util.inspect(data, { depth: 3, colors: false });
            } else {
                formattedMessage += ' ' + data;
            }
        }
        
        return formattedMessage;
    }

    /**
     * كتابة السجل
     * Write log entry
     */
    writeLog(level, message, data = null) {
        // التحقق من مستوى التسجيل
        // Check log level
        if (this.logLevels[level] > this.currentLevel) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, data);
        
        // طباعة في وحدة التحكم
        // Print to console
        const consoleMethod = level === 'error' ? 'error' : 
                             level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](formattedMessage);
        
        // كتابة في الملف
        // Write to file
        this.writeToFile(formattedMessage);
    }

    /**
     * كتابة في ملف السجل
     * Write to log file
     */
    writeToFile(message) {
        try {
            fs.appendFileSync(this.logFile, message + '\n');
            
            // تدوير السجلات عند الحاجة
            // Rotate logs if needed
            this.rotateLogs();
            
        } catch (error) {
            console.error('فشل في كتابة السجل - Failed to write to log file:', error);
        }
    }

    /**
     * تدوير ملفات السجل
     * Rotate log files
     */
    rotateLogs() {
        try {
            const stats = fs.statSync(this.logFile);
            const maxSize = 10 * 1024 * 1024; // 10 MB
            
            if (stats.size > maxSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedFile = this.logFile.replace('.log', `_${timestamp}.log`);
                
                fs.renameSync(this.logFile, rotatedFile);
                
                // الاحتفاظ بـ 5 ملفات سجل فقط
                // Keep only 5 log files
                this.cleanupOldLogs();
            }
            
        } catch (error) {
            console.error('خطأ في تدوير السجلات - Error rotating logs:', error);
        }
    }

    /**
     * تنظيف السجلات القديمة
     * Cleanup old log files
     */
    cleanupOldLogs() {
        try {
            const files = fs.readdirSync(this.logDir)
                .filter(file => file.startsWith('bot_') && file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDir, file),
                    mtime: fs.statSync(path.join(this.logDir, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            // حذف الملفات الزائدة
            // Delete excess files
            if (files.length > 5) {
                for (let i = 5; i < files.length; i++) {
                    fs.unlinkSync(files[i].path);
                }
            }

        } catch (error) {
            console.error('خطأ في تنظيف السجلات القديمة - Error cleaning up old logs:', error);
        }
    }

    /**
     * تسجيل خطأ
     * Log error
     */
    error(message, data = null) {
        this.writeLog('error', message, data);
    }

    /**
     * تسجيل تحذير
     * Log warning
     */
    warn(message, data = null) {
        this.writeLog('warn', message, data);
    }

    /**
     * تسجيل معلومات
     * Log info
     */
    info(message, data = null) {
        this.writeLog('info', message, data);
    }

    /**
     * تسجيل تصحيح
     * Log debug
     */
    debug(message, data = null) {
        this.writeLog('debug', message, data);
    }

    /**
     * تسجيل نجاح العملية
     * Log success
     */
    success(message, data = null) {
        this.info(`✅ ${message}`, data);
    }

    /**
     * تسجيل بداية العملية
     * Log process start
     */
    start(message, data = null) {
        this.info(`🚀 ${message}`, data);
    }

    /**
     * تسجيل انتهاء العملية
     * Log process completion
     */
    complete(message, data = null) {
        this.info(`✨ ${message}`, data);
    }

    /**
     * تعيين مستوى التسجيل
     * Set log level
     */
    setLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.currentLevel = this.logLevels[level];
            this.info(`تم تغيير مستوى التسجيل إلى - Log level changed to: ${level}`);
        } else {
            this.warn(`مستوى تسجيل غير صحيح - Invalid log level: ${level}`);
        }
    }

    /**
     * الحصول على مستوى التسجيل الحالي
     * Get current log level
     */
    getLevel() {
        return Object.keys(this.logLevels).find(key => this.logLevels[key] === this.currentLevel);
    }

    /**
     * مسح ملفات السجل
     * Clear log files
     */
    clearLogs() {
        try {
            const files = fs.readdirSync(this.logDir).filter(file => file.endsWith('.log'));
            
            for (const file of files) {
                fs.unlinkSync(path.join(this.logDir, file));
            }
            
            this.info('تم مسح جميع ملفات السجل - All log files cleared');
            
        } catch (error) {
            this.error('فشل في مسح ملفات السجل - Failed to clear log files:', error);
        }
    }

    /**
     * الحصول على إحصائيات السجلات
     * Get log statistics
     */
    getStats() {
        try {
            const files = fs.readdirSync(this.logDir).filter(file => file.endsWith('.log'));
            let totalSize = 0;
            
            for (const file of files) {
                const stats = fs.statSync(path.join(this.logDir, file));
                totalSize += stats.size;
            }
            
            return {
                fileCount: files.length,
                totalSize: totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                currentLevel: this.getLevel(),
                logDirectory: this.logDir
            };
            
        } catch (error) {
            this.error('فشل في الحصول على إحصائيات السجل - Failed to get log statistics:', error);
            return null;
        }
    }
}

module.exports = new Logger();
