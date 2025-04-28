// imports/ui/components/IFrameViewer.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';

// Material UI components
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  IconButton,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Alert
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * IFrameViewer component that displays external content in an iframe
 * @param {Object} props Component properties
 * @param {String} props.url URL to load in the iframe
 * @param {Boolean} props.open Whether the dialog is open
 * @param {Function} props.onClose Callback when dialog is closed
 * @param {String} props.title Title for the dialog
 */
export function IFrameViewer({ url, open, onClose, title = 'External Content' }) {
  // State
  const [currentUrl, setCurrentUrl] = useState(url);
  const [urlInput, setUrlInput] = useState(url);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [browserHistory, setBrowserHistory] = useState([]);
  const [historyPosition, setHistoryPosition] = useState(-1);
  
  // Initialize iframe URL from props or session
  useEffect(() => {
    if (open) {
      const sessionUrl = Session.get('iFrameLocation');
      const initialUrl = url || sessionUrl || 'about:blank';
      setCurrentUrl(initialUrl);
      setUrlInput(initialUrl);
      
      // Start a new browser history
      setBrowserHistory([initialUrl]);
      setHistoryPosition(0);
    }
  }, [open, url]);
  
  // Save current URL to session when it changes
  useEffect(() => {
    if (currentUrl && currentUrl !== 'about:blank') {
      Session.set('iFrameLocation', currentUrl);
    }
  }, [currentUrl]);
  
  // Handle iframe load
  function handleIframeLoad() {
    setIsLoading(false);
  }
  
  // Handle iframe error
  function handleIframeError() {
    setIsLoading(false);
    setError('Failed to load content. The site may not allow embedding or may be unavailable.');
  }
  
  // Navigate to a URL
  function navigateTo(newUrl) {
    // Simple URL validation
    if (!newUrl || !newUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }
    
    // Add protocol if missing
    let processedUrl = newUrl.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }
    
    setIsLoading(true);
    setError('');
    setCurrentUrl(processedUrl);
    setUrlInput(processedUrl);
    
    // Update browser history
    const newHistory = browserHistory.slice(0, historyPosition + 1);
    newHistory.push(processedUrl);
    
    setBrowserHistory(newHistory);
    setHistoryPosition(newHistory.length - 1);
  }
  
  // Handle navigation from URL input
  function handleUrlSubmit(event) {
    event.preventDefault();
    navigateTo(urlInput);
  }
  
  // Refresh the current page
  function handleRefresh() {
    setIsLoading(true);
    setError('');
    
    // Force iframe to reload by temporarily setting URL to about:blank
    setCurrentUrl('about:blank');
    
    setTimeout(() => {
      setCurrentUrl(browserHistory[historyPosition]);
    }, 100);
  }
  
  // Navigate browser history
  function handleHistoryNavigation(direction) {
    if (direction === 'back' && historyPosition > 0) {
      const newPosition = historyPosition - 1;
      setHistoryPosition(newPosition);
      setCurrentUrl(browserHistory[newPosition]);
      setUrlInput(browserHistory[newPosition]);
      setIsLoading(true);
      setError('');
    } else if (direction === 'forward' && historyPosition < browserHistory.length - 1) {
      const newPosition = historyPosition + 1;
      setHistoryPosition(newPosition);
      setCurrentUrl(browserHistory[newPosition]);
      setUrlInput(browserHistory[newPosition]);
      setIsLoading(true);
      setError('');
    }
  }
  
  // Open the current URL in a new browser tab
  function handleOpenInNewTab() {
    window.open(currentUrl, '_blank');
  }
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="iframe-viewer-title"
      id="iframe"
      sx={{ 
        '& .MuiDialog-paper': { 
          height: '90vh',
          display: 'flex',
          flexDirection: 'column'
        } 
      }}
    >
      <DialogTitle id="iframe-viewer-title">
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ px: 2, pb: 1 }}>
        <Box component="form" onSubmit={handleUrlSubmit} sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={() => handleHistoryNavigation('back')} 
            disabled={historyPosition <= 0}
            size="small"
          >
            <NavigateBeforeIcon />
          </IconButton>
          
          <IconButton 
            onClick={() => handleHistoryNavigation('forward')} 
            disabled={historyPosition >= browserHistory.length - 1}
            size="small"
          >
            <NavigateNextIcon />
          </IconButton>
          
          <IconButton 
            onClick={handleRefresh}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
          
          <TextField
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            fullWidth
            size="small"
            placeholder="Enter URL"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <IconButton 
            type="submit"
            size="small"
          >
            <SearchIcon />
          </IconButton>
          
          <IconButton 
            onClick={handleOpenInNewTab}
            size="small"
          >
            <OpenInNewIcon />
          </IconButton>
        </Box>
      </Box>
      
      {error && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      <DialogContent sx={{ p: 0, position: 'relative', flexGrow: 1 }}>
        {isLoading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        <iframe
          src={currentUrl}
          title={title}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

IFrameViewer.propTypes = {
  url: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string
};

export default IFrameViewer;