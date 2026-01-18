import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const statusIcons = {
  pending: <PendingIcon />,
  self_evaluating: <PendingIcon />,
  evaluated: <CheckCircleIcon />,
  validated_manager: <CheckCircleIcon />,
  validated_rh: <CheckCircleIcon />,
  decision_made: <CheckCircleIcon />,
  notified: <CheckCircleIcon />,
  acknowledged: <CheckCircleIcon />,
  rejected: <CancelIcon />
};
import { ListItemIcon, ListItemText } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const statusColors = {
  pending: 'warning',
  self_evaluating: 'primary',
  evaluated: 'info',
  validated_manager: 'info',
  validated_rh: 'success',
  decision_made: 'secondary',
  notified: 'success',
  acknowledged: 'success',
  rejected: 'error'
};

const statusLabels = {
  pending: 'En attente',
  self_evaluating: 'Auto-évaluation',
  evaluated: 'Évalué (Chef)',
  validated_manager: 'Validé (Manager)',
  validated_rh: 'Approuvé (RH)',
  decision_made: 'Décision prise',
  notified: 'Notifié',
  acknowledged: 'Signé',
  rejected: 'Rejeté'
};

const EvaluationsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const navigate = useNavigate();

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuEvaluationId, setMenuEvaluationId] = useState(null);

  const statuses = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'validated_manager', label: 'Validé par le manager' },
    { value: 'validated_rh', label: 'Validé par les RH' },
    { value: 'rejected', label: 'Rejeté' }
  ];

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const response = await api.getEvaluationsForRH({
          status: statusFilter !== 'all' ? statusFilter : undefined
        });

        setEvaluations({
          data: response.data,
          total: response.data.length,
          page,
          limit: rowsPerPage
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleOpenMenu = (event, evaluationId) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuEvaluationId(evaluationId);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuEvaluationId(null);
  };

  const handleEdit = () => {
    if (menuEvaluationId) {
      navigate(`/evaluations/${menuEvaluationId}/edit`);
    }
    handleCloseMenu();
  };

  const handleView = () => {
    if (menuEvaluationId) {
      navigate(`/evaluations/${menuEvaluationId}`);
    }
    handleCloseMenu();
  };

  const handleDeleteClick = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedEvaluation) {
        // In a real app, you would call the API to delete the evaluation
        // await api.delete(`/evaluations/${selectedEvaluation._id}`);

        // For demo purposes, just log and close the dialog
        console.log('Deleting evaluation:', selectedEvaluation._id);
        setDeleteDialogOpen(false);
        setSelectedEvaluation(null);

        // Refresh the evaluations list
        // fetchEvaluations();
      }
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedEvaluation(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultLabel = (result) => {
    switch (result) {
      case 'excellent':
        return 'Excellent';
      case 'normal':
        return 'Satisfaisant';
      case 'failed':
        return 'Insuffisant';
      default:
        return 'Non évalué';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'excellent':
        return 'success';
      case 'normal':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Évaluations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/evaluations/new')}
        >
          Nouvelle évaluation
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250, flexGrow: 1 }}
          />

          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            variant="outlined"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon />
                </InputAdornment>
              ),
            }}
          >
            {statuses.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader aria-label="evaluations table">
                <TableHead>
                  <TableRow>
                    <TableCell>Employé</TableCell>
                    <TableCell>Campagne</TableCell>
                    <TableCell align="center">Statut</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell align="center">Résultat</TableCell>
                    <TableCell>Dernière mise à jour</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluations.data?.length > 0 ? (
                    evaluations.data.map((evaluation) => (
                      <TableRow
                        hover
                        key={evaluation._id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {evaluation.employee?.fullName || 'N/A'}
                        </TableCell>
                        <TableCell>{evaluation.campaign?.title || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={statusIcons[evaluation.status] || null}
                            label={statusLabels[evaluation.status] || evaluation.status}
                            color={statusColors[evaluation.status] || 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {evaluation.score ? `${evaluation.score}/100` : '-'}
                        </TableCell>
                        <TableCell align="center">
                          {evaluation.finalResult ? (
                            <Chip
                              label={getResultLabel(evaluation.finalResult)}
                              color={getResultColor(evaluation.finalResult)}
                              size="small"
                              variant="filled"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(evaluation.updatedAt || evaluation.createdAt)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, evaluation._id)}
                            aria-label="actions"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="textSecondary">
                          Aucune évaluation trouvée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {evaluations.data?.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={evaluations.total || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                }
              />
            )}
          </>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        onClick={handleCloseMenu}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Voir les détails</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick({ _id: menuEvaluationId })}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvaluationsPage;
