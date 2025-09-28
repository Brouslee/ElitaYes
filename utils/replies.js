/**
 * نظام الرد على الرسائل لبوت ELITA
 * ELITA Message Reply System
 * 
 * تم إنشاؤه بواسطة محمد العكاري - Created by Mohammed Al-Akari
 */

const logger = require('../core/logger');

/**
 * فئة نظام الردود
 * Reply System Class
 */
class ReplySystem {
    constructor() {
        this.replyChains = new Map(); // سلاسل الردود
        this.messageThreads = new Map(); // خيوط المحادثات
        this.quotedMessages = new Map(); // الرسائل المقتبسة
        this.replyCallbacks = new Map(); // معالجات الردود
    }

    /**
     * إنشاء رد على رسالة
     * Create reply to message
     * @param {Object} replyConfig - إعدادات الرد
     * @returns {Object} - كائن الرد
     */
    createReply(replyConfig) {
        const {
            originalMessageId,
            replyText,
            userId,
            replyType = 'direct', // direct, quote, forward
            quoteText = null,
            media = null,
            mentionUsers = [],
            metadata = {}
        } = replyConfig;

        if (!originalMessageId || !replyText || !userId) {
            throw new Error('معرف الرسالة الأصلية والنص ومعرف المستخدم مطلوبان - Original message ID, reply text, and user ID are required');
        }

        const reply = {
            id: this.generateReplyId(),
            originalMessageId,
            replyText,
            userId,
            replyType,
            quoteText,
            media,
            mentionUsers,
            createdAt: Date.now(),
            isEdited: false,
            editHistory: [],
            metadata: {
                ...metadata,
                threadLevel: this.getThreadLevel(originalMessageId) + 1
            }
        };

        // إضافة الرد لسلسلة الردود
        this.addToReplyChain(originalMessageId, reply);

        // إنشاء أو تحديث خيط المحادثة
        this.updateMessageThread(originalMessageId, reply);

        logger.info(`تم إنشاء رد جديد - New reply created: ${reply.id} for ${originalMessageId}`);
        return reply;
    }

    /**
     * إنشاء اقتباس من رسالة
     * Create quote from message
     * @param {Object} quoteConfig - إعدادات الاقتباس
     * @returns {Object} - كائن الاقتباس
     */
    createQuote(quoteConfig) {
        const {
            originalMessageId,
            quotedText,
            quoteAuthor,
            newMessageText,
            userId,
            preserveFormatting = true,
            addReference = true
        } = quoteConfig;

        const quote = {
            id: this.generateQuoteId(),
            originalMessageId,
            quotedText,
            quoteAuthor,
            newMessageText,
            userId,
            preserveFormatting,
            addReference,
            createdAt: Date.now(),
            type: 'quote'
        };

        this.quotedMessages.set(quote.id, quote);

        logger.info(`تم إنشاء اقتباس جديد - New quote created: ${quote.id}`);
        return quote;
    }

    /**
     * إنشاء إعادة توجيه رسالة
     * Create message forward
     * @param {Object} forwardConfig - إعدادات إعادة التوجيه
     * @returns {Object} - كائن إعادة التوجيه
     */
    createForward(forwardConfig) {
        const {
            originalMessageId,
            originalContent,
            originalAuthor,
            forwardedBy,
            targetUserId,
            addComment = null,
            preserveMedia = true,
            forwardChain = []
        } = forwardConfig;

        const forward = {
            id: this.generateForwardId(),
            originalMessageId,
            originalContent,
            originalAuthor,
            forwardedBy,
            targetUserId,
            addComment,
            preserveMedia,
            forwardChain: [...forwardChain, {
                forwardedBy,
                forwardedAt: Date.now()
            }],
            createdAt: Date.now(),
            type: 'forward'
        };

        logger.info(`تم إنشاء إعادة توجيه - New forward created: ${forward.id}`);
        return forward;
    }

