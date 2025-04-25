// imports/api/users/login-method.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import bcrypt from 'bcrypt';

// Custom login method for the demo
Meteor.methods({
  'login'(options) {
    check(options, {
      username: String,
      password: String
    });
    
    const { username, password } = options;
    
    // Find the user
    const user = Meteor.users.findOne({ username });
    
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }
    
    // For demo purposes, we'll do a simple check
    // In a real app, we would verify the password hash
    if (username === 'admin' && password === 'password') {
      return {
        userId: user._id,
        username: user.username
      };
    }
    
    // If we have a proper password hash, verify it
    if (user.services && user.services.password && user.services.password.bcrypt) {
      try {
        const passwordHash = user.services.password.bcrypt;
        const isValid = bcrypt.compareSync(password, passwordHash);
        
        if (isValid) {
          return {
            userId: user._id,
            username: user.username
          };
        }
      } catch (error) {
        console.error('Error verifying password:', error);
      }
    }
    
    throw new Meteor.Error('invalid-credentials', 'Invalid username or password');
  }
});