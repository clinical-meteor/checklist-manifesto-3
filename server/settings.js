// server/settings.js
import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

/**
 * Load environment variables into Meteor.settings
 * This follows the 12-factor app methodology for configuration
 */
export function loadEnvironmentSettings() {
  // User authentication settings
  set(Meteor.settings, 'seedUsername', process.env.SEED_USERNAME || 'admin');
  set(Meteor.settings, 'seedPassword', process.env.SEED_PASSWORD || 'password');
  
  // Database settings
  if (process.env.MONGO_URL) {
    set(Meteor.settings, 'mongoUrl', process.env.MONGO_URL);
  }
  
  // Application settings
  set(Meteor.settings, 'appName', process.env.APP_NAME || 'Checklist Manifesto');
  set(Meteor.settings, 'environment', process.env.NODE_ENV || 'development');
  
  // Task settings
  set(Meteor.settings, 'tasks.maxPerUser', parseInt(process.env.MAX_TASKS_PER_USER || '100', 10));
  set(Meteor.settings, 'tasks.dueSoonDays', parseInt(process.env.DUE_SOON_DAYS || '7', 10));
  
  // API settings
  set(Meteor.settings, 'apiEnabled', process.env.API_ENABLED === 'true' || false);
  if (get(Meteor.settings, 'apiEnabled')) {
    set(Meteor.settings, 'apiAuth.secret', process.env.API_AUTH_SECRET || 'default-secret-change-me');
    set(Meteor.settings, 'apiAuth.expiryInDays', parseInt(process.env.API_AUTH_EXPIRY_DAYS || '7', 10));
  }
  
  // Email settings (optional)
  if (process.env.MAIL_URL) {
    set(Meteor.settings, 'mail.url', process.env.MAIL_URL);
    set(Meteor.settings, 'mail.from', process.env.MAIL_FROM || 'noreply@example.com');
  }

  // Logging
  set(Meteor.settings, 'logLevel', process.env.LOG_LEVEL || 'info');

  // Print settings for development environments (excluding sensitive data)
  if (get(Meteor.settings, 'environment') === 'development') {
    const settingsToPrint = { ...Meteor.settings };
    delete settingsToPrint.seedPassword;
    delete settingsToPrint.apiAuth;
    
    console.log('App settings loaded:', settingsToPrint);
  }
}

// Export a simple function to get a setting with a default value
export function getSetting(path, defaultValue = null) {
  return get(Meteor.settings, path, defaultValue);
}