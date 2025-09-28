/**
 * أمر مدة التشغيل المحسن - مستوحى من Goat Bot
 * Enhanced Uptime Command - Inspired by Goat Bot
 * Enhanced by Mohammed Al-Akari
 */

const os = require('os');

module.exports = {
    config: {
        name: "مدة",
        aliases: ["uptime", "حالة", "status", "اوبتايم"],
        version: "2.0",
        author: "Mohammed Al-Akari",
        role: 0, // 0: user, 1: admin, 2: developer
        category: "معلومات",
        coolDown: 5, // seconds
        shortDescription: { 
            ar: "عرض مدة تشغيل البوت وحالة النظام",
            en: "Display bot uptime and system status"
        },
        longDescription: { 
            ar: "عرض معلومات مفصلة عن مدة تشغيل البوت، حالة النظام، استخدام الذاكرة، وإحصائيات الأداء",
            en: "Display detailed information about bot uptime, system status, memory usage, and performance statistics"
        },
        guide: { 
            ar: "{prefix}مدة\n{prefix}حالة",
            en: "{prefix}uptime\n{prefix}status"
        }
    },

    onStart: async function ({ message, args, event }) {
        try {
            // الحصول على إحصائيات النظام
            const botUptime = global.ELITA.getUptime();
            const systemUptime = os.uptime() * 1000;
            
            // تنسيق مدة التشغيل
            const formatUptime = global.utils.advanced.convertTime;
            const botUptimeFormatted = formatUptime(botUptime);
            const systemUptimeFormatted = formatUptime(systemUptime);
            
            // معلومات الذاكرة
            const memoryUsage = process.memoryUsage();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            
            // معلومات المعالج
            const cpus = os.cpus();
            const cpuModel = cpus[0].model;
            const cpuCores = cpus.length;
            
            // إحصائيات البوت
            const stats = global.ELITA.stats;
            const commandsCount = global.ELITA.commands.size;
            const eventsCount = global.ELITA.events.size;
            
            // حالة قاعدة البيانات
            const dbStatus = global.db.isConnected ? '🟢 متصل' : '🔴 منقطع';
            const instagramStatus = global.ELITA.status.instagram === 'connected' ? '🟢 متصل' : '🔴 منقطع';
            
            // تنسيق المعلومات
            const formatBytes = global.utils.advanced.formatBytes;
            const formatNumber = global.utils.advanced.formatNumber;

            const statusMessage = `
╔══════════════════════════════════╗
║        ⚡ حالة بوت ELITA ⚡        ║
╠══════════════════════════════════╣
║                                  ║
║ 🤖 معلومات البوت:               ║
║ └ الاسم: ${global.ELITA.config.bot.name}                   ║
║ └ الإصدار: v${global.ELITA.version}                    ║
║ └ المطور: ${global.ELITA.author}        ║
║ └ مدة التشغيل: ${botUptimeFormatted}       ║
║                                  ║
║ 📊 الإحصائيات:                  ║
║ └ عدد الأوامر: ${formatNumber(commandsCount)}                  ║
║ └ عدد الأحداث: ${formatNumber(eventsCount)}                    ║
║ └ الأوامر المنفذة: ${formatNumber(stats.totalCommands)}          ║
║ └ الرسائل المعالجة: ${formatNumber(stats.totalMessages)}        ║
║                                  ║
║ 🔗 حالة الاتصالات:              ║
║ └ قاعدة البيانات: ${dbStatus}         ║
║ └ Instagram: ${instagramStatus}           ║
║                                  ║
║ 💻 معلومات النظام:              ║
║ └ النظام: ${os.type()} ${os.release()}    ║
║ └ المعمارية: ${os.arch()}                ║
║ └ المعالج: ${cpuModel.substring(0, 20)}...║
║ └ عدد الأنوية: ${cpuCores}                    ║
║ └ مدة تشغيل النظام: ${systemUptimeFormatted} ║
║                                  ║
║ 🧠 استخدام الذاكرة:             ║
║ └ الإجمالي: ${formatBytes(totalMemory)}               ║
║ └ المستخدم: ${formatBytes(usedMemory)}               ║
║ └ الفارغ: ${formatBytes(freeMemory)}                 ║
║ └ البوت: ${formatBytes(memoryUsage.rss)}                ║
║                                  ║
║ ⚙️ معلومات إضافية:              ║
║ └ Node.js: ${process.version}              ║
║ └ PID: ${process.pid}                        ║
║ └ Platform: ${process.platform}            ║
║                                  ║
╚══════════════════════════════════╝

📈 الأداء: ${this.getPerformanceIndicator(memoryUsage, totalMemory)}
🕐 آخر نشاط: ${this.getLastActivityTime()}

💡 استخدم الأمر \`معلومات\` للحصول على معلومات مفصلة أكثر
`;

            await message.reply(statusMessage);
            
            // تحديث إحصائيات الأمر
            global.ELITA.updateStats('totalCommands', 'uptime');
            
        } catch (error) {
            await message.error(`حدث خطأ في عرض حالة البوت: ${error.message}`);
        }
    },

    // دوال مساعدة
    getPerformanceIndicator(memoryUsage, totalMemory) {
        const memoryPercent = (memoryUsage.rss / totalMemory) * 100;
        
        if (memoryPercent < 10) return '🟢 ممتاز';
        if (memoryPercent < 25) return '🟡 جيد';
        if (memoryPercent < 50) return '🟠 متوسط';
        return '🔴 مرتفع';
    },

    getLastActivityTime() {
        const lastActivity = global.ELITA.lastActivity;
        const now = Date.now();
        const diff = now - lastActivity;
        
        if (diff < 60000) return 'الآن';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة مضت`;
        return `${Math.floor(diff / 3600000)} ساعة مضت`;
    }
};