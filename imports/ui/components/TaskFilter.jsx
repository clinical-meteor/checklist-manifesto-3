// imports/ui/components/TaskFilter.jsx
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Material UI components
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';

// Icons
import SortIcon from '@mui/icons-material/Sort';

export function TaskFilter({ filter, onSortChange, sort, taskCounts }) {
  // Handle sort change
  function handleSortChange(event) {
    if (onSortChange) {
      onSortChange(event.target.value);
    }
  }
  
  // Get the filter title based on current filter
  function getFilterTitle() {
    const filterMap = {
      'all': 'All Tasks',
      'active': 'Active Tasks',
      'completed': 'Completed Tasks',
      'due-soon': 'Tasks Due Soon'
    };
    
    return filterMap[filter] || 'Tasks';
  }
  
  // Get count for the current filter
  function getFilterCount() {
    if (!taskCounts) return null;
    return get(taskCounts, filter, 0);
  }

  return (
    <Paper sx={{ mb: 3 }}>
      {/* Header with sort controls */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            {getFilterTitle()}
          </Typography>
          {getFilterCount() !== null && (
            <Chip 
              label={getFilterCount()} 
              size="small" 
              sx={{ ml: 1 }} 
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <SortIcon fontSize="small" sx={{ mr: 0.5 }} />
            Sort by:
          </Typography>
          
          <FormControl variant="outlined" size="small">
            <Select
              value={sort || 'lastModified'}
              onChange={handleSortChange}
              displayEmpty
            >
              <MenuItem value="lastModified">Last Modified</MenuItem>
              <MenuItem value="authoredOn">Creation Date</MenuItem>
              <MenuItem value="dueDate">Due Date</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="description">Description</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Paper>
  );
}