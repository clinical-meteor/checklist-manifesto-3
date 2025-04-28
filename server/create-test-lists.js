// server/create-test-lists.js
// Script to create test lists for development
// Import this file in server/main.js to run it on startup

import { Meteor } from 'meteor/meteor';
import { ListsCollection } from '../imports/db/ListsCollection';
import { TasksCollection } from '../imports/db/TasksCollection';

export function createTestLists() {
  // Only run in development mode
  if (Meteor.isProduction) {
    console.log('Not creating test lists in production mode');
    return;
  }
  
  console.log('Checking if test lists need to be created...');
  
  // Check if we already have lists
  const listCount = ListsCollection.find().countAsync();
  if (listCount > 0) {
    console.log(`Found ${listCount} existing lists, skipping test data creation`);
    return;
  }
  
  // Find an admin user to be the creator
  const adminUser = Meteor.users.findOneAsync({ 'profile.role': 'admin' });
  if (!adminUser) {
    console.log('No admin user found to use as list creator, using first user');
    const anyUser = Meteor.users.findOneAsync();
    if (!anyUser) {
      console.log('No users found, cannot create test lists');
      return;
    }
    createListsForUser(anyUser._id);
  } else {
    createListsForUser(adminUser._id);
  }
}

function createListsForUser(userId) {
  console.log(`Creating test lists for user ${userId}...`);
  
  // Define some test lists
  const testLists = [
    {
      title: 'Shopping List',
      description: 'Things to buy at the store',
      public: true,
      tasks: [
        { description: 'Milk', priority: 'routine' },
        { description: 'Bread', priority: 'routine' },
        { description: 'Eggs', priority: 'routine' },
        { description: 'Apples', priority: 'routine', status: 'completed' }
      ]
    },
    {
      title: 'Work Tasks',
      description: 'Things to do at the office',
      public: false,
      tasks: [
        { description: 'Finish report', priority: 'urgent' },
        { description: 'Email client', priority: 'asap' },
        { description: 'Schedule meeting', priority: 'routine' }
      ]
    },
    {
      title: 'Home Projects',
      description: 'Things to do around the house',
      public: true,
      tasks: [
        { description: 'Fix leaky faucet', priority: 'urgent' },
        { description: 'Mow the lawn', priority: 'routine' },
        { description: 'Clean gutters', priority: 'routine' },
        { description: 'Paint bedroom', priority: 'routine' }
      ]
    }
  ];
  
  // Create each list and its tasks
  testLists.forEach(list => {
    // Create the list
    const listId = ListsCollection.insertAsync({
      resourceType: 'List',
      status: 'active',
      mode: 'working',
      title: list.title,
      name: list.title, // For backward compatibility
      description: list.description,
      incompleteCount: list.tasks.filter(t => t.status !== 'completed').length,
      public: list.public,
      createdAt: new Date(),
      lastModified: new Date(),
      userId: userId,
      isDeleted: false
    });
    
    console.log(`Created list: ${list.title} (${listId})`);
    
    // Create the tasks for this list
    list.tasks.forEach((task, index) => {
      const taskId = TasksCollection.insertAsync({
        resourceType: 'Task',
        status: task.status || 'requested',
        description: task.description,
        priority: task.priority || 'routine',
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: userId,
        listId: listId,
        isDeleted: false,
        ordinal: index
      });
      
      console.log(`Created task: ${task.description} (${taskId})`);
    });
  });
  
  console.log('Finished creating test lists');
}

// If this is running in a server environment, execute on startup
if (Meteor.isServer) {
  Meteor.startup(() => {
    // Check if we should create test data based on environment variable or settings
    if (Meteor.settings.createTestLists) {
      createTestLists();
    }
  });
}