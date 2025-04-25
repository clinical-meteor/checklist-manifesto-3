// tests/main.js
import { Meteor } from 'meteor/meteor';
import assert from 'assert';

// Import all tests
import './tasks.test.js';

// Example check in the main test file
describe('checklist-manifesto', function() {
  it('package.json has correct name', async function() {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'checklist-manifesto');
  });

  if (Meteor.isClient) {
    it('client is not server', function() {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it('server is not client', function() {
      assert.strictEqual(Meteor.isClient, false);
    });
  }
});