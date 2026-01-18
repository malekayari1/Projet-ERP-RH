import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert
} from '@mui/material';
import { Add as AddIcon, BusinessCenter as JobIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Use the axios instance

const RecruitmentPage = () => {
    const [offers, setOffers] = useState([]);
    const [openNewOffer, setOpenNewOffer] = useState(false);
    const [newOfferData, setNewOfferData] = useState({
        title: '',
        description: '',
        department: '',
        budget: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const { data } = await api.get('/job-offers');
            setOffers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateOffer = async () => {
        setError('');
        try {
            await api.post('/job-offers', newOfferData);
            setOpenNewOffer(false);
            fetchOffers();
            setNewOfferData({ title: '', description: '', department: '', budget: '' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors de la création';
            setError(msg);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'analysis': return 'warning';
            case 'published': return 'success';
            case 'closed': return 'default';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'analysis': return 'Analyse du besoin';
            case 'published': return 'Publiée';
            case 'closed': return 'Clôturée';
            default: return status;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center">
                    <JobIcon sx={{ mr: 2 }} />
                    Recrutement & Embauche
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenNewOffer(true)}
                >
                    Nouveau Besoin
                </Button>
            </Box>

            <Grid container spacing={3}>
                {offers.map((offer) => (
                    <Grid item xs={12} md={4} key={offer._id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box display="flex" justifyContent="space-between" mb={2}>
                                    <Chip
                                        label={getStatusLabel(offer.status)}
                                        color={getStatusColor(offer.status)}
                                        size="small"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {offer.department}
                                    </Typography>
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    {offer.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                }}>
                                    {offer.description}
                                </Typography>
                                <Typography variant="subtitle2" color="primary">
                                    Budget: {offer.budget.toLocaleString()} DT
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" onClick={() => navigate(`/recruitment/${offer._id}`)}>
                                    Gérer
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                {offers.length === 0 && (
                    <Grid item xs={12}>
                        <Typography color="text.secondary">Aucune offre pour le moment.</Typography>
                    </Grid>
                )}
            </Grid>

            {/* New Offer Dialog */}
            <Dialog open={openNewOffer} onClose={() => setOpenNewOffer(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Définition du Besoin</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Titre du poste"
                        fullWidth
                        value={newOfferData.title}
                        onChange={(e) => setNewOfferData({ ...newOfferData, title: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Département"
                        fullWidth
                        value={newOfferData.department}
                        onChange={(e) => setNewOfferData({ ...newOfferData, department: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Budget estimé"
                        type="number"
                        fullWidth
                        value={newOfferData.budget}
                        onChange={(e) => setNewOfferData({ ...newOfferData, budget: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Description du poste"
                        multiline
                        rows={4}
                        fullWidth
                        value={newOfferData.description}
                        onChange={(e) => setNewOfferData({ ...newOfferData, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewOffer(false)}>Annuler</Button>
                    <Button onClick={handleCreateOffer} variant="contained">Valider le besoin</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
export default RecruitmentPage;
