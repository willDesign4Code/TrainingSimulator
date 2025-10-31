import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { useState } from 'react';
import TrainingChatModal from '../components/training/TrainingChatModal';
import { useAuth } from '../contexts/AuthContext';
import MyAssignedCategories from '../components/dashboard/MyAssignedCategories';
import MyTrainingScenarios from '../components/dashboard/MyTrainingScenarios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();

  // Get persisted active tab from localStorage
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('dashboard_active_tab');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<{ id: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle tab change and persist to localStorage
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    localStorage.setItem('dashboard_active_tab', newValue.toString());
  };

  // Handle starting a training from the scenarios table
  const handleStartTraining = (scenarioId: string, scenarioTitle: string) => {
    setSelectedTraining({ id: scenarioId, title: scenarioTitle });
    setChatModalOpen(true);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          sx={{ '& .MuiTab-root': { textTransform: 'none' } }}
        >
          <Tab
            label={<Typography variant="h6">My Assigned Categories</Typography>}
            id="dashboard-tab-0"
            aria-controls="dashboard-tabpanel-0"
          />
          <Tab
            label={<Typography variant="h6">My Training Scenarios</Typography>}
            id="dashboard-tab-1"
            aria-controls="dashboard-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <MyAssignedCategories />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <MyTrainingScenarios onStartTraining={handleStartTraining} />
      </TabPanel>

      {/* Training Chat Modal */}
      {selectedTraining && (
        <TrainingChatModal
          open={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedTraining(null);
          }}
          trainingTitle={selectedTraining.title}
          trainingId={selectedTraining.id}
          scenarioId={selectedTraining.id}
        />
      )}
    </Box>
  );
};

export default Dashboard;
