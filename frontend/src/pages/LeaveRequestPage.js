import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Tabs, Tab, Alert, CircularProgress, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox
} from '@mui/material';
import {
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AttachFile as AttachFileIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
    createLeave,
    getMyLeaves,
    getManagerLeaves,
    getRHLeaves,
    validateLeaveManager,
    validateLeaveRH
} from '../services/api';

const LeaveRequestPage = () => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Data states
    const [myLeaves, setMyLeaves] = useState([]);
    const [managerLeaves, setManagerLeaves] = useState([]);
    const [rhLeaves, setRhLeaves] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        type: 'Annuel',
        startDate: '',
        endDate: '',
        isHalfDay: false,
        reason: '',
        file: null
    });

    // Validation Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [validationComment, setValidationComment] = useState('');
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const [validatorRole, setValidatorRole] = useState(''); // 'manager' or 'rh'

    const isManager = ['manager', 'rh', 'directeur'].includes(user?.role);
    const isRH = ['rh', 'directeur'].includes(user?.role);

    useEffect(() => {
        fetchMyLeaves();
        if (isManager && tabValue === 2) fetchManagerLeaves();
        if (isRH && tabValue === 3) fetchRHLeaves();
    }, [tabValue]);

    const fetchMyLeaves = async () => {
        try {
            const res = await getMyLeaves();
            setMyLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchManagerLeaves = async () => {
        try {
            const res = await getManagerLeaves();
            setManagerLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRHLeaves = async () => {
        try {
            const res = await getRHLeaves();
            setRhLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setMessage({ type: '', text: '' });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, file: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.type === 'Maladie' && !formData.file) {
            setMessage({ type: 'error', text: 'Le justificatif est obligatoire pour un congé maladie.' });
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            data.append('type', formData.type);
            data.append('startDate', formData.startDate);
            data.append('endDate', formData.endDate);
            data.append('isHalfDay', formData.isHalfDay);
            data.append('reason', formData.reason);
            if (formData.file) data.append('file', formData.file);

            await createLeave(data);
            setMessage({ type: 'success', text: 'Demande envoyée avec succès !' });
            setFormData({
                type: 'Annuel',
                startDate: '',
                endDate: '',
                isHalfDay: false,
                reason: '',
                file: null
            });
            fetchMyLeaves();
            setTabValue(1); // Switch to "Mes Demandes"
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message
                || err.message
                || 'Erreur inconnue';
            setMessage({ type: 'error', text: `Erreur: ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    const openValidationDialog = (leave, role, action) => {
        setSelectedLeave(leave);
        setValidatorRole(role);
        setActionType(action);
        setValidationComment('');
        setOpenDialog(true);
    };

    const handleValidation = async () => {
        try {
            setLoading(true);
            const payload = {
                leaveId: selectedLeave._id,
                action: actionType,
                comment: validationComment
            };

            if (validatorRole === 'manager') {
                await validateLeaveManager(payload);
                fetchManagerLeaves();
            } else {
                await validateLeaveRH(payload);
                fetchRHLeaves();
            }

            setOpenDialog(false);
            setMessage({ type: 'success', text: `Demande ${actionType === 'approve' ? 'validée' : 'refusée'} avec succès.` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la validation' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusChip = (status) => {
        const config = {
            pending_manager: { label: 'En attente (Manager)', color: 'warning' },
            pending_rh: { label: 'En attente (RH)', color: 'info' },
            approved: { label: 'Approuvée', color: 'success' },
            rejected: { label: 'Refusée', color: 'error' }
        };
        const { label, color } = config[status] || { label: status, color: 'default' };
        return <Chip label={label} color={color} size="small" />;
    };

    const renderLeaveTable = (leaves, showActions = false, role = '') => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Période</TableCell>
                        <TableCell>Durée</TableCell>
                        {showActions && <TableCell>Employé</TableCell>}
                        <TableCell>Statut</TableCell>
                        <TableCell>Motif</TableCell>
                        {showActions && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {leaves.map((leave) => (
                        <TableRow key={leave._id}>
                            <TableCell>{leave.type}</TableCell>
                            <TableCell>
                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{leave.duration} j</TableCell>
                            {showActions && (
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{leave.employeeId?.fullName}</Typography>
                                    <Typography variant="caption">{leave.employeeId?.department}</Typography>
                                </TableCell>
                            )}
                            <TableCell>{getStatusChip(leave.status)}</TableCell>
                            <TableCell>{leave.reason}</TableCell>
                            {showActions && (
                                <TableCell align="right">
                                    <IconButton color="success" onClick={() => openValidationDialog(leave, role, 'approve')}>
                                        <CheckCircleIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => openValidationDialog(leave, role, 'reject')}>
                                        <CancelIcon />
                                    </IconButton>
                                    {leave.attachmentUrl && (
                                        <IconButton color="primary" href={`http://localhost:5001${leave.attachmentUrl}`} target="_blank">
                                            <AttachFileIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {leaves.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={showActions ? 7 : 6} align="center">Aucune demande.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestion des Congés</Typography>

            {message.type && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Nouvelle Demande" />
                    <Tab label="Mes Demandes" />
                    {isManager && <Tab label="Valider (Manager)" />}
                    {isRH && <Tab label="Valider (RH / Direction)" />}
                </Tabs>
            </Box>

            {/* Tab 0: Nouvelle Demande */}
            {tabValue === 0 && (
                <Paper sx={{ p: 3, maxWidth: 600 }}>
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nom complet"
                            value={user?.fullName || ''}
                            disabled
                            fullWidth
                            variant="filled"
                        />
                        <TextField
                            select
                            label="Type de congé"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            {['Annuel', 'Maladie', 'Sans solde', 'Exceptionnel'].map(t => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Date de début"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                                fullWidth
                            />
                            <TextField
                                label="Date de fin"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                                fullWidth
                            />
                        </Box>

                        <FormControlLabel
                            control={<Checkbox checked={formData.isHalfDay} onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })} />}
                            label="Demi-journée ?"
                        />

                        <TextField
                            label="Motif"
                            multiline
                            rows={3}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                        />

                        <Box>
                            <Typography variant="caption" display="block" gutterBottom>
                                Pièce jointe (Obligatoire pour Maladie)
                            </Typography>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.png,.jpeg"
                            />
                        </Box>

                        <Button variant="contained" type="submit" disabled={loading} size="large">
                            {loading ? <CircularProgress size={24} /> : 'Soumettre la demande'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Tab 1: Mes Demandes */}
            {tabValue === 1 && renderLeaveTable(myLeaves)}

            {/* Tab 2: Validation Manager */}
            {tabValue === 2 && isManager && renderLeaveTable(managerLeaves, true, 'manager')}

            {/* Tab 3: Validation RH */}
            {tabValue === 3 && isRH && renderLeaveTable(rhLeaves, true, 'rh')}

            {/* Validation Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>
                    {actionType === 'approve' ? 'Valider la demande' : 'Refuser la demande'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Commentaire (Optionnel pour validation, Obligatoire pour refus)"
                        fullWidth
                        multiline
                        rows={3}
                        value={validationComment}
                        onChange={(e) => setValidationComment(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                    <Button
                        onClick={handleValidation}
                        color={actionType === 'approve' ? 'success' : 'error'}
                        variant="contained"
                        disabled={actionType === 'reject' && !validationComment.trim()}
                    >
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveRequestPage;
