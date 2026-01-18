import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Avatar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, Stepper, Step, StepLabel, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    CircularProgress, Divider, Tooltip
} from '@mui/material';
import {
    Description as ContractIcon,
    History as HistoryIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Send as SendIcon,
    Assignment as AssignmentIcon,
    Gavel as SignatureIcon,
    Visibility as ViewIcon,
    Add as AddIcon,
    AccountTree as WorkflowIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STEPS = ['Système ERP', 'Validation RH', 'Signature Employé', 'Validation Manager'];

const getStepIndex = (status) => {
    switch (status) {
        case 'draft': return 0;
        case 'rh_pending': return 1;
        case 'employee_pending': return 2;
        case 'manager_pending': return 3;
        case 'validated': return 4;
        default: return 0;
    }
};

const ContractsPage = () => {
    const { user } = useAuth();
    const [contracts, setContracts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [openCreate, setOpenCreate] = useState(false);
    const [openAction, setOpenAction] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [comment, setComment] = useState('');
    const [newContract, setNewContract] = useState({ employeeId: '', type: 'CDI', startDate: '', endDate: '' });

    const isRH = ['rh', 'directeur'].includes(user?.role);
    const isManager = user?.role === 'manager';
    const isEmployee = user?.role === 'employee';

    useEffect(() => {
        fetchData();
        if (isRH) fetchEmployees();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/contracts');
            setContracts(res.data);
        } catch (err) {
            console.error('Error fetching contracts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const handleCreate = async () => {
        try {
            await api.post('/contracts', newContract);
            alert('Contrat créé et envoyé au Responsable RH pour validation.');
            setOpenCreate(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de la création.");
        }
    };

    const handleAction = async (actorType, action) => {
        try {
            let endpoint = '';
            let payload = { contractId: selectedContract._id, action, comment };

            if (actorType === 'RH') endpoint = '/contracts/rh-validate';
            else if (actorType === 'EMPLOYEE') endpoint = '/contracts/sign';
            else if (actorType === 'MANAGER') endpoint = '/contracts/manager-validate';

            await api.post(endpoint, payload);
            alert(`Action ${action} effectuée avec succès !`);
            setOpenAction(false);
            setComment('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de l'action.");
        }
    };

    const getStatusChip = (status) => {
        const config = {
            draft: { label: 'Brouillon ERP', color: 'default' },
            rh_pending: { label: 'Attente RH', color: 'info' },
            employee_pending: { label: 'Attente Signature', color: 'warning' },
            manager_pending: { label: 'Attente Manager', color: 'secondary' },
            validated: { label: 'Validé & Archivé', color: 'success' },
            rejected: { label: 'Rejeté', color: 'error' }
        };
        const { label, color } = config[status] || { label: status, color: 'default' };
        return <Chip label={label} color={color} size="small" variant="outlined" />;
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: 'primary.main', mb: 1 }}>
                        Gestion des Contrats
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Suivi du cycle de vie des contrats selon le workflow BPMN 2.0 (ERP → RH → Employé → Manager)
                    </Typography>
                </Box>
                {(isRH || isEmployee) && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreate(true)}
                        sx={{ borderRadius: 3, py: 1.5, px: 3, boxShadow: 4 }}
                    >
                        {isEmployee ? 'Demander Renouvellement' : 'Nouveau Contrat'}
                    </Button>
                )}
            </Box>

            {/* Content Area */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 3 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Employé</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Période</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>État Workflow</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Dernière Action</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contracts.map((c) => (
                                    <TableRow key={c._id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>{c.employeeId?.fullName?.charAt(0)}</Avatar>
                                                <Typography variant="body2" fontWeight="bold">{c.employeeId?.fullName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Chip label={c.type} size="small" color="primary" variant="filled" /></TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                Du {new Date(c.startDate).toLocaleDateString()}
                                                {c.endDate ? ` au ${new Date(c.endDate).toLocaleDateString()}` : ' (CDI)'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{getStatusChip(c.status)}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                                {c.history[c.history.length - 1]?.comment || 'Création système'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Voir Workflow détaillée">
                                                <IconButton onClick={() => { setSelectedContract(c); setOpenAction(true); }}>
                                                    <WorkflowIcon color="primary" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {contracts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                            Aucun contrat en cours de traitement.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>

            {/* Create Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContractIcon color="primary" /> {isEmployee ? 'Demande de Renouvellement' : 'Initialisation Contrat (ERP)'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {!isEmployee && (
                            <TextField
                                select
                                label="Employé"
                                fullWidth
                                value={newContract.employeeId}
                                onChange={(e) => setNewContract({ ...newContract, employeeId: e.target.value })}
                            >
                                {employees.map(emp => <MenuItem key={emp._id} value={emp._id}>{emp.fullName}</MenuItem>)}
                            </TextField>
                        )}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    select
                                    label="Type de Contrat"
                                    fullWidth
                                    value={newContract.type}
                                    onChange={(e) => setNewContract({ ...newContract, type: e.target.value })}
                                >
                                    {['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Date de début"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={newContract.startDate}
                                    onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                                />
                            </Grid>
                            {newContract.type !== 'CDI' && (
                                <Grid item xs={12}>
                                    <TextField
                                        label="Date de fin"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={newContract.endDate}
                                        onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                                    />
                                </Grid>
                            )}
                        </Grid>
                        <Typography variant="caption" color="textSecondary">
                            Le système ERP va vérifier les données et générer le modèle automatiquement après validation.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenCreate(false)}>Annuler</Button>
                    <Button onClick={handleCreate} variant="contained" startIcon={<SendIcon />}>Lancer le Workflow</Button>
                </DialogActions>
            </Dialog>

            {/* Action / Workflow Detail Dialog */}
            <Dialog open={openAction} onClose={() => setOpenAction(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Progression du Workflow : {selectedContract?.employeeId?.fullName}</DialogTitle>
                <DialogContent>
                    {selectedContract && (
                        <Box sx={{ py: 2 }}>
                            <Stepper activeStep={getStepIndex(selectedContract.status)} alternativeLabel sx={{ mb: 4 }}>
                                {STEPS.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={7}>
                                    <Typography variant="h6" gutterBottom>Historique & Commentaires</Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
                                        {selectedContract.history.map((h, i) => (
                                            <Box key={i} sx={{ mb: 2 }}>
                                                <Typography variant="caption" color="primary" fontWeight="bold">
                                                    {new Date(h.updatedAt).toLocaleString()} - {h.status.toUpperCase()}
                                                </Typography>
                                                <Typography variant="body2">{h.comment}</Typography>
                                            </Box>
                                        ))}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Typography variant="h6" gutterBottom>Actions Disponibles</Typography>

                                    {/* RH Swimlane Actions */}
                                    {isRH && selectedContract.status === 'rh_pending' && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <TextField
                                                label="Commentaire RH"
                                                multiline rows={3} fullWidth
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            />
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button fullWidth variant="contained" color="success" onClick={() => handleAction('RH', 'approve')}>Valider Contrat</Button>
                                                <Button fullWidth variant="outlined" color="error" onClick={() => handleAction('RH', 'reject')}>Refuser</Button>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Employee Swimlane Action */}
                                    {isEmployee && selectedContract.status === 'employee_pending' && (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" sx={{ mb: 2 }}>En signant, vous acceptez les termes du contrat généré par le RH.</Typography>
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                size="large"
                                                startIcon={<SignatureIcon />}
                                                onClick={() => handleAction('EMPLOYEE', 'sign')}
                                            >
                                                Signer Électroniquement
                                            </Button>
                                        </Box>
                                    )}

                                    {/* Manager Swimlane Action */}
                                    {isManager && selectedContract.status === 'manager_pending' && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <TextField
                                                label="Note Hierarchique"
                                                multiline rows={3} fullWidth
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            />
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button fullWidth variant="contained" color="primary" onClick={() => handleAction('MANAGER', 'approve')}>Approuver & Archiver</Button>
                                                <Button fullWidth variant="outlined" color="warning" onClick={() => handleAction('MANAGER', 'reject')}>Revision RH</Button>
                                            </Box>
                                        </Box>
                                    )}

                                    {!isRH && !isManager && !isEmployee && <Typography color="textSecondary">Vous n'avez pas d'action à effectuer à cette étape.</Typography>}
                                    {selectedContract.status === 'validated' && <Typography color="success.main" fontWeight="bold">Ce contrat est clôturé et archivé. ✓</Typography>}
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenAction(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ContractsPage;
