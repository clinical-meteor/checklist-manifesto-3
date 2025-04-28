// imports/ui/components/TaskForm.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Material UI components
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  CircularProgress 
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// Icons
import AddIcon from '@mui/icons-material/Add';

export default function TaskForm({ listId, onSuccess }) {
  // Form state
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('routine');
  const [dueDate, setDueDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle form submission
  function handleSubmit(event) {
    event.preventDefault();
    
    if (!description) return;
    
    setIsSubmitting(true);
    setError('');
    
    // Create the options object with proper date handling
    const options = {
      priority,
      // Include listId if provided
      ...(listId && { listId })
    };
    
    // Only add dueDate if it exists
    if (dueDate) {
      options.dueDate = dueDate.toDate();
    }
    
    // Call the Meteor method to create a task
    Meteor.call('tasks.insert', description, options, (error, result) => {
      setIsSubmitting(false);
      
      if (error) {
        console.error('Error creating task:', error);
        setError(get(error, 'reason', 'Failed to create task. Please try again.'));
      } else {
        // Reset form on success
        setDescription('');
        setPriority('routine');
        setDueDate(null);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
      }
    });
  }

  return (
    <Card sx={{ mb: 3 }}>
      <form onSubmit={handleSubmit}>
        <CardContent sx={{ p: 2, pb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Task description input */}
            <Grid item xs={12} md={5}>
              <TextField
                placeholder="Create new task..."
                variant="outlined"
                fullWidth
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isSubmitting}
                id="newTaskInput"
                inputProps={{
                  id: "task-description-field" // For focus targeting
                }}
                sx={{ mb: 0 }}
              />
            </Grid>

            {/* Priority selection */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={isSubmitting}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="asap">ASAP</MenuItem>
                  <MenuItem value="stat">STAT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Due date picker */}
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateTimePicker
                  label="Due Date"
                  value={dueDate}
                  onChange={setDueDate}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  disabled={isSubmitting}
                  minDateTime={moment()}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Add button */}
            <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                type="submit"
                disabled={!description || isSubmitting}
                id="newItemAddIcon"
                sx={{ height: '40px' }}
              >
                Add Task
              </Button>
            </Grid>
            
            {/* Error message */}
            {error && (
              <Grid item xs={12}>
                <Box sx={{ color: 'error.main', mt: 1, fontSize: '0.875rem' }}>
                  {error}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </form>
    </Card>
  );
}