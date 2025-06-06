const { Collection } = require('discord.js');

/**
 * Creates a mock Discord interaction object
 * @param {Object} options - Options for the mock interaction
 * @returns {Object} Mock interaction object
 */
function createMockInteraction(options = {}) {
  const {
    commandName = 'tarot',
    subcommandName = 'single',
    options = {},
    user = { id: '1234567890', username: 'testuser', discriminator: '1234' },
    guild = { id: '9876543210', name: 'Test Server' },
    channel = { id: '5678901234', name: 'test-channel' },
    deferred = false,
    replied = false,
  } = options;

  const interaction = {
    commandName,
    user,
    member: {
      user,
      guild,
      permissions: {
        has: jest.fn().mockReturnValue(true),
      },
    },
    guild,
    channel,
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
    client: {
      user: {
        id: '1234567890',
        username: 'TestBot',
        discriminator: '1234',
        bot: true,
      },
      users: {
        fetch: jest.fn().mockResolvedValue(user),
      },
      guilds: {
        fetch: jest.fn().mockResolvedValue(guild),
      },
      channels: {
        fetch: jest.fn().mockResolvedValue(channel),
      },
    },
  };

  // Mock the methods that depend on the state
  Object.defineProperty(interaction, 'deferred', { get: () => deferred });
  Object.defineProperty(interaction, 'replied', { get: () => replied });

  return interaction;
}

/**
 * Creates a mock message object
 * @param {Object} options - Options for the mock message
 * @returns {Object} Mock message object
 */
function createMockMessage(options = {}) {
  const {
    content = '',
    author = { id: '1234567890', username: 'testuser', discriminator: '1234', bot: false },
    channel = { id: '5678901234', name: 'test-channel', send: jest.fn().mockResolvedValue({}) },
    guild = { id: '9876543210', name: 'Test Server' },
    member = { user: author, guild },
    mentions = { users: new Map(), members: new Map() },
  } = options;

  return {
    id: '1234567890',
    content,
    author,
    channel,
    guild,
    member,
    mentions,
    reply: jest.fn().mockResolvedValue({}),
    react: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    edit: jest.fn().mockResolvedValue({}),
  };
}

/**
 * Waits for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  createMockInteraction,
  createMockMessage,
  wait,
};
