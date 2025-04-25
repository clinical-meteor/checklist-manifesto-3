// client/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';

// Import Material-UI theme provider and base styles
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a theme instance
const theme = createTheme({
  palette: {
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
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

Meteor.startup(function() {
  // Find the target DOM node
  const container = document.getElementById('react-target');
  
  // Create a root
  const root = createRoot(container);
  
  // Initial render
  root.render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
});