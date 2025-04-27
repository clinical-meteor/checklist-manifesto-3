// imports/ui/pages/ProtocolLibraryPage.jsx
import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

// Material UI components
import { 
  Box, Container, Typography, Paper, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Button, IconButton, TextField,
  InputAdornment, Divider, Chip, CircularProgress, Alert, Grid
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';

// Collections
import { TasksCollection } from '../../db/TasksCollection';

export default function ProtocolLibraryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublic, setFilterPublic] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Track public protocols/task templates
  const { protocols, isLoading, currentUser } = useTracker(() => {
    const protocolsSub = Meteor.subscribe('tasks.protocols');
    
    // Build filter based on search term and visibility settings
    let filter = {};
    
    if (searchTerm) {
      filter.description = { $regex: searchTerm, $options: 'i' };
    }

    // Add public/private filter
    if (filterPublic) {
      filter.public = true;
    } else if (currentUser) {
      // Show my protocols if not showing public ones
      filter.$or = [
        { requester: currentUser._id },
        { public: true }
      ];
    }
    
    return {
      isLoading: !protocolsSub.ready(),
      protocols: TasksCollection.find(
        filter,
        { sort: { lastModified: -1 } }
      ).fetch(),
      currentUser: Meteor.user()
    };
  }, [searchTerm, filterPublic]);

  // Handle protocol preview
  const handlePreview = (protocolId) => {
    navigate(`/task/${protocolId}`);
  };

  // Handle protocol clone
  const handleClone = (protocol) => {
    if (!currentUser) {
      setNotification({
        open: true,
        message: 'Please sign in to clone protocols',
        severity: 'warning'
      });
      return;
    }

    Meteor.call('tasks.clone', protocol._id, (error, result) => {
      if (error) {
        console.error('Error cloning protocol:', error);
        setNotification({
          open: true,
          message: `Failed to clone: ${error.message}`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: 'Protocol cloned successfully!',
          severity: 'success'
        });
        
        // Navigate to the cloned protocol after a brief delay
        setTimeout(() => {
          navigate(`/task/${result}`);
        }, 1500);
      }
    });
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Toggle filter between public and all protocols
  const togglePublicFilter = () => {
    setFilterPublic(!filterPublic);
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Format the date for display
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Protocol Library
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Browse and use pre-defined task protocols from the community
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              placeholder="Search protocols..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant={filterPublic ? "contained" : "outlined"}
              startIcon={filterPublic ? <PublicIcon /> : <PersonIcon />}
              onClick={togglePublicFilter}
              color={filterPublic ? "primary" : "secondary"}
            >
              {filterPublic ? "Public Protocols" : "All Protocols"}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {notification.open && (
        <Alert 
          severity={notification.severity} 
          onClose={handleCloseNotification}
          sx={{ mb: 3 }}
        >
          {notification.message}
        </Alert>
      )}
      
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">
            {filterPublic ? "Public Protocols" : "All Protocols"}
            {!isLoading && (
              <Chip 
                label={protocols.length} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : protocols.length > 0 ? (
          <List id="protocolLibraryItems">
            {protocols.map((protocol) => (
              <React.Fragment key={protocol._id}>
                <ListItem 
                  className="libraryItem"
                  sx={{
                    borderLeft: 4,
                    borderColor: protocol.priority === 'urgent' 
                      ? 'error.main' 
                      : protocol.priority === 'asap' 
                        ? 'warning.main' 
                        : 'success.main'
                  }}
                >
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" className="protocolName">
                        {protocol.description}
                        {protocol.public && (
                          <Chip 
                            icon={<PublicIcon />} 
                            label="Public" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {protocol.status && (
                            <Chip 
                              size="small" 
                              label={protocol.status} 
                              variant="outlined"
                            />
                          )}
                          {protocol.priority && (
                            <Chip 
                              size="small" 
                              label={protocol.priority} 
                              variant="outlined"
                              color={
                                protocol.priority === 'urgent' ? 'error' : 
                                protocol.priority === 'asap' ? 'warning' : 'default'
                              }
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(protocol.authoredOn)} • 
                          Last modified: {formatDate(protocol.lastModified)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      className="protocolCreator"
                      sx={{ mr: 2, display: { xs: 'none', sm: 'inline' } }}
                    >
                      By: {get(protocol, 'requesterName', 'Anonymous')}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      className="previewButton"
                      startIcon={<PreviewIcon />}
                      onClick={() => handlePreview(protocol._id)}
                      sx={{ mr: 1 }}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      className="cloneButton"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleClone(protocol)}
                      disabled={!currentUser}
                    >
                      Clone
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box id="noProtocolsMessage" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" className="title-message">
              No protocols found
            </Typography>
            <Typography variant="body2" color="text.secondary" className="subtitle-message">
              {searchTerm 
                ? 'Try a different search term' 
                : filterPublic 
                  ? 'There are no public protocols available at the moment'
                  : 'You have no protocols yet. Create a task and save it as a protocol.'
              }
            </Typography>
            {!filterPublic && !protocols.length && currentUser && (
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/')}
              >
                Create New Task
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}