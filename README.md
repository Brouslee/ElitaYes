# ELITA - Instagram Bot Framework

![شعار ELITA](https://i.ibb.co/yFHSq225/dbe6f025fd92aeb583c6b7a4a3a595eb.jpg)

Node.js Support v20.x | إطار عمل ELITA المتقدم لبوتات Instagram | تم التطوير بواسطة محمد العكاري

---

<p align="center">
  <table>
    <tr>
      <td><a href="#-ملاحظة" style="text-decoration:none"><kbd>📝 Note</kbd></a></td>
      <td><a href="#-المتطلبات" style="text-decoration:none"><kbd>🚧 Requirement</kbd></a></td>
      <td><a href="#-الدروس-التعليمية" style="text-decoration:none"><kbd>📝 Tutorial</kbd></a></td>
      <td><a href="#-كيف-يعمل-البوت" style="text-decoration:none"><kbd>💡 How it works</kbd></a></td>
      <td><a href="#️-كيفية-إنشاء-أوامر-جديدة" style="text-decoration:none"><kbd>🛠️ Commands</kbd></a></td>
      <td><a href="#-الدعم" style="text-decoration:none"><kbd>💭 Support</kbd></a></td>
      <td><a href="#-اللغات-المدعومة" style="text-decoration:none"><kbd>📚 Languages</kbd></a></td>
      <td><a href="#-حقوق-الملكية" style="text-decoration:none"><kbd>✨ Copyright</kbd></a></td>
    </tr>
  </table>
</p>

---

## 📝 ملاحظة
هذا إطار عمل متقدم لإنشاء بوتات Instagram تعليمية يستخدم Instagram API غير الرسمي، وقد يؤدي استخدامه إلى حظر الحساب بسبب الرسائل المزعجة أو أسباب أخرى.  
يوصى باستخدام حساب تجريبي يمكن التخلص منه في أي وقت.  
**ELITA Framework** غير مسؤول عن أي مشاكل قد تنتج عن استخدام البوت.

⚠️ **للأغراض التعليمية فقط** ⚠️  
يرجى الالتزام بشروط خدمة Instagram عند الاستخدام.

---

## 🚧 المتطلبات
- Node.js 20.x أو أعلى
- معرفة بالبرمجة، Javascript، Node.js  
- معرفة بـ Instagram API غير الرسمي
- SQLite3 لقاعدة البيانات المحلية

---

## 📝 الدروس التعليمية
- للمبتدئين: [دليل الإعداد السريع](docs/README.md)  
- إنشاء الأوامر: [Command Guide](docs/COMMAND_GUIDE.md)  
- إنشاء الأحداث: [Event Guide](docs/EVENT_GUIDE.md)  
- إعدادات قاعدة البيانات: [Database Guide](docs/DATABASE.md)

---

## 💡 كيف يعمل البوت؟
- يستخدم البوت Instagram API غير الرسمي لإرسال واستقبال الرسائل  
- عند حدوث حدث جديد (رسالة، متابعة، إعجاب، تعليق...) يقوم البوت بإرسال الحدث للـ Event Handlers  

### Event Handlers الرئيسية:
- **onStart**: يتحقق من الأوامر، صلاحيات المستخدم، وحظر الحساب قبل تنفيذ الأمر  
- **onMessage**: ينفذ عند إرسال المستخدم رسالة ويتحقق من صلاحياته قبل تنفيذ الأمر  
- **onFollow**: ينفذ عند متابعة مستخدم جديد للحساب  
- **onLike**: ينفذ عند الإعجاب بمنشور أو قصة  
- **onComment**: ينفذ عند التعليق على منشور  
- **onDM**: ينفذ عند استلام رسالة مباشرة جديدة  

---

## 🛠️ كيفية إنشاء أوامر جديدة
- انظر مجلد `commands` و `events` للحصول على أمثلة  
- استخدم القوالب المتوفرة في `docs/COMMAND_TEMPLATE.md` و `docs/EVENT_TEMPLATE.md`  
- الملفات التي تنتهي بـ `.example.js` لن تُحمّل، غيّر الامتداد إلى `.js` لتفعيلها  
- يدعم الإطار Hot-Reload للأوامر والأحداث أثناء التطوير

### ميزات متقدمة:
- 🔐 نظام المصادقة المتقدم مع Cookie Management  
- 🗄️ تكامل قاعدة بيانات SQLite مع نماذج المستخدمين والمجموعات  
- 🌍 دعم متعدد اللغات (العربية والإنجليزية)  
- 📊 نظام النسخ الاحتياطي التلقائي  
- 🔄 نظام التحديث التلقائي  
- 🛡️ ميزات الأمان المتقدمة مع Rate Limiting  

---

## 💭 الدعم
- تواصل مع المطور: محمد العكاري  
- البريد الإلكتروني: mohammed.alakari@example.com  
- اطلع على الوثائق في مجلد `docs/` للمساعدة التفصيلية  

> يرجى مراجعة دليل الاستكشاف وإصلاح الأخطاء في `docs/` قبل طلب المساعدة  

---

## 📚 اللغات المدعومة
- ar: العربية  
- en: English  

يمكن تغيير اللغة في ملف `config/config.js` أو في المجلد `languages/`  
يدعم الإطار التبديل الديناميكي بين اللغات

---

## ✨ حقوق الملكية
- المطور والمؤسس: **محمد العكاري**  
- اسم المشروع: **ELITA - Advanced Instagram Bot Framework**  
- الإصدار: 2.0.0  
- الترخيص: ISC  

**تم تطوير هذا الإطار من الصفر بواسطة محمد العكاري كإطار عمل تعليمي متقدم لبوتات Instagram**

### المساهمات:
- البنية الأساسية: مستوحاة من أنماط GoatBot Architecture  
- التطوير والتنفيذ: محمد العكاري  
- الهدف: إنشاء أدوات تعليمية متقدمة لفهم Instagram API

---

## 🚀 البدء السريع

1. **تثبيت التبعيات:**
   ```bash
   npm install
   ```

2. **تكوين الإعدادات:**
   - قم بتحرير `config/config.js` لإعداد قاعدة البيانات واللغة
   - أضف ملفات تعريف الارتباط في `data/cookies.json` (اختياري)

3. **تشغيل البوت:**
   ```bash
   npm start
   ```
   أو
   ```bash
   node index.js
   ```

4. **إنشاء أول أمر:**
   - انسخ `commands/example.js` وأعد تسميته
   - اتبع التوجيهات في `docs/COMMAND_GUIDE.md`

---

**⚠️ تذكير مهم: هذا الإطار مخصص للأغراض التعليمية فقط. يرجى الالتزام بشروط خدمة Instagram واستخدام حساب تجريبي للاختبار.**