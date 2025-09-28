/**
 * نظام الأزرار التفاعلية لبوت ELITA
 * ELITA Interactive Buttons System
 * 
 * تم إنشاؤه بواسطة محمد العكاري - Created by Mohammed Al-Akari
 */

const logger = require('../core/logger');

/**
 * فئة نظام الأزرار
 * Button System Class
 */
class ButtonSystem {
    constructor() {
        this.activeButtons = new Map(); // تخزين الأزرار النشطة
        this.buttonCallbacks = new Map(); // معالجات الأزرار
        this.buttonData = new Map(); // بيانات الأزرار
    }

    /**
     * إنشاء زر تفاعلي
     * Create interactive button
     * @param {Object} buttonConfig - إعدادات الزر
     * @returns {Object} - كائن الزر
     */
    createButton(buttonConfig) {
        const {
            id,
            text,
            style = 'primary', // primary, secondary, success, danger, warning
            emoji = '',
            action,
            data = {},
            expireAfter = 3600000 // ساعة واحدة بالميلي ثانية
        } = buttonConfig;

        if (!id || !text || !action) {
            throw new Error('معرف الزر والنص والإجراء مطلوبان - Button ID, text, and action are required');
        }

        const button = {
            id,
            text: emoji ? `${emoji} ${text}` : text,
            style,
            action,
            data,
            createdAt: Date.now(),
            expireAfter,
            isActive: true
        };

        // تخزين الزر
        this.activeButtons.set(id, button);
        this.buttonData.set(id, data);

        // إزالة الزر بعد انتهاء صلاحيته
        setTimeout(() => {
            this.removeButton(id);
        }, expireAfter);

        logger.debug(`تم إنشاء زر جديد - New button created: ${id}`);
        return button;
    }

    /**
     * إنشاء مجموعة من الأزرار
     * Create button group
     * @param {Array} buttons - مصفوفة الأزرار
     * @param {Object} options - خيارات المجموعة
     * @returns {Object} - مجموعة الأزرار
     */
    createButtonGroup(buttons, options = {}) {
        const {
            groupId = `group_${Date.now()}`,
            layout = 'vertical', // vertical, horizontal, grid
            maxPerRow = 3,
            title = null,
            footer = null
        } = options;

        const buttonGroup = {
            groupId,
            title,
            footer,
            layout,
            maxPerRow,
            buttons: [],
            createdAt: Date.now()
        };

        // إنشاء الأزرار
        buttons.forEach((buttonConfig, index) => {
            const buttonId = buttonConfig.id || `${groupId}_btn_${index}`;
            const button = this.createButton({
                ...buttonConfig,
                id: buttonId
            });
            buttonGroup.buttons.push(button);
        });

        logger.info(`تم إنشاء مجموعة أزرار - Button group created: ${groupId} with ${buttons.length} buttons`);
        return buttonGroup;
    }

    /**
     * تسجيل معالج الزر
     * Register button handler
     * @param {string} buttonId - معرف الزر
     * @param {Function} callback - دالة المعالجة
     */
    registerButtonHandler(buttonId, callback) {
        if (typeof callback !== 'function') {
            throw new Error('معالج الزر يجب أن يكون دالة - Button handler must be a function');
        }

        this.buttonCallbacks.set(buttonId, callback);
        logger.debug(`تم تسجيل معالج الزر - Button handler registered: ${buttonId}`);
    }

    /**
     * معالجة ضغط الزر
     * Handle button press
     * @param {string} buttonId - معرف الزر
     * @param {Object} context - سياق الضغط
     * @returns {Object} - نتيجة المعالجة
     */
    async handleButtonPress(buttonId, context) {
        try {
            const button = this.activeButtons.get(buttonId);
            
            if (!button) {
                logger.warn(`محاولة ضغط زر غير موجود - Attempt to press non-existent button: ${buttonId}`);
                return {
                    success: false,
                    error: 'الزر غير موجود أو انتهت صلاحيته',
                    errorType: 'BUTTON_NOT_FOUND'
                };
            }

            if (!button.isActive) {
                return {
                    success: false,
                    error: 'الزر غير نشط',
                    errorType: 'BUTTON_INACTIVE'
                };
            }

            // التحقق من انتهاء الصلاحية
            if (Date.now() - button.createdAt > button.expireAfter) {
                this.removeButton(buttonId);
                return {
                    success: false,
                    error: 'انتهت صلاحية الزر',
                    errorType: 'BUTTON_EXPIRED'
                };
            }

            const callback = this.buttonCallbacks.get(buttonId);
            
            if (!callback) {
                logger.warn(`لا يوجد معالج للزر - No handler for button: ${buttonId}`);
                return {
                    success: false,
                    error: 'لا يوجد معالج لهذا الزر',
                    errorType: 'NO_HANDLER'
                };
            }

            // تنفيذ معالج الزر
            logger.info(`تنفيذ معالج الزر - Executing button handler: ${buttonId}`);
            const result = await callback({
                buttonId,
                button,
                data: this.buttonData.get(buttonId),
                context,
                pressedAt: Date.now()
            });

            return {
                success: true,
                result,
                button
            };

        } catch (error) {
            logger.error(`خطأ في معالجة ضغط الزر - Error handling button press ${buttonId}:`, error);
            return {
                success: false,
                error: error.message,
                errorType: 'HANDLER_ERROR'
            };
        }
    }

    /**
     * إزالة زر
     * Remove button
     * @param {string} buttonId - معرف الزر
     */
    removeButton(buttonId) {
        this.activeButtons.delete(buttonId);
        this.buttonCallbacks.delete(buttonId);
        this.buttonData.delete(buttonId);
        logger.debug(`تم حذف الزر - Button removed: ${buttonId}`);
    }

