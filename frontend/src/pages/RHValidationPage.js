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
  MenuItem,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  Notifications as NotificationsIcon,
  Send as SendIcon
} from '@mui/icons-material';
import * as api from '../services/api';

const criteriaLabels = {
  punctuality: 'Ponctualité',
  workQuality: 'Qualité du travail',
  initiative: 'Initiative',
  teamwork: 'Travail d\'équipe',
  communication: 'Communication'
};

const statusConfig = {
  validated_manager: { label: 'À approuver', color: 'warning' },
  validated_rh: { label: 'À décider', color: 'info' },
  decision_made: { label: 'À notifier', color: 'secondary' }
};

const decisionOptions = [
  { value: 'prime', label: 'Prime', color: 'success' },
  { value: 'formation', label: 'Formation', color: 'info' },
  { value: 'sanction', label: 'Sanction', color: 'error' },
  { value: 'aucune', label: 'Aucune action', color: 'default' }
];

const RHValidationPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('validate'); // validate, decision, notify
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState('aucune');
  const [decisionDetails, setDecisionDetails] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, [tabValue]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const statusMap = ['validated_manager', 'validated_rh', 'decision_made'];
      const { data } = await api.getEvaluationsForRH({ status: statusMap[tabValue] });
      setEvaluations(data);
    } catch (err) {
      setError('Erreur lors du chargement des évaluations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (evaluation, mode) => {
    setSelectedEvaluation(evaluation);
    setDialogMode(mode);
    setComment('');
    setDecision(evaluation.hrDecision || 'aucune');
    setDecisionDetails(evaluation.hrDecisionDetails || '');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvaluation(null);
  };

  const handleValidate = async (approved) => {
    try {
      await api.validateByRH(selectedEvaluation._id, {
        commentRH: comment,
        approved
      });
      setSuccess(approved ? 'Évaluation approuvée avec succès' : 'Évaluation renvoyée au manager');
      handleCloseDialog();
      fetchEvaluations();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleDecision = async () => {
    try {
      await api.makeDecision(selectedEvaluation._id, {
        hrDecision: decision,
        hrDecisionDetails: decisionDetails
      });
      setSuccess('Décision enregistrée avec succès');
      handleCloseDialog();
      fetchEvaluations();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement de la décision');
    }
  };

  const handleNotify = async () => {
    try {
      await api.notifyEmployee(selectedEvaluation._id);
      setSuccess('Employé notifié avec succès');
      handleCloseDialog();
      fetchEvaluations();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la notification');
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTabCounts = () => {
    // Ces compteurs seraient idéalement récupérés de l'API
    return [
      evaluations.filter(e => e.status === 'validated_manager').length,
      evaluations.filter(e => e.status === 'validated_rh').length,
      evaluations.filter(e => e.status === 'decision_made').length
    ];
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
        Gestion des évaluations RH
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Approuvez les évaluations, prenez des décisions et notifiez les employés.
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

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={
            <Badge badgeContent={evaluations.length} color="warning">
              <Box sx={{ pr: 2 }}>À approuver</Box>
            </Badge>
          } />
          <Tab label="À décider" />
          <Tab label="À notifier" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employé</TableCell>
              <TableCell>Département</TableCell>
              <TableCell>Campagne</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Résultat</TableCell>
              {tabValue >= 1 && <TableCell align="center">Décision</TableCell>}
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
                        {evaluation.employeeId?.email || ''}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{evaluation.employeeId?.department || 'N/A'}</TableCell>
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
                {tabValue >= 1 && (
                  <TableCell align="center">
                    {evaluation.hrDecision && (
                      <Chip
                        label={decisionOptions.find(d => d.value === evaluation.hrDecision)?.label}
                        color={decisionOptions.find(d => d.value === evaluation.hrDecision)?.color}
                        size="small"
                      />
                    )}
                  </TableCell>
                )}
                <TableCell align="right">
                  {tabValue === 0 && (
                    <Tooltip title="Approuver">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(evaluation, 'validate')}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {tabValue === 1 && (
                    <Tooltip title="Prendre une décision">
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenDialog(evaluation, 'decision')}
                      >
                        <GavelIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {tabValue === 2 && (
                    <Tooltip title="Notifier l'employé">
                      <IconButton
                        color="success"
                        onClick={() => handleOpenDialog(evaluation, 'notify')}
                      >
                        <NotificationsIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {evaluations.length === 0 && (
              <TableRow>
                <TableCell colSpan={tabValue >= 1 ? 7 : 6} align="center">
                  <Typography color="textSecondary" py={3}>
                    Aucune évaluation dans cette catégorie
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'validate' && 'Approbation de l\'évaluation'}
          {dialogMode === 'decision' && 'Décision finale'}
          {dialogMode === 'notify' && 'Notification à l\'employé'}
          {' - '}{selectedEvaluation?.employeeId?.fullName}
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
                                bgcolor: getScoreColor(chefScore * 5), // approximate color
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

              {/* Commentaires */}
              {selectedEvaluation.commentChefEquipe && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Commentaire du chef d'équipe:</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>{selectedEvaluation.commentChefEquipe}</Typography>
                  </Paper>
                </Box>
              )}

              {selectedEvaluation.commentManager && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Commentaire du manager:</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>{selectedEvaluation.commentManager}</Typography>
                  </Paper>
                </Box>
              )}

              {/* Plan d'action et Objectifs */}
              {((selectedEvaluation.objectives && selectedEvaluation.objectives.length > 0) || selectedEvaluation.trainingNeeds) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Plan d'action & Formation</Typography>
                  <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
                    <CardContent>
                      {selectedEvaluation.trainingNeeds && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="success.main">Besoins en formation :</Typography>
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

              {/* Formulaire selon le mode */}
              {dialogMode === 'validate' && (
                <TextField
                  label="Votre commentaire RH"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Ajoutez un commentaire (obligatoire en cas de rejet)..."
                />
              )}

              {dialogMode === 'decision' && (
                <Box>
                  <TextField
                    select
                    label="Décision"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {decisionOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Détails de la décision"
                    value={decisionDetails}
                    onChange={(e) => setDecisionDetails(e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Précisez les détails de la décision (montant de la prime, type de formation, etc.)..."
                  />
                </Box>
              )}

              {dialogMode === 'notify' && (
                <Alert severity="info">
                  <Typography>
                    L'employé sera notifié de son résultat d'évaluation avec les informations suivantes:
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography><strong>Score:</strong> {selectedEvaluation.score}/100</Typography>
                    <Typography><strong>Résultat:</strong> {getResultLabel(selectedEvaluation.finalResult)}</Typography>
                    <Typography>
                      <strong>Décision:</strong> {decisionOptions.find(d => d.value === selectedEvaluation.hrDecision)?.label}
                    </Typography>
                    {selectedEvaluation.hrDecisionDetails && (
                      <Typography><strong>Détails:</strong> {selectedEvaluation.hrDecisionDetails}</Typography>
                    )}
                  </Box>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>

          {dialogMode === 'validate' && (
            <>
              <Button
                onClick={() => handleValidate(false)}
                color="error"
                startIcon={<CancelIcon />}
                disabled={!comment}
              >
                Renvoyer au manager
              </Button>
              <Button
                onClick={() => handleValidate(true)}
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
              >
                Approuver
              </Button>
            </>
          )}

          {dialogMode === 'decision' && (
            <Button
              onClick={handleDecision}
              variant="contained"
              color="primary"
              startIcon={<GavelIcon />}
            >
              Enregistrer la décision
            </Button>
          )}

          {dialogMode === 'notify' && (
            <Button
              onClick={handleNotify}
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
            >
              Notifier l'employé
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RHValidationPage;

