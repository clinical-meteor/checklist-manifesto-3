// imports/ui/App.jsx - Improved connection handling
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

// Import the ConnectionDiagnostics component
import { ConnectionDiagnostics } from './components/ConnectionDiagnostics';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import TaskListPage from './pages/TaskListPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtocolLibraryPage from './pages/ProtocolLibraryPage';
import ImportExportPage from './pages/ImportExportPage';
import NotFoundPage from './pages/NotFoundPage';
import FirstRunSetupPage from './pages/FirstRunSetupPage';
import ListsPage from './pages/ListsPage';
import ListDetailPage from './pages/ListDetailPage';

import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#315481',
    },
    secondary: {
      main: '#62807e',
    },
  },
});
 
export function App() {
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [connectionError, setConnectionError] = useState(null);
  
  // User state and connection state combined in one tracker
  const { user, userLoading, connectionStatus } = useTracker(() => {
    // Only subscribe if we're connected
    const userSub = Meteor.status().connected ? Meteor.subscribe('userData') : { ready: () => false };
    
    return {
      user: Meteor.user(),
      userLoading: !userSub.ready() && Meteor.status().connected,
      connectionStatus: Meteor.status(),
    };
  }, []);

  // Are we currently reconnecting?
  const reconnecting = connectionStatus && connectionStatus.status === 'connecting';
  const connected = connectionStatus && connectionStatus.status === 'connected';
  const failed = connectionStatus && connectionStatus.status === 'failed';
  
  // Track the connection status
  useEffect(() => {
    console.log('Meteor connection status:', connectionStatus.status, '(connected:', connected, ')');
    
    // Reset error when connected
    if (connected) {
      setConnectionError(null);
    }
    
    // Track failed connection attempts
    if (failed && !connectionError) {
      setConnectionError('Failed to connect to the application server');
    }
  }, [connectionStatus, connected, failed]);

  useEffect(() => {
    // Check first run status on mount
    Meteor.call('accounts.isFirstRun', (err, result) => {
      if (!err) {
        setIsFirstRun(result);
      }
    });

    // Set up reconnection check interval
    const interval = setInterval(() => {
      // If not connected and not already trying to connect
      if (!Meteor.status().connected && Meteor.status().status !== 'connecting') {
        console.log('Attempting to reconnect to server...');
        setReconnectCount(prev => prev + 1);
        Meteor.reconnect();
      }
    }, 3000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle manual reconnection
  const handleManualReconnect = () => {
    setReconnectCount(prev => prev + 1);
    setConnectionError(null);
    Meteor.reconnect();
  };

  // If disconnected or reconnecting, show reconnection UI
  if (reconnecting || (!connected && !userLoading)) {
    return (
      <ThemeProvider theme={theme}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh',
            textAlign: 'center',
            p: 3 
          }}
        >
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            {reconnecting ? 'Reconnecting to server...' : 'Connecting to server...'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {connectionError 
              ? `Connection error: ${connectionError}` 
              : 'Please wait while we establish connection to the application server.'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
            Reconnect attempts: {reconnectCount}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleManualReconnect} 
            sx={{ mt: 2 }}
          >
            Reconnect Now
          </Button>
          
          {/* Show detailed connection diagnostics */}
          <Box sx={{ mt: 4, width: '100%', maxWidth: '600px' }}>
            <ConnectionDiagnostics 
              connectionStatus={connectionStatus} 
              reconnectCount={reconnectCount}
            />
          </Box>
          
          
        </Box>
      </ThemeProvider>
    );
  }

  // If still loading user data, show loading screen
  if (userLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh' 
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading user data...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // If this is the first run, show the setup page
  if (isFirstRun) {
    return <FirstRunSetupPage />;
  }

  // Login screen if not logged in
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<LoginPage />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
          </Route>
          
          {/* Main app routes (protected) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={user ? <Navigate to="/tasks/active" replace /> : <Navigate to="/login" replace />} />
            <Route path="/tasks/:filter" element={user ? <TaskListPage /> : <Navigate to="/login" replace />} />
            <Route path="/task/:taskId" element={user ? <TaskDetailsPage /> : <Navigate to="/login" replace />} />
            <Route path="/protocols" element={<ProtocolLibraryPage />} />
            <Route path="/import-export" element={user ? <ImportExportPage /> : <Navigate to="/login" replace />} />
            <Route path="/protocol/:protocolId" element={<TaskDetailsPage isProtocol={true} />} />
            <Route path="/lists" element={user ? <ListsPage /> : <Navigate to="/login" replace />} />
            <Route path="/list/:listId" element={user ? <ListDetailPage /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}