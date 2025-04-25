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