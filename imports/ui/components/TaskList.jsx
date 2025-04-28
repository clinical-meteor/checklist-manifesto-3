// imports/ui/components/TaskList.jsx - with fixed sorting
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { TasksCollection } from '/imports/db/TasksCollection';
import moment from 'moment';

// Material UI components
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ScheduleIcon from '@mui/icons-material/Schedule';

export function TaskList({ filter, sort = 'lastModified' }) {
  // Local state for sorted tasks
  const [sortedTasks, setSortedTasks] = useState([]);

  // Track tasks based on the current filter
  const { tasks, isLoading } = useTracker(function() {
    // Different subscription based on filter
    let tasksSub;
    
    if (filter === 'completed') {
      tasksSub = Meteor.subscribe('tasks.byStatus', 'completed');
    } else if (filter === 'active') {
      // Active = not completed or cancelled
      tasksSub = Meteor.subscribe('tasks.mine');
    } else if (filter === 'due-soon') {
      tasksSub = Meteor.subscribe('tasks.dueSoon', 7); // Next 7 days
    } else {
      // Default: all tasks
      tasksSub = Meteor.subscribe('tasks.mine');
    }

    // Custom selector based on filter
    let selector = { isDeleted: { $ne: true } };
    
    if (filter === 'completed') {
      selector.status = 'completed';
    } else if (filter === 'active') {
      selector.status = { $nin: ['completed', 'cancelled', 'entered-in-error'] };
    } else if (filter === 'due-soon') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + 7);
      
      selector['executionPeriod.end'] = { $lte: cutoffDate, $gte: new Date() };
      selector.status = { $nin: ['completed', 'cancelled', 'entered-in-error'] };
    }

    // We'll only apply basic sorting in the database query
    // and do more complex sorting in the component
    return {
      tasks: TasksCollection.find(
        selector,
        { sort: { lastModified: -1 } }
      ).fetch(),
      isLoading: !tasksSub.ready()
    };
  }, [filter]);

  // Apply sorting when tasks or sort parameter changes
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setSortedTasks([]);
      return;
    }

    // Apply sorting based on the sort parameter
    let sorted = [...tasks]; // Create a new array to avoid modifying the original
    
    switch (sort) {
      case 'dueDate':
        // Sort by due date (ascending, with null dates at the end)
        sorted = sorted.sort((a, b) => {
          const dateA = get(a, 'executionPeriod.end');
          const dateB = get(b, 'executionPeriod.end');
          
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1; // A goes after B
          if (!dateB) return -1; // A goes before B
          
          return new Date(dateA) - new Date(dateB);
        });
        break;
        
      case 'priority':
        // Sort by priority (urgent > stat > asap > routine)
        const priorityOrder = {
          'stat': 1,
          'urgent': 2,
          'asap': 3,
          'routine': 4
        };
        
        sorted = sorted.sort((a, b) => {
          const priorityA = get(a, 'priority', 'routine');
          const priorityB = get(b, 'priority', 'routine');
          const orderA = get(priorityOrder, priorityA, 5);
          const orderB = get(priorityOrder, priorityB, 5);
          return orderA - orderB;
        });
        break;
        
      case 'status':
        // Sort by status alphabetically
        sorted = sorted.sort((a, b) => {
          const statusA = get(a, 'status', '');
          const statusB = get(b, 'status', '');
          return statusA.localeCompare(statusB);
        });
        break;
        
      case 'description':
        // Sort alphabetically by description
        sorted = sorted.sort((a, b) => {
          const descA = get(a, 'description', '');
          const descB = get(b, 'description', '');
          return descA.localeCompare(descB);
        });
        break;
        
      case 'authoredOn':
        // Sort by creation date (newest first)
        sorted = sorted.sort((a, b) => {
          const dateA = get(a, 'authoredOn');
          const dateB = get(b, 'authoredOn');
          
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          return new Date(dateB) - new Date(dateA);
        });
        break;
        
      default:
        // Default sort by last modified (newest first)
        sorted = sorted.sort((a, b) => {
          const dateA = get(a, 'lastModified');
          const dateB = get(b, 'lastModified');
          
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          return new Date(dateB) - new Date(dateA);
        });
    }
    
    setSortedTasks(sorted);
  }, [tasks, sort]); // Make sure sort is included in the dependency array

  // Handle task deletion
  async function handleDeleteTask(taskId) {
    try {
      await new Promise((resolve, reject) => {
        Meteor.call('tasks.remove', taskId, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(`Failed to delete task: ${error.message}`);
    }
  }

  // Handle task status toggle
  async function handleToggleStatus(task) {
    try {
      const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
      await new Promise((resolve, reject) => {
        Meteor.call('tasks.setStatus', task._id, newStatus, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(`Failed to update task: ${error.message}`);
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Display message if no tasks
  if (!sortedTasks.length && !isLoading) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" align="center">
          No tasks found. Create a new task to get started!
        </Typography>
      </Paper>
    );
  }

  // Render task list
  return (
    <Paper>
      <List>
        {sortedTasks.map((task) => (
          <React.Fragment key={task._id}>
            <ListItem
              className={`task-priority-${get(task, 'priority', 'routine')} 
                ${task.status === 'completed' ? 'task-completed' : ''}`}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDeleteTask(task._id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={task.status === 'completed'}
                  onChange={() => handleToggleStatus(task)}
                />
              </ListItemIcon>
              <ListItemText
                primary={task.description}
                secondary={
                  // Don't use Typography directly, which creates <p> tags
                  <Box sx={{ mt: 1 }}>
                    {/* Chips in a horizontal row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Chip 
                        size="small" 
                        label={task.status} 
                        color={task.status === 'completed' ? 'success' : 'default'} 
                        variant="outlined"
                      />
                      
                      {task.priority && (
                        <Chip 
                          size="small" 
                          label={task.priority} 
                          color={
                            task.priority === 'urgent' || task.priority === 'stat' 
                              ? 'error' 
                              : task.priority === 'asap' 
                                ? 'warning' 
                                : 'default'
                          } 
                          variant="outlined"
                          icon={<PriorityHighIcon />}
                        />
                      )}
                      
                      {get(task, 'executionPeriod.end') && (
                        <Tooltip title="Due date">
                          <Chip 
                            size="small"
                            icon={<ScheduleIcon />}
                            label={`Due ${moment(get(task, 'executionPeriod.end')).format('MMM D, YYYY')}`}
                            variant="outlined"
                            color={
                              moment(get(task, 'executionPeriod.end')).isBefore(new Date()) && 
                              task.status !== 'completed' 
                                ? 'error' 
                                : 'default'
                            }
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}