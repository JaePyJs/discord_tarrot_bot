#!/usr/bin/env node

/**
 * Comprehensive test suite for Discord Tarot Bot v2.2.0 features
 * Tests all new divination methods, analytics, and advanced features
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ✅ ${msg}`),
  error: (msg) => console.error(`[ERROR] ❌ ${msg}`),
  warn: (msg) => console.warn(`[WARN] ⚠️ ${msg}`),
  test: (msg) => console.log(`[TEST] 🧪 ${msg}`)
};

class V2_2_0_FeatureTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async runAllTests() {
    logger.info('🚀 Starting Discord Tarot Bot v2.2.0 Feature Tests...');
    logger.info('');

    // Test file structure
    await this.testFileStructure();
    
    // Test new command files
    await this.testCommandFiles();
    
    // Test utility files
    await this.testUtilityFiles();
    
    // Test database enhancements
    await this.testDatabaseEnhancements();
    
    // Test configuration
    await this.testConfiguration();
    
    // Test divination methods
    await this.testDivinationMethods();
    
    // Test analytics features
    await this.testAnalyticsFeatures();
    
    // Test AI integration
    await this.testAIIntegration();
    
    // Test localization
    await this.testLocalization();
    
    // Test interactive features
    await this.testInteractiveFeatures();

    // Display results
    this.displayResults();
  }

  async testFileStructure() {
    logger.test('Testing v2.2.0 file structure...');

    const requiredFiles = [
      'commands/oracle.js',
      'commands/runes.js',
      'commands/iching.js',
      'commands/spread.js',
      'commands/deck.js',
      'commands/analytics.js',
      'utils/aiInterpretation.js',
      'utils/localization.js',
      'utils/interactiveReading.js',
      'utils/advancedAnalytics.js',
      'scripts/migrate-to-v2.2.0.js'
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.recordTest(`File exists: ${file}`, true);
      } else {
        this.recordTest(`File missing: ${file}`, false);
      }
    }

    // Test locales directory
    if (fs.existsSync('locales')) {
      this.recordTest('Locales directory exists', true);
    } else {
      this.recordTest('Locales directory missing', false, 'Will be created on first run');
    }
  }

  async testCommandFiles() {
    logger.test('Testing new command files...');

    const commands = [
      { file: 'commands/oracle.js', name: 'oracle' },
      { file: 'commands/runes.js', name: 'runes' },
      { file: 'commands/iching.js', name: 'iching' },
      { file: 'commands/spread.js', name: 'spread' },
      { file: 'commands/deck.js', name: 'deck' },
      { file: 'commands/analytics.js', name: 'analytics' }
    ];

    for (const cmd of commands) {
      try {
        if (fs.existsSync(cmd.file)) {
          const command = require(`./${cmd.file}`);
          
          // Test basic structure
          if (command.data && command.execute) {
            this.recordTest(`${cmd.name} command structure valid`, true);
            
            // Test command name
            if (command.data.name === cmd.name) {
              this.recordTest(`${cmd.name} command name correct`, true);
            } else {
              this.recordTest(`${cmd.name} command name incorrect`, false);
            }
            
            // Test subcommands
            if (command.data.options && command.data.options.length > 0) {
              this.recordTest(`${cmd.name} has subcommands`, true);
            } else {
              this.recordTest(`${cmd.name} missing subcommands`, false);
            }
          } else {
            this.recordTest(`${cmd.name} command structure invalid`, false);
          }
        } else {
          this.recordTest(`${cmd.name} command file missing`, false);
        }
      } catch (error) {
        this.recordTest(`${cmd.name} command load error: ${error.message}`, false);
      }
    }
  }

  async testUtilityFiles() {
    logger.test('Testing new utility files...');

    const utilities = [
      { file: 'utils/aiInterpretation.js', class: 'AIInterpretationEngine' },
      { file: 'utils/localization.js', class: 'LocalizationManager' },
      { file: 'utils/interactiveReading.js', class: 'InteractiveReadingManager' },
      { file: 'utils/advancedAnalytics.js', class: 'AdvancedAnalyticsEngine' }
    ];

    for (const util of utilities) {
      try {
        if (fs.existsSync(util.file)) {
          const UtilClass = require(`./${util.file}`);
          
          if (typeof UtilClass === 'function') {
            const instance = new UtilClass();
            this.recordTest(`${util.class} instantiates correctly`, true);
            
            // Test key methods exist
            if (util.class === 'AIInterpretationEngine') {
              if (typeof instance.generateInterpretation === 'function') {
                this.recordTest(`${util.class} has generateInterpretation method`, true);
              } else {
                this.recordTest(`${util.class} missing generateInterpretation method`, false);
              }
            }
            
            if (util.class === 'LocalizationManager') {
              if (typeof instance.t === 'function') {
                this.recordTest(`${util.class} has translation method`, true);
              } else {
                this.recordTest(`${util.class} missing translation method`, false);
              }
            }
          } else {
            this.recordTest(`${util.class} not a constructor`, false);
          }
        } else {
          this.recordTest(`${util.file} missing`, false);
        }
      } catch (error) {
        this.recordTest(`${util.class} load error: ${error.message}`, false);
      }
    }
  }

  async testDatabaseEnhancements() {
    logger.test('Testing database enhancements...');

    try {
      const DatabaseManager = require('./database/DatabaseManager');
      const db = new DatabaseManager();
      
      // Test new methods exist
      const newMethods = [
        'getDailyOracleReading',
        'getDailyRuneReading',
        'getDailyIChingReading',
        'getUserPreferences',
        'setUserPreference',
        'getUserCardStats',
        'getUserFavorites',
        'addUserFavorite',
        'removeUserFavorite',
        'unlockThemes'
      ];

      for (const method of newMethods) {
        if (typeof db[method] === 'function') {
          this.recordTest(`DatabaseManager has ${method} method`, true);
        } else {
          this.recordTest(`DatabaseManager missing ${method} method`, false);
        }
      }
    } catch (error) {
      this.recordTest(`DatabaseManager test error: ${error.message}`, false);
    }
  }

  async testConfiguration() {
    logger.test('Testing configuration and package.json...');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Test version
      if (packageJson.version === '2.2.0') {
        this.recordTest('Package version is 2.2.0', true);
      } else {
        this.recordTest(`Package version is ${packageJson.version}, expected 2.2.0`, false);
      }
      
      // Test new scripts
      const newScripts = ['migrate-v2.2.0', 'test-v2.2.0', 'test-divination', 'test-analytics'];
      for (const script of newScripts) {
        if (packageJson.scripts[script]) {
          this.recordTest(`Script ${script} exists`, true);
        } else {
          this.recordTest(`Script ${script} missing`, false);
        }
      }
    } catch (error) {
      this.recordTest(`Package.json test error: ${error.message}`, false);
    }
  }

  async testDivinationMethods() {
    logger.test('Testing divination methods...');

    // Test Oracle Cards
    try {
      const oracle = require('./commands/oracle.js');
      if (oracle.drawOracleCard && oracle.getOracleDecks) {
        this.recordTest('Oracle cards system functional', true);
        
        const decks = oracle.getOracleDecks();
        if (Object.keys(decks).length >= 5) {
          this.recordTest('Oracle has 5+ decks', true);
        } else {
          this.recordTest('Oracle missing decks', false);
        }
      } else {
        this.recordTest('Oracle cards system incomplete', false);
      }
    } catch (error) {
      this.recordTest(`Oracle test error: ${error.message}`, false);
    }

    // Test Runes
    try {
      const runes = require('./commands/runes.js');
      if (runes.drawRune && runes.getRuneSet) {
        this.recordTest('Runes system functional', true);
        
        const runeSet = runes.getRuneSet();
        if (runeSet.length >= 24) {
          this.recordTest('Runes has 24+ runes', true);
        } else {
          this.recordTest('Runes missing runes', false);
        }
      } else {
        this.recordTest('Runes system incomplete', false);
      }
    } catch (error) {
      this.recordTest(`Runes test error: ${error.message}`, false);
    }

    // Test I Ching
    try {
      const iching = require('./commands/iching.js');
      if (iching.castHexagram && iching.getHexagramDatabase) {
        this.recordTest('I Ching system functional', true);
        
        const hexagrams = iching.getHexagramDatabase();
        if (hexagrams.length >= 5) {
          this.recordTest('I Ching has hexagram database', true);
        } else {
          this.recordTest('I Ching missing hexagrams', false);
        }
      } else {
        this.recordTest('I Ching system incomplete', false);
      }
    } catch (error) {
      this.recordTest(`I Ching test error: ${error.message}`, false);
    }
  }

  async testAnalyticsFeatures() {
    logger.test('Testing analytics features...');

    try {
      const AdvancedAnalyticsEngine = require('./utils/advancedAnalytics.js');
      const analytics = new AdvancedAnalyticsEngine();
      
      const methods = [
        'analyzeUserPatterns',
        'analyzeTimePatterns',
        'analyzeCardPatterns',
        'generateInsights',
        'generateRecommendations'
      ];

      for (const method of methods) {
        if (typeof analytics[method] === 'function') {
          this.recordTest(`Analytics has ${method} method`, true);
        } else {
          this.recordTest(`Analytics missing ${method} method`, false);
        }
      }
    } catch (error) {
      this.recordTest(`Analytics test error: ${error.message}`, false);
    }
  }

  async testAIIntegration() {
    logger.test('Testing AI integration...');

    try {
      const AIInterpretationEngine = require('./utils/aiInterpretation.js');
      const ai = new AIInterpretationEngine();
      
      // Test AI availability check
      if (typeof ai.isAvailable === 'function') {
        this.recordTest('AI availability check exists', true);
        
        const available = ai.isAvailable();
        if (process.env.OPENAI_API_KEY) {
          this.recordTest('AI integration configured', available);
        } else {
          this.recordTest('AI integration not configured (no API key)', true, 'Expected without API key');
        }
      } else {
        this.recordTest('AI availability check missing', false);
      }
      
      // Test AI methods
      const methods = ['generateInterpretation', 'generateQuickInsight', 'generateReflectionQuestions'];
      for (const method of methods) {
        if (typeof ai[method] === 'function') {
          this.recordTest(`AI has ${method} method`, true);
        } else {
          this.recordTest(`AI missing ${method} method`, false);
        }
      }
    } catch (error) {
      this.recordTest(`AI integration test error: ${error.message}`, false);
    }
  }

  async testLocalization() {
    logger.test('Testing localization system...');

    try {
      const LocalizationManager = require('./utils/localization.js');
      const localization = new LocalizationManager();
      
      // Test translation method
      if (typeof localization.t === 'function') {
        this.recordTest('Localization translation method exists', true);
        
        // Test basic translation
        const translation = localization.t('commands.tarot.name', 'en');
        if (translation) {
          this.recordTest('Basic translation works', true);
        } else {
          this.recordTest('Basic translation failed', false);
        }
      } else {
        this.recordTest('Localization translation method missing', false);
      }
      
      // Test supported languages
      if (typeof localization.getAvailableLanguages === 'function') {
        const languages = localization.getAvailableLanguages();
        if (languages.length >= 5) {
          this.recordTest('Localization supports 5+ languages', true);
        } else {
          this.recordTest('Localization missing languages', false);
        }
      }
    } catch (error) {
      this.recordTest(`Localization test error: ${error.message}`, false);
    }
  }

  async testInteractiveFeatures() {
    logger.test('Testing interactive features...');

    try {
      const InteractiveReadingManager = require('./utils/interactiveReading.js');
      const interactive = new InteractiveReadingManager();
      
      const methods = [
        'createInteractiveReading',
        'createReadingComponents',
        'handleButtonInteraction',
        'handleSelectMenuInteraction'
      ];

      for (const method of methods) {
        if (typeof interactive[method] === 'function') {
          this.recordTest(`Interactive has ${method} method`, true);
        } else {
          this.recordTest(`Interactive missing ${method} method`, false);
        }
      }
    } catch (error) {
      this.recordTest(`Interactive features test error: ${error.message}`, false);
    }
  }

  recordTest(description, passed, note = null) {
    this.testResults.tests.push({ description, passed, note });
    
    if (passed) {
      this.testResults.passed++;
      logger.success(description);
    } else {
      this.testResults.failed++;
      logger.error(description);
    }
    
    if (note) {
      this.testResults.warnings++;
      logger.warn(`Note: ${note}`);
    }
  }

  displayResults() {
    logger.info('');
    logger.info('🔮 ===== DISCORD TAROT BOT v2.2.0 TEST RESULTS =====');
    logger.info('');
    logger.success(`✅ Tests Passed: ${this.testResults.passed}`);
    
    if (this.testResults.failed > 0) {
      logger.error(`❌ Tests Failed: ${this.testResults.failed}`);
    }
    
    if (this.testResults.warnings > 0) {
      logger.warn(`⚠️ Warnings: ${this.testResults.warnings}`);
    }
    
    const total = this.testResults.passed + this.testResults.failed;
    const percentage = total > 0 ? Math.round((this.testResults.passed / total) * 100) : 0;
    
    logger.info('');
    logger.info(`📊 Overall Success Rate: ${percentage}%`);
    
    if (percentage >= 90) {
      logger.success('🎉 Excellent! Your v2.2.0 setup is ready for the ultimate mystical experience!');
    } else if (percentage >= 75) {
      logger.warn('⚠️ Good setup, but some features may not work correctly. Check failed tests.');
    } else {
      logger.error('❌ Setup needs attention. Please fix failed tests before proceeding.');
    }
    
    logger.info('');
    logger.info('🚀 Next Steps:');
    logger.info('1. Run: npm run migrate-v2.2.0');
    logger.info('2. Run: npm run deploy-commands');
    logger.info('3. Start your enhanced bot: npm start');
    logger.info('');
    logger.info('🔮 New Commands Available:');
    logger.info('• /oracle - Oracle card readings');
    logger.info('• /runes - Norse rune castings');
    logger.info('• /iching - I Ching consultations');
    logger.info('• /spread - Custom spread creator');
    logger.info('• /deck - Deck customization');
    logger.info('• /analytics - Advanced analytics');
    logger.info('');
    logger.info('✨ May the enhanced mystical energies guide your Discord community! ✨');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new V2_2_0_FeatureTester();
  tester.runAllTests().catch(error => {
    logger.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = V2_2_0_FeatureTester;
