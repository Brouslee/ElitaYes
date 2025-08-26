# دليل قاعدة البيانات - Database Guide

## نظرة عامة - Overview

يستخدم إطار عمل بوت Instagram قاعدة بيانات SQLite محلية لتخزين بيانات المستخدمين والمجموعات والرسائل.

The Instagram Bot Framework uses a local SQLite database to store users, groups, and message data.

## 🗃️ هيكل قاعدة البيانات - Database Structure

### جداول النظام - System Tables

#### 1. جدول المستخدمين - Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instagram_id TEXT UNIQUE NOT NULL,
    username TEXT,
    full_name TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    profile_pic_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    settings TEXT DEFAULT '{}',
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
