const { createCommandInteraction } = require('../../utils/command-helpers');
const deckCommand = require('../../../src/commands/tarot/deck');
const DatabaseManager = require('../../../src/database/DatabaseManager');
const CardUtils = require('../../../src/utils/cardUtils');

// Mock the database manager and card utils
jest.mock('../../../src/database/DatabaseManager');
jest.mock('../../../src/utils/cardUtils');

describe('Deck Command Integration', () => {
  let interaction;
  let dbManager;
  let mockCardUtils;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock deck of cards
    const mockDeck = [
      { id: 'fool', name: 'The Fool', suit: 'Major Arcana', keywords: ['beginnings'] },
      { id: 'magician', name: 'The Magician', suit: 'Major Arcana', keywords: ['manifestation'] },
      { id: 'high-priestess', name: 'High Priestess', suit: 'Major Arcana', keywords: ['intuition'] },
    ];

    // Set up the card utils mock
    mockCardUtils = {
      getAllCards: jest.fn().mockReturnValue(mockDeck),
      searchCards: jest.fn().mockImplementation((query) => 
        mockDeck.filter(card => 
          card.name.toLowerCase().includes(query.toLowerCase()) ||
          card.keywords.some(kw => kw.includes(query.toLowerCase()))
        )
      ),
      getCardById: jest.fn().mockImplementation((id) => 
        mockDeck.find(card => card.id === id)
      ),
    };

    // Mock the CardUtils constructor
    CardUtils.mockImplementation(() => mockCardUtils);

    // Create a mock interaction for the deck command
    interaction = createCommandInteraction({
      commandName: 'deck',
      subcommandName: 'list',
      options: {
        page: 1,
      },
    });

    // Set up the database manager mock
    dbManager = {
      getUserPreferences: jest.fn().mockResolvedValue({
        timezone: 'UTC',
        language: 'en',
      }),
    };

    DatabaseManager.mockImplementation(() => dbManager);
  });

  describe('List Cards', () => {
    it('should list all cards in the deck', async () => {
      // Execute the command
      await deckCommand.execute(interaction);

      // Verify the interaction was replied to
      expect(interaction.reply).toHaveBeenCalled();
      
      // Get the reply arguments
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Verify the reply contains an embed with the deck list
      expect(replyArgs.embeds).toBeDefined();
      expect(replyArgs.embeds[0].title).toContain('Tarot Deck');
      expect(replyArgs.embeds[0].description).toContain('The Fool');
      expect(replyArgs.embeds[0].description).toContain('The Magician');
      expect(replyArgs.components).toBeDefined(); // Should have pagination buttons
    });

    it('should show a specific page when requested', async () => {
      // Update the interaction for a specific page
      interaction.options.getInteger.mockImplementation((name) => {
        if (name === 'page') return 2;
        return null;
      });

      // Execute the command
      await deckCommand.execute(interaction);

      // Verify the interaction was replied to with the correct page
      expect(interaction.reply).toHaveBeenCalled();
      const replyArgs = interaction.reply.mock.calls[0][0];
      expect(replyArgs.embeds[0].footer.text).toContain('Page 2');
    });
  });

  describe('Search Cards', () => {
    beforeEach(() => {
      // Update the interaction for a search
      interaction.options.getSubcommand.mockReturnValue('search');
      interaction.options.getString.mockImplementation((name) => {
        if (name === 'query') return 'fool';
        return null;
      });
    });

    it('should search for cards by name or keyword', async () => {
      // Execute the command
      await deckCommand.execute(interaction);

      // Verify the interaction was replied to with search results
      expect(interaction.reply).toHaveBeenCalled();
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Should have found The Fool
      expect(replyArgs.embeds[0].description).toContain('The Fool');
      // Should not have other cards in the results
      expect(replyArgs.embeds[0].description).not.toContain('The Magician');
    });

    it('should handle no search results', async () => {
      // Mock an empty search result
      mockCardUtils.searchCards.mockReturnValue([]);
      
      // Execute the command
      await deckCommand.execute(interaction);

      // Verify the interaction was replied to with a no results message
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('No cards found'),
        ephemeral: true,
      }));
    });
  });

  describe('View Card Details', () => {
    beforeEach(() => {
      // Update the interaction to view a specific card
      interaction.options.getSubcommand.mockReturnValue('view');
      interaction.options.getString.mockImplementation((name) => {
        if (name === 'card') return 'fool';
        return null;
      });
    });

    it('should show details for a specific card', async () => {
      // Execute the command
      await deckCommand.execute(interaction);

      // Verify the interaction was replied to with card details
      expect(interaction.reply).toHaveBeenCalled();
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Should have the card details
      expect(replyArgs.embeds[0].title).toContain('The Fool');
      expect(replyArgs.embeds[0].fields).toBeDefined();
      expect(replyArgs.embeds[0].fields.some(f => f.name === 'Suit' && f.value.includes('Major Arcana'))).toBe(true);
    });

    it('should handle card not found', async () => {
      // Mock card not found
      mockCardUtils.getCardById.mockReturnValue(undefined);
      
      // Execute the command
      await deckCommand.execute(interaction);

      // Verify the interaction was replied to with an error message
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('not found'),
        ephemeral: true,
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during execution', async () => {
      // Make the card utils throw an error
      mockCardUtils.getAllCards.mockImplementation(() => {
        throw new Error('Failed to load deck');
      });

      // Execute the command
      await deckCommand.execute(interaction);

      // Verify the error was handled
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('error'),
        ephemeral: true,
      }));
    });
  });
});
