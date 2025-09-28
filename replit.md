# ELITA Instagram Bot Framework

## Overview

This project is ELITA, an advanced modular Instagram bot framework built with Node.js by Mohammed Al-Akari. It provides a comprehensive foundation for creating educational Instagram automation tools with a focus on modularity, multi-language support, and proper database management. The framework includes a dynamic command system, event handling, cookie-based authentication, automatic backup, update system, and SQLite database integration.

**Important**: This framework is designed for educational purposes only and requires compliance with Instagram's Terms of Service.
**Developer**: Mohammed Al-Akari
**Bot Name**: ELITA (Advanced Instagram Framework)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture
The system follows a modular event-driven architecture with the following key components:

- **Bot Core (`core/bot.js`)**: Main bot class extending EventEmitter for centralized event handling and bot lifecycle management
- **Command Handler (`handlers/commandHandler.js`)**: Dynamic command loading system with hot-reload capabilities and cooldown management
- **Event Handler (`handlers/eventHandler.js`)**: Event-driven system with priority-based event processing
- **Database Layer**: SQLite-based data persistence with model abstraction for Users and Groups

### Security Framework
Comprehensive security system implemented through:

- **Rate Limiting**: Built-in request throttling to prevent abuse (IP restriction removed as requested)
- **Cookie-based Authentication (`core/auth.js`)**: Session management using Instagram cookies with validation
- **Input Validation (`utils/validators.js`)**: Data sanitization for Instagram usernames and IDs
- **Command Cooldowns**: Individual and global cooldown system to prevent spam

### Database Design
SQLite-based local database with:

- **User Model**: Stores Instagram user data including profile information, follower counts, and metadata
- **Group Model**: Manages Instagram group/chat information with member tracking
- **Migration System**: Database schema versioning and updates through `database/init.js`

### Advanced Features (GoatBot-inspired)
Enhanced features include:

- **Multi-language Support (`utils/language.js`)**: Dynamic language switching with Arabic and English support
- **Automatic Backup System (`utils/backup.js`)**: Scheduled backups with versioning and restoration
- **Auto-Update System (`utils/updater.js`)**: Automatic framework updates with rollback capability
- **Advanced Command System**: Hot-reload, aliases, cooldowns, and permission levels
- **Event-driven Architecture**: Modular event system with priority handling
- **Configuration Management**: Separate configs for commands and global settings

### Configuration Management
Centralized configuration system:

- **Environment-based Settings**: Development and production configurations
- **Dual Configuration Files**: `config/config.js` for main settings, `configCommands.json` for command-specific configs
- **Environment Variables**: Per-command and per-event environment variable support
- **Security Settings**: Rate limiting and authentication parameters
- **Database Configuration**: SQLite connection and query management

## External Dependencies

### Core Dependencies
- **sqlite3**: Local SQLite database for data persistence
- **fs-extra**: Enhanced file system operations for backup and update features
- **axios**: HTTP client for API requests and update checking
- **node-cron**: Cron job scheduling for auto-restart and periodic tasks
- **Node.js Built-ins**: events, path, os, util for core functionality

### Instagram Integration
- **Custom HTTP Client**: Manual HTTP request handling for Instagram API interaction
- **Cookie Management**: Custom cookie-based session handling for Instagram authentication
- **User-Agent Spoofing**: Browser simulation for request legitimacy

### Advanced Features
- **File System Watchers**: Hot-reload functionality for commands and events
- **Backup System**: Automated backup creation and restoration
- **Update Manager**: Automatic framework updates with version checking
- **Language Manager**: Multi-language support with dynamic text loading
- **Process Management**: Graceful shutdown handling and error recovery

### Security Components
- **Data Sanitization**: Input validation for Instagram-specific data formats
- **Session Security**: Secure cookie storage and validation systems
- **Rate Limiting**: Request throttling and cooldown management

### Documentation and Guides
- **Command Creation Guide** (`docs/COMMAND_GUIDE.md`): Comprehensive guide for creating new commands
- **Event Creation Guide** (`docs/EVENT_GUIDE.md`): Detailed instructions for event development

Note: The framework follows GoatBot architecture patterns while maintaining minimal external dependencies, focusing on educational use and Instagram Terms of Service compliance.