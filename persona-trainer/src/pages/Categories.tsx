import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
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
  Switch,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { supabase } from '../services/supabase/client';
import type { Category } from '../services/supabase/client';

const Categories = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  // Form state for creating a new category
  const [newCategory, setNewCategory] = useState({
    name: '',
    details: '',
    imageUrl: '',
    isPublic: true
  });

  // Form state for editing a category
  const [editCategory, setEditCategory] = useState({
    name: '',
    details: '',
    imageUrl: '',
    isPublic: true
  });

  // Fetch categories from Supabase
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);

      // Fetch topic counts for each category
      if (data) {
        const counts: Record<string, number> = {};
        for (const category of data) {
          const { count } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          counts[category.id] = count || 0;
        }
        setTopicCounts(counts);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories
    .filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.details.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(category => !showPublicOnly || category.is_public);
  
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setValidationErrors({});
    setNewCategory({
      name: '',
      details: '',
      imageUrl: '',
      isPublic: true
    });
  };

  // Handle new category form input changes
  const handleNewCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({
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

  // Handle new category checkbox changes
  const handleNewCategoryCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(prev => ({
      ...prev,
      isPublic: e.target.checked
    }));
  };

  // Validate field on blur
  const handleCategoryFieldBlur = (fieldName: string, formType: 'new' | 'edit') => {
    const errors: {[key: string]: string} = {};
    const category = formType === 'new' ? newCategory : editCategory;

    switch(fieldName) {
      case 'name':
        if (!category.name.trim()) {
          errors.name = 'Category name is required';
        }
        break;
      case 'details':
        if (!category.details.trim()) {
          errors.details = 'Category details are required - provide a brief description';
        }
        break;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
    }
  };

  const handleCreateCategory = async () => {
    // Validate form
    const errors: {[key: string]: string} = {};

    if (!newCategory.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (!newCategory.details.trim()) {
      errors.details = 'Category details are required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setValidationErrors({});

      const { error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name.trim(),
          details: newCategory.details.trim(),
          image_url: newCategory.imageUrl.trim() || null,
          is_public: newCategory.isPublic
        }]);

      if (error) throw error;

      // Refresh categories
      await fetchCategories();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle opening the edit category dialog
  const handleOpenEditDialog = (category: Category) => {
    setCategoryToEdit(category);
    setEditCategory({
      name: category.name,
      details: category.details,
      imageUrl: category.image_url || '',
      isPublic: category.is_public
    });
    setOpenEditDialog(true);
  };
  
  // Handle closing the edit category dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCategoryToEdit(null);
  };
  
  // Handle edit category form input changes
  const handleEditCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditCategory(prev => ({
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
  
  // Handle edit category checkbox changes
  const handleEditCategoryCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditCategory(prev => ({
      ...prev,
      isPublic: e.target.checked
    }));
  };
  
  // Handle updating the category
  const handleUpdateCategory = async () => {
    // Validate form
    const errors: {[key: string]: string} = {};

    if (!editCategory.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (!editCategory.details.trim()) {
      errors.details = 'Category details are required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (categoryToEdit) {
      try {
        setSaving(true);
        setValidationErrors({});

        const { error } = await supabase
          .from('categories')
          .update({
            name: editCategory.name.trim(),
            details: editCategory.details.trim(),
            image_url: editCategory.imageUrl.trim() || null,
            is_public: editCategory.isPublic
          })
          .eq('id', categoryToEdit.id);

        if (error) throw error;

        // Refresh categories
        await fetchCategories();
        handleCloseEditDialog();
        setError(null);
      } catch (err) {
        console.error('Error updating category:', err);
        setError('Failed to update category. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };
  
  return (
    <Box sx={{ px: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Category
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search categories..."
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
          sx={{ maxWidth: 500, mr: 2 }}
        />
        <IconButton 
          color={showPublicOnly ? "primary" : "default"} 
          onClick={() => setShowPublicOnly(!showPublicOnly)}
          sx={{ border: 1, borderColor: 'divider' }}
        >
          <FilterListIcon />
        </IconButton>
      </Box>
      
      {showPublicOnly && (
        <Chip 
          label="Showing public categories only" 
          onDelete={() => setShowPublicOnly(false)} 
          color="primary" 
          variant="outlined"
          sx={{ mb: 3 }}
        />
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: 3
          }}>
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                {category.image_url && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={category.image_url}
                    alt={category.name}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {category.details}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${topicCounts[category.id] || 0} Topics`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={category.is_public ? "Public" : "Private"}
                      size="small"
                      color={category.is_public ? "success" : "default"}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ pt: 0 }}>
                  <Button size="small" onClick={() => navigate(`/categories/${category.id}`)}>
                    View Topics
                  </Button>
                  <Button size="small" onClick={() => handleOpenEditDialog(category)}>
                    Edit
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>

          {filteredCategories.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No categories found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {categories.length === 0
                  ? 'Get started by creating your first category'
                  : 'Try adjusting your search or create a new category'}
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* Mobile FAB for creating categories */}
      <Box sx={{ display: { sm: 'none' } }}>
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleOpenDialog}
        >
          <AddIcon />
        </Fab>
      </Box>
      
      {/* Create Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Category Name"
              name="name"
              value={newCategory.name}
              onChange={handleNewCategoryInputChange}
              onBlur={() => handleCategoryFieldBlur('name', 'new')}
              fullWidth
              variant="outlined"
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name || 'Enter a descriptive name for this category'}
            />
            <TextField
              label="Category Details"
              name="details"
              value={newCategory.details}
              onChange={handleNewCategoryInputChange}
              onBlur={() => handleCategoryFieldBlur('details', 'new')}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
              error={!!validationErrors.details}
              helperText={validationErrors.details || 'Provide a brief description of what this category covers'}
            />
            <TextField
              label="Image URL (optional)"
              name="imageUrl"
              value={newCategory.imageUrl}
              onChange={handleNewCategoryInputChange}
              fullWidth
              variant="outlined"
              placeholder="https://example.com/image.jpg"
              helperText="Leave blank if no image is available"
            />
            <FormControl component="fieldset" variant="standard">
              <FormControlLabel
                control={
                  <Switch
                    checked={newCategory.isPublic}
                    onChange={handleNewCategoryCheckboxChange}
                    name="isPublic"
                  />
                }
                label="Public Category (visible to all users)"
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={saving || !newCategory.name || !newCategory.details}
          >
            {saving ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Category Name"
              name="name"
              value={editCategory.name}
              onChange={handleEditCategoryInputChange}
              onBlur={() => handleCategoryFieldBlur('name', 'edit')}
              fullWidth
              variant="outlined"
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name || 'Enter a descriptive name for this category'}
            />
            <TextField
              label="Category Details"
              name="details"
              value={editCategory.details}
              onChange={handleEditCategoryInputChange}
              onBlur={() => handleCategoryFieldBlur('details', 'edit')}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
              error={!!validationErrors.details}
              helperText={validationErrors.details || 'Provide a brief description of what this category covers'}
            />
            <TextField
              label="Image URL (optional)"
              name="imageUrl"
              value={editCategory.imageUrl}
              onChange={handleEditCategoryInputChange}
              fullWidth
              variant="outlined"
              placeholder="https://example.com/image.jpg"
              helperText="Leave blank if no image is available"
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
                label="Public Category (visible to all users)"
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleUpdateCategory}
            variant="contained"
            disabled={saving || !editCategory.name || !editCategory.details}
          >
            {saving ? 'Saving...' : 'Update Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
