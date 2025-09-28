const fs = require('fs').promises;
const path = require('path');
const logger = require('../core/logger');

/**
 * معالج أحداث بوت ELITA
 * ELITA Event Handler
 * 
 * تم إنشاؤه بواسطة محمد العكاري - Created by Mohammed Al-Akari
 */

class EventHandler {
    constructor(bot) {
        this.bot = bot;
        this.events = new Map();
        this.eventsPath = path.join(__dirname, '../events');
    }

    /**
     * تحميل جميع الأحداث
     * Load all events
     */
    async loadEvents() {
        try {
            logger.info('Loading events from directory...');

            // مسح الأحداث المحملة سابقاً
            // Clear previously loaded events
            this.events.clear();

            // التحقق من وجود مجلد الأحداث
            // Check if events directory exists
            try {
                await fs.access(this.eventsPath);
            } catch (error) {
                logger.warn('Events directory does not exist, creating...');
                await fs.mkdir(this.eventsPath, { recursive: true });
                return;
            }

            // قراءة ملفات الأحداث
            // Read event files
            const files = await fs.readdir(this.eventsPath);
            const jsFiles = files.filter(file => file.endsWith('.js'));

            let loadedCount = 0;
            let failedCount = 0;

            for (const file of jsFiles) {
                try {
                    await this.loadEvent(file);
                    loadedCount++;
                } catch (error) {
                    logger.error(`Failed to load event ${file}:`, error);
                    failedCount++;
                }
            }

            logger.info(`Events loaded: ${loadedCount}, Failed: ${failedCount}`);

        } catch (error) {
            logger.error('Failed to load events:', error);
            throw error;
        }
    }

    /**
     * تحميل حدث واحد
     * Load single event
     */
    async loadEvent(filename) {
        try {
            const eventPath = path.join(this.eventsPath, filename);
            
            // حذف من الذاكرة المؤقتة إن وجد
            // Delete from cache if exists
            delete require.cache[require.resolve(eventPath)];
            
            const eventModule = require(eventPath);
            
            if (!eventModule.name || !eventModule.execute) {
                throw new Error(`Event ${filename} is missing required properties (name, execute)`);
            }

            // تسجيل الحدث
            // Register event
            this.events.set(eventModule.name, eventModule);
            logger.debug(`Event loaded: ${eventModule.name}`);

        } catch (error) {
            logger.error(`Failed to load event ${filename}:`, error);
            throw error;
        }
    }

    /**
     * تنفيذ حدث
     * Execute event
     */
    async executeEvent(eventName, ...args) {
        try {
            const event = this.events.get(eventName);
            
            if (!event) {
                logger.debug(`Event '${eventName}' not found`);
                return;
            }

            if (typeof event.execute !== 'function') {
                logger.error(`Event '${eventName}' execute method is not a function`);
                return;
            }

            await event.execute(this.bot, ...args);
            logger.debug(`Event executed: ${eventName}`);

        } catch (error) {
            logger.error(`Error executing event '${eventName}':`, error);
        }
    }

    /**
     * الحصول على قائمة الأحداث
     * Get events list
     */
    getEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * التحقق من وجود حدث
     * Check if event exists
     */
    hasEvent(eventName) {
        return this.events.has(eventName);
    }

    /**
     * إعادة تحميل حدث
     * Reload event
     */
    async reloadEvent(eventName) {
        try {
            // البحث عن ملف الحدث
            // Find event file
            const files = await fs.readdir(this.eventsPath);
            const eventFile = files.find(file => {
                const eventPath = path.join(this.eventsPath, file);
                const eventModule = require(eventPath);
                return eventModule.name === eventName;
            });

            if (!eventFile) {
                throw new Error(`Event file not found for: ${eventName}`);
            }

            // إعادة تحميل الحدث
            // Reload event
            await this.loadEvent(eventFile);
            logger.info(`Event reloaded: ${eventName}`);

        } catch (error) {
            logger.error(`Failed to reload event '${eventName}':`, error);
            throw error;
        }
    }

    /**
     * إلغاء تحميل حدث
     * Unload event
     */
    unloadEvent(eventName) {
        try {
            if (this.events.has(eventName)) {
                this.events.delete(eventName);
                logger.info(`Event unloaded: ${eventName}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`Failed to unload event '${eventName}':`, error);
            return false;
        }
    }

    /**
     * الحصول على معلومات حدث
     * Get event info
     */
    getEventInfo(eventName) {
        const event = this.events.get(eventName);
        if (!event) {
            return null;
        }

        return {
            name: event.name,
            description: event.description || 'No description',
            category: event.category || 'general',
            priority: event.priority || 0
        };
    }

    /**
     * تنظيف الموارد
     * Cleanup resources
     */
    cleanup() {
        try {
            this.events.clear();
            logger.info('Event handler cleaned up');
        } catch (error) {
            logger.error('Error cleaning up event handler:', error);
        }
    }
}

module.exports = EventHandler;