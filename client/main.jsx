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
// const createAppTheme = (mode) => createTheme({
//   palette: {
//     mode, // Use light/dark mode
//     primary: {
//       main: '#315481',
//     },
//     secondary: {
//       main: '#62807e',
//     },
//     error: {
//       main: '#ff3046',
//     },
//     background: {
//       default: mode === 'light' ? '#f5f5f5' : '#303030',
//       paper: mode === 'light' ? '#ffffff' : '#424242',
//     },
//   },
//   typography: {
//     fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
//   }
// });
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#62625F', // Muted gray with slight green undertone
    },
    secondary: {
      main: '#A39990', // Warm neutral
    },
    error: {
      main: '#C5594D', // Muted red
    },
    background: {
      default: mode === 'light' ? '#F6F6F4' : '#2A2A2A', // Slightly warm off-white / dark gray
      paper: mode === 'light' ? '#FFFFFF' : '#333333',
    },
    text: {
      primary: mode === 'light' ? '#333333' : '#E6E6E6',
      secondary: mode === 'light' ? '#5F5F5F' : '#AAAAAA',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Merriweather", serif',
      fontWeight: 300,
    },
    h2: {
      fontFamily: '"Merriweather", serif',
      fontWeight: 300,
    },
    h3: {
      fontFamily: '"Merriweather", serif',
      fontWeight: 400,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 4, // Slightly reduced from default
  },
  spacing: 8,
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' 
            ? '0 1px 3px rgba(0, 0, 0, 0.08)' 
            : '0 1px 3px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
      },
    },
  },
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