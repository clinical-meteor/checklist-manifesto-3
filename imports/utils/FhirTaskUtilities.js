// imports/utils/FhirTaskUtilities.js
import { get, set, has } from 'lodash';
import moment from 'moment';

/**
 * Utility functions for working with FHIR Task resources
 */
export const FhirTaskUtilities = {
  /**
   * Get a user-friendly display of task status
   * @param {Object} task - The task object
   * @returns {Object} Status display information
   */
  getStatusInfo(task) {
    const statusValue = get(task, 'status', 'unknown');
    
    const statusMap = {
      'draft': { color: 'default', label: 'Draft' },
      'requested': { color: 'info', label: 'Requested' },
      'received': { color: 'info', label: 'Received' },
      'accepted': { color: 'info', label: 'Accepted' },
      'rejected': { color: 'error', label: 'Rejected' },
      'ready': { color: 'warning', label: 'Ready' },
      'cancelled': { color: 'error', label: 'Cancelled' },
      'in-progress': { color: 'primary', label: 'In Progress' },
      'on-hold': { color: 'warning', label: 'On Hold' },
      'failed': { color: 'error', label: 'Failed' },
      'completed': { color: 'success', label: 'Completed' },
      'entered-in-error': { color: 'error', label: 'Error' },
      'unknown': { color: 'default', label: 'Unknown' }
    };

    return statusMap[statusValue] || { color: 'default', label: statusValue };
  },
  
  /**
   * Get a user-friendly display of task priority
   * @param {Object} task - The task object
   * @returns {Object} Priority display information
   */
  getPriorityInfo(task) {
    const priorityValue = get(task, 'priority', 'routine');
    
    const priorityMap = {
      'routine': { color: 'success', label: 'Routine' },
      'urgent': { color: 'error', label: 'Urgent' },
      'asap': { color: 'warning', label: 'ASAP' },
      'stat': { color: 'error', label: 'STAT' }
    };

    return priorityMap[priorityValue] || { color: 'default', label: priorityValue };
  },
  
  /**
   * Check if a task is overdue
   * @param {Object} task - The task object
   * @returns {Boolean} True if task is overdue
   */
  isTaskOverdue(task) {
    const dueDate = get(task, 'executionPeriod.end');
    if (!dueDate) return false;
    
    // Task is overdue if due date is in the past and task is not completed or cancelled
    return moment(dueDate).isBefore(moment()) && 
      !['completed', 'cancelled', 'entered-in-error'].includes(get(task, 'status'));
  },
  
  /**
   * Check if a task is completed
   * @param {Object} task - The task object
   * @returns {Boolean} True if task is completed
   */
  isTaskCompleted(task) {
    return get(task, 'status') === 'completed';
  },
  
  /**
   * Format the task due date for display
   * @param {Object} task - The task object
   * @param {String} format - Date format string for moment.js
   * @returns {String} Formatted date string
   */
  formatDueDate(task, format = 'MMM D, YYYY') {
    const dueDate = get(task, 'executionPeriod.end');
    if (!dueDate) return '';
    
    return moment(dueDate).format(format);
  },
  
  /**
   * Convert a task object to a FHIR-compliant Task resource
   * @param {Object} task - The task object from database
   * @returns {Object} FHIR-compliant Task resource
   */
  toFhirResource(task) {
    // Create a deep copy to avoid modifying the original
    const fhirTask = { ...task };
    
    // Ensure resourceType is correct
    fhirTask.resourceType = 'Task';
    
    // Convert _id to id for FHIR compliance
    if (fhirTask._id && !fhirTask.id) {
      fhirTask.id = fhirTask._id;
      delete fhirTask._id;
    }
    
    // Remove any Meteor-specific fields
    delete fhirTask.isDeleted;
    
    // If requester is just a user ID, convert to a proper FHIR reference
    if (fhirTask.requester && typeof fhirTask.requester === 'string' && !fhirTask.requester.includes('/')) {
      fhirTask.requester = {
        reference: `Practitioner/${fhirTask.requester}`
      };
    }
    
    // If owner is just a user ID, convert to a proper FHIR reference
    if (fhirTask.owner && typeof fhirTask.owner === 'string' && !fhirTask.owner.includes('/')) {
      fhirTask.owner = {
        reference: `Practitioner/${fhirTask.owner}`
      };
    }
    
    // Format dates as ISO strings for FHIR compliance
    if (fhirTask.authoredOn) {
      fhirTask.authoredOn = moment(fhirTask.authoredOn).toISOString();
    }
    
    if (fhirTask.lastModified) {
      fhirTask.lastModified = moment(fhirTask.lastModified).toISOString();
    }
    
    // Format dates in executionPeriod
    if (has(fhirTask, 'executionPeriod.start')) {
      set(fhirTask, 'executionPeriod.start', 
          moment(get(fhirTask, 'executionPeriod.start')).toISOString());
    }
    
    if (has(fhirTask, 'executionPeriod.end')) {
      set(fhirTask, 'executionPeriod.end', 
          moment(get(fhirTask, 'executionPeriod.end')).toISOString());
    }
    
    return fhirTask;
  },
  
  /**
   * Convert a FHIR Task resource to our internal task format
   * @param {Object} fhirTask - FHIR Task resource
   * @param {String} userId - Current user ID
   * @returns {Object} Internal task format
   */
  fromFhirResource(fhirTask, userId) {
    // Create a deep copy to avoid modifying the original
    const task = { ...fhirTask };
    
    // Use FHIR id as _id if available
    if (task.id && !task._id) {
      task._id = task.id;
      delete task.id;
    }
    
    // Ensure dates are Date objects, not strings
    if (typeof task.authoredOn === 'string') {
      task.authoredOn = new Date(task.authoredOn);
    } else if (!task.authoredOn) {
      task.authoredOn = new Date();
    }
    
    if (typeof task.lastModified === 'string') {
      task.lastModified = new Date(task.lastModified);
    } else {
      task.lastModified = new Date();
    }
    
    // Convert dates in executionPeriod
    if (has(task, 'executionPeriod.start') && typeof get(task, 'executionPeriod.start') === 'string') {
      set(task, 'executionPeriod.start', new Date(get(task, 'executionPeriod.start')));
    }
    
    if (has(task, 'executionPeriod.end') && typeof get(task, 'executionPeriod.end') === 'string') {
      set(task, 'executionPeriod.end', new Date(get(task, 'executionPeriod.end')));
    }
    
    // Extract requester from reference if needed
    if (has(task, 'requester.reference')) {
      const reference = get(task, 'requester.reference');
      if (reference.startsWith('Practitioner/')) {
        task.requester = reference.replace('Practitioner/', '');
      }
    } else if (!task.requester) {
      task.requester = userId;
    }
    
    // Extract owner from reference if needed
    if (has(task, 'owner.reference')) {
      const reference = get(task, 'owner.reference');
      if (reference.startsWith('Practitioner/')) {
        task.owner = reference.replace('Practitioner/', '');
      }
    }
    
    // Set isDeleted flag to false by default
    task.isDeleted = false;
    
    return task;
  }
};

export default FhirTaskUtilities;