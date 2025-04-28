// imports/api/lists/publications.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ListsCollection } from '../../db/ListsCollection';

/**
 * Publish lists based on user authentication status
 * - For anonymous users: only public lists
 * - For logged in users: public lists and their own lists
 */
Meteor.publish('lists.all', function() {
  if (!this.userId) {
    // For unauthenticated users, only show public lists
    return ListsCollection.find({
      public: true,
      isDeleted: { $ne: true }
    }, {
      fields: {
        title: 1,
        name: 1, // For backward compatibility
        description: 1,
        incompleteCount: 1,
        public: 1,
        status: 1,
        createdAt: 1,
        lastModified: 1,
        userId: 1
      },
      sort: { lastModified: -1 }
    });
  }
  
  // For authenticated users, show both public lists and their own lists
  return ListsCollection.find({
    $or: [
      { public: true },
      { userId: this.userId }
    ],
    isDeleted: { $ne: true }
  }, {
    fields: {
      title: 1,
      name: 1, // For backward compatibility
      description: 1,
      incompleteCount: 1,
      public: 1,
      status: 1,
      createdAt: 1,
      lastModified: 1,
      userId: 1
    },
    sort: { lastModified: -1 }
  });
});

/**
 * Publish a single list by ID
 */
Meteor.publish('lists.byId', function(listId) {
  check(listId, String);
  
  console.log(`Publishing list with ID: ${listId}`);
  
  // Find the list
  const list = ListsCollection.findOneAsync({
    _id: listId,
    isDeleted: { $ne: true }
  });
  
  if (!list) {
    console.log(`List not found with ID: ${listId}`);
    return this.ready();
  }
  
  // If list is private, check if current user is the owner
  if (!list.public && (!this.userId || list.userId !== this.userId)) {
    console.log(`Access denied to private list ${listId} for user ${this.userId || 'anonymous'}`);
    return this.ready();
  }
  
  console.log(`Publishing list "${list.title || list.name}" to user ${this.userId || 'anonymous'}`);
  
  return ListsCollection.find({
    _id: listId,
    isDeleted: { $ne: true }
  });
});

/**
 * Publish lists created by a specific user
 */
Meteor.publish('lists.byUser', function(userId) {
  check(userId, String);
  
  // If requesting user is not the target user, only show public lists
  if (!this.userId || this.userId !== userId) {
    return ListsCollection.find({
      userId: userId,
      public: true,
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 }
    });
  }
  
  // For the user's own lists, show all (public and private)
  return ListsCollection.find({
    userId: userId,
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});

/**
 * Publish recently updated lists
 */
Meteor.publish('lists.recent', function(limit = 10) {
  check(limit, Number);
  
  if (!this.userId) {
    // Only public lists for anonymous users
    return ListsCollection.find({
      public: true,
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 },
      limit: limit
    });
  }
  
  // Public lists and user's own lists for logged in users
  return ListsCollection.find({
    $or: [
      { public: true },
      { userId: this.userId }
    ],
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 },
    limit: limit
  });
});