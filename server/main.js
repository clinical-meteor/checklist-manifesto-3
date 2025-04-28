// server/main.js
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { TasksCollection } from '/imports/db/TasksCollection';
import moment from 'moment';
import { loadEnvironmentSettings, getSetting } from './settings';
import { ensureAdminUser } from '/imports/startup/server/accounts-config';

// Import methods and publications
import '/imports/api/tasks/methods';
import '/imports/api/tasks/publications';
import '/imports/api/tasks/protocol-methods.js';
import '/imports/api/tasks/protocol-publications.js';

import '/imports/api/users/methods';
import '/imports/api/users/publications';

import '/imports/api/lists/methods';
import '/imports/api/lists/publications';

// Import the sample data methods

// import { initializeSampleData } from './sample-data-methods';

import '/server/integration';

// We'll define the checkFirstRun function here to avoid the import issue
async function checkFirstRun() {
  try {
    // Count users in the system
    const userCount = await Meteor.users.countDocuments({});
    const isFirstRun = userCount === 0;
    
    // Store the first-run status in settings for reference elsewhere
    Meteor.settings.isFirstRun = isFirstRun;
    
    if (isFirstRun) {
      console.log('First run detected - no users in the system.');
    }
    
    return isFirstRun;
  } catch (error) {
    console.error('Error checking for first run:', error);
    return false;
  }
}

// server/main.js - Add this function or fix existing one
async function initializeDefaultProtocols() {
  try {
    // Check if we need to load default protocols based on settings
    const shouldLoadProtocols = getSetting('loadDefaultProtocols', true);
    
    if (shouldLoadProtocols) {
      console.log('Checking if default protocols need to be created...');
      
      // Find an admin user or any user to be the creator of protocols
      const adminUser = await Meteor.users.findOneAsync({ 'profile.role': 'admin' });
      let userId = adminUser ? adminUser._id : null;
      
      if (!userId) {
        // If no admin, use any available user
        const anyUser = await Meteor.users.findOneAsync();
        userId = anyUser ? anyUser._id : null;
      }
      
      // Count existing protocols
      const protocolCount = await TasksCollection.countDocumentsAsync({ 
        isProtocol: true,
        public: true
      });
      
      if (protocolCount === 0 && userId) {
        console.log('No protocols found, initializing default protocols...');
        // Import the utility function and create protocols
        const { initializeProtocols } = await import('/imports/utils/DefaultProtocols');
        await initializeProtocols(userId, true); // Force creation with the second parameter
        console.log('Default protocols initialized successfully');
      } else {
        console.log(`Found ${protocolCount} existing protocols, skipping initialization`);
      }
    }
  } catch (error) {
    console.error('Error initializing default protocols:', error);
  }
}


// Function to create seed tasks (unchanged)
async function insertTask(description, userId, options = {}) {
  // Existing implementation remains the same
  const task = {
    resourceType: 'Task',
    status: get(options, 'status', 'requested'),
    description: description,
    authoredOn: new Date(),
    lastModified: new Date(),
    requester: userId,
    isDeleted: false
  };

  if (options.priority) {
    task.priority = options.priority;
  }

  if (options.dueDate) {
    task.executionPeriod = {
      end: options.dueDate
    };
  }

  if (options.owner) {
    task.owner = options.owner;
  }

  try {
    return await TasksCollection.insertAsync(task);
  } catch (error) {
    console.error('Error inserting task:', error);
    throw error;
  }
}

Meteor.startup(async function() {
  // Load settings from environment variables
  loadEnvironmentSettings();
  
  // Check if this is the first run
  const isFirstRun = await checkFirstRun();
  
  // Create admin user only if configured or this is first run
  const SEED_USERNAME = Meteor.settings.seedUsername || 'admin';
  const SEED_PASSWORD = Meteor.settings.seedPassword || 'password';
  
  try {
    let userId = null;
    
    // Only create the default admin if we're not in first-run mode or if explicitly configured
    if (!isFirstRun || getSetting('alwaysCreateAdmin', false)) {
      // Create or ensure the admin user exists
      userId = await ensureAdminUser(SEED_USERNAME, SEED_PASSWORD);
      console.log('Default admin user is available.');
    } else {
      console.log('First-run detected. Skipping default admin creation - waiting for user registration.');
    }
    
    // The rest of the startup code (seed tasks) should only run if we have a user
    // and we're not in first-run mode (or we're explicitly configured to seed)
    if (userId && (!isFirstRun || getSetting('alwaysSeedTasks', false))) {
      // Check if we need to create seed tasks
      let shouldCreateSeedTasks = false;
      try {
        const existingTask = await TasksCollection.findOneAsync({});
        shouldCreateSeedTasks = !existingTask;
      } catch (error) {
        console.error('Error checking for existing tasks:', error);
      }

      if (shouldCreateSeedTasks && userId) {
        console.log('Creating seed tasks...');

        const today = new Date();
        const tomorrow = moment(today).add(1, 'days').toDate();
        const nextWeek = moment(today).add(7, 'days').toDate();

        await insertTask('Complete project documentation', userId, {
          priority: 'routine',
          dueDate: tomorrow,
          status: 'in-progress'
        });

        await insertTask('Review pull requests', userId, {
          priority: 'urgent',
          dueDate: today,
          status: 'requested'
        });

        await insertTask('Deploy application to production', userId, {
          priority: 'asap',
          dueDate: nextWeek,
          status: 'draft'
        });

        await insertTask('Schedule team meeting', userId, {
          priority: 'routine',
          dueDate: tomorrow,
          status: 'completed'
        });

        await insertTask('Prepare monthly report', userId, {
          priority: 'routine',
          dueDate: nextWeek,
          status: 'requested'
        });

        console.log('Seed tasks created successfully.');
      }
      
      // // Initialize sample data if enabled in settings
      // if (getSetting('createSampleData', false)) {
      //   initializeSampleData();
      // }
    }
  } catch (error) {
    console.error('Error during startup:', error);
  }

  console.log('Server started successfully.');
});