/**
 * مثال على حدث البوت
 * Bot Event Example
 * 
 * هذا ملف مثال يوضح كيفية إنشاء حدث جديد للبوت
 * This is an example file showing how to create a new bot event
 * 
 * نسخ هذا الملف وتعديله لإنشاء أحداث جديدة
 * Copy this file and modify it to create new events
 */

const logger = require('../core/logger');
const User = require('../database/models/User');
const Group = require('../database/models/Group');

module.exports = {
    // إعدادات الحدث - Event Configuration
    config: {
        // اسم الحدث (مطلوب) - Event name (required)
        name: 'messageExample',
        
        // نوع الحدث المراد الاستماع إليه (مطلوب) - Event type to listen to (required)
        event: 'message',
        
        // وصف الحدث - Event description
        description: 'مثال على معالجة الرسائل - Example message handling',
        
        // هل الحدث يعمل مرة واحدة فقط؟ - Does event run only once?
        once: false,
        
        // أولوية الحدث (رقم أعلى = أولوية أكبر) - Event priority (higher number = higher priority)
        priority: 0,
        
        // شروط تنفيذ الحدث - Event execution conditions
        conditions: {
            // أنواع الرسائل المدعومة - Supported message types
            messageTypes: ['text', 'media'],
            
            // هل يعمل في المجموعات؟ - Works in groups?
            allowGroups: true,
            
            // هل يعمل في الرسائل الخاصة؟ - Works in DMs?
            allowDMs: true,
            
            // تجاهل رسائل البوت نفسه - Ignore bot's own messages
            ignoreBotMessages: true
        }
    },

    /**
     * تنفيذ الحدث - Execute Event
     * @param {Object} context - سياق الحدث - Event context
     * @param {Object} context.bot - مرجع البوت - Bot reference
     * @param {string} context.eventName - اسم الحدث - Event name
     * @param {Object} context.data - بيانات الحدث - Event data
     * @param {Date} context.timestamp - وقت الحدث - Event timestamp
     * @param {Object} messageData - بيانات الرسالة - Message data (للرسائل فقط - for messages only)
     */
    async run(context, messageData) {
        try {
            const { bot, eventName, data, timestamp } = context;

            // التحقق من وجود بيانات الرسالة - Check message data exists
            if (!messageData) {
                logger.debug('لا توجد بيانات رسالة في الحدث - No message data in event');
                return;
            }

            const { text, userId, username, groupId, messageId } = messageData;

            // التحقق من الشروط - Check conditions
            if (!this.checkConditions(messageData)) {
                return;
            }

            // تسجيل الحدث - Log event
            logger.debug(`معالجة رسالة من - Processing message from: ${username || userId}`);

            // تحديث/إنشاء بيانات المستخدم - Update/create user data
            await this.handleUserData(messageData);

            // معالجة المجموعة إذا كانت موجودة - Handle group if exists
            if (groupId) {
                await this.handleGroupData(messageData);
            }

            // حفظ الرسالة في قاعدة البيانات - Save message to database
            await this.saveMessage(messageData);

            // معالجة خاصة للرسائل - Special message handling
            await this.processMessage(messageData, bot);

        } catch (error) {
            logger.error('خطأ في معالجة حدث الرسالة - Error processing message event:', error);
        }
    },

    /**
     * التحقق من شروط تنفيذ الحدث - Check event execution conditions
     * @param {Object} messageData - بيانات الرسالة - Message data
     * @returns {boolean} - هل يجب تنفيذ الحدث؟ - Should event execute?
     */
    checkConditions(messageData) {
        const { text, userId, groupId, messageType } = messageData;
        const conditions = this.config.conditions;

        // تجاهل رسائل البوت نفسه - Ignore bot's own messages
        if (conditions.ignoreBotMessages && this.isBotMessage(messageData)) {
            return false;
        }

        // التحقق من نوع الرسالة - Check message type
        if (conditions.messageTypes && !conditions.messageTypes.includes(messageType || 'text')) {
            return false;
        }

        // التحقق من المجموعات - Check groups
        if (groupId && !conditions.allowGroups) {
            return false;
        }

        // التحقق من الرسائل الخاصة - Check DMs
        if (!groupId && !conditions.allowDMs) {
            return false;
        }

        return true;
    },

    /**
     * التحقق من كون الرسالة من البوت - Check if message is from bot
     * @param {Object} messageData - بيانات الرسالة - Message data
     * @returns {boolean} - هل الرسالة من البوت؟ - Is message from bot?
     */
    isBotMessage(messageData) {
        // هنا يمكن إضافة منطق للتحقق من رسائل البوت
        // Here you can add logic to check for bot messages
        return false; // مؤقتاً - temporarily
    },

    /**
     * معالجة بيانات المستخدم - Handle user data
     * @param {Object} messageData - بيانات الرسالة - Message data
     */
    async handleUserData(messageData) {
        try {
            const { userId, username } = messageData;

            // البحث عن المستخدم في قاعدة البيانات - Find user in database
            let user = await User.findByInstagramId(userId);

            if (!user) {
                // إنشاء مستخدم جديد - Create new user
                user = new User({
                    instagramId: userId,
                    username: username || 'unknown'
                });
                await user.save();
                logger.info(`مستخدم جديد انضم - New user joined: ${username || userId}`);
            } else {
                // تحديث معلومات المستخدم - Update user info
                if (username && user.username !== username) {
                    user.username = username;
                    await user.save();
                }
                
                // تحديث وقت النشاط - Update last activity
                await user.updateLastActivity();
            }

        } catch (error) {
            logger.error('خطأ في معالجة بيانات المستخدم - Error handling user data:', error);
        }
    },

    /**
     * معالجة بيانات المجموعة - Handle group data
     * @param {Object} messageData - بيانات الرسالة - Message data
     */
    async handleGroupData(messageData) {
        try {
            const { groupId, groupName, userId } = messageData;

            // البحث عن المجموعة في قاعدة البيانات - Find group in database
            let group = await Group.findByInstagramId(groupId);

            if (!group) {
                // إنشاء مجموعة جديدة - Create new group
                group = new Group({
                    instagramId: groupId,
                    name: groupName || 'Unknown Group'
                });
                await group.save();
                logger.info(`مجموعة جديدة أضيفت - New group added: ${groupName || groupId}`);
            }

            // التحقق من عضوية المستخدم - Check user membership
            const isMember = await group.isMember(userId);
            if (!isMember) {
                await group.addMember(userId);
                logger.debug(`عضو جديد أضيف للمجموعة - New member added to group: ${userId}`);
            }

            // تحديث وقت النشاط الأخير - Update last activity
            await group.updateLastActivity();

        } catch (error) {
            logger.error('خطأ في معالجة بيانات المجموعة - Error handling group data:', error);
        }
    },

    /**
     * حفظ الرسالة في قاعدة البيانات - Save message to database
     * @param {Object} messageData - بيانات الرسالة - Message data
     */
    async saveMessage(messageData) {
        try {
            // هنا يمكن إضافة منطق لحفظ الرسائل
            // Here you can add logic to save messages
            // مثال: استخدام نموذج Message إذا كان متوفراً
            // Example: Use Message model if available

            logger.debug(`تم حفظ الرسالة - Message saved: ${messageData.messageId}`);

        } catch (error) {
            logger.error('خطأ في حفظ الرسالة - Error saving message:', error);
        }
    },

    /**
     * معالجة خاصة للرسائل - Special message processing
     * @param {Object} messageData - بيانات الرسالة - Message data
     * @param {Object} bot - مرجع البوت - Bot reference
     */
    async processMessage(messageData, bot) {
        try {
            const { text, userId, username } = messageData;

            // مثال: الرد على رسائل معينة - Example: Reply to specific messages
            if (text && text.toLowerCase().includes('مرحبا')) {
                await bot.sendMessage(userId, `مرحباً ${username || 'صديقي'}! 👋`);
            }

            // مثال: تتبع الكلمات المحظورة - Example: Track banned words
            const bannedWords = ['spam', 'إعلان', 'تسويق'];
            const hasBannedWord = bannedWords.some(word => 
                text && text.toLowerCase().includes(word.toLowerCase())
            );

            if (hasBannedWord) {
                logger.warn(`رسالة مشبوهة من - Suspicious message from: ${username || userId}`);
                // يمكن إضافة إجراءات إضافية هنا - Additional actions can be added here
            }

            // مثال: إحصائيات الرسائل - Example: Message statistics
            await this.updateMessageStats(messageData);

        } catch (error) {
            logger.error('خطأ في معالجة الرسالة - Error processing message:', error);
        }
    },

    /**
     * تحديث إحصائيات الرسائل - Update message statistics
     * @param {Object} messageData - بيانات الرسالة - Message data
     */
    async updateMessageStats(messageData) {
        try {
            // هنا يمكن إضافة منطق لتحديث الإحصائيات
            // Here you can add logic to update statistics
            logger.debug('تحديث إحصائيات الرسائل - Updating message statistics');

        } catch (error) {
            logger.error('خطأ في تحديث الإحصائيات - Error updating statistics:', error);
        }
    }
};

