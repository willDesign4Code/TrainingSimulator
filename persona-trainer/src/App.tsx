import { Navigate, BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import CategoryDetails from './pages/CategoryDetails';
import CategoryTraining from './pages/CategoryTraining';
import TopicDetails from './pages/TopicDetails';
import Personas from './pages/Personas';
import Assignments from './pages/Assignments';
import { Box, CircularProgress } from '@mui/material';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:id" element={<CategoryDetails />} />
            <Route path="categories/:id/edit" element={<div>Edit Category (Coming Soon)</div>} />
            <Route path="training/category/:id" element={<CategoryTraining />} />
            <Route path="topics" element={<div>Topics (Coming Soon)</div>} />
            <Route path="topics/:id" element={<TopicDetails />} />
            <Route path="scenarios" element={<div>Scenarios (Coming Soon)</div>} />
            <Route path="scenarios/:id" element={<div>Scenario Details (Coming Soon)</div>} />
            <Route path="personas" element={<Personas />} />
            <Route path="personas/:id" element={<div>Persona Details (Coming Soon)</div>} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="users" element={<div>Users (Coming Soon)</div>} />
            <Route path="training/:id" element={<div>Training Session (Coming Soon)</div>} />
            <Route path="history" element={<div>Training History (Coming Soon)</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
