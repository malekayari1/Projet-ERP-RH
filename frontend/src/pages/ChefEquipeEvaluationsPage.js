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
  Slider,
  Grid,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Send as SendIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import * as api from '../services/api';

const criteriaConfig = [
  { key: 'punctuality', label: 'Ponctualité', description: 'Respect des horaires et délais' },
  { key: 'workQuality', label: 'Qualité du travail', description: 'Précision et qualité des livrables' },
  { key: 'initiative', label: 'Initiative', description: 'Proactivité et prise d\'initiative' },
  { key: 'teamwork', label: 'Travail d\'équipe', description: 'Collaboration et esprit d\'équipe' },
  { key: 'communication', label: 'Communication', description: 'Clarté et efficacité de la communication' }
];

const ChefEquipeEvaluationsPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [formData, setFormData] = useState({
    punctuality: 10,
    workQuality: 10,
    initiative: 10,
    teamwork: 10,
    communication: 10,
    commentChefEquipe: '',
    trainingNeeds: '',
    objectives: [{ title: '', description: '', deadline: '' }],
    primeAmount: '',
    otherCriteria: {}
  });

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const { data } = await api.getEvaluationsForChefEquipe();
      console.log('ChefEquipeEvaluationsPage: Fetched evaluations:', data);
      setEvaluations(data);
    } catch (err) {
      setError('Erreur lors du chargement des évaluations');
      console.error('ChefEquipeEvaluationsPage Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setFormData({
      punctuality: evaluation.punctuality || 10,
      workQuality: evaluation.workQuality || 10,
      initiative: evaluation.initiative || 10,
      teamwork: evaluation.teamwork || 10,
      communication: evaluation.communication || 10,
      commentChefEquipe: evaluation.commentChefEquipe || '',
      trainingNeeds: evaluation.trainingNeeds || '',
      objectives: evaluation.objectives && evaluation.objectives.length > 0
        ? evaluation.objectives.map(obj => ({
          title: obj.title,
          description: obj.description,
          deadline: obj.deadline ? new Date(obj.deadline).toISOString().split('T')[0] : ''
        }))
        : [{ title: '', description: '', deadline: '' }],
      primeAmount: '',
      otherCriteria: evaluation.otherCriteria || {}
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvaluation(null);
  };

  const handleSubmit = async () => {
    try {
      await api.submitEvaluation(selectedEvaluation._id, formData);
      setSuccess('Évaluation soumise avec succès');
      handleCloseDialog();
      fetchEvaluations();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    }
  };

  const calculateScore = () => {
    let sum = formData.punctuality + formData.workQuality + formData.initiative +
      formData.teamwork + formData.communication;
    let count = 5;

    // Ajouter les critères personnalisés
    if (formData.otherCriteria) {
      Object.values(formData.otherCriteria).forEach(val => {
        sum += val;
        count++;
      });
    }

    // Si des critères personnalisés sont définis dans la campagne mais pas encore dans formData (cas initial), on doit diviser par le bon nombre
    if (selectedEvaluation?.campaignId?.customCriteria) {
      const missingCount = selectedEvaluation.campaignId.customCriteria.length - (formData.otherCriteria ? Object.keys(formData.otherCriteria).length : 0);
      // Wait, this logic is tricky. 
      // If formData.otherCriteria is empty but campaign has criteria, user hasn't rated them yet. 
      // Current count 5. 
      // If I add missingCount to count, average will be lower if user hasn't rated yet (treated as 0). This is fine for dynamic update.
      // But better: always use total count of criteria.
      count = 5 + (selectedEvaluation.campaignId.customCriteria.length || 0);
    }

    return Math.round((sum / count) * 5); // Score sur 100
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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
        Évaluations à effectuer
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Évaluez les membres de votre équipe selon les critères définis.
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
                En attente d'évaluation
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
              <TableCell>Département</TableCell>
              <TableCell>Campagne</TableCell>
              <TableCell>Période</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluations.map((evaluation) => (
              <TableRow key={evaluation._id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="action" />
                    <Typography>{evaluation.employeeId?.fullName || 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{evaluation.employeeId?.department || 'N/A'}</TableCell>
                <TableCell>{evaluation.campaignId?.title || 'N/A'}</TableCell>
                <TableCell>
                  {evaluation.campaignId && (
                    <>
                      {formatDate(evaluation.campaignId.startDate)} - {formatDate(evaluation.campaignId.endDate)}
                    </>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip label="En attente" color="warning" size="small" />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Évaluer">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(evaluation)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {evaluations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary" py={3}>
                    Aucune évaluation en attente
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog d'évaluation */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Évaluer {selectedEvaluation?.employeeId?.fullName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Aperçu du score */}
            <Card sx={{ mb: 3, bgcolor: 'grey.100' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Score calculé</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h3" color={`${getScoreColor(calculateScore())}.main`}>
                    {calculateScore()}/100
                  </Typography>
                  <Box flex={1}>
                    <LinearProgress
                      variant="determinate"
                      value={calculateScore()}
                      color={getScoreColor(calculateScore())}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {calculateScore() >= 80 ? 'Excellent' : calculateScore() >= 40 ? 'Satisfaisant' : 'Insuffisant'}
                </Typography>
                {calculateScore() >= 80 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Excellent score ! Une prime sera créée pour cet employé. Veuillez saisir le montant ci-dessous.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Critères d'évaluation */}
            <Typography variant="h6" gutterBottom>Critères d'évaluation (sur 20)</Typography>

            {criteriaConfig.map((criteria) => {
              const selfKey = `self${criteria.key.charAt(0).toUpperCase() + criteria.key.slice(1)}`;
              const selfScore = selectedEvaluation?.[selfKey];

              return (
                <Box key={criteria.key} sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography gutterBottom>
                      {criteria.label}: <strong>{formData[criteria.key]}/20</strong>
                    </Typography>
                    {selfScore !== undefined && (
                      <Chip
                        label={`Auto-éval: ${selfScore}/20`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {criteria.description}
                  </Typography>
                  <Slider
                    value={formData[criteria.key]}
                    onChange={(e, value) => setFormData({ ...formData, [criteria.key]: value })}
                    min={0}
                    max={20}
                    step={1}
                    valueLabelDisplay="auto"
                  />
                </Box>
              );
            })}

            {/* Critères personnalisés */}
            {selectedEvaluation?.campaignId?.customCriteria && selectedEvaluation.campaignId.customCriteria.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>Critères spécifiques à la campagne</Typography>
                {selectedEvaluation.campaignId.customCriteria.map((criterion, index) => (
                  <Box key={`custom-${index}`} sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      {criterion.name}: <strong>{formData.otherCriteria?.[criterion.name] || 0}/20</strong>
                    </Typography>
                    <Slider
                      value={formData.otherCriteria?.[criterion.name] || 0}
                      onChange={(e, value) => {
                        const newOtherCriteria = { ...formData.otherCriteria };
                        newOtherCriteria[criterion.name] = value;
                        setFormData({ ...formData, otherCriteria: newOtherCriteria });
                      }}
                      min={0}
                      max={20}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                ))}
              </>
            )}

            {/* Prime Input - Only visible if score >= 80 */}
            {calculateScore() >= 80 && (
              <Box sx={{ mb: 3, p: 2, border: '1px dashed #4caf50', borderRadius: 1, bgcolor: '#e8f5e9' }}>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Prime de performance
                </Typography>
                <TextField
                  label="Montant de la prime (DT)"
                  type="number"
                  value={formData.primeAmount}
                  onChange={(e) => setFormData({ ...formData, primeAmount: Number(e.target.value) })}
                  fullWidth
                  required
                  helperText="Requis car le score est supérieur ou égal à 80"
                />
              </Box>
            )}

            {/* Commentaire */}
            <TextField
              label="Observations générales"
              value={formData.commentChefEquipe}
              onChange={(e) => setFormData({ ...formData, commentChefEquipe: e.target.value })}
              multiline
              rows={3}
              fullWidth
              sx={{ mb: 3 }}
            />

            {/* Plan d'action */}
            <Typography variant="h6" gutterBottom>Plan d'action & Objectifs</Typography>

            <TextField
              label="Besoins en formation"
              value={formData.trainingNeeds}
              onChange={(e) => setFormData({ ...formData, trainingNeeds: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ mb: 3 }}
              placeholder="Quelles formations aideraient cet employé ?"
            />

            <Typography variant="subtitle2" gutterBottom>Objectifs SMART pour la période suivante</Typography>
            {formData.objectives.map((obj, idx) => (
              <Box key={idx} sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="Titre de l'objectif"
                      fullWidth
                      size="small"
                      value={obj.title}
                      onChange={(e) => {
                        const newObjs = [...formData.objectives];
                        newObjs[idx].title = e.target.value;
                        setFormData({ ...formData, objectives: newObjs });
                      }}
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Échéance"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={obj.deadline}
                      onChange={(e) => {
                        const newObjs = [...formData.objectives];
                        newObjs[idx].deadline = e.target.value;
                        setFormData({ ...formData, objectives: newObjs });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description / Indicateurs de succès"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={obj.description}
                      onChange={(e) => {
                        const newObjs = [...formData.objectives];
                        newObjs[idx].description = e.target.value;
                        setFormData({ ...formData, objectives: newObjs });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const newObjs = formData.objectives.filter((_, i) => i !== idx);
                        setFormData({ ...formData, objectives: newObjs });
                      }}
                      disabled={formData.objectives.length === 1}
                    >
                      Supprimer
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button
              variant="outlined"
              size="small"
              onClick={() => setFormData({
                ...formData,
                objectives: [...formData.objectives, { title: '', description: '', deadline: '' }]
              })}
            >
              + Ajouter un objectif
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={calculateScore() >= 80 && !formData.primeAmount}
          >
            Soumettre l'évaluation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChefEquipeEvaluationsPage;

