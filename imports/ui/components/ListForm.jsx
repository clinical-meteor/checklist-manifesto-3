// imports/ui/components/ListForm.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Material UI components
import {
  Box,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
  Typography,
  Alert,
  IconButton,
  Grid
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

/**
 * ListForm component for creating/editing lists
 * @param {Object} props Component properties
 * @param {Object} props.list Existing list (if editing)
 * @param {Function} props.onSave Callback after successful save
 * @param {Function} props.onCancel Callback to cancel form
 * @param {Boolean} props.isEdit Whether we're editing an existing list or creating a new one
 */
export function ListForm({ list, onSave, onCancel, isEdit = false }) {
  // Form state
  const [title, setTitle] = useState(get(list, 'title', '') || get(list, 'name', ''));
  const [description, setDescription] = useState(get(list, 'description', ''));
  const [isPublic, setIsPublic] = useState(get(list, 'public', false));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Handle form submission
  function handleSubmit(event) {
    event.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    // Prepare data object
    const listData = {
      title: title.trim(),
      description: description.trim(),
      public: isPublic
    };
    
    if (isEdit && list) {
      // Update existing list
      Meteor.call('lists.update', list._id, listData, (err, result) => {
        setIsSubmitting(false);
        
        if (err) {
          console.error('Error updating list:', err);
          setError(get(err, 'reason', 'Failed to update list. Please try again.'));
        } else {
          // Reset form and call onSave callback
          if (onSave) {
            onSave(list._id);
          }
        }
      });
    } else {
      // Create new list
      Meteor.call('lists.create', listData, (err, result) => {
        setIsSubmitting(false);
        
        if (err) {
          console.error('Error creating list:', err);
          setError(get(err, 'reason', 'Failed to create list. Please try again.'));
        } else {
          // Reset form and call onSave callback
          setTitle('');
          setDescription('');
          setIsPublic(false);
          
          if (onSave) {
            onSave(result);
          }
        }
      });
    }
  }
  
  // Handle cancel button
  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {isEdit ? 'Edit List' : 'Create New List'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="List Title"
            variant="outlined"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSubmitting}
            margin="normal"
            id="listNameInput"
            autoFocus
            placeholder="Enter list title..."
          />
          
          <TextField
            label="Description (Optional)"
            variant="outlined"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            margin="normal"
            multiline
            rows={2}
            placeholder="Enter a description for this list..."
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Visibility
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label={isPublic ? "Public (visible to everyone)" : "Private (only visible to you)"}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={isPublic ? "contained" : "outlined"}
                    startIcon={<PublicIcon />}
                    onClick={() => setIsPublic(true)}
                    disabled={isSubmitting}
                    id="publicListButton"
                    size="small"
                  >
                    Public
                  </Button>
                  <Button
                    variant={!isPublic ? "contained" : "outlined"}
                    startIcon={<LockIcon />}
                    onClick={() => setIsPublic(false)}
                    disabled={isSubmitting}
                    id="privateListButton"
                    size="small"
                  >
                    Private
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            type="submit"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : (isEdit ? <SaveIcon /> : <AddIcon />)}
            disabled={isSubmitting || !title.trim()}
            id={isEdit ? "saveListButton" : "newListButton"}
          >
            {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create List')}
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}

export default ListForm;