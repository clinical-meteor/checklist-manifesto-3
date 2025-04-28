// imports/db/ListsCollection.js
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

export const ListsCollection = new Mongo.Collection('lists');

// Define schema based on FHIR-inspired structure with some customizations
// for checklist functionality
const listSchema = {
  resourceType: { type: String, defaultValue: 'List' },
  identifier: { type: Array, optional: true },
  'identifier.$': { type: Object, optional: true },
  'identifier.$.system': { type: String, optional: true },
  'identifier.$.value': { type: String, optional: true },
  status: {
    type: String,
    allowedValues: [
      'draft', 'active', 'retired', 'entered-in-error'
    ],
    defaultValue: 'active'
  },
  mode: {
    type: String,
    allowedValues: ['working', 'snapshot', 'changes'],
    defaultValue: 'working'
  },
  title: { type: String },
  description: { type: String, optional: true },
  // For compatibility with the original app
  name: { type: String, optional: true },
  note: { type: Array, optional: true },
  'note.$': { type: Object, optional: true },
  'note.$.text': { type: String },
  'note.$.time': { type: Date, defaultValue: new Date() },
  'note.$.authorId': { type: String, optional: true },
  // Extra fields for app functionality
  source: { type: String, optional: true }, // Reference to original list if cloned
  incompleteCount: { type: Number, defaultValue: 0 },
  public: { type: Boolean, defaultValue: false },
  createdAt: { type: Date, defaultValue: new Date() },
  lastModified: { type: Date, defaultValue: new Date() },
  userId: { type: String, optional: true }, // Creator/owner of the list
  isDeleted: { type: Boolean, defaultValue: false }
};

// Initialize collection with schema if on server
if (Meteor.isServer) {
  // Create indexes for efficient queries
  Meteor.startup(function() {
    ListsCollection.createIndex({ userId: 1 });
    ListsCollection.createIndex({ public: 1 });
    ListsCollection.createIndex({ status: 1 });
    ListsCollection.createIndex({ isDeleted: 1 });
    ListsCollection.createIndex({ 'identifier.value': 1 });
  });
}

// Helper functions

/**
 * Calculate a default name for a list in the form of 'List A'
 * @returns {String} Default list name
 */
export const getDefaultListName = function() {
  let nextLetter = 'A';
  let nextName = 'List ' + nextLetter;
  
  while (ListsCollection.findOne({ name: nextName, isDeleted: { $ne: true } })) {
    // Get next letter in alphabet
    nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    nextName = 'List ' + nextLetter;
  }

  return nextName;
};

/**
 * Create a new list with default values
 * @param {Object} options Optional settings for the new list
 * @returns {String} ID of the new list
 */
export const createNewList = function(options = {}) {
  if (!Meteor.userId()) {
    throw new Meteor.Error('not-authorized', 'You must be logged in to create a list');
  }
  
  const user = Meteor.user();
  const list = {
    resourceType: 'List',
    status: 'active',
    mode: 'working',
    title: options.title || getDefaultListName(),
    name: options.name || options.title || getDefaultListName(), // For backward compatibility
    description: options.description || '',
    incompleteCount: 0,
    public: options.public || false,
    createdAt: new Date(),
    lastModified: new Date(),
    userId: Meteor.userId(),
    isDeleted: false
  };
  
  // Add optional fields if provided
  if (options.source) {
    list.source = options.source;
  }
  
  return ListsCollection.insert(list);
};

export default ListsCollection;