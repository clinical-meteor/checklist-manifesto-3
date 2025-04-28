// tests/nightwatch/commands/reviewMainLayout.js
/**
 * Reviews the main application layout for proper structure
 * Migrated from original checklist-manifesto
 */
module.exports.command = function() {
  this
    // Verify the main app structure
    .verify.elementPresent("body")
    .verify.elementPresent("#root")
    
    // Check header elements
    .verify.elementPresent('header')
    .verify.elementPresent('#headerTitle')
    
    // Check main content area
    .verify.elementPresent('main')
    
    // If we're signed in, there should be user-related elements
    .element('css selector', '#usernameLink', function(result) {
      if (result.status !== -1) {
        // Element exists
        this.verify.elementPresent('#usernameLink');
      }
    });

  return this; // allows the command to be chained.
};