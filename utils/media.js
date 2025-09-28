/**
 * نظام معالجة الوسائط لبوت ELITA
 * ELITA Media Handling System
 * 
 * تم إنشاؤه بواسطة محمد العكاري - Created by Mohammed Al-Akari
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../core/logger');
const Helpers = require('./helpers');

/**
 * فئة نظام الوسائط
 * Media System Class
 */
class MediaSystem {
    constructor() {
        this.supportedImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        this.supportedVideoFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
        this.supportedAudioFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.mediaDir = path.join(__dirname, '../data/media');
        this.tempDir = path.join(__dirname, '../data/temp');
        this.ensureDirectories();
    }

    /**
     * التأكد من وجود المجلدات المطلوبة
     * Ensure required directories exist
     */
    async ensureDirectories() {
        try {
            await fs.ensureDir(this.mediaDir);
            await fs.ensureDir(this.tempDir);
            await fs.ensureDir(path.join(this.mediaDir, 'images'));
            await fs.ensureDir(path.join(this.mediaDir, 'videos'));
            await fs.ensureDir(path.join(this.mediaDir, 'audio'));
            await fs.ensureDir(path.join(this.mediaDir, 'documents'));
        } catch (error) {
            logger.error('فشل في إنشاء مجلدات الوسائط - Failed to create media directories:', error);
        }
    }

