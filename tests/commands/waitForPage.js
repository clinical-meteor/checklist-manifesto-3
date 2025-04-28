// tests/nightwatch/commands/waitForPage.js
/**
 * Waits for a specific page element to be visible
 * Migrated from original checklist-manifesto
 */
module.exports.command = function(pageId, timeout = 5000) {
  this
    .waitForElementVisible(pageId, timeout);

  return this; // allows the command to be chained.
};