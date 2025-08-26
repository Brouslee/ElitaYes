const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const logger = require('../core/logger');

/**
 * معالج الأحداث
 * Event Handler
 */

class EventHandler extends EventEmitter {
    constructor(bot) {
        super();
        this.bot = bot;
        this.events = new Map();
        this.eventListeners = new Map();
        this.eventsPath = path.join(__dirname, '../events');
    }

    /**
     * تحميل جميع الأحداث
     * Load all events
     */
    async loadEvents() {
        try {
            logger.info('بدء تحميل الأحداث - Starting to load events...');

            // مسح الأحداث المحملة سابقاً
            // Clear previously loaded events
            this.unloadAllEvents();

            // التحقق من وجود مجلد الأحداث
            // Check if events directory exists
            try {
                await fs.access(this.eventsPath);
            } catch (error) {
                logger.warn('مجلد الأحداث غير موجود - Events directory does not exist, creating...');
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
                    logger.error(`فشل في تحميل الحدث - Failed to load event ${file}:`, error);
                    failedCount++;
                }
            }

            logger.info(`تم تحميل ${loadedCount} حدث بنجاح، فشل ${failedCount} - Loaded ${loadedCount} events successfully, ${failedCount} failed`);

        } catch (error) {
            logger.error('خطأ في تحميل الأحداث - Error loading events:', error);
            throw error;
        }
    }

    /**
     * تحميل حدث واحد
     * Load single event
     */
    async loadEvent(filename) {
        const filePath = path.join(this.eventsPath, filename);
        
        try {
            // حذف الحدث من الكاش لإعادة التحميل
            // Delete from cache for reload
            delete require.cache[require.resolve(filePath)];
            
            // تحميل الحدث
            // Load event
            const eventModule = require(filePath);
            
            // التحقق من صحة بنية الحدث
            // Validate event structure
            if (!this.validateEvent(eventModule)) {
                throw new Error(`بنية الحدث غير صحيحة - Invalid event structure: ${filename}`);
            }

            // تسجيل الحدث
            // Register event
            this.events.set(eventModule.config.name, eventModule);

            // ربط مستمع الحدث
            // Bind event listener
            this.bindEventListener(eventModule);

            logger.debug(`تم تحميل الحدث - Event loaded: ${eventModule.config.name}`);

        } catch (error) {
            logger.error(`خطأ في تحميل الحدث - Error loading event ${filename}:`, error);
            throw error;
        }
    }

    /**
     * التحقق من صحة بنية الحدث
     * Validate event structure
     */
    validateEvent(event) {
        // التحقق من وجود الخصائص المطلوبة
        // Check required properties
        if (!event.config || !event.run) {
            return false;
        }

        if (!event.config.name || typeof event.config.name !== 'string') {
            return false;
        }

        if (!event.config.event || typeof event.config.event !== 'string') {
            return false;
        }

        if (typeof event.run !== 'function') {
            return false;
        }

        return true;
    }

    /**
     * ربط مستمع الحدث
     * Bind event listener
     */
    bindEventListener(eventModule) {
        const { event, name } = eventModule.config;
        const listener = async (...args) => {
            try {
                // إنشاء كائن السياق
                // Create context object
                const context = {
                    bot: this.bot,
                    eventName: event,
                    data: args[0] || {},
                    timestamp: new Date()
                };

                logger.debug(`تنفيذ حدث - Executing event: ${name} for ${event}`);
                
                // تنفيذ الحدث
                // Execute event
                await eventModule.run(context, ...args);

            } catch (error) {
                logger.error(`خطأ في تنفيذ الحدث - Error executing event ${name}:`, error);
            }
        };

        // ربط المستمع بالبوت
        // Bind listener to bot
        if (eventModule.config.once) {
            this.bot.once(event, listener);
        } else {
            this.bot.on(event, listener);
        }

        // حفظ مرجع للمستمع لإزالته لاحقاً
        // Save listener reference for later removal
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push({
            name: name,
            listener: listener,
            once: eventModule.config.once || false
        });
    }

    /**
     * إلغاء تحميل جميع الأحداث
     * Unload all events
     */
    unloadAllEvents() {
        for (const [eventName, listeners] of this.eventListeners) {
            for (const { listener } of listeners) {
                this.bot.removeListener(eventName, listener);
            }
        }

        this.events.clear();
        this.eventListeners.clear();
    }

    /**
     * معالجة حدث
     * Handle event
     */
    async handleEvent(eventName, ...args) {
        try {
            // إرسال الحدث إلى البوت
            // Emit event to bot
            this.bot.emit(eventName, ...args);

            // تسجيل الحدث
            // Log event
            logger.debug(`تم إرسال الحدث - Event emitted: ${eventName}`);

        } catch (error) {
            logger.error(`خطأ في معالجة الحدث - Error handling event ${eventName}:`, error);
        }
    }

    /**
     * إضافة مستمع مخصص
     * Add custom listener
     */
    addCustomListener(eventName, listener, once = false) {
        try {
            if (once) {
                this.bot.once(eventName, listener);
            } else {
                this.bot.on(eventName, listener);
            }

            // حفظ مرجع للمستمع
            // Save listener reference
            if (!this.eventListeners.has(eventName)) {
                this.eventListeners.set(eventName, []);
            }
            this.eventListeners.get(eventName).push({
                name: 'custom',
                listener: listener,
                once: once
            });

            logger.debug(`تم إضافة مستمع مخصص - Custom listener added for: ${eventName}`);

        } catch (error) {
            logger.error(`خطأ في إضافة مستمع مخصص - Error adding custom listener:`, error);
        }
    }

    /**
     * إزالة مستمع مخصص
     * Remove custom listener
     */
    removeCustomListener(eventName, listener) {
        try {
            this.bot.removeListener(eventName, listener);

            // إزالة من قائمة المستمعين
            // Remove from listeners list
            if (this.eventListeners.has(eventName)) {
                const listeners = this.eventListeners.get(eventName);
                const index = listeners.findIndex(l => l.listener === listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }

            logger.debug(`تم إزالة مستمع مخصص - Custom listener removed for: ${eventName}`);

        } catch (error) {
            logger.error(`خطأ في إزالة مستمع مخصص - Error removing custom listener:`, error);
        }
    }

    /**
     * الحصول على قائمة الأحداث
     * Get event list
     */
    getEventList() {
        const eventList = [];
        
        for (const [name, event] of this.events) {
            eventList.push({
                name: name,
                event: event.config.event,
                description: event.config.description || 'لا يوجد وصف - No description',
                once: event.config.once || false,
                priority: event.config.priority || 0
            });
        }

        return eventList.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    /**
     * الحصول على عدد الأحداث المحملة
     * Get loaded events count
     */
    getEventCount() {
        return this.events.size;
    }

    /**
     * الحصول على إحصائيات المستمعين
     * Get listener statistics
     */
    getListenerStats() {
        const stats = {
            totalEvents: this.events.size,
            totalListeners: 0,
            eventBreakdown: {}
        };

        for (const [eventName, listeners] of this.eventListeners) {
            stats.totalListeners += listeners.length;
            stats.eventBreakdown[eventName] = listeners.length;
        }

        return stats;
    }

    /**
     * إعادة تحميل حدث معين
     * Reload specific event
     */
    async reloadEvent(eventName) {
        try {
            const event = this.events.get(eventName);
            
            if (!event) {
                throw new Error(`الحدث غير موجود - Event not found: ${eventName}`);
            }

            // العثور على ملف الحدث
            // Find event file
            const files = await fs.readdir(this.eventsPath);
            const eventFile = files.find(file => {
                const filePath = path.join(this.eventsPath, file);
                try {
                    const evt = require(filePath);
                    return evt.config.name === event.config.name;
                } catch {
                    return false;
                }
            });

            if (!eventFile) {
                throw new Error(`ملف الحدث غير موجود - Event file not found: ${eventName}`);
            }

            // إزالة المستمعين الحاليين
            // Remove current listeners
            const eventType = event.config.event;
            if (this.eventListeners.has(eventType)) {
                const listeners = this.eventListeners.get(eventType);
                for (const { listener } of listeners.filter(l => l.name === eventName)) {
                    this.bot.removeListener(eventType, listener);
                }
                this.eventListeners.set(eventType, listeners.filter(l => l.name !== eventName));
            }

            // إزالة الحدث من الخريطة
            // Remove event from map
            this.events.delete(eventName);

            // إعادة تحميل الحدث
            // Reload event
            await this.loadEvent(eventFile);

            logger.info(`تم إعادة تحميل الحدث - Event reloaded: ${eventName}`);

        } catch (error) {
            logger.error(`فشل في إعادة تحميل الحدث - Failed to reload event ${eventName}:`, error);
            throw error;
        }
    }

    /**
     * إيقاف معالج الأحداث
     * Shutdown event handler
     */
    async shutdown() {
        try {
            logger.info('إيقاف معالج الأحداث - Shutting down event handler...');
            
            // إلغاء جميع المستمعين
            // Remove all listeners
            this.unloadAllEvents();

            logger.info('تم إيقاف معالج الأحداث - Event handler shutdown completed');

        } catch (error) {
            logger.error('خطأ في إيقاف معالج الأحداث - Error shutting down event handler:', error);
        }
    }
}

module.exports = EventHandler;
