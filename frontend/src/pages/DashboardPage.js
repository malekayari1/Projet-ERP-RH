import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Campaign as CampaignIcon,
  EmojiEvents as TrophyIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Update as UpdateIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const DashboardPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, activitiesRes] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentActivities()
        ]);
        setStats(statsRes.data);
        setRecentActivities(activitiesRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Erreur lors du chargement des données');
        // Données par défaut en cas d'erreur
        setStats(getDefaultStats());
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  const getDefaultStats = () => {
    switch (user?.role) {
      case 'rh':
        return { totalEmployees: 0, activeCampaigns: 0, pendingEvaluations: 0, averageScore: 0 };
      case 'manager':
        return { pendingValidation: 0, validated: 0, activeCampaigns: 0, averageScore: 0 };
      case 'chef_equipe':
        return { teamMembers: 0, pendingEvaluations: 0, completedEvaluations: 0, averageScore: 0 };
      case 'employee':
        return { totalEvaluations: 0, averageScore: 0, lastEvaluation: null, unreadNotifications: 0 };
      default:
        return {};
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'pending':
        return <PendingIcon color="warning" fontSize="small" />;
      case 'info':
        return <NotificationsIcon color="info" fontSize="small" />;
      default:
        return <WarningIcon color="error" fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Render stats cards based on role
  const renderStatsCards = () => {
    if (!stats) return null;

    const cardStyle = {
      height: '100%',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
      }
    };

    switch (user?.role) {
      case 'rh':
        return (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle} onClick={() => navigate('/users')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'info.light', mr: 2 }}><PeopleIcon /></Avatar>
                    <Typography color="textSecondary">Employés</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.totalEmployees || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle} onClick={() => navigate('/campaigns')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}><CampaignIcon /></Avatar>
                    <Typography color="textSecondary">Campagnes actives</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.activeCampaigns || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle} onClick={() => navigate('/evaluations/rh')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}><PendingIcon /></Avatar>
                    <Typography color="textSecondary">En attente</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.pendingEvaluations || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle} onClick={() => navigate('/reports')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}><TrophyIcon /></Avatar>
                    <Typography color="textSecondary">Score moyen</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{stats.averageScore || 0}%</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        );

      case 'manager':
        return (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle} onClick={() => navigate('/evaluations/manager')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}><PendingIcon /></Avatar>
                    <Typography color="textSecondary">À valider</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.pendingValidation || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}><CheckCircleIcon /></Avatar>
                    <Typography color="textSecondary">Validées</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{stats.validated || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}><CampaignIcon /></Avatar>
                    <Typography color="textSecondary">Campagnes</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.activeCampaigns || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'secondary.light', mr: 2 }}><TrophyIcon /></Avatar>
                    <Typography color="textSecondary">Score moyen</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.averageScore || 0}%</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        );

      case 'chef_equipe':
        return (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'info.light', mr: 2 }}><PeopleIcon /></Avatar>
                    <Typography color="textSecondary">Mon équipe</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.teamMembers || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle} onClick={() => navigate('/evaluations/chef-equipe')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}><PendingIcon /></Avatar>
                    <Typography color="textSecondary">À évaluer</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.pendingEvaluations || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}><CheckCircleIcon /></Avatar>
                    <Typography color="textSecondary">Complétées</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{stats.completedEvaluations || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'secondary.light', mr: 2 }}><TrophyIcon /></Avatar>
                    <Typography color="textSecondary">Score équipe</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.averageScore || 0}%</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        );

      case 'employee':
        return (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle} onClick={() => navigate('/my-evaluations')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><AssessmentIcon /></Avatar>
                    <Typography color="textSecondary" variant="subtitle2">Mes évaluations</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.totalEvaluations || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={cardStyle}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}><TrophyIcon /></Avatar>
                    <Typography color="textSecondary" variant="subtitle2">Score moyen</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{stats.averageScore || 0}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ ...cardStyle, bgcolor: stats.pendingSelfEvaluations > 0 ? 'warning.light' : 'white', color: stats.pendingSelfEvaluations > 0 ? 'white' : 'inherit' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: stats.pendingSelfEvaluations > 0 ? 'white' : 'warning.light', color: 'warning.main', mr: 2 }}><UpdateIcon /></Avatar>
                    <Typography color={stats.pendingSelfEvaluations > 0 ? 'inherit' : "textSecondary"} variant="subtitle2">Auto-évaluation</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingSelfEvaluations || 0}
                  </Typography>
                  {stats.pendingSelfEvaluations > 0 && <Typography variant="caption">En attente d'action</Typography>}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ ...cardStyle, bgcolor: stats.pendingSignatures > 0 ? 'error.light' : 'white', color: stats.pendingSignatures > 0 ? 'white' : 'inherit' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: stats.pendingSignatures > 0 ? 'white' : 'info.light', color: 'info.main', mr: 2 }}><CheckCircleIcon /></Avatar>
                    <Typography color={stats.pendingSignatures > 0 ? 'inherit' : "textSecondary"} variant="subtitle2">Signature en attente</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{stats.pendingSignatures || 0}</Typography>
                  {stats.pendingSignatures > 0 && <Typography variant="caption">Action requise</Typography>}
                </CardContent>
              </Card>
            </Grid>
          </>
        );

      default:
        return null;
    }
  };

  // Get quick actions based on role
  const getQuickActions = () => {
    switch (user?.role) {
      case 'rh':
        return [
          { title: 'Nouvelle campagne', desc: 'Créer une campagne d\'évaluation', icon: <CampaignIcon color="primary" />, path: '/campaigns' },
          { title: 'Gérer évaluations', desc: 'Approuver et décider', icon: <AssessmentIcon color="secondary" />, path: '/evaluations/rh' },
          { title: 'Rapports', desc: 'Générer des rapports', icon: <AssessmentIcon color="success" />, path: '/reports' },
        ];
      case 'manager':
        return [
          { title: 'Valider évaluations', desc: 'Valider les évaluations', icon: <AssessmentIcon color="primary" />, path: '/evaluations/manager' },
        ];
      case 'chef_equipe':
        return [
          { title: 'Évaluer mon équipe', desc: 'Évaluer les membres de mon équipe', icon: <PeopleIcon color="primary" />, path: '/evaluations/chef-equipe' },
        ];
      case 'employee':
        return [
          { title: 'Mes évaluations', desc: 'Voir mes résultats', icon: <AssessmentIcon color="primary" />, path: '/my-evaluations' },
        ];
      default:
        return [];
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de bord
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Bienvenue, {user?.fullName} ({user?.role === 'rh' ? 'Ressources Humaines' :
          user?.role === 'chef_equipe' ? 'Chef d\'équipe' :
            user?.role === 'manager' ? 'Manager' : 'Employé'})
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {renderStatsCards()}
          </Grid>

          {/* Recent Activities and Quick Actions */}
          <Grid container spacing={3}>
            {user?.role === 'employee' && (
              <Grid item xs={12}>
                <Grid container spacing={3}>
                  {/* Tendance de Performance */}
                  <Grid item xs={12} md={7}>
                    <Card elevation={3} sx={{ height: '100%' }}>
                      <CardHeader
                        avatar={<TimelineIcon color="primary" />}
                        title="Tendance de Performance (Derniers scores)"
                        titleTypographyProps={{ variant: 'h6' }}
                      />
                      <Divider />
                      <CardContent sx={{ height: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', pb: 4 }}>
                        {stats.scoreHistory && stats.scoreHistory.length > 0 ? (
                          stats.scoreHistory.slice().reverse().map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '15%' }}>
                              <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>{item.score}%</Typography>
                              <Box sx={{
                                width: '100%',
                                height: item.score * 1.5,
                                bgcolor: item.score >= 80 ? 'success.main' : item.score >= 40 ? 'warning.main' : 'error.main',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.5s ease',
                                '&:hover': { opacity: 0.8 }
                              }} />
                              <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', height: 40, overflow: 'hidden' }}>{item.campaign}</Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography color="textSecondary">Données insuffisantes pour afficher l'historique</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Mes Objectifs SMART */}
                  <Grid item xs={12} md={5}>
                    <Card elevation={3} sx={{ height: '100%' }}>
                      <CardHeader
                        avatar={<AssignmentTurnedInIcon color="secondary" />}
                        title="Mes Objectifs SMART"
                        titleTypographyProps={{ variant: 'h6' }}
                      />
                      <Divider />
                      <CardContent>
                        {stats.lastEvaluation?.objectives && stats.lastEvaluation.objectives.length > 0 ? (
                          <List dense>
                            {stats.lastEvaluation.objectives.map((obj, i) => (
                              <ListItem key={i} sx={{ borderLeft: '3px solid', borderColor: i % 2 === 0 ? 'primary.main' : 'secondary.main', mb: 1, bgcolor: 'grey.50' }}>
                                <ListItemText
                                  primary={obj.title}
                                  secondary={obj.deadline ? `Échéance: ${new Date(obj.deadline).toLocaleDateString()}` : 'Pas de date'}
                                />
                                <Chip label={obj.status || 'En cours'} size="small" variant="outlined" />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography color="textSecondary" align="center" py={4}>Aucun objectif actif pour le moment</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            )}

            <Grid item xs={12} md={8}>
              <Card elevation={3}>
                <CardHeader
                  title="Activités récentes"
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            opacity: activity.read ? 0.8 : 1,
                            bgcolor: activity.read ? 'inherit' : 'action.hover',
                            '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'transparent' }}>
                              {getStatusIcon(activity.status)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography fontWeight={activity.read ? 'normal' : 'bold'}>{activity.title}</Typography>}
                            secondary={
                              <>
                                <Typography variant="body2" color="text.primary" sx={{ display: 'block' }}>
                                  {activity.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(activity.date)}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary={<Typography color="textSecondary" align="center">Aucune activité récente</Typography>} />
                    </ListItem>
                  )}
                </List>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardHeader title="Actions rapides" titleTypographyProps={{ variant: 'h6' }} />
                <Divider />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {getQuickActions().map((action, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'action.hover', transform: 'translateX(4px)' }
                        }}
                        onClick={() => navigate(action.path)}
                      >
                        <Box sx={{ mr: 2 }}>{action.icon}</Box>
                        <Box>
                          <Typography variant="subtitle1">{action.title}</Typography>
                          <Typography variant="body2" color="textSecondary">{action.desc}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
