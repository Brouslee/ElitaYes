# دليل إنشاء الأحداث - Event Creation Guide

## البنية الأساسية للحدث - Basic Event Structure

```javascript
module.exports = {
    config: {
        name: "اسم_الحدث", // Event name
        version: "1.0.0",
        author: "اسم المطور", // Developer name
        description: {
            ar: "وصف الحدث بالعربية",
            en: "Event description in English"
        },
        category: "events"
    },

    langs: {
        ar: {
            // النصوص باللغة العربية
            welcome: "مرحباً بك!",
            goodbye: "وداعاً!",
            error: "حدث خطأ: %1"
        },
        en: {
            // النصوص باللغة الإنجليزية
            welcome: "Welcome!",
            goodbye: "Goodbye!",
            error: "Error occurred: %1"
        }
    },

    // تنفيذ الحدث الرئيسي
    // Main event execution
    onStart: async function({ 
        message, 
        event, 
        getLang, 
        instagramAPI, 
        userModel, 
        groupModel,
        security 
    }) {
        try {
            // منطق الحدث هنا
            // Event logic here
            
        } catch (error) {
            console.error('Event error:', error);
        }
    }
};
```

## أنواع الأحداث المختلفة - Different Event Types

### حدث الرسائل - Message Event
```javascript
module.exports = {
    config: {
        name: "message",
        description: { ar: "معالجة جميع الرسائل", en: "Process all messages" }
    },
    
    onStart: async function({ message, event, commandHandler, getLang }) {
        const { body, senderID } = event;
        
        // معالجة الأوامر
        // Process commands
        if (body.startsWith('!')) {
            const args = body.slice(1).split(' ');
            const commandName = args.shift();
            
            const command = commandHandler.getCommand(commandName);
            if (command) {
                await commandHandler.executeCommand(command, { message, args });
            }
        }
        
        // معالجة الرسائل العادية
        // Process regular messages
        else {
            console.log(`Message from ${senderID}: ${body}`);
        }
    }
};
```

### حدث الترحيب - Welcome Event
```javascript
module.exports = {
    config: {
        name: "userJoin",
        description: { ar: "ترحيب بالأعضاء الجدد", en: "Welcome new members" }
    },
    
    onStart: async function({ message, event, getLang, userModel }) {
        const { addedParticipants, threadID } = event;
        
        for (const user of addedParticipants) {
            // إنشاء بيانات المستخدم
            // Create user data
            await userModel.createOrUpdate({
                instagramId: user.userFbId,
                joinedAt: new Date()
            });
            
            // إرسال رسالة ترحيب
            // Send welcome message
            const welcomeMsg = getLang("welcome") + ` @${user.fullName}`;
            await message.send(welcomeMsg, threadID);
        }
    }
};
```

### حدث المغادرة - Leave Event
```javascript
module.exports = {
    config: {
        name: "userLeave",
        description: { ar: "وداع الأعضاء", en: "Farewell members" }
    },
    
    onStart: async function({ message, event, getLang }) {
        const { leftParticipantFbId, threadID } = event;
        
        // رسالة وداع
        // Farewell message
        const goodbyeMsg = getLang("goodbye");
        await message.send(goodbyeMsg, threadID);
    }
};
```

### حدث التفاعل - Reaction Event
```javascript
module.exports = {
    config: {
        name: "messageReaction",
        description: { ar: "معالجة التفاعلات", en: "Handle reactions" }
    },
    
    onStart: async function({ event, instagramAPI }) {
        const { messageID, reaction, userID } = event;
        
        // معالجة تفاعلات مختلفة
        // Handle different reactions
        switch (reaction) {
            case "👍":
                console.log(`User ${userID} liked message ${messageID}`);
                break;
            case "❤️":
                console.log(`User ${userID} loved message ${messageID}`);
                break;
        }
    }
};
```

## الأحداث التلقائية - Automatic Events

