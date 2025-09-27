const Bot = require('./core/bot');
const config = require('./config/config');
const logger = require('./core/logger');
const security = require('./core/security');
const errorHandler = require('./core/errorHandler');
const { initDatabase } = require('./database/init');

class InstagramBotFramework {
    constructor() {
        this.bot = null;
        this.isRunning = false;
    }

    async start() {
        try {
            // Initialize global error handler
            errorHandler.initialize();
            
            logger.info('Bot running without IP restrictions');

            logger.start('Starting Instagram Bot Framework...');

            // Initialize database
            await initDatabase();
            logger.success('Database initialized successfully');

            // Create and start bot
            this.bot = new Bot(config);
            await this.bot.initialize();
            
            this.isRunning = true;
            logger.success('Instagram Bot Framework started successfully!');
            
            // Handle graceful shutdown
            this.setupShutdownHandlers();
            
            // Keep the process alive
            this.keepAlive();
            
        } catch (error) {
            const errorInfo = errorHandler.handleError(error, { type: 'general' });
            logger.critical('Failed to start Instagram Bot Framework', error);
            process.exit(1);
        }
    }

    setupShutdownHandlers() {
        const shutdown = async (signal) => {
            logger.info(`Received ${signal} signal - Gracefully shutting down...`);
            
            if (this.bot) {
                await this.bot.shutdown();
            }
            
            this.isRunning = false;
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            logger.critical('Uncaught exception detected', error);
            shutdown('EXCEPTION');
        });
    }

    keepAlive() {
        // Keep the bot alive using setInterval
        const heartbeat = setInterval(() => {
            if (this.isRunning) {
                logger.debug('Bot heartbeat - system running normally');
            } else {
                clearInterval(heartbeat);
            }
        }, 30000); // Every 30 seconds

        logger.success('Keep-alive system activated');
    }
}

// Start the Instagram Bot Framework
const framework = new InstagramBotFramework();
framework.start().catch(error => {
    console.error('Failed to start Instagram Bot Framework:', error);
    process.exit(1);
});

module.exports = InstagramBotFramework;
