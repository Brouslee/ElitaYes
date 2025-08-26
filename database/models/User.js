const db = require('../../config/database');
const logger = require('../../core/logger');

/**
 * نموذج المستخدم
 * User Model
 */

class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.instagramId = data.instagramId || null;
        this.username = data.username || null;
        this.fullName = data.fullName || null;
        this.isPrivate = data.isPrivate || false;
        this.followerCount = data.followerCount || 0;
        this.followingCount = data.followingCount || 0;
        this.profilePicUrl = data.profilePicUrl || null;
        this.bio = data.bio || null;
        this.isVerified = data.isVerified || false;
        this.joinedAt = data.joinedAt || new Date();
        this.lastActive = data.lastActive || new Date();
        this.settings = data.settings || {};
        this.metadata = data.metadata || {};
    }

    /**
     * إنشاء جدول المستخدمين
     * Create users table
     */
    static async createTable() {
        try {
            const sql = `
                CREATE TABLE IF NOT EXISTS users (
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
                )
            `;

            await db.run(sql);
            logger.debug('تم إنشاء جدول المستخدمين - Users table created/verified');

        } catch (error) {
            logger.error('خطأ في إنشاء جدول المستخدمين - Error creating users table:', error);
            throw error;
        }
    }

    /**
     * العثور على مستخدم بواسطة ID Instagram
     * Find user by Instagram ID
     */
    static async findByInstagramId(instagramId) {
        try {
            const sql = `
                SELECT * FROM users 
                WHERE instagram_id = ?
            `;

            const row = await db.get(sql, [instagramId]);
            
            if (row) {
                return new User({
                    id: row.id,
                    instagramId: row.instagram_id,
                    username: row.username,
                    fullName: row.full_name,
                    isPrivate: row.is_private === 1,
                    followerCount: row.follower_count,
                    followingCount: row.following_count,
                    profilePicUrl: row.profile_pic_url,
                    bio: row.bio,
                    isVerified: row.is_verified === 1,
                    joinedAt: new Date(row.joined_at),
                    lastActive: new Date(row.last_active),
                    settings: JSON.parse(row.settings || '{}'),
                    metadata: JSON.parse(row.metadata || '{}')
                });
            }

            return null;

        } catch (error) {
            logger.error('خطأ في البحث عن المستخدم - Error finding user:', error);
            throw error;
        }
    }

    /**
     * العثور على مستخدم بواسطة اسم المستخدم
     * Find user by username
     */
    static async findByUsername(username) {
        try {
            const sql = `
                SELECT * FROM users 
                WHERE username = ? COLLATE NOCASE
            `;

            const row = await db.get(sql, [username]);
            
            if (row) {
                return new User({
                    id: row.id,
                    instagramId: row.instagram_id,
                    username: row.username,
                    fullName: row.full_name,
                    isPrivate: row.is_private === 1,
                    followerCount: row.follower_count,
                    followingCount: row.following_count,
                    profilePicUrl: row.profile_pic_url,
                    bio: row.bio,
                    isVerified: row.is_verified === 1,
                    joinedAt: new Date(row.joined_at),
                    lastActive: new Date(row.last_active),
                    settings: JSON.parse(row.settings || '{}'),
                    metadata: JSON.parse(row.metadata || '{}')
                });
            }

            return null;

        } catch (error) {
            logger.error('خطأ في البحث عن المستخدم بالاسم - Error finding user by username:', error);
            throw error;
        }
    }

    /**
     * الحصول على جميع المستخدمين
     * Get all users
     */
    static async getAll(limit = 100, offset = 0) {
        try {
            const sql = `
                SELECT * FROM users 
                ORDER BY last_active DESC 
                LIMIT ? OFFSET ?
            `;

            const rows = await db.all(sql, [limit, offset]);
            
            return rows.map(row => new User({
                id: row.id,
                instagramId: row.instagram_id,
                username: row.username,
                fullName: row.full_name,
                isPrivate: row.is_private === 1,
                followerCount: row.follower_count,
                followingCount: row.following_count,
                profilePicUrl: row.profile_pic_url,
                bio: row.bio,
                isVerified: row.is_verified === 1,
                joinedAt: new Date(row.joined_at),
                lastActive: new Date(row.last_active),
                settings: JSON.parse(row.settings || '{}'),
                metadata: JSON.parse(row.metadata || '{}')
            }));

        } catch (error) {
            logger.error('خطأ في جلب جميع المستخدمين - Error getting all users:', error);
            throw error;
        }
    }

    /**
     * حفظ المستخدم
     * Save user
     */
    async save() {
        try {
            if (this.id) {
                // تحديث مستخدم موجود
                // Update existing user
                return await this.update();
            } else {
                // إنشاء مستخدم جديد
                // Create new user
                return await this.create();
            }
        } catch (error) {
            logger.error('خطأ في حفظ المستخدم - Error saving user:', error);
            throw error;
        }
    }

    /**
     * إنشاء مستخدم جديد
     * Create new user
     */
    async create() {
        try {
            const sql = `
                INSERT INTO users (
                    instagram_id, username, full_name, is_private, 
                    follower_count, following_count, profile_pic_url, 
                    bio, is_verified, settings, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                this.instagramId,
                this.username,
                this.fullName,
                this.isPrivate ? 1 : 0,
                this.followerCount,
                this.followingCount,
                this.profilePicUrl,
                this.bio,
                this.isVerified ? 1 : 0,
                JSON.stringify(this.settings),
                JSON.stringify(this.metadata)
            ];

            const result = await db.run(sql, params);
            this.id = result.id;

            logger.debug(`تم إنشاء مستخدم جديد - New user created: ${this.username || this.instagramId}`);
            return this;

        } catch (error) {
            logger.error('خطأ في إنشاء مستخدم جديد - Error creating new user:', error);
            throw error;
        }
    }

    /**
     * تحديث المستخدم
     * Update user
     */
    async update() {
        try {
            const sql = `
                UPDATE users SET
                    username = ?,
                    full_name = ?,
                    is_private = ?,
                    follower_count = ?,
                    following_count = ?,
                    profile_pic_url = ?,
                    bio = ?,
                    is_verified = ?,
                    last_active = CURRENT_TIMESTAMP,
                    settings = ?,
                    metadata = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const params = [
                this.username,
                this.fullName,
                this.isPrivate ? 1 : 0,
                this.followerCount,
                this.followingCount,
                this.profilePicUrl,
                this.bio,
                this.isVerified ? 1 : 0,
                JSON.stringify(this.settings),
                JSON.stringify(this.metadata),
                this.id
            ];

            await db.run(sql, params);

            logger.debug(`تم تحديث المستخدم - User updated: ${this.username || this.instagramId}`);
            return this;

        } catch (error) {
            logger.error('خطأ في تحديث المستخدم - Error updating user:', error);
            throw error;
        }
    }

    /**
     * حذف المستخدم
     * Delete user
     */
    async delete() {
        try {
            if (!this.id) {
                throw new Error('لا يمكن حذف مستخدم غير محفوظ - Cannot delete unsaved user');
            }

            const sql = `DELETE FROM users WHERE id = ?`;
            await db.run(sql, [this.id]);

            logger.info(`تم حذف المستخدم - User deleted: ${this.username || this.instagramId}`);

        } catch (error) {
            logger.error('خطأ في حذف المستخدم - Error deleting user:', error);
            throw error;
        }
    }

    /**
     * تحديث وقت النشاط الأخير
     * Update last activity
     */
    async updateLastActivity() {
        try {
            if (!this.id) return;

            const sql = `UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?`;
            await db.run(sql, [this.id]);

            this.lastActive = new Date();

        } catch (error) {
            logger.error('خطأ في تحديث وقت النشاط - Error updating last activity:', error);
        }
    }

    /**
     * تحديث الإعدادات
     * Update settings
     */
    async updateSettings(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            
            if (this.id) {
                const sql = `UPDATE users SET settings = ? WHERE id = ?`;
                await db.run(sql, [JSON.stringify(this.settings), this.id]);
            }

        } catch (error) {
            logger.error('خطأ في تحديث الإعدادات - Error updating settings:', error);
            throw error;
        }
    }

    /**
     * الحصول على إعداد معين
     * Get specific setting
     */
    getSetting(key, defaultValue = null) {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }

    /**
     * تعيين إعداد معين
     * Set specific setting
     */
    setSetting(key, value) {
        this.settings[key] = value;
    }

    /**
     * إحصائيات المستخدمين
     * User statistics
     */
    static async getStatistics() {
        try {
            const totalUsers = await db.get(`SELECT COUNT(*) as count FROM users`);
            const activeUsers = await db.get(`
                SELECT COUNT(*) as count FROM users 
                WHERE last_active >= datetime('now', '-7 days')
            `);
            const verifiedUsers = await db.get(`
                SELECT COUNT(*) as count FROM users WHERE is_verified = 1
            `);

            return {
                total: totalUsers.count,
                active: activeUsers.count,
                verified: verifiedUsers.count,
                inactive: totalUsers.count - activeUsers.count
            };

        } catch (error) {
            logger.error('خطأ في جلب إحصائيات المستخدمين - Error getting user statistics:', error);
            throw error;
        }
    }

    /**
     * تحويل إلى JSON
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            instagramId: this.instagramId,
            username: this.username,
            fullName: this.fullName,
            isPrivate: this.isPrivate,
            followerCount: this.followerCount,
            followingCount: this.followingCount,
            profilePicUrl: this.profilePicUrl,
            bio: this.bio,
            isVerified: this.isVerified,
            joinedAt: this.joinedAt,
            lastActive: this.lastActive,
            settings: this.settings,
            metadata: this.metadata
        };
    }
}

module.exports = User;
