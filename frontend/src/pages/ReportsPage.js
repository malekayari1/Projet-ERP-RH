import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import * as api from '../services/api';

const ReportsPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(campaignId || '');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchReportData(selectedCampaign);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.getCampaigns();
      setCampaigns(data.filter(c => c.status !== 'pending'));
    } catch (err) {
      console.error('Erreur lors du chargement des campagnes:', err);
    }
  };

  const fetchReportData = async (id) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.getCampaignReportData(id);
      setReportData(data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.getCampaignReportPDF(selectedCampaign);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const campaign = campaigns.find(c => c._id === selectedCampaign);
      link.setAttribute('download', `rapport_${campaign?.title?.replace(/\s+/g, '_') || 'evaluation'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Erreur lors du téléchargement du rapport PDF');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Rapports</Typography>
        {selectedCampaign && reportData && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Télécharger PDF
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Sélection de campagne */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          select
          label="Sélectionner une campagne"
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Choisir une campagne...</MenuItem>
          {campaigns.map((campaign) => (
            <MenuItem key={campaign._id} value={campaign._id}>
              {campaign.title} - {campaign.status === 'completed' ? 'Terminée' : 'En cours'}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {reportData && !loading && (
        <>
          {/* Statistiques globales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total évaluations
                  </Typography>
                  <Typography variant="h3">{reportData.stats.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Score moyen
                  </Typography>
                  <Typography variant="h3" color={`${getScoreColor(reportData.stats.averageScore)}.main`}>
                    {reportData.stats.averageScore}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography color="success.contrastText" gutterBottom>
                    Excellents
                  </Typography>
                  <Typography variant="h3" color="success.contrastText">
                    {reportData.stats.byResult?.excellent || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Typography color="error.contrastText" gutterBottom>
                    Insuffisants
                  </Typography>
                  <Typography variant="h3" color="error.contrastText">
                    {reportData.stats.byResult?.failed || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Distribution des scores */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribution des scores
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(reportData.stats.scoreDistribution || {}).map(([range, count]) => (
                  <Grid item xs={12} sm={6} md={2.4} key={range}>
                    <Box textAlign="center">
                      <Typography variant="h4">{count}</Typography>
                      <Typography color="textSecondary">{range}%</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Statistiques par département */}
          {reportData.stats.byDepartment && Object.keys(reportData.stats.byDepartment).length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Par département
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Département</TableCell>
                        <TableCell align="center">Évaluations</TableCell>
                        <TableCell align="center">Score moyen</TableCell>
                        <TableCell align="center">Excellents</TableCell>
                        <TableCell align="center">Satisfaisants</TableCell>
                        <TableCell align="center">Insuffisants</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(reportData.stats.byDepartment).map(([dept, data]) => (
                        <TableRow key={dept}>
                          <TableCell>{dept}</TableCell>
                          <TableCell align="center">{data.count}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${data.avgScore}%`}
                              color={getScoreColor(data.avgScore)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography color="success.main">{data.excellent || 0}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography color="warning.main">{data.normal || 0}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography color="error.main">{data.failed || 0}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Liste des évaluations */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Détail des évaluations
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employé</TableCell>
                      <TableCell>Département</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell align="center">Résultat</TableCell>
                      <TableCell align="center">Décision</TableCell>
                      <TableCell align="center">Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.evaluations?.map((evaluation) => (
                      <TableRow key={evaluation._id}>
                        <TableCell>{evaluation.employeeId?.fullName || 'N/A'}</TableCell>
                        <TableCell>{evaluation.employeeId?.department || 'N/A'}</TableCell>
                        <TableCell align="center">
                          {evaluation.score != null ? (
                            <Chip
                              label={`${evaluation.score}%`}
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
                        <TableCell align="center">
                          {evaluation.hrDecision && evaluation.hrDecision !== 'aucune' ? (
                            <Chip
                              label={
                                evaluation.hrDecision === 'prime' ? 'Prime' :
                                evaluation.hrDecision === 'formation' ? 'Formation' : 'Sanction'
                              }
                              color={
                                evaluation.hrDecision === 'prime' ? 'success' :
                                evaluation.hrDecision === 'formation' ? 'info' : 'error'
                              }
                              size="small"
                              variant="outlined"
                            />
                          ) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              evaluation.status === 'notified' ? 'Notifié' :
                              evaluation.status === 'decision_made' ? 'Décision prise' :
                              evaluation.status === 'validated_rh' ? 'Validé RH' :
                              evaluation.status === 'validated_manager' ? 'Validé Manager' :
                              evaluation.status === 'evaluated' ? 'Évalué' : 'En attente'
                            }
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedCampaign && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Sélectionnez une campagne pour afficher le rapport
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReportsPage;

