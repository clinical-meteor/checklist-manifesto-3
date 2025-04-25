// server/accounts-patch.js
// This file provides compatibility functions for Meteor's accounts system in v3

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import bcrypt from 'bcrypt';

// Helper function to create a user directly in the MongoDB collection
export async function createUserDirectly(options) {
  try {
    const { username, password, profile } = options;
    
    // Check if user already exists
    const existingUser = await Meteor.users.findOneAsync({ username });
    if (existingUser) {
      return existingUser._id;
    }
    
    // Hash the password (simplified version)
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Create the user document
    const userId = await Meteor.users.insertAsync({
      username,
      createdAt: new Date(),
      services: {
        password: {
          bcrypt: hash
        }
      },
      profile: profile || {}
    });
    
    return userId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Simple function to create our admin user
export async function ensureAdminUser(username, password) {
  try {
    // Check if admin user exists
    const adminUser = await Meteor.users.findOneAsync({ username });
    
    if (!adminUser) {
      console.log(`Creating user: ${username}`);
      
      // Create the user
      const userId = await createUserDirectly({
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