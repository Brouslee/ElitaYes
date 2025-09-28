/**
 * أمر المساعدة المحسن - مستوحى من Goat Bot
 * Enhanced Help Command - Inspired by Goat Bot
 * Enhanced by Mohammed Al-Akari
 */

module.exports = {
    config: {
        name: "مساعدة",
        aliases: ["help", "commands", "أوامر", "الأوامر"],
        version: "2.0",
        author: "Mohammed Al-Akari",
        role: 0,
        category: "معلومات",
        coolDown: 3,
        shortDescription: { 
            ar: "عرض قائمة الأوامر المتاحة أو تفاصيل أمر معين",
            en: "Display list of available commands or details of a specific command"
        },
        longDescription: { 
            ar: "عرض جميع الأوامر المتاحة مقسمة حسب الفئات، أو الحصول على معلومات مفصلة عن أمر معين",
            en: "Display all available commands categorized, or get detailed information about a specific command"
        },
        guide: { 
            ar: "{prefix}مساعدة - عرض جميع الأوامر\n{prefix}مساعدة <اسم الأمر> - تفاصيل أمر معين",
            en: "{prefix}help - show all commands\n{prefix}help <command name> - details of specific command"
        }
    },

    onStart: async function ({ message, args, event }) {
        try {
            const commandName = args[0];
            
            if (commandName) {
                // عرض تفاصيل أمر معين
                await this.showCommandDetails(message, commandName);
            } else {
                // عرض قائمة جميع الأوامر
                await this.showAllCommands(message, event);
            }
            
            global.ELITA.updateStats('totalCommands', 'help');
            
        } catch (error) {
            await message.error(`خطأ في عرض المساعدة: ${error.message}`);
        }
    },

    async showCommandDetails(message, commandName) {
        const commands = global.ELITA.commands;
        const aliases = global.ELITA.aliases;
        
        // البحث عن الأمر
        let command = commands.get(commandName);
        if (!command && aliases.has(commandName)) {
            const realName = aliases.get(commandName);
            command = commands.get(realName);
            commandName = realName;
        }
        
        if (!command) {
            return await message.reply(`❌ لم يتم العثور على أمر باسم "${commandName}"`);
        }
        
        const config = command.config;
        const prefix = global.ELITA.config.bot.prefix || '';
        
        const details = `
╔══════════════════════════════════╗
║         📖 تفاصيل الأمر          ║
╠══════════════════════════════════╣
║                                  ║
║ 🏷️ الاسم: ${config.name}                    ║
║ 📂 الفئة: ${config.category || 'عام'}         ║
║ 👤 المطور: ${config.author || 'غير محدد'}    ║
║ 🔢 الإصدار: ${config.version || '1.0'}      ║
║ ⏱️ فترة الانتظار: ${config.coolDown || 0} ثانية    ║
║ 👑 الصلاحية: ${this.getRoleText(config.role)} ║
║                                  ║
║ 📝 الوصف:                       ║
║ ${this.wrapText(config.shortDescription?.ar || config.shortDescription || 'لا يوجد وصف')} ║
║                                  ║
${config.aliases && config.aliases.length > 0 ? `║ 🔄 الأسماء البديلة:              ║
║ ${config.aliases.join(', ')}                  ║
║                                  ║` : ''}
║ 💡 طريقة الاستخدام:             ║
║ ${this.wrapText(config.guide?.ar || config.guide || `${prefix}${config.name}`)} ║
║                                  ║
╚══════════════════════════════════╝

💬 مثال: ${prefix}${config.name}
`;
        
        await message.reply(details);
    },

    async showAllCommands(message, event) {
        const commands = global.ELITA.commands;
        const prefix = global.ELITA.config.bot.prefix || '';
        
        // تجميع الأوامر حسب الفئات
        const categories = {};
        let totalCommands = 0;
        
        for (const [name, command] of commands) {
            if (!command.config) continue;
            
            const category = command.config.category || 'عام';
            if (!categories[category]) {
                categories[category] = [];
            }
            
            categories[category].push({
                name: command.config.name,
                description: command.config.shortDescription?.ar || command.config.shortDescription || '',
                role: command.config.role || 0
            });
            
            totalCommands++;
        }
        
        // بناء رسالة المساعدة
        let helpMessage = `
╔══════════════════════════════════╗
║      📚 دليل أوامر ELITA 📚      ║
╠══════════════════════════════════╣
║                                  ║
║ 🤖 البوت: ${global.ELITA.config.bot.name}              ║
║ ⚡ الإصدار: v${global.ELITA.version}               ║
║ 📊 إجمالي الأوامر: ${global.utils.advanced.formatNumber(totalCommands)}         ║
║ 🔗 البادئة: ${prefix || 'لا توجد'}                    ║
║                                  ║
╚══════════════════════════════════╝

`;

        // عرض الأوامر مقسمة حسب الفئات
        const categoryEmojis = {
            'معلومات': '📋',
            'إدارة': '⚙️',
            'ترفيه': '🎮',
            'أدوات': '🔧',
            'عام': '📦',
            'مطورين': '👨‍💻'
        };

        for (const [categoryName, commandList] of Object.entries(categories)) {
            const emoji = categoryEmojis[categoryName] || '📁';
            helpMessage += `\n${emoji} **${categoryName}** (${commandList.length}):\n`;
            
            for (const cmd of commandList) {
                const roleIcon = this.getRoleIcon(cmd.role);
                helpMessage += `${roleIcon} \`${prefix}${cmd.name}\` - ${cmd.description.substring(0, 40)}${cmd.description.length > 40 ? '...' : ''}\n`;
            }
        }
        
        helpMessage += `
────────────────────────────────────
💡 **كيفية الاستخدام:**
• \`${prefix}مساعدة <اسم الأمر>\` - تفاصيل أمر معين
• \`${prefix}مدة\` - حالة البوت
• \`${prefix}معلومات\` - معلومات البوت

🔐 **الصلاحيات:**
👤 للجميع | 👑 للمشرفين | 👨‍💻 للمطورين

⚠️ **تذكير:** هذا البوت للأغراض التعليمية فقط
────────────────────────────────────
`;
        
        // تقسيم الرسالة إذا كانت طويلة
        const messages = global.utils.messageUtils.splitLongMessage(helpMessage, 1500);
        
        for (const msg of messages) {
            await message.reply(msg);
            await global.utils.advanced.delay(500); // تأخير بسيط بين الرسائل
        }
    },

    getRoleText(role) {
        const roles = {
            0: 'الجميع',
            1: 'المشرفين',
            2: 'المطورين'
        };
        return roles[role] || 'غير محدد';
    },

    getRoleIcon(role) {
        const icons = {
            0: '👤',
            1: '👑',
            2: '👨‍💻'
        };
        return icons[role] || '❓';
    },

    wrapText(text, maxWidth = 30) {
        if (text.length <= maxWidth) return text;
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            if ((currentLine + word).length > maxWidth) {
                if (currentLine) {
                    lines.push(currentLine.trim());
                    currentLine = word + ' ';
                } else {
                    lines.push(word);
                }
            } else {
                currentLine += word + ' ';
            }
        }
        
        if (currentLine) {
            lines.push(currentLine.trim());
        }
        
        return lines.join('\n║ ');
    }
};