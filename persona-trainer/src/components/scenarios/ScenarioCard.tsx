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

export interface ScenarioProps {
  id: string;
  title: string;
  overview: string;
  customerPersona: string;
  imageUrl?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

const ScenarioCard: React.FC<ScenarioProps> = ({
  id,
  title,
  overview,
  customerPersona,
  imageUrl,
  onEdit,
  onDelete,
  onView
}) => {
  // Calculate if we need to show "more" based on line height
  // Approximate: 2 lines at body2 is roughly 48-50 characters per line = 100 chars
  const shouldShowMore = overview.length > 100;
  const displayText = shouldShowMore ? overview.substring(0, 100) : overview;

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
        height: '140px',
        overflow: 'hidden',
        bgcolor: imageUrl ? 'transparent' : 'grey.500'
      }}>
        {imageUrl && (
          <CardMedia
            component="img"
            height="140"
            image={imageUrl}
            alt={title}
            sx={{ objectFit: 'cover' }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, bgcolor: 'background.paper' }}>
        <Typography gutterBottom variant="h6" component="div">
          {title}
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
                title={overview}
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
        <Chip
          label={`Persona: ${customerPersona}`}
          size="small"
          color="secondary"
          variant="outlined"
        />
      </CardContent>
      <CardActions sx={{ bgcolor: 'background.paper', p: 2, pt: 0, gap: 1 }}>
        {onView && (
          <Button
            variant="contained"
            color="warning"
            fullWidth
            onClick={() => onView(id)}
          >
            RUBRICS
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

export default ScenarioCard;
