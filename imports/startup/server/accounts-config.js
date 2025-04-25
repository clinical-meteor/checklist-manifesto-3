// imports/startup/server/accounts-config.js
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';

// Import accounts-js packages
import AccountsServer from '@accounts/server';
import AccountsPassword from '@accounts/password';
import MongoDBInterface from '@accounts/mongo';

// Create a MongoDB interface for accounts-js using Meteor's MongoDB connection
export function setupAccountsJs() {
  // Get MongoDB connection from Meteor
  const db = Mongo.Collection.prototype.rawDatabase();
  
  // Create MongoDB interface for accounts-js
  const mongoDbInterface = new MongoDBInterface(db);
  
  // Create password service
  const passwordService = new AccountsPassword({
    // Configure password service
    requireEmailVerification: false,
    validatePassword: function(password) {
      // Minimum password validation - can be expanded
      return password.length >= 6;
    }
  });
  
  // Create the accounts server
  const accountsServer = new AccountsServer(
    {
      // Server options
      tokenSecret: get(Meteor.settings, 'accounts.tokenSecret', 'secret-token-for-dev'),
      // How long tokens are valid
      tokenConfigs: {
        accessToken: { expiresIn: '1d' },
        refreshToken: { expiresIn: '7d' },
      },
      // Email settings
      emailTemplates: {
        from: get(Meteor.settings, 'accounts.emailFrom', 'no-reply@checklistmanifesto.com'),
      },
      // Optionally enable auto-login after registration
      enableAutologin: true,
    },
    {
      // Authentication services
      password: passwordService,
    },
    // Database interface
    mongoDbInterface
  );
  
  console.log('Accounts-js server initialized successfully');
  
  return {
    accountsServer,
    passwordService
  };
}

// Setup REST API endpoints
export function setupAccountsEndpoints(app) {
  if (!app) {
    console.warn('Express app not provided, skipping accounts REST endpoints setup');
    return;
  }
  
  // Create an Express.js compatible endpoints
  const { accountsServer, passwordService } = setupAccountsJs();
  
  // Import endpoint handlers from accounts-password
  const { resetPassword, verifyEmail } = require('@accounts/password/lib/endpoints');
  
  // Setup endpoints
  app.post('/accounts/reset-password/:token', resetPassword(passwordService));
  app.get('/accounts/verify-email/:token', verifyEmail(passwordService));
  
  console.log('Accounts-js REST endpoints initialized');
}

// Export the initialized services
export const { accountsServer, passwordService } = setupAccountsJs();