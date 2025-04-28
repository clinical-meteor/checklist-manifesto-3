// imports/api/tasks/methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, set } from 'lodash';
import { TasksCollection } from '../../db/TasksCollection';
import moment from 'moment';

Meteor.methods({
  async 'tasks.insert'(description, options = {}) {
    check(description, String);
    check(options, {
      priority: Match.Maybe(String),
      dueDate: Match.Maybe(Match.OneOf(Date, null, undefined)),  // Allow null or undefined
      assignedTo: Match.Maybe(String),
      focusOn: Match.Maybe(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.', 'You must be logged in to create tasks.');
    }

    try {
      // Create a new FHIR Task resource
      const task = {
        resourceType: 'Task',
        status: 'requested',
        description: description,
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: this.userId,
        isDeleted: false
      };

      // Add optional fields if provided
      if (options.priority) {
        set(task, 'priority', options.priority);
      }

      if (options.dueDate) {
        set(task, 'executionPeriod', {
          end: options.dueDate
        });
      }

      // Add optional owner field (task assignee) if provided
      if (options.assignedTo) {
        // Verify the assigned user exists
        const assignedUser = await Meteor.users.findOneAsync({ _id: options.assignedTo });
        if (!assignedUser) {
          throw new Meteor.Error('Invalid user', 'The assigned user does not exist.');
        }
        set(task, 'owner', options.assignedTo);
      }

      // Other options handling...

      const taskId = await TasksCollection.insertAsync(task);
      return taskId;
    } catch (error) {
      throw new Meteor.Error('Error inserting task', error.message);
    }
  },

  async 'tasks.setStatus'(taskId, status) {
    check(taskId, String);
    check(status, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.', 'You must be logged in to update tasks.');
    }

    try {
      const task = await TasksCollection.findOneAsync(taskId);

      if (!task) {
        throw new Meteor.Error('Task not found.', 'The task you are trying to update does not exist.');
      }

      // Only allow the task requester or owner to update it
      if (task.requester !== this.userId && get(task, 'owner') !== this.userId) {
        throw new Meteor.Error('Access denied.', 'You are not authorized to update this task.');
      }

      const result = await TasksCollection.updateAsync(
        { _id: taskId },
        { 
          $set: { 
            status: status,
            lastModified: new Date()
          } 
        }
      );

      return result;
    } catch (error) {
      throw new Meteor.Error('Error updating task status', error.message);
    }
  },

  async 'tasks.remove'(taskId) {
    check(taskId, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.', 'You must be logged in to delete tasks.');
    }

    try {
      const task = await TasksCollection.findOneAsync(taskId);

      if (!task) {
        throw new Meteor.Error('Task not found.', 'The task you are trying to delete does not exist.');
      }

      // Only the task requester can delete it
      if (task.requester !== this.userId) {
        throw new Meteor.Error('Access denied.', 'You are not authorized to delete this task.');
      }

      // Soft delete by marking as deleted and setting status to 'entered-in-error'
      const result = await TasksCollection.updateAsync(
        { _id: taskId },
        { 
          $set: { 
            isDeleted: true,
            status: 'entered-in-error',
            lastModified: new Date()
          } 
        }
      );

      return result;
    } catch (error) {
      throw new Meteor.Error('Error removing task', error.message);
    }
  },

  async 'tasks.addNote'(taskId, text) {
    check(taskId, String);
    check(text, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.', 'You must be logged in to add notes to tasks.');
    }

    try {
      const task = await TasksCollection.findOneAsync(taskId);

      if (!task) {
        throw new Meteor.Error('Task not found.', 'The task you are trying to update does not exist.');
      }

      // Only allow the task requester or owner to add notes
      if (task.requester !== this.userId && get(task, 'owner') !== this.userId) {
        throw new Meteor.Error('Access denied.', 'You are not authorized to update this task.');
      }

      const noteToAdd = {
        text: text,
        time: new Date(),
        authorId: this.userId
      };

      const result = await TasksCollection.updateAsync(
        { _id: taskId },
        { 
          $push: { note: noteToAdd },
          $set: { lastModified: new Date() }
        }
      );

      return result;
    } catch (error) {
      throw new Meteor.Error('Error adding note to task', error.message);
    }
  },

  async 'tasks.update'(taskId, updates) {
    check(taskId, String);
    check(updates, {
      description: Match.Maybe(String),
      priority: Match.Maybe(String),
      status: Match.Maybe(String),
      dueDate: Match.Maybe(Date),
      assignedTo: Match.Maybe(String),
      focusOn: Match.Maybe(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.', 'You must be logged in to update tasks.');
    }

    try {
      const task = await TasksCollection.findOneAsync(taskId);

      if (!task) {
        throw new Meteor.Error('Task not found.', 'The task you are trying to update does not exist.');
      }

      // Only allow the task requester or owner to update it
      if (task.requester !== this.userId && get(task, 'owner') !== this.userId) {
        throw new Meteor.Error('Access denied.', 'You are not authorized to update this task.');
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

      if (updates.assignedTo) {
        updateObj.owner = updates.assignedTo;
      }

      if (updates.focusOn) {
        updateObj.focus = updates.focusOn;
      }

      if (updates.dueDate) {
        updateObj['executionPeriod.end'] = updates.dueDate;
      }

      const result = await TasksCollection.updateAsync(
        { _id: taskId },
        { $set: updateObj }
      );

      return result;
    } catch (error) {
      throw new Meteor.Error('Error updating task', error.message);
    }
  },

  /**
   * Import a Task resource
   * @param {Object} taskResource - A FHIR Task resource
   * @returns {String} The ID of the imported task
   */
  async 'tasks.import'(taskResource) {
    // Make sure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('Not authorized.', 'You must be logged in to import tasks.');
    }

    // Validate that it's a task resource
    check(taskResource, {
      resourceType: String,
      status: Match.Maybe(String),
      description: Match.Maybe(String),
      priority: Match.Maybe(String),
      executionPeriod: Match.Maybe(Object),
      // Allow other fields without explicitly checking them
      $sparse: true
    });

    // Verify it's a Task resource
    if (taskResource.resourceType !== 'Task') {
      throw new Meteor.Error('Invalid resource', 'Only Task resources can be imported.');
    }

    try {
      // Prepare the task object for insertion
      const task = {
        // Required FHIR Task properties
        resourceType: 'Task',
        status: taskResource.status || 'requested',
        
        // Common Task properties
        description: taskResource.description || 'Imported task',
        priority: taskResource.priority || 'routine',
        
        // Metadata
        authoredOn: taskResource.authoredOn ? new Date(taskResource.authoredOn) : new Date(),
        lastModified: new Date(),
        
        // Ownership
        requester: this.userId,
        owner: taskResource.owner || this.userId,
        
        // Additional properties from the imported task
        executionPeriod: {},
        note: taskResource.note || []
      };

      // Handle dates in execution period
      if (taskResource.executionPeriod) {
        if (taskResource.executionPeriod.start) {
          task.executionPeriod.start = new Date(taskResource.executionPeriod.start);
        }
        
        if (taskResource.executionPeriod.end) {
          task.executionPeriod.end = new Date(taskResource.executionPeriod.end);
        }
      }

      // Use the provided ID if it exists, otherwise MongoDB will generate one
      if (taskResource.id) {
        task.id = taskResource.id;
      }

      // Handle existing task with same ID
      const existingTask = taskResource.id ? 
        TasksCollection.findOne({ id: taskResource.id }) : null;

      if (existingTask) {
        // Update existing task
        const taskId = existingTask._id;
        TasksCollection.update({ _id: taskId }, { $set: task });
        return taskId;
      } else {
        // Insert new task
        return TasksCollection.insert(task);
      }
    } catch (error) {
      console.error('Error importing task:', error);
      throw new Meteor.Error('import-failed', 'Failed to import task: ' + error.message);
    }
  },

  async 'tasks.importMultiple'(tasksToImport) {
    check(tasksToImport, [Object]);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to import tasks.');
    }
    
    // Validate each task
    tasksToImport.forEach(task => {
      if (task.resourceType !== 'Task') {
        throw new Meteor.Error('invalid-task', `Invalid resource type: ${task.resourceType}. Expected 'Task'.`);
      }
    });
    
    let importedCount = 0;
    let errors = [];

    try {
      // Process each task
      for (const taskData of tasksToImport) {
        try {
          // Prepare the task for import
          const preparedTask = prepareTaskForImport(taskData, this.userId);
          
          // Insert the task
          await TasksCollection.insertAsync(preparedTask);
          
          importedCount++;
        } catch (error) {
          errors.push({
            description: get(taskData, 'description', 'Unknown task'),
            error: error.message
          });
          console.error('Error importing task:', error);
        }
      }
      
      return {
        imported: importedCount,
        errors: errors.length > 0 ? errors : null,
        total: tasksToImport.length
      };
    } catch (error) {
      throw new Meteor.Error('import-failed', `Failed to import tasks: ${error.message}`);
    }
  },
  async 'tasks.clone'(taskId) {
    check(taskId, String);
    
    // Must be logged in to clone
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to clone tasks.');
    }
    
    try {
      // Find the original task
      const originalTask = TasksCollection.findOne(taskId);
      
      if (!originalTask) {
        throw new Meteor.Error('not-found', 'Protocol not found.');
      }
      
      // Create a new task based on the original
      const newTask = {
        resourceType: 'Task',
        status: 'draft',  // Always start as draft
        description: originalTask.description,
        priority: originalTask.priority || 'routine',
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: this.userId,
        isDeleted: false,
        public: false,  // Always start as private
        clonedFrom: taskId  // Store original source
      };
      
      // Copy execution period if present
      if (get(originalTask, 'executionPeriod')) {
        newTask.executionPeriod = {};
        
        if (get(originalTask, 'executionPeriod.end')) {
          // Set due date a week from now by default
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);
          newTask.executionPeriod.end = dueDate;
        }
      }
      
      // Insert the new task
      const taskId = await TasksCollection.insertAsync(newTask);
      return taskId;
    } catch (error) {
      throw new Meteor.Error('clone-failed', `Failed to clone protocol: ${error.message}`);
    }
  },

  // Toggle a task's public status (make it available in protocol library)
  async 'tasks.togglePublic'(taskId, makePublic) {
    check(taskId, String);
    check(makePublic, Boolean);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const task = TasksCollection.findOne(taskId);
    
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found.');
    }
    
    // Only the creator can make a task public/private
    if (task.requester !== this.userId) {
      throw new Meteor.Error('not-authorized', 'Only the creator can change a task\'s visibility.');
    }
    
    return await TasksCollection.updateAsync(taskId, {
      $set: { 
        public: makePublic,
        lastModified: new Date()
      }
    });
  }
});



// Prepare a task for import
function prepareTaskForImport(taskData, userId) {
  // Create a new object to avoid modifying the original
  const task = { ...taskData };
  
  // Set required fields
  task.resourceType = 'Task';
  
  // Set default values if not present
  if (!task.status) {
    task.status = 'requested';
  }
  
  // Convert FHIR references to IDs if needed
  if (get(task, 'requester.reference')) {
    const reference = get(task, 'requester.reference');
    if (reference.startsWith('Practitioner/')) {
      task.requester = reference.replace('Practitioner/', '');
    }
  }
  
  if (get(task, 'owner.reference')) {
    const reference = get(task, 'owner.reference');
    if (reference.startsWith('Practitioner/')) {
      task.owner = reference.replace('Practitioner/', '');
    }
  }
  
  // Set the current user as requester if not specified
  if (!task.requester) {
    task.requester = userId;
  }
  
  // Set dates if not present
  if (!task.authoredOn) {
    task.authoredOn = new Date();
  }
  
  task.lastModified = new Date();
  
  // Set isDeleted flag to false
  task.isDeleted = false;
  
  // Remove any _id field to avoid conflicts
  delete task._id;
  
  return task;
}