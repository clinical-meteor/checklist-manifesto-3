# Checklist Manifesto - Desktop Installation Guide

This guide explains how to package Checklist Manifesto as a standalone desktop application using Electron, with integrated MongoDB and Meteor server.

## Prerequisites

- Node.js (v14+)
- Meteor (v3.0+)
- meteor-desktop package installed: `meteor npm install -D @meteor-community/meteor-desktop`
- MongoDB (for development only)

## High-Level Process

1. Package MongoDB binaries
2. Create a standalone Meteor bundle
3. Update desktop configuration
4. Build and package the desktop app

## Step 1: Package MongoDB Binaries

MongoDB is packaged with the app to allow offline operation without requiring a separate MongoDB installation.

### Instructions:

1. Create a scripts directory (if it doesn't exist):
   ```bash
   mkdir -p scripts
   ```

2. Create the MongoDB packaging script at `scripts/package-mongodb.js`:
   - Copy the MongoDB packaging script from the provided artifacts
   - The script downloads and packages MongoDB v6.0.5 for all platforms

3. Run the script:
   ```bash
   node scripts/package-mongodb.js
   ```

4. Verify the script created the following directory structure:
   ```
   mongodb-binaries/
   ├── darwin/
   │   └── mongod     # macOS binary
   ├── linux/
   │   └── mongod     # Linux binary
   └── win32/
       └── mongod.exe # Windows binary
   ```

5. Make sure the binaries have executable permissions:
   ```bash
   chmod +x scripts/mongodb-binaries/darwin/mongod*
   chmod +x scripts/mongodb-binaries/linux/mongod*
   ```

## Step 2: Create a Standalone Meteor Bundle

Create a standalone version of your Meteor app that can run inside Electron.

### Instructions:

1. Create the Meteor bundling script at `scripts/bundle-meteor-script.js`:
   - Copy the Meteor bundling script from the provided artifacts

2. Run the script:
   ```bash
   node scripts/bundle-meteor-script.js
   ```

3. Verify the script created the directory structure:
   ```
   meteor-bundle/
   ├── bundle/        # Meteor app bundle
   │   ├── main.js    # Original main.js from Meteor
   │   ├── programs/  # Meteor app programs
   │   └── ...
   ├── main.js        # Custom entry point for Electron
   └── settings.json  # Meteor settings for the desktop app
   ```

## Step 3: Update Desktop Configuration

Configure meteor-desktop to include the MongoDB binaries and Meteor bundle.

### Instructions:

1. Update your `meteor-desktop.js` file to match the provided configuration:
   - Copy the updated meteor-desktop.js from the provided artifacts

2. Key points in the configuration:
   - `includeMongo: true` - Flag to include MongoDB
   - `prepackaged.mongodb.path` - Path to MongoDB binaries directory
   - `prepackaged.mongodb.platforms` - Platform-specific paths
   - `extraFiles` - Configuration for including files outside the ASAR archive
   - `desktopHCP: true` - Enable Hot Code Push for desktop
   - `window.webPreferences` - Configure Electron window settings

## Step 4: Update Desktop Integration Code

Improve the desktop integration code to handle server startup and diagnostics.

### Instructions:

1. Update `.desktop/desktop.js` with the enhanced version:
   - Copy the enhanced desktop.js from the provided artifacts
   - This file contains improved MongoDB/Meteor startup logic
   - Enhanced error handling and diagnostics

2. Key enhancements include:
   - Better path discovery for MongoDB and Meteor binaries
   - Detailed logging to help diagnose issues
   - Debug menu for manual server control
   - Improved error dialogs with detailed information

## Step 5: Build the Desktop App

Build the desktop application with integrated MongoDB and Meteor server.

### Instructions:

1. Run the Meteor Desktop build command:
   ```bash
   # For development/testing
   meteor npm run desktop -- build
   
   # For production (optimized and minified)
   meteor npm run desktop -- build --production
   ```

2. Package the app for your platform:
   ```bash
   # For macOS
   meteor npm run desktop -- build-installer --mac
   
   # For Windows
   meteor npm run desktop -- build-installer --win
   
   # For Linux
   meteor npm run desktop -- build-installer --linux
   ```

3. The packaged application will be in the `.desktop-installer` directory

## Step 6: Testing the Desktop App

Test the desktop application to ensure it works correctly.

### Instructions:

1. Run the packaged application

2. Check the logs for startup information:
   - macOS: `~/Library/Logs/ChecklistManifestoApp/checklist-manifesto.log`
   - Windows: `%USERPROFILE%\AppData\Roaming\ChecklistManifestoApp\logs\checklist-manifesto.log`
   - Linux: `~/.config/ChecklistManifestoApp/logs/checklist-manifesto.log`

3. Use the debug menu (right-click anywhere) for diagnostic tools:
   - "Start/Restart Server" - Manually restart the MongoDB and Meteor servers
   - "Check File System" - Verify binary locations
   - "Show Logs" - Open the log file
   - "Reload UI" - Reload the application window

## Troubleshooting

### MongoDB Binary Not Found

If the app cannot find the MongoDB binary:

1. Verify the MongoDB binaries exist in the expected location
2. Check that the binaries have executable permissions
3. Check the log file for the paths being searched
4. Use the debug menu to manually check the file system

### Meteor Bundle Not Found

If the app cannot find the Meteor bundle:

1. Verify the Meteor bundle exists in the expected location
2. Check the log file for the paths being searched
3. Ensure the bundle has a main.js file and the bundle directory

### Connection Issues

If the app starts but shows "Connecting to server..." indefinitely:

1. Use the debug menu to manually restart the server
2. Check the logs for any MongoDB or Meteor startup errors
3. Verify network settings - the app should connect to localhost:3000

### File Permissions

If you see permission errors:

1. Ensure MongoDB binaries have executable permissions:
   ```bash
   chmod +x mongodb-binaries/darwin/mongod
   chmod +x mongodb-binaries/linux/mongod
   ```

2. Check that the app has permission to write to its data directory:
   - macOS: `~/Library/Application Support/ChecklistManifestoApp`
   - Windows: `%APPDATA%\ChecklistManifestoApp`
   - Linux: `~/.config/ChecklistManifestoApp`

## Additional Resources

- Debug tools are available via right-click menu or Debug menu (Mac)
- The app stores data in:
  - macOS: `~/Library/Application Support/ChecklistManifestoApp`
  - Windows: `%APPDATA%\ChecklistManifestoApp`
  - Linux: `~/.config/ChecklistManifestoApp`
- MongoDB data is stored in: `[App Data Path]/mongodb-data`

## Frequently Asked Questions

**Q: Why use integrated MongoDB instead of the system MongoDB?**
A: Integrating MongoDB provides a seamless offline experience without requiring users to install and configure MongoDB separately.

**Q: Can I connect to the app's internal MongoDB from outside the app?**
A: Yes, the MongoDB server listens on port 27018 by default. You can connect to it using standard MongoDB tools.

**Q: How do I update the app after initial deployment?**
A: Rebuild and repackage the app using the steps above, then distribute the new installer.

**Q: Can I customize the ports used by MongoDB and Meteor?**
A: Yes, you can change the ports in the `meteor-desktop.js` configuration:
```javascript
{
  // ...
  port: 3000,       // Meteor port
  mongoPort: 27018  // MongoDB port
}
```