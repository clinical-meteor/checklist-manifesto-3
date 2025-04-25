// imports/api/users/publications.js
import { Meteor } from 'meteor/meteor';

// Publish the current user's data
Meteor.publish('userData', function() {
  if (!this.userId) {
    return this.ready();
  }
  
  return Meteor.users.find(
    { _id: this.userId },
    { 
      fields: { 
        username: 1,
        profile: 1
      } 
    }
  );
});