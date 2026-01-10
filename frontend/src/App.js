import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import UsersPage from './pages/UsersPage';
import ChefEquipeEvaluationsPage from './pages/ChefEquipeEvaluationsPage';
import ManagerValidationPage from './pages/ManagerValidationPage';
import RHValidationPage from './pages/RHValidationPage';
import MyEvaluationsPage from './pages/MyEvaluationsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Dashboard - accessible à tous */}
              <Route index element={<DashboardPage />} />
              
              {/* Campagnes - RH uniquement */}
              <Route path="campaigns" element={
                <ProtectedRoute roles={['rh']}>
                  <CampaignsPage />
                </ProtectedRoute>
              } />
              <Route path="campaigns/:id" element={
                <ProtectedRoute roles={['rh', 'manager']}>
                  <CampaignDetailPage />
                </ProtectedRoute>
              } />
              
              {/* Gestion des utilisateurs - RH uniquement */}
              <Route path="users" element={
                <ProtectedRoute roles={['rh']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              
              {/* Évaluations Chef d'équipe */}
              <Route path="evaluations/chef-equipe" element={
                <ProtectedRoute roles={['chef_equipe']}>
                  <ChefEquipeEvaluationsPage />
                </ProtectedRoute>
              } />
              
              {/* Validations Manager */}
              <Route path="evaluations/manager" element={
                <ProtectedRoute roles={['manager']}>
                  <ManagerValidationPage />
                </ProtectedRoute>
              } />
              
              {/* Validations et Décisions RH */}
              <Route path="evaluations/rh" element={
                <ProtectedRoute roles={['rh']}>
                  <RHValidationPage />
                </ProtectedRoute>
              } />
              
              {/* Mes évaluations - Employé */}
              <Route path="my-evaluations" element={
                <ProtectedRoute roles={['employee']}>
                  <MyEvaluationsPage />
                </ProtectedRoute>
              } />
              
              {/* Vue générale des évaluations - Manager et RH */}
              <Route path="evaluations" element={
                <ProtectedRoute roles={['manager', 'rh']}>
                  <EvaluationsPage />
                </ProtectedRoute>
              } />
              
              {/* Rapports - RH uniquement */}
              <Route path="reports" element={
                <ProtectedRoute roles={['rh']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="reports/:campaignId" element={
                <ProtectedRoute roles={['rh']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              
              {/* Profil - accessible à tous */}
              <Route path="profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
            </Route>
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;