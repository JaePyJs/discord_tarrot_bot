const fs = require('fs');
const path = require('path');
const CardUtils = require('../../../src/utils/cardUtils');

// Mock the console.log to keep test output clean
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('CardUtils', () => {
  let cardUtils;

  beforeAll(() => {
    cardUtils = new CardUtils.constructor();
  });

  describe('Initialization', () => {
    it('should load all tarot cards', () => {
      expect(cardUtils.allCards.length).toBeGreaterThan(0);
      expect(cardUtils.allCards.some(card => card.suit === 'Major Arcana')).toBe(true);
      expect(cardUtils.allCards.some(card => card.suit === 'Cups')).toBe(true);
      expect(cardUtils.allCards.some(card => card.suit === 'Wands')).toBe(true);
      expect(cardUtils.allCards.some(card => card.suit === 'Swords')).toBe(true);
      expect(cardUtils.allCards.some(card => card.suit === 'Pentacles')).toBe(true);
    });
  });

  describe('drawCard', () => {
    it('should return a card with expected properties', () => {
      const card = cardUtils.drawCard();
      
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('name');
      expect(card).toHaveProperty('suit');
      expect(card).toHaveProperty('keywords');
      expect(card).toHaveProperty('isReversed');
      expect(card).toHaveProperty('position');
    });

    it('should respect excludeIds parameter', () => {
      const firstCard = cardUtils.drawCard();
      const secondCard = cardUtils.drawCard([firstCard.id]);
      
      expect(secondCard.id).not.toBe(firstCard.id);
    });

    it('should throw error when no cards are available', () => {
      // Get all card IDs
      const allCardIds = cardUtils.allCards.map(card => card.id);
      
      // Try to draw a card when all are excluded
      expect(() => cardUtils.drawCard(allCardIds)).toThrow('No cards available to draw');
    });
  });

  describe('drawCards', () => {
    it('should return the requested number of unique cards', () => {
      const count = 5;
      const cards = cardUtils.drawCards(count);
      
      expect(cards).toHaveLength(count);
      
      // Check that all cards are unique
      const cardIds = new Set(cards.map(card => card.id));
      expect(cardIds.size).toBe(count);
    });

    it('should respect excludeIds parameter', () => {
      const excludeIds = cardUtils.allCards.slice(0, 10).map(card => card.id);
      const cards = cardUtils.drawCards(5, excludeIds);
      
      // Check that none of the drawn cards are in the excluded list
      const drawnCardIds = new Set(cards.map(card => card.id));
      const hasExcludedCard = [...drawnCardIds].some(id => excludeIds.includes(id));
      
      expect(hasExcludedCard).toBe(false);
    });

    it('should throw error when requesting more cards than available', () => {
      const allCardIds = cardUtils.allCards.map(card => card.id);
      const availableCount = allCardIds.length;
      
      expect(() => cardUtils.drawCards(availableCount + 1)).toThrow('No cards available to draw');
    });
  });

  describe('Reading Methods', () => {
    describe('singleCardReading', () => {
      it('should return an array with one card', () => {
        const reading = cardUtils.singleCardReading();
        
        expect(reading).toHaveLength(1);
        expect(reading[0].position).toBe('Present Situation');
      });
    });

    describe('threeCardReading', () => {
      it('should return an array with three cards', () => {
        const reading = cardUtils.threeCardReading();
        
        expect(reading).toHaveLength(3);
        expect(reading[0].position).toBe('Past');
        expect(reading[1].position).toBe('Present');
        expect(reading[2].position).toBe('Future');
        
        // Check that all cards are unique
        const cardIds = new Set(reading.map(card => card.id));
        expect(cardIds.size).toBe(3);
      });
    });

    describe('celticCrossReading', () => {
      it('should return an array with ten cards', () => {
        const reading = cardUtils.celticCrossReading();
        
        expect(reading).toHaveLength(10);
        
        const positions = [
          'Present Situation',
          'Challenge/Cross',
          'Distant Past/Foundation',
          'Recent Past',
          'Possible Outcome',
          'Near Future',
          'Your Approach',
          'External Influences',
          'Hopes and Fears',
          'Final Outcome',
        ];
        
        reading.forEach((card, index) => {
          expect(card.position).toBe(positions[index]);
        });
        
        // Check that all cards are unique
        const cardIds = new Set(reading.map(card => card.id));
        expect(cardIds.size).toBe(10);
      });
    });
  });

  describe('getCardImageUrl', () => {
    it('should return a valid image URL for a card', () => {
      // Get a card that should have an image
      const card = cardUtils.allCards[0];
      const imageUrl = cardUtils.getCardImageUrl(card.name);
      
      expect(imageUrl).toMatch(/^https?:\/\//);
      expect(imageUrl).toContain(encodeURIComponent(card.name.toLowerCase()));
    });

    it('should handle reversed cards', () => {
      const card = { ...cardUtils.allCards[0], isReversed: true };
      const imageUrl = cardUtils.getCardImageUrl(card.name, card.isReversed);
      
      expect(imageUrl).toContain('reversed');
    });

    it('should return null for non-existent cards', () => {
      const imageUrl = cardUtils.getCardImageUrl('Nonexistent Card');
      expect(imageUrl).toBeNull();
    });
  });

  describe('getCardKeywords', () => {
    it('should return keywords for a card', () => {
      const card = cardUtils.allCards[0];
      const keywords = cardUtils.getCardKeywords(card.name);
      
      expect(keywords).toBeDefined();
      expect(keywords.upright).toBeInstanceOf(Array);
      expect(keywords.reversed).toBeInstanceOf(Array);
    });

    it('should return null for non-existent cards', () => {
      const keywords = cardUtils.getCardKeywords('Nonexistent Card');
      expect(keywords).toBeNull();
    });
  });

  describe('getCardMeaning', () => {
    it('should return meanings for a card', () => {
      const card = cardUtils.allCards[0];
      const meaning = cardUtils.getCardMeaning(card.name);
      
      expect(meaning).toBeDefined();
      expect(meaning.upright).toBeDefined();
      expect(meaning.reversed).toBeDefined();
    });

    it('should handle reversed cards', () => {
      const card = cardUtils.allCards[0];
      const meaning = cardUtils.getCardMeaning(card.name, true);
      
      expect(meaning).toBeDefined();
      expect(meaning.meaning).toBe(meaning.reversed);
    });

    it('should return null for non-existent cards', () => {
      const meaning = cardUtils.getCardMeaning('Nonexistent Card');
      expect(meaning).toBeNull();
    });
  });
});
