// imports/startup/client/accounts-config.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { AccountsClient } from '@accounts/client';
import { AccountsClientPassword } from '@accounts/client-password';
import { wrapMeteorClient } from '@accounts/meteor-adapter';

// Create a client-side transport that communicates with the Meteor server
const accountsTransport = {
  // Create a new user
  async createUser(user) {
    return new Promise((resolve, reject) => {
      Meteor.call('create-user', user, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Login with a service (e.g. password)
  async loginWithService(service, credentials) {
    return new Promise((resolve, reject) => {
      Meteor.call(`login-with-${service}`, credentials, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Authenticate with a service
  async authenticateWithService(service, credentials) {
    return new Promise((resolve, reject) => {
      Meteor.call(`verify-${service}-credentials`, credentials, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Logout the current user
  async logout() {
    return new Promise((resolve, reject) => {
      Meteor.call('logout', (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Refresh authentication tokens
  async refreshTokens(accessToken, refreshToken) {
    return new Promise((resolve, reject) => {
      Meteor.call('refresh-tokens', { accessToken, refreshToken }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Send reset password email
  async sendResetPasswordEmail(email) {
    return new Promise((resolve, reject) => {
      Meteor.call('send-reset-password-email', { email }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Reset password with token
  async resetPassword(token, newPassword) {
    return new Promise((resolve, reject) => {
      Meteor.call('reset-password', { token, newPassword }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Get the current user
  async getUser() {
    return new Promise((resolve, reject) => {
      Meteor.call('get-user', (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  // Other methods required by AccountsClient interface
  sendVerificationEmail: async (email) => {
    return new Promise((resolve, reject) => {
      Meteor.call('send-verification-email', { email }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
  
  verifyEmail: async (token) => {
    return new Promise((resolve, reject) => {
      Meteor.call('verify-email', { token }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
  
  addEmail: async (newEmail) => {
    return new Promise((resolve, reject) => {
      Meteor.call('add-email', { newEmail }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
  
  changePassword: async (oldPassword, newPassword) => {
    return new Promise((resolve, reject) => {
      Meteor.call('change-password', { oldPassword, newPassword }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
  
  impersonate: async (token, impersonated) => {
    return new Promise((resolve, reject) => {
      Meteor.call('impersonate', { token, impersonated }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
  
  requestMagicLinkEmail: async (email) => {
    return new Promise((resolve, reject) => {
      Meteor.call('request-magic-link', { email }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
};

// Create the accounts client instance
export const accountsClient = new AccountsClient({}, accountsTransport);

// Initialize the password client
export const accountsPassword = new AccountsClientPassword(accountsClient);

// Wrap the Meteor client to use accounts-js
wrapMeteorClient(Meteor, Accounts, accountsClient);

// Export a helper method to check login status
export const isLoggedIn = () => {
  return new Promise((resolve) => {
    accountsClient.getTokens()
      .then(tokens => resolve(!!tokens))
      .catch(() => resolve(false));
  });
};

// Export a helper method to get the current user
export const getUser = async () => {
  try {
    // First check if we have valid tokens
    const tokens = await accountsClient.getTokens();
    if (!tokens) return null;
    
    // Try to refresh the session if needed
    await accountsClient.refreshSession();
    
    // Get the user information
    return await accountsClient.getUser();
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Initialize the accounts client
Meteor.startup(() => {
  // You can add any client startup code here
});