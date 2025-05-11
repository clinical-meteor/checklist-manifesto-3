// meteor-desktop.js - Updated configuration
module.exports = {
  // Include MongoDB package in the build
  includeMongo: true,
  
  // Specify where to find MongoDB binaries
  prepackaged: {
    mongodb: {
      path: "mongodb-binaries",
      platforms: {
        win32: "mongodb-binaries/win32",
        darwin: "mongodb-binaries/darwin",
        linux: "mongodb-binaries/linux"
      }
    }
  },
  
  // Bundler configuration
  builderOptions: {
    electronVersion: "25.4.0",
    npmSkipBuildFromSource: true,
    
    // Define how to extract MongoDB files from the ASAR archive
    extraFiles: [
      {
        "from": "mongodb-binaries/",
        "to": "mongodb-binaries/",
        "filter": ["**/*"]
      }
    ],
    
    // Application configuration
    appId: "com.meteor.checklistmanifesto",
    productName: "Checklist Manifesto",
    copyright: "© 2025 Abbie Watson"
  },
  
  // Critical: Enable desktop HCP for offline updates
  desktopHCP: true,
  
  // We're bundling our own server, so disable the need for connecting to Meteor dev server
  meteor: {
    // Make sure HCP works for desktop
    disableDesktopHCP: false
  },
  
  // Window settings
  window: {
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    title: "Checklist Manifesto",
    titleBarStyle: "default",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  },
  
  // Enable devTools in development
  devTools: true,
  
  // Custom settings for your app - passed to Meteor
  meteorSettings: {
    // Public settings (available on client)
    public: {
      isDesktop: true
    },
    // Private settings (server-only)
    isDesktop: true,
    mongodb: {
      port: 27018
    }
  },
  
  // Port configuration - where Meteor server should run
  port: 3000,
  mongoPort: 27018
};