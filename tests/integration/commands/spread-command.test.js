const { createCommandInteraction } = require('../../utils/command-helpers');
const spreadCommand = require('../../../src/commands/tarot/spread');
const DatabaseManager = require('../../../src/database/DatabaseManager');
const CardUtils = require('../../../src/utils/cardUtils');

// Mock the database manager and card utils
jest.mock('../../../src/database/DatabaseManager');
jest.mock('../../../src/utils/cardUtils');

describe('Spread Command Integration', () => {
  let interaction;
  let dbManager;
  let mockCardUtils;

  // Mock card data
  const mockCard = {
    id: 'fool',
    name: 'The Fool',
    suit: 'Major Arcana',
    keywords: ['beginnings', 'innocence', 'spontaneity'],
    isReversed: false,
    position: 'Position 1'
  };

  // Mock spread data
  const mockSpreads = [
    {
      id: 'three-card',
      name: 'Three Card Spread',
      description: 'Past, Present, Future',
      positions: ['Past', 'Present', 'Future'],
      cardCount: 3
    },
    {
      id: 'celtic-cross',
      name: 'Celtic Cross',
      description: 'A comprehensive 10-card spread',
      positions: Array(10).fill().map((_, i) => `Position ${i+1}`),
      cardCount: 10
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up the card utils mock
    mockCardUtils = {
      getAvailableSpreads: jest.fn().mockReturnValue(mockSpreads),
      getSpreadById: jest.fn().mockImplementation((id) => 
        mockSpreads.find(spread => spread.id === id)
      ),
      customSpread: jest.fn().mockImplementation((positions) => 
        positions.map((pos, i) => ({
          ...mockCard,
          id: `card-${i}`,
          name: `Card ${i + 1}`,
          position: pos
        }))
      ),
    };

    // Mock the CardUtils constructor
    CardUtils.mockImplementation(() => mockCardUtils);

    // Create a mock interaction for the spread command
    interaction = createCommandInteraction({
      commandName: 'spread',
      subcommandName: 'list',
      options: {}
    });

    // Set up the database manager mock
    dbManager = {
      getUserPreferences: jest.fn().mockResolvedValue({
        timezone: 'UTC',
        language: 'en',
      }),
      saveReading: jest.fn().mockResolvedValue({ id: 'test-reading-id' }),
    };

    DatabaseManager.mockImplementation(() => dbManager);
  });

  describe('List Spreads', () => {
    it('should list all available spreads', async () => {
      // Execute the command
      await spreadCommand.execute(interaction);

      // Verify the interaction was replied to
      expect(interaction.reply).toHaveBeenCalled();
      
      // Get the reply arguments
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Verify the reply contains an embed with the spread list
      expect(replyArgs.embeds).toBeDefined();
      expect(replyArgs.embeds[0].title).toContain('Available Spreads');
      
      // Should list all available spreads
      mockSpreads.forEach(spread => {
        expect(replyArgs.embeds[0].description).toContain(spread.name);
        expect(replyArgs.embeds[0].description).toContain(spread.description);
      });
    });
  });

  describe('Use Spread', () => {
    beforeEach(() => {
      // Update the interaction to use a specific spread
      interaction.options.getSubcommand.mockReturnValue('use');
      interaction.options.getString.mockImplementation((name) => {
        if (name === 'spread') return 'three-card';
        return null;
      });
      interaction.options.getBoolean.mockReturnValue(false);
    });

    it('should perform a reading with the specified spread', async () => {
      // Execute the command
      await spreadCommand.execute(interaction);

      // Verify the interaction was replied to
      expect(interaction.reply).toHaveBeenCalled();
      
      // Get the reply arguments
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Verify the reply contains an embed with the spread reading
      expect(replyArgs.embeds).toBeDefined();
      expect(replyArgs.embeds[0].title).toContain('Three Card Spread Reading');
      
      // Should have the correct number of cards
      const cardEmbeds = replyArgs.embeds.filter(embed => 
        embed.title && embed.title.startsWith('Card ')
      );
      expect(cardEmbeds.length).toBe(3);
      
      // Verify the database was called to save the reading
      expect(dbManager.saveReading).toHaveBeenCalled();
    });

    it('should handle private readings', async () => {
      // Update the interaction for a private reading
      interaction.options.getBoolean.mockImplementation((name) => {
        if (name === 'private') return true;
        return false;
      });

      // Execute the command
      await spreadCommand.execute(interaction);

      // Verify the interaction was replied to with ephemeral flag
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        ephemeral: true,
      }));
    });
  });

  describe('Custom Spread', () => {
    beforeEach(() => {
      // Update the interaction for a custom spread
      interaction.options.getSubcommand.mockReturnValue('custom');
      interaction.options.getString.mockImplementation((name) => {
        if (name === 'positions') return 'Question,Challenge,Advice';
        return null;
      });
    });

    it('should create a custom spread with the specified positions', async () => {
      // Execute the command
      await spreadCommand.execute(interaction);

      // Verify the interaction was replied to
      expect(interaction.reply).toHaveBeenCalled();
      
      // Get the reply arguments
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Verify the reply contains an embed with the custom spread
      expect(replyArgs.embeds).toBeDefined();
      expect(replyArgs.embeds[0].title).toContain('Custom Spread Reading');
      
      // Should have the correct number of cards (3 positions)
      const cardEmbeds = replyArgs.embeds.filter(embed => 
        embed.title && embed.title.startsWith('Card ')
      );
      expect(cardEmbeds.length).toBe(3);
      
      // Verify the database was called to save the reading
      expect(dbManager.saveReading).toHaveBeenCalled();
    });

    it('should validate the number of positions', async () => {
      // Test with too many positions
      interaction.options.getString.mockImplementation((name) => {
        if (name === 'positions') return Array(21).fill('Position').join(',');
        return null;
      });

      // Execute the command
      await spreadCommand.execute(interaction);

      // Should return an error about too many positions
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('too many positions'),
        ephemeral: true,
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle spread not found', async () => {
      // Update the interaction with a non-existent spread
      interaction.options.getSubcommand.mockReturnValue('use');
      interaction.options.getString.mockImplementation((name) => {
        if (name === 'spread') return 'non-existent-spread';
        return null;
      });

      // Execute the command
      await spreadCommand.execute(interaction);

      // Should return an error about spread not found
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('not found'),
        ephemeral: true,
      }));
    });

    it('should handle errors during execution', async () => {
      // Make the card utils throw an error
      mockCardUtils.getAvailableSpreads.mockImplementation(() => {
        throw new Error('Failed to load spreads');
      });

      // Execute the command
      await spreadCommand.execute(interaction);

      // Verify the error was handled
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('error'),
        ephemeral: true,
      }));
    });
  });
});
