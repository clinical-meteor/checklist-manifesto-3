// imports/api/tasks/publications.js
import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '../../db/TasksCollection';

// Publish tasks that belong to the current user as either requester or owner
Meteor.publish('tasks.mine', function() {
  if (!this.userId) {
    return this.ready();
  }

  return TasksCollection.find({
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});

// Publish tasks filtered by status
Meteor.publish('tasks.byStatus', function(status) {
  if (!this.userId) {
    return this.ready();
  }

  return TasksCollection.find({
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    status: status,
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});

// Publish tasks filtered by priority
Meteor.publish('tasks.byPriority', function(priority) {
  if (!this.userId) {
    return this.ready();
  }

  return TasksCollection.find({
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    priority: priority,
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});

// Publish a single task by ID
Meteor.publish('tasks.byId', function(taskId) {
  if (!this.userId) {
    return this.ready();
  }

  return TasksCollection.find({
    _id: taskId,
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    isDeleted: { $ne: true }
  });
});

// Publish tasks that are due soon
Meteor.publish('tasks.dueSoon', function(daysAhead = 7) {
  if (!this.userId) {
    return this.ready();
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  return TasksCollection.find({
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    'executionPeriod.end': { $lte: cutoffDate, $gte: new Date() },
    status: { $nin: ['completed', 'cancelled', 'entered-in-error'] },
    isDeleted: { $ne: true }
  }, {
    sort: { 'executionPeriod.end': 1 }
  });
});

Meteor.publish('tasks.protocols', function() {
  if (!this.userId) {
    // For unauthenticated users, only show public protocols
    return TasksCollection.find({
      public: true,
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 }
    });
  }
  
  // For authenticated users, show both public protocols and their own
  return TasksCollection.find({
    $or: [
      { public: true },
      { requester: this.userId }
    ],
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});


// Publish tasks for a specific list
Meteor.publish('tasks.byList', function(listId) {
  check(listId, String);
  
  // Find the list to determine if it's public
  const list = ListsCollection.findOne(listId);
  
  if (!list) {
    return this.ready();
  }
  
  // If list is private, check if current user is the owner
  if (!list.public && (!this.userId || list.userId !== this.userId)) {
    return this.ready();
  }
  
  return TasksCollection.find({
    listId: listId,
    isDeleted: { $ne: true }
  }, {
    sort: { ordinal: 1 }
  });
});