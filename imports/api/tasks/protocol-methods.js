// imports/api/tasks/protocol-methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { TasksCollection } from '../../db/TasksCollection';
import { ListsCollection } from '../../db/ListsCollection';
import moment from 'moment';

/**
 * Methods for handling protocols (task templates) and sharing
 */
Meteor.methods({
  /**
   * Get all protocols (public or owned by current user)
   * @returns {Array} Array of protocols
   */
  'protocols.list'() {
    // Anonymous users can only see public protocols
    if (!this.userId) {
      return TasksCollection.find({
        isProtocol: true,
        public: true,
        isDeleted: { $ne: true }
      }, {
        sort: { lastModified: -1 }
      }).fetch();
    }
    
    // Authenticated users see public protocols and their own
    return TasksCollection.find({
      isProtocol: true,
      $or: [
        { public: true },
        { requester: this.userId }
      ],
      isDeleted: { $ne: true }
    }, {
      sort: { lastModified: -1 }
    }).fetch();
  },
  
  /**
   * Convert a task to a protocol template
   * @param {String} taskId - ID of the task to convert
   * @param {Boolean} makePublic - Whether to make the protocol public
   * @returns {String} ID of the new protocol
   */
  'protocols.createFromTask'(taskId, makePublic = false) {
    check(taskId, String);
    check(makePublic, Boolean);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create protocols.');
    }
    
    try {
      // Find the original task
      const task = TasksCollection.findOne(taskId);
      
      if (!task) {
        throw new Meteor.Error('not-found', 'Task not found.');
      }
      
      // Only the task creator can convert it to a protocol
      if (task.requester !== this.userId) {
        throw new Meteor.Error('not-authorized', 'Only the task creator can convert it to a protocol.');
      }
      
      // Create a protocol based on the task
      const protocol = {
        resourceType: 'Task',
        status: 'ready',
        description: task.description,
        priority: task.priority || 'routine',
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: this.userId,
        isDeleted: false,
        isProtocol: true,
        public: makePublic,
        createdFrom: taskId
      };
      
      // Copy execution period if present
      if (get(task, 'executionPeriod')) {
        protocol.executionPeriod = {};
        
        if (get(task, 'executionPeriod.start')) {
          protocol.executionPeriod.start = new Date();
        }
        
        if (get(task, 'executionPeriod.end')) {
          protocol.executionPeriod.end = get(task, 'executionPeriod.end');
        }
      }
      
      // Insert the protocol
      const protocolId = TasksCollection.insert(protocol);
      
      // If this is a task with subtasks, also copy those
      const subtasks = TasksCollection.find({
        partOf: { reference: `Task/${taskId}` },
        isDeleted: { $ne: true }
      }).fetch();
      
      if (subtasks.length > 0) {
        subtasks.forEach((subtask, index) => {
          const newSubtask = {
            resourceType: 'Task',
            status: 'ready',
            description: subtask.description,
            priority: subtask.priority || protocol.priority,
            authoredOn: new Date(),
            lastModified: new Date(),
            requester: this.userId,
            isDeleted: false,
            isProtocol: true,
            public: makePublic,
            partOf: {
              reference: `Task/${protocolId}`,
              display: protocol.description
            },
            ordinal: subtask.ordinal || index
          };
          
          TasksCollection.insert(newSubtask);
        });
      }
      
      return protocolId;
    } catch (error) {
      throw new Meteor.Error('protocols.createFromTask.error', error.message);
    }
  },
  
  /**
   * Create a task from a protocol template
   * @param {String} protocolId - ID of the protocol to use
   * @returns {String} ID of the new task
   */
  'protocols.createTaskFromProtocol'(protocolId) {
    check(protocolId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create tasks from protocols.');
    }
    
    try {
      // Find the protocol
      const protocol = TasksCollection.findOne(protocolId);
      
      if (!protocol) {
        throw new Meteor.Error('not-found', 'Protocol not found.');
      }
      
      // Create a task from the protocol
      const task = {
        resourceType: 'Task',
        status: 'requested',
        description: protocol.description,
        priority: protocol.priority || 'routine',
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: this.userId,
        isDeleted: false,
        createdFromProtocol: protocolId
      };
      
      // Copy execution period if present, setting due date to a week from now
      if (get(protocol, 'executionPeriod')) {
        task.executionPeriod = {};
        
        if (get(protocol, 'executionPeriod.start')) {
          task.executionPeriod.start = new Date();
        }
        
        // Set due date to a week from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        task.executionPeriod.end = dueDate;
      }
      
      // Insert the task
      const taskId = TasksCollection.insert(task);
      
      // Find and copy subtasks from the protocol
      const subtasks = TasksCollection.find({
        partOf: { reference: `Task/${protocolId}` },
        isDeleted: { $ne: true }
      }, {
        sort: { ordinal: 1 }
      }).fetch();
      
      if (subtasks.length > 0) {
        subtasks.forEach((subtask, index) => {
          const newSubtask = {
            resourceType: 'Task',
            status: 'requested',
            description: subtask.description,
            priority: subtask.priority || task.priority,
            authoredOn: new Date(),
            lastModified: new Date(),
            requester: this.userId,
            isDeleted: false,
            partOf: {
              reference: `Task/${taskId}`,
              display: task.description
            },
            ordinal: subtask.ordinal || index
          };
          
          TasksCollection.insert(newSubtask);
        });
      }
      
      return taskId;
    } catch (error) {
      throw new Meteor.Error('protocols.createTaskFromProtocol.error', error.message);
    }
  },
  
  /**
   * Get a protocol by ID
   * @param {String} protocolId - ID of the protocol
   * @returns {Object} Protocol object
   */
  'protocols.get'(protocolId) {
    check(protocolId, String);
    
    const protocol = TasksCollection.findOne({
      _id: protocolId,
      isProtocol: true,
      isDeleted: { $ne: true }
    });
    
    if (!protocol) {
      throw new Meteor.Error('not-found', 'Protocol not found.');
    }
    
    // If protocol is not public, check authorization
    if (!protocol.public && (!this.userId || protocol.requester !== this.userId)) {
      throw new Meteor.Error('not-authorized', 'You are not authorized to view this protocol.');
    }
    
    return protocol;
  },
  
  /**
   * Get subtasks for a protocol
   * @param {String} protocolId - ID of the protocol
   * @returns {Array} Array of subtasks
   */
  'protocols.getSubtasks'(protocolId) {
    check(protocolId, String);
    
    const protocol = TasksCollection.findOne({
      _id: protocolId,
      isProtocol: true,
      isDeleted: { $ne: true }
    });
    
    if (!protocol) {
      throw new Meteor.Error('not-found', 'Protocol not found.');
    }
    
    // If protocol is not public, check authorization
    if (!protocol.public && (!this.userId || protocol.requester !== this.userId)) {
      throw new Meteor.Error('not-authorized', 'You are not authorized to view this protocol.');
    }
    
    // Get subtasks
    return TasksCollection.find({
      partOf: { reference: `Task/${protocolId}` },
      isDeleted: { $ne: true }
    }, {
      sort: { ordinal: 1 }
    }).fetch();
  },
  
  /**
   * Update a protocol
   * @param {String} protocolId - ID of the protocol
   * @param {Object} updates - Updates to apply
   * @returns {Number} Number of documents updated
   */
  'protocols.update'(protocolId, updates) {
    check(protocolId, String);
    check(updates, {
      description: Match.Maybe(String),
      priority: Match.Maybe(String),
      status: Match.Maybe(String),
      public: Match.Maybe(Boolean)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update protocols.');
    }
    
    const protocol = TasksCollection.findOne({
      _id: protocolId,
      isProtocol: true,
      isDeleted: { $ne: true }
    });
    
    if (!protocol) {
      throw new Meteor.Error('not-found', 'Protocol not found.');
    }
    
    // Only the protocol creator can update it
    if (protocol.requester !== this.userId) {
      throw new Meteor.Error('not-authorized', 'Only the protocol creator can update it.');
    }
    
    const updateObj = { lastModified: new Date() };
    
    if (updates.description) {
      updateObj.description = updates.description;
    }
    
    if (updates.priority) {
      updateObj.priority = updates.priority;
    }
    
    if (updates.status) {
      updateObj.status = updates.status;
    }
    
    if (typeof updates.public === 'boolean') {
      updateObj.public = updates.public;
    }
    
    return TasksCollection.update(protocolId, { $set: updateObj });
  },
  
  /**
   * Delete a protocol
   * @param {String} protocolId - ID of the protocol to delete
   * @returns {Number} Number of documents updated
   */
  'protocols.remove'(protocolId) {
    check(protocolId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete protocols.');
    }
    
    const protocol = TasksCollection.findOne({
      _id: protocolId,
      isProtocol: true,
      isDeleted: { $ne: true }
    });
    
    if (!protocol) {
      throw new Meteor.Error('not-found', 'Protocol not found.');
    }
    
    // Only the protocol creator can delete it
    if (protocol.requester !== this.userId) {
      throw new Meteor.Error('not-authorized', 'Only the protocol creator can delete it.');
    }
    
    // Mark the protocol as deleted
    TasksCollection.update(protocolId, {
      $set: {
        isDeleted: true,
        status: 'entered-in-error',
        lastModified: new Date()
      }
    });
    
    // Also mark any subtasks as deleted
    return TasksCollection.update({
      partOf: { reference: `Task/${protocolId}` },
      isDeleted: { $ne: true }
    }, {
      $set: {
        isDeleted: true,
        status: 'entered-in-error',
        lastModified: new Date()
      }
    }, { multi: true });
  },


  async 'protocols.createSampleData'() {
    // Don't run if not on server
    if (!Meteor.isServer) return;
    
    // Only logged in users can create sample data
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create sample data');
    }
    
    console.log('Creating sample protocols for user:', this.userId);
    
    try {
      // Import the DefaultProtocols array and initializeProtocols function dynamically
      const { DefaultProtocols } = await import('/imports/utils/DefaultProtocols');
      
      if (!DefaultProtocols || !Array.isArray(DefaultProtocols)) {
        throw new Error('DefaultProtocols not available or not an array');
      }
      
      // Results to track created protocols
      const results = [];
      
      // Create each protocol
      for (const protocol of DefaultProtocols) {
        try {
          // First, create a list for this protocol
          const listId = await ListsCollection.insertAsync({
            resourceType: 'List',
            status: 'active',
            mode: 'working',
            title: protocol.name,
            name: protocol.name, // For backward compatibility
            description: protocol.description,
            incompleteCount: protocol.items?.length || 0,
            public: true,
            createdAt: new Date(),
            lastModified: new Date(),
            userId: this.userId,
            isDeleted: false,
            isProtocol: true // Mark this list as a protocol template
          });
          
          // Create the main protocol task
          const protocolTask = {
            resourceType: 'Task',
            status: protocol.status || 'ready',
            description: protocol.name,
            priority: protocol.priority || 'routine',
            authoredOn: new Date(),
            lastModified: new Date(),
            requester: this.userId,
            public: true,
            isTemplate: true,
            isProtocol: true, // Mark it as a protocol
            isDeleted: false,
            listId: listId // Link to the list we created
          };
          
          const protocolId = await TasksCollection.insertAsync(protocolTask);
          console.log(`Created protocol: ${protocol.name} (${protocolId})`);
          
          // Create subtasks if items array is provided
          const taskIds = [];
          if (protocol.items && Array.isArray(protocol.items)) {
            for (let i = 0; i < protocol.items.length; i++) {
              const item = protocol.items[i];
              
              const subtask = {
                resourceType: 'Task',
                status: 'ready',
                description: item,
                priority: protocol.priority || 'routine',
                authoredOn: new Date(),
                lastModified: new Date(),
                requester: this.userId,
                public: true,
                isDeleted: false,
                partOf: {
                  reference: `Task/${protocolId}`,
                  display: protocol.name
                },
                listId: listId, // Link to the list we created
                ordinal: i
              };
              
              const taskId = await TasksCollection.insertAsync(subtask);
              taskIds.push(taskId);
            }
            
            console.log(`Added ${protocol.items.length} items to protocol: ${protocol.name}`);
          }
          
          results.push({
            listId,
            protocolId,
            name: protocol.name,
            itemCount: taskIds.length
          });
        } catch (error) {
          console.error(`Error creating protocol "${protocol.name}":`, error);
        }
      }
      
      return {
        success: true,
        protocols: results
      };
    } catch (error) {
      console.error('Error creating sample protocols:', error);
      throw new Meteor.Error('create-protocols-failed', error.message);
    }
  },
  
  /**
   * Create a new protocol template
   * @param {Object} options Protocol properties
   * @returns {String} ID of the new protocol
   */
  'protocols.create'(options = {}) {
    check(options, {
      name: String,
      description: Match.Optional(String),
      priority: Match.Optional(String),
      public: Match.Optional(Boolean),
      items: Match.Optional([String])
    });
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create protocols');
    }
    
    try {
      // Create the main protocol task
      const protocol = {
        resourceType: 'Task',
        status: 'ready',
        description: options.name,
        priority: options.priority || 'routine',
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: this.userId,
        public: options.public !== undefined ? options.public : false,
        isProtocol: true,
        isDeleted: false
      };
      
      const protocolId = TasksCollection.insert(protocol);
      
      // Create subtasks if items array is provided
      if (options.items && Array.isArray(options.items)) {
        for (let i = 0; i < options.items.length; i++) {
          const item = options.items[i];
          
          const subtask = {
            resourceType: 'Task',
            status: 'ready',
            description: item,
            priority: options.priority || 'routine',
            authoredOn: new Date(),
            lastModified: new Date(),
            requester: this.userId,
            public: options.public !== undefined ? options.public : false,
            isDeleted: false,
            partOf: {
              reference: `Task/${protocolId}`,
              display: options.name
            },
            ordinal: i
          };
          
          TasksCollection.insert(subtask);
        }
      }
      
      return protocolId;
    } catch (error) {
      throw new Meteor.Error('protocols.create.error', error.message);
    }
  }


});