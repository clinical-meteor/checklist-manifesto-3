// imports/api/users/publications.js
import { Meteor } from 'meteor/meteor';
import { accountsServer } from '../../startup/server/accounts-config';

// Publish the current user's data
Meteor.publish('userData', function() {
  if (!this.userId) {
    return this.ready();
  }
  
  // Use the accounts-js userId
  const userId = this.userId;
  
  // Create a MongoDB cursor for reactive data
  const userCursor = Meteor.users.find(
    { _id: userId },
    { 
      fields: { 
        username: 1,
        profile: 1,
        emails: 1
      } 
    }
  );
  
  return userCursor;
});

// Publish users for task assignment
Meteor.publish('users.forAssignment', function() {
  if (!this.userId) {
    return this.ready();
  }
  
  // Only publish minimal user information needed for task assignment
  return Meteor.users.find(
    {},
    { 
      fields: { 
        username: 1,
        'profile.name': 1
      } 
    }
  );
});