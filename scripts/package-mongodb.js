/**
 * MongoDB packager for Meteor Desktop
 * 
 * This script handles downloading and packaging MongoDB binaries
 * for inclusion with your desktop app.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { createWriteStream, mkdirSync, existsSync } = require('fs');

// For extracting tarballs
let extract;
try {
  extract = require('tar').extract;
} catch (e) {
  console.warn('tar package not found, will use system tar command for extraction');
}

// Configuration
const config = {
  // MongoDB version to download
  mongoVersion: '6.0.5',
  
  // Platform-specific download URLs and binary paths
  platforms: {
    win32: {
      arch: 'x64',
      url: (version) => `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${version}.zip`,
      binPath: 'bin/mongod.exe',
      extractCommand: (zipFile, outputDir) => `unzip -q ${zipFile} -d ${outputDir}`
    },
    darwin: {
      arch: 'x64',
      url: (version) => `https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${version}.tgz`,
      binPath: 'bin/mongod',
      extractCommand: (tarFile, outputDir) => `tar -xzf ${tarFile} -C ${outputDir}`
    },
    linux: {
      arch: 'x64',
      url: (version) => `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${version}.tgz`,
      binPath: 'bin/mongod',
      extractCommand: (tarFile, outputDir) => `tar -xzf ${tarFile} -C ${outputDir}`
    }
  },
  
  // Output directory structure
  outputBase: path.join(__dirname, 'mongodb-binaries'),
  getOutputDir: (platform) => path.join(__dirname, 'mongodb-binaries', platform)
};

/**
 * Download a file from a URL to a local path
 * @param {string} url - URL to download
 * @param {string} outputPath - Local file path to save to
 * @returns {Promise} - Resolves when download is complete
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url} to ${outputPath}`);
    const file = createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

/**
 * Extract an archive using system commands
 * @param {string} archiveFile - Path to the archive file
 * @param {string} outputDir - Directory to extract to
 * @param {string} command - Command to use for extraction
 * @returns {Promise} - Resolves when extraction is complete
 */
function extractArchive(archiveFile, outputDir, command) {
  return new Promise((resolve, reject) => {
    try {
      execSync(command, { stdio: 'inherit' });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Download and package MongoDB for the specified platform
 * @param {string} platform - Platform to package for (win32, darwin, linux)
 */
async function packageMongoForPlatform(platform) {
  const platformConfig = config.platforms[platform];
  if (!platformConfig) {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }
  
  console.log(`Packaging MongoDB ${config.mongoVersion} for ${platform}...`);
  
  const outputDir = config.getOutputDir(platform);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  const mongoUrl = platformConfig.url(config.mongoVersion);
  const downloadPath = path.join(outputDir, path.basename(mongoUrl));
  
  // Download MongoDB
  console.log(`Downloading MongoDB from ${mongoUrl}...`);
  try {
    await downloadFile(mongoUrl, downloadPath);
    console.log('Download complete');
  } catch (err) {
    console.error(`Failed to download MongoDB: ${err.message}`);
    return;
  }
  
  // Extract the archive
  console.log('Extracting MongoDB...');
  try {
    if (platformConfig.extractCommand) {
      const extractCmd = platformConfig.extractCommand(downloadPath, outputDir);
      console.log(`Executing: ${extractCmd}`);
      await extractArchive(downloadPath, outputDir, extractCmd);
    } else {
      console.error('No extraction command specified');
      return;
    }
  } catch (err) {
    console.error(`Failed to extract MongoDB: ${err.message}`);
    return;
  }
  
  // Find the extracted directory
  console.log('Finding extracted directory...');
  const files = fs.readdirSync(outputDir);
  const extractedDir = files.find(file => 
    file.startsWith('mongodb-') && 
    fs.statSync(path.join(outputDir, file)).isDirectory()
  );
  
  if (!extractedDir) {
    console.error('Could not find extracted MongoDB directory');
    console.log('Files in output directory:', files);
    return;
  }
  
  console.log(`Found extracted directory: ${extractedDir}`);
  
  // Copy MongoDB binaries to their final location
  const mongoDBinPath = path.join(outputDir, extractedDir, platformConfig.binPath);
  const finalDir = path.join(config.outputBase, platform);
  const finalBinPath = path.join(finalDir, 'mongod' + (platform === 'win32' ? '.exe' : ''));
  
  // Create the destination directory
  if (!existsSync(finalDir)) {
    mkdirSync(finalDir, { recursive: true });
  }
  
  // Copy the binary
  try {
    console.log(`Copying MongoDB binary from ${mongoDBinPath} to ${finalBinPath}`);
    fs.copyFileSync(mongoDBinPath, finalBinPath);
    fs.chmodSync(finalBinPath, 0o755); // Make executable
    console.log(`MongoDB binary for ${platform} copied to ${finalBinPath}`);
  } catch (err) {
    console.error(`Failed to copy MongoDB binary: ${err.message}`);
    console.error('Error details:', err);
    return;
  }
  
  // Clean up
  try {
    fs.unlinkSync(downloadPath);
    console.log('Temporary download file deleted');
  } catch (err) {
    console.warn(`Warning: Failed to delete temporary download file: ${err.message}`);
  }
}

/**
 * Main function to package MongoDB for all platforms
 */
async function packageMongoDB() {
  console.log('Starting MongoDB packaging process...');
  
  // Create base output directory
  if (!existsSync(config.outputBase)) {
    mkdirSync(config.outputBase, { recursive: true });
  }
  
  // Package for each platform
  const platforms = Object.keys(config.platforms);
  for (const platform of platforms) {
    await packageMongoForPlatform(platform);
  }
  
  console.log('MongoDB packaging complete!');
}

// Run the packaging process
packageMongoDB().catch(err => {
  console.error('An error occurred during packaging:', err);
  process.exit(1);
});