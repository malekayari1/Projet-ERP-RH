import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    Divider,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Chip,
    Alert
} from '@mui/material';
import { ArrowBack as UtilsIcon } from '@mui/icons-material';
import api from '../services/api';

const CandidateDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [interviewData, setInterviewData] = useState({ date: '', rating: 5, comment: '' });
    const [decisionData, setDecisionData] = useState({ result: '', salary: '' });

    useEffect(() => {
        fetchCandidate();
    }, [id]);

    const fetchCandidate = async () => {
        try {
            const { data } = await api.get(`/candidates/${id}`);
            setCandidate(data);
            // Pre-fill forms if data exists
            if (data.interviewDate) setInterviewData({
                date: new Date(data.interviewDate).toISOString().slice(0, 16), // Keep YYYY-MM-DDTHH:mm
                rating: data.interviewRating || 5,
                comment: data.interviewComment || ''
            });
            if (data.finalDecision) setDecisionData({
                result: data.finalDecision,
                salary: data.salaryProposal || ''
            });
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const updateCandidate = async (payload) => {
        try {
            await api.put(`/candidates/${id}`, payload);
            fetchCandidate();
        } catch (err) { console.error(err); }
    };

    const handleInterviewSave = () => {
        updateCandidate({
            status: 'decision_pending', // Auto-move to next step after interview
            interviewDate: interviewData.date,
            interviewRating: interviewData.rating,
            interviewComment: interviewData.comment
        });
    };

    // Handlers merged into UI button logic directly for simplicity as requested

    if (loading || !candidate) return <Box p={3}>Chargement...</Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Button startIcon={<UtilsIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Retour</Button>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h4">{candidate.firstName} {candidate.lastName}</Typography>
                        <Typography color="text.secondary">{candidate.email} | {candidate.phone}</Typography>
                        <Box mt={2}>
                            <Box mt={2}>
                                <Button variant="outlined" component="a" href={candidate.linkedinUrl || '#'} target="_blank" color="info">
                                    Voir LinkedIn
                                </Button>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                        <Typography variant="overline" display="block">Statut Actuel</Typography>
                        <Chip
                            label={candidate.status.toUpperCase()}
                            color={candidate.status === 'hired' ? 'success' : candidate.status === 'rejected' ? 'error' : 'primary'}
                            sx={{ fontSize: '1rem', px: 2 }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                {/* Step 4: Interview RH */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Entretien RH</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <TextField
                            label="Date et Heure de l'entretien"
                            type="datetime-local"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            margin="normal"
                            value={interviewData.date}
                            onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                        />
                        <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            sx={{ mb: 2 }}
                            onClick={() => {
                                if (confirm("Cela enverra un email au candidat. Confirmer ?")) {
                                    updateCandidate({
                                        interviewDate: interviewData.date,
                                        notifyCandidate: true
                                    });
                                }
                            }}
                        >
                            Planifier & Envoyer Convocation
                        </Button>

                        {/* Interview Results Section Removed as per user request */}
                    </Paper>
                </Grid>

                {/* Step 5: Decision & Negotiation */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Décision & Contrat</Typography>
                        <Divider sx={{ mb: 2 }} />

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Décision Finale</InputLabel>
                            <Select
                                value={decisionData.result}
                                label="Décision Finale"
                                onChange={(e) => setDecisionData({ ...decisionData, result: e.target.value })}
                            >
                                <MenuItem value="pending">En attente</MenuItem>
                                <MenuItem value="accepted">Retenu</MenuItem>
                                <MenuItem value="rejected">Rejeté</MenuItem>
                            </Select>
                        </FormControl>

                        {decisionData.result === 'accepted' && (
                            <>
                                <TextField
                                    label="Proposition Salariale (Brut Annuel)"
                                    type="number"
                                    fullWidth
                                    margin="normal"
                                    value={decisionData.salary}
                                    onChange={(e) => setDecisionData({ ...decisionData, salary: e.target.value })}
                                />
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    Si validé, la négociation commencera automatiquement.
                                </Alert>
                            </>
                        )}

                        <Button
                            variant="contained"
                            color={decisionData.result === 'rejected' ? 'error' : decisionData.result === 'accepted' ? 'success' : 'primary'}
                            onClick={() => {
                                let newStatus = 'decision_pending';
                                if (decisionData.result === 'rejected') newStatus = 'rejected';
                                if (decisionData.result === 'accepted') newStatus = 'hired';

                                if (decisionData.result === 'accepted') {
                                    if (confirm("Confirmer le recrutement ? Cela enverra automatiquement l'email de bienvenue au candidat.")) {
                                        updateCandidate({
                                            finalDecision: decisionData.result,
                                            salaryProposal: decisionData.salary,
                                            status: newStatus
                                        });
                                    }
                                } else {
                                    updateCandidate({
                                        finalDecision: decisionData.result,
                                        salaryProposal: decisionData.salary,
                                        status: newStatus
                                    });
                                }
                            }}
                            sx={{ mt: 2 }}
                            fullWidth
                            size="large"
                        >
                            Valider la Décision
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CandidateDetailsPage;
