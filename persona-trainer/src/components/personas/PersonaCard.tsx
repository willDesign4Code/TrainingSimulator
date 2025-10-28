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
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

export interface PersonaProps {
  id: string;
  name: string;
  age: number;
  pronouns: string;
  imageUrl: string;
  isPublic?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PersonaCard: React.FC<PersonaProps> = ({
  id,
  name,
  age,
  pronouns,
  imageUrl,
  isPublic = true,
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
      <Box sx={{
        position: 'relative',
        height: '200px',
        overflow: 'hidden',
        bgcolor: imageUrl ? 'transparent' : 'grey.500'
      }}>
        {imageUrl && (
          <CardMedia
            component="img"
            height="200"
            image={imageUrl}
            alt={name}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Chip
            icon={isPublic ? <PublicIcon /> : <LockIcon />}
            label={isPublic ? 'Public' : 'Private'}
            color={isPublic ? 'success' : 'default'}
            size="small"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)' }}
          />
        </Box>
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
