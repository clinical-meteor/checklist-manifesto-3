// imports/startup/server/accounts-config.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { MongoInternals } from 'meteor/mongo';
import { AccountsServer } from '@accounts/server';
import AccountsPassword from '@accounts/password';
import { Mongo as AccountsMongo } from '@accounts/mongo';
import { wrapMeteorServer } from '@accounts/meteor-adapter';

// Get MongoDB connection from Meteor's MongoInternals
const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;

// Initialize AccountsMongo to work with Meteor's MongoDB connection
const accountsMongo = new AccountsMongo(db, {
  // Use Meteor's existing collection names
  collectionName: 'users',
  sessionCollectionName: 'meteor_accounts_sessions',
  // Don't convert IDs to MongoDB ObjectID since Meteor typically uses string IDs
  convertUserIdToMongoObjectId: false,
  convertSessionIdToMongoObjectId: false,
});

// Initialize accounts-password package
const accountsPassword = new AccountsPassword({
  // Uncomment this if you want to require email verification
  // requireEmailVerification: true,
  // Configure password validation logic if needed
  validatePassword: (password) => {
    // You can add custom password validation
    return password.length >= 6;
  }
});

// Configure and initialize AccountsServer
export const accountsServer = new AccountsServer(
  {
    // Server options
    tokenSecret: Meteor.settings.accounts?.tokenSecret || 'your-super-secret-token-secret',
    // Allow easy login for demo purposes - you would set to false in a production environment
    ambiguousErrorMessages: false, 
    // Configure email templates (uses Meteor's email package under the hood)
    sendMail: async (mail) => {
      // In a real app, configure this to send emails
      console.log('Email to be sent:', mail);
      // Using Meteor's email package
      if (Meteor.settings.mail?.enabled) {
        try {
          const { Email } = require('meteor/email');
          const { to, from, subject, text, html } = mail;
          Email.send({ to, from, subject, text, html });
        } catch (error) {
          console.error('Failed to send email:', error);
        }
      }
    },
    // URL for email links
    siteUrl: Meteor.settings.ROOT_URL || 'http://localhost:3000',
  },
  // Authentication services
  {
    password: accountsPassword,
  },
  // Database adapter
  accountsMongo
);

// Setup database indexes
Meteor.startup(async () => {
  try {
    await accountsMongo.setupIndexes();
    console.log('Accounts-js indexes created successfully');
  } catch (error) {
    console.error('Error creating accounts-js indexes:', error);
  }
});

// Create server validator
const ServerValidator = {
  validateToken: async (accessToken, context) => {
    // Validate the token using accounts-js
    try {
      const user = await accountsServer.resumeSession(accessToken);
      return user;
    } catch (error) {
      console.error('Error validating token:', error);
      throw error;
    }
  }
};

// Integrate with Meteor's accounts system
wrapMeteorServer(Meteor, Accounts, ServerValidator);

// Ensure an admin user exists at startup
export async function ensureAdminUser(username, password) {
  try {
    // Check if admin user exists
    const adminUser = await accountsMongo.findUserByUsername(username);
    
    if (!adminUser) {
      console.log(`Creating user: ${username}`);
      
      // Create the user via accounts-js
      const userId = await accountsPassword.createUser({
        username,
        password,
        profile: { role: 'admin' }
      });
      
      console.log(`Created user with ID: ${userId}`);
      return userId;
    } else {
      console.log(`User ${username} already exists`);
      return adminUser.id;
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    throw error;
  }
}