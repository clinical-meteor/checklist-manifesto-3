// server/integration.js
import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '/imports/db/TasksCollection';
import { loadEnvironmentSettings, getSetting } from './settings';

/**
 * Handle server-side integration of protocols and initial data loading
 */
export async function initializeServer() {
  console.log('Starting server initialization...');
  
  // Load environment variables into settings
  loadEnvironmentSettings();
  
  // Initialize schema indexes
  await createIndexes();
  
  // Check if we need to load default protocols
  const shouldLoadProtocols = getSetting('loadDefaultProtocols', true);
  
  if (shouldLoadProtocols) {
    // Find an admin user to be the creator of default protocols
    const adminUser = await findOrCreateAdminUser();
    
    // Load default protocols
    try {
      // Dynamically import the protocols module
      const { initializeProtocols } = await import('/imports/utils/DefaultProtocols');
      
      // Initialize protocols with the admin user ID
      await initializeProtocols(adminUser?._id);
      
      console.log('Protocol initialization completed');
    } catch (error) {
      console.error('Error initializing protocols:', error);
    }
  }
  
  console.log('Server initialization complete.');
}

/**
 * Create necessary database indexes
 */
async function createIndexes() {
  try {
    // Create indexes for efficient queries
    await TasksCollection.createIndexAsync({ requester: 1 });
    await TasksCollection.createIndexAsync({ owner: 1 });
    await TasksCollection.createIndexAsync({ status: 1 });
    await TasksCollection.createIndexAsync({ isDeleted: 1 });
    await TasksCollection.createIndexAsync({ priority: 1 });
    await TasksCollection.createIndexAsync({ public: 1 });
    await TasksCollection.createIndexAsync({ isProtocol: 1 });
    await TasksCollection.createIndexAsync({ 'executionPeriod.end': 1 });
    await TasksCollection.createIndexAsync({ 'partOf.reference': 1 });
    
    console.log('Database indexes created successfully.');
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
}

/**
 * Find an admin user or create one if none exists
 * @returns {Object|null} Admin user or null if not found/created
 */
async function findOrCreateAdminUser() {
  try {
    // Look for an existing admin user
    const adminUser = await Meteor.users.findOneAsync({ 'profile.role': 'admin' });
    
    if (adminUser) {
      console.log('Found existing admin user.');
      return adminUser;
    }
    
    // Check if we should create an admin user
    const shouldCreateAdmin = getSetting('createAdminUser', false);
    
    if (!shouldCreateAdmin) {
      console.log('No admin user found and creation not enabled. Using system user for protocols.');
      return null;
    }
    
    // Get admin credentials from settings
    const username = getSetting('adminUsername', 'admin');
    const password = getSetting('adminPassword', 'password');
    
    if (!username || !password) {
      console.warn('Admin credentials not provided. Skipping admin user creation.');
      return null;
    }
    
    // Create the admin user
    const userId = await Meteor.callAsync('user.create', {
      username,
      password,
      profile: { role: 'admin' }
    });
    
    if (userId) {
      console.log(`Created admin user: ${username}`);
      return await Meteor.users.findOneAsync(userId);
    }
    
    return null;
  } catch (error) {
    console.error('Error finding/creating admin user:', error);
    return null;
  }
}

/**
 * Start the server initialization when Meteor starts
 */
Meteor.startup(async function() {
  await initializeServer();
});