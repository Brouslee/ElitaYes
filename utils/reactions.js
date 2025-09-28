/**
 * نظام التفاعلات لبوت ELITA
 * ELITA Reactions System
 * 
 * تم إنشاؤه بواسطة محمد العكاري - Created by Mohammed Al-Akari
 */

const logger = require('../core/logger');

/**
 * فئة نظام التفاعلات
 * Reaction System Class
 */
class ReactionSystem {
    constructor() {
        this.supportedReactions = {
            // تفاعلات أساسية - Basic reactions
            like: { emoji: '❤️', name: 'إعجاب', name_en: 'Like' },
            love: { emoji: '😍', name: 'حب', name_en: 'Love' },
            laugh: { emoji: '😂', name: 'ضحك', name_en: 'Laugh' },
            wow: { emoji: '😮', name: 'إعجاب', name_en: 'Wow' },
            sad: { emoji: '😢', name: 'حزن', name_en: 'Sad' },
            angry: { emoji: '😡', name: 'غضب', name_en: 'Angry' },
            
            // تفاعلات إضافية - Additional reactions
            fire: { emoji: '🔥', name: 'نار', name_en: 'Fire' },
            clap: { emoji: '👏', name: 'تصفيق', name_en: 'Clap' },
            thumbs_up: { emoji: '👍', name: 'موافق', name_en: 'Thumbs Up' },
            thumbs_down: { emoji: '👎', name: 'غير موافق', name_en: 'Thumbs Down' },
            heart_eyes: { emoji: '😍', name: 'قلوب', name_en: 'Heart Eyes' },
            party: { emoji: '🎉', name: 'احتفال', name_en: 'Party' },
            
            // تفاعلات مخصصة - Custom reactions
            thinking: { emoji: '🤔', name: 'تفكير', name_en: 'Thinking' },
            check: { emoji: '✅', name: 'صحيح', name_en: 'Check' },
            cross: { emoji: '❌', name: 'خطأ', name_en: 'Cross' },
            star: { emoji: '⭐', name: 'نجمة', name_en: 'Star' }
        };

        this.messageReactions = new Map(); // تخزين تفاعلات الرسائل
        this.userReactions = new Map(); // تخزين تفاعلات المستخدمين
        this.reactionCallbacks = new Map(); // معالجات التفاعلات
    }

