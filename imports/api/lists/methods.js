// imports/api/lists/methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { ListsCollection, getDefaultListName } from '/imports/db/ListsCollection';
import { TasksCollection } from '/imports/db/TasksCollection';

Meteor.methods({
  /**
   * Create a new list
   * @param {Object} options List properties
   * @returns {String} ID of the new list
   */
  async 'lists.create'(options = {}) {
    check(options, {
      title: Match.Maybe(String),
      description: Match.Maybe(String),
      public: Match.Maybe(Boolean)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a list');
    }

    try {
      const list = {
        resourceType: 'List',
        status: 'active',
        mode: 'working',
        title: options.title || getDefaultListName(),
        name: options.title || getDefaultListName(), // For backward compatibility
        description: options.description || '',
        incompleteCount: 0,
        public: options.public || false,
        createdAt: new Date(),
        lastModified: new Date(),
        userId: this.userId,
        isDeleted: false
      };
      
      const listId = await ListsCollection.insertAsync(list);
      return listId;
    } catch (error) {
      throw new Meteor.Error('create-list-failed', get(error, 'reason', 'Failed to create list'));
    }
  },

  /**
   * Update an existing list
   * @param {String} listId ID of the list to update
   * @param {Object} updates Fields to update
   * @returns {Number} Number of documents updated
   */
  async 'lists.update'(listId, updates) {
    check(listId, String);
    check(updates, {
      title: Match.Maybe(String),
      name: Match.Maybe(String), // For backward compatibility
      description: Match.Maybe(String),
      public: Match.Maybe(Boolean),
      status: Match.Maybe(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a list');
    }

    try {
      // Find the list to verify ownership
      const list = await ListsCollection.findOneAsync(listId);

      if (!list) {
        throw new Meteor.Error('not-found', 'List not found');
      }

      // Verify that the current user owns the list
      if (list.userId !== this.userId) {
        throw new Meteor.Error('not-authorized', 'You can only modify your own lists');
      }

      const updateData = {
        lastModified: new Date()
      };

      // Only set fields that were provided
      if (updates.title) {
        updateData.title = updates.title;
        // Keep name in sync for backward compatibility
        updateData.name = updates.title;
      } else if (updates.name) {
        updateData.name = updates.name;
        updateData.title = updates.name;
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }

      if (updates.public !== undefined) {
        updateData.public = updates.public;
      }

      if (updates.status) {
        updateData.status = updates.status;
      }

      const result = await ListsCollection.updateAsync(
        { _id: listId },
        { $set: updateData }
      );

      return result;
    } catch (error) {
      throw new Meteor.Error('update-list-failed', get(error, 'reason', 'Failed to update list'));
    }
  },

  /**
   * Toggle a list's public status
   * @param {String} listId ID of the list to toggle
   * @returns {Number} Number of documents updated
   */
  async 'lists.togglePublic'(listId) {
    check(listId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to modify a list');
    }

    try {
      // Find the list to verify ownership and get current public status
      const list = await ListsCollection.findOneAsync(listId);

      if (!list) {
        throw new Meteor.Error('not-found', 'List not found');
      }

      // Verify that the current user owns the list
      if (list.userId !== this.userId) {
        throw new Meteor.Error('not-authorized', 'You can only modify your own lists');
      }

      // Toggle the public flag
      const result = await ListsCollection.updateAsync(
        { _id: listId },
        { 
          $set: { 
            public: !list.public,
            lastModified: new Date()
          } 
        }
      );

      return result;
    } catch (error) {
      throw new Meteor.Error('toggle-public-failed', get(error, 'reason', 'Failed to toggle list public status'));
    }
  },

  /**
   * Remove a list and its tasks
   * @param {String} listId ID of the list to remove
   * @returns {Object} Result with counts of deleted list and tasks
   */
  async 'lists.remove'(listId) {
    check(listId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to remove a list');
    }

    try {
      // Find the list to verify ownership
      const list = await ListsCollection.findOneAsync(listId);

      if (!list) {
        throw new Meteor.Error('not-found', 'List not found');
      }

      // Verify that the current user owns the list
      if (list.userId !== this.userId) {
        throw new Meteor.Error('not-authorized', 'You can only remove your own lists');
      }

      // Soft delete the list and all its tasks
      await ListsCollection.updateAsync(
        { _id: listId },
        { 
          $set: { 
            isDeleted: true,
            status: 'entered-in-error',
            lastModified: new Date()
          } 
        }
      );

      // Mark all tasks in this list as deleted
      const tasksResult = await TasksCollection.updateAsync(
        { 
          listId: listId,
          isDeleted: { $ne: true }
        },
        { 
          $set: { 
            isDeleted: true,
            status: 'entered-in-error',
            lastModified: new Date()
          } 
        },
        { multi: true }
      );

      return {
        list: 1,
        tasks: tasksResult
      };
    } catch (error) {
      throw new Meteor.Error('remove-list-failed', get(error, 'reason', 'Failed to remove list'));
    }
  },

  /**
   * Clone an existing list
   * @param {String} listId ID of the list to clone
   * @param {Object} options Options for the cloned list
   * @returns {String} ID of the cloned list
   */
  async 'lists.clone'(listId, options = {}) {
    check(listId, String);
    check(options, {
      title: Match.Maybe(String),
      public: Match.Maybe(Boolean)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to clone a list');
    }

    try {
      // Find the source list
      const sourceList = await ListsCollection.findOneAsync(listId);

      if (!sourceList) {
        throw new Meteor.Error('not-found', 'Source list not found');
      }

      // For a private list, verify that the current user owns it or it's public
      if (!sourceList.public && sourceList.userId !== this.userId) {
        throw new Meteor.Error('not-authorized', 'You can only clone your own or public lists');
      }

      // Create a new list based on the source
      const newList = {
        resourceType: 'List',
        status: 'active',
        mode: 'working',
        title: options.title || `${sourceList.title || sourceList.name} (Copy)`,
        name: options.title || `${sourceList.title || sourceList.name} (Copy)`,
        description: sourceList.description || '',
        incompleteCount: sourceList.incompleteCount || 0,
        public: options.public !== undefined ? options.public : false,
        createdAt: new Date(),
        lastModified: new Date(),
        userId: this.userId,
        isDeleted: false,
        source: listId // Reference to the original list
      };
      
      const newListId = await ListsCollection.insertAsync(newList);
      
      // Copy all tasks from the source list
      const tasks = await TasksCollection.find({
        listId: listId,
        isDeleted: { $ne: true }
      }).fetchAsync();
      
      // Insert cloned tasks
      for (const task of tasks) {
        const newTask = {
          resourceType: 'Task',
          status: task.status === 'completed' ? 'completed' : 'requested',
          description: task.description,
          priority: task.priority || 'routine',
          authoredOn: new Date(),
          lastModified: new Date(),
          requester: this.userId,
          listId: newListId,
          isDeleted: false,
          source: task._id // Reference to the original task
        };
        
        // Copy execution period if present
        if (get(task, 'executionPeriod')) {
          newTask.executionPeriod = {};
          
          if (get(task, 'executionPeriod.start')) {
            newTask.executionPeriod.start = new Date();
          }
          
          if (get(task, 'executionPeriod.end')) {
            newTask.executionPeriod.end = get(task, 'executionPeriod.end');
          }
        }
        
        await TasksCollection.insertAsync(newTask);
      }
      
      return newListId;
    } catch (error) {
      throw new Meteor.Error('clone-list-failed', get(error, 'reason', 'Failed to clone list'));
    }
  },

  /**
   * Increment the incompleteCount for a list
   * @param {String} listId ID of the list
   * @param {Number} amount Amount to increment (negative to decrement)
   * @returns {Number} Number of documents updated
   */
  async 'lists.updateIncompleteCount'(listId, amount) {
    check(listId, String);
    check(amount, Number);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a list');
    }

    try {
      // Find the list to verify it exists
      const list = await ListsCollection.findOneAsync(listId);

      if (!list) {
        throw new Meteor.Error('not-found', 'List not found');
      }

      // Update the incomplete count
      const result = await ListsCollection.updateAsync(
        { _id: listId },
        { 
          $inc: { incompleteCount: amount },
          $set: { lastModified: new Date() }
        }
      );

      return result;
    } catch (error) {
      throw new Meteor.Error('update-count-failed', get(error, 'reason', 'Failed to update incomplete count'));
    }
  },


  async 'lists.get'(listId) {
    check(listId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to view a list');
    }

    try {
      // Find the list
      const list = await ListsCollection.findOneAsync({
        _id: listId,
        isDeleted: { $ne: true }
      });

      if (!list) {
        throw new Meteor.Error('not-found', 'List not found');
      }

      // Check if user has access to the list
      if (!list.public && list.userId !== this.userId) {
        throw new Meteor.Error('access-denied', 'You do not have permission to view this list');
      }

      return list;
    } catch (error) {
      throw new Meteor.Error('get-list-failed', get(error, 'reason', 'Failed to get list'));
    }
  },

  async 'lists.create'(options = {}) {
    check(options, {
      title: Match.Maybe(String),
      description: Match.Maybe(String),
      public: Match.Maybe(Boolean)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a list');
    }

    try {
      // Generate a default title if none provided
      const title = options.title || `List ${new Date().toLocaleDateString()}`;
      
      const list = {
        resourceType: 'List',
        status: 'active',
        mode: 'working',
        title: title,
        name: title, // For backward compatibility
        description: options.description || '',
        incompleteCount: 0,
        public: options.public || false,
        createdAt: new Date(),
        lastModified: new Date(),
        userId: this.userId,
        isDeleted: false
      };
      
      const listId = await ListsCollection.insertAsync(list);
      
      console.log(`Created new list: ${title} (${listId})`);
      
      return listId;
    } catch (error) {
      console.error('Error creating list:', error);
      throw new Meteor.Error('create-list-failed', get(error, 'reason', 'Failed to create list'));
    }
  }
});