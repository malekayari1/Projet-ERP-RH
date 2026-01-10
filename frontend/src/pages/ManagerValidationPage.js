import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import * as api from '../services/api';

const criteriaLabels = {
  punctuality: 'Ponctualité',
  workQuality: 'Qualité du travail',
  initiative: 'Initiative',
  teamwork: 'Travail d\'équipe',
  communication: 'Communication'
};

const ManagerValidationPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const { data } = await api.getEvaluationsForManager();
      setEvaluations(data);
    } catch (err) {
      setError('Erreur lors du chargement des évaluations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setComment('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvaluation(null);
    setComment('');
  };

  const handleValidate = async (approved) => {
    try {
      await api.validateByManager(selectedEvaluation._id, {
        commentManager: comment,
        approved
      });
      setSuccess(approved ? 'Évaluation validée avec succès' : 'Évaluation renvoyée pour révision');
      handleCloseDialog();
      fetchEvaluations();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getResultLabel = (result) => {
    switch (result) {
      case 'excellent': return 'Excellent';
      case 'normal': return 'Satisfaisant';
      case 'failed': return 'Insuffisant';
      default: return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Validations des évaluations
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Validez ou renvoyez les évaluations soumises par les chefs d'équipe.
      </Typography>

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

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En attente de validation
              </Typography>
              <Typography variant="h4" color="warning.main">
                {evaluations.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employé</TableCell>
              <TableCell>Chef d'équipe</TableCell>
              <TableCell>Campagne</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Résultat</TableCell>
              <TableCell>Date évaluation</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluations.map((evaluation) => (
              <TableRow key={evaluation._id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography>{evaluation.employeeId?.fullName || 'N/A'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {evaluation.employeeId?.department || ''}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{evaluation.chefEquipeId?.fullName || 'N/A'}</TableCell>
                <TableCell>{evaluation.campaignId?.title || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${evaluation.score}/100`}
                    color={getScoreColor(evaluation.score)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={getResultLabel(evaluation.finalResult)}
                    color={getScoreColor(evaluation.score)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {evaluation.evaluatedAt && formatDate(evaluation.evaluatedAt)}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Voir et valider">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(evaluation)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {evaluations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" py={3}>
                    Aucune évaluation en attente de validation
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de validation */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Validation de l'évaluation - {selectedEvaluation?.employeeId?.fullName}
        </DialogTitle>
        <DialogContent>
          {selectedEvaluation && (
            <Box sx={{ mt: 2 }}>
              {/* Score global */}
              <Card sx={{ mb: 3, bgcolor: 'grey.100' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Score global</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h3" color={`${getScoreColor(selectedEvaluation.score)}.main`}>
                      {selectedEvaluation.score}/100
                    </Typography>
                    <Box flex={1}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedEvaluation.score}
                        color={getScoreColor(selectedEvaluation.score)}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Chip
                      label={getResultLabel(selectedEvaluation.finalResult)}
                      color={getScoreColor(selectedEvaluation.score)}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Détails des critères avec comparaison */}
              <Typography variant="h6" gutterBottom>Comparaison des performances (Auto vs Chef)</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(criteriaLabels).map(([key, label]) => {
                  const selfKey = `self${key.charAt(0).toUpperCase() + key.slice(1)}`;
                  const chefScore = selectedEvaluation[key];
                  const selfScore = selectedEvaluation[selfKey];

                  return (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1 }}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>{label}</Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="h5" sx={{ mb: 0.5 }}>{chefScore}/20</Typography>
                              {selfScore !== undefined && (
                                <Typography variant="caption" color="primary">Auto: {selfScore}/20</Typography>
                              )}
                            </Box>
                            <Box sx={{ width: 60, height: 4, bgcolor: 'grey.200', borderRadius: 2, position: 'relative' }}>
                              <Box sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${(chefScore / 20) * 100}%`,
                                bgcolor: getScoreColor(chefScore * 5),
                                borderRadius: 2
                              }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Auto-commentaire de l'employé */}
              {selectedEvaluation.selfComment && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Réflexion de l'employé:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography fontStyle="italic">"{selectedEvaluation.selfComment}"</Typography>
                  </Paper>
                </Box>
              )}

              {/* Commentaire du chef d'équipe */}
              {selectedEvaluation.commentChefEquipe && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Avis du chef d'équipe</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>{selectedEvaluation.commentChefEquipe}</Typography>
                  </Paper>
                </Box>
              )}

              {/* Plan d'action et Objectifs */}
              {((selectedEvaluation.objectives && selectedEvaluation.objectives.length > 0) || selectedEvaluation.trainingNeeds) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Plan de développement proposé</Typography>
                  <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
                    <CardContent>
                      {selectedEvaluation.trainingNeeds && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="success.main">Formations recommandées :</Typography>
                          <Typography variant="body2">{selectedEvaluation.trainingNeeds}</Typography>
                        </Box>
                      )}
                      {selectedEvaluation.objectives && selectedEvaluation.objectives.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="success.main">Objectifs fixés :</Typography>
                          {selectedEvaluation.objectives.map((obj, i) => (
                            <Typography key={i} variant="body2" sx={{ ml: 1 }}>• {obj.title} ({obj.deadline ? formatDate(obj.deadline) : 'Pas d\'échéance'})</Typography>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Commentaire du manager */}
              <TextField
                label="Votre commentaire"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Ajoutez un commentaire (obligatoire en cas de rejet)..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={() => handleValidate(false)}
            color="error"
            startIcon={<CancelIcon />}
            disabled={!comment}
          >
            Renvoyer pour révision
          </Button>
          <Button
            onClick={() => handleValidate(true)}
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
          >
            Valider
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerValidationPage;

