const { getText } = require('../../utils/language');

/**
 * حدث معالجة الرسائل
 * Message Processing Event
 */

module.exports = {
    config: {
        name: "message",
        version: "1.0.0",
        author: "Instagram Bot Framework",
        description: {
            ar: "معالجة جميع الرسائل الواردة",
            en: "Process all incoming messages"
        },
        category: "events"
    },

    langs: {
        ar: {
            commandNotFound: "الأمر '%1' غير موجود. اكتب !help للحصول على قائمة الأوامر",
            userBanned: "تم حظرك من استخدام البوت",
            cooldownActive: "يجب الانتظار %1 ثانية قبل استخدام أمر آخر",
            adminOnly: "هذا الأمر متاح للمطورين فقط",
            rateLimited: "تم تجاوز الحد المسموح من الطلبات، يرجى الانتظار"
        },
        en: {
            commandNotFound: "Command '%1' not found. Type !help for command list",
            userBanned: "You have been banned from using this bot",
            cooldownActive: "Please wait %1 seconds before using another command",
            adminOnly: "This command is for developers only",
            rateLimited: "Rate limit exceeded, please wait"
        }
    },

    onStart: async function({ 
        message, 
        event, 
        prefix, 
        commandHandler, 
        userModel, 
        getLang,
        instagramAPI,
        security 
    }) {
        try {
            const { body, senderID, messageID, threadID } = event;
            
            // تجاهل الرسائل الفارغة
            // Ignore empty messages
            if (!body || body.trim().length === 0) return;

            // تسجيل الرسالة
            // Log the message
            console.log(`[MESSAGE] ${senderID}: ${body}`);

            // التحقق من قيود المعدل
            // Check rate limits
            if (!security.checkRateLimit(senderID)) {
                return message.reply(getLang("rateLimited"));
            }

            // إنشاء أو تحديث بيانات المستخدم
            // Create or update user data
            const userData = await userModel.createOrUpdate({
                instagramId: senderID,
                lastMessageTime: new Date(),
                messageCount: 1
            });

            // التحقق من حظر المستخدم
            // Check if user is banned
            if (userData.isBanned) {
                return message.reply(getLang("userBanned"));
            }

            // معالجة الأوامر
            // Process commands
            if (body.startsWith(prefix)) {
                const args = body.slice(prefix.length).trim().split(/\s+/);
                const commandName = args.shift().toLowerCase();

                // البحث عن الأمر
                // Find command
                const command = commandHandler.getCommand(commandName);
                
                if (!command) {
                    return message.reply(getLang("commandNotFound", commandName));
                }

                // التحقق من الصلاحيات
                // Check permissions
                if (command.config.role > 0) {
                    const hasPermission = await this.checkPermission(senderID, command.config.role);
                    if (!hasPermission) {
                        return message.reply(getLang("adminOnly"));
                    }
                }

                // التحقق من فترة الانتظار
                // Check cooldown
                const cooldownKey = `${senderID}_${commandName}`;
                const cooldownTime = command.config.countDown * 1000;
                
                if (security.isOnCooldown(cooldownKey, cooldownTime)) {
                    const remainingTime = security.getRemainingCooldown(cooldownKey, cooldownTime);
                    return message.reply(getLang("cooldownActive", Math.ceil(remainingTime / 1000)));
                }

                // تنفيذ الأمر
                // Execute command
                try {
                    security.setCooldown(cooldownKey);
                    
                    await command.onStart({
                        message,
                        event,
                        args,
                        prefix,
                        commandName,
                        userData,
                        getLang: (key, ...params) => this.getCommandLang(command, key, ...params),
                        instagramAPI,
                        userModel,
                        security
                    });

                    // تحديث إحصائيات الأمر
                    // Update command statistics
                    await this.updateCommandStats(commandName, senderID);

                } catch (error) {
                    console.error(`Command execution error [${commandName}]:`, error);
                    return message.reply(`خطأ في تنفيذ الأمر: ${error.message}`);
                }

            } else {
                // معالجة الرسائل العادية (غير الأوامر)
                // Process regular messages (non-commands)
                await this.processRegularMessage({
                    message,
                    event,
                    userData,
                    getLang,
                    instagramAPI,
                    userModel
                });
            }

            // معالجة الردود
            // Process replies
            await this.processReplies({
                message,
                event,
                userData,
                commandHandler,
                getLang
            });

        } catch (error) {
            console.error('Message event error:', error);
        }
    },

    /**
     * معالجة الرسائل العادية
     * Process regular messages
     */
    processRegularMessage: async function({ message, event, userData, getLang, instagramAPI, userModel }) {
        try {
            const { body, senderID } = event;

            // تحليل الرسالة للبحث عن معرفات Instagram
            // Parse message for Instagram identifiers
            const usernameRegex = /@([a-zA-Z0-9._]{1,30})/g;
            const matches = body.match(usernameRegex);

            if (matches) {
                // معالجة المعرفات المذكورة
                // Process mentioned usernames
                for (const match of matches) {
                    const username = match.substring(1);
                    // يمكن إضافة منطق لمعالجة المعرفات المذكورة
                    // Can add logic to handle mentioned usernames
                }
            }

            // فحص الكلمات المفتاحية
            // Check for keywords
            const keywords = ['help', 'مساعدة', 'start', 'بدء'];
            if (keywords.some(keyword => body.toLowerCase().includes(keyword))) {
                // عرض رسالة المساعدة
                // Show help message
                const helpText = `
مرحباً! أنا بوت Instagram 🤖

الأوامر المتاحة:
• !profile [username] - عرض معلومات الملف الشخصي
• !help - عرض هذه الرسالة
• !stats - عرض إحصائيات البوت

للحصول على مساعدة مفصلة، اكتب !help [اسم الأمر]
                `.trim();
                
                return message.reply(helpText);
            }

        } catch (error) {
            console.error('Regular message processing error:', error);
        }
    },

    /**
     * معالجة الردود
     * Process replies
     */
    processReplies: async function({ message, event, userData, commandHandler, getLang }) {
        try {
            // البحث عن ردود مخزنة
            // Look for stored replies
            const replyData = await commandHandler.getReply(event.messageID);
            
            if (replyData) {
                const command = commandHandler.getCommand(replyData.commandName);
                
                if (command && command.onReply) {
                    await command.onReply({
                        message,
                        event,
                        Reply: replyData,
                        userData,
                        getLang: (key, ...params) => this.getCommandLang(command, key, ...params)
                    });
                }
            }

        } catch (error) {
            console.error('Reply processing error:', error);
        }
    },

    /**
     * التحقق من الصلاحيات
     * Check permissions
     */
    checkPermission: async function(userID, requiredRole) {
        try {
            const config = require('../../config/config');
            
            switch (requiredRole) {
                case 1: // Admin
                    return config.adminBot.includes(userID);
                case 2: // Developer
                    return config.DEV.includes(userID) || config.GOD.includes(userID);
                default:
                    return true;
            }

        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    },

    /**
     * الحصول على نص الأمر باللغة المحددة
     * Get command text in specified language
     */
    getCommandLang: function(command, key, ...params) {
        try {
            const { languageManager } = require('../../utils/language');
            const currentLang = languageManager.getCurrentLanguage();
            
            if (command.langs && command.langs[currentLang] && command.langs[currentLang][key]) {
                let text = command.langs[currentLang][key];
                
                // استبدال المتغيرات
                // Replace variables
                if (params.length > 0) {
                    params.forEach((param, index) => {
                        text = text.replace(new RegExp(`%${index + 1}`, 'g'), param);
                    });
                }
                
                return text;
            }

            return `[${command.config.name}.${key}]`;

        } catch (error) {
            console.error('Command language error:', error);
            return `[${key}]`;
        }
    },

    /**
     * تحديث إحصائيات الأمر
     * Update command statistics
     */
    updateCommandStats: async function(commandName, userID) {
        try {
            // يمكن إضافة منطق لتحديث الإحصائيات
            // Can add logic to update statistics
            console.log(`Command used: ${commandName} by ${userID}`);

        } catch (error) {
            console.error('Command stats update error:', error);
        }
    }
};