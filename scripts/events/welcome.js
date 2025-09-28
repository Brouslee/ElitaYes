/**
 * حدث الترحيب المحسن - مستوحى من Goat Bot  
 * Enhanced Welcome Event - Inspired by Goat Bot
 * Enhanced by Mohammed Al-Akari
 */

if (!global.temp.welcomeEvent) {
    global.temp.welcomeEvent = {};
}

module.exports = {
    config: {
        name: "welcome",
        version: "2.0",
        author: "Mohammed Al-Akari",
        category: "events",
        description: "ترحيب بالأعضاء الجدد وإعدادات انضمام البوت للمجموعات"
    },

    langs: {
        ar: {
            session1: "صباح",
            session2: "ظهر", 
            session3: "عصر",
            session4: "مساء",
            welcomeBot: `╔════════════════════════════╗
║       🎉 مرحباً بـ ELITA! 🎉       ║
╠════════════════════════════╣
║                            ║
║  تم توصيل البوت بنجاح! ⚡    ║
║                            ║
║  💬 أرسل 'مساعدة' للبدء      ║
║  🔧 البوت جاهز للاستخدام     ║
║  📚 للأغراض التعليمية فقط    ║
║                            ║
║  👨‍💻 بواسطة: محمد العكاري      ║
╚════════════════════════════╝`,
            
            defaultWelcomeMessage: `╔════════════════════════════╗
║         🌟 أهلاً وسهلاً! 🌟      ║  
╠════════════════════════════╣
║                            ║
║  مرحباً {userName}! 👋        ║
║                            ║
║  أهلاً بك في {groupName}      ║
║  نتمنى لك {session} ممتع! ☀️  ║
║                            ║
║  📋 نصائح للبداية:           ║
║  • أرسل 'مساعدة' لرؤية الأوامر ║
║  • أرسل 'مدة' لحالة البوت     ║
║  • اتبع قوانين المجموعة 📜     ║
║                            ║
║   نتطلع لمشاركاتك معنا!     ║
╚════════════════════════════╝`,

            multipleWelcome: `🎊 مرحباً بالأعضاء الجدد! 🎊

{usersList}

أهلاً بكم في {groupName}!
نتمنى لكم {session} ممتع ومشاركات رائعة! ✨`
        }
    },

    onStart: async ({ message, event, api, getLang }) => {
        // التحقق من نوع الحدث
        if (event.logMessageType === "log:subscribe") {
            return async function () {
                try {
                    const { threadID } = event;
                    const { nickNameBot } = global.ELITA.config?.bot || {};
                    const dataAddedParticipants = event.logMessageData.addedParticipants;
                    
                    // تحديد الجلسة الزمنية
                    const hours = new Date().getHours();
                    const session = hours <= 10 ? getLang("session1") :
                                   hours <= 12 ? getLang("session2") :
                                   hours <= 18 ? getLang("session3") :
                                   getLang("session4");

                    // إذا كان العضو الجديد هو البوت
                    if (dataAddedParticipants.some(item => item.userFbId === api.getCurrentUserID())) {
                        // تغيير اسم البوت في المجموعة
                        if (nickNameBot) {
                            try {
                                await api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
                            } catch (error) {
                                logger.warn('WELCOME', 'فشل في تغيير اسم البوت:', error.message);
                            }
                        }
                        
                        // إرسال رسالة ترحيب البوت
                        await message.send(getLang("welcomeBot"));
                        
                        // تسجيل انضمام البوت
                        global.ELITA.updateStats('totalMessages');
                        logger.info('WELCOME', `تم انضمام البوت للمجموعة: ${threadID}`);
                        
                        return;
                    }

                    // إعداد نظام التجميع للأعضاء الجدد
                    if (!global.temp.welcomeEvent[threadID]) {
                        global.temp.welcomeEvent[threadID] = {
                            joinTimeout: null,
                            dataAddedParticipants: []
                        };
                    }

                    // إضافة المشاركين الجدد للقائمة
                    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
                    
                    // إلغاء المؤقت السابق إن وجد
                    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

                    // تعيين مؤقت جديد للتجميع
                    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
                        try {
                            await this.processWelcome(threadID, message, getLang, session);
                        } catch (error) {
                            logger.error('WELCOME', 'خطأ في معالجة الترحيب:', error);
                        }
                    }, 2000); // انتظار ثانيتين لتجميع الانضمامات

                } catch (error) {
                    logger.error('WELCOME EVENT', 'خطأ في حدث الترحيب:', error);
                }
            };
        }
    },

    async processWelcome(threadID, message, getLang, session) {
        try {
            const welcomeData = global.temp.welcomeEvent[threadID];
            if (!welcomeData || !welcomeData.dataAddedParticipants.length) return;

            // الحصول على معلومات المجموعة
            const groupInfo = await this.getGroupInfo(threadID);
            const groupName = groupInfo?.name || 'المجموعة';

            const addedParticipants = welcomeData.dataAddedParticipants;
            const userNames = [];
            const mentions = [];

            // معالجة بيانات المستخدمين الجدد
            for (const user of addedParticipants) {
                userNames.push(user.fullName);
                mentions.push({
                    tag: user.fullName,
                    id: user.userFbId
                });

                // إضافة المستخدم لقاعدة البيانات
                await this.addUserToDatabase(user);
            }

            if (userNames.length === 0) return;

            // تحديد نوع رسالة الترحيب
            let welcomeMessage;
            if (userNames.length === 1) {
                // ترحيب فردي
                welcomeMessage = getLang("defaultWelcomeMessage")
                    .replace(/\{userName\}/g, userNames[0])
                    .replace(/\{groupName\}/g, groupName)
                    .replace(/\{session\}/g, session);
            } else {
                // ترحيب جماعي
                const usersList = userNames.map((name, index) => `${index + 1}. ${name}`).join('\n');
                welcomeMessage = getLang("multipleWelcome")
                    .replace(/\{usersList\}/g, usersList)
                    .replace(/\{groupName\}/g, groupName)
                    .replace(/\{session\}/g, session);
            }

            // إعداد الرسالة
            const messageForm = {
                body: welcomeMessage,
                mentions: mentions
            };

            // إضافة صور المستخدمين (اختياري)
            if (addedParticipants.length <= 3) { // فقط للأعداد الصغيرة لتجنب الإفراط
                messageForm.attachment = [];
                for (const user of addedParticipants) {
                    try {
                        const profilePic = await this.getProfilePicture(user.userFbId);
                        if (profilePic) {
                            messageForm.attachment.push(profilePic);
                        }
                    } catch (error) {
                        logger.debug('WELCOME', `فشل في تحميل صورة المستخدم ${user.userFbId}`);
                    }
                }
            }

            // إرسال رسالة الترحيب
            await message.send(messageForm);

            // تنظيف البيانات المؤقتة
            delete global.temp.welcomeEvent[threadID];

            // تحديث الإحصائيات
            global.ELITA.updateStats('totalMessages');

            logger.info('WELCOME', `تم ترحيب ${userNames.length} عضو في المجموعة ${threadID}`);

        } catch (error) {
            logger.error('WELCOME PROCESS', 'خطأ في معالجة الترحيب:', error);
        }
    },

    async getGroupInfo(threadID) {
        try {
            // محاولة الحصول على معلومات المجموعة من الكاش
            const cachedInfo = global.ELITA.cache.groups.get(threadID);
            if (cachedInfo) return cachedInfo;

            // إذا لم توجد في الكاش، يمكن إضافة منطق للحصول على المعلومات
            // من API أو قاعدة البيانات هنا

            return { name: 'المجموعة', id: threadID };
        } catch (error) {
            logger.error('WELCOME', 'فشل في الحصول على معلومات المجموعة:', error);
            return null;
        }
    },

    async addUserToDatabase(userData) {
        try {
            const User = require('../../database/models/User');
            
            // البحث عن المستخدم أولاً
            let user = await User.findByInstagramId(userData.userFbId);
            
            if (!user) {
                // إنشاء مستخدم جديد
                user = new User({
                    instagramId: userData.userFbId,
                    username: userData.fullName,
                    fullName: userData.fullName,
                    joinedAt: new Date()
                });
                
                await user.save();
                logger.debug('WELCOME', `تم إضافة مستخدم جديد: ${userData.fullName}`);
            } else {
                // تحديث آخر نشاط
                await user.updateLastActivity();
            }
            
        } catch (error) {
            logger.error('WELCOME DB', 'فشل في إضافة المستخدم لقاعدة البيانات:', error);
        }
    },

    async getProfilePicture(userID) {
        try {
            // هنا يمكن إضافة منطق للحصول على صورة المستخدم
            // من Instagram API أو مصدر آخر
            return null;
        } catch (error) {
            logger.debug('WELCOME', 'فشل في تحميل صورة الملف الشخصي:', error);
            return null;
        }
    }
};