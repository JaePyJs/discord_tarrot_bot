// Load environment variables
require('dotenv').config({ path: '.env.test' });

// Mock Discord.js
jest.mock('discord.js', () => {
  const original = jest.requireActual('discord.js');
  
  return {
    ...original,
    Client: jest.fn().mockImplementation(() => ({
      login: jest.fn().mockResolvedValue('Logged in'),
      on: jest.fn(),
      user: {
        tag: 'TestBot#1234',
        setPresence: jest.fn(),
      },
      guilds: {
        cache: new Map(),
      },
    })),
  };
});

// Mock other modules as needed
jest.mock('../src/database/DatabaseManager');

module.exports = async () => {
  // Any global test setup can go here
  console.log('Test setup complete');
};
