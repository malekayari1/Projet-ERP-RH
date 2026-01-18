import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const statusConfig = {
  pending: { label: 'En attente', color: 'default' },
  active: { label: 'Active', color: 'primary' },
  evaluation: { label: 'Évaluation', color: 'info' },
  validation_manager: { label: 'Validation Manager', color: 'warning' },
  validation_rh: { label: 'Validation RH', color: 'secondary' },
  completed: { label: 'Terminée', color: 'success' },
  cancelled: { label: 'Annulée', color: 'error' }
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    department: '',
    customCriteria: []
  });

  useEffect(() => {
    fetchCampaigns();
    fetchDepartments();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data } = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError('Erreur lors du chargement des campagnes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Erreur lors du chargement des départements:', err);
    }
  };

  const handleOpenDialog = (campaign = null) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        title: campaign.title,
        description: campaign.description || '',
        startDate: campaign.startDate?.split('T')[0] || '',
        endDate: campaign.endDate?.split('T')[0] || '',
        department: campaign.department || '',
        customCriteria: campaign.customCriteria || []
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        department: '',
        customCriteria: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCampaign(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      department: '',
      customCriteria: []
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingCampaign) {
        await api.updateCampaign(editingCampaign._id, formData);
      } else {
        await api.createCampaign(formData);
      }
      handleCloseDialog();
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleLaunch = async (campaignId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir lancer cette campagne?')) return;
    try {
      await api.launchCampaign(campaignId);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du lancement');
    }
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette campagne?')) return;
    try {
      await api.deleteCampaign(campaignId);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Campagnes d'évaluation</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle campagne
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistiques rapides */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total</Typography>
              <Typography variant="h4">{campaigns.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Actives</Typography>
              <Typography variant="h4" color="primary">
                {campaigns.filter(c => ['active', 'evaluation', 'validation_manager', 'validation_rh'].includes(c.status)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Terminées</Typography>
              <Typography variant="h4" color="success.main">
                {campaigns.filter(c => c.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>En attente</Typography>
              <Typography variant="h4">
                {campaigns.filter(c => c.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Département</TableCell>
              <TableCell>Période</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign._id} hover>
                <TableCell>
                  <Typography fontWeight="medium">{campaign.title}</Typography>
                  {campaign.description && (
                    <Typography variant="body2" color="textSecondary">
                      {campaign.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{campaign.department || 'Tous'}</TableCell>
                <TableCell>
                  {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusConfig[campaign.status]?.label || campaign.status}
                    color={statusConfig[campaign.status]?.color || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Voir détails">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/campaigns/${campaign._id}`)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>

                  {campaign.status === 'pending' && (
                    <>
                      <Tooltip title="Lancer la campagne">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleLaunch(campaign._id)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(campaign)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(campaign._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  {['active', 'completed'].includes(campaign.status) && (
                    <Tooltip title="Rapport">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => navigate(`/reports/${campaign._id}`)}
                      >
                        <AssessmentIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary" py={3}>
                    Aucune campagne trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog pour créer/modifier une campagne */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCampaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Titre"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              select
              label="Département"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              fullWidth
              helperText="Laisser vide pour tous les départements"
            >
              <MenuItem value="">Tous les départements</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date de début"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
            <TextField
              label="Date de fin"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Critères personnalisés</Typography>
            {formData.customCriteria.map((criterion, index) => (
              <Box key={index} display="flex" gap={1}>
                <TextField
                  label={`Critère ${index + 1}`}
                  value={criterion.name}
                  onChange={(e) => {
                    const newCriteria = [...formData.customCriteria];
                    newCriteria[index].name = e.target.value;
                    setFormData({ ...formData, customCriteria: newCriteria });
                  }}
                  fullWidth
                  size="small"
                />
                <IconButton
                  color="error"
                  onClick={() => {
                    const newCriteria = formData.customCriteria.filter((_, i) => i !== index);
                    setFormData({ ...formData, customCriteria: newCriteria });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setFormData({
                ...formData,
                customCriteria: [...formData.customCriteria, { name: '', weight: 1 }]
              })}
            >
              Ajouter un critère
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.startDate || !formData.endDate}
          >
            {editingCampaign ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignsPage;

