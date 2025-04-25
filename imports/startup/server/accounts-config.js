// imports/startup/server/accounts-config.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { get } from 'lodash';

// Configure account creation validation
Accounts.config({
  sendVerificationEmail: false,
  forbidClientAccountCreation: false
});

// Configure email templates
Accounts.emailTemplates.from = function() {
  // Get from email from settings
  return get(Meteor.settings, 'email.from', 'Checklist Manifesto <no-reply@example.com>');
};

// Configure password reset email settings
Accounts.emailTemplates.resetPassword = {
  subject: function() {
    return 'Reset Your Password - Checklist Manifesto';
  },
  text: function(user, url) {
    return `Hello ${get(user, 'username', 'User')},

To reset your password, simply click the link below:

${url}

If you did not request this password reset, please ignore this email.

Thanks,
The Checklist Manifesto Team`;
  }
};

// Configure email verification email settings
Accounts.emailTemplates.verifyEmail = {
  subject: function() {
    return 'Verify Your Email - Checklist Manifesto';
  },
  text: function(user, url) {
    return `Hello ${get(user, 'username', 'User')},

To verify your email address, simply click the link below:

${url}

If you did not create an account, please ignore this email.

Thanks,
The Checklist Manifesto Team`;
  }
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

// Setup custom account login handlers
export function setupAccountsLoginHandlers() {
  // This is only needed if you want to override Meteor's default login handlers
  // Usually you don't need to call this as Meteor's accounts-password already sets up handlers
}

// Define custom authentication methods if needed
Meteor.methods({
  // Method to get current user profile
  'user.getProfile': function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    return Meteor.users.findOne(
      { _id: this.userId },
      { 
        fields: { 
          username: 1, 
          emails: 1, 
          profile: 1,
          createdAt: 1
        }
      }
    );
  },
  
  // Method to update user profile
  'user.updateProfile': function(profileData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    // Validate profile data if needed
    
    return Meteor.users.update(
      { _id: this.userId },
      { $set: { 'profile': profileData }}
    );
  },
  
  // Method to send password reset email
  'user.sendResetPasswordEmail': function(email) {
    // For security, we don't reveal if the email exists
    try {
      const user = Accounts.findUserByEmail(email);
      if (user) {
        Accounts.sendResetPasswordEmail(user._id);
      }
      return { success: true };
    } catch (error) {
      console.error('Error sending reset password email:', error);
      // Still return success for security
      return { success: true };
    }
  }
});

// Set up user publications
if (Meteor.isServer) {
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
          emails: 1,
          profile: 1
        } 
      }
    );
  });
}