# دليل الأمان - Security Guide

## نظرة عامة - Overview

هذا الدليل يوضح الميزات الأمنية المدمجة في إطار عمل بوت Instagram وكيفية استخدامها بشكل آمن.

This guide explains the security features built into the Instagram Bot Framework and how to use them safely.

## ⚠️ تحذيرات أمنية مهمة - Important Security Warnings

### 🚨 تحذير قانوني - Legal Warning
- **هذا الإطار للأغراض التعليمية فقط**
- **يجب الامتثال لشروط خدمة Instagram**
- **المستخدم مسؤول عن الاستخدام القانوني**

### 🔒 حماية البيانات - Data Protection
- لا تشارك ملفات الكوكيز مع أي شخص
- استخدم كلمات مرور قوية
- قم بتشفير البيانات الحساسة

## 🛡️ نظام تقييد الوصول - Access Control System

### تقييد عنوان IP - IP Restriction

```javascript
// config/config.js
security: {
    allowedIPs: [
        '127.0.0.1',           // المضيف المحلي - Localhost
        '192.168.1.100',       // IP الخاص بك - Your IP
        '10.0.0.50'            // IP إضافي - Additional IP
    ],
    enableIPRestriction: true  // تفعيل التقييد - Enable restriction
}
