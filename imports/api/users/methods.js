// imports/api/users/methods.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

Meteor.methods({
  async 'user.create'(options) {
    check(options, {
      username: String,
      password: String,
      profile: Match.Maybe(Object)
    });

    // Check if username already exists
    const existingUser = await Meteor.users.findOneAsync({ username: options.username });
    
    if (existingUser) {
      throw new Meteor.Error('username-exists', 'Username already exists');
    }

    // Create the user
    try {
      const userId = await new Promise((resolve, reject) => {
        Accounts.createUser({
          username: options.username,
          password: options.password,
          profile: options.profile || {}
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      return userId;
    } catch (error) {
      throw new Meteor.Error('user-creation-failed', get(error, 'reason', 'Failed to create user'));
    }
  },

  async 'user.update'(userId, options) {
    check(userId, String);
    check(options, {
      profile: Match.Maybe(Object)
    });

    // Only allow users to update their own profiles
    if (!this.userId || this.userId !== userId) {
      throw new Meteor.Error('not-authorized', 'You are not authorized to update this user profile');
    }

    try {
      // Update user profile
      if (options.profile) {
        await Meteor.users.updateAsync(
          { _id: userId },
          { $set: { 'profile': options.profile } }
        );
      }
      
      return true;
    } catch (error) {
      throw new Meteor.Error('profile-update-failed', get(error, 'reason', 'Failed to update profile'));
    }
  },

  async 'user.changePassword'(oldPassword, newPassword) {
    check(oldPassword, String);
    check(newPassword, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to change your password');
    }

    if (newPassword.length < 6) {
      throw new Meteor.Error('invalid-password', 'Password must be at least 6 characters');
    }

    try {
      await Accounts.changePasswordAsync(oldPassword, newPassword);
      return true;
    } catch (error) {
      throw new Meteor.Error('password-change-failed', get(error, 'reason', 'Failed to change password'));
    }
  }
});

// Add user publication if needed
if (Meteor.isServer) {
  Meteor.publish('userData', function() {
    if (!this.userId) {
      return this.ready();
    }
    
    return Meteor.users.find(
      { _id: this.userId },
      { fields: { username: 1, profile: 1 } }
    );
  });
}