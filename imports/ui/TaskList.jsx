// imports/ui/TaskList.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { TasksCollection, isTaskCompleted, formatTaskDate } from '/imports/db/TasksCollection';
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

// Import Task component
import { Task } from './Task';

export function TaskList({ filter }) {
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
    
    // Fetch tasks based on selector
    const tasksList = TasksCollection.find(
      selector,
      { sort: { lastModified: -1 } }
    ).fetch();

    return {
      tasks: tasksList,
      isLoading: !tasksSub.ready()
    };
  });

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
  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" align="center">
          No tasks found. Create a new task to get started!
        </Typography>
      </Paper>
    );
  }

  // Get filter title
  let filterTitle = 'All Tasks';
  if (filter === 'completed') filterTitle = 'Completed Tasks';
  if (filter === 'active') filterTitle = 'Active Tasks';
  if (filter === 'due-soon') filterTitle = 'Tasks Due Soon';

  // Render task list
  return (
    <Paper>
      <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
        <Typography variant="h6">{filterTitle}</Typography>
      </Box>
      <List>
        {tasks.map((task) => (
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
                  <React.Fragment>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
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
                  </React.Fragment>
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