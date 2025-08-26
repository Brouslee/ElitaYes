# دليل إنشاء الأوامر - Command Creation Guide

## البنية الأساسية للأمر - Basic Command Structure

```javascript
module.exports = {
    config: {
        name: "اسم_الأمر", // Command name
        aliases: ["اسم_مستعار1", "اسم_مستعار2"], // Alternative names
        version: "1.0.0",
        author: "اسم المطور", // Developer name
        countDown: 10, // Cooldown in seconds
        role: 0, // 0: everyone, 1: admin, 2: dev
        description: {
            ar: "وصف الأمر بالعربية",
            en: "Command description in English"
        },
        category: "instagram", // instagram, utility, fun, admin
        guide: {
            ar: "{prefix}اسم_الأمر [المعاملات]",
            en: "{prefix}command_name [parameters]"
        }
    },

    langs: {
        ar: {
            // النصوص باللغة العربية
            success: "تم تنفيذ الأمر بنجاح",
            error: "حدث خطأ: %1",
            invalidInput: "مدخل غير صحيح"
        },
        en: {
            // النصوص باللغة الإنجليزية
            success: "Command executed successfully",
            error: "Error occurred: %1",
            invalidInput: "Invalid input"
        }
    },

    // تنفيذ الأمر الرئيسي
    // Main command execution
    onStart: async function({ message, args, getLang, prefix, instagramAPI, userModel, security }) {
        try {
            // منطق الأمر هنا
            // Command logic here
            
            return message.reply(getLang("success"));
            
        } catch (error) {
            console.error('Command error:', error);
            return message.reply(getLang("error", error.message));
        }
    },

    // معالجة الردود (اختياري)
    // Handle replies (optional)
    onReply: async function({ message, Reply, getLang, instagramAPI }) {
        try {
            // معالجة الردود هنا
            // Reply handling here
            
        } catch (error) {
            console.error('Reply error:', error);
        }
    },

    // معالجة التفاعلات (اختياري)
    // Handle reactions (optional)
    onReaction: async function({ message, Reaction, getLang, instagramAPI }) {
        try {
            // معالجة التفاعلات هنا
            // Reaction handling here
            
        } catch (error) {
            console.error('Reaction error:', error);
        }
    }
};
```

## أمثلة للأوامر المختلفة - Examples for Different Commands

### أمر بسيط - Simple Command
```javascript
module.exports = {
    config: {
        name: "ping",
        aliases: ["p"],
        role: 0,
        description: { ar: "فحص اتصال البوت", en: "Check bot connection" }
    },
    
    onStart: async function({ message }) {
        const startTime = Date.now();
        const reply = await message.reply("🏓 Ping...");
        const endTime = Date.now();
        
        return reply.edit(`🏓 Pong! ${endTime - startTime}ms`);
    }
};
```

### أمر مع معاملات - Command with Parameters
```javascript
module.exports = {
    config: {
        name: "profile",
        role: 0,
        description: { ar: "عرض ملف شخصي", en: "Show profile" },
        guide: { ar: "{prefix}profile @username", en: "{prefix}profile @username" }
    },
    
    onStart: async function({ message, args, getLang }) {
        if (args.length === 0) {
            return message.reply(getLang("noUsername"));
        }
        
        const username = args[0].replace('@', '');
        // منطق جلب الملف الشخصي
        // Profile fetching logic
    }
};
```

### أمر للمطورين فقط - Admin Only Command
```javascript
module.exports = {
    config: {
        name: "restart",
        role: 2, // Dev only
        description: { ar: "إعادة تشغيل البوت", en: "Restart bot" }
    },
    
    onStart: async function({ message, getLang }) {
        await message.reply(getLang("restarting"));
        process.exit(2);
    }
};
```

## المتغيرات المتاحة - Available Variables

### في دالة onStart:
- `message`: كائن الرسالة للرد - Message object for reply
- `args`: مصفوفة المعاملات - Arguments array
- `getLang(key, ...params)`: دالة الحصول على النص - Get text function
- `prefix`: بادئة الأوامر - Command prefix
- `instagramAPI`: واجهة Instagram API
- `userModel`: نموذج المستخدم - User model
- `groupModel`: نموذج المجموعة - Group model
- `security`: نظام الأمان - Security system

### في دالة onReply:
- `message`: الرسالة الجديدة - New message
- `Reply`: بيانات الرد المحفوظة - Saved reply data
- `getLang`: دالة اللغة - Language function

## نصائح مهمة - Important Tips

1. **استخدم getLang() دائماً للنصوص** - Always use getLang() for texts
2. **تعامل مع الأخطاء باستخدام try-catch** - Handle errors with try-catch
3. **تحقق من صحة المدخلات** - Validate inputs
4. **استخدم countDown لمنع السبام** - Use countDown to prevent spam
5. **اختبر الأمر قبل النشر** - Test command before deployment

## إعدادات متقدمة - Advanced Settings

### استخدام متغيرات البيئة:
```javascript
// في configCommands.json
"envCommands": {
    "profile": {
        "maxProfiles": 50,
        "cacheTimeout": 300000
    }
}

// في الأمر
onStart: async function({ command }) {
    const maxProfiles = command.envConfig?.maxProfiles || 10;
}
```

### حفظ بيانات للرد:
```javascript
onStart: async function({ message, addReply }) {
    const reply = await message.reply("اختر رقم:");
    addReply(reply.messageID, {
        type: "selection",
        data: { options: ["1", "2", "3"] }
    });
}
```