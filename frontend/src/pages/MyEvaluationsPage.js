import React, { useState, useEffect } from 'react';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Slider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  School as SchoolIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
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

const decisionConfig = {
  prime: { label: 'Prime accordée', icon: <MoneyIcon />, color: 'success' },
  formation: { label: 'Formation recommandée', icon: <SchoolIcon />, color: 'info' },
  sanction: { label: 'Sanction', icon: <WarningIcon />, color: 'error' },
  aucune: { label: 'Aucune action spécifique', icon: <CheckCircleIcon />, color: 'default' }
};

const MyEvaluationsPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selfEvalDialogOpen, setSelfEvalDialogOpen] = useState(false);
  const [selfEvalData, setSelfEvalData] = useState({
    selfPunctuality: 0,
    selfWorkQuality: 0,
    selfInitiative: 0,
    selfTeamwork: 0,
    selfCommunication: 0,
    selfComment: ''
  });
  const [acknowledgeComment, setAcknowledgeComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const { data } = await api.getMyEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError('Erreur lors du chargement de vos évaluations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getResultConfig = (result) => {
    switch (result) {
      case 'excellent':
        return { label: 'Excellent', icon: <TrophyIcon />, color: 'success', message: 'Félicitations ! Votre performance est excellente.' };
      case 'normal':
        return { label: 'Satisfaisant', icon: <TrendingUpIcon />, color: 'info', message: 'Bonne performance. Continuez vos efforts.' };
      case 'failed':
        return { label: 'À améliorer', icon: <TrendingDownIcon />, color: 'error', message: 'Des améliorations sont nécessaires.' };
      default:
        return { label: 'N/A', icon: <InfoIcon />, color: 'default', message: '' };
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

  const handleOpenDialog = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvaluation(null);
  };

  const handleOpenSelfEval = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setSelfEvalData({
      selfPunctuality: evaluation.selfPunctuality || 0,
      selfWorkQuality: evaluation.selfWorkQuality || 0,
      selfInitiative: evaluation.selfInitiative || 0,
      selfTeamwork: evaluation.selfTeamwork || 0,
      selfCommunication: evaluation.selfCommunication || 0,
      selfComment: evaluation.selfComment || ''
    });
    setSelfEvalDialogOpen(true);
  };

  const handleSubmitSelfEval = async () => {
    try {
      setSubmitting(true);
      await api.selfEvaluate(selectedEvaluation._id, selfEvalData);
      setSelfEvalDialogOpen(false);
      fetchEvaluations();
    } catch (err) {
      setError('Erreur lors de la soumission de l\'auto-évaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      setSubmitting(true);
      await api.acknowledgeEvaluation(selectedEvaluation._id, {
        employeeFinalComment: acknowledgeComment
      });
      setDialogOpen(false);
      fetchEvaluations();
    } catch (err) {
      setError('Erreur lors de la signature de l\'évaluation');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculer les statistiques globales
  const calculateStats = () => {
    if (evaluations.length === 0) return { avg: 0, best: 0, latest: null };
    const scores = evaluations.map(e => e.score).filter(s => s != null);
    return {
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
      count: evaluations.length,
      latest: evaluations[0]
    };
  };

  const stats = calculateStats();

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
        Mes Évaluations
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Consultez vos résultats d'évaluation et votre progression.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {evaluations.length === 0 ? (
        <Alert severity="info">
          Vous n'avez pas encore d'évaluations. Elles apparaîtront ici une fois que votre chef d'équipe aura soumis son évaluation.
        </Alert>
      ) : (
        <>
          {/* Statistiques globales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="overline">Score moyen</Typography>
                  <Typography variant="h3">{stats.avg}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="overline">Meilleur score</Typography>
                  <Typography variant="h3">{stats.best}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="textSecondary">Évaluations</Typography>
                  <Typography variant="h3">{stats.count}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="textSecondary">Dernière évaluation</Typography>
                  <Typography variant="h6">{formatDate(stats.latest?.notifiedAt || stats.latest?.evaluatedAt)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Liste des évaluations */}
          <Typography variant="h6" gutterBottom>Historique des évaluations</Typography>
          <Grid container spacing={3}>
            {evaluations.map((evaluation) => {
              const resultConfig = getResultConfig(evaluation.finalResult);
              const decisionInfo = decisionConfig[evaluation.hrDecision] || decisionConfig.aucune;

              return (
                <Grid item xs={12} md={6} key={evaluation._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handleOpenDialog(evaluation)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6">{evaluation.campaignId?.title}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(evaluation.notifiedAt || evaluation.evaluatedAt)}
                          </Typography>
                        </Box>
                        <Chip
                          icon={evaluation.status === 'acknowledged' ? <CheckCircleIcon /> : resultConfig.icon}
                          label={
                            evaluation.status === 'acknowledged' ? 'Signée' :
                              evaluation.status === 'notified' ? resultConfig.label :
                                'En cours'
                          }
                          color={
                            evaluation.status === 'acknowledged' ? 'success' :
                              evaluation.status === 'notified' ? resultConfig.color :
                                'warning'
                          }
                        />
                      </Box>

                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Typography variant="h2" color={`${getScoreColor(evaluation.score)}.main`}>
                          {evaluation.score}
                        </Typography>
                        <Box flex={1}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Score sur 100
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={evaluation.score}
                            color={getScoreColor(evaluation.score)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: `${decisionInfo.color}.main` }}>
                          {decisionInfo.icon}
                        </Box>
                        <Typography variant="body2">
                          <strong>Décision:</strong> {evaluation.status === 'notified' ? decisionInfo.label : 'Attente validation finale'}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="primary" sx={{ mt: 2, textAlign: 'right' }}>
                        Cliquer pour voir les détails →
                      </Typography>

                      {['pending', 'self_evaluating'].includes(evaluation.status) && (
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSelfEval(evaluation);
                          }}
                        >
                          Faire mon auto-évaluation
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Dialog de détails */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedEvaluation && (
          <>
            <DialogTitle>
              Détails de l'évaluation - {selectedEvaluation.campaignId?.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                {/* Message de résultat */}
                <Alert
                  severity={getResultConfig(selectedEvaluation.finalResult).color}
                  icon={getResultConfig(selectedEvaluation.finalResult).icon}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="subtitle1">
                    {getResultConfig(selectedEvaluation.finalResult).message}
                  </Typography>
                </Alert>

                {/* Score global */}
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Score global</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h2" color={`${getScoreColor(selectedEvaluation.score)}.main`}>
                        {selectedEvaluation.score}/100
                      </Typography>
                      <Box flex={1}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedEvaluation.score}
                          color={getScoreColor(selectedEvaluation.score)}
                          sx={{ height: 12, borderRadius: 6 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Détails des critères avec comparaison */}
                <Typography variant="h6" gutterBottom>Comparaison des performances</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {Object.entries(criteriaLabels).map(([key, label]) => {
                    const selfKey = `self${key.charAt(0).toUpperCase() + key.slice(1)}`;
                    const chefScore = selectedEvaluation[key];
                    const selfScore = selectedEvaluation[selfKey];

                    return (
                      <Grid item xs={12} key={key}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2">{label}</Typography>
                              <Box display="flex" gap={2}>
                                {selfScore !== undefined && (
                                  <Chip label={`Auto: ${selfScore}/20`} size="small" variant="outlined" />
                                )}
                                <Chip
                                  label={`Chef: ${chefScore}/20`}
                                  size="small"
                                  color={chefScore >= 16 ? 'success' : chefScore >= 8 ? 'warning' : 'error'}
                                />
                              </Box>
                            </Box>
                            <Box sx={{ position: 'relative', height: 8, bgcolor: 'grey.200', borderRadius: 4 }}>
                              {selfScore !== undefined && (
                                <Box sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  height: '100%',
                                  width: `${(selfScore / 20) * 100}%`,
                                  bgcolor: 'primary.light',
                                  opacity: 0.5,
                                  borderRadius: 4,
                                  zIndex: 1
                                }} />
                              )}
                              <Box sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${(chefScore / 20) * 100}%`,
                                bgcolor: chefScore >= 16 ? 'success.main' : chefScore >= 8 ? 'warning.main' : 'error.main',
                                borderRadius: 4,
                                zIndex: 2
                              }} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Objectifs et Plan d'action */}
                {((selectedEvaluation.objectives && selectedEvaluation.objectives.length > 0) || selectedEvaluation.trainingNeeds) && (
                  <>
                    <Typography variant="h6" gutterBottom>Plan de Développement & Objectifs</Typography>
                    <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.50' }}>
                      <CardContent>
                        {selectedEvaluation.objectives && selectedEvaluation.objectives.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary">Objectifs fixés :</Typography>
                            <List dense>
                              {selectedEvaluation.objectives.map((obj, idx) => (
                                <ListItem key={idx}>
                                  <ListItemIcon><TrendingUpIcon color="primary" fontSize="small" /></ListItemIcon>
                                  <ListItemText
                                    primary={obj.title}
                                    secondary={`${obj.description}${obj.deadline ? ` - Échéance: ${formatDate(obj.deadline)}` : ''}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                        {selectedEvaluation.trainingNeeds && (
                          <Box>
                            <Typography variant="subtitle2" color="primary">Besoins en formation :</Typography>
                            <Typography variant="body2">{selectedEvaluation.trainingNeeds}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Décision RH */}
                <Typography variant="h6" gutterBottom>Décision</Typography>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{
                        color: `${decisionConfig[selectedEvaluation.hrDecision]?.color || 'default'}.main`,
                        fontSize: 40
                      }}>
                        {decisionConfig[selectedEvaluation.hrDecision]?.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6">
                          {decisionConfig[selectedEvaluation.hrDecision]?.label}
                        </Typography>
                        {selectedEvaluation.hrDecisionDetails && (
                          <Typography color="textSecondary">
                            {selectedEvaluation.hrDecisionDetails}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Commentaires */}
                {(selectedEvaluation.commentChefEquipe || selectedEvaluation.commentManager || selectedEvaluation.commentRH) && (
                  <>
                    <Typography variant="h6" gutterBottom>Commentaires</Typography>
                    <List>
                      {selectedEvaluation.commentChefEquipe && (
                        <ListItem>
                          <ListItemIcon><PersonIcon /></ListItemIcon>
                          <ListItemText
                            primary="Chef d'équipe"
                            secondary={selectedEvaluation.commentChefEquipe}
                          />
                        </ListItem>
                      )}
                      {selectedEvaluation.commentManager && (
                        <ListItem>
                          <ListItemIcon><PersonIcon /></ListItemIcon>
                          <ListItemText
                            primary="Manager"
                            secondary={selectedEvaluation.commentManager}
                          />
                        </ListItem>
                      )}
                      {selectedEvaluation.commentRH && (
                        <ListItem>
                          <ListItemIcon><PersonIcon /></ListItemIcon>
                          <ListItemText
                            primary="Ressources Humaines"
                            secondary={selectedEvaluation.commentRH}
                          />
                        </ListItem>
                      )}
                    </List>
                  </>
                )}

                {/* Signature de l'employé */}
                {selectedEvaluation.employeeAcknowledged && (
                  <>
                    <Typography variant="h6" gutterBottom>Signature & Accord</Typography>
                    <Card variant="outlined" sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CheckCircleIcon color="success" />
                          <Typography variant="subtitle1" color="success.main">Évaluation signée par l'employé</Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          Reconnu le: {formatDate(selectedEvaluation.employeeAcknowledgedAt)}
                        </Typography>
                        {selectedEvaluation.employeeFinalComment && (
                          <Box sx={{ mt: 1, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px dashed #4caf50' }}>
                            <Typography variant="subtitle2" gutterBottom>Votre commentaire final :</Typography>
                            <Typography variant="body2">{selectedEvaluation.employeeFinalComment}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Informations sur les évaluateurs */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Évalué par: {selectedEvaluation.chefEquipeId?.fullName || 'N/A'}
                  {selectedEvaluation.managerId && ` • Validé par: ${selectedEvaluation.managerId.fullName}`}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              {selectedEvaluation.status === 'notified' && (
                <Box sx={{ p: 2, width: '100%' }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Signature & Commentaire final</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Votre commentaire final ou observations..."
                    value={acknowledgeComment}
                    onChange={(e) => setAcknowledgeComment(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleAcknowledge}
                    disabled={submitting}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Signer et Clôturer'}
                  </Button>
                </Box>
              )}
              <Button onClick={handleCloseDialog}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog d'auto-évaluation */}
      <Dialog open={selfEvalDialogOpen} onClose={() => setSelfEvalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Auto-évaluation</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Notez-vous sur une échelle de 0 à 20 pour chaque critère.
            </Typography>

            {Object.entries(criteriaLabels).map(([key, label]) => (
              <Box key={key}>
                <Typography gutterBottom>{label}</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs>
                    <Slider
                      value={selfEvalData[`self${key.charAt(0).toUpperCase() + key.slice(1)}`]}
                      onChange={(e, val) => setSelfEvalData({
                        ...selfEvalData,
                        [`self${key.charAt(0).toUpperCase() + key.slice(1)}`]: val
                      })}
                      min={0}
                      max={20}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant="h6" sx={{ width: 40, textAlign: 'right' }}>
                      {selfEvalData[`self${key.charAt(0).toUpperCase() + key.slice(1)}`]}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <TextField
              label="Commentaires / Auto-réflexion"
              fullWidth
              multiline
              rows={4}
              value={selfEvalData.selfComment}
              onChange={(e) => setSelfEvalData({ ...selfEvalData, selfComment: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelfEvalDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleSubmitSelfEval}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Enregistrer mon auto-évaluation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyEvaluationsPage;

