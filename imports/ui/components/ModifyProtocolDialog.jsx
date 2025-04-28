// imports/ui/components/ModifyProtocolDialog.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Material UI components
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Dialog for converting a task to a protocol template or modifying an existing protocol
 */
export default function ModifyProtocolDialog({ 
  open, 
  onClose, 
  taskId, 
  isEditing = false, 
  onSave 
}) {
  // State
  const [task, setTask] = useState(null);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Load task data when dialog opens
  useEffect(() => {
    if (open && taskId) {
      setLoading(true);
      
      // Use the appropriate method based on whether we're editing a protocol or converting a task
      const methodName = isEditing ? 'protocols.get' : 'tasks.get';
      
      Meteor.call(methodName, taskId, (err, result) => {
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
  }, [open, taskId, isEditing]);
  
  // Reset state when dialog closes
  const handleClose = () => {
    setTask(null);
    setName('');
    setIsPublic(false);
    setError('');
    onClose();
  };
  
  // Handle save (create or update protocol)
  const handleSave = () => {
    if (!task) return;
    
    setSaving(true);
    setError('');
    
    // Use different methods based on whether we're editing or creating
    const methodName = isEditing ? 'protocols.update' : 'protocols.createFromTask';
    const methodParams = isEditing ? 
      [task._id, { description: name, public: isPublic }] : 
      [task._id, isPublic];
    
    Meteor.call(methodName, ...methodParams, (err, result) => {
      setSaving(false);
      
      if (err) {
        console.error('Error saving protocol:', err);
        setError(get(err, 'reason', 'Failed to save protocol'));
      } else {
        // Call the onSave callback with the new or updated protocol ID
        if (onSave) {
          onSave(result || task._id);
        }
        handleClose();
      }
    });
  };
  
  // Loading state
  if (loading && !task) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="modify-protocol-title"
        maxWidth="sm"
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
  
  // Render dialog
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="modify-protocol-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="modify-protocol-title">
        {isEditing ? 'Edit Protocol' : 'Create Protocol Template'}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
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
        
        <Typography variant="body2" paragraph sx={{ mb: 3 }}>
          {isEditing 
            ? 'Update this protocol template to share with others.'
            : 'Convert this task to a reusable protocol template that can be shared with others.'
          }
        </Typography>
        
        <TextField
          fullWidth
          label="Protocol Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          disabled={saving}
        />
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Visibility
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={saving}
              />
            }
            label={isPublic ? "Public (visible to everyone)" : "Private (only visible to you)"}
          />
          
          <Box sx={{ display: 'flex', mt: 2 }}>
            <Button
              variant={isPublic ? "contained" : "outlined"}
              startIcon={<PublicIcon />}
              onClick={() => setIsPublic(true)}
              sx={{ mr: 1 }}
              disabled={saving}
            >
              Public
            </Button>
            <Button
              variant={!isPublic ? "contained" : "outlined"}
              startIcon={<LockIcon />}
              onClick={() => setIsPublic(false)}
              disabled={saving}
            >
              Private
            </Button>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || !name}
        >
          {saving ? 'Saving...' : (isEditing ? 'Update Protocol' : 'Create Protocol')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}