    /**
     * إنشاء رد سريع
     * Create quick reply
     * @param {Object} quickReplyConfig - إعدادات الرد السريع
     * @returns {Object} - كائن الرد السريع
     */
    createQuickReply(quickReplyConfig) {
        const {
            originalMessageId,
            replyTemplate,
            userId,
            variables = {},
            emojiReaction = null
        } = quickReplyConfig;

        // معالجة قالب الرد
        let processedText = replyTemplate;
        for (const [key, value] of Object.entries(variables)) {
            processedText = processedText.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        const quickReply = {
            id: this.generateReplyId(),
            originalMessageId,
            replyText: processedText,
            userId,
            replyType: 'quick',
            emojiReaction,
            template: replyTemplate,
            variables,
            createdAt: Date.now(),
            isQuick: true
        };

        this.addToReplyChain(originalMessageId, quickReply);

        logger.info(`تم إنشاء رد سريع - Quick reply created: ${quickReply.id}`);
        return quickReply;
    }

    /**
     * إضافة رد لسلسلة الردود
     * Add reply to chain
     * @param {string} originalMessageId - معرف الرسالة الأصلية
     * @param {Object} reply - كائن الرد
     */
    addToReplyChain(originalMessageId, reply) {
        if (!this.replyChains.has(originalMessageId)) {
            this.replyChains.set(originalMessageId, {
                originalMessageId,
                replies: [],
                totalReplies: 0,
                lastReplyAt: Date.now(),
                participants: new Set()
            });
        }

        const chain = this.replyChains.get(originalMessageId);
        chain.replies.push(reply);
        chain.totalReplies++;
        chain.lastReplyAt = Date.now();
        chain.participants.add(reply.userId);
    }

    /**
     * تحديث خيط المحادثة
     * Update message thread
     * @param {string} rootMessageId - معرف الرسالة الجذر
     * @param {Object} reply - كائن الرد
     */
    updateMessageThread(rootMessageId, reply) {
        if (!this.messageThreads.has(rootMessageId)) {
            this.messageThreads.set(rootMessageId, {
                rootMessageId,
                messages: [],
                participants: new Set(),
                createdAt: Date.now(),
                lastActivity: Date.now(),
                isActive: true
            });
        }

        const thread = this.messageThreads.get(rootMessageId);
        thread.messages.push({
            messageId: reply.id,
            userId: reply.userId,
            type: 'reply',
            timestamp: reply.createdAt,
            level: reply.metadata.threadLevel
        });

        thread.participants.add(reply.userId);
        thread.lastActivity = Date.now();
    }

    /**
     * الحصول على مستوى الخيط
     * Get thread level
     * @param {string} messageId - معرف الرسالة
     * @returns {number} - مستوى الخيط
     */
    getThreadLevel(messageId) {
        // البحث في سلاسل الردود لمعرفة مستوى الخيط
        for (const chain of this.replyChains.values()) {
            if (chain.originalMessageId === messageId) {
                return 0; // رسالة أصلية
            }
            
            for (const reply of chain.replies) {
                if (reply.id === messageId) {
                    return reply.metadata.threadLevel || 1;
                }
            }
        }
        
        return 0; // افتراضياً مستوى 0
    }

    /**
     * الحصول على سلسلة الردود
     * Get reply chain
     * @param {string} messageId - معرف الرسالة
     * @returns {Object|null} - سلسلة الردود
     */
    getReplyChain(messageId) {
        return this.replyChains.get(messageId) || null;
    }

    /**
     * الحصول على خيط المحادثة
     * Get message thread
     * @param {string} rootMessageId - معرف الرسالة الجذر
     * @returns {Object|null} - خيط المحادثة
     */
    getMessageThread(rootMessageId) {
        return this.messageThreads.get(rootMessageId) || null;
    }

    /**
     * تنسيق الرد للعرض
     * Format reply for display
     * @param {Object} reply - كائن الرد
     * @param {Object} originalMessage - الرسالة الأصلية
     * @returns {string} - النص المنسق
     */
    formatReplyForDisplay(reply, originalMessage = null) {
        let display = '';

        // عرض معلومات الرسالة الأصلية
        if (originalMessage) {
            display += `┌─ **رد على - Reply to:**\n`;
            display += `│ 👤 ${originalMessage.author}\n`;
            display += `│ 📝 ${this.truncateText(originalMessage.content, 100)}\n`;
            display += `└─────────────────\n\n`;
        }

        // عرض محتوى الرد
        switch (reply.replyType) {
            case 'quote':
                if (reply.quoteText) {
                    display += `> 💬 *"${reply.quoteText}"*\n\n`;
                }
                display += reply.replyText;
                break;

            case 'quick':
                display += `⚡ ${reply.replyText}`;
                if (reply.emojiReaction) {
                    display += ` ${reply.emojiReaction}`;
                }
                break;

            default:
                display += reply.replyText;
        }

        // عرض الوسائط إن وجدت
        if (reply.media) {
            display += `\n\n📎 **مرفق - Attachment:** ${reply.media.type}`;
        }

        // عرض الإشارات إن وجدت
        if (reply.mentionUsers && reply.mentionUsers.length > 0) {
            display += `\n\n👥 **إشارات - Mentions:** ${reply.mentionUsers.map(id => `@${id}`).join(', ')}`;
        }

        // معلومات إضافية
        display += `\n\n🕒 ${new Date(reply.createdAt).toLocaleString('ar-SA')}`;
        
        if (reply.isEdited) {
            display += ` ✏️ *محرر - Edited*`;
        }

        return display;
    }

    /**
     * تنسيق سلسلة الردود للعرض
     * Format reply chain for display
     * @param {string} messageId - معرف الرسالة
     * @param {Object} options - خيارات العرض
     * @returns {string} - النص المنسق
     */
    formatReplyChainForDisplay(messageId, options = {}) {
        const {
            maxReplies = 10,
            showParticipants = true,
            showStatistics = true,
            indentLevel = 2
        } = options;

        const chain = this.getReplyChain(messageId);
        
        if (!chain || chain.totalReplies === 0) {
            return 'لا توجد ردود على هذه الرسالة - No replies to this message';
        }

        let display = `**💬 سلسلة الردود - Reply Chain**\n\n`;

        if (showStatistics) {
            display += `📊 **الإحصائيات:**\n`;
            display += `• إجمالي الردود: ${chain.totalReplies}\n`;
            display += `• المشاركون: ${chain.participants.size}\n`;
            display += `• آخر رد: ${new Date(chain.lastReplyAt).toLocaleString('ar-SA')}\n\n`;
        }

        // عرض الردود
        const repliesToShow = chain.replies.slice(0, maxReplies);
        
        repliesToShow.forEach((reply, index) => {
            const indent = '  '.repeat(indentLevel);
            display += `${indent}${index + 1}. 👤 @${reply.userId}\n`;
            display += `${indent}   📝 ${this.truncateText(reply.replyText, 150)}\n`;
            display += `${indent}   🕒 ${new Date(reply.createdAt).toLocaleString('ar-SA')}\n\n`;
        });

        if (chain.totalReplies > maxReplies) {
            display += `... و ${chain.totalReplies - maxReplies} ردود أخرى\n\n`;
        }

        if (showParticipants) {
            display += `👥 **المشاركون:** ${Array.from(chain.participants).map(id => `@${id}`).join(', ')}`;
        }

        return display;
    }

    /**
     * إنشاء قوالب ردود سريعة
     * Create quick reply templates
     * @param {Array} templates - مصفوفة القوالب
     * @returns {Object} - قوالب الردود
     */
    createQuickReplyTemplates(templates) {
        const quickTemplates = {
            id: `templates_${Date.now()}`,
            templates: [],
            createdAt: Date.now()
        };

        templates.forEach((template, index) => {
            quickTemplates.templates.push({
                id: `template_${index}`,
                label: template.label,
                text: template.text,
                emoji: template.emoji || '💬',
                category: template.category || 'general',
                variables: template.variables || []
            });
        });

        return quickTemplates;
    }

    /**
     * تسجيل معالج ردود
     * Register reply callback
     * @param {string} eventType - نوع الحدث
     * @param {Function} callback - دالة المعالجة
     */
    onReply(eventType, callback) {
        if (!this.replyCallbacks.has(eventType)) {
            this.replyCallbacks.set(eventType, []);
        }
        
        this.replyCallbacks.get(eventType).push(callback);
        logger.debug(`تم تسجيل معالج ردود - Reply callback registered: ${eventType}`);
    }

    /**
     * تنفيذ معالجات الردود
     * Trigger reply callbacks
     * @param {string} eventType - نوع الحدث
     * @param {Object} data - بيانات الحدث
     */
    async triggerReplyCallbacks(eventType, data) {
        const callbacks = this.replyCallbacks.get(eventType) || [];
        
        for (const callback of callbacks) {
            try {
                await callback(data);
            } catch (error) {
                logger.error(`خطأ في معالج الردود - Error in reply callback ${eventType}:`, error);
            }
        }
    }

    /**
     * اقتطاع النص
     * Truncate text
     * @param {string} text - النص
     * @param {number} maxLength - الطول الأقصى
     * @returns {string} - النص المقتطع
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * إنشاء معرف رد
     * Generate reply ID
     * @returns {string} - معرف الرد
     */
    generateReplyId() {
        return `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * إنشاء معرف اقتباس
     * Generate quote ID
     * @returns {string} - معرف الاقتباس
     */
    generateQuoteId() {
        return `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * إنشاء معرف إعادة توجيه
     * Generate forward ID
     * @returns {string} - معرف إعادة التوجيه
     */
    generateForwardId() {
        return `forward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * الحصول على إحصائيات الردود
     * Get reply statistics
     * @returns {Object} - الإحصائيات
     */
    getStatistics() {
        const stats = {
            totalChains: this.replyChains.size,
            totalReplies: 0,
            totalQuotes: this.quotedMessages.size,
            totalThreads: this.messageThreads.size,
            averageRepliesPerChain: 0,
            mostActiveChains: [],
            replyTypes: {}
        };

        // حساب إجمالي الردود وأنواعها
        for (const chain of this.replyChains.values()) {
            stats.totalReplies += chain.totalReplies;
            
            chain.replies.forEach(reply => {
                stats.replyTypes[reply.replyType] = (stats.replyTypes[reply.replyType] || 0) + 1;
            });
        }

        // حساب متوسط الردود لكل سلسلة
        if (stats.totalChains > 0) {
            stats.averageRepliesPerChain = (stats.totalReplies / stats.totalChains).toFixed(2);
        }

        // العثور على أكثر السلاسل نشاطاً
        stats.mostActiveChains = Array.from(this.replyChains.values())
            .sort((a, b) => b.totalReplies - a.totalReplies)
            .slice(0, 5)
            .map(chain => ({
                messageId: chain.originalMessageId,
                replies: chain.totalReplies,
                participants: chain.participants.size,
                lastActivity: chain.lastReplyAt
            }));

        return stats;
    }

    /**
     * تنظيف الردود القديمة
     * Clean old replies
     * @param {number} maxAge - العمر الأقصى بالميلي ثانية
     * @returns {number} - عدد السلاسل المحذوفة
     */
    cleanOldReplies(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 يوم
        const now = Date.now();
        let cleanedChains = 0;
        let cleanedThreads = 0;

        // تنظيف سلاسل الردود القديمة
        for (const [messageId, chain] of this.replyChains.entries()) {
            if (now - chain.lastReplyAt > maxAge) {
                this.replyChains.delete(messageId);
                cleanedChains++;
            }
        }

        // تنظيف خيوط المحادثة القديمة
        for (const [threadId, thread] of this.messageThreads.entries()) {
            if (now - thread.lastActivity > maxAge) {
                this.messageThreads.delete(threadId);
                cleanedThreads++;
            }
        }

        // تنظيف الاقتباسات القديمة
        for (const [quoteId, quote] of this.quotedMessages.entries()) {
            if (now - quote.createdAt > maxAge) {
                this.quotedMessages.delete(quoteId);
            }
        }

        if (cleanedChains > 0 || cleanedThreads > 0) {
            logger.info(`تم تنظيف ${cleanedChains} سلسلة و ${cleanedThreads} خيط قديم - Cleaned ${cleanedChains} chains and ${cleanedThreads} threads`);
        }

        return cleanedChains + cleanedThreads;
    }
}

// إنشاء مثيل واحد من نظام الردود
const replySystem = new ReplySystem();

// تنظيف دوري للردود القديمة
setInterval(() => {
    replySystem.cleanOldReplies();
}, 24 * 60 * 60 * 1000); // كل 24 ساعة

module.exports = {
    ReplySystem,
    replySystem
};