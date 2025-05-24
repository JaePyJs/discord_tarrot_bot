const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class LocalizationManager {
  constructor() {
    this.defaultLanguage = 'en';
    this.supportedLanguages = ['en', 'fil', 'es', 'fr', 'de'];
    this.translations = {};
    this.loadTranslations();
  }

  // Load all translation files
  loadTranslations() {
    try {
      const localesDir = path.join(__dirname, '../locales');
      
      // Ensure locales directory exists
      if (!fs.existsSync(localesDir)) {
        fs.mkdirSync(localesDir, { recursive: true });
        this.createDefaultTranslations();
      }

      // Load each language file
      for (const lang of this.supportedLanguages) {
        const filePath = path.join(localesDir, `${lang}.json`);
        
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            this.translations[lang] = JSON.parse(content);
            logger.info(`Loaded translations for ${lang}`);
          } catch (error) {
            logger.error(`Failed to load translations for ${lang}:`, error);
            this.translations[lang] = {};
          }
        } else {
          this.translations[lang] = {};
          logger.warn(`Translation file not found for ${lang}`);
        }
      }

      logger.success(`Localization system initialized with ${Object.keys(this.translations).length} languages`);
    } catch (error) {
      logger.error('Failed to initialize localization system:', error);
      this.translations = { en: {} };
    }
  }

  // Create default translation files
  createDefaultTranslations() {
    const localesDir = path.join(__dirname, '../locales');
    
    // English (default)
    const enTranslations = {
      commands: {
        tarot: {
          name: 'tarot',
          description: 'Get a mystical tarot reading',
          single: {
            name: 'single',
            description: 'Draw a single card for guidance'
          },
          daily: {
            name: 'daily',
            description: 'Daily guidance card'
          }
        },
        journal: {
          name: 'journal',
          description: 'Manage your personal tarot reading journal'
        },
        reminder: {
          name: 'reminder',
          description: 'Set up personal tarot reading reminders'
        }
      },
      messages: {
        cooldown: 'The cards need time to recharge... Please wait {time} seconds.',
        welcome: 'Welcome to your mystical tarot journey! 🔮',
        error: 'Something went wrong with the mystical energies. Please try again.',
        reading_saved: 'Your reading has been saved to your journal.',
        reminder_set: 'Your reminder has been set for {time}.',
        no_readings: 'You have no readings yet. Start your journey with /tarot!',
        ai_enhanced: 'Enhanced with AI insights',
        for_entertainment: 'For entertainment purposes only'
      },
      cards: {
        upright: 'Upright',
        reversed: 'Reversed',
        keywords: 'Keywords',
        meaning: 'Meaning',
        position: 'Position'
      },
      spreads: {
        single: 'Single Card',
        three_card: 'Three Card Spread',
        celtic_cross: 'Celtic Cross',
        daily: 'Daily Card',
        custom: 'Custom Spread'
      },
      time: {
        seconds: 'seconds',
        minutes: 'minutes',
        hours: 'hours',
        days: 'days',
        weeks: 'weeks',
        months: 'months'
      }
    };

    // Filipino/Tagalog translations
    const filTranslations = {
      commands: {
        tarot: {
          name: 'tarot',
          description: 'Kumuha ng mystical na tarot reading',
          single: {
            name: 'single',
            description: 'Kumuha ng isang card para sa gabay'
          },
          daily: {
            name: 'daily',
            description: 'Araw-araw na gabay card'
          }
        },
        journal: {
          name: 'journal',
          description: 'Pamahalaan ang inyong personal na tarot reading journal'
        },
        reminder: {
          name: 'reminder',
          description: 'Mag-set ng personal na tarot reading reminders'
        }
      },
      messages: {
        cooldown: 'Kailangan ng mga card ng oras para mag-recharge... Maghintay ng {time} segundo.',
        welcome: 'Maligayang pagdating sa inyong mystical na tarot journey! 🔮',
        error: 'May problema sa mystical energies. Subukan ulit.',
        reading_saved: 'Ang inyong reading ay na-save sa journal.',
        reminder_set: 'Ang inyong reminder ay na-set para sa {time}.',
        no_readings: 'Wala pa kayong readings. Simulan ang journey sa /tarot!',
        ai_enhanced: 'Pinahusay ng AI insights',
        for_entertainment: 'Para sa entertainment lamang'
      },
      cards: {
        upright: 'Tuwid',
        reversed: 'Baliktad',
        keywords: 'Mga Keyword',
        meaning: 'Kahulugan',
        position: 'Posisyon'
      },
      spreads: {
        single: 'Isang Card',
        three_card: 'Tatlong Card Spread',
        celtic_cross: 'Celtic Cross',
        daily: 'Araw-araw na Card',
        custom: 'Custom Spread'
      },
      time: {
        seconds: 'segundo',
        minutes: 'minuto',
        hours: 'oras',
        days: 'araw',
        weeks: 'linggo',
        months: 'buwan'
      }
    };

    // Spanish translations
    const esTranslations = {
      commands: {
        tarot: {
          name: 'tarot',
          description: 'Obtén una lectura mística de tarot',
          single: {
            name: 'single',
            description: 'Saca una carta para orientación'
          },
          daily: {
            name: 'daily',
            description: 'Carta de orientación diaria'
          }
        }
      },
      messages: {
        cooldown: 'Las cartas necesitan tiempo para recargarse... Espera {time} segundos.',
        welcome: '¡Bienvenido a tu viaje místico del tarot! 🔮',
        error: 'Algo salió mal con las energías místicas. Inténtalo de nuevo.',
        for_entertainment: 'Solo para entretenimiento'
      }
    };

    // Save translation files
    try {
      fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(enTranslations, null, 2));
      fs.writeFileSync(path.join(localesDir, 'fil.json'), JSON.stringify(filTranslations, null, 2));
      fs.writeFileSync(path.join(localesDir, 'es.json'), JSON.stringify(esTranslations, null, 2));
      
      logger.success('Created default translation files');
    } catch (error) {
      logger.error('Failed to create translation files:', error);
    }
  }

  // Get translation for a key
  t(key, language = this.defaultLanguage, params = {}) {
    try {
      const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
      const translation = this.getNestedValue(this.translations[lang], key) || 
                         this.getNestedValue(this.translations[this.defaultLanguage], key) || 
                         key;

      // Replace parameters in translation
      return this.replaceParams(translation, params);
    } catch (error) {
      logger.error(`Translation error for key "${key}":`, error);
      return key;
    }
  }

  // Get nested value from object using dot notation
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, prop) => current && current[prop], obj);
  }

  // Replace parameters in translation string
  replaceParams(text, params) {
    if (typeof text !== 'string') return text;
    
    return text.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  // Get user's preferred language
  getUserLanguage(userId) {
    // In a real implementation, this would fetch from database
    // For now, return default language
    return this.defaultLanguage;
  }

  // Set user's preferred language
  async setUserLanguage(userId, language) {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // In a real implementation, this would save to database
    logger.info(`User ${userId} language set to ${language}`);
    return true;
  }

  // Get available languages
  getAvailableLanguages() {
    return this.supportedLanguages.map(lang => ({
      code: lang,
      name: this.getLanguageName(lang),
      flag: this.getLanguageFlag(lang)
    }));
  }

  // Get language display name
  getLanguageName(code) {
    const names = {
      en: 'English',
      fil: 'Filipino',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch'
    };
    return names[code] || code;
  }

  // Get language flag emoji
  getLanguageFlag(code) {
    const flags = {
      en: '🇺🇸',
      fil: '🇵🇭',
      es: '🇪🇸',
      fr: '🇫🇷',
      de: '🇩🇪'
    };
    return flags[code] || '🌍';
  }

  // Translate card meanings
  translateCard(card, language = this.defaultLanguage) {
    try {
      const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
      
      // For now, return original card data
      // In a full implementation, this would translate card meanings
      return {
        ...card,
        language: lang,
        translated: lang !== 'en'
      };
    } catch (error) {
      logger.error('Card translation error:', error);
      return card;
    }
  }

  // Get localized embed for Discord
  getLocalizedEmbed(embedKey, language, params = {}) {
    const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
    
    const embedData = {
      color: 0x4B0082,
      title: this.t(`embeds.${embedKey}.title`, lang, params),
      description: this.t(`embeds.${embedKey}.description`, lang, params),
      footer: {
        text: this.t('messages.for_entertainment', lang)
      }
    };

    return embedData;
  }

  // Format time in user's language
  formatTime(seconds, language = this.defaultLanguage) {
    const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
    
    if (seconds < 60) {
      return `${seconds} ${this.t('time.seconds', lang)}`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} ${this.t('time.minutes', lang)}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours} ${this.t('time.hours', lang)}`;
    }
  }

  // Get localized card position names
  getLocalizedPositions(spreadType, language = this.defaultLanguage) {
    const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
    
    const positions = {
      three_card: [
        this.t('positions.past', lang) || 'Past',
        this.t('positions.present', lang) || 'Present', 
        this.t('positions.future', lang) || 'Future'
      ],
      celtic_cross: [
        this.t('positions.present_situation', lang) || 'Present Situation',
        this.t('positions.challenge', lang) || 'Challenge',
        this.t('positions.foundation', lang) || 'Foundation',
        // ... more positions
      ]
    };

    return positions[spreadType] || [];
  }

  // Reload translations (for development)
  reloadTranslations() {
    this.translations = {};
    this.loadTranslations();
    logger.info('Translations reloaded');
  }
}

module.exports = LocalizationManager;
