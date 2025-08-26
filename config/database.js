const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * إعدادات قاعدة البيانات
 * Database Configuration
 */

class DatabaseConfig {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/bot.db');
        this.db = null;
        this.isConnected = false;
    }

    /**
     * الاتصال بقاعدة البيانات
     * Connect to database
     */
    async connect() {
        try {
            // إنشاء مجلد البيانات إذا لم يكن موجوداً
            // Create data directory if it doesn't exist
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            return new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        reject(new Error(`فشل في الاتصال بقاعدة البيانات - Failed to connect to database: ${err.message}`));
                    } else {
                        this.isConnected = true;
                        console.log('تم الاتصال بقاعدة البيانات بنجاح - Connected to SQLite database successfully');
                        resolve(this.db);
                    }
                });
            });
        } catch (error) {
            throw new Error(`خطأ في الاتصال بقاعدة البيانات - Database connection error: ${error.message}`);
        }
    }

    /**
     * تنفيذ استعلام SQL
     * Execute SQL query
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * جلب صف واحد
     * Get single row
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * جلب عدة صفوف
     * Get multiple rows
     */
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * إغلاق الاتصال
     * Close connection
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.isConnected = false;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * الحصول على كائن قاعدة البيانات
     * Get database instance
     */
    getDatabase() {
        return this.db;
    }

    /**
     * التحقق من حالة الاتصال
     * Check connection status
     */
    isConnectionActive() {
        return this.isConnected;
    }
}

module.exports = new DatabaseConfig();
