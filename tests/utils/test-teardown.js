module.exports = async () => {
  // Clean up any test databases or resources
  const fs = require('fs');
  const path = require('path');
  
  const testDbPath = path.join(__dirname, '../../database/test-tarot.db');
  
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      console.log('Test database cleaned up');
    } catch (err) {
      console.error('Error cleaning up test database:', err);
    }
  }
  
  // Close any open database connections
  const { getDatabase } = require('../../src/database/DatabaseManager');
  const db = getDatabase();
  
  if (db && typeof db.close === 'function') {
    await db.close();
  }
  
  console.log('Test teardown complete');
};
