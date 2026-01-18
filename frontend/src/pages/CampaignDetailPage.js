import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import * as api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const statusConfig = {
  pending: { label: 'En attente', color: 'default', icon: <PendingIcon /> },
  evaluated: { label: 'Évalué', color: 'info', icon: <CheckCircleIcon /> },
  validated_manager: { label: 'Validé Manager', color: 'warning', icon: <CheckCircleIcon /> },
  validated_rh: { label: 'Validé RH', color: 'secondary', icon: <CheckCircleIcon /> },
  decision_made: { label: 'Décision prise', color: 'primary', icon: <CheckCircleIcon /> },
  notified: { label: 'Notifié', color: 'success', icon: <CheckCircleIcon /> }
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      console.log('CampaignDetailPage: Fetching data for campaign ID:', id);
      const [campaignRes, evaluationsRes] = await Promise.all([
        api.getCampaignStats(id),
        api.getEvaluationsByCampaign(id)
      ]);
      console.log('CampaignDetailPage: Campaign Stats:', campaignRes.data);
      console.log('CampaignDetailPage: Evaluations count:', evaluationsRes.data.length);
      console.log('CampaignDetailPage: Raw Evaluations:', evaluationsRes.data);
      setCampaign(campaignRes.data.campaign);
      setStats(campaignRes.data.stats);
      setEvaluations(evaluationsRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('CampaignDetailPage Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir lancer cette campagne?')) return;
    try {
      await api.launchCampaign(id);
      setSuccess('Campagne lancée avec succès');
      fetchCampaignData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du lancement');
    }
  };

  const handleNotifyAll = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir notifier tous les employés?')) return;
    try {
      const { data } = await api.notifyAllEmployees(id);
      setSuccess(data.message);
      fetchCampaignData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la notification');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await api.getCampaignReportPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_${campaign.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Erreur lors du téléchargement du rapport');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const filteredEvaluations = () => {
    const statusMap = ['pending', 'evaluated', 'validated_manager', 'validated_rh', 'decision_made', 'notified'];
    if (tabValue === 0) return evaluations;
    return evaluations.filter(e => e.status === statusMap[tabValue - 1]);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Alert severity="error">Campagne non trouvée</Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/campaigns')}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4">{campaign.title}</Typography>
          <Typography color="textSecondary">
            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            {campaign.department && ` • Département: ${campaign.department}`}
          </Typography>
        </Box>
        <Chip
          label={statusConfig[campaign.status]?.label || campaign.status}
          color={statusConfig[campaign.status]?.color || 'default'}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* DEBUG BANNER */}
      <Alert severity="info" sx={{ mb: 2 }}>
        DEBUG: Utilisateur: {user?.fullName} | Rôle: {user?.role} |
        Evaluations reçues (API): {evaluations.length} |
        En attente (Stats): {stats?.pending}
      </Alert>

      {/* Actions */}
      {user.role === 'rh' && (
        <Box display="flex" gap={2} mb={3}>
          {campaign.status === 'pending' && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleLaunch}
            >
              Lancer la campagne
            </Button>
          )}
          {['active', 'completed'].includes(campaign.status) && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadReport}
            >
              Télécharger le rapport PDF
            </Button>
          )}
          {stats?.decisionMade > 0 && stats?.notified < stats?.total && (
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={handleNotifyAll}
            >
              Notifier tous les employés
            </Button>
          )}
        </Box>
      )}

      {/* Statistiques */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>En attente</Typography>
                <Typography variant="h4" color="text.secondary">{stats.pending}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Évalués</Typography>
                <Typography variant="h4" color="info.main">{stats.evaluated}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Validés</Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.validatedManager + stats.validatedRH}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Notifiés</Typography>
                <Typography variant="h4" color="success.main">{stats.notified}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography gutterBottom>Score moyen</Typography>
                <Typography variant="h4">{stats.averageScore}%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Distribution des résultats */}
      {stats && stats.results && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Distribution des résultats</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="success.main">{stats.results.excellent}</Typography>
                  <Typography color="textSecondary">Excellent (≥80%)</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="warning.main">{stats.results.normal}</Typography>
                  <Typography color="textSecondary">Satisfaisant (40-80%)</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="error.main">{stats.results.failed}</Typography>
                  <Typography color="textSecondary">Insuffisant (&lt;40%)</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Liste des évaluations */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Toutes (${evaluations.length})`} />
          <Tab label={`En attente (${stats?.pending || 0})`} />
          <Tab label={`Évaluées (${stats?.evaluated || 0})`} />
          <Tab label={`Validées Manager (${stats?.validatedManager || 0})`} />
          <Tab label={`Validées RH (${stats?.validatedRH || 0})`} />
          <Tab label={`Décision (${stats?.decisionMade || 0})`} />
          <Tab label={`Notifiées (${stats?.notified || 0})`} />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employé</TableCell>
              <TableCell>Département</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Résultat</TableCell>
              <TableCell>Évaluateur</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvaluations().map((evaluation) => (
              <TableRow key={evaluation._id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="action" />
                    <Typography>{evaluation.employeeId?.fullName || 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{evaluation.employeeId?.department || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={statusConfig[evaluation.status]?.label || evaluation.status}
                    color={statusConfig[evaluation.status]?.color || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {evaluation.score != null ? (
                    <Chip
                      label={`${evaluation.score}/100`}
                      color={getScoreColor(evaluation.score)}
                      size="small"
                    />
                  ) : '-'}
                </TableCell>
                <TableCell align="center">
                  {evaluation.finalResult ? (
                    <Typography
                      color={
                        evaluation.finalResult === 'excellent' ? 'success.main' :
                          evaluation.finalResult === 'normal' ? 'warning.main' : 'error.main'
                      }
                    >
                      {evaluation.finalResult === 'excellent' ? 'Excellent' :
                        evaluation.finalResult === 'normal' ? 'Satisfaisant' : 'Insuffisant'}
                    </Typography>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {evaluation.chefEquipeId?.fullName || '-'}
                </TableCell>
              </TableRow>
            ))}
            {filteredEvaluations().length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary" py={3}>
                    Aucune évaluation dans cette catégorie
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CampaignDetailPage;

