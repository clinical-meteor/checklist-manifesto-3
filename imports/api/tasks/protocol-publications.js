// imports/api/tasks/protocol-publications.js
import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '../../db/TasksCollection';

/**
 * Publish all public protocols and those owned by the current user
 */
Meteor.publish('protocols.all', function() {
  if (!this.userId) {
    // Only public protocols for anonymous users
    return TasksCollection.find({
      isProtocol: true,
      public: true,
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 }
    });
  }
  
  // Public protocols and user's own protocols for logged in users
  return TasksCollection.find({
    isProtocol: true,
    $or: [
      { public: true },
      { requester: this.userId }
    ],
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});

/**
 * Publish a single protocol by ID with its subtasks
 */
Meteor.publish('protocols.single', function(protocolId) {
  check(protocolId, String);
  
  const protocol = TasksCollection.findOne({
    _id: protocolId,
    isProtocol: true,
    isDeleted: { $ne: true }
  });
  
  if (!protocol) {
    return this.ready();
  }
  
  // Check if user is authorized to see this protocol
  if (!protocol.public && (!this.userId || protocol.requester !== this.userId)) {
    return this.ready();
  }
  
  // Return both the protocol and its subtasks
  return [
    TasksCollection.find({
      _id: protocolId,
      isProtocol: true,
      isDeleted: { $ne: true }
    }),
    TasksCollection.find({
      partOf: { reference: `Task/${protocolId}` },
      isDeleted: { $ne: true }
    }, {
      sort: { ordinal: 1 }
    })
  ];
});

/**
 * Publish protocols created by a specific user
 */
Meteor.publish('protocols.byUser', function(userId) {
  check(userId, String);
  
  // If requesting user is not the target user, only show public protocols
  if (!this.userId || this.userId !== userId) {
    return TasksCollection.find({
      isProtocol: true,
      requester: userId,
      public: true,
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 }
    });
  }
  
  // For the user's own protocols, show all (public and private)
  return TasksCollection.find({
    isProtocol: true,
    requester: userId,
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});

/**
 * Publish protocols filtered by status
 */
Meteor.publish('protocols.byStatus', function(status) {
  check(status, String);
  
  if (!this.userId) {
    // Only public protocols for anonymous users
    return TasksCollection.find({
      isProtocol: true,
      public: true,
      status: status,
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 }
    });
  }
  
  // Public protocols and user's own protocols for logged in users
  return TasksCollection.find({
    isProtocol: true,
    status: status,
    $or: [
      { public: true },
      { requester: this.userId }
    ],
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});

/**
 * Publish recently updated protocols
 */
Meteor.publish('protocols.recent', function(limit = 10) {
  check(limit, Number);
  
  if (!this.userId) {
    // Only public protocols for anonymous users
    return TasksCollection.find({
      isProtocol: true,
      public: true,
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 },
      limit: limit
    });
  }
  
  // Public protocols and user's own protocols for logged in users
  return TasksCollection.find({
    isProtocol: true,
    $or: [
      { public: true },
      { requester: this.userId }
    ],
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 },
    limit: limit
  });
});