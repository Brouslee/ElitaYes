const fs = require('fs').promises;
const path = require('path');
const logger = require('../core/logger');

/**
 * معالج الأوامر
 * Command Handler
 */

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.commands = new Map();
        this.aliases = new Map();
        this.cooldowns = new Map();
        this.commandsPath = path.join(__dirname, '../commands');
    }

    /**
     * تحميل جميع الأوامر
     * Load all commands
     */
    async loadCommands() {
        try {
            logger.info('بدء تحميل الأوامر - Starting to load commands...');

            // مسح الأوامر المحملة سابقاً
            // Clear previously loaded commands
            this.commands.clear();
            this.aliases.clear();

            // التحقق من وجود مجلد الأوامر
            // Check if commands directory exists
            try {
                await fs.access(this.commandsPath);
            } catch (error) {
                logger.warn('مجلد الأوامر غير موجود - Commands directory does not exist, creating...');
                await fs.mkdir(this.commandsPath, { recursive: true });
                return;
            }

            // قراءة ملفات الأوامر
            // Read command files
            const files = await fs.readdir(this.commandsPath);
            const jsFiles = files.filter(file => file.endsWith('.js'));

            let loadedCount = 0;
            let failedCount = 0;

            for (const file of jsFiles) {
                try {
                    await this.loadCommand(file);
                    loadedCount++;
                } catch (error) {
                    logger.error(`فشل في تحميل الأمر - Failed to load command ${file}:`, error);
                    failedCount++;
                }
            }

            logger.info(`تم تحميل ${loadedCount} أمر بنجاح، فشل ${failedCount} - Loaded ${loadedCount} commands successfully, ${failedCount} failed`);

        } catch (error) {
            logger.error('خطأ في تحميل الأوامر - Error loading commands:', error);
            throw error;
        }
    }

    /**
     * تحميل أمر واحد
     * Load single command
     */
    async loadCommand(filename) {
        const filePath = path.join(this.commandsPath, filename);
        
        try {
            // حذف الأمر من الكاش لإعادة التحميل
            // Delete from cache for reload
            delete require.cache[require.resolve(filePath)];
            
            // تحميل الأمر
            // Load command
            const commandModule = require(filePath);
            
            // التحقق من صحة بنية الأمر
            // Validate command structure
            if (!this.validateCommand(commandModule)) {
                throw new Error(`بنية الأمر غير صحيحة - Invalid command structure: ${filename}`);
            }

            // تسجيل الأمر
            // Register command
            this.commands.set(commandModule.config.name, commandModule);

            // تسجيل الأسماء البديلة
            // Register aliases
            if (commandModule.config.aliases) {
                for (const alias of commandModule.config.aliases) {
                    this.aliases.set(alias, commandModule.config.name);
                }
            }

            logger.debug(`تم تحميل الأمر - Command loaded: ${commandModule.config.name}`);

        } catch (error) {
            logger.error(`خطأ في تحميل الأمر - Error loading command ${filename}:`, error);
            throw error;
        }
    }

    /**
     * التحقق من صحة بنية الأمر
     * Validate command structure
     */
    validateCommand(command) {
        // التحقق من وجود الخصائص المطلوبة
        // Check required properties
        if (!command.config || !command.run) {
            return false;
        }

        if (!command.config.name || typeof command.config.name !== 'string') {
            return false;
        }

        if (typeof command.run !== 'function') {
            return false;
        }

        return true;
    }

    /**
     * معالجة الأوامر
     * Handle commands
     */
    async handleCommand(messageData) {
        try {
            const { text, userId, username } = messageData;
            const prefix = this.bot.config.bot.prefix;

            // استخراج الأمر والمعاملات
            // Extract command and arguments
            const args = text.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // البحث عن الأمر
            // Find command
            const command = this.getCommand(commandName);
            
            if (!command) {
                logger.debug(`أمر غير موجود - Command not found: ${commandName}`);
                return;
            }

            // التحقق من الصلاحيات
            // Check permissions
            if (!this.checkPermissions(command, messageData)) {
                await this.bot.sendMessage(userId, 'ليس لديك صلاحية لاستخدام هذا الأمر - You don\'t have permission to use this command');
                return;
            }

            // التحقق من فترة الانتظار
            // Check cooldown
            if (!this.checkCooldown(command, userId)) {
                const remaining = this.getRemainingCooldown(command, userId);
                await this.bot.sendMessage(userId, `يرجى الانتظار ${Math.ceil(remaining / 1000)} ثانية قبل استخدام هذا الأمر مرة أخرى - Please wait ${Math.ceil(remaining / 1000)} seconds before using this command again`);
                return;
            }

            // إنشاء كائن السياق
            // Create context object
            const context = {
                bot: this.bot,
                message: messageData,
                args: args,
                user: {
                    id: userId,
                    username: username
                },
                reply: async (message, options = {}) => {
                    return await this.bot.sendMessage(userId, message, options);
                }
            };

            // تسجيل استخدام الأمر
            // Log command usage
            logger.info(`تنفيذ الأمر - Executing command: ${command.config.name} by ${username || userId}`);

            // تنفيذ الأمر
            // Execute command
            await command.run(context);

            // تطبيق فترة الانتظار
            // Apply cooldown
            this.applyCooldown(command, userId);

        } catch (error) {
            logger.error('خطأ في معالجة الأمر - Error handling command:', error);
            
            // إرسال رسالة خطأ للمستخدم
            // Send error message to user
            try {
                await this.bot.sendMessage(messageData.userId, 'حدث خطأ أثناء تنفيذ الأمر - An error occurred while executing the command');
            } catch (sendError) {
                logger.error('فشل في إرسال رسالة الخطأ - Failed to send error message:', sendError);
            }
        }
    }

    /**
     * الحصول على الأمر
     * Get command
     */
    getCommand(name) {
        // البحث بالاسم الأصلي
        // Search by original name
        if (this.commands.has(name)) {
            return this.commands.get(name);
        }

        // البحث بالاسم البديل
        // Search by alias
        if (this.aliases.has(name)) {
            const originalName = this.aliases.get(name);
            return this.commands.get(originalName);
        }

        return null;
    }

    /**
     * التحقق من الصلاحيات
     * Check permissions
     */
    checkPermissions(command, messageData) {
        // إذا لم تكن هناك متطلبات صلاحيات، السماح للجميع
        // If no permission requirements, allow everyone
        if (!command.config.permissions || command.config.permissions.length === 0) {
            return true;
        }

        // هنا يمكن تطبيق نظام صلاحيات أكثر تعقيداً
        // Here a more complex permission system can be implemented
        // يمكن التحقق من قاعدة البيانات لمعرفة صلاحيات المستخدم
        // Can check database for user permissions

        return true; // مؤقتاً نسمح للجميع - Temporarily allow everyone
    }

    /**
     * التحقق من فترة الانتظار
     * Check cooldown
     */
    checkCooldown(command, userId) {
        if (!command.config.cooldown) {
            return true;
        }

        const now = Date.now();
        const cooldownAmount = command.config.cooldown * 1000;
        const commandCooldowns = this.cooldowns.get(command.config.name) || new Map();

        if (commandCooldowns.has(userId)) {
            const expirationTime = commandCooldowns.get(userId) + cooldownAmount;
            
            if (now < expirationTime) {
                return false;
            }
        }

        return true;
    }

    /**
     * الحصول على الوقت المتبقي لفترة الانتظار
     * Get remaining cooldown time
     */
    getRemainingCooldown(command, userId) {
        if (!command.config.cooldown) {
            return 0;
        }

        const now = Date.now();
        const cooldownAmount = command.config.cooldown * 1000;
        const commandCooldowns = this.cooldowns.get(command.config.name) || new Map();

        if (commandCooldowns.has(userId)) {
            const expirationTime = commandCooldowns.get(userId) + cooldownAmount;
            return Math.max(0, expirationTime - now);
        }

        return 0;
    }

    /**
     * تطبيق فترة الانتظار
     * Apply cooldown
     */
    applyCooldown(command, userId) {
        if (!command.config.cooldown) {
            return;
        }

        const now = Date.now();
        
        if (!this.cooldowns.has(command.config.name)) {
            this.cooldowns.set(command.config.name, new Map());
        }

        const commandCooldowns = this.cooldowns.get(command.config.name);
        commandCooldowns.set(userId, now);

        // تنظيف فترات الانتظار المنتهية الصلاحية
        // Clean expired cooldowns
        setTimeout(() => {
            commandCooldowns.delete(userId);
        }, command.config.cooldown * 1000);
    }

    /**
     * الحصول على قائمة الأوامر
     * Get command list
     */
    getCommandList() {
        const commandList = [];
        
        for (const [name, command] of this.commands) {
            commandList.push({
                name: name,
                description: command.config.description || 'لا يوجد وصف - No description',
                usage: command.config.usage || name,
                aliases: command.config.aliases || [],
                cooldown: command.config.cooldown || 0,
                category: command.config.category || 'عام - General'
            });
        }

        return commandList;
    }

    /**
     * الحصول على عدد الأوامر المحملة
     * Get loaded commands count
     */
    getCommandCount() {
        return this.commands.size;
    }

    /**
     * إعادة تحميل أمر معين
     * Reload specific command
     */
    async reloadCommand(commandName) {
        try {
            const command = this.getCommand(commandName);
            
            if (!command) {
                throw new Error(`الأمر غير موجود - Command not found: ${commandName}`);
            }

            // العثور على ملف الأمر
            // Find command file
            const files = await fs.readdir(this.commandsPath);
            const commandFile = files.find(file => {
                const filePath = path.join(this.commandsPath, file);
                try {
                    const cmd = require(filePath);
                    return cmd.config.name === command.config.name;
                } catch {
                    return false;
                }
            });

            if (!commandFile) {
                throw new Error(`ملف الأمر غير موجود - Command file not found: ${commandName}`);
            }

            // إزالة الأمر الحالي
            // Remove current command
            this.commands.delete(command.config.name);
            if (command.config.aliases) {
                for (const alias of command.config.aliases) {
                    this.aliases.delete(alias);
                }
            }

            // إعادة تحميل الأمر
            // Reload command
            await this.loadCommand(commandFile);

            logger.info(`تم إعادة تحميل الأمر - Command reloaded: ${commandName}`);

        } catch (error) {
            logger.error(`فشل في إعادة تحميل الأمر - Failed to reload command ${commandName}:`, error);
            throw error;
        }
    }

    /**
     * إيقاف معالج الأوامر
     * Shutdown command handler
     */
    async shutdown() {
        try {
            logger.info('إيقاف معالج الأوامر - Shutting down command handler...');
            
            // مسح الكاش
            // Clear cache
            this.commands.clear();
            this.aliases.clear();
            this.cooldowns.clear();

            logger.info('تم إيقاف معالج الأوامر - Command handler shutdown completed');

        } catch (error) {
            logger.error('خطأ في إيقاف معالج الأوامر - Error shutting down command handler:', error);
        }
    }
}

module.exports = CommandHandler;
