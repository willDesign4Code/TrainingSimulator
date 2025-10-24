import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import ScoreIcon from '@mui/icons-material/Score';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TrainingChatModal from '../components/training/TrainingChatModal';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<{ id: string; title: string } | null>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's active assignments and available scenarios
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch active assignments for this user
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('content_assignments')
        .select('*')
        .eq('is_active', true)
        .contains('assigned_users', [user?.id])
        .eq('content_type', 'category');

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        setScenarios([]);
        setLoading(false);
        return;
      }

      // Fetch category details for each assignment
      const categoriesWithScenarios = await Promise.all(
        assignmentsData.map(async (assignment) => {
          // Fetch the category details
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name, details')
            .eq('id', assignment.content_id)
            .single();

          if (!categoryData) return null;

          // Fetch topics for this category
          const { data: topicsData } = await supabase
            .from('topics')
            .select('id')
            .eq('category_id', categoryData.id);

          if (!topicsData || topicsData.length === 0) return {
            ...assignment,
            category: categoryData,
            scenarios: []
          };

          const topicIds = topicsData.map(t => t.id);

          // Fetch scenarios for these topics
          const { data: scenariosData } = await supabase
            .from('scenarios')
            .select(`
              *,
              topic:topics(
                name,
                category:categories(name)
              )
            `)
            .in('topic_id', topicIds);

          return {
            ...assignment,
            category: categoryData,
            scenarios: scenariosData || []
          };
        })
      );

      const validAssignments = categoriesWithScenarios.filter(a => a !== null);
      setAssignments(validAssignments);

      // Flatten all scenarios from assignments
      const allScenarios = validAssignments.flatMap(a => a.scenarios || []);
      setScenarios(allScenarios);

      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your assignments');
    } finally {
      setLoading(false);
    }
  };

  const assignedTrainings = scenarios;
  const recentSessions: any[] = [];  // Empty for now

  const stats = {
    completedSessions: 0,
    assignedTrainings: assignments.length,
    availableScenarios: scenarios.length,
    averageScore: 0
  };

  // Common styles for metric cards
  const metricCardStyle = {
    height: '100%',
    p: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
    borderRadius: 2
  };

  return (
    <Box sx={{ width: '100%', px: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 3
      }}>
        <Paper
          elevation={2}
          sx={{
            ...metricCardStyle,
            bgcolor: 'info.light',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
        >
          <CategoryIcon sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">
            {stats.assignedTrainings}
          </Typography>
          <Typography variant="body1">
            Assigned Categories
          </Typography>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            ...metricCardStyle,
            bgcolor: 'secondary.light',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
        >
          <AssignmentIcon sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">
            {stats.assignedTrainings}
          </Typography>
          <Typography variant="body1">
            Assigned Trainings
          </Typography>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            ...metricCardStyle,
            bgcolor: 'primary.light',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
        >
          <HomeIcon sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">
            {stats.completedSessions}
          </Typography>
          <Typography variant="body1">
            Completed Trainings
          </Typography>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            ...metricCardStyle,
            bgcolor: 'success.light',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
        >
          <ScoreIcon sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">
            {stats.averageScore}%
          </Typography>
          <Typography variant="body1">
            Average Score
          </Typography>
          <LinearProgress
            variant="determinate"
            value={stats.averageScore}
            sx={{
              width: '80%',
              mt: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white'
              }
            }}
          />
        </Paper>
      </Box>
      
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Assigned Trainings and Recent Sessions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Card
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
              Available Training Scenarios
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : assignedTrainings.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No training scenarios available yet
              </Typography>
            ) : (
              <List>
                {assignedTrainings.map((training, index) => (
                  <Box key={training.id}>
                    <ListItem
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 2
                      }}
                    >
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {training.title}
                        </Typography>
                        {training.topic && (
                          <Typography variant="caption" color="text.secondary">
                            {training.topic.category?.name} → {training.topic.name}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            setSelectedTraining({ id: training.id, title: training.title });
                            setChatModalOpen(true);
                          }}
                        >
                          START
                        </Button>
                      </Box>
                    </ListItem>
                    {index < assignedTrainings.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
            <Button
              size="small"
              onClick={() => navigate('/assignments')}
            >
              View All Assignments
            </Button>
          </CardActions>
        </Card>
        
        {/* Recent Sessions */}
        <Card 
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
              Recent Trainings
            </Typography>
            <List>
              {recentSessions.map((session, index) => (
                <Box key={session.id}>
                  <ListItem
                    secondaryAction={
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          bgcolor: session.score > 80 ? 'success.light' : 'warning.light',
                          color: 'white',
                          borderRadius: 2,
                          px: 2,
                          py: 0.5
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {session.score}%
                        </Typography>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={session.title}
                      secondary={`Completed on ${new Date(session.date).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < recentSessions.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
            <Button 
              size="small" 
              onClick={() => navigate('/history')}
            >
              View Training History
            </Button>
          </CardActions>
        </Card>
      </Box>

      {/* Training Chat Modal */}
      {selectedTraining && (
        <TrainingChatModal
          open={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedTraining(null);
          }}
          trainingTitle={selectedTraining.title}
          trainingId={selectedTraining.id}
          scenarioId={selectedTraining.id}
        />
      )}
    </Box>
  );
};

export default Dashboard;
