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
    }
  } catch (error) {
    console.error('Error during startup:', error);
  }

  console.log('Server started successfully.');
});