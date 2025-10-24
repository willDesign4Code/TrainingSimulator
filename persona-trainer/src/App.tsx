import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import CategoryDetails from './pages/CategoryDetails';
import TopicDetails from './pages/TopicDetails';
import Personas from './pages/Personas';

// Mock authentication state - in a real app, this would use Supabase auth
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Simulate checking auth state
    const checkAuth = async () => {
      // In a real app, we would check the session with Supabase
      // const { data: { session } } = await supabase.auth.getSession();
      // setIsAuthenticated(!!session);
      
      // For demo purposes, we'll just use localStorage
      const hasSession = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(hasSession);
    };
    
    checkAuth();
  }, []);
  
  const login = () => {
    // In a real app, this would be handled by Supabase auth
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    // In a real app, this would be handled by Supabase auth
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };
  
  return { isAuthenticated, login, logout };
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated === null) {
    // Still checking auth state
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isAuthenticated, login, logout } = useAuth();
  
  // For demo purposes, we'll expose the auth functions on the window object
  // In a real app, this would be handled by Supabase auth or a proper context
  (window as any).demoLogin = login;
  (window as any).demoLogout = logout;
  
  return (
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
          <Route path="topics" element={<div>Topics (Coming Soon)</div>} />
          <Route path="topics/:id" element={<TopicDetails />} />
          <Route path="scenarios" element={<div>Scenarios (Coming Soon)</div>} />
          <Route path="scenarios/:id" element={<div>Scenario Details (Coming Soon)</div>} />
          <Route path="personas" element={<Personas />} />
          <Route path="personas/:id" element={<div>Persona Details (Coming Soon)</div>} />
          <Route path="assignments" element={<div>Assignments (Coming Soon)</div>} />
          <Route path="users" element={<div>Users (Coming Soon)</div>} />
          <Route path="training/:id" element={<div>Training Session (Coming Soon)</div>} />
          <Route path="history" element={<div>Training History (Coming Soon)</div>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
