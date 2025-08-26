# دليل إنشاء الأحداث - Event Creation Guide

## نظرة عامة - Overview

هذا الدليل يوضح كيفية إنشاء أحداث جديدة لبوت Instagram باستخدام النظام المعياري المتقدم للأحداث.

This guide explains how to create new events for the Instagram bot using the advanced modular event system.

## هيكل الحدث الأساسي - Basic Event Structure

```javascript
module.exports = {
    config: {
        // إعدادات الحدث - Event configuration
    },
    async run(context, ...eventArgs) {
        // منطق معالجة الحدث - Event handling logic
    }
};
