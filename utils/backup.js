const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config/config');
const logger = require('../core/logger');
const { getText } = require('./language');

/**
 * نظام النسخ الاحتياطي التلقائي
 * Automatic Backup System
 */

class BackupManager {
    constructor() {
        this.backupPath = config.paths.backups;
        this.isRunning = false;
        this.backupInterval = null;
        this.maxBackups = config.backup.maxBackups || 10;
        
        this.ensureBackupDirectory();
        
        if (config.backup.enable) {
            this.startAutoBackup();
        }
    }

    /**
     * التأكد من وجود مجلد النسخ الاحتياطية
     * Ensure backup directory exists
     */
    ensureBackupDirectory() {
        try {
            if (!fs.existsSync(this.backupPath)) {
                fs.mkdirSync(this.backupPath, { recursive: true });
                logger.info('تم إنشاء مجلد النسخ الاحتياطية - Backup directory created');
            }
        } catch (error) {
            logger.error('خطأ في إنشاء مجلد النسخ الاحتياطية - Error creating backup directory:', error);
        }
    }

    /**
     * بدء النسخ الاحتياطي التلقائي
     * Start automatic backup
     */
    startAutoBackup() {
        if (this.isRunning) {
            logger.warn('النسخ الاحتياطي التلقائي يعمل بالفعل - Auto backup already running');
            return;
        }

        const interval = config.backup.interval || 3600000; // ساعة واحدة افتراضياً - 1 hour default
        
        this.backupInterval = setInterval(() => {
            this.createBackup().catch(error => {
                logger.error('خطأ في النسخ الاحتياطي التلقائي - Auto backup error:', error);
            });
        }, interval);

        this.isRunning = true;
        logger.info(`تم بدء النسخ الاحتياطي التلقائي - Auto backup started (interval: ${interval}ms)`);
    }

