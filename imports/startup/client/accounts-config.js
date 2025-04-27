// imports/startup/client/accounts-config.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// Configure the client-side accounts settings
Accounts.config({
  // Client-side configuration
});

// Configure password reset handler
Accounts.onResetPasswordLink(function(token, done) {
  // You can handle the reset password token here
  // For example, show a password reset form
  // For simplicity, we'll just log it and call done()
  console.log('Password reset link clicked with token:', token);
  
  // Store the token in session to be used by a reset password form
  Session.set('resetPasswordToken', token);
  
  // Navigate to reset password page (you would need to implement this page)
  FlowRouter.go('/reset-password');
  
  // Call done to mark the token as used
  done();
});

// Configure email verification handler
Accounts.onEmailVerificationLink(function(token, done) {
  Accounts.verifyEmail(token, function(error) {
    if (error) {
      console.error('Error verifying email:', error);
      alert('Error verifying email: ' + error.reason);
    } else {
      console.log('Email verified successfully');
      alert('Email verified successfully!');
      // You can show a success message or redirect the user
    }
    done();
  });
});

// Configure enrollment (account setup) handler
Accounts.onEnrollmentLink(function(token, done) {
  // Handle enrollment link
  console.log('Enrollment link clicked with token:', token);
  
  // Store the token in session
  Session.set('enrollmentToken', token);
  
  // Navigate to enrollment page (you would need to implement this page)
  FlowRouter.go('/enroll');
  
  done();
});