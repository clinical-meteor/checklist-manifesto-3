// imports/ui/components/ConnectionAlert.jsx
import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { 
  Box, 
  Alert, 
  AlertTitle, 
  Collapse, 
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * ConnectionAlert component displays a notification when the client
 * loses connection to the server
 */
export default function ConnectionAlert() {
  // Track connection status
  const { status, reconnecting } = useTracker(() => ({
    status: Meteor.status(),
    reconnecting: Meteor.status().status === 'waiting'
  }));

  // Only show when not connected
  if (status.connected) {
    return null;
  }

  return (
    <Collapse in={!status.connected}>
      <Box 
        id="connectionAlert"
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 9999 
        }}
      >
        <Alert 
          severity={reconnecting ? "warning" : "error"}
          icon={reconnecting ? <CircularProgress size={20} /> : <RefreshIcon />}
          sx={{ 
            mb: 0, 
            borderRadius: 0,
            backgroundColor: 'rgba(51,51,51, .85)',
            color: 'white'
          }}
        >
          <Box className="connectionPanel">
            <Box className="meta">
              <AlertTitle id="connectionTitle">
                {reconnecting 
                  ? "Attempting to reconnect..." 
                  : "Connection Lost"
                }
              </AlertTitle>
              <Box id="connectionMessage">
                {reconnecting 
                  ? `Reconnecting in ${status.retryCount} seconds...` 
                  : "There seems to be a connection issue"
                }
              </Box>
            </Box>
          </Box>
        </Alert>
      </Box>
    </Collapse>
  );
}