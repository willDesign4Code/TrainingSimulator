import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../contexts/AuthContext';

interface Assignment {
  id: string;
  assignment_name: string;
  content_type: 'category' | 'topic' | 'scenario';
  content_id: string;
  assigned_users: string[]; // Array of user IDs
  is_active: boolean;
  assigned_by: string;
  created_at: string;
  category_name?: string;
  user_count?: number;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    assignment_name: '',
    category_id: '',
    selected_users: [] as string[]
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch assignments - order by assigned_at (the actual column name)
      console.log('Fetching assignments...');
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('content_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError);
        throw assignmentsError;
      }

      console.log('Assignments fetched:', assignmentsData);

      // Fetch category names for each assignment
      const transformedAssignments = await Promise.all(
        (assignmentsData || []).map(async (assignment: any) => {
          // Fetch the category name
          const { data: categoryData } = await supabase
            .from('categories')
            .select('name')
            .eq('id', assignment.content_id)
            .single();

          return {
            id: assignment.id,
            assignment_name: assignment.assignment_name || 'Untitled Assignment',
            content_type: assignment.content_type || 'category',
            content_id: assignment.content_id,
            assigned_users: assignment.assigned_users || [],
            is_active: assignment.is_active || false,
            assigned_by: assignment.assigned_by,
            created_at: assignment.assigned_at || new Date().toISOString(),
            category_name: categoryData?.name || 'Unknown Category',
            user_count: (assignment.assigned_users || []).length
          };
        })
      );

      setAssignments(transformedAssignments);

      // Fetch categories - respect visibility rules
      // Only show categories that are public OR created by the current user
      console.log('Fetching categories...');
      if (!user) {
        console.error('No user logged in');
        setCategories([]);
      } else {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .or(`is_public.eq.true,created_by.eq.${user.id}`)
          .order('name', { ascending: true });

        if (categoriesError) {
          console.error('Categories error:', categoriesError);
          throw categoriesError;
        }
        console.log('Categories fetched:', categoriesData);
        setCategories(categoriesData || []);
      }

      // Fetch users - get all users
      console.log('Fetching users...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (usersError) {
        console.error('Users error:', usersError);
        throw usersError;
      }
      console.log('Users fetched:', usersData);
      setUsers(usersData || []);

      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError('Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setEditingAssignment(null);
    setFormData({
      assignment_name: '',
      category_id: '',
      selected_users: []
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      assignment_name: assignment.assignment_name,
      category_id: assignment.content_id,
      selected_users: assignment.assigned_users
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.assignment_name.trim()) {
      errors.assignment_name = 'Assignment name is required';
    }

    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }

    if (formData.selected_users.length === 0) {
      errors.selected_users = 'At least one user must be selected';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAssignment = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Use a dummy UUID for assigned_to_id since we're using assigned_users array instead
      const dummyUserId = '00000000-0000-0000-0000-000000000000';

      const assignmentData = {
        assignment_name: formData.assignment_name.trim(),
        content_type: 'category', // Required ENUM field
        content_id: formData.category_id,
        assigned_to_type: 'user', // Required ENUM field
        assigned_to_id: dummyUserId, // Required but we use assigned_users array instead
        assigned_users: formData.selected_users,
        assigned_by: user?.id,
        is_active: false // Always create as inactive
      };

      console.log('Saving assignment:', assignmentData);

      if (editingAssignment) {
        // Update existing assignment - don't update the required fields
        const updateData = {
          assignment_name: formData.assignment_name.trim(),
          assigned_users: formData.selected_users,
          assigned_by: user?.id,
          is_active: formData.selected_users.length > 0 ? editingAssignment.is_active : false
        };

        const { error } = await supabase
          .from('content_assignments')
          .update(updateData)
          .eq('id', editingAssignment.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('content_assignments')
          .insert([assignmentData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      await fetchData();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      console.error('Error saving assignment:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(`Failed to ${editingAssignment ? 'update' : 'create'} assignment. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('content_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError('Failed to delete assignment. Please try again.');
    }
  };

  const handleToggleActive = async (assignment: Assignment) => {
    // Validate: Cannot activate if no users assigned
    if (!assignment.is_active && assignment.assigned_users.length === 0) {
      setError('Cannot activate assignment with no users assigned');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('content_assignments')
        .update({ is_active: !assignment.is_active })
        .eq('id', assignment.id);

      if (error) throw error;

      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Error toggling assignment status:', err);
      setError('Failed to update assignment status. Please try again.');
    }
  };

  const handleUserSelectionChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      selected_users: typeof value === 'string' ? value.split(',') : value
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Assignments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create New Assignment
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ width: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Assignment Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Assigned Users</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No assignments found. Create your first assignment to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.assignment_name}</TableCell>
                  <TableCell>{assignment.category_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${assignment.user_count} user${assignment.user_count !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        checked={assignment.is_active}
                        onChange={() => handleToggleActive(assignment)}
                        disabled={assignment.assigned_users.length === 0}
                      />
                      <Typography variant="body2">
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditAssignment(assignment)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Assignment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Assignment Name"
              fullWidth
              required
              value={formData.assignment_name}
              onChange={(e) => setFormData({ ...formData, assignment_name: e.target.value })}
              error={!!validationErrors.assignment_name}
              helperText={validationErrors.assignment_name}
            />

            <FormControl fullWidth required error={!!validationErrors.category_id}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category_id}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.category_id && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {validationErrors.category_id}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth required error={!!validationErrors.selected_users}>
              <InputLabel>Assign to Users</InputLabel>
              <Select
                multiple
                value={formData.selected_users}
                label="Assign to Users"
                onChange={handleUserSelectionChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((userId) => {
                      const user = users.find((u) => u.id === userId);
                      return (
                        <Chip
                          key={userId}
                          label={user?.name || 'Unknown'}
                          size="small"
                          onDelete={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...formData,
                              selected_users: formData.selected_users.filter(id => id !== userId)
                            });
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.selected_users && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {validationErrors.selected_users}
                </Typography>
              )}
            </FormControl>

            <Alert severity="info">
              New assignments are created as <strong>Inactive</strong> by default. Activate them using the toggle switch in the table.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveAssignment}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : editingAssignment ? 'Save Changes' : 'Create Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assignments;
