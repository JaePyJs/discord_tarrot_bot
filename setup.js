#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class TarotBotSetup {
    constructor() {
        this.config = {};
        this.dbType = 'postgresql';
    }

    async run() {
        console.log('🔮 DISCORD TAROT BOT SETUP - PHILIPPINES EDITION 🇵🇭');
        console.log('='.repeat(60));
        console.log('');

        try {
            await this.checkPrerequisites();
            await this.gatherConfiguration();
            await this.setupDatabase();
            await this.createEnvironmentFile();
            await this.installDependencies();
            await this.initializeDatabase();
            await this.deployCommands();
            await this.showCompletionMessage();
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            rl.close();
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 16) {
            throw new Error(`Node.js 16+ required. Current version: ${nodeVersion}`);
        }
        console.log(`✅ Node.js ${nodeVersion} - OK`);

        // Check npm
        try {
            execSync('npm --version', { stdio: 'ignore' });
            console.log('✅ npm - OK');
        } catch (error) {
            throw new Error('npm not found. Please install Node.js with npm.');
        }

        // Check PostgreSQL (optional)
        try {
            execSync('psql --version', { stdio: 'ignore' });
            console.log('✅ PostgreSQL - Available');
            this.postgresAvailable = true;
        } catch (error) {
            console.log('⚠️  PostgreSQL not found - will use SQLite for development');
            this.postgresAvailable = false;
        }

        console.log('');
    }

    async gatherConfiguration() {
        console.log('⚙️  Configuration Setup');
        console.log('-'.repeat(30));

        // Discord Bot Token
        this.config.discordToken = await this.askQuestion(
            '🤖 Enter your Discord Bot Token: '
        );

        if (!this.config.discordToken || this.config.discordToken.length < 50) {
            throw new Error('Invalid Discord token. Please check your token from Discord Developer Portal.');
        }

        // Application ID
        this.config.clientId = await this.askQuestion(
            '🆔 Enter your Discord Application ID: '
        );

        if (!this.config.clientId || !/^\d{17,19}$/.test(this.config.clientId)) {
            throw new Error('Invalid Application ID. Should be 17-19 digits.');
        }

        // Test Guild ID (optional)
        this.config.guildId = await this.askQuestion(
            '🏠 Enter Test Server ID (optional, for faster development): '
        );

        // Database choice
        if (this.postgresAvailable) {
            const dbChoice = await this.askQuestion(
                '💾 Choose database (1=PostgreSQL recommended, 2=SQLite): '
            );
            this.dbType = dbChoice === '2' ? 'sqlite' : 'postgresql';
        } else {
            this.dbType = 'sqlite';
        }

        if (this.dbType === 'postgresql') {
            await this.gatherPostgreSQLConfig();
        }

        console.log('');
    }

    async gatherPostgreSQLConfig() {
        console.log('🐘 PostgreSQL Configuration');
        console.log('-'.repeat(30));

        this.config.pgHost = await this.askQuestion('Host [localhost]: ') || 'localhost';
        this.config.pgPort = await this.askQuestion('Port [5432]: ') || '5432';
        this.config.pgDatabase = await this.askQuestion('Database [tarot_bot]: ') || 'tarot_bot';
        this.config.pgUser = await this.askQuestion('Username [tarot_user]: ') || 'tarot_user';
        this.config.pgPassword = await this.askQuestion('Password: ');

        if (!this.config.pgPassword) {
            throw new Error('PostgreSQL password is required');
        }
    }

    async setupDatabase() {
        if (this.dbType === 'postgresql') {
            console.log('🐘 Setting up PostgreSQL...');
            console.log('');
            console.log('Please run these commands in PostgreSQL as superuser:');
            console.log('');
            console.log(`CREATE DATABASE ${this.config.pgDatabase};`);
            console.log(`CREATE USER ${this.config.pgUser} WITH PASSWORD '${this.config.pgPassword}';`);
            console.log(`GRANT ALL PRIVILEGES ON DATABASE ${this.config.pgDatabase} TO ${this.config.pgUser};`);
            console.log(`\\c ${this.config.pgDatabase}`);
            console.log(`GRANT ALL ON SCHEMA public TO ${this.config.pgUser};`);
            console.log(`ALTER DATABASE ${this.config.pgDatabase} SET timezone TO 'Asia/Manila';`);
            console.log('');

            const confirmed = await this.askQuestion('Have you run these commands? (y/N): ');
            if (confirmed.toLowerCase() !== 'y') {
                throw new Error('Please set up PostgreSQL database first');
            }
        }
    }

    async createEnvironmentFile() {
        console.log('📝 Creating environment file...');

        const envContent = this.generateEnvContent();
        
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env file created');
    }

    generateEnvContent() {
        let content = `# =============================================================================
# 🔮 DISCORD TAROT BOT CONFIGURATION - PHILIPPINES EDITION 🇵🇭
# =============================================================================
# Generated on: ${new Date().toISOString()}

# Discord Bot Credentials
DISCORD_TOKEN=${this.config.discordToken}
CLIENT_ID=${this.config.clientId}
${this.config.guildId ? `GUILD_ID=${this.config.guildId}` : '# GUILD_ID=your_test_server_id_here'}

# Database Configuration
DATABASE_TYPE=${this.dbType}
`;

        if (this.dbType === 'postgresql') {
            content += `
# PostgreSQL Settings
POSTGRES_HOST=${this.config.pgHost}
POSTGRES_PORT=${this.config.pgPort}
POSTGRES_DATABASE=${this.config.pgDatabase}
POSTGRES_USER=${this.config.pgUser}
POSTGRES_PASSWORD=${this.config.pgPassword}
POSTGRES_SSL=false
`;
        } else {
            content += `
# SQLite Settings
SQLITE_PATH=./database/tarot.db
`;
        }

        content += `
# Philippines Timezone Configuration
TIMEZONE=Asia/Manila

# Bot Behavior Settings
COMMAND_COOLDOWN=30
MAX_READINGS_PER_DAY=10
MAX_READINGS_PER_HOUR=5

# Daily Card Settings
DAILY_CARD_ENABLED=false
DAILY_CARD_TIME=09:00
# DAILY_CARD_CHANNEL=your_channel_id_here

# Visual Settings
BOT_STATUS=the mystical cards 🔮
BOT_ACTIVITY_TYPE=WATCHING
COLOR_UPRIGHT=0x4B0082
COLOR_REVERSED=0x8B0000

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_USER_PROFILES=true
ENABLE_SERVER_STATS=true
ENABLE_ACHIEVEMENTS=true
ENABLE_CARD_LOOKUP=true
ENABLE_READING_HISTORY=true

# Performance & Security
PERFORMANCE_MONITORING=false
ENABLE_DEBUG_LOGGING=false
NODE_ENV=production

# Footer Text
READING_FOOTER=For entertainment purposes only
`;

        return content;
    }

    async installDependencies() {
        console.log('📦 Installing dependencies...');
        
        try {
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ Dependencies installed');
        } catch (error) {
            throw new Error('Failed to install dependencies');
        }
    }

    async initializeDatabase() {
        console.log('🗄️  Initializing database schema...');
        
        try {
            const { initializeDatabase } = require('./database/init');
            await initializeDatabase();
            console.log('✅ Database schema initialized');
        } catch (error) {
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }

    async deployCommands() {
        console.log('⚡ Deploying Discord commands...');
        
        try {
            execSync('node deploy-commands.js', { stdio: 'inherit' });
            console.log('✅ Discord commands deployed');
        } catch (error) {
            throw new Error('Failed to deploy Discord commands');
        }
    }

    async showCompletionMessage() {
        console.log('');
        console.log('🎉 SETUP COMPLETE! 🎉');
        console.log('='.repeat(60));
        console.log('');
        console.log('🔮 Your Discord Tarot Bot is ready for the Philippines! 🇵🇭');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Start the bot: npm start');
        console.log('2. Test in Discord: /tarot help');
        console.log('3. Configure daily cards if desired');
        console.log('');
        console.log('🌟 Features Available:');
        console.log('• 78-card complete tarot deck');
        console.log('• 8 different reading types');
        console.log('• User profiles and achievements');
        console.log('• Server analytics and statistics');
        console.log('• Philippines timezone support');
        console.log('• Card lookup with autocomplete');
        console.log('• Admin management tools');
        console.log('');
        console.log('📚 Documentation:');
        console.log('• README.md - Main documentation');
        console.log('• FEATURES.md - Complete feature guide');
        console.log('• DATABASE_SETUP.md - Database configuration');
        console.log('• DISCORD_SETUP.md - Discord bot setup');
        console.log('');
        console.log('🆘 Need Help?');
        console.log('• Check the logs for any errors');
        console.log('• Review the documentation files');
        console.log('• Test with: npm run test-all');
        console.log('');
        console.log('May the cards guide your Discord server! 🌟');
    }

    askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new TarotBotSetup();
    setup.run().catch(console.error);
}

module.exports = TarotBotSetup;
