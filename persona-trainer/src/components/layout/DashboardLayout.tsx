import { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Container,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import TopicIcon from '@mui/icons-material/Topic';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

// Access the logout function from the window object (set in App.tsx)
// In a real app, this would be handled by a proper auth context
const useLogout = () => {
  const [logout, setLogout] = useState<(() => void) | null>(null);
  
  useEffect(() => {
    // Check if the logout function is available on the window object
    if ((window as any).demoLogout) {
      setLogout(() => (window as any).demoLogout);
    }
  }, []);
  
  return logout;
};

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const logout = useLogout();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          Persona Trainer
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem onClick={() => navigateTo('/')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem onClick={() => navigateTo('/categories')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon><CategoryIcon /></ListItemIcon>
          <ListItemText primary="Categories" />
        </ListItem>
        <ListItem onClick={() => navigateTo('/topics')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon><TopicIcon /></ListItemIcon>
          <ListItemText primary="Topics" />
        </ListItem>
        <ListItem onClick={() => navigateTo('/scenarios')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon><ForumIcon /></ListItemIcon>
          <ListItemText primary="Scenarios" />
        </ListItem>
        <ListItem onClick={() => navigateTo('/personas')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Personas" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem onClick={() => navigateTo('/assignments')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon><AssignmentIcon /></ListItemIcon>
          <ListItemText primary="Assignments" />
        </ListItem>
        <ListItem onClick={() => navigateTo('/users')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Users" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem 
          onClick={() => {
            if (logout) {
              logout();
              navigate('/login');
            }
          }} 
          sx={{ cursor: 'pointer' }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Persona Trainer
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              First Last
            </Typography>
            <IconButton 
              color="inherit"
              size="small"
              sx={{ ml: 1 }}
            >
              <PersonIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Permanent drawer for larger screens */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
        open
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {drawerContent}
      </Drawer>
      
      {/* Temporary drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: '100%',
          alignItems: 'flex-start'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ width: '100%', alignItems: 'flex-start' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
