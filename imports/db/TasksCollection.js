// imports/db/TasksCollection.js
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// FHIR Task resource schema:
// https://www.hl7.org/fhir/task.html
export const TasksCollection = new Mongo.Collection('tasks');

// Define schema based on FHIR Task resource with simplified properties
const taskSchema = {
  resourceType: { type: String, defaultValue: 'Task' },
  identifier: { type: Array, optional: true },
  'identifier.$': { type: Object, optional: true },
  'identifier.$.system': { type: String, optional: true },
  'identifier.$.value': { type: String, optional: true },
  status: {
    type: String,
    allowedValues: [
      'draft', 'requested', 'received', 'accepted', 'rejected',
      'ready', 'cancelled', 'in-progress', 'on-hold', 'failed', 'completed', 'entered-in-error'
    ],
    defaultValue: 'draft'
  },
  description: { type: String, optional: true },
  focus: { type: String, optional: true }, 
  for: { type: String, optional: true }, // Reference to a patient or subject
  authoredOn: { type: Date, defaultValue: new Date() },
  lastModified: { type: Date, defaultValue: new Date() },
  requester: { type: String, optional: true }, // User who created the task
  owner: { type: String, optional: true }, // User assigned to complete the task
  note: { type: Array, optional: true },
  'note.$': { type: Object, optional: true },
  'note.$.text': { type: String, optional: true },
  'note.$.time': { type: Date, optional: true },
  'note.$.authorId': { type: String, optional: true },
  priority: {
    type: String, 
    allowedValues: ['routine', 'urgent', 'asap', 'stat'],
    defaultValue: 'routine'
  },
  executionPeriod: { type: Object, optional: true },
  'executionPeriod.start': { type: Date, optional: true },
  'executionPeriod.end': { type: Date, optional: true },
  isDeleted: { type: Boolean, defaultValue: false },
  
  // Custom fields for app functionality
  listId: { type: String, optional: true }, // Reference to the list this task belongs to
  public: { type: Boolean, optional: true }, // Whether this task is publicly viewable
  ordinal: { type: Number, optional: true }, // Order within the list
  partOf: { type: Object, optional: true },
  'partOf.reference': { type: String, optional: true },
  'partOf.display': { type: String, optional: true },
  isTemplate: { type: Boolean, optional: true }, // Whether this is a protocol template
  source: { type: String, optional: true } // Reference to original task if cloned
};

// Initialize collection with schema
if (Meteor.isServer) {
  // Create indexes for efficient queries
  Meteor.startup(function() {
    TasksCollection.createIndex({ requester: 1 });
    TasksCollection.createIndex({ owner: 1 });
    TasksCollection.createIndex({ status: 1 });
    TasksCollection.createIndex({ isDeleted: 1 });
    TasksCollection.createIndex({ priority: 1 });
    TasksCollection.createIndex({ 'executionPeriod.end': 1 });
    TasksCollection.createIndex({ listId: 1 });
    TasksCollection.createIndex({ public: 1 });
    TasksCollection.createIndex({ ordinal: 1 });
    TasksCollection.createIndex({ 'partOf.reference': 1 });
    TasksCollection.createIndex({ isTemplate: 1 });
  });
}

export const getTaskStatus = function(task) {
  return get(task, 'status', 'unknown');
};

export const isTaskCompleted = function(task) {
  return get(task, 'status') === 'completed';
};

export const formatTaskDate = function(task, dateField = 'authoredOn') {
  const date = get(task, dateField);
  return date ? moment(date).format('MMM D, YYYY h:mm A') : 'Unknown';
};

export default TasksCollection;