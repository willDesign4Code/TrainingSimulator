import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import TrainingChatModal from '../components/training/TrainingChatModal';

interface ScenarioData {
  id: string;
  title: string;
  status: 'Not Started' | 'Completed';
  updated_at: string;
}

interface TopicWithScenarios {
  id: string;
  name: string;
  details: string;
  user_role: string;
  image_url: string;
  scenarioCount: number;
  scenarios?: ScenarioData[];
}

const CategoryTraining = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [category, setCategory] = useState<any | null>(null);
  const [topics, setTopics] = useState<TopicWithScenarios[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Training modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<{ id: string; title: string } | null>(null);

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

        // Fetch scenario details with completion status for user
        const topicsWithData = await Promise.all(
          (topicsData || []).map(async (topic) => {
            const { data: scenariosData } = await supabase
              .from('scenarios')
              .select('id, title, updated_at')
              .eq('topic_id', topic.id)
              .order('created_at', { ascending: true });

            const scenarioIds = (scenariosData || []).map(s => s.id);

            // Fetch completion status for these scenarios
            const { data: completionData } = await supabase
              .from('user_scenario_completion')
              .select('scenario_id, is_completed')
              .in('scenario_id', scenarioIds)
              .eq('user_id', userProfile?.id);

            const completionMap = new Map(
              completionData?.map(c => [c.scenario_id, c.is_completed]) || []
            );

            const scenarios: ScenarioData[] = (scenariosData || []).map(s => {
              const status: 'Completed' | 'Not Started' = completionMap.get(s.id) ? 'Completed' : 'Not Started';
              return {
                id: s.id,
                title: s.title,
                status,
                updated_at: s.updated_at
              };
            });

            return {
              ...topic,
              scenarioCount: scenarios.length,
              scenarios
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

  // Handle starting a training session
  const handleStartTraining = (scenarioId: string, scenarioTitle: string) => {
    setSelectedTraining({ id: scenarioId, title: scenarioTitle });
    setChatModalOpen(true);
  };

  // Reload data after training session completes
  const handleTrainingClose = async () => {
    setChatModalOpen(false);
    setSelectedTraining(null);

    // Refresh the data to get updated completion status
    if (id && userProfile) {
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('category_id', id)
        .order('created_at', { ascending: false });

      const topicsWithData = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { data: scenariosData } = await supabase
            .from('scenarios')
            .select('id, title, updated_at')
            .eq('topic_id', topic.id)
            .order('created_at', { ascending: true });

          const scenarioIds = (scenariosData || []).map(s => s.id);

          const { data: completionData } = await supabase
            .from('user_scenario_completion')
            .select('scenario_id, is_completed')
            .in('scenario_id', scenarioIds)
            .eq('user_id', userProfile?.id);

          const completionMap = new Map(
            completionData?.map(c => [c.scenario_id, c.is_completed]) || []
          );

          const scenarios: ScenarioData[] = (scenariosData || []).map(s => {
            const status: 'Completed' | 'Not Started' = completionMap.get(s.id) ? 'Completed' : 'Not Started';
            return {
              id: s.id,
              title: s.title,
              status,
              updated_at: s.updated_at
            };
          });

          return {
            ...topic,
            scenarioCount: scenarios.length,
            scenarios
          };
        })
      );

      setTopics(topicsWithData);
    }
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
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3 }}>
      {/* Back button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ textTransform: 'none' }}
        >
          Back To My Assigned Categories
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

      {/* Topics & Scenarios */}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Topics & Scenarios
      </Typography>

      <Box>
        {topics.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No topics available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This category doesn't have any topics yet
            </Typography>
          </Box>
        ) : (
          topics.map((topic) => (
            <Accordion key={topic.id} defaultExpanded={topics.length === 1}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Typography variant="h6">{topic.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {topic.details}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {topic.scenarioCount} scenario{topic.scenarioCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {!topic.scenarios || topic.scenarios.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No scenarios available in this topic
                  </Typography>
                ) : (
                  <List>
                    {topic.scenarios.map((scenario) => (
                      <ListItem
                        key={scenario.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': {
                            borderBottom: 'none'
                          }
                        }}
                      >
                        <ListItemText
                          primary={scenario.title}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Chip
                                label={scenario.status}
                                size="small"
                                color={scenario.status === 'Completed' ? 'success' : 'default'}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Last updated: {new Date(scenario.updated_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleStartTraining(scenario.id, scenario.title)}
                          sx={{ ml: 2 }}
                        >
                          {scenario.status === 'Completed' ? 'Retake Training' : 'Start Training'}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Training Chat Modal */}
      {selectedTraining && (
        <TrainingChatModal
          open={chatModalOpen}
          onClose={handleTrainingClose}
          trainingTitle={selectedTraining.title}
          trainingId={selectedTraining.id}
          scenarioId={selectedTraining.id}
        />
      )}
    </Box>
  );
};

export default CategoryTraining;
