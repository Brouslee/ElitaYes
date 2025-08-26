/**
 * مثال على أمر البوت
 * Bot Command Example
 * 
 * هذا ملف مثال يوضح كيفية إنشاء أمر جديد للبوت
 * This is an example file showing how to create a new bot command
 * 
 * نسخ هذا الملف وتعديله لإنشاء أوامر جديدة
 * Copy this file and modify it to create new commands
 */

const logger = require('../core/logger');
const User = require('../database/models/User');

module.exports = {
    // إعدادات الأمر - Command Configuration
    config: {
        // اسم الأمر (مطلوب) - Command name (required)
        name: 'example',
        
        // وصف الأمر - Command description
        description: 'مثال على أمر البوت - Example bot command',
        
        // طريقة الاستخدام - Usage pattern
        usage: 'example [parameter]',
        
        // الأسماء البديلة للأمر - Command aliases
        aliases: ['ex', 'demo'],
        
        // فئة الأمر - Command category
        category: 'عام - General',
        
        // فترة الانتظار بالثواني (اختياري) - Cooldown in seconds (optional)
        cooldown: 5,
        
        // الصلاحيات المطلوبة (اختياري) - Required permissions (optional)
        permissions: [],
        
        // هل الأمر للمشرفين فقط؟ - Is admin only?
        adminOnly: false,
        
        // هل الأمر للمجموعات فقط؟ - Is group only?
        groupOnly: false,
        
        // هل الأمر للرسائل الخاصة فقط؟ - Is DM only?
        dmOnly: false,
        
        // الحد الأدنى لعدد المعاملات - Minimum arguments
        minArgs: 0,
        
        // الحد الأقصى لعدد المعاملات - Maximum arguments
        maxArgs: -1, // -1 = لا حدود - unlimited
        
        // مثال على الاستخدام - Usage examples
        examples: [
            'example',
            'example hello',
            'ex test'
        ]
    },

    /**
     * تنفيذ الأمر - Execute Command
     * @param {Object} context - سياق الأمر - Command context
     * @param {Object} context.bot - مرجع البوت - Bot reference
     * @param {Object} context.message - بيانات الرسالة - Message data
     * @param {Array} context.args - معاملات الأمر - Command arguments
     * @param {Object} context.user - بيانات المستخدم - User data
     * @param {Function} context.reply - دالة الرد - Reply function
     */
    async run(context) {
        try {
            const { bot, message, args, user, reply } = context;

            // تسجيل استخدام الأمر - Log command usage
            logger.info(`تنفيذ أمر المثال بواسطة - Example command executed by: ${user.username || user.id}`);

            // التحقق من وجود معاملات - Check for arguments
            if (args.length === 0) {
                // رد افتراضي بدون معاملات - Default reply without arguments
                await reply(`
🤖 *مرحباً! هذا مثال على أمر البوت*
*Hello! This is an example bot command*

📝 **طريقة الاستخدام - Usage:**
\`!example [parameter]\`

📋 **أمثلة - Examples:**
• \`!example\` - رسالة ترحيب
• \`!example hello\` - رسالة مخصصة
• \`!ex test\` - استخدام الاسم البديل

ℹ️ **معلومات إضافية - Additional Info:**
• الفئة: ${this.config.category}
• فترة الانتظار: ${this.config.cooldown} ثانية
• الأسماء البديلة: ${this.config.aliases.join(', ')}
                `);
                return;
            }

            // معالجة المعاملات - Process arguments
            const parameter = args.join(' ');

            // التفاعل مع قاعدة البيانات - Database interaction
            let dbUser = await User.findByInstagramId(user.id);
            
            if (!dbUser) {
                // إنشاء مستخدم جديد - Create new user
                dbUser = new User({
                    instagramId: user.id,
                    username: user.username || 'unknown'
                });
                await dbUser.save();
                logger.info(`تم إنشاء مستخدم جديد - New user created: ${user.id}`);
            }

            // تحديث وقت النشاط - Update last activity
            await dbUser.updateLastActivity();

            // رد مخصص مع المعامل - Custom reply with parameter
            await reply(`
✅ *تم تنفيذ الأمر بنجاح!*
*Command executed successfully!*

📥 **المعامل المرسل - Sent Parameter:** \`${parameter}\`
👤 **المستخدم - User:** ${dbUser.username || dbUser.instagramId}
🕒 **الوقت - Time:** ${new Date().toLocaleString('ar-SA')}

🔧 **معلومات تقنية - Technical Info:**
• معرف المستخدم: \`${user.id}\`
• عدد المعاملات: ${args.length}
• نوع الرسالة: ${message.groupId ? 'مجموعة' : 'خاص'}
            `);

            // مثال على إرسال رسالة إضافية (اختياري)
            // Example of sending additional message (optional)
            if (parameter.toLowerCase() === 'help') {
                await reply(`
🆘 **مساعدة إضافية - Additional Help:**

هذا الأمر مخصص للاختبار والتطوير
This command is for testing and development

🔗 **الدوال المتاحة - Available Functions:**
• \`context.bot\` - الوصول للبوت
• \`context.message\` - بيانات الرسالة
• \`context.args\` - معاملات الأمر
• \`context.user\` - بيانات المستخدم
• \`context.reply()\` - إرسال رد

📚 **للمزيد من المعلومات:**
راجع ملف docs/COMMAND_TEMPLATE.md
                `);
            }

        } catch (error) {
            // معالجة الأخطاء - Error handling
            logger.error('خطأ في تنفيذ أمر المثال - Error executing example command:', error);
            
            await context.reply(`
❌ **حدث خطأ أثناء تنفيذ الأمر**
**An error occurred while executing the command**

🔍 **تفاصيل الخطأ - Error Details:**
\`${error.message}\`

💡 **اقتراحات - Suggestions:**
• تأكد من صحة المعاملات
• جرب الأمر مرة أخرى
• تواصل مع المطور إذا استمر الخطأ
            `);
        }
    }
};

/*
==============================================
دليل إنشاء أمر جديد - New Command Creation Guide
==============================================

1. نسخ هذا الملف وإعادة تسميته
   Copy this file and rename it

2. تعديل config.name ليكون اسم الأمر الجديد
   Modify config.name to be the new command name

3. تحديث الوصف والإعدادات الأخرى
   Update description and other settings

4. كتابة منطق الأمر في دالة run()
   Write command logic in run() function

5. اختبار الأمر والتأكد من عمله
   Test the command and ensure it works

==============================================
الدوال المتاحة في context - Available Functions in context
==============================================

• context.bot - مرجع البوت الرئيسي
• context.message - بيانات الرسالة الواردة
• context.args - مصفوفة معاملات الأمر
• context.user - معلومات المستخدم
• context.reply(message, options) - إرسال رد

==============================================
أمثلة على الاستخدام - Usage Examples
==============================================

// إرسال رسالة بسيطة
await context.reply('مرحباً!');

// إرسال رسالة منسقة
await context.reply(`**عنوان**\n\`كود\`\n*مائل*`);

// الوصول لبيانات المستخدم
const userId = context.user.id;
const username = context.user.username;

// استخدام قاعدة البيانات
const dbUser = await User.findByInstagramId(userId);

// إرسال رسالة للبوت
await context.bot.sendMessage(userId, 'رسالة');

==============================================
*/
