// client/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data'; // Added missing import
import { App } from '/imports/ui/App';

// Import accounts config
import '/imports/startup/client/accounts-config';

// Material UI theming
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

// Create theme based on Session value
const createAppTheme = (mode) => createTheme({
  palette: {
    mode, // Use light/dark mode
    primary: {
      main: '#315481',
    },
    secondary: {
      main: '#62807e',
    },
    error: {
      main: '#ff3046',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#303030',
      paper: mode === 'light' ? '#ffffff' : '#424242',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  }
});

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  
  // Initialize session values
  Session.setDefault('theme', 'light');
  
  // Create a reactive wrapper component to handle theme changes
  const AppWithTheme = () => {
    const theme = useTracker(() => Session.get('theme') || 'light');
    const appTheme = createAppTheme(theme);
    
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <App />
        </LocalizationProvider>
      </ThemeProvider>
    );
  };
  
  root.render(<AppWithTheme />);
});