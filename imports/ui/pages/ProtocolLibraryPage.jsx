// imports/ui/pages/ProtocolLibraryPage.jsx
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

// Material UI components
import { 
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Collections
import { TasksCollection } from '../../db/TasksCollection';

/**
 * Protocol Library page displaying public task protocols that can be cloned
 */
export default function ProtocolLibraryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track public protocols/task templates
  const { protocols, isLoading, currentUser } = useTracker(() => {
    const protocolsSub = Meteor.subscribe('tasks.public');
    
    const filter = searchTerm 
      ? { 
          public: true, 
          description: { $regex: searchTerm, $options: 'i' } 
        } 
      : { public: true };
    
    return {
      isLoading: !protocolsSub.ready(),
      protocols: TasksCollection.find(
        filter,
        { sort: { lastModified: -1 } }
      ).fetch(),
      currentUser: Meteor.user()
    };
  }, [searchTerm]);

  // Handle protocol preview
  const handlePreview = (protocolId) => {
    navigate(`/task/${protocolId}`);
  };

  // Handle protocol clone
  const handleClone = async (protocol) => {
    if (!currentUser) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    try {
      // Call method to clone the protocol
      const taskId = await new Promise((resolve, reject) => {
        Meteor.call('tasks.clone', protocol._id, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      // Navigate to the new task
      navigate(`/task/${taskId}`);
    } catch (error) {
      console.error('Error cloning protocol:', error);
      alert(`Failed to clone protocol: ${get(error, 'message', 'Unknown error')}`);
    }
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
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
      </Paper>
      
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">Available Protocols</Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : protocols.length > 0 ? (
          <List id="protocolLibraryItems">
            {protocols.map((protocol) => (
              <React.Fragment key={protocol._id}>
                <ListItem className="libraryItem">
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" className="protocolName">
                        {protocol.description}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip 
                          size="small" 
                          label={protocol.status || 'draft'} 
                          variant="outlined"
                        />
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
                    }
                  />
                  <ListItemSecondaryAction>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      className="protocolCreator"
                      sx={{ mr: 2, display: { xs: 'none', sm: 'inline' } }}
                    >
                      By: {get(protocol, 'requester', 'Anonymous')}
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
                    {currentUser && (
                      <Button
                        variant="contained"
                        size="small"
                        className="cloneButton"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => handleClone(protocol)}
                      >
                        Clone
                      </Button>
                    )}
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
                : 'There are no public protocols available at the moment'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}