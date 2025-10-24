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
import DeleteIcon from '@mui/icons-material/Delete';
import ScenarioCard from '../components/scenarios/ScenarioCard';
import RubricsManager from '../components/rubrics/RubricsManager';
import { supabase } from '../services/supabase/client';

const mockTopics = [
  {
    id: '101',
    categoryId: '1',
    name: 'Handling Customer Complaints',
    overview: 'This topic focuses on developing the skills necessary to effectively address and resolve customer complaints.',
    userRole: 'Customer Service Representative',
    imageUrl: 'https://picsum.photos/400/200?random=101',
    scenarioCount: 5
  },
  {
    id: '102',
    categoryId: '1',
    name: 'Service Recovery',
    overview: 'Learn techniques for turning negative experiences into positive ones and building customer loyalty after service failures.',
    userRole: 'Customer Service Representative',
    imageUrl: 'https://picsum.photos/400/200?random=102',
    scenarioCount: 3
  }
];

// Mock personas data - in a real app, this would come from an API
const mockPersonas = [
  {
    id: '1',
    name: 'Beatrice Ward',
    age: 23,
    pronouns: 'she / her',
    imageUrl: 'https://source.unsplash.com/random/400x400/?portrait,woman,professional',
    occupation: 'Marketing Specialist',
    traits: ['Assertive', 'Detail-oriented', 'Creative']
  },
  {
    id: '2',
    name: 'Miguel Ruiz',
    age: 34,
    pronouns: 'he / him',
    imageUrl: 'https://source.unsplash.com/random/400x400/?portrait,man,suit',
    occupation: 'Sales Director',
    traits: ['Persuasive', 'Ambitious', 'Charismatic']
  },
  {
    id: '3',
    name: 'Xe Sun',
    age: 29,
    pronouns: 'they / them',
    imageUrl: 'https://source.unsplash.com/random/400x400/?portrait,professional,office',
    occupation: 'Software Engineer',
    traits: ['Analytical', 'Innovative', 'Precise']
  },
  {
    id: '4',
    name: 'Samantha Bernard',
    age: 67,
    pronouns: 'she / her',
    imageUrl: 'https://source.unsplash.com/random/400x400/?portrait,woman,senior',
    occupation: 'Retired Executive',
    traits: ['Experienced', 'Patient', 'Wise']
  },
  {
    id: '5',
    name: 'Jordan Reynolds',
    age: 42,
    pronouns: 'they / them',
    imageUrl: 'https://source.unsplash.com/random/400x400/?portrait,business,person',
    occupation: 'Small Business Owner',
    traits: ['Impatient', 'Detail-oriented', 'Skeptical']
  }
];

// Mock scenarios data - in a real app, this would come from an API
const mockScenarios = [
  {
    id: '1001',
    topicId: '101',
    title: 'Product Defect Complaint',
    overview: 'A customer has received a defective product and is frustrated after multiple attempts to use it.',
    customerPersona: 'Alex Morgan',
    difficulty: 'Medium',
    imageUrl: 'https://picsum.photos/400/200?random=1001'
  },
  {
    id: '1002',
    topicId: '101',
    title: 'Billing Dispute Resolution',
    overview: 'A customer is disputing charges on their account and demanding immediate resolution.',
    customerPersona: 'Jordan Reynolds',
    difficulty: 'Hard',
    imageUrl: 'https://picsum.photos/400/200?random=1002'
  },
  {
    id: '1003',
    topicId: '101',
    title: 'Service Delay Complaint',
    overview: 'A customer is upset about a significant delay in service delivery and seeking compensation.',
    customerPersona: 'Samantha Bernard',
    difficulty: 'Medium',
    imageUrl: 'https://picsum.photos/400/200?random=1003'
  },
  {
    id: '1004',
    topicId: '102',
    title: 'Restaurant Service Recovery',
    overview: 'A customer had a poor dining experience and is sharing negative feedback.',
    customerPersona: 'Miguel Ruiz',
    difficulty: 'Easy',
    imageUrl: 'https://picsum.photos/400/200?random=1004'
  }
];

const TopicDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<any | null>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditTopicDialog, setOpenEditTopicDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [scenarioToView, setScenarioToView] = useState<any | null>(null);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  // Form state for adding a new scenario
  const [newScenario, setNewScenario] = useState({
    title: '',
    overview: '',
    persona_id: '',
    tone: '',
    additionalContext: ''
  });
  
  // Form state for editing the topic
  const [editTopic, setEditTopic] = useState({
    name: '',
    overview: '',
    userRole: ''
  });
  
  // Load topic, scenarios, and personas data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch topic from Supabase
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', id)
          .single();

        if (topicError) throw topicError;

        if (!topicData) {
          setError('Topic not found');
          setLoading(false);
          return;
        }

        // Fetch scenarios for this topic with persona data
        const { data: scenariosData, error: scenariosError } = await supabase
          .from('scenarios')
          .select(`
            *,
            persona:personas(*)
          `)
          .eq('topic_id', id)
          .order('created_at', { ascending: false });

        if (scenariosError) throw scenariosError;

        // Fetch all personas for the dropdown
        const { data: personasData, error: personasError } = await supabase
          .from('personas')
          .select('*')
          .order('name', { ascending: true });

        if (personasError) throw personasError;

        setTopic(topicData);
        setScenarios(scenariosData || []);
        setPersonas(personasData || []);
        setError(null);

      } catch (err) {
        console.error('Error loading topic/scenarios/personas:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Filter scenarios based on search term and difficulty filter
  const filteredScenarios = scenarios.filter(scenario =>
    (scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (scenario.details && scenario.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (scenario.persona?.name && scenario.persona.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  
  // Get unique difficulty levels for filter
  const uniqueDifficulties = Array.from(new Set(scenarios.map(scenario => scenario.difficulty)));
  
  // Handle difficulty filter change
  const handleDifficultyFilterChange = (event: SelectChangeEvent) => {
    setDifficultyFilter(event.target.value);
  };
  
  // Handle opening the add scenario dialog
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };
  
  // Handle closing the add scenario dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setEditingScenarioId(null);
    setValidationErrors({});
    // Reset form
    setNewScenario({
      title: '',
      overview: '',
      persona_id: '',
      tone: '',
      additionalContext: ''
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: string };
    setNewScenario(prev => ({
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
  const handleScenarioFieldBlur = (fieldName: string) => {
    const errors: {[key: string]: string} = {};

    switch(fieldName) {
      case 'title':
        if (!newScenario.title.trim()) {
          errors.title = 'Scenario title is required';
        }
        break;
      case 'overview':
        if (!newScenario.overview.trim()) {
          errors.overview = 'Overview is required - provide a brief summary of the scenario';
        }
        break;
      case 'persona_id':
        if (!newScenario.persona_id) {
          errors.persona_id = 'Please select a persona for this scenario';
        }
        break;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
    }
  };
  
  // Handle adding or updating a scenario
  const handleAddScenario = async () => {
    // Validate form
    const errors: {[key: string]: string} = {};

    if (!newScenario.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!newScenario.overview.trim()) {
      errors.overview = 'Overview is required';
    }
    if (!newScenario.persona_id) {
      errors.persona_id = 'Persona is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setValidationErrors({});

      const scenarioData = {
        topic_id: id!,
        title: newScenario.title.trim(),
        details: newScenario.overview.trim(),
        persona_id: newScenario.persona_id,
        persona_tone: newScenario.tone.trim() || null,
        persona_additional_details: newScenario.additionalContext.trim() || null,
        is_public: true
      };

      if (editingScenarioId) {
        // Update existing scenario
        const { error: updateError } = await supabase
          .from('scenarios')
          .update(scenarioData)
          .eq('id', editingScenarioId);

        if (updateError) throw updateError;
      } else {
        // Create new scenario
        const { error: insertError } = await supabase
          .from('scenarios')
          .insert([scenarioData]);

        if (insertError) throw insertError;
      }

      // Refresh scenarios list
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select(`
          *,
          persona:personas(*)
        `)
        .eq('topic_id', id)
        .order('created_at', { ascending: false });

      if (scenariosError) throw scenariosError;

      setScenarios(scenariosData || []);
      setError(null);
      handleCloseAddDialog();
    } catch (err) {
      console.error('Error saving scenario:', err);
      setError('Failed to save scenario. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = (scenarioId: string) => {
    setScenarioToDelete(scenarioId);
    setOpenDeleteDialog(true);
  };
  
  // Handle closing the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setScenarioToDelete(null);
  };
  
  // Handle deleting a scenario
  const handleDeleteScenario = () => {
    if (scenarioToDelete) {
      // Remove scenario from list
      setScenarios(prev => prev.filter(scenario => scenario.id !== scenarioToDelete));
      
      // Close dialog
      handleCloseDeleteDialog();
    }
  };
  
  // Handle viewing a scenario
  const handleViewScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setScenarioToView(scenario);
      setOpenViewDialog(true);
    }
  };

  // Handle closing the view dialog
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setScenarioToView(null);
  };
  
  // Handle editing a scenario
  const handleEditScenario = (scenarioId: string) => {
    // Find the scenario to edit
    const scenarioToEdit = scenarios.find(scenario => scenario.id === scenarioId);
    if (scenarioToEdit) {
      setEditingScenarioId(scenarioId);
      // Populate the form with current scenario data (map database fields)
      setNewScenario({
        title: scenarioToEdit.title || '',
        overview: scenarioToEdit.details || '',
        persona_id: scenarioToEdit.persona_id || '',
        tone: scenarioToEdit.persona_tone || '',
        additionalContext: scenarioToEdit.persona_additional_details || ''
      });

      // Open the dialog
      setOpenAddDialog(true);
    }
  };
  
  // Handle opening the edit topic dialog
  const handleOpenEditTopicDialog = () => {
    // Populate the form with current topic data (map database fields)
    setEditTopic({
      name: topic.name || '',
      overview: topic.details || '',
      userRole: topic.user_role || ''
    });
    setOpenEditTopicDialog(true);
  };
  
  // Handle closing the edit topic dialog
  const handleCloseEditTopicDialog = () => {
    setOpenEditTopicDialog(false);
  };
  
  // Handle edit topic form input changes
  const handleEditTopicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditTopic(prev => ({
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

  // Validate topic field on blur
  const handleTopicFieldBlur = (fieldName: string) => {
    const errors: {[key: string]: string} = {};

    switch(fieldName) {
      case 'name':
        if (!editTopic.name.trim()) {
          errors.name = 'Topic name is required';
        }
        break;
      case 'overview':
        if (!editTopic.overview.trim()) {
          errors.overview = 'Overview is required - provide a brief description';
        }
        break;
      case 'userRole':
        if (!editTopic.userRole.trim()) {
          errors.userRole = 'User role is required - specify the role trainees will assume';
        }
        break;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
    }
  };
  
  // Handle updating the topic
  const handleUpdateTopic = async () => {
    // Validate form
    const errors: {[key: string]: string} = {};

    if (!editTopic.name.trim()) {
      errors.name = 'Topic name is required';
    }
    if (!editTopic.overview.trim()) {
      errors.overview = 'Overview is required';
    }
    if (!editTopic.userRole.trim()) {
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
        name: editTopic.name.trim(),
        details: editTopic.overview.trim(),
        user_role: editTopic.userRole.trim()
      };

      const { error: updateError } = await supabase
        .from('topics')
        .update(topicData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setTopic({
        ...topic,
        ...topicData
      });

      setError(null);
      handleCloseEditTopicDialog();
    } catch (err) {
      console.error('Error updating topic:', err);
      setError('Failed to update topic. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !topic) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Topic not found'}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ px: 3 }}>
      {/* Header with back button and edit button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {topic.name}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<EditIcon />}
          onClick={handleOpenEditTopicDialog}
        >
          Edit Topic
        </Button>
      </Box>
      
      {/* Topic details */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          {topic.overview}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Chip 
          label={`Role: ${topic.userRole}`} 
          color="secondary" 
          variant="outlined" 
          sx={{ mr: 1 }}
        />
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Scenarios section header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Scenarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Scenario
        </Button>
      </Box>
      
      {/* Search and filter */}
      <Box sx={{ display: 'flex', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search scenarios..."
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
        
        {uniqueDifficulties.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="difficulty-filter-label">Filter by Difficulty</InputLabel>
            <Select
              labelId="difficulty-filter-label"
              id="difficulty-filter"
              value={difficultyFilter}
              label="Filter by Difficulty"
              onChange={handleDifficultyFilterChange}
            >
              <MenuItem value="">All Difficulties</MenuItem>
              {uniqueDifficulties.map(difficulty => (
                <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      
      {/* Active filters */}
      {difficultyFilter && (
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={`Difficulty: ${difficultyFilter}`}
            onDelete={() => setDifficultyFilter('')}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
      
      {/* Scenarios grid */}
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
        {filteredScenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            id={scenario.id}
            title={scenario.title}
            overview={scenario.details || ''}
            customerPersona={scenario.persona?.name || 'Unknown Persona'}
            imageUrl={scenario.persona?.image_url || ''}
            difficulty="Medium"
            onView={handleViewScenario}
            onEdit={handleEditScenario}
            onDelete={handleOpenDeleteDialog}
          />
        ))}
      </Box>
      
      {/* Empty state */}
      {filteredScenarios.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No scenarios found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {scenarios.length === 0 
              ? 'Get started by adding your first scenario' 
              : 'Try adjusting your search or filter criteria'}
          </Typography>
        </Box>
      )}
      
      {/* Mobile FAB for adding scenarios */}
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
      
      {/* Add/Edit Scenario Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingScenarioId ? 'Edit Scenario' : 'Add New Scenario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Scenario Title"
              name="title"
              value={newScenario.title}
              onChange={handleInputChange}
              onBlur={() => handleScenarioFieldBlur('title')}
              fullWidth
              variant="outlined"
              required
              error={!!validationErrors.title}
              helperText={validationErrors.title || 'Enter a clear, descriptive title for this scenario'}
            />

            <TextField
              label="Overview"
              name="overview"
              value={newScenario.overview}
              onChange={handleInputChange}
              onBlur={() => handleScenarioFieldBlur('overview')}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              required
              error={!!validationErrors.overview}
              helperText={validationErrors.overview || 'Provide a brief summary of the scenario in one or two sentences'}
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <FormControl fullWidth required error={!!validationErrors.persona_id}>
                  <InputLabel id="persona-label">Persona</InputLabel>
                  <Select
                    labelId="persona-label"
                    id="persona"
                    name="persona_id"
                    value={newScenario.persona_id}
                    label="Persona"
                    onChange={(event) => {
                      setNewScenario(prev => ({
                        ...prev,
                        persona_id: event.target.value
                      }));
                      // Clear validation error when user selects a value
                      if (validationErrors.persona_id) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.persona_id;
                          return newErrors;
                        });
                      }
                    }}
                    onBlur={() => handleScenarioFieldBlur('persona_id')}
                  >
                    {personas.map((persona) => (
                      <MenuItem key={persona.id} value={persona.id}>
                        {persona.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color={validationErrors.persona_id ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.5 }}>
                    {validationErrors.persona_id || 'Select a persona for this scenario'}
                  </Typography>
                </FormControl>
              </Box>
            </Box>
            
            <TextField
              label="Tone"
              name="tone"
              value={newScenario.tone}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              helperText="The tone that the persona should adopt"
            />
            
            <TextField
              label="Additional Context"
              name="additionalContext"
              value={newScenario.additionalContext}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              helperText="Any additional context that will help the trainee understand the situation"
            />
            
            <Divider sx={{ my: 2 }} />

            {/* Rubrics Section - Note: Rubrics are managed separately */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Rubrics:</strong> After creating the scenario, click the "Rubrics" button to access the rubrics editor where you can define scoring criteria.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseAddDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleAddScenario}
            variant="contained"
            disabled={saving || !newScenario.title || !newScenario.overview || !newScenario.persona_id}
          >
            {saving ? 'Saving...' : (editingScenarioId ? 'Update Scenario' : 'Add Scenario')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Scenario</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this scenario? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteScenario} color="error" variant="contained">
            Delete
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
              onBlur={() => handleTopicFieldBlur('name')}
              fullWidth
              variant="outlined"
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name || 'Enter a descriptive name for this topic'}
            />
            <TextField
              label="Overview"
              name="overview"
              value={editTopic.overview}
              onChange={handleEditTopicInputChange}
              onBlur={() => handleTopicFieldBlur('overview')}
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
              value={editTopic.userRole}
              onChange={handleEditTopicInputChange}
              onBlur={() => handleTopicFieldBlur('userRole')}
              fullWidth
              variant="outlined"
              required
              error={!!validationErrors.userRole}
              helperText={validationErrors.userRole || 'The role that trainees will assume during scenarios (e.g., Customer Service Representative)'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditTopicDialog} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleUpdateTopic}
            variant="contained"
            disabled={saving || !editTopic.name || !editTopic.overview || !editTopic.userRole}
          >
            {saving ? 'Saving...' : 'Update Topic'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Scenario Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {scenarioToView?.title || 'Scenario Details'}
        </DialogTitle>
        <DialogContent>
          {scenarioToView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              {/* Scenario Details */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Overview
                </Typography>
                <Typography variant="body1">
                  {scenarioToView.details || 'No overview provided'}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Persona
                  </Typography>
                  <Typography variant="body1">
                    {scenarioToView.persona?.name || 'Unknown'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Difficulty
                  </Typography>
                  <Typography variant="body1">
                    {scenarioToView.difficulty || 'Not specified'}
                  </Typography>
                </Box>
              </Box>

              {scenarioToView.scenario_tone && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tone
                  </Typography>
                  <Typography variant="body1">
                    {scenarioToView.scenario_tone}
                  </Typography>
                </Box>
              )}

              {scenarioToView.additional_context && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Additional Context
                  </Typography>
                  <Typography variant="body1">
                    {scenarioToView.additional_context}
                  </Typography>
                </Box>
              )}

              <Divider />

              {/* Rubrics Manager */}
              <Box>
                <RubricsManager scenarioId={scenarioToView.id} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button
            onClick={() => {
              handleCloseViewDialog();
              handleEditScenario(scenarioToView?.id);
            }}
            variant="outlined"
          >
            Edit Scenario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicDetails;
