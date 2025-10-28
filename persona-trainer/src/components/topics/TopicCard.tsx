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
        <Typography gutterBottom variant="h5" component="div">
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {overview.length > 120 ? `${overview.substring(0, 120)}...` : overview}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`${scenarioCount} Scenarios`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Role: ${userRole}`} 
            size="small" 
            color="secondary" 
            variant="outlined" 
          />
        </Box>
      </CardContent>
      <CardActions sx={{ bgcolor: 'background.paper' }}>
        {onView && (
          <Button 
            size="small" 
            onClick={() => {
              console.log('View Scenarios button clicked for:', id);
              onView(id);
            }}
          >
            View Scenarios
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

export default TopicCard;
