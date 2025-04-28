// imports/ui/pages/CombinedListsPage.jsx
import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

// Material UI components
import { 
  Box, Container, Typography, Paper, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Button, IconButton, TextField,
  InputAdornment, Divider, Chip, CircularProgress, Alert, Grid
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ListIcon from '@mui/icons-material/List';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Components
import ListForm from '../components/ListForm';
import { ListConfigModal } from '../components/ListConfigModal';

// Collections
import { ListsCollection } from '../../db/ListsCollection';

export default function CombinedListsPage() {
  const navigate = useNavigate();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublic, setFilterPublic] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  
  // Track lists data
  const { lists, isLoading, currentUser } = useTracker(() => {
    const listsSub = Meteor.subscribe('lists.all');
    const userSub = Meteor.subscribe('userData');
    
    // Build filter based on search term and visibility settings
    let filter = { isDeleted: { $ne: true } };
    
    if (searchTerm) {
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { name: searchRegex }, // For backward compatibility
        { description: searchRegex }
      ];
    }
    
    if (filterPublic) {
      filter.public = true;
    } else if (Meteor.userId()) {
      // If not showing only public lists, show user's own lists and public lists
      filter.$or = [
        { userId: Meteor.userId() },
        { public: true }
      ];
    }
    
    return {
      isLoading: !listsSub.ready() || !userSub.ready(),
      lists: ListsCollection.find(
        filter,
        { sort: { lastModified: -1 } }
      ).fetch(),
      currentUser: Meteor.user()
    };
  }, [searchTerm, filterPublic]);
  
  // Handle creating a new list
  function handleNewListSaved(listId) {
    setShowForm(false);
    
    // Show notification
    setNotification({
      open: true,
      message: 'List created successfully!',
      severity: 'success'
    });
    
    // Navigate to the new list
    navigate(`/list/${listId}`);
  }
  
  // Handle list preview
  const handlePreview = (listId) => {
    navigate(`/list/${listId}`);
  };
  
  // Handle opening config modal
  function handleOpenConfig(e, listId) {
    e.stopPropagation(); // Prevent navigation
    setSelectedListId(listId);
    setConfigModalOpen(true);
  }
  
  // Handle list clone
  const handleClone = (e, list) => {
    e.stopPropagation(); // Prevent navigation
    
    if (!currentUser) {
      setNotification({
        open: true,
        message: 'Please sign in to clone lists',
        severity: 'warning'
      });
      return;
    }
    
    // Call the clone method
    Meteor.call('lists.clone', list._id, {}, (error, result) => {
      if (error) {
        console.error('Error cloning list:', error);
        setNotification({
          open: true,
          message: `Failed to clone: ${error.message}`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: 'List cloned successfully!',
          severity: 'success'
        });
        
        // Navigate to the cloned list after a brief delay
        setTimeout(() => {
          navigate(`/list/${result}`);
        }, 1500);
      }
    });
  };
  
  // Handle deleting a list
  function handleDeleteList(e, listId) {
    e.stopPropagation(); // Prevent navigation
    
    if (window.confirm('Are you sure you want to delete this list?')) {
      Meteor.call('lists.remove', listId, (error) => {
        if (error) {
          console.error('Error deleting list:', error);
          setNotification({
            open: true,
            message: `Error: ${error.reason || 'Failed to delete list'}`,
            severity: 'error'
          });
        } else {
          setNotification({
            open: true,
            message: 'List deleted successfully',
            severity: 'success'
          });
        }
      });
    }
  }
  
  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Toggle filter between public and all lists
  const togglePublicFilter = () => {
    setFilterPublic(!filterPublic);
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Format date for display
  function formatDate(date) {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Create a new list directly (without form)
  function handleCreateNewList() {
    const defaultListName = `List ${new Date().toLocaleDateString('en-US')}`;
    
    Meteor.call('lists.create', { title: defaultListName }, (error, listId) => {
      if (error) {
        console.error('Error creating list:', error);
        setNotification({
          open: true,
          message: `Error: ${error.reason || 'Failed to create list'}`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: 'New list created successfully!',
          severity: 'success'
        });
        
        // Navigate to the new list
        navigate(`/list/${listId}`);
      }
    });
  }
  
  // Check if the user owns a list
  function isOwner(list) {
    return currentUser && list.userId === currentUser._id;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lists Library
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage task lists and protocol templates for organization and reuse
        </Typography>
      </Box>
      
      {notification.open && (
        <Alert 
          severity={notification.severity} 
          onClose={handleCloseNotification}
          sx={{ mb: 3 }}
        >
          {notification.message}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search lists..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant={filterPublic ? "contained" : "outlined"}
                startIcon={<PublicIcon />}
                onClick={togglePublicFilter}
              >
                {filterPublic ? "Public Only" : "All Lists"}
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
                disabled={showForm}
                id="newListButton"
              >
                New List
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Create New List Form */}
      {showForm && (
        <Box sx={{ mb: 3 }}>
          <ListForm
            onSave={handleNewListSaved}
            onCancel={() => setShowForm(false)}
          />
        </Box>
      )}
      
      {/* Lists Display */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">
            {filterPublic ? "Public Lists" : "All Lists"}
            {!isLoading && (
              <Chip 
                label={lists.length} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : lists.length > 0 ? (
          <List id="libraryItems">
            {lists.map((list) => (
              <React.Fragment key={list._id}>
                <ListItem
                  className="libraryItem"
                  sx={{
                    borderLeft: 4,
                    borderColor: 'primary.main',
                    cursor: 'pointer'
                  }}
                  onClick={() => handlePreview(list._id)}
                >
                  <ListItemIcon>
                    <ListIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" component="span" className="listName">
                          {list.title || list.name}
                        </Typography>
                        {list.public && (
                          <Chip 
                            icon={<PublicIcon />} 
                            label="Public" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                        {list.description && (
                          <Typography variant="body2" color="text.secondary">
                            {list.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" component="span">
                          Created: {formatDate(list.createdAt)} • 
                          Last modified: {formatDate(list.lastModified)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      className="listCreator"
                      sx={{ mr: 2, display: { xs: 'none', sm: 'inline' }}}
                      component="span"
                    >
                      By: {list.userId === currentUser?._id ? 'You' : 'Others'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      className="previewButton"
                      startIcon={<PreviewIcon />}
                      onClick={(e) => { e.stopPropagation(); handlePreview(list._id); }}
                      sx={{ mr: 1 }}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      className="cloneButton"
                      startIcon={<ContentCopyIcon />}
                      onClick={(e) => handleClone(e, list)}
                      disabled={!currentUser}
                      sx={{ mr: 1 }}
                    >
                      Clone
                    </Button>
                    {isOwner(list) && (
                      <>
                        <IconButton
                          size="small"
                          className="editButton"
                          onClick={(e) => handleOpenConfig(e, list._id)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          className="deleteButton"
                          color="error"
                          onClick={(e) => handleDeleteList(e, list._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">
              No lists found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Try a different search term' 
                : filterPublic 
                  ? 'There are no public lists available at the moment'
                  : 'Create your first list to get started'
              }
            </Typography>
            {!showForm && !searchTerm && !filterPublic && currentUser && (
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
                onClick={handleCreateNewList}
              >
                Create Quick List
              </Button>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Config Modal */}
      <ListConfigModal
        open={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedListId(null);
        }}
        listId={selectedListId}
      />
    </Container>
  );
}