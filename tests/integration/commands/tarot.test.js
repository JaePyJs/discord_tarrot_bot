const { createMockInteraction } = require('../../utils/test-helpers');
const tarotCommand = require('../../../src/commands/tarot/tarot');
const DatabaseManager = require('../../../src/database/DatabaseManager');

// Mock the database manager
jest.mock('../../../src/database/DatabaseManager');

describe('Tarot Command', () => {
  let interaction;
  let dbManager;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new mock interaction for each test
    interaction = createMockInteraction({
      commandName: 'tarot',
      subcommandName: 'single',
      options: {
        'private': false,
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

  it('should handle a single card reading', async () => {
    // Execute the command
    await tarotCommand.execute(interaction);

    // Verify the interaction was replied to
    expect(interaction.reply).toHaveBeenCalled();
    
    // Get the reply arguments
    const replyArgs = interaction.reply.mock.calls[0][0];
    
    // Verify the reply contains an embed with a card
    expect(replyArgs.embeds).toBeDefined();
    expect(replyArgs.embeds.length).toBeGreaterThan(0);
    expect(replyArgs.embeds[0].title).toBeDefined();
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