    /**
     * إضافة تفاعل على رسالة
     * Add reaction to message
     * @param {string} messageId - معرف الرسالة
     * @param {string} userId - معرف المستخدم
     * @param {string} reactionType - نوع التفاعل
     * @returns {Object} - نتيجة إضافة التفاعل
     */
    async addReaction(messageId, userId, reactionType) {
        try {
            if (!this.supportedReactions[reactionType]) {
                throw new Error(`نوع التفاعل غير مدعوم - Unsupported reaction type: ${reactionType}`);
            }

            // الحصول على تفاعلات الرسالة أو إنشاؤها
            let messageReactions = this.messageReactions.get(messageId) || {
                messageId,
                reactions: {},
                totalCount: 0,
                uniqueUsers: new Set(),
                createdAt: Date.now()
            };

            // التحقق من وجود تفاعل سابق من نفس المستخدم
            const userPreviousReaction = this.getUserReactionOnMessage(messageId, userId);
            
            if (userPreviousReaction) {
                // إزالة التفاعل السابق
                await this.removeReaction(messageId, userId, userPreviousReaction);
            }

            // إضافة التفاعل الجديد
            if (!messageReactions.reactions[reactionType]) {
                messageReactions.reactions[reactionType] = {
                    type: reactionType,
                    emoji: this.supportedReactions[reactionType].emoji,
                    name: this.supportedReactions[reactionType].name,
                    users: [],
                    count: 0
                };
            }

            messageReactions.reactions[reactionType].users.push({
                userId,
                reactedAt: Date.now()
            });

            messageReactions.reactions[reactionType].count++;
            messageReactions.totalCount++;
            messageReactions.uniqueUsers.add(userId);

            // تحديث تفاعلات المستخدم
            let userReactions = this.userReactions.get(userId) || [];
            userReactions.push({
                messageId,
                reactionType,
                reactedAt: Date.now()
            });
            this.userReactions.set(userId, userReactions);

            // حفظ التحديثات
            this.messageReactions.set(messageId, messageReactions);

            // تنفيذ معالجات التفاعل
            await this.triggerReactionCallbacks('add', {
                messageId,
                userId,
                reactionType,
                reaction: this.supportedReactions[reactionType],
                messageReactions
            });

            logger.info(`تم إضافة تفاعل - Reaction added: ${reactionType} by ${userId} on ${messageId}`);

            return {
                success: true,
                reactionType,
                emoji: this.supportedReactions[reactionType].emoji,
                totalReactions: messageReactions.totalCount,
                messageReactions
            };

        } catch (error) {
            logger.error('فشل في إضافة التفاعل - Failed to add reaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * إزالة تفاعل من رسالة
     * Remove reaction from message
     * @param {string} messageId - معرف الرسالة
     * @param {string} userId - معرف المستخدم
     * @param {string} reactionType - نوع التفاعل
     * @returns {Object} - نتيجة إزالة التفاعل
     */
    async removeReaction(messageId, userId, reactionType = null) {
        try {
            const messageReactions = this.messageReactions.get(messageId);
            
            if (!messageReactions) {
                return {
                    success: false,
                    error: 'لا توجد تفاعلات لهذه الرسالة - No reactions found for this message'
                };
            }

            // إذا لم يتم تحديد نوع التفاعل، ابحث عن تفاعل المستخدم
            if (!reactionType) {
                reactionType = this.getUserReactionOnMessage(messageId, userId);
                
                if (!reactionType) {
                    return {
                        success: false,
                        error: 'لا يوجد تفاعل من هذا المستخدم - No reaction from this user'
                    };
                }
            }

            const reaction = messageReactions.reactions[reactionType];
            
            if (!reaction) {
                return {
                    success: false,
                    error: 'نوع التفاعل غير موجود - Reaction type not found'
                };
            }

            // العثور على تفاعل المستخدم وإزالته
            const userIndex = reaction.users.findIndex(user => user.userId === userId);
            
            if (userIndex === -1) {
                return {
                    success: false,
                    error: 'المستخدم لم يضع هذا التفاعل - User did not react with this type'
                };
            }

            reaction.users.splice(userIndex, 1);
            reaction.count--;
            messageReactions.totalCount--;

            // إزالة التفاعل إذا لم يعد له مستخدمون
            if (reaction.count === 0) {
                delete messageReactions.reactions[reactionType];
            }

            // تحديث تفاعلات المستخدم
            const userReactions = this.userReactions.get(userId) || [];
            const userReactionIndex = userReactions.findIndex(r => 
                r.messageId === messageId && r.reactionType === reactionType
            );
            
            if (userReactionIndex !== -1) {
                userReactions.splice(userReactionIndex, 1);
                this.userReactions.set(userId, userReactions);
            }

            // إزالة تفاعلات الرسالة إذا لم تعد تحتوي على تفاعلات
            if (messageReactions.totalCount === 0) {
                this.messageReactions.delete(messageId);
            }

            // تنفيذ معالجات التفاعل
            await this.triggerReactionCallbacks('remove', {
                messageId,
                userId,
                reactionType,
                reaction: this.supportedReactions[reactionType],
                messageReactions
            });

            logger.info(`تم حذف تفاعل - Reaction removed: ${reactionType} by ${userId} on ${messageId}`);

            return {
                success: true,
                reactionType,
                remainingReactions: messageReactions.totalCount || 0
            };

        } catch (error) {
            logger.error('فشل في حذف التفاعل - Failed to remove reaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * تبديل التفاعل (إضافة أو إزالة)
     * Toggle reaction (add or remove)
     * @param {string} messageId - معرف الرسالة
     * @param {string} userId - معرف المستخدم
     * @param {string} reactionType - نوع التفاعل
     * @returns {Object} - نتيجة التبديل
     */
    async toggleReaction(messageId, userId, reactionType) {
        const userCurrentReaction = this.getUserReactionOnMessage(messageId, userId);
        
        if (userCurrentReaction === reactionType) {
            // إزالة نفس التفاعل
            return await this.removeReaction(messageId, userId, reactionType);
        } else {
            // إضافة تفاعل جديد (سيزيل التفاعل السابق تلقائياً)
            return await this.addReaction(messageId, userId, reactionType);
        }
    }

    /**
     * الحصول على تفاعل المستخدم على رسالة
     * Get user reaction on message
     * @param {string} messageId - معرف الرسالة
     * @param {string} userId - معرف المستخدم
     * @returns {string|null} - نوع التفاعل أو null
     */
    getUserReactionOnMessage(messageId, userId) {
        const messageReactions = this.messageReactions.get(messageId);
        
        if (!messageReactions) return null;

        for (const [reactionType, reaction] of Object.entries(messageReactions.reactions)) {
            if (reaction.users.some(user => user.userId === userId)) {
                return reactionType;
            }
        }

        return null;
    }

    /**
     * الحصول على تفاعلات رسالة
     * Get message reactions
     * @param {string} messageId - معرف الرسالة
     * @returns {Object|null} - تفاعلات الرسالة
     */
    getMessageReactions(messageId) {
        return this.messageReactions.get(messageId) || null;
    }

    /**
     * تسجيل معالج تفاعل
     * Register reaction callback
     * @param {string} eventType - نوع الحدث (add, remove)
     * @param {Function} callback - دالة المعالجة
     */
    onReaction(eventType, callback) {
        if (!this.reactionCallbacks.has(eventType)) {
            this.reactionCallbacks.set(eventType, []);
        }
        
        this.reactionCallbacks.get(eventType).push(callback);
        logger.debug(`تم تسجيل معالج تفاعل - Reaction callback registered: ${eventType}`);
    }

    /**
     * تنفيذ معالجات التفاعل
     * Trigger reaction callbacks
     * @param {string} eventType - نوع الحدث
     * @param {Object} data - بيانات الحدث
     */
    async triggerReactionCallbacks(eventType, data) {
        const callbacks = this.reactionCallbacks.get(eventType) || [];
        
        for (const callback of callbacks) {
            try {
                await callback(data);
            } catch (error) {
                logger.error(`خطأ في معالج التفاعل - Error in reaction callback ${eventType}:`, error);
            }
        }
    }

    /**
     * إنشاء لوحة تفاعلات سريعة
     * Create quick reaction panel
     * @param {Array} reactions - مصفوفة التفاعلات
     * @param {string} messageId - معرف الرسالة
     * @returns {Object} - لوحة التفاعلات
     */
    createQuickReactionPanel(reactions = null, messageId) {
        const defaultReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
        const selectedReactions = reactions || defaultReactions;

        const reactionButtons = selectedReactions.map(reactionType => {
            const reaction = this.supportedReactions[reactionType];
            if (!reaction) return null;

            return {
                id: `reaction_${reactionType}_${messageId}`,
                text: `${reaction.emoji} ${reaction.name}`,
                action: 'toggle_reaction',
                data: {
                    messageId,
                    reactionType,
                    emoji: reaction.emoji
                }
            };
        }).filter(Boolean);

        return {
            type: 'reaction_panel',
            messageId,
            buttons: reactionButtons,
            title: '⚡ التفاعلات السريعة - Quick Reactions'
        };
    }

    /**
     * تنسيق التفاعلات للعرض
     * Format reactions for display
     * @param {string} messageId - معرف الرسالة
     * @returns {string} - النص المنسق
     */
    formatReactionsForDisplay(messageId) {
        const messageReactions = this.getMessageReactions(messageId);
        
        if (!messageReactions || messageReactions.totalCount === 0) {
            return 'لا توجد تفاعلات بعد - No reactions yet';
        }

        let display = '**🎭 التفاعلات - Reactions:**\n\n';

        // عرض التفاعلات مرتبة حسب العدد
        const sortedReactions = Object.entries(messageReactions.reactions)
            .sort(([,a], [,b]) => b.count - a.count);

        sortedReactions.forEach(([reactionType, reaction]) => {
            display += `${reaction.emoji} **${reaction.name}** (${reaction.count})\n`;
            
            // عرض أول 5 مستخدمين
            const userSample = reaction.users.slice(0, 5);
            const userList = userSample.map(user => `@${user.userId}`).join(', ');
            display += `   👥 ${userList}`;
            
            if (reaction.count > 5) {
                display += ` وآخرون... +${reaction.count - 5}`;
            }
            display += '\n\n';
        });

        display += `📊 **إجمالي التفاعلات:** ${messageReactions.totalCount}\n`;
        display += `👥 **عدد المتفاعلين:** ${messageReactions.uniqueUsers.size}`;

        return display;
    }

    /**
     * الحصول على أكثر التفاعلات شيوعاً
     * Get most popular reactions
     * @param {number} limit - الحد الأقصى للنتائج
     * @returns {Array} - التفاعلات الشائعة
     */
    getMostPopularReactions(limit = 5) {
        const reactionCounts = {};

        // حساب إجمالي عدد كل نوع تفاعل
        for (const messageReactions of this.messageReactions.values()) {
            for (const [reactionType, reaction] of Object.entries(messageReactions.reactions)) {
                reactionCounts[reactionType] = (reactionCounts[reactionType] || 0) + reaction.count;
            }
        }

        // ترتيب التفاعلات حسب الشيوعية
        return Object.entries(reactionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([reactionType, count]) => ({
                type: reactionType,
                ...this.supportedReactions[reactionType],
                totalCount: count
            }));
    }

    /**
     * الحصول على إحصائيات التفاعلات
     * Get reaction statistics
     * @returns {Object} - الإحصائيات
     */
    getStatistics() {
        const stats = {
            totalMessages: this.messageReactions.size,
            totalReactions: 0,
            totalUsers: this.userReactions.size,
            averageReactionsPerMessage: 0,
            mostActiveUsers: [],
            popularReactions: this.getMostPopularReactions()
        };

        // حساب إجمالي التفاعلات
        for (const messageReactions of this.messageReactions.values()) {
            stats.totalReactions += messageReactions.totalCount;
        }

        // حساب متوسط التفاعلات لكل رسالة
        if (stats.totalMessages > 0) {
            stats.averageReactionsPerMessage = (stats.totalReactions / stats.totalMessages).toFixed(2);
        }

        // العثور على أكثر المستخدمين نشاطاً
        const userActivityMap = new Map();
        for (const [userId, reactions] of this.userReactions.entries()) {
            userActivityMap.set(userId, reactions.length);
        }

        stats.mostActiveUsers = Array.from(userActivityMap.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([userId, count]) => ({ userId, reactionCount: count }));

        return stats;
    }

    /**
     * تنظيف التفاعلات القديمة
     * Clean old reactions
     * @param {number} maxAge - العمر الأقصى بالميلي ثانية
     * @returns {number} - عدد التفاعلات المحذوفة
     */
    cleanOldReactions(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 يوم افتراضياً
        const now = Date.now();
        let cleanedCount = 0;

        for (const [messageId, messageReactions] of this.messageReactions.entries()) {
            if (now - messageReactions.createdAt > maxAge) {
                this.messageReactions.delete(messageId);
                cleanedCount++;
            }
        }

        // تنظيف تفاعلات المستخدمين القديمة
        for (const [userId, reactions] of this.userReactions.entries()) {
            const filteredReactions = reactions.filter(reaction => 
                now - reaction.reactedAt <= maxAge
            );
            
            if (filteredReactions.length !== reactions.length) {
                if (filteredReactions.length === 0) {
                    this.userReactions.delete(userId);
                } else {
                    this.userReactions.set(userId, filteredReactions);
                }
            }
        }

        if (cleanedCount > 0) {
            logger.info(`تم تنظيف ${cleanedCount} تفاعل قديم - Cleaned ${cleanedCount} old reactions`);
        }

        return cleanedCount;
    }
}

// إنشاء مثيل واحد من نظام التفاعلات
const reactionSystem = new ReactionSystem();

// تنظيف دوري للتفاعلات القديمة
setInterval(() => {
    reactionSystem.cleanOldReactions();
}, 24 * 60 * 60 * 1000); // كل 24 ساعة

module.exports = {
    ReactionSystem,
    reactionSystem
};