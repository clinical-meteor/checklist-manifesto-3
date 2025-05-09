module.exports = {
  includeMongo: true,
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
  builderOptions: {
    electronVersion: "25.4.0",
    npmSkipBuildFromSource: true
  }
};