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
  Alert
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

/**
 * ListForm component for creating/editing lists
 * @param {Object} props Component properties
 * @param {Object} props.list Existing list (if editing)
 * @param {Function} props.onSave Callback after successful save
 * @param {Boolean} props.isEdit Whether we're editing an existing list or creating a new one
 */
export function ListForm({ list, onSave, isEdit = false }) {
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
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isSubmitting}
              />
            }
            label={isPublic ? "Public (visible to everyone)" : "Private (only visible to you)"}
            sx={{ mt: 2 }}
          />
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
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