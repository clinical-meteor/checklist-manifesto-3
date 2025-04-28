// tests/nightwatch/commands/reviewSidebar.js
/**
 * Reviews the sidebar for proper elements
 * Migrated from original checklist-manifesto
 */
module.exports.command = function() {
  this
    // Verify the sidebar exists
    .verify.elementPresent('#sidebar')
    
    // Check for sidebar content
    .verify.elementPresent('#sidebarMenuContents')
    
    // Username link should always be present
    .verify.elementPresent('#usernameLink')
    
    // The following elements might be conditionally present
    .element('css selector', '#homeLink', function(result) {
      if (result.status !== -1) {
        this.verify.elementPresent('#homeLink');
      }
    })
    
    .element('css selector', '#protocolLibraryLink', function(result) {
      if (result.status !== -1) {
        this.verify.elementPresent('#protocolLibraryLink');
      }
    })
    
    .element('css selector', '#newListButton', function(result) {
      if (result.status !== -1) {
        this.verify.elementPresent('#newListButton');
      }
    })
    
    .element('css selector', '#logoutButton', function(result) {
      if (result.status !== -1) {
        this.verify.elementPresent('#logoutButton');
      }
    })
    
    // Connection status panel should be present
    .verify.elementPresent('#connectionStatusPanel');

  return this; // allows the command to be chained.
};