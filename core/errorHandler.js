const logger = require('./logger');

/**
 * Global Error Handler for Instagram Bot
 * Handles all types of errors and provides appropriate responses
 */

class ErrorHandler {
    constructor() {
        this.errorTypes = {
            AUTHENTICATION: 'authentication',
            COOKIE: 'cookie',
            CONNECTION: 'connection',
            COMMAND: 'command',
            DATABASE: 'database',
            GENERAL: 'general'
        };
    }

    /**
     * Initialize global error handlers
     */
    initialize() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.critical('Uncaught Exception - System may be unstable', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // Graceful shutdown
            this.gracefulShutdown('uncaughtException');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.critical('Unhandled Promise Rejection', {
                reason: reason,
                promise: promise,
                timestamp: new Date().toISOString()
            });
        });

        logger.success('Global error handlers initialized');
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error, context = {}) {
        const errorInfo = this.extractErrorInfo(error);
        
        if (errorInfo.message.includes('invalid') || errorInfo.message.includes('expired')) {
            logger.authError('Authentication failed - cookies may be invalid or expired', {
                context,
                suggestion: 'Please update your Instagram cookies in data/cookies.json'
            });
            
            return {
                type: this.errorTypes.AUTHENTICATION,
                userMessage: '🔐 **Authentication Error**\n\nYour Instagram session has expired. Please update your cookies.',
                action: 'UPDATE_COOKIES'
            };
        }

        logger.authError('Authentication system error', errorInfo);
        return {
            type: this.errorTypes.AUTHENTICATION,
            userMessage: '🔐 **Authentication Error**\n\nThere was a problem with the authentication system.',
            action: 'RETRY'
        };
    }

    /**
     * Handle cookie-related errors
     */
    handleCookieError(error, context = {}) {
        const errorInfo = this.extractErrorInfo(error);
        
        if (errorInfo.message.includes('ENOENT') || errorInfo.message.includes('not found')) {
            logger.cookieError('Cookie file not found', {
                context,
                suggestion: 'Create data/cookies.json with valid Instagram cookies'
            });
            
            return {
                type: this.errorTypes.COOKIE,
                userMessage: '🍪 **Cookie File Missing**\n\nPlease create data/cookies.json with your Instagram cookies.',
                action: 'CREATE_COOKIES'
            };
        }

        if (errorInfo.message.includes('JSON') || errorInfo.message.includes('parse')) {
            logger.cookieError('Invalid cookie file format', {
                context,
                suggestion: 'Check JSON syntax in data/cookies.json'
            });
            
            return {
                type: this.errorTypes.COOKIE,
                userMessage: '🍪 **Invalid Cookie Format**\n\nYour cookie file has invalid JSON format.',
                action: 'FIX_FORMAT'
            };
        }

        logger.cookieError('Cookie processing error', errorInfo);
        return {
            type: this.errorTypes.COOKIE,
            userMessage: '🍪 **Cookie Error**\n\nThere was a problem processing your Instagram cookies.',
            action: 'CHECK_COOKIES'
        };
    }

    /**
     * Handle connection errors
     */
    handleConnectionError(error, context = {}) {
        const errorInfo = this.extractErrorInfo(error);
        
        if (errorInfo.message.includes('ENOTFOUND') || errorInfo.message.includes('timeout')) {
            logger.connectionError('Network connectivity issue', {
                context,
                suggestion: 'Check internet connection'
            });
            
            return {
                type: this.errorTypes.CONNECTION,
                userMessage: '🌐 **Connection Error**\n\nCannot connect to Instagram. Please check your internet connection.',
                action: 'CHECK_NETWORK'
            };
        }

        if (errorInfo.message.includes('403') || errorInfo.message.includes('forbidden')) {
            logger.connectionError('Instagram access forbidden', {
                context,
                suggestion: 'Account may be restricted or cookies invalid'
            });
            
            return {
                type: this.errorTypes.CONNECTION,
                userMessage: '🚫 **Access Forbidden**\n\nInstagram is blocking access. Your account may be restricted.',
                action: 'CHECK_ACCOUNT'
            };
        }

        logger.connectionError('Instagram connection error', errorInfo);
        return {
            type: this.errorTypes.CONNECTION,
            userMessage: '🌐 **Connection Error**\n\nFailed to connect to Instagram servers.',
            action: 'RETRY_LATER'
        };
    }

    /**
     * Handle command execution errors
     */
    handleCommandError(error, context = {}) {
        const errorInfo = this.extractErrorInfo(error);
        
        logger.error('Command execution error', {
            ...errorInfo,
            context,
            commandName: context.commandName || 'unknown'
        });

        if (errorInfo.message.includes('permission') || errorInfo.message.includes('access')) {
            return {
                type: this.errorTypes.COMMAND,
                userMessage: '⛔ **Permission Error**\n\nYou don\'t have permission to execute this command.',
                action: 'CHECK_PERMISSIONS'
            };
        }

        return {
            type: this.errorTypes.COMMAND,
            userMessage: '⚠️ **Command Error**\n\nThe command failed to execute. Please try again.',
            action: 'RETRY'
        };
    }

    /**
     * Handle database errors
     */
    handleDatabaseError(error, context = {}) {
        const errorInfo = this.extractErrorInfo(error);
        
        logger.error('Database error', {
            ...errorInfo,
            context
        });

        if (errorInfo.message.includes('SQLITE_CORRUPT')) {
            logger.critical('Database corruption detected', errorInfo);
            
            return {
                type: this.errorTypes.DATABASE,
                userMessage: '💾 **Database Error**\n\nDatabase corruption detected. Please contact support.',
                action: 'CONTACT_SUPPORT'
            };
        }

        return {
            type: this.errorTypes.DATABASE,
            userMessage: '💾 **Database Error**\n\nA database operation failed. Please try again.',
            action: 'RETRY'
        };
    }

    /**
     * Handle general errors
     */
    handleGeneralError(error, context = {}) {
        const errorInfo = this.extractErrorInfo(error);
        
        logger.error('General error', {
            ...errorInfo,
            context
        });

        return {
            type: this.errorTypes.GENERAL,
            userMessage: '❌ **An Error Occurred**\n\nSomething went wrong. Please try again later.',
            action: 'RETRY'
        };
    }

    /**
     * Extract useful information from error
     */
    extractErrorInfo(error) {
        if (error instanceof Error) {
            return {
                message: error.message,
                name: error.name,
                stack: error.stack,
                code: error.code
            };
        }

        if (typeof error === 'string') {
            return {
                message: error,
                name: 'StringError',
                stack: null,
                code: null
            };
        }

        return {
            message: String(error),
            name: 'UnknownError',
            stack: null,
            code: null
        };
    }

    /**
     * Determine error type automatically
     */
    determineErrorType(error, context = {}) {
        const errorInfo = this.extractErrorInfo(error);
        const message = errorInfo.message.toLowerCase();

        if (message.includes('auth') || message.includes('login') || message.includes('session')) {
            return this.errorTypes.AUTHENTICATION;
        }

        if (message.includes('cookie') || message.includes('csrf') || message.includes('sessionid')) {
            return this.errorTypes.COOKIE;
        }

        if (message.includes('connect') || message.includes('network') || message.includes('timeout')) {
            return this.errorTypes.CONNECTION;
        }

        if (message.includes('command') || context.commandName) {
            return this.errorTypes.COMMAND;
        }

        if (message.includes('database') || message.includes('sqlite') || message.includes('sql')) {
            return this.errorTypes.DATABASE;
        }

        return this.errorTypes.GENERAL;
    }

    /**
     * Handle error based on type
     */
    handleError(error, context = {}) {
        const errorType = context.type || this.determineErrorType(error, context);

        switch (errorType) {
            case this.errorTypes.AUTHENTICATION:
                return this.handleAuthError(error, context);
            case this.errorTypes.COOKIE:
                return this.handleCookieError(error, context);
            case this.errorTypes.CONNECTION:
                return this.handleConnectionError(error, context);
            case this.errorTypes.COMMAND:
                return this.handleCommandError(error, context);
            case this.errorTypes.DATABASE:
                return this.handleDatabaseError(error, context);
            default:
                return this.handleGeneralError(error, context);
        }
    }

    /**
     * Graceful shutdown
     */
    gracefulShutdown(reason) {
        logger.critical(`Initiating graceful shutdown - Reason: ${reason}`);
        
        setTimeout(() => {
            logger.critical('Force exiting after timeout');
            process.exit(1);
        }, 5000);

        // Attempt graceful shutdown
        process.exit(1);
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        // This could be enhanced to track error frequencies
        return {
            totalErrors: 0,
            errorsByType: {},
            lastError: null
        };
    }
}

module.exports = new ErrorHandler();