/*
==============================================
دليل إنشاء حدث جديد - New Event Creation Guide
==============================================

1. نسخ هذا الملف وإعادة تسميته
   Copy this file and rename it

2. تعديل config.name ليكون اسم الحدث الجديد
   Modify config.name to be the new event name

3. تحديد نوع الحدث في config.event
   Set event type in config.event

4. كتابة منطق الحدث في دالة run()
   Write event logic in run() function

5. اختبار الحدث والتأكد من عمله
   Test the event and ensure it works

==============================================
أنواع الأحداث المتاحة - Available Event Types
==============================================

• 'message' - الرسائل الواردة
• 'ready' - جاهزية البوت
• 'error' - الأخطاء
• 'userJoin' - انضمام مستخدم
• 'userLeave' - مغادرة مستخدم
• 'groupCreate' - إنشاء مجموعة
• 'groupUpdate' - تحديث مجموعة

==============================================
الدوال المتاحة في context - Available Functions in context
==============================================

• context.bot - مرجع البوت الرئيسي
• context.eventName - اسم الحدث
• context.data - بيانات الحدث
• context.timestamp - وقت الحدث

==============================================
أمثلة على الاستخدام - Usage Examples
==============================================

// الاستماع لحدث جاهزية البوت
config: { event: 'ready', once: true }

// الاستماع للأخطاء
config: { event: 'error', once: false }

// معالجة الرسائل مع شروط
config: { 
    event: 'message',
    conditions: {
        messageTypes: ['text'],
        allowGroups: true
    }
}

==============================================
*/
