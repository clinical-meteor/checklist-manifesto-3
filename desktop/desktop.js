/* eslint-disable no-unused-vars */
import process from 'process';
import { app, dialog, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import { promisify } from 'util';

/**
 * Entry point to your native desktop code.
 *
 * @class
 */
export default class Desktop {
    /**
     * @param {Object} log         - Winston logger instance
     * @param {Object} skeletonApp - reference to the skeleton app instance
     * @param {Object} appSettings - settings.json contents
     * @param {Object} eventsBus   - event emitter for listening or emitting events
     *                               shared across skeleton app and every module/plugin
     * @param {Object} modules     - references to all loaded modules
     * @param {Object} Module      - reference to the Module class
     * @constructor
     */
    constructor({
        log, skeletonApp, appSettings, eventsBus, modules, Module
    }) {
        // Store references
        this.log = log;
        this.skeletonApp = skeletonApp;
        this.appSettings = appSettings;
        this.eventsBus = eventsBus;
        this.meteorServer = null;
        this.mongoProcess = null;
        this.isServerReady = false;
        this.modulesRef = modules;
        this.Module = Module;
        
        // Create a desktop module for IPC
        const desktop = new Module('desktop');
        
        // Handle IPC from the web app
        desktop.on('closeApp', () => {
            this.stopProcesses();
            app.quit();
        });

        desktop.on('restartServer', async () => {
            this.log.info('Restarting server processes...');
            await this.stopProcesses();
            await this.startProcesses();
        });

        // We need to handle gracefully potential problems.
        // Lets remove the default handler and replace it with ours.
        skeletonApp.removeUncaughtExceptionListener();
        process.on('uncaughtException', this.uncaughtExceptionHandler.bind(this));

        // Create loading screen (replacing default)
        skeletonApp.createLoaderWindow = this.createLoaderWindow.bind(this);

        // Start server before window loads
        eventsBus.on('beforeLoadUrl', async () => {

          console.log('App data path:', app.getPath('userData'));
          console.log('Log path:', app.getPath('logs'));
          
          try {
            // Create test page
            const testPath = this.createTestPage();
            
            // Start processes in the background
            this.startProcesses().catch(err => {
                this.log.error('Failed to start processes:', err);
                console.error('Failed to start processes:', err);
            });
            
            // Load test page instead of Meteor app
            skeletonApp.setAppUrl('file://' + testPath);
            
            this.log.info('Loaded test page');
            console.log('Loaded test page');
          } catch (error) {
              log.error('Failed to create test page:', error);
              console.error('Failed to create test page:', error);
          }


            // try {
            //     // Show a proper loading message
            //     this.updateLoadingStatus('Starting server...');
                
            //     // Start MongoDB and Meteor server
            //     await this.startProcesses();
                
            //     // Set the app URL to our local server
            //     this.isServerReady = true;
            //     skeletonApp.setAppUrl('http://localhost:3000');
                
            //     // Log success
            //     log.info('Local Meteor server started successfully');
            //     this.updateLoadingStatus('Server ready, starting application...');
            // } catch (error) {
            //     log.error('Failed to start server:', error);
            //     this.updateLoadingStatus(`Error: ${error.message}`, 'error');
                
            //     // Show error dialog
            //     setTimeout(() => {
            //         this.displayRestartDialog(
            //             'Server Error',
            //             'Failed to start application server.',
            //             error.message
            //         );
            //     }, 1000);
            // }
        });
        
        // Handle window events
        eventsBus.on('windowCreated', (window) => {
            window.webContents.on('crashed', this.windowCrashedHandler.bind(this));
            window.on('unresponsive', this.windowUnresponsiveHandler.bind(this));
        });
        
        // Handle window ready
        eventsBus.on('windowReady', () => {
            this.log.info('Main window ready, closing loader if exists');
            if (this.loaderWindow && !this.loaderWindow.isDestroyed()) {
                this.loaderWindow.close();
                this.loaderWindow = null;
            }
        });
        
        // Ensure clean shutdown
        app.on('will-quit', () => {
            this.stopProcesses();
        });
        
        // For development/debugging
        app.on('ready', () => {
            if (appSettings.devTools) {
                eventsBus.on('windowCreated', (window) => {
                    window.webContents.openDevTools();
                });
            }
        });

        console.log('App data path:', app.getPath('userData'));
        console.log('Log path:', app.getPath('logs'));
    }
    
    createTestPage() {
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Electron Test</title>
        </head>
        <body>
          <h1>Electron is working!</h1>
          <p>This is a test page to verify Electron is functioning correctly.</p>
          <button id="checkMongo">Check MongoDB</button>
          <button id="checkMeteor">Check Meteor</button>
          <div id="status"></div>
          
          <script>
            document.getElementById('checkMongo').addEventListener('click', async () => {
              try {
                const result = await fetch('http://localhost:27018');
                document.getElementById('status').innerHTML = 'MongoDB response: ' + result.status;
              } catch (err) {
                document.getElementById('status').innerHTML = 'MongoDB error: ' + err.message;
              }
            });
            
            document.getElementById('checkMeteor').addEventListener('click', async () => {
              try {
                const result = await fetch('http://localhost:3000');
                document.getElementById('status').innerHTML = 'Meteor response: ' + result.status;
              } catch (err) {
                document.getElementById('status').innerHTML = 'Meteor error: ' + err.message;
              }
            });
          </script>
        </body>
        </html>
      `;
      
      console.log('App data path:', app.getPath('userData'));
      console.log('Log path:', app.getPath('logs'));

      const testPath = path.join(app.getPath('temp'), 'electron-test.html');
      fs.writeFileSync(testPath, testHtml);
      return testPath;
    }

    /**
     * Create a custom loader window
     * 
     * @returns {BrowserWindow} - The loader window
     */
    createLoaderWindow() {
        // Get app icon path
        let iconPath = path.join(app.getAppPath(), 'icons', '128x128.png');
        if (process.platform === 'win32') {
            iconPath = path.join(app.getAppPath(), 'icons', 'win', 'icon.ico');
        } else if (process.platform === 'darwin') {
            iconPath = path.join(app.getAppPath(), 'icons', 'mac', 'icon.icns');
        }
        
        this.loaderWindow = new BrowserWindow({
            width: 400,
            height: 300,
            center: true,
            resizable: false,
            minimizable: false,
            maximizable: false,
            fullscreenable: false,
            show: false,
            frame: false,
            icon: iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // Create a simple HTML for the loader
        const loaderHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Starting Application</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f5f5f5;
                    color: #333;
                    overflow: hidden;
                }
                .logo {
                    width: 80px;
                    height: 80px;
                    margin-bottom: 20px;
                }
                h2 {
                    margin: 0 0 10px 0;
                }
                .status {
                    margin-top: 20px;
                    color: #666;
                }
                .spinner {
                    margin: 20px auto;
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-left-color: #315481;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                .error {
                    color: #e53935;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <img class="logo" src="${iconPath}" alt="App Logo">
            <h2>Starting Application</h2>
            <div class="spinner"></div>
            <div id="status" class="status">Initializing...</div>
            
            <script>
                // Listen for messages from the main process
                const { ipcRenderer } = require('electron');
                
                ipcRenderer.on('status-update', (event, data) => {
                    const statusEl = document.getElementById('status');
                    statusEl.textContent = data.message || "Loading app...";
                    
                    if (data.type === 'error') {
                        statusEl.classList.add('error');
                        document.querySelector('.spinner').style.display = 'none';
                    } else {
                        statusEl.classList.remove('error');
                        document.querySelector('.spinner').style.display = 'block';
                    }
                });
            </script>
        </body>
        </html>
        `;

        // Write the loader HTML to a temporary file
        const tempDir = app.getPath('temp');
        const loaderPath = path.join(tempDir, 'meteor-desktop-loader.html');
        fs.writeFileSync(loaderPath, loaderHtml);

        // Load the HTML file
        this.loaderWindow.loadFile(loaderPath);
        
        this.loaderWindow.once('ready-to-show', () => {
            this.loaderWindow.show();
        });
        
        return this.loaderWindow;
    }

    async checkServerConnection(url, serviceName) {
      this.log.info(`Checking ${serviceName} connection at ${url}...`);
      
      return new Promise((resolve) => {
          const req = require('http').get(url, (res) => {
              this.log.info(`${serviceName} responded with status: ${res.statusCode}`);
              resolve(true);
          });
          
          req.on('error', (err) => {
              this.log.error(`${serviceName} connection error: ${err.message}`);
              resolve(false);
          });
          
          req.setTimeout(5000, () => {
              req.abort();
              this.log.error(`${serviceName} connection timeout`);
              resolve(false);
          });
      });
    }
    
    /**
     * Update the loading status displayed to the user
     * 
     * @param {string} message - Status message to display
     * @param {string} type - Type of message (info, error)
     */
    updateLoadingStatus(message, type = 'info') {
        this.log.info(`Loader status: ${message}`);
        
        if (this.loaderWindow && !this.loaderWindow.isDestroyed() && this.loaderWindow.webContents) {
            this.loaderWindow.webContents.send('status-update', {
                message,
                type
            });
        }
    }
    
    /**
     * Starts MongoDB and Meteor server
     */
    async startProcesses() {
        this.log.info('Starting server processes...');
        
        // Create data directory
        const userDataPath = app.getPath('userData');
        const mongoDbPath = path.join(userDataPath, 'mongodb-data');
        
        if (!fs.existsSync(mongoDbPath)) {
            fs.mkdirSync(mongoDbPath, { recursive: true });
        }
        
        // Start MongoDB
        this.updateLoadingStatus('Starting database...');
        await this.startMongoDB(mongoDbPath);

        try {
          // Test MongoDB connection
          const { MongoClient } = require('mongodb');
          const client = new MongoClient(`mongodb://localhost:${mongoPort}`);
          await client.connect();
          this.log.info('Successfully connected to MongoDB');
          await client.close();
        } catch (err) {
            this.log.error(`Failed to connect to MongoDB: ${err.message}`);
            console.error(`Failed to connect to MongoDB: ${err.message}`);
        }
        
        // Start Meteor server
        this.updateLoadingStatus('Starting application server...');
        await this.startMeteorServer();

        // Check the connection
        const meteorReachable = await this.checkServerConnection('http://localhost:3000', 'Meteor');
        if (!meteorReachable) {
            this.log.error('Meteor server is not reachable after startup');
        } else {
            this.log.info('Meteor server is reachable!');
            
            // Now try to load the Meteor app
            this.skeletonApp.setAppUrl('http://localhost:3000');
        }
    }
    
    /**
     * Starts MongoDB
     */
    async startMongoDB(dbPath) {
        this.log.info('Starting MongoDB...');
        
        // MongoDB binary path
        const mongodName = process.platform === 'win32' ? 'mongod.exe' : 'mongod';
        let mongodPath;
        
        // Look for MongoDB in different possible locations
        const possiblePaths = [
            path.join(app.getAppPath(), 'resources', 'mongodb', mongodName),
            path.join(app.getAppPath(), 'mongodb', mongodName),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'resources', 'mongodb', mongodName),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'mongodb', mongodName)
        ];
        
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                mongodPath = possiblePath;
                break;
            }
        }
        
        this.log.info(`MongoDB path: ${mongodPath}`);
        
        if (!mongodPath || !fs.existsSync(mongodPath)) {
            throw new Error(`MongoDB binary not found. Checked paths: ${possiblePaths.join(', ')}`);
        }
        
        // MongoDB port - use a different port than standard to avoid conflicts
        const mongoPort = this.appSettings.mongoPort || 27018;
        
        // Make sure the MongoDB data directory exists
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }
        
        // Add mongod log file
        const logPath = path.join(app.getPath('logs'), 'mongodb.log');
        
        // Start MongoDB process
        this.mongoProcess = spawn(mongodPath, [
            '--dbpath', dbPath,
            '--port', mongoPort.toString(),
            '--bind_ip', '127.0.0.1',
            '--logpath', logPath,
            '--journal'
        ]);
        
        // Monitor MongoDB process
        this.mongoProcess.on('error', (err) => {
            this.log.error(`Failed to start MongoDB: ${err.message}`);
            throw new Error(`Failed to start MongoDB: ${err.message}`);
        });
        
        this.mongoProcess.on('exit', (code, signal) => {
            if (code !== 0 && code !== null) {
                this.log.error(`MongoDB exited with code ${code}`);
            }
        });
        
        // Wait for MongoDB to be ready
        await this.waitForPort(mongoPort, 'MongoDB');
        
        this.log.info(`MongoDB successfully started on port ${mongoPort}`);
        return mongoPort;
    }
    
    /**
     * Starts Meteor server
     */
    async startMeteorServer() {
        this.log.info('Starting Meteor server...');
        
        this.log.info(`Looking for Meteor bundle at possible paths:`);
        for (const possiblePath of possiblePaths) {
            this.log.info(`- ${possiblePath} exists: ${fs.existsSync(possiblePath)}`);
        }

        // Meteor app bundle path
        let meteorBundlePath;
        const possiblePaths = [
            path.join(app.getAppPath(), 'meteor-bundle'),
            path.join(app.getAppPath(), 'resources', 'meteor-bundle'),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'meteor-bundle'),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'resources', 'meteor-bundle')
        ];
        
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                meteorBundlePath = possiblePath;
                break;
            }
        }
        
        if (!meteorBundlePath) {
            throw new Error(`Meteor bundle not found. Checked paths: ${possiblePaths.join(', ')}`);
        }
        
        const mainJsPath = path.join(meteorBundlePath, 'main.js');
        
        this.log.info(`Meteor server path: ${mainJsPath}`);
        
        if (!fs.existsSync(mainJsPath)) {
            throw new Error(`Meteor bundle main.js not found at: ${mainJsPath}`);
        }
        
        // MongoDB port
        const mongoPort = this.appSettings.mongoPort || 27018;
        
        // Meteor port
        const meteorPort = this.appSettings.port || 3000;
        
        // Get MongoDB connection string
        const mongoUrl = `mongodb://localhost:${mongoPort}/meteor`;
        
        // Environment for Meteor
        const env = {
            ...process.env,
            MONGO_URL: mongoUrl,
            ROOT_URL: `http://localhost:${meteorPort}`,
            PORT: meteorPort.toString(),
            NODE_ENV: process.env.NODE_ENV || 'production'
        };
        
        // Add custom settings from the appSettings
        if (this.appSettings.meteorSettings) {
            env.METEOR_SETTINGS = JSON.stringify(this.appSettings.meteorSettings);
        }
        
        try {
          const tcpPortUsed = require('tcp-port-used');
          const portInUse = await tcpPortUsed.check(3000, '127.0.0.1');
          this.log.info(`Port 3000 is ${portInUse ? 'already in use' : 'available'}`);
          if (portInUse) {
              // Try to use a different port
              meteorPort = 3001;
              this.log.info(`Will try port ${meteorPort} instead`);
          }
        } catch (err) {
            this.log.error(`Error checking port: ${err.message}`);
        }
        
        // Start Meteor
        this.meteorServer = spawn(process.execPath, [mainJsPath], {
            env,
            cwd: meteorBundlePath
        });
        
        // Log Meteor output
        this.meteorServer.stdout.on('data', (data) => {
            const output = data.toString().trim();
            this.log.info(`Meteor: ${output}`);
            
            // Update loading screen with server startup progress
            if (output.includes('Starting application')) {
                this.updateLoadingStatus('Starting Meteor application...');
            } else if (output.includes('App running at')) {
                this.updateLoadingStatus('Meteor server ready!');
            }
        });
        
        this.meteorServer.stderr.on('data', (data) => {
            this.log.error(`Meteor error: ${data}`);
        });
        
        // Handle Meteor server exit
        this.meteorServer.on('exit', (code, signal) => {
            this.log.info(`Meteor server exited with code ${code}`);
            
            if (code !== 0 && code !== null && this.isServerReady) {
                // Server crashed after being ready
                this.displayRestartDialog(
                    'Server Crashed',
                    'The application server has crashed. Would you like to restart?',
                    `Exit code: ${code}`
                );
            }
        });
        
        // Wait for Meteor to be ready
        await this.waitForPort(meteorPort, 'Meteor');
        
        this.log.info(`Meteor successfully started on port ${meteorPort}`);


        // In the startMeteorServer method
        this.meteorServer.stdout.on('data', (data) => {
          const output = data.toString().trim();
          this.log.info(`Meteor output: ${output}`);
          console.log(`Meteor output: ${output}`);
        });

        this.meteorServer.stderr.on('data', (data) => {
          const output = data.toString().trim();
          this.log.error(`Meteor error: ${output}`);
          console.error(`Meteor error: ${output}`);
        });

        this.meteorServer.on('error', (err) => {
          this.log.error(`Meteor process error: ${err.message}`);
          console.error(`Meteor process error: ${err.message}`);
        });

        this.meteorServer.on('exit', (code, signal) => {
          this.log.info(`Meteor process exited with code ${code} and signal ${signal}`);
          console.log(`Meteor process exited with code ${code} and signal ${signal}`);
        });
    }
    
    /**
     * Wait for a port to be ready
     */
    waitForPort(port, serviceName, maxWaitTime = 60000) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const checkPort = () => {
                // Check for timeout
                if (Date.now() - startTime > maxWaitTime) {
                    return reject(new Error(`Timeout waiting for ${serviceName} to start on port ${port}`));
                }
                
                // Try to connect
                const socket = net.connect(port, '127.0.0.1');
                
                socket.on('connect', () => {
                    socket.end();
                    this.log.info(`${serviceName} is ready on port ${port}`);
                    resolve();
                });
                
                socket.on('error', () => {
                    // Try again after a delay
                    setTimeout(checkPort, 500);
                });
            };
            
            // Start checking
            checkPort();
        });
    }
    
    /**
     * Stop all processes
     */
    async stopProcesses() {
        let promiseChain = Promise.resolve();
        
        // Stop Meteor
        if (this.meteorServer) {
            this.log.info('Stopping Meteor server...');
            promiseChain = promiseChain.then(() => {
                return new Promise((resolve) => {
                    const killed = this.meteorServer.kill();
                    this.log.info(`Meteor server kill result: ${killed}`);
                    
                    // Give it a moment to shut down
                    setTimeout(() => {
                        this.meteorServer = null;
                        resolve();
                    }, 1000);
                });
            });
        }
        
        // Stop MongoDB
        if (this.mongoProcess) {
            this.log.info('Stopping MongoDB...');
            promiseChain = promiseChain.then(() => {
                return new Promise((resolve) => {
                    const killed = this.mongoProcess.kill();
                    this.log.info(`MongoDB kill result: ${killed}`);
                    
                    // Give it a moment to shut down
                    setTimeout(() => {
                        this.mongoProcess = null;
                        resolve();
                    }, 1000);
                });
            });
        }
        
        return promiseChain;
    }

    /**
     * Window crash handler.
     */
    windowCrashedHandler() {
        this.displayRestartDialog(
            'Application has crashed',
            'Do you want to restart it?'
        );
    }

    /**
     * Window's unresponsiveness handler.
     */
    windowUnresponsiveHandler() {
        this.displayRestartDialog(
            'Application is not responding',
            'Do you want to restart it?'
        );
    }

    /**
     * JS's uncaught exception handler.
     * @param {Error} error - error object
     */
    uncaughtExceptionHandler(error) {
        this.log.error('Uncaught exception:', error);
        this.displayRestartDialog(
            'Application encountered an error',
            'Do you want to restart it?',
            error.message
        );
    }

    /**
     * Displays an error dialog with simple 'restart' or 'shutdown' choice.
     * @param {string} title   - title of the dialog
     * @param {string} message - message shown in the dialog
     * @param {string} details - additional details to be displayed
     */
    displayRestartDialog(title, message, details = '') {
        dialog.showMessageBox(
            {
                type: 'error', 
                buttons: ['Restart', 'Shutdown'], 
                title, 
                message, 
                detail: details
            },
            (response) => {
                if (response === 0) {
                    app.relaunch();
                }
                app.exit(0);
            }
        );
    }
}


