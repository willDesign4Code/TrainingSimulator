import { useState, useEffect } from 'react';
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
  Fab,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonaCard from '../components/personas/PersonaCard';
import { supabase } from '../services/supabase/client';
import type { Persona } from '../services/supabase/client';
import { useAuth } from '../contexts/AuthContext';

// OpenAI TTS Voice Options
const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Neutral, Balanced)' },
  { value: 'echo', label: 'Echo (Calm, Measured)' },
  { value: 'fable', label: 'Fable (British Accent)' },
  { value: 'onyx', label: 'Onyx (Deep, Authoritative)' },
  { value: 'nova', label: 'Nova (Clear, Friendly)' },
  { value: 'shimmer', label: 'Shimmer (Warm, Engaged)' },
  { value: 'coral', label: 'Coral (Expressive)' }
] as const;

const Personas = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/editing persona
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    pronoun: '',
    occupation: '',
    voice: 'alloy',
    interests: '',
    goals: '',
    image_url: '',
    is_public: true
  });

  // Fetch personas from Supabase
  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      if (!user) {
        setError('You must be logged in to view personas.');
        setLoading(false);
        return;
      }

      // Fetch personas that are either public OR created by the current user
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonas(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching personas:', err);
      setError('Failed to load personas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAgeFilterChange = (event: SelectChangeEvent) => {
    setAgeFilter(event.target.value);
  };

  const filteredPersonas = personas
    .filter(persona =>
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.pronoun.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(persona => {
      if (ageFilter === '') return true;
      if (ageFilter === 'under30') return persona.age < 30;
      if (ageFilter === '30to50') return persona.age >= 30 && persona.age <= 50;
      if (ageFilter === 'over50') return persona.age > 50;
      return true;
    });
  
  const handleOpenDialog = () => {
    // Reset form data for creating new persona
    setEditingPersonaId(null);
    setFormData({
      name: '',
      age: '',
      pronoun: '',
      occupation: '',
      voice: 'alloy',
      interests: '',
      goals: '',
      image_url: '',
      is_public: true
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPersonaId(null);
  };

  const handleSavePersona = async () => {
    try {
      // Parse interests and goals from comma-separated strings
      const interests = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const goals = formData.goals
        .split(',')
        .map(g => g.trim())
        .filter(g => g.length > 0);

      const personaData = {
        name: formData.name,
        age: parseInt(formData.age),
        pronoun: formData.pronoun,
        occupation: formData.occupation,
        voice: formData.voice,
        interests,
        goals,
        image_url: formData.image_url || null,
        is_ai_generated_image: false,
        is_public: formData.is_public
      };

      if (editingPersonaId) {
        // Update existing persona
        const { error } = await supabase
          .from('personas')
          .update(personaData)
          .eq('id', editingPersonaId);

        if (error) throw error;
      } else {
        // Create new persona with created_by field
        const { error } = await supabase
          .from('personas')
          .insert([{ ...personaData, created_by: user?.id }])
          .select()
          .single();

        if (error) throw error;
      }

      // Refresh persona list
      await fetchPersonas();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving persona:', err);
      setError(`Failed to ${editingPersonaId ? 'update' : 'create'} persona. Please try again.`);
    }
  };

  const handleEditPersona = (id: string) => {
    const personaToEdit = personas.find(p => p.id === id);
    if (!personaToEdit) return;

    // Convert arrays back to comma-separated strings for editing
    const interestsString = Array.isArray(personaToEdit.interests)
      ? personaToEdit.interests.join(', ')
      : '';
    const goalsString = Array.isArray(personaToEdit.goals)
      ? personaToEdit.goals.join(', ')
      : '';

    setEditingPersonaId(id);
    setFormData({
      name: personaToEdit.name,
      age: personaToEdit.age.toString(),
      pronoun: personaToEdit.pronoun,
      occupation: personaToEdit.occupation,
      voice: personaToEdit.voice || 'alloy',
      interests: interestsString,
      goals: goalsString,
      image_url: personaToEdit.image_url || '',
      is_public: personaToEdit.is_public
    });
    setOpenDialog(true);
  };

  const handleDeletePersona = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this persona?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh persona list
      await fetchPersonas();
    } catch (err) {
      console.error('Error deleting persona:', err);
      setError('Failed to delete persona. Please try again.');
    }
  };
  
  return (
    <Box sx={{ width: '100%', px: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Personas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Persona
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search personas..."
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
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="age-filter-label">Age Filter</InputLabel>
          <Select
            labelId="age-filter-label"
            id="age-filter"
            value={ageFilter}
            label="Age Filter"
            onChange={handleAgeFilterChange}
          >
            <MenuItem value="">All Ages</MenuItem>
            <MenuItem value="under30">Under 30</MenuItem>
            <MenuItem value="30to50">30 to 50</MenuItem>
            <MenuItem value="over50">Over 50</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {ageFilter && (
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={
              ageFilter === 'under30' ? 'Under 30 years' :
              ageFilter === '30to50' ? '30 to 50 years' :
              ageFilter === 'over50' ? 'Over 50 years' : ''
            }
            onDelete={() => setAgeFilter('')}
            color="primary"
            variant="outlined"
          />
        </Box>
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
            {filteredPersonas.map((persona) => (
              <PersonaCard
                key={persona.id}
                id={persona.id}
                name={persona.name}
                age={persona.age}
                pronouns={persona.pronoun}
                imageUrl={persona.image_url || ''}
                isPublic={persona.is_public}
                onEdit={handleEditPersona}
                onDelete={handleDeletePersona}
              />
            ))}
          </Box>

          {filteredPersonas.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No personas found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {personas.length === 0
                  ? 'Get started by creating your first persona'
                  : 'Try adjusting your search or create a new persona'}
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* Mobile FAB for creating personas */}
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
      
      {/* Create/Edit Persona Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingPersonaId ? 'Edit Persona' : 'Add New Persona'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Name"
              fullWidth
              required
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Age"
                type="number"
                required
                fullWidth
                variant="outlined"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
              <TextField
                label="Pronouns"
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., she/her"
                value={formData.pronoun}
                onChange={(e) => setFormData({ ...formData, pronoun: e.target.value })}
              />
            </Box>

            <TextField
              label="Occupation"
              fullWidth
              required
              variant="outlined"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />

            <FormControl fullWidth required>
              <InputLabel>Voice</InputLabel>
              <Select
                value={formData.voice}
                label="Voice"
                onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
              >
                {VOICE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Interests"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Comma-separated list (e.g., technology, design, travel)"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
            />

            <TextField
              label="Goals"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Comma-separated list (e.g., career growth, work-life balance)"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            />

            <TextField
              label="Image URL (Optional)"
              fullWidth
              variant="outlined"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Make this persona public</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formData.is_public
                      ? 'Everyone can view and use this persona'
                      : 'Only you can view and use this persona'}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSavePersona}
            variant="contained"
            disabled={!formData.name || !formData.age || !formData.pronoun || !formData.occupation}
          >
            {editingPersonaId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Personas;
