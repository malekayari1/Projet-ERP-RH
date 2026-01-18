import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
    Button, TextField, Chip, Grid, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import PayrollService from '../../services/payrollService';

const EmployeePayroll = () => {
    const [entries, setEntries] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);

    // Form State
    const [presence, setPresence] = useState({ normalHours: 0, overtimeHours: 0, absences: 0 });
    const [primes, setPrimes] = useState([]); // Simplified for MVP: Just text desc? Or fixed types? 
    // Let's keep it simple: List of primes not editable in this quick MVP unless needed. 
    // The prompt says "Saisie des primes". So let's allow adding one.
    const [newPrime, setNewPrime] = useState({ type: 'Prime', amount: 0 });

    // Dispute State
    const [openDispute, setOpenDispute] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [disputeEntryId, setDisputeEntryId] = useState(null);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const data = await PayrollService.getMyEntries();
            setEntries(data);
        } catch (error) {
            console.error("Error loading entries", error);
        }
    };

    const handleEdit = (entry) => {
        setCurrentEntry(entry);
        setPresence(entry.presence || { normalHours: 0, overtimeHours: 0, absences: 0 });
        setPrimes(entry.primes || []);
        setOpenEdit(true);
    };

    const handleSave = async () => {
        try {
            await PayrollService.updateMyEntry(currentEntry._id, { presence, primes });
            setOpenEdit(false);
            loadEntries();
        } catch (error) {
            console.error("Error saving entry", error);
            alert("Erreur lors de la sauvegarde");
        }
    };

    const handleDownload = (entry) => {
        PayrollService.downloadPayslip(entry._id, `bulletin_${entry.periodId.month}_${entry.periodId.year}.pdf`);
    };

    const handleOpenDispute = (entry) => {
        setDisputeEntryId(entry._id);
        setDisputeReason("");
        setOpenDispute(true);
    };

    const handleSubmitDispute = async () => {
        try {
            await PayrollService.disputeEntry(disputeEntryId, disputeReason);
            setOpenDispute(false);
            loadEntries();
            alert("Signalement envoyé aux RH.");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'envoi.");
        }
    };

    // Helper to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'DRAFT': return 'default';
            case 'SUBMITTED': return 'info';
            case 'VALIDATED': return 'success';
            case 'REJECTED': return 'error';
            case 'PAID': return 'success';
            default: return 'default';
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Mes Bulletins de Paie & Saisie</Typography>

            <Paper elevation={3}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Période</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Heures Normales</TableCell>
                            <TableCell>Heures Sup.</TableCell>
                            <TableCell>Net à Payer (Est.)</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography color="textSecondary">
                                        Aucun bulletin trouvé. Veuillez vérifier si une période de paie est ouverte et si votre contrat est validé.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry._id}>
                                    <TableCell>{entry.periodId?.month}/{entry.periodId?.year}</TableCell>
                                    <TableCell>
                                        <Chip label={entry.status} color={getStatusColor(entry.status)} size="small" />
                                        {entry.rhComment && <Typography variant="caption" display="block" color="error">{entry.rhComment}</Typography>}
                                    </TableCell>
                                    <TableCell>{entry.presence?.normalHours}</TableCell>
                                    <TableCell>{entry.presence?.overtimeHours}</TableCell>
                                    <TableCell>{entry.calculations?.netSalary ? `${entry.calculations.netSalary.toFixed(2)} TND` : '-'}</TableCell>
                                    <TableCell>
                                        {(entry.status === 'DRAFT' || entry.status === 'REJECTED') && (
                                            <Button size="small" variant="contained" onClick={() => handleEdit(entry)}>Saisir/Corriger</Button>
                                        )}
                                        {(entry.status === 'VALIDATED' || entry.status === 'PAID') && (
                                            <>
                                                <Button size="small" color="secondary" onClick={() => handleDownload(entry)}>Bulletin PDF</Button>
                                                <Button size="small" color="error" onClick={() => handleOpenDispute(entry)} sx={{ ml: 1 }}>Signaler Erreur</Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Saisie des Données de Présence</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        <TextField
                            label="Heures Normales"
                            type="number"
                            fullWidth
                            value={presence.normalHours}
                            onChange={(e) => setPresence({ ...presence, normalHours: Number(e.target.value) })}
                        />
                        <TextField
                            label="Heures Supplémentaires"
                            type="number"
                            fullWidth
                            value={presence.overtimeHours}
                            onChange={(e) => setPresence({ ...presence, overtimeHours: Number(e.target.value) })}
                        />
                        <TextField
                            label="Absences (Heures)"
                            type="number"
                            fullWidth
                            value={presence.absences}
                            onChange={(e) => setPresence({ ...presence, absences: Number(e.target.value) })}
                        />

                        <Typography variant="h6" mt={2}>Primes</Typography>
                        {primes.map((p, idx) => (
                            <Box key={idx} display="flex" justifyContent="space-between" mb={1}>
                                <Typography>{p.type}: {p.amount} TND</Typography>
                            </Box>
                        ))}
                        <Box display="flex" gap={1}>
                            <TextField
                                label="Type"
                                size="small"
                                value={newPrime.type}
                                onChange={(e) => setNewPrime({ ...newPrime, type: e.target.value })}
                            />
                            <TextField
                                label="Montant"
                                type="number"
                                size="small"
                                value={newPrime.amount}
                                onChange={(e) => setNewPrime({ ...newPrime, amount: Number(e.target.value) })}
                            />
                            <Button variant="outlined" onClick={() => {
                                setPrimes([...primes, newPrime]);
                                setNewPrime({ type: 'Prime', amount: 0 });
                            }}>Ajouter</Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
                    <Button onClick={handleSave} variant="contained">Enregistrer</Button>
                </DialogActions>
            </Dialog>

            {/* Dispute Dialog */}
            <Dialog open={openDispute} onClose={() => setOpenDispute(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Signaler une erreur sur le bulletin</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Veuillez expliquer l'erreur constatée pour correction par les RH :</Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Description de l'erreur"
                        fullWidth
                        multiline
                        rows={4}
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDispute(false)}>Annuler</Button>
                    <Button onClick={handleSubmitDispute} color="error" variant="contained">Envoyer Signalement</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeePayroll;
