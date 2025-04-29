#!/usr/bin/env node

/**
 * This script updates the download URL in the Hero component
 * to point to the latest GitHub release asset.
 * 
 * Usage:
 *   node scripts/update-release-url.js <version> <filename>
 * 
 * Example:
 *   node scripts/update-release-url.js 1.0.0 checklist-manifesto-v1.0.0.zip
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const version = process.argv[2];
const filename = process.argv[3];

if (!version || !filename) {
  console.error('Usage: node update-release-url.js <version> <filename>');
  process.exit(1);
}

// Path to Hero component
const heroPath = path.join(__dirname, '../docs/src/components/Hero.jsx');

try {
  // Read the current file
  let content = fs.readFileSync(heroPath, 'utf8');
  
  // Replace the DOWNLOAD_URL constant
  const newUrl = `https://github.com/clinical-meteor/checklist-manifesto-3/releases/download/v${version}/${filename}`;
  content = content.replace(
    /const DOWNLOAD_URL = ".*";/,
    `const DOWNLOAD_URL = "${newUrl}";`
  );
  
  // Replace the "Current Version" text
  content = content.replace(
    /Current Version: [0-9]+\.[0-9]+\.[0-9]+/,
    `Current Version: ${version}`
  );
  
  // Write back to the file
  fs.writeFileSync(heroPath, content);
  
  console.log(`✅ Updated download URL to: ${newUrl}`);
} catch (error) {
  console.error('❌ Error updating download URL:', error);
  process.exit(1);
}