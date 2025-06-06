const { createCommandInteraction } = require('../../utils/command-helpers');
const tarotCommand = require('../../../src/commands/tarot/tarot');
const DatabaseManager = require('../../../src/database/DatabaseManager');
const CardUtils = require('../../../src/utils/cardUtils');

// Mock the database manager
jest.mock('../../../src/database/DatabaseManager');

// Mock the card utils
jest.mock('../../../src/utils/cardUtils');

describe('Tarot Command Integration', () => {
  let interaction;
  let dbManager;
  let mockCardUtils;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock card
    const mockCard = {
      id: 'fool',
      name: 'The Fool',
      suit: 'Major Arcana',
      keywords: ['beginnings', 'innocence', 'spontaneity'],
      isReversed: false,
      position: 'Present Situation'
    };

    // Set up the card utils mock
    mockCardUtils = {
      singleCardReading: jest.fn().mockReturnValue([mockCard]),
      threeCardReading: jest.fn().mockReturnValue([
        { ...mockCard, position: 'Past' },
        { ...mockCard, id: 'magician', name: 'The Magician', position: 'Present' },
        { ...mockCard, id: 'high-priestess', name: 'High Priestess', position: 'Future' }
      ]),
      celticCrossReading: jest.fn().mockReturnValue(Array(10).fill(0).map((_, i) => ({
        ...mockCard,
        id: `card-${i}`,
        name: `Card ${i}`,
        position: `Position ${i}`
      }))),
      getCardMeaning: jest.fn().mockReturnValue({
        upright: 'Upright meaning',
        reversed: 'Reversed meaning',
        meaning: 'Upright meaning'
      })
    };

    // Mock the CardUtils constructor
    CardUtils.mockImplementation(() => mockCardUtils);

    // Create a mock interaction for the tarot command
    interaction = createCommandInteraction({
      commandName: 'tarot',
      subcommandName: 'single',
      options: {
        private: false,
        'ai-enhanced': false,
      },
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

  describe('Single Card Reading', () => {
    it('should return a single card reading', async () => {
      // Execute the command
      await tarotCommand.execute(interaction);

      // Verify the interaction was replied to
      expect(interaction.reply).toHaveBeenCalled();
      
      // Get the reply arguments
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Verify the reply contains an embed with a card
      expect(replyArgs.embeds).toBeDefined();
      expect(replyArgs.embeds.length).toBeGreaterThan(0);
      expect(replyArgs.embeds[0].title).toContain('The Fool');
      expect(replyArgs.embeds[0].description).toBeDefined();
      
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
      await tarotCommand.execute(interaction);

      // Verify the interaction was replied to with ephemeral flag
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        ephemeral: true,
      }));
    });
  });

  describe('Three Card Reading', () => {
    beforeEach(() => {
      // Update the interaction for a three card reading
      interaction.options.getSubcommand.mockReturnValue('three-card');
    });

    it('should return a three card reading', async () => {
      // Execute the command
      await tarotCommand.execute(interaction);

      // Verify the interaction was replied to
      expect(interaction.reply).toHaveBeenCalled();
      
      // Get the reply arguments
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Verify the reply contains multiple embeds with cards
      expect(replyArgs.embeds).toBeDefined();
      expect(replyArgs.embeds.length).toBe(3);
      
      // Verify each card has the expected position
      const positions = replyArgs.embeds.map(embed => 
        embed.fields?.find(field => field.name === 'Position')?.value
      );
      
      expect(positions).toContain('Past');
      expect(positions).toContain('Present');
      expect(positions).toContain('Future');
      
      // Verify the database was called to save the reading
      expect(dbManager.saveReading).toHaveBeenCalled();
    });
  });

  describe('Celtic Cross Reading', () => {
    beforeEach(() => {
      // Update the interaction for a celtic cross reading
      interaction.options.getSubcommand.mockReturnValue('celtic-cross');
    });

    it('should return a celtic cross reading', async () => {
      // Execute the command
      await tarotCommand.execute(interaction);

      // Verify the interaction was replied to
      expect(interaction.reply).toHaveBeenCalled();
      
      // Get the reply arguments
      const replyArgs = interaction.reply.mock.calls[0][0];
      
      // Verify the reply contains multiple embeds with cards
      expect(replyArgs.embeds).toBeDefined();
      expect(replyArgs.embeds.length).toBe(10);
      
      // Verify the database was called to save the reading
      expect(dbManager.saveReading).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during card drawing', async () => {
      // Make the cardUtils throw an error
      mockCardUtils.singleCardReading.mockImplementation(() => {
        throw new Error('Failed to draw card');
      });

      // Execute the command
      await tarotCommand.execute(interaction);

      // Verify the error was handled
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('error'),
        ephemeral: true,
      }));
    });

    it('should handle database errors', async () => {
      // Make the database throw an error
      dbManager.saveReading.mockRejectedValue(new Error('Database error'));

      // Execute the command
      await tarotCommand.execute(interaction);

      // The command should still complete even if saving fails
      expect(interaction.reply).toHaveBeenCalled();
    });
  });
});
