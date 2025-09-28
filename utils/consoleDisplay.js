let gradient;
try {
    gradient = require("gradient-string");
    if (typeof gradient !== 'function') {
        throw new Error('gradient-string not properly loaded');
    }
} catch (error) {
    // Fallback if gradient-string is not available or not working
    const createGradient = (colors) => (text) => text;
    gradient = createGradient;
    gradient.hex = () => createGradient;
}

const { readFileSync } = require('fs-extra');
const path = require('path');

// Set bash title
if (!process.stdout.columns || process.stdout.columns < 1) process.stdout.columns = 50;
process.stdout.write("\x1b]2;ELITA - Instagram Bot Framework\x1b\x5c");

/**
 * Center text in console
 * @param {string} text 
 * @param {number} length 
 */
function centerText(text, length) {
    const width = process.stdout.columns;
    const leftPadding = Math.floor((width - (length || text.length)) / 2);
    const rightPadding = width - leftPadding - (length || text.length);
    const paddedString = ' '.repeat(leftPadding > 0 ? leftPadding : 0) + text + ' '.repeat(rightPadding > 0 ? rightPadding : 0);
    console.log(paddedString);
}

/**
 * Create horizontal line
 * @param {string} content 
 * @param {boolean} isMaxWidth 
 * @returns {string}
 */
function createLine(content, isMaxWidth = false) {
    let widthConsole = process.stdout.columns;
    if (widthConsole > 50 && !isMaxWidth)
        widthConsole = 50;

    if (!content)
        return Array(isMaxWidth ? process.stdout.columns : widthConsole).fill("─").join("");
    else {
        content = ` ${content.trim()} `;
        const lengthContent = content.length;
        const lengthLine = isMaxWidth ? process.stdout.columns - lengthContent : widthConsole - lengthContent;
        let left = Math.floor(lengthLine / 2);
        if (left < 0 || isNaN(left))
            left = 0;
        const lineOne = Array(left).fill("─").join("");
        return lineOne + content + lineOne;
    }
}

/**
 * Display startup banner for ELITA bot
 */
function displayStartupBanner() {
    try {
        const packageInfo = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        const currentVersion = packageInfo.version || '1.0.0';
        
        const maxWidth = process.stdout.columns;
        
        // ASCII Art titles for different screen sizes with enhanced design
        const titles = [
            [
                "███████╗██╗     ██╗████████╗ █████╗  ⚡",
                "██╔════╝██║     ██║╚══██╔══╝██╔══██╗ ⚡",
                "█████╗  ██║     ██║   ██║   ███████║ ⚡",
                "██╔══╝  ██║     ██║   ██║   ██╔══██║ ⚡",
                "███████╗███████╗██║   ██║   ██║  ██║ ⚡",
                "╚══════╝╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝  "
            ],
            [
                "▓█████  ██▓     ██▓▄▄▄█████▓ ▄▄▄      ",
                "▓█   ▀ ▓██▒    ▓██▒▓  ██▒ ▓▒▒████▄    ",
                "▒███   ▒██░    ▒██▒▒ ▓██░ ▒░▒██  ▀█▄  ",
                "▒▓█  ▄ ▒██░    ░██░░ ▓██▓ ░ ░██▄▄▄▄██ ",
                "░▒████▒░██████▒░██░  ▒██▒ ░  ▓█   ▓██▒",
                "░░ ▒░ ░░ ▒░▓  ░░▓    ▒ ░░    ▒▒   ▓▒█░"
            ],
            [
                "╔═══╗ ╔╗    ╔╗╔══╗ ╔════╗ ╔════╗",
                "║╔══╝ ║║    ║║╚╣╠╝ ║╔╗╔╗║ ║╔╗╔╗║",
                "║╚══╗ ║║    ║║ ║║  ╚╝║║╚╝ ║║║║║║",
                "║╔══╝ ║║ ╔╗ ║║ ║║    ║║   ║║║║║║",
                "║╚══╗ ║╚═╝╚═╝║╔╣╠╗   ║║   ║║║║║║",
                "╚═══╝ ╚═════╗║╚══╝   ╚╝   ╚╝╚╝╚╝"
            ],
            [
                "⚡ E • L • I • T • A ⚡"
            ]
        ];

        const title = maxWidth > 60 ? 
            titles[0] : 
            maxWidth > 40 ? 
                titles[1] : 
                maxWidth > 30 ? 
                    titles[2] : 
                    titles[3];

        // Display elegant top border with gradients
        console.log(gradient("#FF6B6B", "#4ECDC4", "#45B7D1")(createLine(" WELCOME TO ELITA ", true)));
        console.log();
        
        // Display main logo with beautiful colors
        for (let i = 0; i < title.length; i++) {
            const text = title[i];
            let coloredText;
            
            // Different gradient colors for each line
            switch (i % 6) {
                case 0:
                    coloredText = gradient("#FF6B6B", "#4ECDC4")(text);
                    break;
                case 1:
                    coloredText = gradient("#4ECDC4", "#45B7D1")(text);
                    break;
                case 2:
                    coloredText = gradient("#45B7D1", "#96CEB4")(text);
                    break;
                case 3:
                    coloredText = gradient("#96CEB4", "#FFEAA7")(text);
                    break;
                case 4:
                    coloredText = gradient("#FFEAA7", "#DDA0DD")(text);
                    break;
                case 5:
                    coloredText = gradient("#DDA0DD", "#FF6B6B")(text);
                    break;
                default:
                    coloredText = gradient("#74b9ff", "#0984e3")(text);
            }
            
            centerText(coloredText, text.length);
        }
        
        console.log();
        console.log(gradient("#74b9ff", "#0984e3")("═".repeat(maxWidth > 80 ? 80 : maxWidth)));
        console.log();

        // Display version and subtitle with elegant formatting
        let versionLine = `⚡ Version ${currentVersion} `;
        centerText(gradient("#00b894", "#00cec9")(versionLine), versionLine.length);
        
        let frameworkLine = "Advanced Instagram Bot Framework";
        centerText(gradient("#6c5ce7", "#a29bfe")(frameworkLine), frameworkLine.length);
        
        console.log();

        // Display author information with beautiful styling
        let authorLine = "🎯 Created with ♡ by Mohammed Al-Akari 🎯";
        centerText(gradient("#fd79a8", "#fdcb6e")(authorLine), authorLine.length);
        
        console.log();

        // Display purpose and warning with attractive colors
        let purposeLine = "📚 Educational Instagram Bot Framework";
        centerText(gradient("#00b894", "#55a3ff")(purposeLine), purposeLine.length);
        
        let termsLine = "📝 Follow Instagram Terms of Service";
        centerText(gradient("#55a3ff", "#74b9ff")(termsLine), termsLine.length);
        
        console.log();
        
        // Warning section with prominent styling
        let warningLine = "⚠️  FOR EDUCATIONAL PURPOSES ONLY  ⚠️";
        centerText(gradient("#e17055", "#f39c12")(warningLine), warningLine.length);
        
        console.log();
        console.log(gradient("#FF6B6B", "#4ECDC4", "#45B7D1")(createLine("🚀 SYSTEM STATUS 🚀", true)));
        console.log();

    } catch (error) {
        console.log('ELITA - Instagram Bot Framework');
        console.log('Created by Mohammed Al-Akari');
        console.log('═'.repeat(50));
    }
}

