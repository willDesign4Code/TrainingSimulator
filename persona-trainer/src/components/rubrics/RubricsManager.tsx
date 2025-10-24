import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../../services/supabase/client';
import type { Rubric } from '../../services/supabase/client';

interface RubricsManagerProps {
  scenarioId: string;
}

const RubricsManager: React.FC<RubricsManagerProps> = ({ scenarioId }) => {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    metric_name: '',
    description: '',
    min_score: 0,
    max_score: 10,
    weight: 1.0
  });

  // Fetch rubrics for this scenario
  useEffect(() => {
    if (scenarioId) {
      fetchRubrics();
    }
  }, [scenarioId]);

  const fetchRubrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRubrics(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching rubrics:', err);
      setError('Failed to load rubrics');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rubric?: Rubric) => {
    if (rubric) {
      // Editing existing rubric
      setEditingRubric(rubric);
      setFormData({
        metric_name: rubric.metric_name,
        description: rubric.description,
        min_score: rubric.min_score,
        max_score: rubric.max_score,
        weight: rubric.weight
      });
    } else {
      // Adding new rubric
      setEditingRubric(null);
      setFormData({
        metric_name: '',
        description: '',
        min_score: 0,
        max_score: 10,
        weight: 1.0
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRubric(null);
    setFormData({
      metric_name: '',
      description: '',
      min_score: 0,
      max_score: 10,
      weight: 1.0
    });
  };

  const handleSaveRubric = async () => {
    try {
      if (!formData.metric_name || !formData.description) {
        setError('Metric name and description are required');
        return;
      }

      if (editingRubric) {
        // Update existing rubric
        const { error } = await supabase
          .from('rubrics')
          .update({
            metric_name: formData.metric_name,
            description: formData.description,
            min_score: formData.min_score,
            max_score: formData.max_score,
            weight: formData.weight
          })
          .eq('id', editingRubric.id);

        if (error) throw error;
      } else {
        // Create new rubric
        const { error } = await supabase
          .from('rubrics')
          .insert([{
            scenario_id: scenarioId,
            metric_name: formData.metric_name,
            description: formData.description,
            min_score: formData.min_score,
            max_score: formData.max_score,
            weight: formData.weight
          }]);

        if (error) throw error;
      }

      // Refresh rubrics list
      await fetchRubrics();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving rubric:', err);
      setError('Failed to save rubric');
    }
  };

  const handleDeleteRubric = async (rubricId: string) => {
    if (!window.confirm('Are you sure you want to delete this rubric?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rubrics')
        .delete()
        .eq('id', rubricId);

      if (error) throw error;

      // Refresh rubrics list
      await fetchRubrics();
      setError(null);
    } catch (err) {
      console.error('Error deleting rubric:', err);
      setError('Failed to delete rubric');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Scoring Rubrics</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Rubric
        </Button>
      </Box>

      {rubrics.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            No rubrics defined yet. Add scoring criteria to evaluate trainee performance.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Metric</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong>Score Range</strong></TableCell>
                <TableCell align="center"><strong>Weight</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rubrics.map((rubric) => (
                <TableRow key={rubric.id} hover>
                  <TableCell>{rubric.metric_name}</TableCell>
                  <TableCell>{rubric.description}</TableCell>
                  <TableCell align="center">
                    {rubric.min_score} - {rubric.max_score}
                  </TableCell>
                  <TableCell align="center">{rubric.weight.toFixed(1)}x</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(rubric)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteRubric(rubric.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Rubric Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRubric ? 'Edit Rubric' : 'Add New Rubric'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Metric Name"
              required
              fullWidth
              value={formData.metric_name}
              onChange={(e) => setFormData({ ...formData, metric_name: e.target.value })}
              placeholder="e.g., Empathy, Communication, Problem Solving"
            />

            <TextField
              label="Description"
              required
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this metric measures and how it should be evaluated"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Min Score"
                type="number"
                required
                value={formData.min_score}
                onChange={(e) => setFormData({ ...formData, min_score: parseInt(e.target.value) || 0 })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Max Score"
                type="number"
                required
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 10 })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Weight"
                type="number"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                inputProps={{ step: 0.1, min: 0 }}
                sx={{ flex: 1 }}
                helperText="Importance multiplier"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveRubric}
            variant="contained"
            disabled={!formData.metric_name || !formData.description}
          >
            {editingRubric ? 'Update' : 'Add'} Rubric
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RubricsManager;
