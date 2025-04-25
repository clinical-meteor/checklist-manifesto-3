// server/main.js
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { TasksCollection } from '/imports/db/TasksCollection';
import moment from 'moment';
import { loadEnvironmentSettings } from './settings';
import { ensureAdminUser, setupAccountsLoginHandlers } from './accounts-patch';

// Import methods and publications
import '/imports/api/tasks/methods';
import '/imports/api/tasks/publications';
import '/imports/api/users/methods';
import '/imports/api/users/publications';
import '/imports/api/users/login-method';

// Function to create seed tasks
async function insertTask(description, userId, options = {}) {
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
  
  // Set up accounts login handlers
  setupAccountsLoginHandlers();
  
  // Create admin user
  const SEED_USERNAME = Meteor.settings.seedUsername || 'admin';
  const SEED_PASSWORD = Meteor.settings.seedPassword || 'password';
  
  try {
    // Create or ensure the admin user exists
    const userId = await ensureAdminUser(SEED_USERNAME, SEED_PASSWORD);
    
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
  } catch (error) {
    console.error('Error during startup:', error);
  }

  console.log('Server started successfully.');
});