    /**
     * إنشاء كائن صورة
     * Create image object
     * @param {Object} imageConfig - إعدادات الصورة
     * @returns {Object} - كائن الصورة
     */
    createImage(imageConfig) {
        const {
            url,
            filePath,
            caption = '',
            alt = '',
            width,
            height,
            thumbnail,
            metadata = {}
        } = imageConfig;

        if (!url && !filePath) {
            throw new Error('مطلوب رابط الصورة أو مسار الملف - Image URL or file path is required');
        }

        return {
            type: 'image',
            url,
            filePath,
            caption,
            alt,
            width,
            height,
            thumbnail,
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                id: this.generateMediaId()
            }
        };
    }

    /**
     * إنشاء كائن فيديو
     * Create video object
     * @param {Object} videoConfig - إعدادات الفيديو
     * @returns {Object} - كائن الفيديو
     */
    createVideo(videoConfig) {
        const {
            url,
            filePath,
            caption = '',
            duration,
            width,
            height,
            thumbnail,
            autoplay = false,
            muted = false,
            metadata = {}
        } = videoConfig;

        if (!url && !filePath) {
            throw new Error('مطلوب رابط الفيديو أو مسار الملف - Video URL or file path is required');
        }

        return {
            type: 'video',
            url,
            filePath,
            caption,
            duration,
            width,
            height,
            thumbnail,
            autoplay,
            muted,
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                id: this.generateMediaId()
            }
        };
    }

    /**
     * إنشاء كائن صوتي
     * Create audio object
     * @param {Object} audioConfig - إعدادات الصوت
     * @returns {Object} - كائن الصوت
     */
    createAudio(audioConfig) {
        const {
            url,
            filePath,
            title = '',
            artist = '',
            duration,
            waveform,
            metadata = {}
        } = audioConfig;

        if (!url && !filePath) {
            throw new Error('مطلوب رابط الصوت أو مسار الملف - Audio URL or file path is required');
        }

        return {
            type: 'audio',
            url,
            filePath,
            title,
            artist,
            duration,
            waveform,
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                id: this.generateMediaId()
            }
        };
    }

    /**
     * إنشاء كائن مستند
     * Create document object
     * @param {Object} documentConfig - إعدادات المستند
     * @returns {Object} - كائن المستند
     */
    createDocument(documentConfig) {
        const {
            url,
            filePath,
            fileName,
            fileSize,
            mimeType,
            caption = '',
            metadata = {}
        } = documentConfig;

        if (!url && !filePath) {
            throw new Error('مطلوب رابط المستند أو مسار الملف - Document URL or file path is required');
        }

        return {
            type: 'document',
            url,
            filePath,
            fileName,
            fileSize,
            mimeType,
            caption,
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                id: this.generateMediaId()
            }
        };
    }

    /**
     * إنشاء معرض صور
     * Create image gallery
     * @param {Array} images - مصفوفة الصور
     * @param {Object} options - خيارات المعرض
     * @returns {Object} - كائن المعرض
     */
    createGallery(images, options = {}) {
        const {
            caption = '',
            layout = 'grid', // grid, carousel, list
            maxItems = 10,
            allowNavigation = true
        } = options;

        if (!Array.isArray(images) || images.length === 0) {
            throw new Error('مطلوب مصفوفة صور غير فارغة - Non-empty array of images is required');
        }

        const limitedImages = images.slice(0, maxItems);

        return {
            type: 'gallery',
            images: limitedImages,
            caption,
            layout,
            allowNavigation,
            itemCount: limitedImages.length,
            metadata: {
                createdAt: Date.now(),
                id: this.generateMediaId(),
                originalCount: images.length
            }
        };
    }

    /**
     * إنشاء story
     * Create story
     * @param {Object} storyConfig - إعدادات الـ story
     * @returns {Object} - كائن الـ story
     */
    createStory(storyConfig) {
        const {
            media, // صورة أو فيديو
            duration = 15000, // 15 ثانية افتراضياً
            text = '',
            stickers = [],
            music,
            backgroundColor = '#000000',
            metadata = {}
        } = storyConfig;

        if (!media) {
            throw new Error('مطلوب محتوى الـ story - Story media is required');
        }

        return {
            type: 'story',
            media,
            duration,
            text,
            stickers,
            music,
            backgroundColor,
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                id: this.generateMediaId(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعة
            }
        };
    }

    /**
     * تحميل ملف وسائط
     * Upload media file
     * @param {string} filePath - مسار الملف
     * @param {Object} options - خيارات التحميل
     * @returns {Object} - معلومات الملف المحمل
     */
    async uploadMedia(filePath, options = {}) {
        try {
            const {
                category = 'general', // images, videos, audio, documents
                generateThumbnail = true,
                compress = false
            } = options;

            // التحقق من وجود الملف
            if (!await fs.pathExists(filePath)) {
                throw new Error('الملف غير موجود - File does not exist');
            }

            // الحصول على معلومات الملف
            const fileStats = await fs.stat(filePath);
            const fileName = path.basename(filePath);
            const fileExtension = path.extname(fileName).toLowerCase().replace('.', '');
            
            // التحقق من حجم الملف
            if (fileStats.size > this.maxFileSize) {
                throw new Error(`حجم الملف كبير جداً. الحد الأقصى: ${this.maxFileSize / (1024 * 1024)}MB`);
            }

            // تحديد نوع الملف
            const mediaType = this.getMediaType(fileExtension);
            
            // إنشاء اسم ملف فريد
            const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
            const destinationDir = path.join(this.mediaDir, category);
            const destinationPath = path.join(destinationDir, uniqueFileName);

            // التأكد من وجود المجلد
            await fs.ensureDir(destinationDir);

            // نسخ الملف
            await fs.copy(filePath, destinationPath);

            const uploadedFile = {
                originalName: fileName,
                fileName: uniqueFileName,
                filePath: destinationPath,
                size: fileStats.size,
                type: mediaType,
                extension: fileExtension,
                category,
                uploadedAt: Date.now(),
                id: this.generateMediaId()
            };

            // إنشاء صورة مصغرة للصور والفيديوهات
            if (generateThumbnail && (mediaType === 'image' || mediaType === 'video')) {
                uploadedFile.thumbnail = await this.generateThumbnail(destinationPath);
            }

            logger.info(`تم رفع ملف وسائط - Media file uploaded: ${fileName}`);
            return uploadedFile;

        } catch (error) {
            logger.error('فشل في رفع ملف الوسائط - Failed to upload media file:', error);
            throw error;
        }
    }

    /**
     * إنشاء صورة مصغرة
     * Generate thumbnail
     * @param {string} filePath - مسار الملف
     * @returns {string} - مسار الصورة المصغرة
     */
    async generateThumbnail(filePath) {
        try {
            // في التطبيق الحقيقي، هنا ستكون عملية إنشاء الصورة المصغرة
            // For real implementation, thumbnail generation would happen here
            
            const fileName = path.basename(filePath, path.extname(filePath));
            const thumbnailPath = path.join(this.mediaDir, 'thumbnails', `${fileName}_thumb.jpg`);
            
            // محاكاة إنشاء صورة مصغرة
            // Simulate thumbnail generation
            await fs.ensureDir(path.dirname(thumbnailPath));
            await fs.copy(filePath, thumbnailPath); // مؤقتاً نسخ نفس الملف
            
            return thumbnailPath;
        } catch (error) {
            logger.error('فشل في إنشاء صورة مصغرة - Failed to generate thumbnail:', error);
            return null;
        }
    }

    /**
     * تحديد نوع الوسائط
     * Determine media type
     * @param {string} extension - امتداد الملف
     * @returns {string} - نوع الوسائط
     */
    getMediaType(extension) {
        if (this.supportedImageFormats.includes(extension)) return 'image';
        if (this.supportedVideoFormats.includes(extension)) return 'video';
        if (this.supportedAudioFormats.includes(extension)) return 'audio';
        return 'document';
    }

    /**
     * إنشاء معرف فريد للوسائط
     * Generate unique media ID
     * @returns {string} - المعرف الفريد
     */
    generateMediaId() {
        return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * تنسيق الوسائط للعرض
     * Format media for display
     * @param {Object} media - كائن الوسائط
     * @returns {string} - النص المنسق
     */
    formatMediaForDisplay(media) {
        let display = '';

        switch (media.type) {
            case 'image':
                display += `🖼️ **صورة - Image**\n`;
                if (media.caption) display += `📝 ${media.caption}\n`;
                if (media.width && media.height) {
                    display += `📐 الأبعاد: ${media.width}x${media.height}\n`;
                }
                break;

            case 'video':
                display += `🎥 **فيديو - Video**\n`;
                if (media.caption) display += `📝 ${media.caption}\n`;
                if (media.duration) {
                    display += `⏱️ المدة: ${this.formatDuration(media.duration)}\n`;
                }
                break;

            case 'audio':
                display += `🎵 **صوت - Audio**\n`;
                if (media.title) display += `🎼 العنوان: ${media.title}\n`;
                if (media.artist) display += `🎤 الفنان: ${media.artist}\n`;
                if (media.duration) {
                    display += `⏱️ المدة: ${this.formatDuration(media.duration)}\n`;
                }
                break;

            case 'document':
                display += `📄 **مستند - Document**\n`;
                if (media.fileName) display += `📋 اسم الملف: ${media.fileName}\n`;
                if (media.fileSize) {
                    display += `💾 الحجم: ${this.formatFileSize(media.fileSize)}\n`;
                }
                break;

            case 'gallery':
                display += `🖼️ **معرض صور - Image Gallery**\n`;
                display += `📊 عدد الصور: ${media.itemCount}\n`;
                if (media.caption) display += `📝 ${media.caption}\n`;
                break;

            case 'story':
                display += `📱 **ستوري - Story**\n`;
                display += `⏱️ المدة: ${this.formatDuration(media.duration)}\n`;
                if (media.text) display += `📝 النص: ${media.text}\n`;
                break;
        }

        if (media.metadata && media.metadata.id) {
            display += `🆔 المعرف: \`${media.metadata.id}\`\n`;
        }

        return display;
    }

    /**
     * تنسيق المدة
     * Format duration
     * @param {number} milliseconds - المدة بالميلي ثانية
     * @returns {string} - المدة المنسقة
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        } else {
            return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
        }
    }

    /**
     * تنسيق حجم الملف
     * Format file size
     * @param {number} bytes - الحجم بالبايت
     * @returns {string} - الحجم المنسق
     */
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * تنظيف الملفات المؤقتة
     * Clean temporary files
     */
    async cleanTempFiles() {
        try {
            const tempFiles = await fs.readdir(this.tempDir);
            let cleanedCount = 0;

            for (const file of tempFiles) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);
                
                // حذف الملفات الأقدم من ساعة واحدة
                if (Date.now() - stats.mtime.getTime() > 3600000) {
                    await fs.remove(filePath);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                logger.info(`تم حذف ${cleanedCount} ملف مؤقت - Cleaned ${cleanedCount} temporary files`);
            }

            return cleanedCount;
        } catch (error) {
            logger.error('فشل في تنظيف الملفات المؤقتة - Failed to clean temporary files:', error);
            return 0;
        }
    }

    /**
     * الحصول على إحصائيات الوسائط
     * Get media statistics
     * @returns {Object} - الإحصائيات
     */
    async getStatistics() {
        try {
            const categories = ['images', 'videos', 'audio', 'documents'];
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                byCategory: {}
            };

            for (const category of categories) {
                const categoryDir = path.join(this.mediaDir, category);
                
                if (await fs.pathExists(categoryDir)) {
                    const files = await fs.readdir(categoryDir);
                    let categorySize = 0;

                    for (const file of files) {
                        const filePath = path.join(categoryDir, file);
                        const fileStats = await fs.stat(filePath);
                        categorySize += fileStats.size;
                    }

                    stats.byCategory[category] = {
                        count: files.length,
                        size: categorySize
                    };

                    stats.totalFiles += files.length;
                    stats.totalSize += categorySize;
                }
            }

            return stats;
        } catch (error) {
            logger.error('فشل في الحصول على إحصائيات الوسائط - Failed to get media statistics:', error);
            return null;
        }
    }
}

// إنشاء مثيل واحد من نظام الوسائط
const mediaSystem = new MediaSystem();

// تنظيف دوري للملفات المؤقتة
setInterval(() => {
    mediaSystem.cleanTempFiles();
}, 1800000); // كل 30 دقيقة

module.exports = {
    MediaSystem,
    mediaSystem
};