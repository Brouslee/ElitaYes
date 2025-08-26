const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../core/logger');
const { getText } = require('./language');
const backup = require('./backup');

/**
 * نظام التحديث التلقائي
 * Automatic Update System
 */

class UpdateManager {
    constructor() {
        this.currentVersion = config.bot.version;
        this.updateSource = config.autoUpdate.source;
        this.isUpdating = false;
        this.updateInterval = null;
        
        if (config.autoUpdate.enable) {
            this.startAutoUpdateCheck();
        }
    }

    /**
     * بدء فحص التحديثات التلقائي
     * Start automatic update checking
     */
    startAutoUpdateCheck() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        const interval = config.autoUpdate.checkInterval || 86400000; // يوم واحد افتراضياً - 1 day default
        
        this.updateInterval = setInterval(() => {
            this.checkForUpdates().catch(error => {
                logger.error('خطأ في فحص التحديثات - Auto update check error:', error);
            });
        }, interval);

        logger.info(`تم بدء فحص التحديثات التلقائي - Auto update check started (interval: ${interval}ms)`);
    }

    /**
     * إيقاف فحص التحديثات التلقائي
     * Stop automatic update checking
     */
    stopAutoUpdateCheck() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        logger.info('تم إيقاف فحص التحديثات التلقائي - Auto update check stopped');
    }

    /**
     * فحص التحديثات المتاحة
     * Check for available updates
     */
    async checkForUpdates() {
        try {
            logger.info('فحص التحديثات المتاحة - Checking for updates...');
            
            if (!this.updateSource) {
                logger.warn('مصدر التحديثات غير محدد - Update source not configured');
                return null;
            }

            const response = await axios.get(this.updateSource, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Instagram-Bot-Framework'
                }
            });

            const latestVersion = response.data.tag_name || response.data.version;
            
            if (!latestVersion) {
                logger.warn('لم يتم العثور على معلومات الإصدار - Version information not found');
                return null;
            }

            const updateInfo = {
                latestVersion,
                currentVersion: this.currentVersion,
                hasUpdate: this.compareVersions(latestVersion, this.currentVersion) > 0,
                releaseDate: response.data.published_at || response.data.created_at,
                description: response.data.body || response.data.description || '',
                downloadUrl: response.data.assets?.[0]?.browser_download_url || response.data.zipball_url,
                size: response.data.assets?.[0]?.size || 0
            };

            if (updateInfo.hasUpdate) {
                logger.info(`تحديث متاح - Update available: ${this.currentVersion} -> ${latestVersion}`);
                
                if (config.autoUpdate.autoDownload) {
                    await this.downloadUpdate(updateInfo);
                }
            } else {
                logger.info('لا توجد تحديثات متاحة - No updates available');
            }

            return updateInfo;

        } catch (error) {
            logger.error('خطأ في فحص التحديثات - Error checking for updates:', error);
            return null;
        }
    }

    /**
     * تحميل التحديث
     * Download update
     */
    async downloadUpdate(updateInfo) {
        try {
            if (!updateInfo.downloadUrl) {
                throw new Error('رابط التحميل غير متاح - Download URL not available');
            }

            logger.info(`تحميل التحديث - Downloading update: ${updateInfo.latestVersion}`);

            const tempDir = path.join(config.paths.temp, 'update');
            await fs.ensureDir(tempDir);

            const updateFileName = `update-${updateInfo.latestVersion}.zip`;
            const updateFilePath = path.join(tempDir, updateFileName);

            // تحميل ملف التحديث
            // Download update file
            const response = await axios({
                method: 'GET',
                url: updateInfo.downloadUrl,
                responseType: 'stream',
                timeout: 300000 // 5 دقائق - 5 minutes
            });

            const writeStream = fs.createWriteStream(updateFilePath);
            response.data.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            logger.info(`تم تحميل التحديث - Update downloaded: ${updateFileName}`);
            return updateFilePath;

        } catch (error) {
            logger.error('خطأ في تحميل التحديث - Error downloading update:', error);
            throw error;
        }
    }

    /**
     * تطبيق التحديث
     * Apply update
     */
    async applyUpdate(updateFilePath) {
        try {
            if (this.isUpdating) {
                throw new Error('التحديث جاري بالفعل - Update already in progress');
            }

            this.isUpdating = true;
            logger.info(getText('bot', 'update'));

            // إنشاء نسخة احتياطية قبل التحديث
            // Create backup before update
            logger.info('إنشاء نسخة احتياطية قبل التحديث - Creating backup before update...');
            const backupName = await backup.createBackup(`pre-update-${Date.now()}`);

            // فك ضغط ملف التحديث
            // Extract update file
            const tempDir = path.dirname(updateFilePath);
            const extractDir = path.join(tempDir, 'extracted');
            await fs.ensureDir(extractDir);

            logger.info('فك ضغط ملف التحديث - Extracting update file...');
            execSync(`unzip -q "${updateFilePath}" -d "${extractDir}"`);

            // نسخ الملفات المحدثة
            // Copy updated files
            logger.info('تطبيق الملفات المحدثة - Applying updated files...');
            const extractedContents = await fs.readdir(extractDir);
            const updateDir = extractedContents.length === 1 ? 
                path.join(extractDir, extractedContents[0]) : extractDir;

            // قائمة الملفات التي يجب تجاهلها
            // List of files to ignore
            const ignoreFiles = [
                'config/config.js',
                'configCommands.json',
                'data',
                'logs',
                'backups',
                'node_modules',
                '.env',
                'package-lock.json'
            ];

            await this.copyFilesSelectively(updateDir, process.cwd(), ignoreFiles);

            // تحديث package.json والتبعيات
            // Update package.json and dependencies
            await this.updateDependencies(updateDir);

            // تنظيف الملفات المؤقتة
            // Cleanup temporary files
            await fs.remove(tempDir);

            logger.info('تم تطبيق التحديث بنجاح - Update applied successfully');
            this.isUpdating = false;

            return backupName;

        } catch (error) {
            logger.error('خطأ في تطبيق التحديث - Error applying update:', error);
            this.isUpdating = false;
            throw error;
        }
    }

    /**
     * نسخ الملفات بشكل انتقائي
     * Copy files selectively
     */
    async copyFilesSelectively(sourceDir, targetDir, ignoreList = []) {
        try {
            const items = await fs.readdir(sourceDir);

            for (const item of items) {
                // تجاهل الملفات المحددة
                // Skip specified files
                if (ignoreList.some(ignore => item.includes(ignore))) {
                    continue;
                }

                const sourcePath = path.join(sourceDir, item);
                const targetPath = path.join(targetDir, item);
                const stat = await fs.stat(sourcePath);

                if (stat.isDirectory()) {
                    await fs.ensureDir(targetPath);
                    await this.copyFilesSelectively(sourcePath, targetPath, ignoreList);
                } else {
                    await fs.copy(sourcePath, targetPath);
                }
            }

        } catch (error) {
            logger.error('خطأ في نسخ الملفات - Error copying files:', error);
            throw error;
        }
    }

    /**
     * تحديث التبعيات
     * Update dependencies
     */
    async updateDependencies(updateDir) {
        try {
            const newPackagePath = path.join(updateDir, 'package.json');
            const currentPackagePath = path.join(process.cwd(), 'package.json');

            if (await fs.pathExists(newPackagePath)) {
                const newPackage = await fs.readJson(newPackagePath);
                const currentPackage = await fs.readJson(currentPackagePath);

                // مقارنة التبعيات
                // Compare dependencies
                const newDeps = newPackage.dependencies || {};
                const currentDeps = currentPackage.dependencies || {};

                let needsInstall = false;
                for (const [dep, version] of Object.entries(newDeps)) {
                    if (!currentDeps[dep] || currentDeps[dep] !== version) {
                        needsInstall = true;
                        break;
                    }
                }

                if (needsInstall) {
                    logger.info('تحديث التبعيات - Updating dependencies...');
                    
                    // نسخ package.json الجديد
                    // Copy new package.json
                    await fs.copy(newPackagePath, currentPackagePath);
                    
                    // تثبيت التبعيات
                    // Install dependencies
                    execSync('npm install', { 
                        cwd: process.cwd(),
                        stdio: 'inherit'
                    });
                    
                    logger.info('تم تحديث التبعيات - Dependencies updated');
                }
            }

        } catch (error) {
            logger.error('خطأ في تحديث التبعيات - Error updating dependencies:', error);
            throw error;
        }
    }

    /**
     * التراجع عن التحديث
     * Rollback update
     */
    async rollbackUpdate(backupName) {
        try {
            logger.info(`التراجع عن التحديث - Rolling back update using backup: ${backupName}`);
            
            await backup.restoreBackup(backupName);
            
            logger.info('تم التراجع عن التحديث بنجاح - Update rollback successful');
            return true;

        } catch (error) {
            logger.error('خطأ في التراجع عن التحديث - Error rolling back update:', error);
            throw error;
        }
    }

    /**
     * مقارنة الإصدارات
     * Compare versions
     */
    compareVersions(version1, version2) {
        const v1Parts = version1.replace(/^v/, '').split('.');
        const v2Parts = version2.replace(/^v/, '').split('.');
        
        const maxLength = Math.max(v1Parts.length, v2Parts.length);
        
        for (let i = 0; i < maxLength; i++) {
            const v1Part = parseInt(v1Parts[i] || '0');
            const v2Part = parseInt(v2Parts[i] || '0');
            
            if (v1Part > v2Part) return 1;
            if (v1Part < v2Part) return -1;
        }
        
        return 0;
    }

    /**
     * الحصول على معلومات الإصدار الحالي
     * Get current version info
     */
    getCurrentVersionInfo() {
        return {
            version: this.currentVersion,
            installDate: fs.statSync(path.join(process.cwd(), 'package.json')).mtime,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        };
    }

    /**
     * فرض التحديث
     * Force update
     */
    async forceUpdate() {
        try {
            const updateInfo = await this.checkForUpdates();
            
            if (!updateInfo || !updateInfo.hasUpdate) {
                throw new Error('لا توجد تحديثات متاحة - No updates available');
            }

            const updateFilePath = await this.downloadUpdate(updateInfo);
            const backupName = await this.applyUpdate(updateFilePath);
            
            return {
                success: true,
                backupName,
                version: updateInfo.latestVersion
            };

        } catch (error) {
            logger.error('خطأ في فرض التحديث - Error forcing update:', error);
            throw error;
        }
    }
}

module.exports = new UpdateManager();