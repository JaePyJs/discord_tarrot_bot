const { Collection } = require('discord.js');

/**
 * Creates a mock Discord client
 * @returns {Object} Mock Discord client
 */
function createMockClient() {
  return {
    user: {
      id: '1234567890',
      username: 'TestBot',
      discriminator: '1234',
      bot: true,
      setPresence: jest.fn(),
    },
    users: new Collection(),
    guilds: new Collection(),
    channels: new Collection(),
    commands: new Collection(),
    on: jest.fn(),
    login: jest.fn().mockResolvedValue('test_token'),
  };
}

/**
 * Creates a mock command collection
 * @param {Object} commands - Object with command names as keys and command modules as values
 * @returns {Collection} Collection of commands
 */
function createCommandCollection(commands) {
  const collection = new Collection();
  Object.entries(commands).forEach(([name, command]) => {
    collection.set(name, command);
  });
  return collection;
}

/**
 * Creates a mock interaction for command testing
 * @param {Object} options - Options for the mock interaction
 * @returns {Object} Mock interaction object
 */
function createCommandInteraction(options = {}) {
  const {
    commandName = 'tarot',
    subcommandName = 'single',
    options = {},
    user = { id: '1234567890', username: 'testuser', discriminator: '1234' },
    guild = { id: '9876543210', name: 'Test Server' },
    channel = { id: '5678901234', name: 'test-channel' },
    member = null,
    deferred = false,
    replied = false,
    client = createMockClient(),
  } = options;

  if (!member) {
    member = {
      user,
      guild,
      permissions: {
        has: jest.fn().mockReturnValue(true),
      },
    };
  }

  const interaction = {
    commandName,
    user,
    member,
    guild,
    channel,
    client,
    options: {
      getSubcommand: jest.fn().mockReturnValue(subcommandName),
      getBoolean: jest.fn((name) => options[name]),
      getString: jest.fn((name) => options[name]),
      getInteger: jest.fn((name) => options[name]),
      getUser: jest.fn((name) => options[name]),
      getMember: jest.fn((name) => options[name]),
      getChannel: jest.fn((name) => options[name]),
    },
    deferReply: jest.fn().mockResolvedValue(),
    reply: jest.fn().mockResolvedValue(),
    editReply: jest.fn().mockResolvedValue(),
    followUp: jest.fn().mockResolvedValue(),
    deferUpdate: jest.fn().mockResolvedValue(),
    update: jest.fn().mockResolvedValue(),
    showModal: jest.fn().mockResolvedValue(),
    isButton: jest.fn().mockReturnValue(false),
    isCommand: jest.fn().mockReturnValue(true),
    isModalSubmit: jest.fn().mockReturnValue(false),
    isSelectMenu: jest.fn().mockReturnValue(false),
    isAutocomplete: jest.fn().mockReturnValue(false),
    isChatInputCommand: jest.fn().mockReturnValue(true),
    isContextMenuCommand: jest.fn().mockReturnValue(false),
    inGuild: jest.fn().mockReturnValue(true),
    inCachedGuild: jest.fn().mockReturnValue(true),
    inRawGuild: jest.fn().mockReturnValue(false),
  };

  // Mock the methods that depend on the state
  Object.defineProperty(interaction, 'deferred', { get: () => deferred });
  Object.defineProperty(interaction, 'replied', { get: () => replied });

  return interaction;
}

module.exports = {
  createMockClient,
  createCommandCollection,
  createCommandInteraction,
};
