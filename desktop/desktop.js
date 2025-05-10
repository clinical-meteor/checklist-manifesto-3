// imports/desktop/desktop.js - With improved logging and diagnostics

import process from 'process';
import { app, dialog, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';

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
        this.loaderWindow = null;
        this.mainWindow = null;
        this.maxStartupRetries = 3;
        this.currentStartupRetry = 0;
        this.logFilePath = path.join(app.getPath('logs'), 'checklist-manifesto.log');
        
        // Create desktop logs directory if it doesn't exist
        const logsDir = app.getPath('logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Setup log file if doesn't exist
        if (!fs.existsSync(this.logFilePath)) {
            try {
                fs.writeFileSync(this.logFilePath, '--- Checklist Manifesto Log ---\n');
            } catch (e) {
                console.error('Could not create log file:', e);
            }
        }
        
        // Write startup info to log file
        this.writeToLogFile(`Application starting - ${new Date().toISOString()}`);
        this.writeToLogFile(`OS: ${os.type()} ${os.release()} - ${os.arch()}`);
        this.writeToLogFile(`App paths: ${JSON.stringify({
            userData: app.getPath('userData'),
            logs: app.getPath('logs'),
            appPath: app.getAppPath()
        }, null, 2)}`);
        
        // Create a desktop module for IPC
        const desktop = new Module('desktop');
        
        // Handle IPC from the web app
        desktop.on('closeApp', () => {
            this.stopProcesses();
            app.quit();
        });

        desktop.on('restartServer', async () => {
            this.log.info('Restarting server processes...');
            this.writeToLogFile('Restarting server processes...');
            await this.stopProcesses();
            await this.startProcesses();
        });

        // Add test connection method
        desktop.on('testConnection', async () => {
            try {
                // Test MongoDB connection
                const mongoPort = this.appSettings.mongoPort || 27018;
                const mongoConnected = await this.testPort(mongoPort, 'MongoDB');
                
                // Test Meteor server connection
                const meteorPort = this.appSettings.port || 3000;
                const meteorConnected = await this.testPort(meteorPort, 'Meteor');
                
                return {
                    success: true,
                    mongo: {
                        port: mongoPort,
                        connected: mongoConnected
                    },
                    meteor: {
                        port: meteorPort,
                        connected: meteorConnected
                    },
                    processes: {
                        mongoRunning: this.mongoProcess !== null && !this.mongoProcess.killed,
                        meteorRunning: this.meteorServer !== null && !this.meteorServer.killed
                    }
                };
            } catch (error) {
                this.log.error('Test connection error:', error);
                this.writeToLogFile(`Test connection error: ${error.message}`);
                return {
                    success: false,
                    error: error.message
                };
            }
        });
        
        // Set up IPC handlers for logs
        ipcMain.handle('get-app-logs', async () => {
            try {
                if (fs.existsSync(this.logFilePath)) {
                    const logContent = fs.readFileSync(this.logFilePath, 'utf8');
                    // Return the last 100 lines to avoid overwhelming the renderer
                    return logContent.split('\n').slice(-100).join('\n');
                }
                return 'No logs found';
            } catch (error) {
                return `Error reading logs: ${error.message}`;
            }
        });

        // We need to handle gracefully potential problems.
        // Lets remove the default handler and replace it with ours.
        skeletonApp.removeUncaughtExceptionListener();
        process.on('uncaughtException', this.uncaughtExceptionHandler.bind(this));

        // Create loading screen (replacing default)
        skeletonApp.createLoaderWindow = this.createLoaderWindow.bind(this);

        // Start server before window loads
        eventsBus.on('beforeLoadUrl', async () => {
            try {
                // Show a proper loading message
                this.updateLoadingStatus('Starting server...');
                
                // Start MongoDB and Meteor server
                await this.startProcesses();
                
                // Set the app URL to our local server
                this.isServerReady = true;
                const meteorPort = this.appSettings.port || 3000;
                const serverUrl = `http://localhost:${meteorPort}`;
                
                // Configure public settings to expose server info to the client
                if (!this.appSettings.meteorSettings) {
                    this.appSettings.meteorSettings = {};
                }
                if (!this.appSettings.meteorSettings.public) {
                    this.appSettings.meteorSettings.public = {};
                }
                
                // Add server connection info for diagnostic purposes
                this.appSettings.meteorSettings.public.serverInfo = {
                    url: serverUrl,
                    meteorPort: meteorPort,
                    mongoPort: this.appSettings.mongoPort || 27018,
                    platform: process.platform,
                    arch: process.arch,
                    version: app.getVersion(),
                    userDataPath: app.getPath('userData'),
                    logPath: app.getPath('logs')
                };
                
                // Update app URL
                skeletonApp.setAppUrl(serverUrl);
                
                // Log success
                this.log.info(`Local Meteor server started successfully at ${serverUrl}`);
                this.writeToLogFile(`Local Meteor server started successfully at ${serverUrl}`);
                this.updateLoadingStatus('Server ready, starting application...');
            } catch (error) {
                this.log.error('Failed to start server:', error);
                this.writeToLogFile(`Failed to start server: ${error.message}`);
                this.updateLoadingStatus(`Error: ${error.message}`, 'error');
                
                // Show error dialog
                setTimeout(() => {
                    this.displayRestartDialog(
                        'Server Error',
                        'Failed to start application server.',
                        error.message
                    );
                }, 1000);
            }
        });
        
        // Handle window events
        eventsBus.on('windowCreated', (window) => {
            this.mainWindow = window;
            this.writeToLogFile('Main window created');
            
            window.webContents.on('crashed', this.windowCrashedHandler.bind(this));
            window.on('unresponsive', this.windowUnresponsiveHandler.bind(this));
            
            // Add additional event listeners
            window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                this.log.error(`Page failed to load: ${errorDescription} (${errorCode})`);
                this.writeToLogFile(`Page failed to load: ${errorDescription} (${errorCode})`);
                
                if (this.isServerReady) {
                    setTimeout(() => {
                        this.log.info('Attempting to reload the page...');
                        this.writeToLogFile('Attempting to reload the page...');
                        window.webContents.reload();
                    }, 2000);
                }
            });
            
            // Log console messages
            window.webContents.on('console-message', (event, level, message, line, sourceId) => {
                const levels = ['verbose', 'info', 'warning', 'error'];
                this.writeToLogFile(`[WEB-${levels[level]}] ${message}`);
            });
            
            // Log websocket errors
            window.webContents.session.webRequest.onErrorOccurred(
                { urls: ['ws://*/*', 'wss://*/*', 'http://localhost:*/*', 'http://127.0.0.1:*/*'] },
                details => {
                    if (details.error !== 'net::ERR_ABORTED') {  // Ignore aborted requests
                        this.writeToLogFile(`[WEB-REQUEST-ERROR] ${details.url}: ${details.error}`);
                    }
                }
            );
        });
        
        // Handle window ready
        eventsBus.on('windowReady', () => {
            this.log.info('Main window ready, closing loader if exists');
            this.writeToLogFile('Main window ready, closing loader if exists');
            
            if (this.loaderWindow && !this.loaderWindow.isDestroyed()) {
                this.loaderWindow.close();
                this.loaderWindow = null;
            }
        });
        
        // Ensure clean shutdown
        app.on('will-quit', () => {
            this.writeToLogFile('Application is quitting...');
            this.stopProcesses();
        });
        
        // For development/debugging
        app.on('ready', () => {
            if (appSettings.devTools) {
                eventsBus.on('windowCreated', (window) => {
                    window.webContents.openDevTools();
                    this.writeToLogFile('DevTools opened for window');
                });
            }
        });

        this.log.info('Desktop module initialized');
        this.writeToLogFile('Desktop module initialized');
        this.log.info('App data path:', app.getPath('userData'));
        this.log.info('Log path:', app.getPath('logs'));
    }
    
    /**
     * Writes a message to the log file
     * @param {string} message - The message to log
     */
    writeToLogFile(message) {
        try {
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] ${message}\n`;
            fs.appendFileSync(this.logFilePath, logLine);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }
    
    /**
     * Test if a port is available
     * @param {number} port - The port to test
     * @param {string} serviceName - The service name for logging
     * @returns {Promise<boolean>} - True if the port is available
     */
    testPort(port, serviceName) {
        return new Promise((resolve) => {
            const socket = net.connect(port, '127.0.0.1');
            let connected = false;
            
            socket.on('connect', () => {
                connected = true;
                socket.end();
                this.log.info(`${serviceName} is available on port ${port}`);
                this.writeToLogFile(`${serviceName} is available on port ${port}`);
                resolve(true);
            });
            
            socket.on('error', () => {
                socket.destroy();
                this.log.error(`${serviceName} is not available on port ${port}`);
                this.writeToLogFile(`${serviceName} is not available on port ${port}`);
                resolve(false);
            });
            
            // Set timeout in case connection hangs
            setTimeout(() => {
                if (!connected) {
                    socket.destroy();
                    this.log.error(`Connection to ${serviceName} timed out`);
                    this.writeToLogFile(`Connection to ${serviceName} timed out`);
                    resolve(false);
                }
            }, 2000);
        });
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
    
    /**
     * Update the loading status displayed to the user
     * 
     * @param {string} message - Status message to display
     * @param {string} type - Type of message (info, error)
     */
    updateLoadingStatus(message, type = 'info') {
        this.log.info(`Loader status: ${message}`);
        this.writeToLogFile(`Loader status: ${message}`);
        
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
        this.writeToLogFile('Starting server processes...');
        
        try {
            // Check for existing processes that might use the ports
            const mongoPort = this.appSettings.mongoPort || 27018;
            const meteorPort = this.appSettings.port || 3000;
            
            // Check if ports are already in use
            const mongoInUse = await this.isPortInUse(mongoPort);
            const meteorInUse = await this.isPortInUse(meteorPort);
            
            if (mongoInUse) {
                this.writeToLogFile(`Warning: MongoDB port ${mongoPort} already in use`);
            }
            
            if (meteorInUse) {
                this.writeToLogFile(`Warning: Meteor port ${meteorPort} already in use`);
            }
            
            // Create data directory
            const userDataPath = app.getPath('userData');
            const mongoDbPath = path.join(userDataPath, 'mongodb-data');
            
            if (!fs.existsSync(mongoDbPath)) {
                fs.mkdirSync(mongoDbPath, { recursive: true });
            }
            
            // Start MongoDB
            this.updateLoadingStatus('Starting database...');
            const actualMongoPort = await this.startMongoDB(mongoDbPath);
            
            // Start Meteor server
            this.updateLoadingStatus('Starting application server...');
            await this.startMeteorServer(actualMongoPort);
            
            // Reset retry counter on success
            this.currentStartupRetry = 0;
        } catch (error) {
            this.log.error(`Error starting processes: ${error.message}`);
            this.writeToLogFile(`Error starting processes: ${error.message}`);
            
            // Increment retry counter and attempt to restart if we haven't exceeded max retries
            this.currentStartupRetry++;
            if (this.currentStartupRetry <= this.maxStartupRetries) {
                this.log.info(`Retry attempt ${this.currentStartupRetry}/${this.maxStartupRetries}`);
                this.writeToLogFile(`Retry attempt ${this.currentStartupRetry}/${this.maxStartupRetries}`);
                this.updateLoadingStatus(`Retrying startup (${this.currentStartupRetry}/${this.maxStartupRetries})...`);
                
                // Stop any running processes
                await this.stopProcesses();
                
                // Wait a moment and retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.startProcesses();
            }
            
            // If we've exceeded retries, rethrow the error
            throw error;
        }
    }
    
    /**
     * Check if a port is already in use
     * @param {number} port - Port to check
     * @returns {Promise<boolean>} - True if the port is in use
     */
    isPortInUse(port) {
        return new Promise((resolve) => {
            const server = net.createServer()
                .once('error', () => {
                    // Port is in use
                    resolve(true);
                })
                .once('listening', () => {
                    // Port is free, close server
                    server.close();
                    resolve(false);
                })
                .listen(port, '127.0.0.1');
        });
    }
    
    /**
     * Starts MongoDB
     * @param {string} dbPath - Path to store MongoDB data
     * @returns {Promise<number>} - Port number MongoDB is running on
     */
    async startMongoDB(dbPath) {
        this.log.info('Starting MongoDB...');
        this.writeToLogFile('Starting MongoDB...');
        
        // MongoDB binary path
        const mongodName = process.platform === 'win32' ? 'mongod.exe' : 'mongod';
        let mongodPath;
        
        // Look for MongoDB in different possible locations
        const possiblePaths = [
            path.join(app.getAppPath(), 'resources', 'mongodb', mongodName),
            path.join(app.getAppPath(), 'mongodb', mongodName),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'resources', 'mongodb', mongodName),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'mongodb', mongodName),
            path.join(app.getAppPath(), 'mongodb-binaries', process.platform, mongodName)
        ];
        
        // Check which paths exist
        this.writeToLogFile('Checking MongoDB binary paths:');
        for (const possiblePath of possiblePaths) {
            const exists = fs.existsSync(possiblePath);
            this.writeToLogFile(`- ${possiblePath}: ${exists}`);
            if (exists) {
                mongodPath = possiblePath;
                break;
            }
        }
        
        if (!mongodPath || !fs.existsSync(mongodPath)) {
            throw new Error(`MongoDB binary not found. Checked paths: ${possiblePaths.join(', ')}`);
        }
        
        this.writeToLogFile(`Using MongoDB binary: ${mongodPath}`);
        
        // MongoDB port - use a different port than standard to avoid conflicts
        const mongoPort = this.appSettings.mongoPort || 27018;
        
        // Make sure the MongoDB data directory exists
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }
        
        // Add mongod log file
        const logPath = path.join(app.getPath('logs'), 'mongodb.log');
        
        // MongoDB command line arguments
        const mongoArgs = [
            '--dbpath', dbPath,
            '--port', mongoPort.toString(),
            '--bind_ip', '127.0.0.1',
            '--logpath', logPath,
            '--journal'
        ];
        
        this.writeToLogFile(`Starting MongoDB with args: ${mongoArgs.join(' ')}`);
        
        // Start MongoDB process
        this.mongoProcess = spawn(mongodPath, mongoArgs);
        
        // Monitor MongoDB process
        this.mongoProcess.on('error', (err) => {
            this.log.error(`Failed to start MongoDB: ${err.message}`);
            this.writeToLogFile(`Failed to start MongoDB: ${err.message}`);
            throw new Error(`Failed to start MongoDB: ${err.message}`);
        });
        
        this.mongoProcess.stderr.on('data', (data) => {
            const output = data.toString().trim();
            this.log.error(`MongoDB stderr: ${output}`);
            this.writeToLogFile(`MongoDB stderr: ${output}`);
        });
        
        this.mongoProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            this.log.info(`MongoDB: ${output}`);
            this.writeToLogFile(`MongoDB: ${output}`);
        });
        
        this.mongoProcess.on('exit', (code, signal) => {
            if (code !== 0 && code !== null) {
                this.log.error(`MongoDB exited with code ${code}`);
                this.writeToLogFile(`MongoDB exited with code ${code}`);
            }
        });
        
        // Wait for MongoDB to be ready
        await this.waitForPort(mongoPort, 'MongoDB', 30000);
        
        this.log.info(`MongoDB successfully started on port ${mongoPort}`);
        this.writeToLogFile(`MongoDB successfully started on port ${mongoPort}`);
        return mongoPort;
    }
    
    /**
     * Starts Meteor server
     * @param {number} mongoPort - MongoDB port to connect to
     */
    async startMeteorServer(mongoPort) {
        this.log.info('Starting Meteor server...');
        this.writeToLogFile('Starting Meteor server...');
        
        // Meteor app bundle path
        let meteorBundlePath;
        const possiblePaths = [
            path.join(app.getAppPath(), 'meteor-bundle'),
            path.join(app.getAppPath(), 'resources', 'meteor-bundle'),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'meteor-bundle'),
            path.join(app.getAppPath(), 'app.asar.unpacked', 'resources', 'meteor-bundle')
        ];
        
        // Check which paths exist
        this.writeToLogFile('Checking Meteor bundle paths:');
        possiblePaths.forEach(p => {
            const exists = fs.existsSync(p);
            this.writeToLogFile(`- ${p}: ${exists}`);
            if (exists) {
                meteorBundlePath = p;
            }
        });
        
        if (!meteorBundlePath) {
            throw new Error(`Meteor bundle not found. Checked paths: ${possiblePaths.join(', ')}`);
        }
        
        const mainJsPath = path.join(meteorBundlePath, 'main.js');
        
        this.writeToLogFile(`Using Meteor server path: ${mainJsPath}`);
        
        if (!fs.existsSync(mainJsPath)) {
            throw new Error(`Meteor bundle main.js not found at: ${mainJsPath}`);
        }
        
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
            NODE_ENV: 'production',
            METEOR_OFFLINE_CATALOG: 'true',
            DISABLE_WEBSOCKETS: '0', // Enable WebSockets!
            METEOR_DISABLE_HOT_MODULE_REPLACEMENT: '1',
            METEOR_DISABLE_AUTO_RELOAD: '1',  // Explicitly disable auto reload
            METEOR_DISABLE_LIVE_RELOAD: '1',  // Explicitly disable live reload
            METEOR_SERVER_WEBSOCKET_ENDPOINTS: `ws://localhost:${meteorPort}/websocket` // Explicit WebSocket endpoint
        };
        
        // Add custom settings from the appSettings
        if (this.appSettings.meteorSettings) {
            env.METEOR_SETTINGS = JSON.stringify(this.appSettings.meteorSettings);
            this.writeToLogFile(`Using Meteor settings: ${env.METEOR_SETTINGS}`);
        }
        
        this.writeToLogFile(`Starting Meteor with env variables: ${JSON.stringify({
            MONGO_URL: mongoUrl,
            ROOT_URL: `http://localhost:${meteorPort}`,
            PORT: meteorPort,
            DISABLE_WEBSOCKETS: '0',
            METEOR_SERVER_WEBSOCKET_ENDPOINTS: `ws://localhost:${meteorPort}/websocket`
        })}`);
        
        // Start Meteor
        this.meteorServer = spawn(process.execPath, [mainJsPath], {
            env,
            cwd: meteorBundlePath
        });
        
        // Log Meteor output
        this.meteorServer.stdout.on('data', (data) => {
            const output = data.toString().trim();
            this.log.info(`Meteor: ${output}`);
            this.writeToLogFile(`Meteor: ${output}`);
            
            // Update loading screen with server startup progress
            if (output.includes('Starting application')) {
                this.updateLoadingStatus('Starting Meteor application...');
            } else if (output.includes('App running at')) {
                this.updateLoadingStatus('Meteor server ready!');
            }
        });
        
        this.meteorServer.stderr.on('data', (data) => {
            const output = data.toString().trim();
            this.log.error(`Meteor error: ${output}`);
            this.writeToLogFile(`Meteor error: ${output}`);
        });
        
        // Handle Meteor server exit
        this.meteorServer.on('exit', (code, signal) => {
            this.log.info(`Meteor server exited with code ${code}`);
            this.writeToLogFile(`Meteor server exited with code ${code}`);
            
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
        await this.waitForPort(meteorPort, 'Meteor', 60000);
        
        this.log.info(`Meteor successfully started on port ${meteorPort}`);
        this.writeToLogFile(`Meteor successfully started on port ${meteorPort}`);
    }
    
    /**
     * Wait for a port to be ready
     * @param {number} port - Port to check
     * @param {string} serviceName - Name of service (for logging)
     * @param {number} maxWaitTime - Maximum time to wait in milliseconds
     * @returns {Promise<void>}
     */
    waitForPort(port, serviceName, maxWaitTime = 60000) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const checkPort = () => {
                // Check for timeout
                if (Date.now() - startTime > maxWaitTime) {
                    this.writeToLogFile(`Timeout waiting for ${serviceName} to start on port ${port}`);
                    return reject(new Error(`Timeout waiting for ${serviceName} to start on port ${port}`));
                }
                
                // Try to connect
                const socket = net.connect(port, '127.0.0.1');
                
                socket.on('connect', () => {
                    socket.end();
                    this.log.info(`${serviceName} is ready on port ${port}`);
                    this.writeToLogFile(`${serviceName} is ready on port ${port}`);
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
     * @returns {Promise<void>}
     */
    async stopProcesses() {
        let promiseChain = Promise.resolve();
        
        // Stop Meteor
        if (this.meteorServer) {
            this.log.info('Stopping Meteor server...');
            this.writeToLogFile('Stopping Meteor server...');
            
            promiseChain = promiseChain.then(() => {
                return new Promise((resolve) => {
                    const killed = this.meteorServer.kill();
                    this.log.info(`Meteor server kill result: ${killed}`);
                    this.writeToLogFile(`Meteor server kill result: ${killed}`);
                    
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
            this.writeToLogFile('Stopping MongoDB...');
            
            promiseChain = promiseChain.then(() => {
                return new Promise((resolve) => {
                    const killed = this.mongoProcess.kill();
                    this.log.info(`MongoDB kill result: ${killed}`);
                    this.writeToLogFile(`MongoDB kill result: ${killed}`);
                    
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
        this.writeToLogFile('Window crashed!');
        this.displayRestartDialog(
            'Application has crashed',
            'Do you want to restart it?'
        );
    }

    /**
     * Window's unresponsiveness handler.
     */
    windowUnresponsiveHandler() {
        this.writeToLogFile('Window has become unresponsive');
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
        this.writeToLogFile(`Uncaught exception: ${error.message}\n${error.stack}`);
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
        this.writeToLogFile(`Displaying restart dialog: ${title} - ${message} - ${details}`);
        
        dialog.showMessageBox(
            {
                type: 'error', 
                buttons: ['Restart', 'Shutdown', 'Show Logs'], 
                title, 
                message, 
                detail: details
            },
            (response) => {
                if (response === 0) {
                    this.writeToLogFile('User chose to restart the application');
                    app.relaunch();
                    app.exit(0);
                } else if (response === 1) {
                    this.writeToLogFile('User chose to shut down the application');
                    app.exit(0);
                } else if (response === 2) {
                    this.writeToLogFile('User requested to see logs');
                    // Open logs in default text editor
                    const { shell } = require('electron');
                    shell.openPath(this.logFilePath);
                }
            }
        );
    }
}