// imports/startup/client/accounts-config.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// Configure the client-side accounts options
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Customize behavior after password reset
Accounts.onResetPasswordLink(function(token, done) {
  // You can add custom logic here
  done();
});

// Customize behavior after email verification
Accounts.onEmailVerificationLink(function(token, done) {
  Accounts.verifyEmail(token, (err) => {
    if (err) {
      console.error('Error verifying email:', err);
    } else {
      console.log('Email successfully verified');
      // You can show a success message or redirect the user
    }
    done();
  });
});