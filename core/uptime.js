const express = require('express');
const logger = require('./logger');
const { colors } = require('../utils/colors');

/**
 * خادم Uptime للحفاظ على البوت نشطاً - مستوحى من Goat Bot
 * Uptime Server for keeping bot alive - Inspired by Goat Bot
 * Enhanced by Mohammed Al-Akari
 */

class UptimeServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.port = process.env.PORT || 3000;
        this.isRunning = false;
        this.startTime = Date.now();
        this.requestCount = 0;
        
        this.setupRoutes();
        this.setupMiddleware();
    }

    setupMiddleware() {
        // تسجيل الطلبات
        this.app.use((req, res, next) => {
            this.requestCount++;
            logger.debug('UPTIME', `${req.method} ${req.path} - ${req.ip}`);
            next();
        });

        // إعداد JSON parsing
        this.app.use(express.json());
        
        // إعداد CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }

    setupRoutes() {
        // الصفحة الرئيسية
        this.app.get('/', (req, res) => {
            const uptimeMs = Date.now() - this.startTime;
            const uptime = global.utils?.advanced?.convertTime(uptimeMs) || `${Math.floor(uptimeMs / 1000)} ثانية`;
            
            const botStatus = global.ELITA?.isRunning ? '🟢 نشط' : '🔴 متوقف';
            const dbStatus = global.db?.isConnected ? '🟢 متصل' : '🔴 منقطع';
            
            const html = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>ELITA Bot Status</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            margin: 0;
                            padding: 20px;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .container { 
                            background: rgba(255,255,255,0.1);
                            padding: 40px;
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 600px;
                            width: 100%;
                        }
                        .logo { 
                            font-size: 3em;
                            font-weight: bold;
                            margin-bottom: 10px;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                        }
                        .status-grid { 
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 20px;
                            margin: 30px 0;
                        }
                        .status-item { 
                            background: rgba(255,255,255,0.1);
                            padding: 20px;
                            border-radius: 15px;
                            border: 1px solid rgba(255,255,255,0.2);
                        }
                        .status-value { 
                            font-size: 1.5em;
                            font-weight: bold;
                            margin: 10px 0;
                        }
                        .pulse { 
                            animation: pulse 2s infinite;
                        }
                        @keyframes pulse { 
                            0% { opacity: 1; }
                            50% { opacity: 0.7; }
                            100% { opacity: 1; }
                        }
                        .footer { 
                            margin-top: 30px;
                            font-size: 0.9em;
                            opacity: 0.8;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo pulse">⚡ ELITA ⚡</div>
                        <p>إطار عمل Instagram Bot المتقدم</p>
                        <p>بواسطة محمد العكاري</p>
                        
                        <div class="status-grid">
                            <div class="status-item">
                                <div>حالة البوت</div>
                                <div class="status-value">${botStatus}</div>
                            </div>
                            
                            <div class="status-item">
                                <div>قاعدة البيانات</div>
                                <div class="status-value">${dbStatus}</div>
                            </div>
                            
                            <div class="status-item">
                                <div>مدة التشغيل</div>
                                <div class="status-value">${uptime}</div>
                            </div>
                            
                            <div class="status-item">
                                <div>عدد الطلبات</div>
                                <div class="status-value">${this.requestCount.toLocaleString('ar-EG')}</div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>🚀 ELITA v${global.ELITA?.version || '2.0.0'} | Node.js ${process.version}</p>
                            <p>للأغراض التعليمية فقط</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            res.send(html);
        });

        // API للحصول على حالة البوت
        this.app.get('/api/status', (req, res) => {
            const status = {
                bot: {
                    name: 'ELITA',
                    version: global.ELITA?.version || '2.0.0',
                    author: 'Mohammed Al-Akari',
                    isRunning: global.ELITA?.isRunning || false,
                    uptime: Date.now() - this.startTime,
                    lastActivity: global.ELITA?.lastActivity || Date.now()
                },
                server: {
                    port: this.port,
                    requestCount: this.requestCount,
                    startTime: this.startTime,
                    nodeVersion: process.version,
                    platform: process.platform
                },
                database: {
                    isConnected: global.db?.isConnected || false,
                    type: 'SQLite'
                },
                stats: global.ELITA?.stats || {},
                memory: {
                    used: Math.round(process.memoryUsage().rss / 1024 / 1024),
                    free: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                }
            };
            
            res.json(status);
        });

        // Ping endpoint
        this.app.get('/ping', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: Date.now(),
                uptime: Date.now() - this.startTime
            });
        });

        // Health check
        this.app.get('/health', (req, res) => {
            const health = {
                status: global.ELITA?.isRunning ? 'healthy' : 'unhealthy',
                checks: {
                    database: global.db?.isConnected ? 'pass' : 'fail',
                    memory: process.memoryUsage().rss < 500 * 1024 * 1024 ? 'pass' : 'warn',
                    uptime: Date.now() - this.startTime > 5000 ? 'pass' : 'starting'
                },
                timestamp: Date.now()
            };
            
            const statusCode = health.status === 'healthy' ? 200 : 503;
            res.status(statusCode).json(health);
        });

        // API للإحصائيات
        this.app.get('/api/stats', (req, res) => {
            const stats = {
                commands: Object.fromEntries(global.ELITA?.commands || new Map()),
                events: Object.fromEntries(global.ELITA?.events || new Map()),
                performance: global.ELITA?.stats || {},
                cache: {
                    users: global.ELITA?.cache?.users?.size || 0,
                    groups: global.ELITA?.cache?.groups?.size || 0,
                    messages: global.ELITA?.cache?.messages?.size || 0
                }
            };
            
            res.json(stats);
        });

        // معالجة 404
        this.app.use('*', (req, res) => {
            res.status(404).json({ 
                error: 'Not Found', 
                message: 'الصفحة غير موجودة',
                timestamp: Date.now()
            });
        });

        // معالجة الأخطاء
        this.app.use((error, req, res, next) => {
            logger.error('UPTIME SERVER', `خطأ في الخادم: ${error.message}`);
            res.status(500).json({ 
                error: 'Internal Server Error',
                message: 'حدث خطأ داخلي في الخادم',
                timestamp: Date.now()
            });
        });
    }

    /**
     * بدء تشغيل الخادم
     * Start the server
     */
    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, '0.0.0.0', () => {
                    this.isRunning = true;
                    logger.success('UPTIME SERVER', `خادم Uptime يعمل على المنفذ ${this.port}`);
                    console.log(colors.boxed(`
🚀 ELITA Uptime Server
📡 منفذ: ${this.port}
🌐 الرابط: http://localhost:${this.port}
⚡ الحالة: نشط
                    `, 'cyan'));
                    resolve();
                });

                this.server.on('error', (error) => {
                    this.isRunning = false;
                    logger.error('UPTIME SERVER', `خطأ في الخادم: ${error.message}`);
                    reject(error);
                });

            } catch (error) {
                logger.error('UPTIME SERVER', `فشل في بدء الخادم: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * إيقاف الخادم
     * Stop the server
     */
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.isRunning = false;
                    logger.info('UPTIME SERVER', 'تم إيقاف خادم Uptime');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * الحصول على معلومات الخادم
     * Get server information
     */
    getInfo() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            startTime: this.startTime,
            requestCount: this.requestCount,
            uptime: Date.now() - this.startTime
        };
    }
}

module.exports = UptimeServer;