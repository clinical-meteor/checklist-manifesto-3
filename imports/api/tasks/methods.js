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
  }
});