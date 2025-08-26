const db = require('../config/database');
const User = require('./models/User');
const Group = require('./models/Group');
const logger = require('../core/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * تهيئة قاعدة البيانات
 * Database Initialization
 */

class DatabaseInitializer {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * تهيئة قاعدة البيانات وإنشاء الجداول
     * Initialize database and create tables
     */
    async initialize() {
        try {
            logger.info('بدء تهيئة قاعدة البيانات - Starting database initialization...');

            // الاتصال بقاعدة البيانات
            // Connect to database
            await db.connect();

            // إنشاء الجداول
            // Create tables
            await this.createTables();

            // إنشاء الفهارس
            // Create indexes
            await this.createIndexes();

            // تشغيل التحديثات إذا لزم الأمر
            // Run migrations if needed
            await this.runMigrations();

            this.isInitialized = true;
            logger.info('تم تهيئة قاعدة البيانات بنجاح - Database initialized successfully');

        } catch (error) {
            logger.error('فشل في تهيئة قاعدة البيانات - Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * إنشاء جميع الجداول المطلوبة
     * Create all required tables
     */
    async createTables() {
        try {
            logger.info('إنشاء الجداول - Creating tables...');

            // إنشاء جدول المستخدمين
            // Create users table
            await User.createTable();

            // إنشاء جداول المجموعات
            // Create groups tables
            await Group.createTable();

            // إنشاء جدول الرسائل
            // Create messages table
            await this.createMessagesTable();

            // إنشاء جدول سجل الأوامر
            // Create command logs table
            await this.createCommandLogsTable();

            // إنشاء جدول الإعدادات
            // Create settings table
            await this.createSettingsTable();

            logger.info('تم إنشاء جميع الجداول بنجاح - All tables created successfully');

        } catch (error) {
            logger.error('خطأ في إنشاء الجداول - Error creating tables:', error);
            throw error;
        }
    }

    /**
     * إنشاء جدول الرسائل
     * Create messages table
     */
    async createMessagesTable() {
        try {
            const sql = `
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id TEXT UNIQUE NOT NULL,
                    instagram_message_id TEXT,
                    user_instagram_id TEXT NOT NULL,
                    group_instagram_id TEXT,
                    content TEXT NOT NULL,
                    message_type TEXT DEFAULT 'text',
                    is_command BOOLEAN DEFAULT FALSE,
                    command_name TEXT,
                    reply_to_message_id TEXT,
                    media_url TEXT,
                    media_type TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT FALSE,
                    metadata TEXT DEFAULT '{}',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await db.run(sql);
            logger.debug('تم إنشاء جدول الرسائل - Messages table created');

        } catch (error) {
            logger.error('خطأ في إنشاء جدول الرسائل - Error creating messages table:', error);
            throw error;
        }
    }

    /**
     * إنشاء جدول سجل الأوامر
     * Create command logs table
     */
    async createCommandLogsTable() {
        try {
            const sql = `
                CREATE TABLE IF NOT EXISTS command_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command_name TEXT NOT NULL,
                    user_instagram_id TEXT NOT NULL,
                    group_instagram_id TEXT,
                    arguments TEXT,
                    execution_time INTEGER,
                    success BOOLEAN DEFAULT TRUE,
                    error_message TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    metadata TEXT DEFAULT '{}'
                )
            `;

            await db.run(sql);
            logger.debug('تم إنشاء جدول سجل الأوامر - Command logs table created');

        } catch (error) {
            logger.error('خطأ في إنشاء جدول سجل الأوامر - Error creating command logs table:', error);
            throw error;
        }
    }

    /**
     * إنشاء جدول الإعدادات
     * Create settings table
     */
    async createSettingsTable() {
        try {
            const sql = `
                CREATE TABLE IF NOT EXISTS bot_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT NOT NULL,
                    description TEXT,
                    category TEXT DEFAULT 'general',
                    data_type TEXT DEFAULT 'string',
                    is_encrypted BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await db.run(sql);

            // إدراج الإعدادات الافتراضية
            // Insert default settings
            await this.insertDefaultSettings();

            logger.debug('تم إنشاء جدول الإعدادات - Settings table created');

        } catch (error) {
            logger.error('خطأ في إنشاء جدول الإعدادات - Error creating settings table:', error);
            throw error;
        }
    }

    /**
     * إدراج الإعدادات الافتراضية
     * Insert default settings
     */
    async insertDefaultSettings() {
        try {
            const defaultSettings = [
                {
                    key: 'bot_version',
                    value: '1.0.0',
                    description: 'إصدار البوت الحالي - Current bot version',
                    category: 'system'
                },
                {
                    key: 'maintenance_mode',
                    value: 'false',
                    description: 'وضع الصيانة - Maintenance mode',
                    category: 'system',
                    data_type: 'boolean'
                },
                {
                    key: 'max_message_length',
                    value: '2000',
                    description: 'الحد الأقصى لطول الرسالة - Maximum message length',
                    category: 'limits',
                    data_type: 'number'
                },
                {
                    key: 'command_cooldown',
                    value: '3',
                    description: 'فترة الانتظار بين الأوامر بالثواني - Command cooldown in seconds',
                    category: 'limits',
                    data_type: 'number'
                },
                {
                    key: 'auto_backup',
                    value: 'true',
                    description: 'النسخ الاحتياطي التلقائي - Automatic backup',
                    category: 'backup',
                    data_type: 'boolean'
                }
            ];

            for (const setting of defaultSettings) {
                const existingSetting = await db.get(
                    'SELECT id FROM bot_settings WHERE key = ?',
                    [setting.key]
                );

                if (!existingSetting) {
                    await db.run(`
                        INSERT INTO bot_settings (key, value, description, category, data_type)
                        VALUES (?, ?, ?, ?, ?)
                    `, [setting.key, setting.value, setting.description, setting.category, setting.data_type || 'string']);
                }
            }

        } catch (error) {
            logger.error('خطأ في إدراج الإعدادات الافتراضية - Error inserting default settings:', error);
        }
    }

    /**
     * إنشاء الفهارس
     * Create indexes
     */
    async createIndexes() {
        try {
            logger.info('إنشاء الفهارس - Creating indexes...');

            const indexes = [
                // فهارس جدول المستخدمين
                // Users table indexes
                'CREATE INDEX IF NOT EXISTS idx_users_instagram_id ON users(instagram_id)',
                'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
                'CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active)',

                // فهارس جدول المجموعات
                // Groups table indexes
                'CREATE INDEX IF NOT EXISTS idx_groups_instagram_id ON groups(instagram_id)',
                'CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name)',
                'CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id)',

                // فهارس جدول أعضاء المجموعات
                // Group members table indexes
                'CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)',
                'CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_instagram_id)',

                // فهارس جدول الرسائل
                // Messages table indexes
                'CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_instagram_id)',
                'CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_instagram_id)',
                'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
                'CREATE INDEX IF NOT EXISTS idx_messages_command ON messages(is_command, command_name)',

                // فهارس جدول سجل الأوامر
                // Command logs table indexes
                'CREATE INDEX IF NOT EXISTS idx_command_logs_user_id ON command_logs(user_instagram_id)',
                'CREATE INDEX IF NOT EXISTS idx_command_logs_command ON command_logs(command_name)',
                'CREATE INDEX IF NOT EXISTS idx_command_logs_timestamp ON command_logs(timestamp)',

                // فهارس جدول الإعدادات
                // Settings table indexes
                'CREATE INDEX IF NOT EXISTS idx_bot_settings_key ON bot_settings(key)',
                'CREATE INDEX IF NOT EXISTS idx_bot_settings_category ON bot_settings(category)'
            ];

            for (const indexSql of indexes) {
                await db.run(indexSql);
            }

            logger.info('تم إنشاء جميع الفهارس بنجاح - All indexes created successfully');

        } catch (error) {
            logger.error('خطأ في إنشاء الفهارس - Error creating indexes:', error);
            throw error;
        }
    }

    /**
     * تشغيل التحديثات
     * Run migrations
     */
    async runMigrations() {
        try {
            logger.info('فحص التحديثات المطلوبة - Checking for required migrations...');

            // إنشاء جدول تتبع التحديثات
            // Create migration tracking table
            await db.run(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version TEXT UNIQUE NOT NULL,
                    description TEXT,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // قائمة التحديثات المتاحة
            // Available migrations
            const migrations = [
                {
                    version: '1.0.0',
                    description: 'Initial database setup',
                    execute: async () => {
                        // التحديث الأولي تم تنفيذه مسبقاً
                        // Initial migration already executed
                        logger.debug('تم تنفيذ التحديث الأولي - Initial migration executed');
                    }
                }
            ];

            // تنفيذ التحديثات
            // Execute migrations
            for (const migration of migrations) {
                const existingMigration = await db.get(
                    'SELECT id FROM migrations WHERE version = ?',
                    [migration.version]
                );

                if (!existingMigration) {
                    await migration.execute();
                    await db.run(
                        'INSERT INTO migrations (version, description) VALUES (?, ?)',
                        [migration.version, migration.description]
                    );
                    logger.info(`تم تنفيذ التحديث - Migration executed: ${migration.version}`);
                }
            }

        } catch (error) {
            logger.error('خطأ في تشغيل التحديثات - Error running migrations:', error);
            throw error;
        }
    }

    /**
     * إنشاء نسخة احتياطية من قاعدة البيانات
     * Create database backup
     */
    async createBackup() {
        try {
            const backupDir = path.join(__dirname, '../backups');
            await fs.mkdir(backupDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `backup_${timestamp}.db`);

            // نسخ ملف قاعدة البيانات
            // Copy database file
            const dbPath = path.join(__dirname, '../data/bot.db');
            await fs.copyFile(dbPath, backupPath);

            logger.info(`تم إنشاء نسخة احتياطية - Backup created: ${backupPath}`);
            return backupPath;

        } catch (error) {
            logger.error('خطأ في إنشاء النسخة الاحتياطية - Error creating backup:', error);
            throw error;
        }
    }

    /**
     * تنظيف قاعدة البيانات
     * Clean up database
     */
    async cleanup() {
        try {
            logger.info('بدء تنظيف قاعدة البيانات - Starting database cleanup...');

            // حذف الرسائل القديمة (أكثر من شهر)
            // Delete old messages (older than 1 month)
            await db.run(`
                DELETE FROM messages 
                WHERE timestamp < datetime('now', '-30 days')
            `);

            // حذف سجلات الأوامر القديمة (أكثر من شهرين)
            // Delete old command logs (older than 2 months)
            await db.run(`
                DELETE FROM command_logs 
                WHERE timestamp < datetime('now', '-60 days')
            `);

            // تحديث إحصائيات الجداول
            // Update table statistics
            await db.run('VACUUM');
            await db.run('ANALYZE');

            logger.info('تم تنظيف قاعدة البيانات بنجاح - Database cleanup completed');

        } catch (error) {
            logger.error('خطأ في تنظيف قاعدة البيانات - Error cleaning database:', error);
            throw error;
        }
    }

    /**
     * الحصول على إحصائيات قاعدة البيانات
     * Get database statistics
     */
    async getStatistics() {
        try {
            const stats = {};

            // إحصائيات المستخدمين
            // User statistics
            const userStats = await User.getStatistics();
            stats.users = userStats;

            // إحصائيات المجموعات
            // Group statistics
            const groupStats = await Group.getStatistics();
            stats.groups = groupStats;

            // إحصائيات الرسائل
            // Message statistics
            const messageStats = await db.get(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_command = 1 THEN 1 END) as commands,
                    COUNT(CASE WHEN timestamp >= datetime('now', '-24 hours') THEN 1 END) as last_24h
                FROM messages
            `);
            stats.messages = messageStats;

            // حجم قاعدة البيانات
            // Database size
            const dbPath = path.join(__dirname, '../data/bot.db');
            const dbStats = await fs.stat(dbPath);
            stats.database = {
                sizeBytes: dbStats.size,
                sizeMB: (dbStats.size / (1024 * 1024)).toFixed(2),
                lastModified: dbStats.mtime
            };

            return stats;

        } catch (error) {
            logger.error('خطأ في جلب إحصائيات قاعدة البيانات - Error getting database statistics:', error);
            throw error;
        }
    }

    /**
     * التحقق من صحة قاعدة البيانات
     * Validate database integrity
     */
    async validateIntegrity() {
        try {
            logger.info('فحص سلامة قاعدة البيانات - Checking database integrity...');

            // فحص سلامة قاعدة البيانات
            // Check database integrity
            const integrityCheck = await db.get('PRAGMA integrity_check');
            
            if (integrityCheck.integrity_check !== 'ok') {
                throw new Error(`Database integrity check failed: ${integrityCheck.integrity_check}`);
            }

            // فحص الجداول المطلوبة
            // Check required tables
            const requiredTables = ['users', 'groups', 'group_members', 'messages', 'command_logs', 'bot_settings'];
            
            for (const table of requiredTables) {
                const tableInfo = await db.get(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                    [table]
                );
                
                if (!tableInfo) {
                    throw new Error(`Required table missing: ${table}`);
                }
            }

            logger.info('فحص سلامة قاعدة البيانات اكتمل بنجاح - Database integrity check passed');
            return true;

        } catch (error) {
            logger.error('فشل في فحص سلامة قاعدة البيانات - Database integrity check failed:', error);
            throw error;
        }
    }

    /**
     * إغلاق الاتصال بقاعدة البيانات
     * Close database connection
     */
    async close() {
        try {
            await db.close();
            this.isInitialized = false;
            logger.info('تم إغلاق الاتصال بقاعدة البيانات - Database connection closed');

        } catch (error) {
            logger.error('خطأ في إغلاق قاعدة البيانات - Error closing database:', error);
            throw error;
        }
    }
}

// إنشاء مثيل واحد من الفئة
// Create single instance
const dbInitializer = new DatabaseInitializer();

// تصدير دالة التهيئة
// Export initialization function
module.exports = {
    initDatabase: () => dbInitializer.initialize(),
    createBackup: () => dbInitializer.createBackup(),
    cleanup: () => dbInitializer.cleanup(),
    getStatistics: () => dbInitializer.getStatistics(),
    validateIntegrity: () => dbInitializer.validateIntegrity(),
    close: () => dbInitializer.close()
};
