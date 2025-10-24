import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  CardActions,
  Chip
} from '@mui/material';

export interface ScenarioProps {
  id: string;
  title: string;
  overview: string;
  customerPersona: string;
  imageUrl?: string;
  difficulty?: string;
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
  difficulty = 'Medium',
  onEdit,
  onDelete,
  onView
}) => {
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
      <Box sx={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="140"
          image={imageUrl || 'https://source.unsplash.com/random/400x200/?conversation'}
          alt={title}
          sx={{ objectFit: 'cover' }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, bgcolor: 'background.paper' }}>
        <Typography gutterBottom variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {overview.length > 100 ? `${overview.substring(0, 100)}...` : overview}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`Persona: ${customerPersona}`} 
            size="small" 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={`Difficulty: ${difficulty}`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
      </CardContent>
      <CardActions sx={{ bgcolor: 'background.paper' }}>
        {onView && (
          <Button
            size="small"
            onClick={() => onView(id)}
          >
            Rubrics
          </Button>
        )}
        {onEdit && (
          <Button
            size="small"
            onClick={() => onEdit(id)}
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            size="small"
            color="error"
            onClick={() => onDelete(id)}
          >
            Delete
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ScenarioCard;
