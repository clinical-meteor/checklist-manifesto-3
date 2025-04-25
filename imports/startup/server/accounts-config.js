// imports/startup/server/accounts-config.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { get } from 'lodash';

// Configure account creation and login behavior
Accounts.config({
  sendVerificationEmail: false,
  forbidClientAccountCreation: false
});

// Configure email verification (optional)
Accounts.emailTemplates.from = Meteor.settings.email?.from || 'Checklist Manifesto <no-reply@example.com>';

// Configure password reset email settings
Accounts.emailTemplates.resetPassword = {
  subject: () => 'Reset Your Password - Checklist Manifesto',
  text: (user, url) => `Hello ${user.username || user.emails[0].address},

To reset your password, simply click the link below:

${url}

If you did not request this password reset, please ignore this email.

Thanks,
The Checklist Manifesto Team`
};

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

// Setup account login handlers
export function setupAccountsLoginHandlers() {
  // Register login handler if needed
  // This is optional as Meteor's accounts-password already handles this
  Accounts.registerLoginHandler('checklist-custom', function(options) {
    // Custom login logic if needed
    return undefined; // Let other handlers handle it
  });
}

// Define custom authentication methods
Meteor.methods({
  // Method to get current user data
  'user.getProfile'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    return Meteor.users.findOne(
      { _id: this.userId },
      { fields: { 
        username: 1, 
        emails: 1, 
        profile: 1,
        createdAt: 1
      }}
    );
  },
  
  // Update user profile
  'user.updateProfile'(profileData) {
    check(profileData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    return Meteor.users.update(
      { _id: this.userId },
      { $set: { 'profile': profileData }}
    );
  }
});