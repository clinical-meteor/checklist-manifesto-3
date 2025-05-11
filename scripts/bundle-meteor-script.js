/**
 * Meteor bundler for Desktop apps
 * 
 * This script creates a standalone Node.js bundle of your Meteor app
 * that can be run inside an Electron application without requiring
 * an external Meteor server.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Output directory for the bundle
  outputDir: path.join(__dirname, '..', 'meteor-bundle'),
  
  // Architecture to build for
  architecture: 'os.linux.x86_64',
  
  // Meteor settings for the bundled app
  meteorSettings: {
    "public": {
      "isDesktop": true
    },
    "private": {
      "desktopMode": true
    }
  }
};

/**
 * Create a Meteor bundle for use in desktop app
 */
function bundleMeteorApp() {
  console.log('Creating Meteor bundle for desktop app...');
  
  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Create a temporary build directory
  const tmpBuildDir = path.join(config.outputDir, 'tmp-build');
  if (fs.existsSync(tmpBuildDir)) {
    console.log('Cleaning up previous build directory...');
    fs.rmSync(tmpBuildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpBuildDir, { recursive: true });
  
  // Build the Meteor app
  console.log('Building Meteor app...');
  try {
    execSync(`meteor build --directory ${tmpBuildDir} --server-only --architecture ${config.architecture}`, {
      stdio: 'inherit'
    });
    console.log('Meteor build completed');
  } catch (err) {
    console.error('Failed to build Meteor app:', err.message);
    process.exit(1);
  }
  
  // Find the bundle directory
  const bundleDir = path.join(tmpBuildDir, 'bundle');
  if (!fs.existsSync(bundleDir)) {
    console.error('Bundle directory not found after build');
    process.exit(1);
  }
  
  // Copy the bundle to the final location
  const finalBundleDir = path.join(config.outputDir, 'bundle');
  if (fs.existsSync(finalBundleDir)) {
    console.log('Removing existing bundle directory...');
    fs.rmSync(finalBundleDir, { recursive: true, force: true });
  }
  
  console.log('Copying bundle to final location...');
  copyDirectory(bundleDir, finalBundleDir);
  
  // Install npm dependencies in the server directory
  console.log('Installing npm dependencies...');
  try {
    execSync('npm install --production', {
      cwd: path.join(finalBundleDir, 'programs', 'server'),
      stdio: 'inherit'
    });
    console.log('npm dependencies installed');
  } catch (err) {
    console.error('Failed to install npm dependencies:', err.message);
    process.exit(1);
  }
  
  // Create a main.js file that will be the entry point for the Electron app
  console.log('Creating main.js entry point...');
  const mainJsContent = `
// Entry point for Meteor app in Electron
const path = require('path');
const fs = require('fs');

// Important: Setup environment variables for Meteor
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27018/meteor';
process.env.ROOT_URL = process.env.ROOT_URL || 'http://localhost:3000';
process.env.PORT = process.env.PORT || '3000';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.DISABLE_WEBSOCKETS = '0'; // Enable WebSockets!
process.env.METEOR_DISABLE_AUTO_RELOAD = '1'; // Disable auto reload
process.env.METEOR_DISABLE_LIVE_RELOAD = '1'; // Disable live reload

// If there are Meteor settings, load them
if (process.env.METEOR_SETTINGS) {
  try {
    const settings = JSON.parse(process.env.METEOR_SETTINGS);
    if (settings) {
      console.log('Loaded Meteor settings from environment variable');
    }
  } catch (e) {
    console.error('Error parsing METEOR_SETTINGS environment variable', e);
  }
} else {
  // Load from settings.json if available
  const settingsPath = path.join(__dirname, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = fs.readFileSync(settingsPath, 'utf8');
      process.env.METEOR_SETTINGS = settings;
      console.log('Loaded Meteor settings from settings.json');
    } catch (e) {
      console.error('Error loading settings.json:', e);
    }
  }
}

// Override WebSocket behavior for desktop
process.env.METEOR_SERVER_WEBSOCKET_ENDPOINTS = 'ws://localhost:3000/websocket';

// Important for Meteor 2.0+
process.chdir(path.join(__dirname, 'bundle'));

// Start the Meteor app
require('./bundle/main.js');
`;

  fs.writeFileSync(path.join(config.outputDir, 'main.js'), mainJsContent);
  
  // Copy settings.json file
  if (Object.keys(config.meteorSettings).length > 0) {
    console.log('Creating settings.json file...');
    fs.writeFileSync(
      path.join(config.outputDir, 'settings.json'),
      JSON.stringify(config.meteorSettings, null, 2)
    );
  }
  
  // Clean up temporary build directory
  console.log('Cleaning up temporary build files...');
  fs.rmSync(tmpBuildDir, { recursive: true, force: true });
  
  console.log('Meteor bundle for desktop successfully created at:', config.outputDir);
}

/**
 * Helper function to copy a directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Get all files and subdirectories in the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectory(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run the bundling process
bundleMeteorApp();

// Explicitly exit after completion
console.log('Bundle script completed successfully, exiting process.');
process.exit(0);