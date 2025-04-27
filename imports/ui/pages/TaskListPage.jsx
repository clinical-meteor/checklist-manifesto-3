// imports/ui/pages/TaskListPage.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';

// Create simple placeholder components for now
// These will be replaced with your actual components
const TaskForm = () => (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>Add New Task</Typography>
    <Typography variant="body2" color="text.secondary">
      Task form component will be implemented here
    </Typography>
  </Paper>
);

const TaskFilter = ({ filter, onFilterChange, sort, onSortChange }) => (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>Task Filters</Typography>
    <Typography variant="body2" color="text.secondary">
      Filter: {filter}, Sort: {sort}
    </Typography>
  </Paper>
);

const TaskList = ({ filter, sort }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Task List</Typography>
    <Typography variant="body2" color="text.secondary">
      Displaying tasks with filter: {filter} and sort: {sort}
    </Typography>
  </Paper>
);

/**
 * Task list page that displays a list of tasks with filtering options
 * and form for adding new tasks
 */
export default function TaskListPage() {
  // Get filter from URL parameters
  const { filter: urlFilter } = useParams();
  
  // State
  const [filter, setFilter] = useState(urlFilter || 'all');
  const [sort, setSort] = useState('lastModified');
  
  // Event handlers
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  const handleSortChange = (newSort) => {
    setSort(newSort);
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, organize, and track your tasks efficiently
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TaskForm />
        </Grid>
        
        <Grid item xs={12}>
          <TaskFilter 
            filter={filter} 
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TaskList filter={filter} sort={sort} />
        </Grid>
      </Grid>
    </Container>
  );
}