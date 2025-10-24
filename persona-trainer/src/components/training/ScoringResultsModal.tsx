import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { ScoringResult, getPerformanceLevel } from '../../services/ai/scoring';

interface ScoringResultsModalProps {
  open: boolean;
  onClose: () => void;
  scoringResult: ScoringResult | null;
  isScoring: boolean;
  trainingTitle: string;
  error?: string | null;
}

const ScoringResultsModal = ({
  open,
  onClose,
  scoringResult,
  isScoring,
  trainingTitle,
  error,
}: ScoringResultsModalProps) => {
  if (!open) return null;

  // Show loading state
  if (isScoring) {
    return (
      <Dialog open={open} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Evaluating Your Performance...
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Our AI is analyzing your conversation against the rubrics.
              <br />
              This may take a moment.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error state
  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Scoring Error</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            We encountered an issue while scoring your performance. Please try ending the session
            again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Show results
  if (!scoringResult) {
    return null;
  }

  const performanceLevel = getPerformanceLevel(scoringResult.percentage);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon color="primary" />
          <Typography variant="h5">Training Results: {trainingTitle}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Overall Score */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Overall Score</Typography>
              <Chip
                label={performanceLevel.level}
                sx={{
                  bgcolor: performanceLevel.color,
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h3" color="primary">
                {scoringResult.percentage}%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                ({scoringResult.total_score.toFixed(1)} / {scoringResult.max_total_score.toFixed(1)} weighted points)
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={scoringResult.percentage}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 2,
                bgcolor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  bgcolor: performanceLevel.color,
                },
              }}
            />

            <Typography variant="body2" color="text.secondary">
              {performanceLevel.description}
            </Typography>
          </Paper>

          {/* Overall Feedback */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Overall Feedback
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {scoringResult.overall_feedback}
            </Typography>
          </Paper>

          {/* Rubric Breakdown */}
          <Typography variant="h6" gutterBottom>
            Detailed Scores
          </Typography>
          {scoringResult.rubric_scores.map((score, index) => (
            <Paper key={score.rubric_id} elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {score.metric_name}
                  </Typography>
                  <Chip
                    label={`${score.score} / ${score.max_score}`}
                    size="small"
                    color={score.score >= score.max_score * 0.7 ? 'success' : 'default'}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(score.score / score.max_score) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    mb: 1,
                  }}
                />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {score.feedback}
                </Typography>

                {score.evidence && score.evidence.length > 0 && (
                  <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid', borderColor: 'grey.300' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      Evidence:
                    </Typography>
                    {score.evidence.map((evidence, idx) => (
                      <Typography key={idx} variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        "{evidence}"
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          ))}

          <Divider sx={{ my: 3 }} />

          {/* Strengths */}
          {scoringResult.strengths && scoringResult.strengths.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6">Strengths</Typography>
              </Box>
              <List dense>
                {scoringResult.strengths.map((strength, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`• ${strength}`}
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Areas for Improvement */}
          {scoringResult.areas_for_improvement && scoringResult.areas_for_improvement.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="warning" />
                <Typography variant="h6">Areas for Improvement</Typography>
              </Box>
              <List dense>
                {scoringResult.areas_for_improvement.map((area, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`• ${area}`}
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" size="large">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScoringResultsModal;
