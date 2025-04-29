import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Hero from './components/Hero';
import Screenshot from './components/Screenshot';
import Features from './components/Features';
import About from './components/About';
import Footer from './components/Footer';
import GoogleAnalytics from './components/GoogleAnalytics';

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
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleAnalytics />
      <Header />
      <main>
        <Hero />
        <Screenshot />
        <Features />
        <About />
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default App;