    /**
     * تعطيل زر
     * Disable button
     * @param {string} buttonId - معرف الزر
     */
    disableButton(buttonId) {
        const button = this.activeButtons.get(buttonId);
        if (button) {
            button.isActive = false;
            logger.debug(`تم تعطيل الزر - Button disabled: ${buttonId}`);
        }
    }

    /**
     * تنسيق الأزرار للعرض
     * Format buttons for display
     * @param {Object} buttonGroup - مجموعة الأزرار
     * @returns {string} - النص المنسق
     */
    formatButtonsForDisplay(buttonGroup) {
        let display = '';

        if (buttonGroup.title) {
            display += `**${buttonGroup.title}**\n\n`;
        }

        buttonGroup.buttons.forEach((button, index) => {
            const statusIcon = button.isActive ? '🟢' : '🔴';
            const styleIcon = this.getStyleIcon(button.style);
            
            display += `${styleIcon} **${button.text}** ${statusIcon}\n`;
            display += `   📋 ID: \`${button.id}\`\n`;
            display += `   ⚡ Action: \`${button.action}\`\n\n`;
        });

        if (buttonGroup.footer) {
            display += `\n*${buttonGroup.footer}*`;
        }

        return display;
    }

    /**
     * الحصول على أيقونة النمط
     * Get style icon
     * @param {string} style - نمط الزر
     * @returns {string} - الأيقونة
     */
    getStyleIcon(style) {
        const icons = {
            primary: '🔵',
            secondary: '⚪',
            success: '🟢',
            danger: '🔴',
            warning: '🟡',
            info: '🔵'
        };
        return icons[style] || icons.primary;
    }

    /**
     * إنشاء لوحة أزرار سريعة
     * Create quick button panel
     * @param {Array} quickActions - الإجراءات السريعة
     * @param {Object} context - السياق
     * @returns {Object} - لوحة الأزرار
     */
    createQuickPanel(quickActions, context) {
        const buttons = quickActions.map((action, index) => ({
            id: `quick_${context.userId || 'user'}_${index}_${Date.now()}`,
            text: action.label,
            emoji: action.emoji || '⚡',
            style: action.style || 'primary',
            action: action.action,
            data: action.data || {}
        }));

        return this.createButtonGroup(buttons, {
            groupId: `quick_panel_${Date.now()}`,
            title: '⚡ الإجراءات السريعة - Quick Actions',
            layout: 'grid',
            maxPerRow: 2
        });
    }

    /**
     * إنشاء قائمة تنقل
     * Create navigation menu
     * @param {Array} menuItems - عناصر القائمة
     * @param {Object} options - خيارات القائمة
     * @returns {Object} - قائمة التنقل
     */
    createNavigationMenu(menuItems, options = {}) {
        const {
            currentPage = 1,
            totalPages = 1,
            showPageInfo = true
        } = options;

        const buttons = [];

        // أزرار القائمة
        menuItems.forEach((item, index) => {
            buttons.push({
                id: `nav_${item.id || index}_${Date.now()}`,
                text: item.label,
                emoji: item.emoji || '📋',
                style: item.style || 'secondary',
                action: item.action,
                data: item.data || {}
            });
        });

        // أزرار التنقل
        if (totalPages > 1) {
            if (currentPage > 1) {
                buttons.push({
                    id: `nav_prev_${Date.now()}`,
                    text: 'السابق',
                    emoji: '⬅️',
                    style: 'primary',
                    action: 'navigate',
                    data: { direction: 'prev', page: currentPage - 1 }
                });
            }

            if (currentPage < totalPages) {
                buttons.push({
                    id: `nav_next_${Date.now()}`,
                    text: 'التالي',
                    emoji: '➡️',
                    style: 'primary',
                    action: 'navigate',
                    data: { direction: 'next', page: currentPage + 1 }
                });
            }
        }

        const title = showPageInfo && totalPages > 1 
            ? `📚 القائمة - الصفحة ${currentPage} من ${totalPages}`
            : '📚 القائمة - Menu';

        return this.createButtonGroup(buttons, {
            groupId: `nav_menu_${Date.now()}`,
            title,
            layout: 'vertical'
        });
    }

    /**
     * الحصول على إحصائيات الأزرار
     * Get button statistics
     * @returns {Object} - الإحصائيات
     */
    getStatistics() {
        const now = Date.now();
        const activeButtons = Array.from(this.activeButtons.values());
        
        return {
            total: activeButtons.length,
            active: activeButtons.filter(btn => btn.isActive).length,
            expired: activeButtons.filter(btn => 
                now - btn.createdAt > btn.expireAfter
            ).length,
            byStyle: activeButtons.reduce((acc, btn) => {
                acc[btn.style] = (acc[btn.style] || 0) + 1;
                return acc;
            }, {}),
            oldestButton: activeButtons.length > 0 
                ? Math.min(...activeButtons.map(btn => btn.createdAt))
                : null,
            totalHandlers: this.buttonCallbacks.size
        };
    }

    /**
     * تنظيف الأزرار المنتهية الصلاحية
     * Clean expired buttons
     */
    cleanExpiredButtons() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [buttonId, button] of this.activeButtons.entries()) {
            if (now - button.createdAt > button.expireAfter) {
                this.removeButton(buttonId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`تم تنظيف ${cleanedCount} أزرار منتهية الصلاحية - Cleaned ${cleanedCount} expired buttons`);
        }

        return cleanedCount;
    }
}

// إنشاء مثيل واحد من نظام الأزرار
const buttonSystem = new ButtonSystem();

// تنظيف دوري للأزرار المنتهية الصلاحية
setInterval(() => {
    buttonSystem.cleanExpiredButtons();
}, 300000); // كل 5 دقائق

module.exports = {
    ButtonSystem,
    buttonSystem
};