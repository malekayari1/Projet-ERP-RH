import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Grid,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Visibility as ViewIcon,
    Publish as PublishIcon,
    PlaylistAddCheck as CheckIcon,
    PersonAdd as AddPersonIcon
} from '@mui/icons-material';
import api from '../services/api';

const JobOfferDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [offer, setOffer] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [openAddCandidate, setOpenAddCandidate] = useState(false);
    const [newCandidate, setNewCandidate] = useState({
        firstName: '', lastName: '', email: '', phone: '', linkedinUrl: ''
    });

    useEffect(() => {
        fetchOffer();
        fetchCandidates();
    }, [id]);

    const fetchOffer = async () => {
        try {
            const { data } = await api.get(`/job-offers/${id}`);
            setOffer(data);
        } catch (err) { console.error(err); }
    };

    const fetchCandidates = async () => {
        try {
            const { data } = await api.get(`/candidates/job-offer/${id}`);
            setCandidates(data);
        } catch (err) { console.error(err); }
    };

    const handlePublish = async () => {
        try {
            await api.put(`/job-offers/${id}`, { status: 'published' });
            fetchOffer();
        } catch (err) { console.error(err); }
    };

    const handleAddCandidate = async () => {
        try {
            await api.post(`/candidates`, { ...newCandidate, jobOfferId: id });
            setOpenAddCandidate(false);
            setNewCandidate({ firstName: '', lastName: '', email: '', phone: '', linkedinUrl: '' });
            fetchCandidates();
        } catch (err) { console.error(err); }
    };

    const getCandidateStatusChip = (status) => {
        const map = {
            'new': { label: 'Reçu', color: 'default' },
            'interview_rh': { label: 'Entretien RH', color: 'info' },
            'decision_pending': { label: 'Décision', color: 'warning' },
            'hired': { label: 'Recruté', color: 'success' },
            'rejected': { label: 'Rejeté', color: 'error' }
        };
        const conf = map[status] || { label: status, color: 'default' };
        return <Chip label={conf.label} color={conf.color} size="small" />;
    };

    const handleClose = async () => {
        if (confirm("Voulez-vous vraiment clôturer ce poste ? Les candidatures ne seront plus acceptées.")) {
            try {
                await api.put(`/job-offers/${id}`, { status: 'closed' });
                fetchOffer();
            } catch (err) { console.error(err); }
        }
    };

    if (!offer) return <Box p={3}>Chargement...</Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/recruitment')} sx={{ mb: 2 }}>
                Retour
            </Button>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">{offer.title}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">{offer.department}</Typography>
                </Box>
                <Box>
                    {offer.status === 'analysis' && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<PublishIcon />}
                            onClick={handlePublish}
                        >
                            Publier l'annonce
                        </Button>
                    )}
                    {offer.status === 'published' && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<CheckIcon />}
                            onClick={handleClose}
                        >
                            Clôturer le poste
                        </Button>
                    )}
                </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Détails de l'offre" />
                    <Tab label={`Candidatures (${candidates.length})`} />
                </Tabs>
            </Paper>

            {tabValue === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Description</Typography>
                    <Typography paragraph>{offer.description}</Typography>
                    <Typography variant="h6" gutterBottom>Budget</Typography>
                    <Typography>{offer.budget.toLocaleString()} DT</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                        Statut: {offer.status.toUpperCase()}
                    </Typography>
                </Paper>
            )}

            {tabValue === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="flex-end" mb={2}>
                        <Button startIcon={<AddPersonIcon />} variant="outlined" onClick={() => setOpenAddCandidate(true)}>
                            Ajouter Candidat (Simu)
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Date dépôt</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {candidates.map((c) => (
                                    <TableRow key={c._id}>
                                        <TableCell>{c.firstName} {c.lastName}</TableCell>
                                        <TableCell>{c.email}</TableCell>
                                        <TableCell>{new Date(c.submittedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{getCandidateStatusChip(c.status)}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => navigate(`/recruitment/candidate/${c._id}`)}>
                                                <ViewIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {candidates.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center">Aucune candidature reçue</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Add Candidate Dialog */}
            <Dialog open={openAddCandidate} onClose={() => setOpenAddCandidate(false)}>
                <DialogTitle>Ajouter un candidat manuel</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Prénom" fullWidth value={newCandidate.firstName} onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })} />
                    <TextField margin="dense" label="Nom" fullWidth value={newCandidate.lastName} onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })} />
                    <TextField margin="dense" label="Email" fullWidth value={newCandidate.email} onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })} />
                    <TextField margin="dense" label="URL LinkedIn" fullWidth value={newCandidate.linkedinUrl} onChange={(e) => setNewCandidate({ ...newCandidate, linkedinUrl: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddCandidate(false)}>Annuler</Button>
                    <Button onClick={handleAddCandidate} variant="contained">Ajouter</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default JobOfferDetailsPage;
