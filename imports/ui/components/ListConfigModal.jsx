// imports/ui/components/ListConfigModal.jsx
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
  Tab,
  IconButton
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Modal dialog for configuring list settings
 */
export function ListConfigModal({ open, onClose, listId }) {
  // Component state
  const [mode, setMode] = useState('edit'); // 'edit' or 'delete'
  const [tabValue, setTabValue] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load list data when modal opens
  useEffect(() => {
    if (open && listId) {
      setLoading(true);
      
      Meteor.call('lists.get', listId, (err, result) => {
        setLoading(false);
        
        if (err) {
          console.error('Error loading list:', err);
          setError(get(err, 'reason', 'Failed to load list'));
        } else if (result) {
          setTitle(result.title || result.name || '');
          setDescription(result.description || '');
          setIsPublic(!!result.public);
        }
      });
    }
  }, [open, listId]);

  // Reset form when dialog closes
  const handleClose = () => {
    setMode('edit');
    setTabValue(0);
    setTitle('');
    setDescription('');
    setIsPublic(false);
    setConfirmTitle('');
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
    setConfirmTitle('');
  };

  // Handle saving changes
  const handleSave = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const updates = {
      title: title.trim(),
      description: description.trim(),
      public: isPublic
    };
    
    Meteor.call('lists.update', listId, updates, (err, result) => {
      setSubmitting(false);
      
      if (err) {
        console.error('Error updating list:', err);
        setError(get(err, 'reason', 'Failed to update list'));
      } else {
        setSuccess('List updated successfully');
        setTimeout(handleClose, 1500);
      }
    });
  };

  // Handle list deletion
  const handleDelete = () => {
    if (confirmTitle !== title) {
      setError('List name does not match');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    Meteor.call('lists.remove', listId, (err, result) => {
      setSubmitting(false);
      
      if (err) {
        console.error('Error deleting list:', err);
        setError(get(err, 'reason', 'Failed to delete list'));
      } else {
        setSuccess('List deleted successfully');
        setTimeout(handleClose, 1500);
      }
    });
  };

  // Render loading state
  if (loading && !title) {
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
        <DialogTitle id="configListModalTitle">
          Confirm Deletion
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            className="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
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
          
          <DialogContentText id="configListModalMessage" color="error" paragraph>
            This action cannot be undone. The list and all its tasks will be permanently deleted.
          </DialogContentText>
          
          <DialogContentText paragraph>
            To confirm, please type the exact name of the list:&nbsp;
            <Box component="span" fontWeight="bold">
              {title}
            </Box>
          </DialogContentText>
          
          <TextField
            fullWidth
            label="List Name"
            value={confirmTitle}
            onChange={(e) => setConfirmTitle(e.target.value)}
            error={confirmTitle !== '' && confirmTitle !== title}
            helperText={confirmTitle !== '' && confirmTitle !== title ? "Name doesn't match" : ''}
            disabled={submitting}
            margin="normal"
            id="configListModalInput"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCancelDelete}
            startIcon={<CancelIcon />}
            disabled={submitting}
            id="cancelRemoveListButton"
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={handleDelete}
            disabled={submitting || confirmTitle !== title}
            startIcon={submitting ? <CircularProgress size={24} /> : <DeleteIcon />}
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth id="configListModal">
      <DialogTitle id="configListModalTitle">
        Configure List
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          className="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="configuration tabs"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="General" id="general-tab" />
        <Tab label="Sharing" id="sharing-tab" />
      </Tabs>
      
      <DialogContent className={tabValue === 0 ? "isEditing" : ""}>
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
              label="List Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
              disabled={submitting}
              id="listNameInput"
            />
            
            <TextField
              fullWidth
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
              disabled={submitting}
              id="listDescriptionInput"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={submitting}
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
                disabled={submitting}
                id="publicListButton"
                className={isPublic ? "btn-default" : "btn-active"}
              >
                Public
              </Button>
              <Button
                variant={!isPublic ? "contained" : "outlined"}
                startIcon={<LockIcon />}
                onClick={() => setIsPublic(false)}
                disabled={submitting}
                id="privateListButton"
                className={!isPublic ? "btn-default" : "btn-active"}
              >
                Private
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Sharing Tab */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Sharing Options
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              When you make a list public, other users can view and clone it.
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={submitting}
                />
              }
              label={isPublic ? "Public (visible to everyone)" : "Private (only visible to you)"}
            />
          </Box>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }} className="modal-footer alert-danger">
        <Button
          color="error"
          onClick={handleShowDeleteConfirmation}
          startIcon={<DeleteIcon />}
          disabled={submitting}
          id="deleteListButton"
        >
          Delete List
        </Button>
        
        <Box>
          <Button
            onClick={handleClose}
            disabled={submitting}
            sx={{ mr: 1 }}
            id="cancelEditListButton"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={submitting ? <CircularProgress size={24} /> : <SaveIcon />}
            disabled={submitting || !title}
            id="saveListButton"
          >
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default ListConfigModal;