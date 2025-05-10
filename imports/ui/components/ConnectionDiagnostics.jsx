// Enhanced connection diagnostics for App.jsx
// Add this component to display connection details

import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';

export function ConnectionDiagnostics({ connectionStatus, reconnectCount }) {
  // Get application version
  const appVersion = window.navigator.userAgent || 'Unknown';
  
  // Get Meteor connection URL
  const ddpUrl = Meteor.connection?._stream?.socket?._url || 'Unknown';
  
  // Get Meteor connection status details
  const statusDetails = {
    status: connectionStatus?.status || 'unknown',
    connected: connectionStatus?.connected || false,
    retryCount: connectionStatus?.retryCount || 0,
    retryTime: connectionStatus?.retryTime ? new Date(connectionStatus.retryTime).toLocaleTimeString() : 'N/A',
  };
  
  // Local connection status
  const isConnected = statusDetails.connected;
  
  // Check if we're running in Electron
  const isElectron = window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;
  
  // Get server info if available
  const serverInfo = Meteor.settings?.public?.serverInfo || 'Unknown';
  
  // Check for specific WebSocket errors in connection
  const hasWebSocketIssue = !isConnected && 
    isElectron &&
    (ddpUrl?.includes('ws://') || !ddpUrl);

  // Get expected WebSocket endpoint
  const expectedWebSocketEndpoint = Meteor.settings?.public?.serverInfo?.webSocketEndpoint || 
    `ws://localhost:${Meteor.settings?.public?.serverInfo?.meteorPort || '3000'}/websocket`;
  
  return (
    <Paper sx={{ p: 2, mt: 3, maxWidth: '600px', mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Connection Diagnostics
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Connection URL:</Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
          {ddpUrl}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Connection Status:</Typography>
        <Box component="pre" sx={{ 
          p: 1, 
          bgcolor: 'background.paper', 
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 1,
          fontSize: '0.875rem',
          maxHeight: '150px',
          overflow: 'auto'
        }}>
          {JSON.stringify(statusDetails, null, 2)}
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Environment:</Typography>
        <Typography variant="body2">
          Running in Electron: {isElectron ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          Reconnect Attempts: {reconnectCount}
        </Typography>
        <Typography variant="body2">
          Server Info: {typeof serverInfo === 'object' ? JSON.stringify(serverInfo) : serverInfo}
        </Typography>
      </Box>
      
      <Box>
        <Typography variant="subtitle2">System Info:</Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
          {appVersion}
        </Typography>
      </Box>
      
      {/* WebSocket specific troubleshooting */}
      {hasWebSocketIssue && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            WebSocket Connection Issue Detected
          </Typography>
          <Typography variant="body2" paragraph>
            There appears to be a problem with the WebSocket connection. This is often due to the Meteor server not accepting WebSocket connections.
          </Typography>
          <Typography variant="body2">
            Expected WebSocket endpoint: <Box component="span" fontWeight="bold">{expectedWebSocketEndpoint}</Box>
          </Typography>
          <Typography variant="body2">
            Make sure DISABLE_WEBSOCKETS is set to "0" in the server environment.
          </Typography>
        </Box>
      )}

      {reconnectCount > 3 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="error.main" paragraph>
            If the application doesn't connect after multiple attempts, you can try:
          </Typography>
          <Typography variant="body2" component="div">
            <ul>
              <li>Restarting the application</li>
              <li>Checking your computer's internet connection</li>
              <li>Clearing application cache (if applicable)</li>
              <li>Check the logs in the Import/Export > System Diagnostics section</li>
            </ul>
          </Typography>
        </Box>
      )}
    </Paper>
  );
}