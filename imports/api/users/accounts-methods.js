// imports/api/users/accounts-methods.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

Meteor.methods({
  // Create a new user
  'user.create'(options) {
    check(options, {
      username: Match.Maybe(String),
      email: Match.Maybe(String),
      password: String,
      profile: Match.Maybe(Object)
    });

    // Validate that either username or email is provided
    if (!options.username && !options.email) {
      throw new Meteor.Error('validation-error', 'Username or email is required');
    }

    try {
      // Call the core Accounts API
      const userId = Accounts.createUser({
        username: options.username,
        email: options.email,
        password: options.password,
        profile: options.profile || {}
      });
      
      return { userId };
    } catch (error) {
      throw new Meteor.Error('create-user-error', error.message || 'Failed to create user');
    }
  },
  
  // Change password
  'user.changePassword'(oldPassword, newPassword) {
    check(oldPassword, String);
    check(newPassword, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to change your password');
    }

    try {
      Accounts.changePassword(oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      throw new Meteor.Error('change-password-error', error.reason || 'Failed to change password');
    }
  },
  
  // Send reset password email
  'user.sendResetPasswordEmail'(email) {
    check(email, String);

    try {
      const result = Accounts.findUserByEmail(email);
      if (result) {
        Accounts.sendResetPasswordEmail(result._id);
      }
      // Always return success for security (even if email not found)
      return { success: true };
    } catch (error) {
      // Still return success for security
      return { success: true };
    }
  }
});