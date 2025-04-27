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
  CardActions, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Typography, 
  Collapse, 
  IconButton, 
  CircularProgress 
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// Icons
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function TaskForm() {
  // Form state
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('routine');
  const [dueDate, setDueDate] = useState(null);
  const [expanded, setExpanded] = useState(false);
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
      priority
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
        setExpanded(false);
      }
    });
  }

  // Toggle expanded advanced options
  function handleExpandClick() {
    setExpanded(!expanded);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create New Task
          </Typography>
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          <TextField
            label="Task Description"
            variant="outlined"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isSubmitting}
            margin="normal"
            id="newTaskInput"
          />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mt: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              Advanced Options
            </Typography>
            
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    label="Due Date"
                    value={dueDate}
                    onChange={setDueDate}
                    slotProps={{ textField: { fullWidth: true } }}
                    disabled={isSubmitting}
                    minDateTime={moment()}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            type="submit"
            disabled={!description || isSubmitting}
            id="newItemAddIcon"
          >
            {isSubmitting ? 'Creating...' : 'Add Task'}
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}