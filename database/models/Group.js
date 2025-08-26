const db = require('../../config/database');
const logger = require('../../core/logger');

/**
 * نموذج المجموعة
 * Group Model
 */

class Group {
    constructor(data = {}) {
        this.id = data.id || null;
        this.instagramId = data.instagramId || null;
        this.name = data.name || null;
        this.description = data.description || null;
        this.memberCount = data.memberCount || 0;
        this.isPrivate = data.isPrivate || false;
        this.ownerId = data.ownerId || null;
        this.profilePicUrl = data.profilePicUrl || null;
        this.createdAt = data.createdAt || new Date();
        this.lastActivity = data.lastActivity || new Date();
        this.settings = data.settings || {};
        this.metadata = data.metadata || {};
    }

    /**
     * إنشاء جدول المجموعات
     * Create groups table
     */
    static async createTable() {
        try {
            const sql = `
                CREATE TABLE IF NOT EXISTS groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    instagram_id TEXT UNIQUE NOT NULL,
                    name TEXT,
                    description TEXT,
                    member_count INTEGER DEFAULT 0,
                    is_private BOOLEAN DEFAULT FALSE,
                    owner_id TEXT,
                    profile_pic_url TEXT,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                    settings TEXT DEFAULT '{}',
                    metadata TEXT DEFAULT '{}',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await db.run(sql);

            // إنشاء جدول أعضاء المجموعات
            // Create group members table
            const membersSql = `
                CREATE TABLE IF NOT EXISTS group_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER,
                    user_instagram_id TEXT,
                    role TEXT DEFAULT 'member',
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_admin BOOLEAN DEFAULT FALSE,
                    is_moderator BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (group_id) REFERENCES groups (id),
                    UNIQUE(group_id, user_instagram_id)
                )
            `;

            await db.run(membersSql);

            logger.debug('تم إنشاء جداول المجموعات - Groups tables created/verified');

        } catch (error) {
            logger.error('خطأ في إنشاء جداول المجموعات - Error creating groups tables:', error);
            throw error;
        }
    }

    /**
     * العثور على مجموعة بواسطة ID Instagram
     * Find group by Instagram ID
     */
    static async findByInstagramId(instagramId) {
        try {
            const sql = `
                SELECT * FROM groups 
                WHERE instagram_id = ?
            `;

            const row = await db.get(sql, [instagramId]);
            
            if (row) {
                return new Group({
                    id: row.id,
                    instagramId: row.instagram_id,
                    name: row.name,
                    description: row.description,
                    memberCount: row.member_count,
                    isPrivate: row.is_private === 1,
                    ownerId: row.owner_id,
                    profilePicUrl: row.profile_pic_url,
                    createdAt: new Date(row.created_at),
                    lastActivity: new Date(row.last_activity),
                    settings: JSON.parse(row.settings || '{}'),
                    metadata: JSON.parse(row.metadata || '{}')
                });
            }

            return null;

        } catch (error) {
            logger.error('خطأ في البحث عن المجموعة - Error finding group:', error);
            throw error;
        }
    }

    /**
     * العثور على مجموعة بواسطة الاسم
     * Find group by name
     */
    static async findByName(name) {
        try {
            const sql = `
                SELECT * FROM groups 
                WHERE name = ? COLLATE NOCASE
            `;

            const row = await db.get(sql, [name]);
            
            if (row) {
                return new Group({
                    id: row.id,
                    instagramId: row.instagram_id,
                    name: row.name,
                    description: row.description,
                    memberCount: row.member_count,
                    isPrivate: row.is_private === 1,
                    ownerId: row.owner_id,
                    profilePicUrl: row.profile_pic_url,
                    createdAt: new Date(row.created_at),
                    lastActivity: new Date(row.last_activity),
                    settings: JSON.parse(row.settings || '{}'),
                    metadata: JSON.parse(row.metadata || '{}')
                });
            }

            return null;

        } catch (error) {
            logger.error('خطأ في البحث عن المجموعة بالاسم - Error finding group by name:', error);
            throw error;
        }
    }

    /**
     * الحصول على جميع المجموعات
     * Get all groups
     */
    static async getAll(limit = 100, offset = 0) {
        try {
            const sql = `
                SELECT * FROM groups 
                ORDER BY last_activity DESC 
                LIMIT ? OFFSET ?
            `;

            const rows = await db.all(sql, [limit, offset]);
            
            return rows.map(row => new Group({
                id: row.id,
                instagramId: row.instagram_id,
                name: row.name,
                description: row.description,
                memberCount: row.member_count,
                isPrivate: row.is_private === 1,
                ownerId: row.owner_id,
                profilePicUrl: row.profile_pic_url,
                createdAt: new Date(row.created_at),
                lastActivity: new Date(row.last_activity),
                settings: JSON.parse(row.settings || '{}'),
                metadata: JSON.parse(row.metadata || '{}')
            }));

        } catch (error) {
            logger.error('خطأ في جلب جميع المجموعات - Error getting all groups:', error);
            throw error;
        }
    }

    /**
     * حفظ المجموعة
     * Save group
     */
    async save() {
        try {
            if (this.id) {
                // تحديث مجموعة موجودة
                // Update existing group
                return await this.update();
            } else {
                // إنشاء مجموعة جديدة
                // Create new group
                return await this.create();
            }
        } catch (error) {
            logger.error('خطأ في حفظ المجموعة - Error saving group:', error);
            throw error;
        }
    }

    /**
     * إنشاء مجموعة جديدة
     * Create new group
     */
    async create() {
        try {
            const sql = `
                INSERT INTO groups (
                    instagram_id, name, description, member_count, 
                    is_private, owner_id, profile_pic_url, 
                    settings, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                this.instagramId,
                this.name,
                this.description,
                this.memberCount,
                this.isPrivate ? 1 : 0,
                this.ownerId,
                this.profilePicUrl,
                JSON.stringify(this.settings),
                JSON.stringify(this.metadata)
            ];

            const result = await db.run(sql, params);
            this.id = result.id;

            logger.debug(`تم إنشاء مجموعة جديدة - New group created: ${this.name || this.instagramId}`);
            return this;

        } catch (error) {
            logger.error('خطأ في إنشاء مجموعة جديدة - Error creating new group:', error);
            throw error;
        }
    }

    /**
     * تحديث المجموعة
     * Update group
     */
    async update() {
        try {
            const sql = `
                UPDATE groups SET
                    name = ?,
                    description = ?,
                    member_count = ?,
                    is_private = ?,
                    owner_id = ?,
                    profile_pic_url = ?,
                    last_activity = CURRENT_TIMESTAMP,
                    settings = ?,
                    metadata = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const params = [
                this.name,
                this.description,
                this.memberCount,
                this.isPrivate ? 1 : 0,
                this.ownerId,
                this.profilePicUrl,
                JSON.stringify(this.settings),
                JSON.stringify(this.metadata),
                this.id
            ];

            await db.run(sql, params);

            logger.debug(`تم تحديث المجموعة - Group updated: ${this.name || this.instagramId}`);
            return this;

        } catch (error) {
            logger.error('خطأ في تحديث المجموعة - Error updating group:', error);
            throw error;
        }
    }

    /**
     * حذف المجموعة
     * Delete group
     */
    async delete() {
        try {
            if (!this.id) {
                throw new Error('لا يمكن حذف مجموعة غير محفوظة - Cannot delete unsaved group');
            }

            // حذف أعضاء المجموعة أولاً
            // Delete group members first
            await db.run(`DELETE FROM group_members WHERE group_id = ?`, [this.id]);

            // حذف المجموعة
            // Delete group
            await db.run(`DELETE FROM groups WHERE id = ?`, [this.id]);

            logger.info(`تم حذف المجموعة - Group deleted: ${this.name || this.instagramId}`);

        } catch (error) {
            logger.error('خطأ في حذف المجموعة - Error deleting group:', error);
            throw error;
        }
    }

    /**
     * إضافة عضو إلى المجموعة
     * Add member to group
     */
    async addMember(userInstagramId, role = 'member') {
        try {
            if (!this.id) {
                throw new Error('يجب حفظ المجموعة أولاً - Group must be saved first');
            }

            const sql = `
                INSERT OR REPLACE INTO group_members 
                (group_id, user_instagram_id, role, is_admin, is_moderator) 
                VALUES (?, ?, ?, ?, ?)
            `;

            const isAdmin = role === 'admin';
            const isModerator = role === 'moderator' || isAdmin;

            await db.run(sql, [this.id, userInstagramId, role, isAdmin ? 1 : 0, isModerator ? 1 : 0]);

            // تحديث عدد الأعضاء
            // Update member count
            await this.updateMemberCount();

            logger.debug(`تم إضافة عضو إلى المجموعة - Member added to group: ${userInstagramId}`);

        } catch (error) {
            logger.error('خطأ في إضافة العضو - Error adding member:', error);
            throw error;
        }
    }

    /**
     * إزالة عضو من المجموعة
     * Remove member from group
     */
    async removeMember(userInstagramId) {
        try {
            if (!this.id) {
                throw new Error('يجب حفظ المجموعة أولاً - Group must be saved first');
            }

            const sql = `DELETE FROM group_members WHERE group_id = ? AND user_instagram_id = ?`;
            await db.run(sql, [this.id, userInstagramId]);

            // تحديث عدد الأعضاء
            // Update member count
            await this.updateMemberCount();

            logger.debug(`تم إزالة عضو من المجموعة - Member removed from group: ${userInstagramId}`);

        } catch (error) {
            logger.error('خطأ في إزالة العضو - Error removing member:', error);
            throw error;
        }
    }

    /**
     * الحصول على أعضاء المجموعة
     * Get group members
     */
    async getMembers() {
        try {
            if (!this.id) {
                return [];
            }

            const sql = `
                SELECT * FROM group_members 
                WHERE group_id = ? 
                ORDER BY joined_at ASC
            `;

            const rows = await db.all(sql, [this.id]);

            return rows.map(row => ({
                userInstagramId: row.user_instagram_id,
                role: row.role,
                isAdmin: row.is_admin === 1,
                isModerator: row.is_moderator === 1,
                joinedAt: new Date(row.joined_at)
            }));

        } catch (error) {
            logger.error('خطأ في جلب أعضاء المجموعة - Error getting group members:', error);
            throw error;
        }
    }

    /**
     * التحقق من عضوية المستخدم
     * Check user membership
     */
    async isMember(userInstagramId) {
        try {
            if (!this.id) {
                return false;
            }

            const sql = `
                SELECT COUNT(*) as count 
                FROM group_members 
                WHERE group_id = ? AND user_instagram_id = ?
            `;

            const result = await db.get(sql, [this.id, userInstagramId]);
            return result.count > 0;

        } catch (error) {
            logger.error('خطأ في التحقق من العضوية - Error checking membership:', error);
            return false;
        }
    }

    /**
     * التحقق من صلاحيات المشرف
     * Check admin permissions
     */
    async isAdmin(userInstagramId) {
        try {
            if (!this.id) {
                return false;
            }

            const sql = `
                SELECT is_admin 
                FROM group_members 
                WHERE group_id = ? AND user_instagram_id = ?
            `;

            const result = await db.get(sql, [this.id, userInstagramId]);
            return result && result.is_admin === 1;

        } catch (error) {
            logger.error('خطأ في التحقق من صلاحيات المشرف - Error checking admin permissions:', error);
            return false;
        }
    }

    /**
     * تحديث عدد الأعضاء
     * Update member count
     */
    async updateMemberCount() {
        try {
            if (!this.id) return;

            const sql = `
                UPDATE groups 
                SET member_count = (
                    SELECT COUNT(*) 
                    FROM group_members 
                    WHERE group_id = ?
                ) 
                WHERE id = ?
            `;

            await db.run(sql, [this.id, this.id]);

            // تحديث القيمة في الكائن
            // Update value in object
            const countResult = await db.get(`SELECT member_count FROM groups WHERE id = ?`, [this.id]);
            this.memberCount = countResult.member_count;

        } catch (error) {
            logger.error('خطأ في تحديث عدد الأعضاء - Error updating member count:', error);
        }
    }

    /**
     * تحديث النشاط الأخير
     * Update last activity
     */
    async updateLastActivity() {
        try {
            if (!this.id) return;

            const sql = `UPDATE groups SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`;
            await db.run(sql, [this.id]);

            this.lastActivity = new Date();

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
                const sql = `UPDATE groups SET settings = ? WHERE id = ?`;
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
     * إحصائيات المجموعات
     * Group statistics
     */
    static async getStatistics() {
        try {
            const totalGroups = await db.get(`SELECT COUNT(*) as count FROM groups`);
            const activeGroups = await db.get(`
                SELECT COUNT(*) as count FROM groups 
                WHERE last_activity >= datetime('now', '-7 days')
            `);
            const privateGroups = await db.get(`
                SELECT COUNT(*) as count FROM groups WHERE is_private = 1
            `);
            const totalMembers = await db.get(`SELECT COUNT(*) as count FROM group_members`);

            return {
                total: totalGroups.count,
                active: activeGroups.count,
                private: privateGroups.count,
                totalMembers: totalMembers.count,
                averageMembers: totalGroups.count > 0 ? totalMembers.count / totalGroups.count : 0
            };

        } catch (error) {
            logger.error('خطأ في جلب إحصائيات المجموعات - Error getting group statistics:', error);
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
            name: this.name,
            description: this.description,
            memberCount: this.memberCount,
            isPrivate: this.isPrivate,
            ownerId: this.ownerId,
            profilePicUrl: this.profilePicUrl,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity,
            settings: this.settings,
            metadata: this.metadata
        };
    }
}

module.exports = Group;