### حدث الرد التلقائي - Auto Reply Event
```javascript
module.exports = {
    config: {
        name: "autoReply",
        description: { ar: "الرد التلقائي", en: "Auto reply" }
    },
    
    onStart: async function({ message, event, getLang }) {
        const { body } = event;
        
        // كلمات مفتاحية للرد التلقائي
        // Keywords for auto reply
        const keywords = {
            "السلام عليكم": "وعليكم السلام ورحمة الله وبركاته",
            "مرحبا": "أهلاً وسهلاً بك!",
            "hello": "Hello there!",
            "hi": "Hi! How can I help you?"
        };
        
        for (const [keyword, reply] of Object.entries(keywords)) {
            if (body.toLowerCase().includes(keyword.toLowerCase())) {
                await message.reply(reply);
                break;
            }
        }
    }
};
```

### حدث تتبع النشاط - Activity Tracking Event
```javascript
module.exports = {
    config: {
        name: "activityTracker",
        description: { ar: "تتبع نشاط المستخدمين", en: "Track user activity" }
    },
    
    onStart: async function({ event, userModel }) {
        const { senderID, type } = event;
        
        // تحديث آخر نشاط
        // Update last activity
        await userModel.updateLastActivity(senderID, {
            type,
            timestamp: new Date()
        });
        
        // إحصائيات النشاط
        // Activity statistics
        await userModel.incrementActivityCount(senderID, type);
    }
};
```

## المتغيرات المتاحة - Available Variables

### في دالة onStart:
- `message`: كائن إدارة الرسائل - Message management object
- `event`: بيانات الحدث - Event data
- `getLang(key, ...params)`: دالة الحصول على النص - Get text function
- `instagramAPI`: واجهة Instagram API
- `userModel`: نموذج المستخدم - User model
- `groupModel`: نموذج المجموعة - Group model
- `security`: نظام الأمان - Security system
- `commandHandler`: معالج الأوامر - Command handler

## بيانات الحدث - Event Data

### حدث message:
```javascript
{
    senderID: "معرف المرسل",
    threadID: "معرف المحادثة", 
    messageID: "معرف الرسالة",
    body: "نص الرسالة",
    type: "message",
    timestamp: 1234567890
}
```

### حدث userJoin:
```javascript
{
    addedParticipants: [
        {
            userFbId: "معرف المستخدم",
            fullName: "الاسم الكامل"
        }
    ],
    threadID: "معرف المحادثة"
}
```

## إعدادات متقدمة - Advanced Settings

### استخدام متغيرات البيئة:
```javascript
// في configCommands.json
"envEvents": {
    "autoReply": {
        "enabled": true,
        "responseDelay": 2000
    }
}

// في الحدث
onStart: async function({ event }) {
    const config = event.envConfig || {};
    const delay = config.responseDelay || 1000;
}
```

### فلترة الأحداث:
```javascript
onStart: async function({ event, userModel }) {
    // تجاهل رسائل البوت
    // Ignore bot messages
    if (event.senderID === "bot_id") return;
    
    // تجاهل المستخدمين المحظورين
    // Ignore banned users
    const user = await userModel.findByInstagramId(event.senderID);
    if (user && user.isBanned) return;
    
    // معالجة الحدث
    // Process event
}
```

## نصائح مهمة - Important Tips

1. **استخدم أسماء واضحة للأحداث** - Use clear event names
2. **تعامل مع الأخطاء دائماً** - Always handle errors
3. **لا تحجب العمليات طويلة المدى** - Don't block long operations
4. **استخدم فلترة للأحداث غير المرغوبة** - Filter unwanted events
5. **اختبر الأحداث مع سيناريوهات مختلفة** - Test with different scenarios

## أولويات الأحداث - Event Priorities

الأحداث تعمل بالترتيب التالي:
Events work in the following order:

1. **message** - معالجة جميع الرسائل
2. **userJoin** - انضمام أعضاء جدد  
3. **userLeave** - مغادرة الأعضاء
4. **messageReaction** - تفاعلات الرسائل
5. **activityTracker** - تتبع النشاط

يمكن تخصيص الأولويات في إعدادات الحدث.
Priorities can be customized in event settings.