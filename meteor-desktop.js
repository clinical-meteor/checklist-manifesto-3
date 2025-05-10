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
    
    // Optional: configure app name and metadata
    appId: "com.meteor.checklistmanifesto",
    productName: "Checklist Manifesto",
    copyright: "© 2025 Your Name"
  },
  
  // App configuration
  meteor: {
    // Disable hot code push for desktop app
    disableDesktopHCP: true
  },
  
  // Window settings
  desktopHCP: true,
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
  
  // Development settings
  devTools: true,
  
  // Custom settings for your app
  meteorSettings: {
    // These settings will be available in your app via Meteor.settings
    public: {
      // Public settings (available on client)
      isDesktop: true
    },
    // Private settings (server-only)
    isDesktop: true,
    mongodb: {
      port: 27018
    }
  }
};