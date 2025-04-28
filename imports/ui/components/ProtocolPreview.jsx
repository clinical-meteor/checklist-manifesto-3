// imports/ui/components/ProtocolPreview.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Material UI components
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  IconButton
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PublicIcon from '@mui/icons-material/Public';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';

/**
 * Dialog to preview a protocol before cloning it
 */
export default function ProtocolPreview({ protocolId, open, onClose, onClone }) {
  // State
  const [protocol, setProtocol] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cloning, setCloning] = useState(false);
  
  // Load protocol data when dialog opens
  useEffect(() => {
    if (open && protocolId) {
      setLoading(true);
      setError('');
      
      // Get protocol details
      Meteor.call('protocols.get', protocolId, (err, result) => {
        if (err) {
          console.error('Error loading protocol:', err);
          setError(get(err, 'reason', 'Failed to load protocol'));
          setLoading(false);
        } else {
          setProtocol(result);
          
          // Get protocol subtasks
          Meteor.call('protocols.getSubtasks', protocolId, (subErr, subResult) => {
            setLoading(false);
            
            if (subErr) {
              console.error('Error loading subtasks:', subErr);
              setError(get(subErr, 'reason', 'Failed to load protocol tasks'));
            } else {
              setSubtasks(subResult || []);
            }
          });
        }
      });
    }
  }, [open, protocolId]);
  
  // Reset state when dialog closes
  const handleClose = () => {
    if (!cloning) {
      setProtocol(null);
      setSubtasks([]);
      setError('');
      onClose();
    }
  };
  
  // Handle protocol cloning
  const handleClone = () => {
    if (!protocol) return;
    
    setCloning(true);
    setError('');
    
    Meteor.call('protocols.createTaskFromProtocol', protocol._id, (err, result) => {
      setCloning(false);
      
      if (err) {
        console.error('Error cloning protocol:', err);
        setError(get(err, 'reason', 'Failed to clone protocol'));
      } else {
        // Call the onClone callback with the new task ID
        if (onClone) {
          onClone(result);
        }
        handleClose();
      }
    });
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return moment(date).format('MMM D, YYYY');
  };
  
  // Get priority display info
  const getPriorityInfo = (priorityValue) => {
    const priorityMap = {
      'routine': { color: 'success', label: 'Routine' },
      'urgent': { color: 'error', label: 'Urgent' },
      'asap': { color: 'warning', label: 'ASAP' },
      'stat': { color: 'error', label: 'STAT' }
    };

    return priorityMap[priorityValue] || { color: 'default', label: priorityValue };
  };
  
  // Loading state
  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="protocol-preview-title"
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="protocol-preview-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Protocol Preview
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  // Protocol not found
  if (!protocol) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="protocol-preview-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Protocol Preview
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>Protocol not found or you don't have permission to view it.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  // Render protocol preview
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="protocol-preview-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="protocol-preview-title">
        Protocol Preview
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {protocol.description}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {protocol.public && (
              <Chip 
                icon={<PublicIcon />} 
                label="Public" 
                color="primary" 
                variant="outlined" 
              />
            )}
            
            {protocol.priority && (
              <Chip 
                label={getPriorityInfo(protocol.priority).label} 
                color={getPriorityInfo(protocol.priority).color} 
              />
            )}
            
            {protocol.status && (
              <Chip 
                label={protocol.status} 
                variant="outlined" 
              />
            )}
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body2">
                  {protocol.requesterName || "Anonymous"}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(protocol.authoredOn)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(protocol.lastModified)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Tasks ({subtasks.length})
        </Typography>
        
        {subtasks.length > 0 ? (
          <List sx={{ bgcolor: 'background.paper' }}>
            {subtasks.map((task, index) => (
              <ListItem key={task._id} divider={index < subtasks.length - 1}>
                <ListItemIcon>
                  <CheckCircleOutlineIcon />
                </ListItemIcon>
                <ListItemText primary={task.description} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              This protocol does not contain any subtasks.
            </Typography>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          variant="text"
          onClick={handleClose}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={cloning ? <CircularProgress size={20} /> : <ContentCopyIcon />}
          onClick={handleClone}
          disabled={cloning || !Meteor.userId()}
        >
          {cloning ? 'Cloning...' : 'Clone Protocol'}
        </Button>
      </DialogActions>