    /**
     * إيقاف النسخ الاحتياطي التلقائي
     * Stop automatic backup
     */
    stopAutoBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        
        this.isRunning = false;
        logger.info('تم إيقاف النسخ الاحتياطي التلقائي - Auto backup stopped');
    }

    /**
     * إنشاء نسخة احتياطية جديدة
     * Create new backup
     */
    async createBackup(customName = null) {
        try {
            logger.info(getText('bot', 'backup'));
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = customName || `backup_${timestamp}`;
            const backupDir = path.join(this.backupPath, backupName);

            // إنشاء مجلد النسخة الاحتياطية
            // Create backup directory
            await fs.ensureDir(backupDir);

            // نسخ قاعدة البيانات
            // Copy database
            if (config.backup.includeDatabase && fs.existsSync(config.database.path)) {
                const dbBackupPath = path.join(backupDir, 'database');
                await fs.ensureDir(dbBackupPath);
                await fs.copy(config.database.path, path.join(dbBackupPath, 'bot.db'));
                logger.info('تم نسخ قاعدة البيانات - Database backed up');
            }

            // نسخ ملفات الإعدادات
            // Copy configuration files
            if (config.backup.includeConfig) {
                const configBackupPath = path.join(backupDir, 'config');
                await fs.ensureDir(configBackupPath);
                
                // نسخ ملفات الإعدادات الرئيسية
                // Copy main config files
                const configFiles = [
                    'config/config.js',
                    'configCommands.json',
                    'package.json'
                ];

                for (const file of configFiles) {
                    const sourcePath = path.join(process.cwd(), file);
                    if (fs.existsSync(sourcePath)) {
                        const targetPath = path.join(configBackupPath, path.basename(file));
                        await fs.copy(sourcePath, targetPath);
                    }
                }
                
                logger.info('تم نسخ ملفات الإعدادات - Config files backed up');
            }

            // نسخ السكريبتات المخصصة
            // Copy custom scripts
            const scriptsPath = config.paths.scripts;
            if (fs.existsSync(scriptsPath)) {
                const scriptsBackupPath = path.join(backupDir, 'scripts');
                await fs.copy(scriptsPath, scriptsBackupPath);
                logger.info('تم نسخ السكريبتات - Scripts backed up');
            }

            // نسخ ملفات اللغات
            // Copy language files
            const languagesPath = config.paths.languages;
            if (fs.existsSync(languagesPath)) {
                const languagesBackupPath = path.join(backupDir, 'languages');
                await fs.copy(languagesPath, languagesBackupPath);
                logger.info('تم نسخ ملفات اللغات - Language files backed up');
            }

            // نسخ السجلات (اختياري)
            // Copy logs (optional)
            if (config.backup.includeLogs && fs.existsSync(config.paths.logs)) {
                const logsBackupPath = path.join(backupDir, 'logs');
                await fs.copy(config.paths.logs, logsBackupPath);
                logger.info('تم نسخ السجلات - Logs backed up');
            }

            // إنشاء ملف معلومات النسخة الاحتياطية
            // Create backup info file
            const backupInfo = {
                name: backupName,
                timestamp: new Date().toISOString(),
                version: config.bot.version,
                size: await this.getDirectorySize(backupDir),
                includes: {
                    database: config.backup.includeDatabase,
                    config: config.backup.includeConfig,
                    logs: config.backup.includeLogs,
                    scripts: true,
                    languages: true
                }
            };

            await fs.writeJson(path.join(backupDir, 'backup-info.json'), backupInfo, { spaces: 2 });

            // ضغط النسخة الاحتياطية (اختياري)
            // Compress backup (optional)
            if (config.backup.compress) {
                await this.compressBackup(backupDir);
            }

            // تنظيف النسخ الاحتياطية القديمة
            // Cleanup old backups
            await this.cleanupOldBackups();

            logger.info(`تم إنشاء نسخة احتياطية بنجاح - Backup created successfully: ${backupName}`);
            return backupName;

        } catch (error) {
            logger.error('خطأ في إنشاء النسخة الاحتياطية - Error creating backup:', error);
            throw error;
        }
    }

    /**
     * استعادة نسخة احتياطية
     * Restore backup
     */
    async restoreBackup(backupName) {
        try {
            const backupDir = path.join(this.backupPath, backupName);
            
            if (!fs.existsSync(backupDir)) {
                throw new Error(`النسخة الاحتياطية غير موجودة - Backup not found: ${backupName}`);
            }

            logger.info(`بدء استعادة النسخة الاحتياطية - Starting backup restore: ${backupName}`);

            // قراءة معلومات النسخة الاحتياطية
            // Read backup info
            const backupInfoPath = path.join(backupDir, 'backup-info.json');
            let backupInfo = {};
            if (fs.existsSync(backupInfoPath)) {
                backupInfo = await fs.readJson(backupInfoPath);
            }

            // استعادة قاعدة البيانات
            // Restore database
            const dbBackupPath = path.join(backupDir, 'database', 'bot.db');
            if (fs.existsSync(dbBackupPath)) {
                await fs.copy(dbBackupPath, config.database.path);
                logger.info('تم استعادة قاعدة البيانات - Database restored');
            }

            // استعادة ملفات الإعدادات
            // Restore config files
            const configBackupPath = path.join(backupDir, 'config');
            if (fs.existsSync(configBackupPath)) {
                const configFiles = await fs.readdir(configBackupPath);
                for (const file of configFiles) {
                    const sourcePath = path.join(configBackupPath, file);
                    const targetPath = path.join(process.cwd(), file);
                    await fs.copy(sourcePath, targetPath);
                }
                logger.info('تم استعادة ملفات الإعدادات - Config files restored');
            }

            // استعادة السكريبتات
            // Restore scripts
            const scriptsBackupPath = path.join(backupDir, 'scripts');
            if (fs.existsSync(scriptsBackupPath)) {
                await fs.copy(scriptsBackupPath, config.paths.scripts);
                logger.info('تم استعادة السكريبتات - Scripts restored');
            }

            // استعادة ملفات اللغات
            // Restore language files
            const languagesBackupPath = path.join(backupDir, 'languages');
            if (fs.existsSync(languagesBackupPath)) {
                await fs.copy(languagesBackupPath, config.paths.languages);
                logger.info('تم استعادة ملفات اللغات - Language files restored');
            }

            logger.info(`تم استعادة النسخة الاحتياطية بنجاح - Backup restored successfully: ${backupName}`);
            return true;

        } catch (error) {
            logger.error('خطأ في استعادة النسخة الاحتياطية - Error restoring backup:', error);
            throw error;
        }
    }

    /**
     * الحصول على قائمة النسخ الاحتياطية
     * Get list of backups
     */
    async getBackupsList() {
        try {
            const backups = [];
            const items = await fs.readdir(this.backupPath);

            for (const item of items) {
                const itemPath = path.join(this.backupPath, item);
                const stat = await fs.stat(itemPath);
                
                if (stat.isDirectory()) {
                    const infoPath = path.join(itemPath, 'backup-info.json');
                    let info = {
                        name: item,
                        timestamp: stat.mtime.toISOString(),
                        size: await this.getDirectorySize(itemPath)
                    };

                    if (fs.existsSync(infoPath)) {
                        const backupInfo = await fs.readJson(infoPath);
                        info = { ...info, ...backupInfo };
                    }

                    backups.push(info);
                }
            }

            // ترتيب حسب التاريخ (الأحدث أولاً)
            // Sort by date (newest first)
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return backups;

        } catch (error) {
            logger.error('خطأ في الحصول على قائمة النسخ الاحتياطية - Error getting backups list:', error);
            return [];
        }
    }

    /**
     * حذف نسخة احتياطية
     * Delete backup
     */
    async deleteBackup(backupName) {
        try {
            const backupPath = path.join(this.backupPath, backupName);
            
            if (!fs.existsSync(backupPath)) {
                throw new Error(`النسخة الاحتياطية غير موجودة - Backup not found: ${backupName}`);
            }

            await fs.remove(backupPath);
            logger.info(`تم حذف النسخة الاحتياطية - Backup deleted: ${backupName}`);
            return true;

        } catch (error) {
            logger.error('خطأ في حذف النسخة الاحتياطية - Error deleting backup:', error);
            throw error;
        }
    }

    /**
     * تنظيف النسخ الاحتياطية القديمة
     * Cleanup old backups
     */
    async cleanupOldBackups() {
        try {
            const backups = await this.getBackupsList();
            
            if (backups.length > this.maxBackups) {
                const backupsToDelete = backups.slice(this.maxBackups);
                
                for (const backup of backupsToDelete) {
                    await this.deleteBackup(backup.name);
                }
                
                logger.info(`تم تنظيف ${backupsToDelete.length} نسخة احتياطية قديمة - Cleaned up ${backupsToDelete.length} old backups`);
            }

        } catch (error) {
            logger.error('خطأ في تنظيف النسخ الاحتياطية القديمة - Error cleaning up old backups:', error);
        }
    }

    /**
     * حساب حجم المجلد
     * Calculate directory size
     */
    async getDirectorySize(dirPath) {
        try {
            let size = 0;
            const items = await fs.readdir(dirPath);

            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = await fs.stat(itemPath);
                
                if (stat.isDirectory()) {
                    size += await this.getDirectorySize(itemPath);
                } else {
                    size += stat.size;
                }
            }

            return size;

        } catch (error) {
            logger.error('خطأ في حساب حجم المجلد - Error calculating directory size:', error);
            return 0;
        }
    }

    /**
     * ضغط النسخة الاحتياطية
     * Compress backup
     */
    async compressBackup(backupDir) {
        try {
            const archivePath = `${backupDir}.tar.gz`;
            execSync(`tar -czf "${archivePath}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`);
            
            // حذف المجلد غير المضغوط
            // Remove uncompressed directory
            await fs.remove(backupDir);
            
            logger.info(`تم ضغط النسخة الاحتياطية - Backup compressed: ${path.basename(archivePath)}`);
            return archivePath;

        } catch (error) {
            logger.error('خطأ في ضغط النسخة الاحتياطية - Error compressing backup:', error);
            throw error;
        }
    }

    /**
     * تصدير النسخة الاحتياطية
     * Export backup
     */
    async exportBackup(backupName, exportPath) {
        try {
            const backupDir = path.join(this.backupPath, backupName);
            
            if (!fs.existsSync(backupDir)) {
                throw new Error(`النسخة الاحتياطية غير موجودة - Backup not found: ${backupName}`);
            }

            await fs.copy(backupDir, exportPath);
            logger.info(`تم تصدير النسخة الاحتياطية - Backup exported to: ${exportPath}`);
            return true;

        } catch (error) {
            logger.error('خطأ في تصدير النسخة الاحتياطية - Error exporting backup:', error);
            throw error;
        }
    }
}

module.exports = new BackupManager();