/**
 * Utility functions for working with FHIR data in the context of 
 * importing and exporting tasks
 */

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

/**
 * Converts a collection of tasks to a FHIR Bundle
 * @param {Array} tasks - Array of task objects
 * @param {Object} options - Configuration options
 * @returns {Object} FHIR Bundle containing the tasks
 */
export function tasksToFhirBundle(tasks, options = {}) {
  const { bundleType = 'collection', includeRequest = true } = options;
  
  // Create the bundle structure
  const bundle = {
    resourceType: 'Bundle',
    type: bundleType,
    meta: {
      lastUpdated: new Date().toISOString()
    },
    entry: []
  };
  
  // Add each task to the bundle
  tasks.forEach(task => {
    const sanitizedTask = sanitizeTaskForExport(task);
    const entry = {
      fullUrl: `Task/${sanitizedTask.id}`,
      resource: sanitizedTask
    };
    
    // Add request info if needed (for transaction bundles)
    if (includeRequest) {
      entry.request = {
        method: 'PUT',
        url: `Task/${sanitizedTask.id}`
      };
    }
    
    bundle.entry.push(entry);
  });
  
  return bundle;
}

/**
 * Converts tasks to NDJSON format
 * @param {Array} tasks - Array of task objects
 * @returns {String} NDJSON string with one task per line
 */
export function tasksToNdjson(tasks) {
  return tasks
    .map(task => JSON.stringify(sanitizeTaskForExport(task)))
    .join('\n');
}

/**
 * Sanitizes a task object for export to ensure FHIR compliance
 * @param {Object} task - The task object to sanitize
 * @returns {Object} A sanitized copy of the task
 */
export function sanitizeTaskForExport(task) {
  // Create a deep copy to avoid modifying the original
  const sanitizedTask = cloneDeep(task);
  
  // Ensure resourceType is set
  sanitizedTask.resourceType = 'Task';
  
  // Use id instead of _id for FHIR compliance
  if (sanitizedTask._id && !sanitizedTask.id) {
    sanitizedTask.id = sanitizedTask._id;
  }
  
  // Remove Meteor-specific fields
  delete sanitizedTask._id;
  delete sanitizedTask._document;
  
  // Format dates in ISO format if they exist
  if (sanitizedTask.authoredOn) {
    sanitizedTask.authoredOn = moment(sanitizedTask.authoredOn).toISOString();
  }
  
  if (sanitizedTask.lastModified) {
    sanitizedTask.lastModified = moment(sanitizedTask.lastModified).toISOString();
  }
  
  if (get(sanitizedTask, 'executionPeriod.start')) {
    set(sanitizedTask, 'executionPeriod.start', 
        moment(get(sanitizedTask, 'executionPeriod.start')).toISOString());
  }
  
  if (get(sanitizedTask, 'executionPeriod.end')) {
    set(sanitizedTask, 'executionPeriod.end', 
        moment(get(sanitizedTask, 'executionPeriod.end')).toISOString());
  }
  
  return sanitizedTask;
}

/**
 * Parses imported data and extracts FHIR Task resources
 * @param {String} data - The data to parse (JSON or NDJSON)
 * @returns {Array} Array of extracted task resources
 */
export function parseImportedData(data) {
  if (!data || !data.trim()) {
    return [];
  }
  
  let taskResources = [];
  
  try {
    // Check if it's NDJSON (contains newlines between JSON objects)
    if (data.includes('\n')) {
      // Process as NDJSON
      taskResources = data
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.warn('Failed to parse NDJSON line:', e);
            return null;
          }
        })
        .filter(resource => resource && resource.resourceType === 'Task');
    } else {
      // Process as JSON
      const parsedData = JSON.parse(data);
      
      // Check if it's a Bundle
      if (parsedData.resourceType === 'Bundle' && Array.isArray(parsedData.entry)) {
        // Extract resources from bundle
        taskResources = parsedData.entry
          .filter(entry => get(entry, 'resource.resourceType') === 'Task')
          .map(entry => entry.resource);
      } else if (parsedData.resourceType === 'Task') {
        // It's a single Task resource
        taskResources = [parsedData];
      }
    }
  } catch (error) {
    console.error('Error parsing imported data:', error);
    throw new Error(`Failed to parse data: ${error.message}`);
  }
  
  return taskResources;
}

/**
 * Prepares a task for insertion into the database
 * @param {Object} taskResource - FHIR Task resource
 * @param {String} userId - Current user ID
 * @returns {Object} Task object ready for database insertion
 */
export function prepareFhirTaskForDb(taskResource, userId) {
  // Create a new task object with required fields
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
    requester: userId,
    owner: taskResource.owner || userId,
    
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

  // Use the provided ID if it exists
  if (taskResource.id) {
    task.id = taskResource.id;
  }
  
  return task;
}

export default {
  tasksToFhirBundle,
  tasksToNdjson,
  sanitizeTaskForExport,
  parseImportedData,
  prepareFhirTaskForDb
};