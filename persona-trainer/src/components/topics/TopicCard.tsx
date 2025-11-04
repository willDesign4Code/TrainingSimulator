import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  CardActions,
  Chip,
  Tooltip
} from '@mui/material';

export interface TopicProps {
  id: string;
  name: string;
  overview: string;
  userRole: string;
  imageUrl: string;
  scenarioCount: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

const TopicCard: React.FC<TopicProps> = ({
  id,
  name,
  overview,
  userRole,
  imageUrl,
  scenarioCount,
  onEdit,
  onDelete,
  onView
}) => {
  console.log('TopicCard props:', { id, name, onView: !!onView });

  // Combine overview with role information
  const fullText = `${overview}\n\nYour role: ${userRole}`;

  // Calculate if we need to show "more" based on line height
  // Approximate: 2 lines at body2 is roughly 48-50 characters per line = 100 chars
  const shouldShowMore = fullText.length > 100;
  const displayText = shouldShowMore ? fullText.substring(0, 100) : fullText;

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        overflow: 'hidden'
      }}
    >
      <Box sx={{
        position: 'relative',
        height: '160px',
        overflow: 'hidden',
        bgcolor: imageUrl ? 'transparent' : 'grey.500'
      }}>
        {imageUrl && (
          <CardMedia
            component="img"
            height="160"
            image={imageUrl}
            alt={name}
            sx={{ objectFit: 'cover' }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, bgcolor: 'background.paper' }}>
        <Typography gutterBottom variant="h6" component="div">
          {name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {displayText}
          {shouldShowMore && (
            <>
              {'... '}
              <Tooltip
                title={
                  <Box sx={{ whiteSpace: 'pre-line' }}>
                    {fullText}
                  </Box>
                }
                arrow
              >
                <Typography
                  component="span"
                  color="primary"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  more
                </Typography>
              </Tooltip>
            </>
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${scenarioCount} Scenarios`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </CardContent>
      <CardActions sx={{ bgcolor: 'background.paper', p: 2, pt: 0, gap: 1 }}>
        {onView && (
          <Button
            variant="contained"
            color="warning"
            fullWidth
            onClick={() => {
              console.log('View Scenarios button clicked for:', id);
              onView(id);
            }}
          >
            SCENARIOS
          </Button>
        )}
        {onEdit && (
          <Button
            variant="contained"
            color="warning"
            fullWidth
            onClick={() => onEdit(id)}
          >
            EDIT
          </Button>
        )}
        {onDelete && (
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={() => onDelete(id)}
          >
            DELETE
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default TopicCard;