/**
 * Display elegant section header with gradient colors
 * @param {string} title 
 */
function displaySection(title) {
    console.log(gradient("#6c5ce7", "#74b9ff")(createLine(`⭐ ${title} ⭐`, true)));
}

/**
 * Display bot info section with beautiful formatting
 * @param {Object} botInfo 
 */
function displayBotInfo(botInfo = {}) {
    // Create elegant info display
    const info = [
        { icon: "🤖", label: "Bot Name", value: botInfo.name || 'ELITA', color: "#74b9ff" },
        { icon: "📝", label: "Version", value: botInfo.version || '1.0.0', color: "#00b894" },
        { icon: "🔧", label: "Node.js", value: process.version, color: "#6c5ce7" },
        { icon: "🌐", label: "Environment", value: process.env.NODE_ENV || 'production', color: "#fd79a8" },
        { icon: "📁", label: "Directory", value: process.cwd().split('/').pop(), color: "#fdcb6e" }
    ];

    for (const item of info) {
        const line = `${item.icon} ${item.label}: ${gradient(item.color, "#ddd")(item.value)}`;
        console.log(line);
    }
    console.log();
}

/**
 * Display loading message with beautiful animation effect
 * @param {string} message 
 */
function displayLoading(message) {
    const loadingLine = `⏳ ${message}...`;
    console.log(gradient("#74b9ff", "#0984e3")(loadingLine));
}

/**
 * Display success message with green gradient
 * @param {string} message 
 */
function displaySuccess(message) {
    const successLine = `✅ ${message}`;
    console.log(gradient("#00b894", "#55efc4")(successLine));
}

/**
 * Display error message with red gradient  
 * @param {string} message 
 */
function displayError(message) {
    const errorLine = `❌ ${message}`;
    console.log(gradient("#e17055", "#fab1a0")(errorLine));
}

/**
 * Display warning message with orange gradient
 * @param {string} message 
 */
function displayWarning(message) {
    const warningLine = `⚠️  ${message}`;
    console.log(gradient("#fdcb6e", "#f39c12")(warningLine));
}

/**
 * Display info message with blue gradient
 * @param {string} message 
 */
function displayInfo(message) {
    const infoLine = `ℹ️  ${message}`;
    console.log(gradient("#74b9ff", "#0984e3")(infoLine));
}

/**
 * Display celebration message
 * @param {string} message 
 */
function displayCelebration(message) {
    console.log();
    const celebrationLine = `🎉 ${message} 🎉`;
    centerText(gradient("#fd79a8", "#fdcb6e")(celebrationLine), celebrationLine.length);
    console.log();
}

module.exports = {
    displayStartupBanner,
    displaySection,
    displayBotInfo,
    displayLoading,
    displaySuccess,
    displayError,
    displayWarning,
    displayInfo,
    displayCelebration,
    createLine,
    centerText
};