const { createApiKey } = require('./src/services/databaseService');
require('dotenv').config();

// Create default API keys on startup
function initializeDatabase() {
  console.log('Initializing database with default API keys...');
  
  // Create frontend API key
  const frontendKey = process.env.FRONTEND_API_KEY || 'frontend-api-key-456';
  const frontendCreated = createApiKey('frontend', frontendKey);
  
  if (frontendCreated) {
    console.log('✓ Frontend API key created');
  } else {
    console.log('⚠ Frontend API key already exists or failed to create');
  }
  
  // Create admin API key  
  const adminKey = process.env.ADMIN_KEY || 'admin-secret-key-123';
  const adminCreated = createApiKey('admin', adminKey);
  
  if (adminCreated) {
    console.log('✓ Admin API key created');
  } else {
    console.log('⚠ Admin API key already exists or failed to create');
  }
  
  console.log('Database initialization complete');
}

// Run initialization if this script is called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
