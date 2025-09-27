const fs = require('fs');
const path = require('path');
const util = require('util');

// ANSI Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Foreground colors
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

/**
 * Advanced Logging System with Colors and Better Formatting
 * Enhanced console output with beautiful formatting
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
            console.error('Failed to create logs directory:', error);
        }
    }

    /**
     * Format log message with colors and better styling
     */
    formatMessage(level, message, data = null, forConsole = false) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
        const date = now.toLocaleDateString('en-US');
        
        // Get level styling
        const levelInfo = this.getLevelStyling(level);
        const levelStr = levelInfo.label.padEnd(7);
        
        let formattedMessage;
        
        if (forConsole) {
            // Colored console output
            const timeColor = `${colors.gray}${date} ${colors.cyan}${timestamp}${colors.reset}`;
            const levelColor = `${levelInfo.color}${levelStr}${colors.reset}`;
            const separator = `${colors.gray}│${colors.reset}`;
            
            formattedMessage = `${timeColor} ${separator} ${levelColor} ${separator} ${message}`;
            
            if (data) {
                if (typeof data === 'object') {
                    formattedMessage += '\n' + `${colors.gray}${''.padStart(28)}│${colors.reset} ` + 
                        util.inspect(data, { depth: 3, colors: true });
                } else {
                    formattedMessage += ` ${colors.dim}${data}${colors.reset}`;
                }
            }
        } else {
            // Plain text for file output
            formattedMessage = `[${date} ${timestamp}] [${levelStr}] ${message}`;
            
            if (data) {
                if (typeof data === 'object') {
                    formattedMessage += '\n' + util.inspect(data, { depth: 3, colors: false });
                } else {
                    formattedMessage += ' ' + data;
                }
            }
        }
        
        return formattedMessage;
    }
    
    /**
     * Get level specific styling
     */
    getLevelStyling(level) {
        const styles = {
            error: { color: `${colors.bright}${colors.bgRed}${colors.white}`, label: '✖ ERROR', icon: '🚨' },
            warn:  { color: `${colors.bright}${colors.bgYellow}${colors.white}`, label: '⚠ WARN', icon: '⚠️' },
            info:  { color: `${colors.bright}${colors.bgBlue}${colors.white}`, label: '✓ INFO', icon: 'ℹ️' },
            debug: { color: `${colors.bright}${colors.bgMagenta}${colors.white}`, label: '⚡ DEBUG', icon: '🔍' },
            success: { color: `${colors.bright}${colors.bgGreen}${colors.white}`, label: '✅ SUCCESS', icon: '✅' },
            start: { color: `${colors.bright}${colors.bgCyan}${colors.white}`, label: '🚀 START', icon: '🚀' },
            complete: { color: `${colors.bright}${colors.bgGreen}${colors.white}`, label: '✨ DONE', icon: '✨' }
        };
        
        return styles[level] || styles.info;
    }

    /**
     * Write log entry with enhanced formatting
     */
    writeLog(level, message, data = null) {
        // Check log level
        if (this.logLevels[level] > this.currentLevel) {
            return;
        }

        // Format for console (with colors)
        const consoleMessage = this.formatMessage(level, message, data, true);
        
        // Format for file (plain text)
        const fileMessage = this.formatMessage(level, message, data, false);
        
        // Print to console with colors
        const consoleMethod = level === 'error' ? 'error' : 
                             level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](consoleMessage);
        
        // Write plain text to file
        this.writeToFile(fileMessage);
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
            console.error('Failed to write to log file:', error);
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
                
                // Keep only 5 log files
                this.cleanupOldLogs();
            }
            
        } catch (error) {
            console.error('Error rotating logs:', error);
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

            // Delete excess files
            if (files.length > 5) {
                for (let i = 5; i < files.length; i++) {
                    fs.unlinkSync(files[i].path);
                }
            }

        } catch (error) {
            console.error('Error cleaning up old logs:', error);
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
     * Log success with special formatting
     */
    success(message, data = null) {
        this.writeLog('success', message, data);
    }

    /**
     * Log process start with special formatting
     */
    start(message, data = null) {
        this.writeLog('start', message, data);
    }

    /**
     * Log process completion with special formatting
     */
    complete(message, data = null) {
        this.writeLog('complete', message, data);
    }
    
    /**
     * Log authentication errors
     */
    authError(message, data = null) {
        this.error(`🔐 Authentication Error: ${message}`, data);
    }
    
    /**
     * Log cookie-related errors
     */
    cookieError(message, data = null) {
        this.error(`🍪 Cookie Error: ${message}`, data);
    }
    
    /**
     * Log connection errors
     */
    connectionError(message, data = null) {
        this.error(`🌐 Connection Error: ${message}`, data);
    }
    
    /**
     * Log system critical errors
     */
    critical(message, data = null) {
        const levelInfo = this.getLevelStyling('error');
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const date = new Date().toLocaleDateString('en-US');
        
        // Special formatting for critical errors
        const consoleMessage = `${colors.red}${colors.bright}🚨 CRITICAL ERROR 🚨${colors.reset}\n` +
            `${colors.gray}${date} ${colors.cyan}${timestamp}${colors.reset} ${colors.gray}│${colors.reset} ` +
            `${colors.red}${colors.bright}${message}${colors.reset}`;
            
        console.error(consoleMessage);
        
        if (data) {
            console.error(`${colors.gray}${''.padStart(28)}│${colors.reset} `, data);
        }
        
        // Also write to file
        const fileMessage = `[${date} ${timestamp}] [CRITICAL] ${message}`;
        this.writeToFile(fileMessage + (data ? '\n' + JSON.stringify(data, null, 2) : ''));
    }

    /**
     * تعيين مستوى التسجيل
     * Set log level
     */
    setLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.currentLevel = this.logLevels[level];
            this.info(`Log level changed to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
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
            
            this.info('All log files cleared');
            
        } catch (error) {
            this.error('Failed to clear log files:', error);
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
            this.error('Failed to get log statistics:', error);
            return null;
        }
    }
}

module.exports = new Logger();
