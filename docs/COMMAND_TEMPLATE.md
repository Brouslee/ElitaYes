# دليل إنشاء الأوامر - Command Creation Guide

## نظرة عامة - Overview

هذا الدليل يوضح كيفية إنشاء أوامر جديدة لبوت Instagram باستخدام النظام المعياري المتقدم.

This guide explains how to create new commands for the Instagram bot using the advanced modular system.

## هيكل الأمر الأساسي - Basic Command Structure

```javascript
module.exports = {
    config: {
        // إعدادات الأمر - Command configuration
    },
    async run(context) {
        // منطق تنفيذ الأمر - Command execution logic
    }
};
