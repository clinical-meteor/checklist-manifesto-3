// imports/ui/TaskFilter.jsx
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Material UI components
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

// Icons
import AllInboxIcon from '@mui/icons-material/AllInbox';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';

export function TaskFilter({ filter, onFilterChange, taskCounts, onSortChange, sort }) {
  // Handle filter tab change
  function handleFilterChange(event, newValue) {
    if (onFilterChange) {
      onFilterChange(newValue);
    }
  }

  // Handle sort change
  function handleSortChange(event) {
    if (onSortChange) {
      onSortChange(event.target.value);
    }
  }

  // Get count badge for a filter type
  function getCountBadge(filterType) {
    const count = get(taskCounts, filterType, 0);
    return count > 0 ? count : null;
  }

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={filter}
          onChange={handleFilterChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="task filter tabs"
        >
          <Tab 
            icon={<AllInboxIcon />} 
            iconPosition="start"
            label={
              <Badge 
                badgeContent={getCountBadge('all')} 
                color="primary"
                showZero={false}
              >
                All
              </Badge>
            } 
            value="all" 
          />
          <Tab 
            icon={<PendingIcon />} 
            iconPosition="start"
            label={
              <Badge 
                badgeContent={getCountBadge('active')} 
                color="primary"
                showZero={false}
              >
                Active
              </Badge>
            } 
            value="active" 
          />
          <Tab 
            icon={<CheckCircleIcon />} 
            iconPosition="start"
            label={
              <Badge 
                badgeContent={getCountBadge('completed')} 
                color="primary"
                showZero={false}
              >
                Completed
              </Badge>
            } 
            value="completed" 
          />
          <Tab 
            icon={<AccessTimeIcon />} 
            iconPosition="start"
            label={
              <Badge 
                badgeContent={getCountBadge('dueSoon')} 
                color="error"
                showZero={false}
              >
                Due Soon
              </Badge>
            } 
            value="due-soon" 
          />
        </Tabs>
      </Box>
      
      {/* Additional filter options */}
      <Box sx={{ p: 2, backgroundColor: '#f8f8f8' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <SortIcon fontSize="small" sx={{ mr: 0.5 }} />
              Sort by:
            </Typography>
          </Grid>
          
          <Grid item xs>
            <FormControl variant="outlined" size="small" fullWidth>
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
          </Grid>
          
          <Grid item>
            <Divider orientation="vertical" flexItem />
          </Grid>
          
          <Grid item xs>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="Routine" 
                size="small" 
                color="success" 
                variant="outlined"
                onClick={() => onFilterChange('priority-routine')}
              />
              <Chip 
                label="Urgent" 
                size="small" 
                color="error" 
                variant="outlined"
                onClick={() => onFilterChange('priority-urgent')}
              />
              <Chip 
                label="ASAP" 
                size="small" 
                color="warning" 
                variant="outlined"
                onClick={() => onFilterChange('priority-asap')}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}