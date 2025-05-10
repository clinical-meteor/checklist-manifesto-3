// imports/ui/App.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages - Make sure all imports are correct
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
import CombinedListsPage from './pages/CombinedListsPage';

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
  

  // User state and connection state combined in one tracker
  const { user, userLoading, connectionStatus } = useTracker(() => {
    const userSub = Meteor.subscribe('userData');
    
    return {
      user: Meteor.user(),
      userLoading: !userSub.ready(),
      connectionStatus: Meteor.status(),
    };
  }, []);

  // Check if we're reconnecting
  const reconnecting = connectionStatus && connectionStatus.status === 'connecting';


  useEffect(() => {
    // Check first run status on mount
    Meteor.call('accounts.isFirstRun', (err, result) => {
      if (!err) {
        setIsFirstRun(result);
      }
    });

    // Set up reconnection check interval if in desktop mode
    let interval;
    if (Meteor.settings?.public?.isDesktop) {
      interval = setInterval(() => {
        // Manual reconnection logic if needed
        if (!Meteor.status().connected && Meteor.status().status !== 'connecting') {
          console.log('Attempting to reconnect to server...');
          Meteor.reconnect();
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reconnecting]);
  


  // If disconnected, show reconnection UI
  if (reconnecting) {
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
            Reconnecting to server...
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please wait while we re-establish connection to the application server.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => Meteor.reconnect()} 
            sx={{ mt: 2 }}
          >
            Reconnect Now
          </Button>
        </Box>
      </ThemeProvider>
    );
  }


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
            Loading user...
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

