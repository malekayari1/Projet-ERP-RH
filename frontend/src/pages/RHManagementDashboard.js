import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CircularProgress,
    Alert,
    Tooltip,
    Badge,
    Stack,
    Divider
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon,
    Send as SendIcon,
    Gavel as GavelIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import * as api from '../services/api';

const RHManagementDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState(''); // 'validate' or 'decision'
    const [decisionData, setDecisionData] = useState({
        decision: '',
        finalComment: '',
        primeAmount: ''
    });
    const [counts, setCounts] = useState({
        toValidate: 0,
        toDecide: 0,
        toNotify: 0
    });

    useEffect(() => {
        fetchEvaluations();
    }, [tabValue]);

    const fetchEvaluations = async () => {
        try {
            setLoading(true);
            const statusMap = {
                0: 'validated_manager', // À valider
                1: 'validated_rh',      // À décider
                2: 'decision_made'      // À notifier
            };

            const status = statusMap[tabValue];
            const { data } = await api.getEvaluationsForRH({ status });
            setEvaluations(data);

            // Fetch counts for all tabs
            const [toValidate, toDecide, toNotify] = await Promise.all([
                api.getEvaluationsForRH({ status: 'validated_manager' }),
                api.getEvaluationsForRH({ status: 'validated_rh' }),
                api.getEvaluationsForRH({ status: 'decision_made' })
            ]);

            setCounts({
                toValidate: toValidate.data.length,
                toDecide: toDecide.data.length,
                toNotify: toNotify.data.length
            });
        } catch (err) {
            setError('Erreur lors du chargement des évaluations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (evaluation, type) => {
        setSelectedEvaluation(evaluation);
        setDialogType(type);
        setDialogOpen(true);

        if (type === 'decision') {
            setDecisionData({
                decision: '',
                finalComment: evaluation.commentRH || '',
                primeAmount: evaluation.primeAmount || ''
            });
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedEvaluation(null);
        setDecisionData({ decision: '', finalComment: '', primeAmount: '' });
    };

    const handleValidate = async () => {
        try {
            await api.validateByRH(selectedEvaluation._id);
            setSuccess('Évaluation validée avec succès');
            handleCloseDialog();
            fetchEvaluations();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la validation');
        }
    };

    const handleDecision = async () => {
        try {
            await api.makeDecision(selectedEvaluation._id, decisionData);
            setSuccess('Décision enregistrée avec succès');
            handleCloseDialog();
            fetchEvaluations();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la décision');
        }
    };

    const handleNotify = async (evaluationId) => {
        try {
            await api.notifyEmployee(evaluationId);
            setSuccess('Employé notifié avec succès');
            fetchEvaluations();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la notification');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            evaluated: 'info',
            validated_manager: 'secondary',
            validated_rh: 'primary',
            decision_made: 'success',
            notified: 'success'
        };
        return colors[status] || 'default';
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 40) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Typography variant="h4" gutterBottom>
                Gestion des évaluations RH
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Validez, prenez des décisions et notifiez les employés
            </Typography>

            {/* Alerts */}
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
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab
                        label={
                            <Badge badgeContent={counts.toValidate} color="secondary">
                                À valider
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={counts.toDecide} color="primary">
                                À décider
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={counts.toNotify} color="success">
                                À notifier
                            </Badge>
                        }
                    />
                </Tabs>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employé</TableCell>
                            <TableCell>Département</TableCell>
                            <TableCell>Campagne</TableCell>
                            <TableCell align="center">Score</TableCell>
                            <TableCell align="center">Chef d'équipe</TableCell>
                            <TableCell align="center">Manager</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {evaluations.map((evaluation) => (
                            <TableRow key={evaluation._id} hover>
                                <TableCell>{evaluation.employeeId?.fullName || 'N/A'}</TableCell>
                                <TableCell>{evaluation.employeeId?.department || 'N/A'}</TableCell>
                                <TableCell>{evaluation.campaignId?.title || 'N/A'}</TableCell>
                                <TableCell align="center">
                                    {evaluation.score ? (
                                        <Chip
                                            label={`${evaluation.score}/100`}
                                            color={getScoreColor(evaluation.score)}
                                            size="small"
                                        />
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    {evaluation.chefEquipeId?.fullName || '-'}
                                </TableCell>
                                <TableCell align="center">
                                    {evaluation.managerId?.fullName || '-'}
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Tooltip title="Voir détails">
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/campaigns/${evaluation.campaignId?._id}`)}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {tabValue === 0 && (
                                            <Tooltip title="Valider">
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handleOpenDialog(evaluation, 'validate')}
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {tabValue === 1 && (
                                            <Tooltip title="Prendre une décision">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(evaluation, 'decision')}
                                                >
                                                    <GavelIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {tabValue === 2 && (
                                            <Tooltip title="Notifier l'employé">
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => handleNotify(evaluation._id)}
                                                >
                                                    <SendIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        {evaluations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="textSecondary" py={3}>
                                        Aucune évaluation dans cette catégorie
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Validation Dialog */}
            <Dialog open={dialogOpen && dialogType === 'validate'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Valider l'évaluation</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Confirmez-vous la validation de l'évaluation de <strong>{selectedEvaluation?.employeeId?.fullName}</strong> ?
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2">
                        Score: <strong>{selectedEvaluation?.score}/100</strong>
                    </Typography>
                    <Typography variant="body2">
                        Évaluateur: <strong>{selectedEvaluation?.chefEquipeId?.fullName}</strong>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleValidate} variant="contained" color="success" startIcon={<CheckCircleIcon />}>
                        Valider
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Decision Dialog */}
            <Dialog open={dialogOpen && dialogType === 'decision'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Prendre une décision finale</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Employé: <strong>{selectedEvaluation?.employeeId?.fullName}</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Score: <strong>{selectedEvaluation?.score}/100</strong>
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            label="Décision finale"
                            value={decisionData.decision}
                            onChange={(e) => setDecisionData({ ...decisionData, decision: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        >
                            <MenuItem value="promotion">Promotion</MenuItem>
                            <MenuItem value="prime">Prime uniquement</MenuItem>
                            <MenuItem value="formation">Formation recommandée</MenuItem>
                            <MenuItem value="maintien">Maintien au poste</MenuItem>
                            <MenuItem value="avertissement">Avertissement</MenuItem>
                        </TextField>

                        {selectedEvaluation?.score >= 80 && (
                            <TextField
                                fullWidth
                                type="number"
                                label="Montant de la prime (DT)"
                                value={decisionData.primeAmount}
                                onChange={(e) => setDecisionData({ ...decisionData, primeAmount: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        )}

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Commentaire final RH"
                            value={decisionData.finalComment}
                            onChange={(e) => setDecisionData({ ...decisionData, finalComment: e.target.value })}
                            placeholder="Ajoutez vos observations finales..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button
                        onClick={handleDecision}
                        variant="contained"
                        color="primary"
                        startIcon={<GavelIcon />}
                        disabled={!decisionData.decision}
                    >
                        Enregistrer la décision
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RHManagementDashboard;
