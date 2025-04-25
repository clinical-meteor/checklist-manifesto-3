// imports/startup/server/accounts-setup.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { get } from 'lodash';

// Configure account creation validation
Accounts.validateNewUser((user) => {
  // Add any custom validation here
  return true;
});

// Configure email verification (optional)
// Accounts.config({
//   sendVerificationEmail: true
// });

// Configure password reset email settings (if needed)
// Accounts.emailTemplates.resetPassword = {
//   from: () => 'Checklist Manifesto <no-reply@example.com>',
//   subject: () => 'Reset Your Password',
//   text: (user, url) => `Click this link to reset your password: ${url}`
// };

// Create admin user at startup if it doesn't exist
export async function ensureAdminUser(username, password) {
  try {
    // Check if admin user exists
    const adminUser = await Meteor.users.findOneAsync({ username });
    
    if (!adminUser) {
      console.log(`Creating user: ${username}`);
      
      // Create the admin user
      const userId = Accounts.createUser({
        username,
        password,
        profile: { role: 'admin' }
      });
      
      console.log(`Created user with ID: ${userId}`);
      return userId;
    } else {
      console.log(`User ${username} already exists`);
      return adminUser._id;
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    throw error;
  }
}

// Define custom authentication methods
Meteor.methods({
  // Method to login manually (fallback if needed)
  'accounts.login'(options) {
    check(options, {
      username: String,
      password: String
    });
    
    const { username, password } = options;
    
    // For security, don't disclose which field was incorrect
    const user = Accounts._findUserByQuery({ username });
    if (!user) {
      throw new Meteor.Error('login-failed', 'Login failed. Please check your credentials.');
    }
    
    // Verify the password
    const result = Accounts._checkPassword(user, password);
    if (result.error) {
      throw new Meteor.Error('login-failed', 'Login failed. Please check your credentials.');
    }
    
    // Create a login token for the client
    const stampedLoginToken = Accounts._generateStampedLoginToken();
    Accounts._insertLoginToken(user._id, stampedLoginToken);
    
    return {
      userId: user._id,
      token: stampedLoginToken.token
    };
  }
});