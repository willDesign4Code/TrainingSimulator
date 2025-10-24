import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import TopicCard from '../components/topics/TopicCard';
import { supabase } from '../services/supabase/client';

const CategoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditCategoryDialog, setOpenEditCategoryDialog] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);
  
  // Form state for adding a new topic
  const [newTopic, setNewTopic] = useState({
    name: '',
    overview: '',
    userRole: ''
  });
  
  // Form state for editing the category
  const [editCategory, setEditCategory] = useState({
    name: '',
    details: '',
    imageUrl: '',
    isPublic: true
  });
  
  // Load category and topics data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', id)
          .single();

        if (categoryError) throw categoryError;

        if (!categoryData) {
          setError('Category not found');
          setLoading(false);
          return;
        }

        // Fetch topics for this category
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .eq('category_id', id)
          .order('created_at', { ascending: false });

        if (topicsError) throw topicsError;

        // Fetch scenario counts for each topic
        const topicsWithCounts = await Promise.all(
          (topicsData || []).map(async (topic) => {
            const { count } = await supabase
              .from('scenarios')
              .select('*', { count: 'exact', head: true })
              .eq('topic_id', topic.id);
            return { ...topic, scenarioCount: count || 0 };
          })
        );

        setCategory(categoryData as any);
        setTopics(topicsWithCounts as any || []);
        setError(null);

      } catch (err) {
        console.error('Error loading category/topics:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Filter topics based on search term and role filter
  const filteredTopics = topics.filter(topic =>
    (topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     topic.details.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (roleFilter === '' || topic.user_role === roleFilter)
  );

  // Get unique user roles for filter
  const uniqueRoles = Array.from(new Set(topics.map(topic => topic.user_role)));
  
  // Handle role filter change
  const handleRoleFilterChange = (event: SelectChangeEvent) => {
    setRoleFilter(event.target.value);
  };
  
  // Handle opening the add topic dialog
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };
  
  // Handle closing the add topic dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setEditingTopicId(null);
    setValidationErrors({});
    // Reset form
    setNewTopic({
      name: '',
      overview: '',
      userRole: ''
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTopic(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate field on blur
  const handleFieldBlur = (fieldName: string) => {
    const errors: {[key: string]: string} = {};

    switch(fieldName) {
      case 'name':
        if (!newTopic.name.trim()) {
          errors.name = 'Topic name is required';
        }
        break;
      case 'overview':
        if (!newTopic.overview.trim()) {
          errors.overview = 'Overview is required - provide a brief description of this topic';
        }
        break;
      case 'userRole':
        if (!newTopic.userRole.trim()) {
          errors.userRole = 'User role is required - specify the role trainees will assume';
        }
        break;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
    }
  };
  
  // Handle adding or updating a topic
  const handleAddTopic = async () => {
    // Validate form
    const errors: {[key: string]: string} = {};

    if (!newTopic.name.trim()) {
      errors.name = 'Topic name is required';
    }
    if (!newTopic.overview.trim()) {
      errors.overview = 'Overview is required';
    }
    if (!newTopic.userRole.trim()) {
      errors.userRole = 'User role is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setValidationErrors({});

      const topicData = {
        category_id: id!,
        name: newTopic.name.trim(),
        details: newTopic.overview.trim(),
        user_role: newTopic.userRole.trim(),
        is_public: true
      };

      if (editingTopicId) {
        // Update existing topic
        const { error: updateError } = await supabase
          .from('topics')
          .update(topicData)
          .eq('id', editingTopicId);

        if (updateError) throw updateError;
      } else {
        // Create new topic
        const { error: insertError } = await supabase
          .from('topics')
          .insert([topicData]);

        if (insertError) throw insertError;
      }

      // Refresh topics list
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .eq('category_id', id)
        .order('created_at', { ascending: false });

      if (topicsError) throw topicsError;

      // Fetch scenario counts for each topic
      const topicsWithCounts = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count } = await supabase
            .from('scenarios')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id);
          return { ...topic, scenarioCount: count || 0 };
        })
      );

      setTopics(topicsWithCounts);
      setError(null);
      handleCloseAddDialog();
    } catch (err) {
      console.error('Error saving topic:', err);
      setError('Failed to save topic. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = (topicId: string) => {
    setTopicToDelete(topicId);
    setOpenDeleteDialog(true);
  };
  
  // Handle closing the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setTopicToDelete(null);
  };
  
  // Handle deleting a topic
  const handleDeleteTopic = () => {
    if (topicToDelete) {
      // Remove topic from list
      setTopics(prev => prev.filter(topic => topic.id !== topicToDelete));
      
      // Close dialog
      handleCloseDeleteDialog();
    }
  };
  
  // Handle viewing a topic's scenarios
  const handleViewTopic = (topicId: string) => {
    console.log('View topic clicked:', topicId);
    // Navigate to the topic details page
    navigate(`/topics/${topicId}`);
  };
  
  // Handle editing a topic
  const handleEditTopic = (topicId: string) => {
    // Find the topic to edit
    const topicToEdit = topics.find(topic => topic.id === topicId);
    if (topicToEdit) {
      setEditingTopicId(topicId);
      // Populate the form with current topic data (map database fields)
      setNewTopic({
        name: topicToEdit.name || '',
        overview: topicToEdit.details || '',
        userRole: topicToEdit.user_role || ''
      });
      // Open the dialog
      setOpenAddDialog(true);
    }
  };
  
  // Handle opening the edit category dialog
  const handleOpenEditCategoryDialog = () => {
    // Populate the form with current category data
    setEditCategory({
      name: category.name,
      details: category.details,
      imageUrl: category.imageUrl,
      isPublic: category.isPublic
    });
    setOpenEditCategoryDialog(true);
  };
  
  // Handle closing the edit category dialog
  const handleCloseEditCategoryDialog = () => {
    setOpenEditCategoryDialog(false);
  };
  
  // Handle edit category form input changes
  const handleEditCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle edit category checkbox changes
  const handleEditCategoryCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditCategory(prev => ({
      ...prev,
      isPublic: e.target.checked
    }));
  };
  
  // Handle updating the category
  const handleUpdateCategory = () => {
    // Validate form
    if (!editCategory.name || !editCategory.details) {
      // In a real app, you would show validation errors
      return;
    }
    
    // Update category
    const updatedCategory = {
      ...category,
      name: editCategory.name,
      details: editCategory.details,
      imageUrl: editCategory.imageUrl,
      isPublic: editCategory.isPublic
    };
    
    // Update category in state
    setCategory(updatedCategory);
    
    // Close dialog
    handleCloseEditCategoryDialog();
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !category) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Category not found'}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/categories')}
          sx={{ mt: 2 }}
        >
          Back to Categories
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ px: 3 }}>
      {/* Header with back button and edit button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          onClick={() => navigate('/categories')}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {category.name}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<EditIcon />}
          onClick={handleOpenEditCategoryDialog}
        >
          Edit Category
        </Button>
      </Box>
      
      {/* Category details */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {category.details}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Topics section header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Topics
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Topic
        </Button>
      </Box>
      
      {/* Search and filter */}
      <Box sx={{ display: 'flex', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search topics..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 400 } }}
        />
        
        {uniqueRoles.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="role-filter-label">Filter by Role</InputLabel>
            <Select
              labelId="role-filter-label"
              id="role-filter"
              value={roleFilter}
              label="Filter by Role"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="">All Roles</MenuItem>
              {uniqueRoles.map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      
      {/* Active filters */}
      {roleFilter && (
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={`Role: ${roleFilter}`}
            onDelete={() => setRoleFilter('')}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
      
      {/* Topics grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        },
        gap: 3,
        mb: 4
      }}>
        {filteredTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            id={topic.id}
            name={topic.name}
            overview={topic.details || ''}
            userRole={topic.user_role || ''}
            imageUrl={topic.image_url || ''}
            scenarioCount={topic.scenarioCount || 0}
            onView={handleViewTopic}
            onEdit={handleEditTopic}
            onDelete={handleOpenDeleteDialog}
          />
        ))}
      </Box>
      
      {/* Empty state */}
      {filteredTopics.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No topics found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {topics.length === 0 
              ? 'Get started by adding your first topic' 
              : 'Try adjusting your search or filter criteria'}
          </Typography>
        </Box>
      )}
      
      {/* Mobile FAB for adding topics */}
      <Box sx={{ display: { sm: 'none' } }}>
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleOpenAddDialog}
        >
          <AddIcon />
        </Fab>
      </Box>
      
      {/* Add/Edit Topic Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTopicId ? 'Edit Topic' : 'Add New Topic'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Topic Name"
              name="name"
              value={newTopic.name}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('name')}
              fullWidth
              variant="outlined"
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name || 'Enter a descriptive name for this topic'}
            />
            <TextField
              label="Overview"
              name="overview"
              value={newTopic.overview}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('overview')}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
              error={!!validationErrors.overview}
              helperText={validationErrors.overview || 'Provide a brief description of what this topic covers'}
            />
            <TextField
              label="User Role"
              name="userRole"
              value={newTopic.userRole}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('userRole')}
              fullWidth
              variant="outlined"
              required
              error={!!validationErrors.userRole}
              helperText={validationErrors.userRole || 'The role that trainees will assume during scenarios (e.g., Customer Service Representative)'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseAddDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleAddTopic}
            variant="contained"
            disabled={saving || !newTopic.name || !newTopic.overview || !newTopic.userRole}
          >
            {saving ? 'Saving...' : (editingTopicId ? 'Update Topic' : 'Add Topic')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Topic</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this topic? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteTopic} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={openEditCategoryDialog} onClose={handleCloseEditCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Category Name"
              name="name"
              value={editCategory.name}
              onChange={handleEditCategoryInputChange}
              fullWidth
              variant="outlined"
              required
            />
            <TextField
              label="Category Details"
              name="details"
              value={editCategory.details}
              onChange={handleEditCategoryInputChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
            />
            <TextField
              label="Image URL"
              name="imageUrl"
              value={editCategory.imageUrl}
              onChange={handleEditCategoryInputChange}
              fullWidth
              variant="outlined"
              placeholder="https://picsum.photos/400/200?random=123"
            />
            <FormControl component="fieldset" variant="standard">
              <FormControlLabel
                control={
                  <Switch
                    checked={editCategory.isPublic}
                    onChange={handleEditCategoryCheckboxChange}
                    name="isPublic"
                  />
                }
                label="Public Category"
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditCategoryDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateCategory} 
            variant="contained"
            disabled={!editCategory.name || !editCategory.details}
          >
            Update Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryDetails;
