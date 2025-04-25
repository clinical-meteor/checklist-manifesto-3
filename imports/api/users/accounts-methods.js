// imports/api/users/accounts-methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { accountsServer } from '../../startup/server/accounts-config';

Meteor.methods({
  // Create a new user
  'create-user'(user) {
    check(user, {
      username: Match.Maybe(String),
      email: Match.Maybe(String),
      password: String,
      profile: Match.Maybe(Object)
    });

    // Validate that either username or email is provided
    if (!user.username && !user.email) {
      throw new Meteor.Error('validation-error', 'Username or email is required');
    }

    try {
      // Call the accounts-password service to create the user
      const userId = accountsServer.getServices().password.createUser(user);
      return { userId };
    } catch (error) {
      throw new Meteor.Error('create-user-error', error.message);
    }
  },

  // Login with password
  async 'login-with-password'(credentials) {
    check(credentials, {
      user: Match.OneOf(
        { email: String },
        { username: String },
        { id: String },
        String
      ),
      password: String
    });

    try {
      // The connection object normally includes IP and userAgent
      const connection = {
        ip: this.connection ? this.connection.clientAddress : '127.0.0.1',
        userAgent: get(this.connection, 'httpHeaders.user-agent', 'Unknown')
      };

      // Call accounts-js to login
      const loginResult = await accountsServer.loginWithService('password', credentials, connection);
      return loginResult;
    } catch (error) {
      throw new Meteor.Error('login-error', error.message);
    }
  },

  // Verify password credentials without creating a session
  async 'verify-password-credentials'(credentials) {
    check(credentials, {
      user: Match.OneOf(
        { email: String },
        { username: String },
        { id: String },
        String
      ),
      password: String
    });

    try {
      const connection = {
        ip: this.connection ? this.connection.clientAddress : '127.0.0.1',
        userAgent: get(this.connection, 'httpHeaders.user-agent', 'Unknown')
      };

      // Call accounts-js to verify credentials
      const isValid = await accountsServer.authenticateWithService('password', credentials, connection);
      return isValid;
    } catch (error) {
      throw new Meteor.Error('verify-error', error.message);
    }
  },

  // Log out the current user
  async 'logout'() {
    const { accessToken } = this;
    
    if (!accessToken) {
      return { success: true }; // Already logged out
    }

    try {
      await accountsServer.logout(accessToken);
      return { success: true };
    } catch (error) {
      throw new Meteor.Error('logout-error', error.message);
    }
  },

  // Refresh authentication tokens
  async 'refresh-tokens'({ accessToken, refreshToken }) {
    check(accessToken, String);
    check(refreshToken, String);

    try {
      const connection = {
        ip: this.connection ? this.connection.clientAddress : '127.0.0.1',
        userAgent: get(this.connection, 'httpHeaders.user-agent', 'Unknown')
      };

      const refreshResult = await accountsServer.refreshTokens(accessToken, refreshToken, connection);
      return refreshResult;
    } catch (error) {
      throw new Meteor.Error('refresh-error', error.message);
    }
  },

  // Send reset password email
  async 'send-reset-password-email'({ email }) {
    check(email, String);

    try {
      await accountsServer.getServices().password.sendResetPasswordEmail(email);
      return { success: true };
    } catch (error) {
      // For security, always return success even if the email doesn't exist
      if (accountsServer.options.ambiguousErrorMessages) {
        return { success: true };
      }
      throw new Meteor.Error('reset-password-error', error.message);
    }
  },

  // Reset password with token
  async 'reset-password'({ token, newPassword }) {
    check(token, String);
    check(newPassword, String);

    try {
      const connection = {
        ip: this.connection ? this.connection.clientAddress : '127.0.0.1',
        userAgent: get(this.connection, 'httpHeaders.user-agent', 'Unknown')
      };

      const resetResult = await accountsServer.getServices().password.resetPassword(token, newPassword, connection);
      return resetResult;
    } catch (error) {
      throw new Meteor.Error('reset-password-error', error.message);
    }
  },

  // Get the current user
  async 'get-user'() {
    if (!this.userId) {
      return null;
    }

    try {
      // Get the user object from the database
      const user = await accountsServer.findUserById(this.userId);
      
      // Sanitize the user object
      return accountsServer.sanitizeUser(user);
    } catch (error) {
      throw new Meteor.Error('get-user-error', error.message);
    }
  },

  // Send email verification
  async 'send-verification-email'({ email }) {
    check(email, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to verify your email.');
    }

    try {
      await accountsServer.getServices().password.sendVerificationEmail(email);
      return { success: true };
    } catch (error) {
      throw new Meteor.Error('verification-email-error', error.message);
    }
  },

  // Verify email with token
  async 'verify-email'({ token }) {
    check(token, String);

    try {
      await accountsServer.getServices().password.verifyEmail(token);
      return { success: true };
    } catch (error) {
      throw new Meteor.Error('verify-email-error', error.message);
    }
  },

  // Add email to user
  async 'add-email'({ newEmail }) {
    check(newEmail, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to add an email.');
    }

    try {
      await accountsServer.getServices().password.addEmail(this.userId, newEmail, false);
      return { success: true };
    } catch (error) {
      throw new Meteor.Error('add-email-error', error.message);
    }
  },

  // Change password
  async 'change-password'({ oldPassword, newPassword }) {
    check(oldPassword, String);
    check(newPassword, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to change your password.');
    }

    try {
      await accountsServer.getServices().password.changePassword(this.userId, oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      throw new Meteor.Error('change-password-error', error.message);
    }
  }
});