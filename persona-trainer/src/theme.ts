import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue - for primary buttons, chips, links
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0', // Purple - for secondary chips
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ffb300', // Amber - for secondary action buttons (View Topics, Edit)
      light: '#ffc233',
      dark: '#ff8f00',
      contrastText: 'rgba(0, 0, 0, 0.6)',
    },
    background: {
      default: '#eeeeee', // Light gray background
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '3rem', // 48px
      fontWeight: 400,
      lineHeight: 1.167,
    },
    h2: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '3rem', // 48px (Dashboard title)
      fontWeight: 400,
      lineHeight: 1.167,
    },
    h4: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '1.5rem', // 24px
      fontWeight: 400,
      lineHeight: 1.334,
    },
    h5: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '1.5rem', // 24px (Section titles)
      fontWeight: 400,
      lineHeight: 1.334,
    },
    h6: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '1.25rem', // 20px (Card titles, navigation)
      fontWeight: 500,
      lineHeight: 1.6,
    },
    body1: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.43,
    },
    caption: {
      fontFamily: '"Afacad", sans-serif',
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.66,
    },
    button: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.8125rem', // 13px
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.12), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.2)',
        },
        contained: {
          boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.12), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          padding: '16px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Roboto", sans-serif',
          fontSize: '0.8125rem', // 13px
          fontWeight: 400,
          lineHeight: 1.43,
        },
      },
    },
  },
});
