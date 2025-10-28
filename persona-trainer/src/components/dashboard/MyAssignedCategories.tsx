import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';

interface CategoryData {
  id: string;
  name: string;
  details: string;
  updated_at: string;
  created_at: string;
  assigned_date: string;
  topic_count: number;
  scenario_count: number;
  completed_count: number;
  progress: number;
}

type SortOption = 'date_added' | 'date_created' | 'date_updated';
type SortDirection = 'asc' | 'desc';

const MyAssignedCategories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get persisted filter/sort from localStorage
  const [searchQuery, setSearchQuery] = useState(() =>
    localStorage.getItem('categories_search') || ''
  );
  const [sortBy, setSortBy] = useState<SortOption>(() =>
    (localStorage.getItem('categories_sort') as SortOption) || 'date_added'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(() =>
    (localStorage.getItem('categories_sort_direction') as SortDirection) || 'desc'
  );
  const [hideCompleted, setHideCompleted] = useState(() =>
    localStorage.getItem('categories_hide_completed') === 'true'
  );

  // Fetch assigned categories
  useEffect(() => {
    if (user?.id) {
      fetchCategories();
    }
  }, [user?.id]);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [categories, searchQuery, sortBy, sortDirection, hideCompleted]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      // Fetch active category assignments for this user
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('content_assignments')
        .select('content_id')
        .eq('is_active', true)
        .contains('assigned_users', [user?.id])
        .eq('content_type', 'category');

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setCategories([]);
        setLoading(false);
        return;
      }

      // Fetch category details and calculate progress
      const categoriesData = await Promise.all(
        assignmentsData.map(async (assignment) => {
          // Fetch category details
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name, details, created_at, updated_at')
            .eq('id', assignment.content_id)
            .single();

          if (!categoryData) return null;

          // Count topics in this category
          const { data: topicsData, count: topicCount } = await supabase
            .from('topics')
            .select('id', { count: 'exact' })
            .eq('category_id', categoryData.id);

          const topicIds = topicsData?.map(t => t.id) || [];

          // Fetch scenarios for these topics
          const { data: scenariosData } = await supabase
            .from('scenarios')
            .select('id')
            .in('topic_id', topicIds);

          const scenarioIds = scenariosData?.map(s => s.id) || [];
          const scenarioCount = scenarioIds.length;

          // Count completed scenarios using the view
          const { data: completionData } = await supabase
            .from('user_scenario_completion')
            .select('scenario_id')
            .in('scenario_id', scenarioIds)
            .eq('user_id', user?.id)
            .eq('is_completed', 1);

          const completedCount = completionData?.length || 0;
          const progress = scenarioCount ? (completedCount / scenarioCount) * 100 : 0;

          return {
            id: categoryData.id,
            name: categoryData.name,
            details: categoryData.details,
            updated_at: categoryData.updated_at,
            created_at: categoryData.created_at,
            assigned_date: categoryData.created_at, // Use category created_at as fallback
            topic_count: topicCount || 0,
            scenario_count: scenarioCount || 0,
            completed_count: completedCount,
            progress
          };
        })
      );

      const validCategories = categoriesData.filter(c => c !== null) as CategoryData[];
      setCategories(validCategories);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load your assigned categories');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...categories];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(query) ||
        cat.details.toLowerCase().includes(query)
      );
    }

    // Apply hide completed filter
    if (hideCompleted) {
      filtered = filtered.filter(cat => cat.progress < 100);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date_added':
          comparison = new Date(a.assigned_date).getTime() - new Date(b.assigned_date).getTime();
          break;
        case 'date_created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'date_updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        default:
          comparison = 0;
      }

      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredCategories(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    localStorage.setItem('categories_search', value);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    localStorage.setItem('categories_sort', value);
  };

  const handleSortDirectionChange = (value: SortDirection) => {
    setSortDirection(value);
    localStorage.setItem('categories_sort_direction', value);
  };

  const handleHideCompletedChange = (value: boolean) => {
    setHideCompleted(value);
    localStorage.setItem('categories_hide_completed', value.toString());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search, Sort, and Filter Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
          >
            <MenuItem value="date_added">Date Added</MenuItem>
            <MenuItem value="date_created">Date Created</MenuItem>
            <MenuItem value="date_updated">Date Updated</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Direction</InputLabel>
          <Select
            value={sortDirection}
            label="Direction"
            onChange={(e) => handleSortDirectionChange(e.target.value as SortDirection)}
          >
            <MenuItem value="desc">Newest First</MenuItem>
            <MenuItem value="asc">Oldest First</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={hideCompleted}
              onChange={(e) => handleHideCompletedChange(e.target.checked)}
            />
          }
          label="Hide Completed"
        />
      </Box>

      {/* Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery || hideCompleted
              ? 'No categories match your filters'
              : 'No categories assigned yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || hideCompleted
              ? 'Try adjusting your search or filters'
              : 'Contact your administrator to get started with training'}
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
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {category.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {category.details || 'No description available'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip
                        label={`${category.topic_count} Topics`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`${category.scenario_count} Scenarios`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block">
                      Last updated: {new Date(category.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {/* Progress Bar */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {Math.round(category.progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={category.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {category.completed_count} of {category.scenario_count} completed
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/training/category/${category.id}`)}
                  >
                    View Category
                  </Button>
                </CardActions>
              </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MyAssignedCategories;
