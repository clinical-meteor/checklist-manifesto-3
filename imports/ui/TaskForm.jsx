// imports/ui/TaskForm.jsx
import React, { useState } from 'react';
import { get } from 'lodash';
import moment from 'moment';

// Material UI components
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

// Icons
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export function TaskForm() {
  // Form state
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('routine');
  const [dueDate, setDueDate] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission - simulated for demo
  function handleSubmit(event) {
    event.preventDefault();
    
    if (!description) return;
    
    setIsSubmitting(true);
    
    // Simulate task creation
    setTimeout(() => {
      // In a real app, this would save to a database
      console.log('Created task:', {
        description,
        priority,
        dueDate: dueDate ? dueDate.toDate() : null
      });
      
      // Reset form
      setDescription('');
      setPriority('routine');
      setDueDate(null);
      setExpanded(false);
      setIsSubmitting(false);
      
      // Show a success message (in a real app)
      alert('Task created successfully! (Demo only)');
    }, 1000);
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
          
          <TextField
            label="Task Description"
            variant="outlined"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isSubmitting}
            margin="normal"
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
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    disabled={isSubmitting}
                    minDate={moment()}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            type="submit"
            disabled={!description || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Add Task'}
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}