// imports/api/diagnostics/server/methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { MongoInternals } from 'meteor/mongo';
import os from 'os';

Meteor.methods({
  /**
   * Simple connection test method
   * @returns {Object} Connection test results
   */
  'testConnection'() {
    console.log('Test connection method called');
    
    // Basic server info
    const serverInfo = {
      environment: process.env.NODE_ENV || 'development',
      meteorVersion: Meteor.release,
      serverArchitecture: process.arch,
      serverPlatform: process.platform,
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date()
    };
    
    // System information
    const systemInfo = {
      hostname: os.hostname(),
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
    
    // Database connection status
    let dbStatus = {};
    try {
      const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      const adminDb = db.admin();
      
      // Just do a simple command to check connection
      db.command({ ping: 1 });
      
      dbStatus = {
        connected: true,
        mongoUrl: process.env.MONGO_URL ? process.env.MONGO_URL.replace(/:[^:]*@/, ':****@') : 'Unknown'
      };
    } catch (error) {
      dbStatus = {
        connected: false,
        error: error.message
      };
    }
    
    // Connection settings
    const connectionSettings = {
      port: process.env.PORT || 'Unknown',
      rootUrl: process.env.ROOT_URL || 'Unknown',
      webSocketsEnabled: process.env.DISABLE_WEBSOCKETS !== '1',
      meteorSettings: Meteor.settings ? 'Available' : 'Not available'
    };
    
    // Get DDP session info
    let ddpSessionCount = 0;
    try {
      // This is somewhat of an internal API but can be useful for diagnostics
      if (Meteor.server && Meteor.server.sessions) {
        ddpSessionCount = Object.keys(Meteor.server.sessions).length;
      }
    } catch (e) {
      // Ignore errors accessing internal APIs
    }
    
    return {
      success: true,
      server: serverInfo,
      system: systemInfo,
      database: dbStatus,
      connection: connectionSettings,
      ddpSessions: ddpSessionCount,
      wsEndpoints: process.env.METEOR_SERVER_WEBSOCKET_ENDPOINTS || 'Not configured'
    };
  },
  
  /**
   * Get server logs
   * @param {number} limit - Maximum number of log entries to return
   * @returns {Array} Server logs
   */
  'getServerLogs'(limit = 100) {
    check(limit, Number);
    
    // This would require implementing a server-side logging solution
    // For now we'll just return a message
    return [
      { timestamp: new Date(), message: 'Logs not available via this method' },
      { timestamp: new Date(), message: 'Please check the server console or log files' }
    ];
  },
  
  /**
   * Test database connection
   * @returns {Object} Database test results
   */
  'testDatabase'() {
    console.log('Test database connection method called');
    
    try {
      // Get the Mongo driver
      const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;
      
      // Run a simple command to test the connection
      const pingResult = db.command({ ping: 1 });
      
      // Check if we can insert, find, and remove a test document
      const testCollection = db.collection('___connection_test___');
      
      // Insert a test document
      const insertResult = testCollection.insertOne({ 
        test: true, 
        timestamp: new Date() 
      });
      
      // Find the test document
      const findResult = testCollection.findOne({ test: true });
      
      // Remove the test document
      const removeResult = testCollection.deleteMany({ test: true });
      
      return {
        success: true,
        ping: pingResult,
        insertWorked: !!insertResult.insertedId,
        findWorked: !!findResult,
        removeWorked: removeResult.deletedCount > 0,
        mongoUrl: process.env.MONGO_URL ? process.env.MONGO_URL.replace(/:[^:]*@/, ':****@') : 'Unknown'
      };
    } catch (error) {
      console.error('Database test error:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
});