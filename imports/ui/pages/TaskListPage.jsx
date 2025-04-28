// in imports/ui/pages/TaskListPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Box, Container, Typography } from '@mui/material';

// Import collections
import { TasksCollection } from '../../db/TasksCollection';

// Import actual components
import TaskForm from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { TaskFilter } from '../components/TaskFilter';

export default function TaskListPage() {
  // Get filter from URL parameters
  const { filter: urlFilter } = useParams();
  
  // State
  const [filter, setFilter] = useState(urlFilter || 'all');
  const [sort, setSort] = useState('lastModified');
  
  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter) {
      setFilter(urlFilter);
    } else {
      // Default to 'all' when on the root path
      setFilter('all');
    }
  }, [urlFilter]);
  
  // Track task counts for filters
  const { taskCounts } = useTracker(function() {
    // Subscribe to tasks
    Meteor.subscribe('tasks.mine');
    
    // Count tasks for each filter
    const all = TasksCollection.find({ isDeleted: { $ne: true } }).count();
    const active = TasksCollection.find({ 
      status: { $nin: ['completed', 'cancelled', 'entered-in-error'] },
      isDeleted: { $ne: true }
    }).count();
    const completed = TasksCollection.find({ 
      status: 'completed', 
      isDeleted: { $ne: true } 
    }).count();
    
    // Count due soon tasks
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + 7);
    const dueSoon = TasksCollection.find({
      'executionPeriod.end': { $lte: cutoffDate, $gte: new Date() },
      status: { $nin: ['completed', 'cancelled', 'entered-in-error'] },
      isDeleted: { $ne: true }
    }).count();
    
    return {
      taskCounts: {
        all,
        active,
        completed,
        dueSoon
      }
    };
  });
  
  // Event handlers
  const handleFilterChange = function(newFilter) {
    setFilter(newFilter);
  };
  
  const handleSortChange = function(newSort) {
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
      
      <Box sx={{ mb: 3 }}>
        <TaskForm />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TaskFilter 
          filter={filter} 
          onFilterChange={handleFilterChange}
          sort={sort}
          onSortChange={handleSortChange}
          taskCounts={taskCounts}
        />
      </Box>
      
      <Box>
        <TaskList filter={filter} />
      </Box>
    </Container>
  );
}