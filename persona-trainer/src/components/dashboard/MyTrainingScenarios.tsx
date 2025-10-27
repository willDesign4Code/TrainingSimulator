import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Button,
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
import SearchIcon from '@mui/icons-material/Search';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface ScenarioData {
  id: string;
  title: string;
  category_name: string;
  topic_name: string;
  status: 'Not Started' | 'Completed';
  updated_at: string;
  created_at: string;
  assigned_date: string;
}

type SortOption = 'date_added' | 'date_created' | 'date_updated';
type SortDirection = 'asc' | 'desc';

interface MyTrainingScenariosProps {
  onStartTraining: (scenarioId: string, scenarioTitle: string) => void;
}

const MyTrainingScenarios = ({ onStartTraining }: MyTrainingScenariosProps) => {
  const { user } = useAuth();

  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<ScenarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem('scenarios_rows_per_page');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Filter and sort state with persistence
  const [searchQuery, setSearchQuery] = useState(() =>
    localStorage.getItem('scenarios_search') || ''
  );
  const [sortBy, setSortBy] = useState<SortOption>(() =>
    (localStorage.getItem('scenarios_sort') as SortOption) || 'date_added'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(() =>
    (localStorage.getItem('scenarios_sort_direction') as SortDirection) || 'desc'
  );
  const [categoryFilter, setCategoryFilter] = useState(() =>
    localStorage.getItem('scenarios_category_filter') || 'all'
  );
  const [hideCompleted, setHideCompleted] = useState(() =>
    localStorage.getItem('scenarios_hide_completed') === 'true'
  );

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch scenarios and categories
  useEffect(() => {
    if (user?.id) {
      fetchScenarios();
    }
  }, [user?.id]);

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [scenarios, searchQuery, sortBy, sortDirection, categoryFilter, hideCompleted]);

  const fetchScenarios = async () => {
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
        setScenarios([]);
        setCategories([]);
        setLoading(false);
        return;
      }

      const categoryIds = assignmentsData.map(a => a.content_id);

      // Fetch all categories for the filter dropdown
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds);

      setCategories(categoriesData || []);

      // Fetch topics for these categories
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, name, category_id')
        .in('category_id', categoryIds);

      if (!topicsData || topicsData.length === 0) {
        setScenarios([]);
        setLoading(false);
        return;
      }

      const topicIds = topicsData.map(t => t.id);

      // Fetch scenarios for these topics
      const { data: scenariosData } = await supabase
        .from('scenarios')
        .select('id, title, topic_id, created_at, updated_at')
        .in('topic_id', topicIds);

      if (!scenariosData) {
        setScenarios([]);
        setLoading(false);
        return;
      }

      // Fetch completion status for all scenarios
      const scenarioIds = scenariosData.map(s => s.id);

      const { data: completionData } = await supabase
        .from('user_scenario_completion')
        .select('scenario_id, is_completed, last_completed_at')
        .in('scenario_id', scenarioIds)
        .eq('user_id', user?.id);

      // Create a map for quick lookup
      const completionMap = new Map(
        completionData?.map(c => [c.scenario_id, c]) || []
      );

      // Map scenarios to include category, topic names, and completion status
      const scenariosWithDetails = scenariosData.map(scenario => {
        const topic = topicsData.find(t => t.id === scenario.topic_id);
        const category = categoriesData?.find(c => c.id === topic?.category_id);
        const completion = completionMap.get(scenario.id);

        const status: 'Not Started' | 'Completed' = completion?.is_completed ? 'Completed' : 'Not Started';

        return {
          id: scenario.id,
          title: scenario.title,
          category_name: category?.name || 'Unknown',
          topic_name: topic?.name || 'Unknown',
          status: status,
          updated_at: scenario.updated_at,
          created_at: scenario.created_at,
          assigned_date: scenario.created_at // Use scenario created_at as fallback
        };
      });

      setScenarios(scenariosWithDetails);
      setError(null);
    } catch (err) {
      console.error('Error fetching scenarios:', err);
      setError('Failed to load your training scenarios');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...scenarios];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(scenario =>
        scenario.title.toLowerCase().includes(query) ||
        scenario.category_name.toLowerCase().includes(query) ||
        scenario.topic_name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(scenario => scenario.category_name === categoryFilter);
    }

    // Apply hide completed filter
    if (hideCompleted) {
      filtered = filtered.filter(scenario => scenario.status !== 'Completed');
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

    setFilteredScenarios(filtered);
    // Reset to first page when filters change
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    localStorage.setItem('scenarios_search', value);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    localStorage.setItem('scenarios_sort', value);
  };

  const handleSortDirectionChange = (value: SortDirection) => {
    setSortDirection(value);
    localStorage.setItem('scenarios_sort_direction', value);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    localStorage.setItem('scenarios_category_filter', value);
  };

  const handleHideCompletedChange = (value: boolean) => {
    setHideCompleted(value);
    localStorage.setItem('scenarios_hide_completed', value.toString());
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    localStorage.setItem('scenarios_rows_per_page', newRowsPerPage.toString());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const paginatedScenarios = filteredScenarios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          placeholder="Search scenarios..."
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

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
            ))}
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

      {/* Scenarios Table */}
      {filteredScenarios.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery || categoryFilter !== 'all' || hideCompleted
              ? 'No scenarios match your filters'
              : 'No training scenarios available yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || categoryFilter !== 'all' || hideCompleted
              ? 'Try adjusting your search or filters'
              : 'Contact your administrator to get started with training'}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Scenario Name</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Topic</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Last Updated</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedScenarios.map((scenario) => (
                  <TableRow
                    key={scenario.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>{scenario.title}</TableCell>
                    <TableCell>{scenario.category_name}</TableCell>
                    <TableCell>{scenario.topic_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={scenario.status}
                        size="small"
                        color={scenario.status === 'Completed' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(scenario.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onStartTraining(scenario.id, scenario.title)}
                      >
                        {scenario.status === 'Completed' ? 'Retake Training' : 'Start Training'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 20, 50]}
            component="div"
            count={filteredScenarios.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default MyTrainingScenarios;
