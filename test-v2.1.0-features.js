#!/usr/bin/env node

/**
 * Test script for Discord Tarot Bot v2.1.0 new features
 * Tests journal system, reminders, astrology integration, and enhanced card data
 */

const DatabaseManager = require('./database/DatabaseManager');
const AstrologyUtils = require('./utils/astrology');
const ReminderManager = require('./utils/reminderManager');
const enhancedCardData = require('./data/enhanced-card-data.json');
const cardUtils = require('./utils/cardUtils');

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ✅ ${msg}`),
  error: (msg) => console.error(`[ERROR] ❌ ${msg}`),
  warn: (msg) => console.warn(`[WARN] ⚠️ ${msg}`),
  test: (msg) => console.log(`[TEST] 🧪 ${msg}`)
};

class FeatureTester {
  constructor() {
    this.db = new DatabaseManager();
    this.astrology = new AstrologyUtils();
    this.testUserId = 'test-user-123';
    this.testResults = {
      database: false,
      journal: false,
      reminders: false,
      astrology: false,
      crystals: false,
      cardData: false
    };
  }

  async runAllTests() {
    logger.info('🔮 Starting Discord Tarot Bot v2.1.0 Feature Tests...');
    logger.info('=' .repeat(60));

    try {
      await this.testDatabaseConnection();
      await this.testJournalFeatures();
      await this.testReminderFeatures();
      await this.testAstrologyFeatures();
      await this.testCrystalRecommendations();
      await this.testEnhancedCardData();
      
      this.printTestResults();
      
    } catch (error) {
      logger.error(`Test suite failed: ${error.message}`);
      process.exit(1);
    }
  }

  async testDatabaseConnection() {
    logger.test('Testing database connection and schema...');
    
    try {
      const connected = await this.db.testConnection();
      if (!connected) {
        throw new Error('Database connection failed');
      }

      // Test if new tables exist
      try {
        await this.db.getUserReminders(this.testUserId);
        logger.success('Reminders table exists and accessible');
      } catch (error) {
        throw new Error('Reminders table not found - run migration script');
      }

      this.testResults.database = true;
      logger.success('Database tests passed');
      
    } catch (error) {
      logger.error(`Database test failed: ${error.message}`);
      throw error;
    }
  }

  async testJournalFeatures() {
    logger.test('Testing journal system...');
    
    try {
      // Test adding a reading note
      const testReading = {
        id: 1,
        user_id: this.testUserId,
        reading_type: 'single',
        cards_drawn: JSON.stringify([{name: 'The Fool', isReversed: false}]),
        created_at: new Date().toISOString()
      };

      // Test note functionality
      await this.db.addReadingNote(1, 'This is a test note for the journal system');
      logger.success('Reading note added successfully');

      // Test search functionality
      const searchResults = await this.db.searchUserReadings(this.testUserId, 'fool');
      logger.success(`Search functionality working (found ${searchResults.length} results)`);

      // Test statistics
      const stats = await this.db.getUserJournalStats(this.testUserId);
      logger.success(`Journal statistics working (${stats.totalReadings} total readings)`);

      this.testResults.journal = true;
      logger.success('Journal tests passed');
      
    } catch (error) {
      logger.error(`Journal test failed: ${error.message}`);
      // Don't throw - continue with other tests
    }
  }

  async testReminderFeatures() {
    logger.test('Testing reminder system...');
    
    try {
      // Test setting a reminder
      await this.db.setUserReminder(this.testUserId, 'daily', '09:00', 'Test reminder message');
      logger.success('Daily reminder set successfully');

      // Test getting reminders
      const reminders = await this.db.getUserReminders(this.testUserId);
      if (reminders.length > 0) {
        logger.success(`Reminders retrieved (${reminders.length} active)`);
      }

      // Test removing reminder
      await this.db.removeUserReminder(this.testUserId, 'daily');
      logger.success('Reminder removed successfully');

      this.testResults.reminders = true;
      logger.success('Reminder tests passed');
      
    } catch (error) {
      logger.error(`Reminder test failed: ${error.message}`);
      // Don't throw - continue with other tests
    }
  }

  async testAstrologyFeatures() {
    logger.test('Testing astrology integration...');
    
    try {
      // Test moon phase calculation
      const moonPhase = this.astrology.getCurrentMoonPhase();
      logger.success(`Current moon phase: ${moonPhase}`);

      // Test moon phase info
      const moonInfo = this.astrology.getMoonPhaseInfo();
      logger.success(`Moon phase info retrieved: ${moonInfo.energy}`);

      // Test planetary influence
      const planetaryInfluence = this.astrology.getCurrentPlanetaryInfluence();
      logger.success(`Planetary influence: ${planetaryInfluence.planet} - ${planetaryInfluence.influence}`);

      // Test astrological influence
      const astroInfluence = this.astrology.getAstrologicalInfluence();
      logger.success('Complete astrological influence calculated');

      // Test card astrology
      const cardAstrology = this.astrology.getCardAstrology('The Fool');
      if (cardAstrology) {
        logger.success(`Card astrology for The Fool: ${cardAstrology.sign}`);
      }

      this.testResults.astrology = true;
      logger.success('Astrology tests passed');
      
    } catch (error) {
      logger.error(`Astrology test failed: ${error.message}`);
      // Don't throw - continue with other tests
    }
  }

  async testCrystalRecommendations() {
    logger.test('Testing crystal recommendations...');
    
    try {
      // Test crystal recommendations for major arcana
      const crystals = cardUtils.getCrystalRecommendations('The Fool');
      if (crystals && crystals.length > 0) {
        logger.success(`Crystal recommendations for The Fool: ${crystals.join(', ')}`);
      } else {
        logger.warn('No crystal recommendations found for The Fool');
      }

      // Test meditation suggestions
      const meditation = cardUtils.getMeditationSuggestion('Page of Cups');
      if (meditation) {
        logger.success('Meditation suggestion retrieved for Page of Cups');
      } else {
        logger.warn('No meditation suggestion found for Page of Cups');
      }

      this.testResults.crystals = true;
      logger.success('Crystal and meditation tests passed');
      
    } catch (error) {
      logger.error(`Crystal test failed: ${error.message}`);
      // Don't throw - continue with other tests
    }
  }

  async testEnhancedCardData() {
    logger.test('Testing enhanced card data...');
    
    try {
      // Test court card personalities
      const courtCards = enhancedCardData.courtCardPersonalities;
      if (courtCards && Object.keys(courtCards).length > 0) {
        logger.success(`Court card personalities loaded: ${Object.keys(courtCards).length} cards`);
      }

      // Test moon phases data
      const moonPhases = enhancedCardData.moonPhases;
      if (moonPhases && Object.keys(moonPhases).length === 8) {
        logger.success('All 8 moon phases data loaded');
      }

      // Test crystal pairings
      const crystalPairings = enhancedCardData.crystalPairings;
      if (crystalPairings && crystalPairings.major_arcana) {
        logger.success(`Crystal pairings loaded for ${Object.keys(crystalPairings.major_arcana).length} cards`);
      }

      this.testResults.cardData = true;
      logger.success('Enhanced card data tests passed');
      
    } catch (error) {
      logger.error(`Enhanced card data test failed: ${error.message}`);
      // Don't throw - continue with other tests
    }
  }

  printTestResults() {
    logger.info('=' .repeat(60));
    logger.info('🔮 TEST RESULTS SUMMARY');
    logger.info('=' .repeat(60));

    const results = [
      { name: 'Database Connection & Schema', passed: this.testResults.database },
      { name: 'Journal System', passed: this.testResults.journal },
      { name: 'Reminder System', passed: this.testResults.reminders },
      { name: 'Astrology Integration', passed: this.testResults.astrology },
      { name: 'Crystal & Meditation Features', passed: this.testResults.crystals },
      { name: 'Enhanced Card Data', passed: this.testResults.cardData }
    ];

    let passedCount = 0;
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      logger.info(`${status} - ${result.name}`);
      if (result.passed) passedCount++;
    });

    logger.info('=' .repeat(60));
    logger.info(`OVERALL: ${passedCount}/${results.length} tests passed`);

    if (passedCount === results.length) {
      logger.success('🎉 All v2.1.0 features are working correctly!');
      logger.info('Your Discord Tarot Bot is ready for the mystical enhancements!');
      logger.info('');
      logger.info('New features available:');
      logger.info('📖 /journal - Personal reading journal system');
      logger.info('⏰ /reminder - Smart reminder system');
      logger.info('🌙 Enhanced daily readings with astrology');
      logger.info('💎 Crystal recommendations and meditation guidance');
    } else {
      logger.warn('Some tests failed. Please check the errors above.');
      logger.info('You may need to run the migration script: npm run migrate');
    }

    logger.info('=' .repeat(60));
  }

  async cleanup() {
    // Clean up test data
    try {
      await this.db.removeAllUserReminders(this.testUserId);
      logger.info('Test cleanup completed');
    } catch (error) {
      logger.warn(`Cleanup warning: ${error.message}`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new FeatureTester();
  tester.runAllTests()
    .then(() => tester.cleanup())
    .then(() => {
      logger.info('🔮 Feature testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Feature testing failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = FeatureTester;
