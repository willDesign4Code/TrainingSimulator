import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TopicCard from '../components/topics/TopicCard';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../contexts/AuthContext';

interface TopicWithScenarios {
  id: string;
  name: string;
  details: string;
  user_role: string;
  scenarioCount: number;
}

const CategoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [category, setCategory] = useState<any | null>(null);
  const [topics, setTopics] = useState<TopicWithScenarios[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin dialogs state
  const [openAddTopicDialog, setOpenAddTopicDialog] = useState(false);
  const [openEditTopicDialog, setOpenEditTopicDialog] = useState(false);
  const [openDeleteTopicDialog, setOpenDeleteTopicDialog] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<TopicWithScenarios | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<TopicWithScenarios | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new topic
  const [newTopic, setNewTopic] = useState({
    name: '',
    details: '',
    user_role: ''
  });

  // Form state for editing topic
  const [editTopic, setEditTopic] = useState({
    name: '',
    details: '',
    user_role: ''
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

        // Admin view: only fetch scenario counts
        const topicsWithData = await Promise.all(
          (topicsData || []).map(async (topic) => {
            const { count } = await supabase
              .from('scenarios')
              .select('*', { count: 'exact', head: true })
              .eq('topic_id', topic.id);

            return {
              ...topic,
              scenarioCount: count || 0
            };
          })
        );

        setCategory(categoryData as any);
        setTopics(topicsWithData);
        setError(null);

      } catch (err) {
        console.error('Error loading category/topics:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (id && userProfile) {
      fetchData();
    }
  }, [id, userProfile]);

  // Admin topic management handlers
  const handleOpenAddTopicDialog = () => {
    setNewTopic({ name: '', details: '', user_role: '' });
    setOpenAddTopicDialog(true);
  };

  const handleCloseAddTopicDialog = () => {
    setOpenAddTopicDialog(false);
    setNewTopic({ name: '', details: '', user_role: '' });
  };

  const handleNewTopicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTopic = async () => {
    if (!newTopic.name.trim() || !newTopic.details.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const { error: insertError } = await supabase
        .from('topics')
        .insert([{
          category_id: id,
          name: newTopic.name.trim(),
          details: newTopic.details.trim(),
          user_role: newTopic.user_role.trim() || null
        }]);

      if (insertError) throw insertError;

      // Refresh topics
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('category_id', id)
        .order('created_at', { ascending: false });

      const topicsWithData = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count } = await supabase
            .from('scenarios')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id);
          return { ...topic, scenarioCount: count || 0 };
        })
      );

      setTopics(topicsWithData);
      handleCloseAddTopicDialog();
      setError(null);
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Failed to create topic');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditTopicDialog = (topic: TopicWithScenarios) => {
    setTopicToEdit(topic);
    setEditTopic({
      name: topic.name,
      details: topic.details,
      user_role: topic.user_role || ''
    });
    setOpenEditTopicDialog(true);
  };

  const handleCloseEditTopicDialog = () => {
    setOpenEditTopicDialog(false);
    setTopicToEdit(null);
  };

  const handleEditTopicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateTopic = async () => {
    if (!editTopic.name.trim() || !editTopic.details.trim() || !topicToEdit) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from('topics')
        .update({
          name: editTopic.name.trim(),
          details: editTopic.details.trim(),
          user_role: editTopic.user_role.trim() || null
        })
        .eq('id', topicToEdit.id);

      if (updateError) throw updateError;

      // Refresh topics
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('category_id', id)
        .order('created_at', { ascending: false });

      const topicsWithData = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count } = await supabase
            .from('scenarios')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id);
          return { ...topic, scenarioCount: count || 0 };
        })
      );

      setTopics(topicsWithData);
      handleCloseEditTopicDialog();
      setError(null);
    } catch (err) {
      console.error('Error updating topic:', err);
      setError('Failed to update topic');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteTopicDialog = (topic: TopicWithScenarios) => {
    setTopicToDelete(topic);
    setOpenDeleteTopicDialog(true);
  };

  const handleCloseDeleteTopicDialog = () => {
    setOpenDeleteTopicDialog(false);
    setTopicToDelete(null);
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;

    try {
      setSaving(true);
      const { error: deleteError } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicToDelete.id);

      if (deleteError) throw deleteError;

      // Refresh topics
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('category_id', id)
        .order('created_at', { ascending: false });

      const topicsWithData = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count } = await supabase
            .from('scenarios')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id);
          return { ...topic, scenarioCount: count || 0 };
        })
      );

      setTopics(topicsWithData);
      handleCloseDeleteTopicDialog();
      setError(null);
    } catch (err) {
      console.error('Error deleting topic:', err);
      setError('Failed to delete topic. It may have associated scenarios.');
    } finally {
      setSaving(false);
    }
  };

  // Filter topics based on search term
  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render admin view with topic cards
  const renderAdminView = () => (
    <Box>
      {/* Search and Add Topic Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            )
          }}
          sx={{ width: 300 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddTopicDialog}
        >
          Add Topic
        </Button>
      </Box>

      {/* Topic Cards Grid */}
      {filteredTopics.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {topics.length === 0 ? 'No topics yet' : 'No topics match your search'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {topics.length === 0 ? 'Get started by adding your first topic' : 'Try adjusting your search terms'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              id={topic.id}
              name={topic.name}
              overview={topic.details}
              userRole={topic.user_role || 'All'}
              imageUrl=""
              scenarioCount={topic.scenarioCount}
              onEdit={() => handleOpenEditTopicDialog(topic)}
              onDelete={() => handleOpenDeleteTopicDialog(topic)}
              onView={() => navigate(`/topics/${topic.id}`)}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  
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
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Back button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/categories')}
          sx={{ textTransform: 'none' }}
        >
          Back To Categories
        </Button>
      </Box>

      {/* Category title */}
      <Typography variant="h4" gutterBottom>
        {category.name}
      </Typography>

      {/* Category details */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {category.details}
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Topics View */}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Topics
      </Typography>
      {renderAdminView()}

      {/* Add Topic Dialog */}
      <Dialog open={openAddTopicDialog} onClose={handleCloseAddTopicDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Topic</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Topic Name"
              name="name"
              value={newTopic.name}
              onChange={handleNewTopicInputChange}
              fullWidth
              required
            />
            <TextField
              label="Topic Details"
              name="details"
              value={newTopic.details}
              onChange={handleNewTopicInputChange}
              fullWidth
              multiline
              rows={3}
              required
            />
            <TextField
              label="User Role (optional)"
              name="user_role"
              value={newTopic.user_role}
              onChange={handleNewTopicInputChange}
              fullWidth
              placeholder="e.g., manager, employee"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddTopicDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleCreateTopic}
            variant="contained"
            disabled={saving || !newTopic.name || !newTopic.details}
          >
            {saving ? 'Adding...' : 'Add Topic'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={openEditTopicDialog} onClose={handleCloseEditTopicDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Topic</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Topic Name"
              name="name"
              value={editTopic.name}
              onChange={handleEditTopicInputChange}
              fullWidth
              required
            />
            <TextField
              label="Topic Details"
              name="details"
              value={editTopic.details}
              onChange={handleEditTopicInputChange}
              fullWidth
              multiline
              rows={3}
              required
            />
            <TextField
              label="User Role (optional)"
              name="user_role"
              value={editTopic.user_role}
              onChange={handleEditTopicInputChange}
              fullWidth
              placeholder="e.g., manager, employee"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditTopicDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleUpdateTopic}
            variant="contained"
            disabled={saving || !editTopic.name || !editTopic.details}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Topic Confirmation Dialog */}
      <Dialog open={openDeleteTopicDialog} onClose={handleCloseDeleteTopicDialog}>
        <DialogTitle>Delete Topic?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{topicToDelete?.name}"? This action cannot be undone.
          </Typography>
          {topicToDelete && topicToDelete.scenarioCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This topic has {topicToDelete.scenarioCount} scenario{topicToDelete.scenarioCount !== 1 ? 's' : ''}.
              You must delete all scenarios before deleting this topic.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteTopicDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleDeleteTopic}
            color="error"
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryDetails;
