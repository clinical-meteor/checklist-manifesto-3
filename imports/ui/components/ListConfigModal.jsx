// imports/ui/components/ListConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { ListsCollection } from '/imports/db/ListsCollection';

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
 * ListConfigModal component for configuring list settings
 * @param {Object} props Component properties
 * @param {Boolean} props.open Whether the modal is open
 * @param {Function} props.onClose Callback when modal is closed
 * @param {String} props.listId ID of the list to configure
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
  
  // Subscribe to the list data
  const { list } = useTracker(() => {
    const noData = { list: null };
    
    if (!open || !listId) {
      return noData;
    }
    
    const listSub = Meteor.subscribe('lists.byId', listId);
    
    if (!listSub.ready()) {
      return noData;
    }
    
    return {
      list: ListsCollection.findOne(listId)
    };
  }, [open, listId]);
  
  // Initialize form data when list is loaded
  useEffect(() => {
    if (list) {
      setTitle(list.title || list.name || '');
      setDescription(list.description || '');
      setIsPublic(!!list.public);
      setLoading(false);
    }
  }, [list]);
  
  // Reset state when modal is closed
  function handleClose() {
    setMode('edit');
    setTabValue(0);
    setTitle('');
    setDescription('');
    setIsPublic(false);
    setConfirmTitle('');
    setError('');
    setSuccess('');
    setLoading(true);
    onClose();
  }
  
  // Handle tab change
  function handleTabChange(event, newValue) {
    setTabValue(newValue);
  }
  
  // Toggle public/private status
  function handleTogglePublic() {
    setIsPublic(!isPublic);
  }
  
  // Switch to delete confirmation mode
  function handleShowDeleteConfirmation() {
    setMode('delete');
  }
  
  // Switch back to edit mode
  function handleCancelDelete() {
    setMode('edit');
    setConfirmTitle('');
  }
  
  // Handle saving changes
  function handleSave() {
    if (!list) return;
    
    setSubmitting(true);
    setError('');
    
    const updates = {
      title: title,
      name: title, // For backward compatibility
      description: description,
      public: isPublic
    };
    
    Meteor.call('lists.update', list._id, updates, (err, result) => {
      setSubmitting(false);
      
      if (err) {
        console.error('Error updating list:', err);
        setError(get(err, 'reason', 'Failed to update list'));
      } else {
        setSuccess('List updated successfully');
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    });
  }
  
  // Handle list deletion
  function handleDelete() {
    if (!list) return;
    
    // Confirm that the entered name matches the list name
    if (confirmTitle !== (list.title || list.name)) {
      setError('List name does not match');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    Meteor.call('lists.remove', list._id, (err, result) => {
      setSubmitting(false);
      
      if (err) {
        console.error('Error deleting list:', err);
        setError(get(err, 'reason', 'Failed to delete list'));
      } else {
        setSuccess('List deleted successfully');
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    });
  }
  
  // Render loading state
  if (loading && !list) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth id="configListModal">
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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth id="configListModal">
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
            To confirm, please type the exact name of the list: 
            <Box component="span" fontWeight="bold">
              {list?.title || list?.name}
            </Box>
          </DialogContentText>
          
          <TextField
            fullWidth
            label="List Name"
            value={confirmTitle}
            onChange={(e) => setConfirmTitle(e.target.value)}
            error={confirmTitle !== '' && confirmTitle !== (list?.title || list?.name)}
            helperText={confirmTitle !== '' && confirmTitle !== (list?.title || list?.name) ? "Name doesn't match" : ''}
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
            disabled={submitting || confirmTitle !== (list?.title || list?.name)}
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