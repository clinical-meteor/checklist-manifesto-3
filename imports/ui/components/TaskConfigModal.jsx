// imports/ui/components/TaskConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Material UI components
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  FormControl,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Modal dialog for configuring task lists/protocols
 */
export default function TaskConfigModal({ 
  open, 
  onClose, 
  taskId, 
  isProtocol = false 
}) {
  // State
  const [task, setTask] = useState(null);
  const [mode, setMode] = useState('edit'); // 'edit' or 'delete'
  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load task data when modal opens
  useEffect(() => {
    if (open && taskId) {
      setLoading(true);
      
      Meteor.call('tasks.get', taskId, (err, result) => {
        setLoading(false);
        
        if (err) {
          console.error('Error loading task:', err);
          setError(get(err, 'reason', 'Failed to load task'));
        } else if (result) {
          setTask(result);
          setName(result.description || '');
          setIsPublic(!!result.public);
        }
      });
    }
  }, [open, taskId]);

  // Reset form when dialog closes
  const handleClose = () => {
    setMode('edit');
    setTabValue(0);
    setName('');
    setIsPublic(false);
    setConfirmName('');
    setError('');
    setSuccess('');
    onClose();
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Switch to delete confirmation mode
  const handleShowDeleteConfirmation = () => {
    setMode('delete');
  };

  // Switch back to edit mode
  const handleCancelDelete = () => {
    setMode('edit');
    setConfirmName('');
  };

  // Handle saving changes
  const handleSave = () => {
    if (!task) return;
    
    setLoading(true);
    setError('');
    
    const updates = {
      description: name
    };
    
    Meteor.call('tasks.update', task._id, updates, (err, result) => {
      if (err) {
        console.error('Error updating task:', err);
        setError(get(err, 'reason', 'Failed to update task'));
        setLoading(false);
      } else {
        // If public status is different than current, update it
        if (isPublic !== !!task.public) {
          Meteor.call('tasks.togglePublic', task._id, isPublic, (toggleErr) => {
            setLoading(false);
            
            if (toggleErr) {
              console.error('Error toggling public status:', toggleErr);
              setError(get(toggleErr, 'reason', 'Failed to update visibility'));
            } else {
              setSuccess('Task updated successfully');
              setTimeout(handleClose, 1500);
            }
          });
        } else {
          setLoading(false);
          setSuccess('Task updated successfully');
          setTimeout(handleClose, 1500);
        }
      }
    });
  };

  // Handle task deletion
  const handleDelete = () => {
    if (!task) return;
    
    // Confirm that the entered name matches the task name
    if (confirmName !== task.description) {
      setError('Task name does not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    Meteor.call('tasks.remove', task._id, (err, result) => {
      setLoading(false);
      
      if (err) {
        console.error('Error deleting task:', err);
        setError(get(err, 'reason', 'Failed to delete task'));
      } else {
        setSuccess('Task deleted successfully');
        setTimeout(handleClose, 1500);
      }
    });
  };

  // Render loading state
  if (loading && !task) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Render delete confirmation
  if (mode === 'delete') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText color="error" paragraph>
            This action cannot be undone. The task will be permanently deleted.
          </DialogContentText>
          
          <DialogContentText paragraph>
            To confirm, please type the exact name of the task: 
            <Box component="span" fontWeight="bold">
              {task?.description}
            </Box>
          </DialogContentText>
          
          <TextField
            fullWidth
            label="Task Name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            error={confirmName !== '' && confirmName !== task?.description}
            helperText={confirmName !== '' && confirmName !== task?.description ? "Name doesn't match" : ''}
            disabled={loading}
            margin="normal"
            id="configListModalInput"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCancelDelete}
            startIcon={<CancelIcon />}
            disabled={loading}
            id="cancelRemoveListButton"
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={handleDelete}
            disabled={loading || confirmName !== task?.description}
            startIcon={loading ? <CircularProgress size={24} /> : <DeleteIcon />}
            id="confirmRemoveListButton"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Render edit mode
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle id="configListModalTitle">
        {isProtocol ? 'Configure Protocol' : 'Configure Task'}
      </DialogTitle>
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="configuration tabs"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="General" id="general-tab" />
        {isProtocol && <Tab label="Sharing" id="sharing-tab" />}
      </Tabs>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {/* General Tab */}
        {tabValue === 0 && (
          <Box>
            <TextField
              fullWidth
              label={isProtocol ? "Protocol Name" : "Task Name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              id="listNameInput"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={loading}
                />
              }
              label={isPublic ? "Public (visible to everyone)" : "Private (only visible to you)"}
              sx={{ mt: 2 }}
            />
            
            <Box sx={{ display: 'flex', mt: 2 }}>
              <Button
                variant={isPublic ? "contained" : "outlined"}
                startIcon={<PublicIcon />}
                onClick={() => setIsPublic(true)}
                sx={{ mr: 1 }}
                disabled={loading}
                id="publicListButton"
              >
                Public
              </Button>
              <Button
                variant={!isPublic ? "contained" : "outlined"}
                startIcon={<LockIcon />}
                onClick={() => setIsPublic(false)}
                disabled={loading}
                id="privateListButton"
              >
                Private
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Sharing Tab */}
        {tabValue === 1 && isProtocol && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Sharing Options
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              When you make a protocol public, other users can view and clone it.
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={loading}
                />
              }
              label={isPublic ? "Public (visible to everyone)" : "Private (only visible to you)"}
            />
          </Box>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          color="error"
          onClick={handleShowDeleteConfirmation}
          startIcon={<DeleteIcon />}
          disabled={loading}
          id="deleteListButton"
        >
          Delete
        </Button>
        
        <Box>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ mr: 1 }}
            id="cancelEditListButton"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
            disabled={loading || !name}
            id="saveListButton"
          >
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}