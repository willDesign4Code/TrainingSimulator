import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  CardActions
} from '@mui/material';

export interface PersonaProps {
  id: string;
  name: string;
  age: number;
  pronouns: string;
  imageUrl: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PersonaCard: React.FC<PersonaProps> = ({
  id,
  name,
  age,
  pronouns,
  imageUrl,
  onEdit,
  onDelete
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
      <Box sx={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="200"
          image={imageUrl || 'https://source.unsplash.com/random/400x200/?portrait'}
          alt={name}
          sx={{ objectFit: 'cover' }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, bgcolor: 'background.paper' }}>
        <Typography gutterBottom variant="h5" component="div">
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Age: {age}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pronouns: {pronouns}
        </Typography>
      </CardContent>
      <CardActions sx={{ bgcolor: 'background.paper' }}>
        {onEdit && (
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => onEdit(id)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button 
            size="small" 
            variant="outlined" 
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

export default PersonaCard;
