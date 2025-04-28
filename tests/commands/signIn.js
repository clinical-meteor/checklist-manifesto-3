// tests/nightwatch/commands/signIn.js
/**
 * Signs in a user with provided credentials
 * Migrated from original checklist-manifesto
 */
module.exports.command = function(email, password) {
  // Navigate to login page if not already there
  this.url(function(result) {
    if (!result.value.includes('/login')) {
      this.navigate(this.launchUrl + '/login');
    }
  });

  // Wait for login form
  this.waitForElementVisible('form', 5000);

  // Fill in credentials
  if (email) {
    this
      .setValue('input[name="username"]', email);
  }

  if (password) {
    this
      .setValue('input[name="password"]', password);
  }

  // Submit the form
  this
    .click('button[type="submit"]')
    .pause(1000); // Wait for login to complete

  return this; // allows the command to be chained.
};