import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
    Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Accordion, AccordionSummary, AccordionDetails, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PayrollService from '../../services/payrollService';

const RHPayrollDashboard = () => {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [entries, setEntries] = useState([]);
    const [departments, setDepartments] = useState(['Tous', 'Développement', 'RH', 'Marketing', 'Direction']); // Hardcoded for MVP or fetch distinct
    const [selectedDepartment, setSelectedDepartment] = useState('Tous');

    // New Period Dialog
    const [openNewPeriod, setOpenNewPeriod] = useState(false);
    const [newPeriodData, setNewPeriodData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

    // Validate Dialog
    const [openValidate, setOpenValidate] = useState(false);
    const [validationEntry, setValidationEntry] = useState(null);
    const [rhComment, setRhComment] = useState("");

    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadEntries(selectedPeriod._id);
        }
    }, [selectedPeriod, selectedDepartment]);

    const loadPeriods = async () => {
        try {
            const data = await PayrollService.getPeriods();
            setPeriods(data);
            if (data.length > 0 && !selectedPeriod) setSelectedPeriod(data[0]);
        } catch (error) {
            console.error(error);
        }
    };

    const loadEntries = async (periodId) => {
        try {
            const data = await PayrollService.getPeriodEntries(periodId, selectedDepartment);
            setEntries(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreatePeriod = async () => {
        try {
            await PayrollService.createPeriod(newPeriodData.month, newPeriodData.year);
            setOpenNewPeriod(false);
            loadPeriods();
        } catch (error) {
            alert(error.response?.data?.message || "Erreur création période");
        }
    };

    const handleValidateClick = (entry) => {
        setValidationEntry(entry);
        setRhComment(entry.rhComment || "");
        setOpenValidate(true);
    };

    const confirmValidate = async (status) => {
        if (!validationEntry) return;
        try {
            await PayrollService.validateEntry(validationEntry._id, status, rhComment);
            setOpenValidate(false);
            loadEntries(selectedPeriod._id);
        } catch (error) {
            alert("Erreur validation");
        }
    };

    const handleCalculateAll = async () => {
        if (!selectedPeriod) return;
        try {
            await PayrollService.calculateAll(selectedPeriod._id);
            loadEntries(selectedPeriod._id);
            alert("Calcul relancé pour tous les brouillons/en attente.");
        } catch (error) {
            console.error(error);
        }
    };

    const handleClosePeriod = async () => {
        if (!confirm("Êtes-vous sûr de vouloir clôturer cette période ? Cela archivera les données.")) return;
        try {
            await PayrollService.closePeriod(selectedPeriod._id);
            loadPeriods(); // Reload status
        } catch (err) {
            alert(err.response?.data?.message || "Error");
        }
    };

    const handleRemind = async (employee) => {
        try {
            await PayrollService.sendReminder(employee.employeeId._id || employee.employeeId); // handle populated or ID
            alert(`Rappel envoyé à ${employee.employeeId?.fullName || 'Employé'}`);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'envoi du rappel.");
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h4">Gestion de la Paie (RH)</Typography>
                <Button variant="contained" onClick={() => setOpenNewPeriod(true)}>Nouvelle Période</Button>
            </Box>

            <Box mb={3} display="flex" gap={2}>
                <FormControl style={{ minWidth: 200 }}>
                    <InputLabel>Période Active</InputLabel>
                    <Select
                        value={selectedPeriod ? selectedPeriod._id : ''}
                        onChange={(e) => setSelectedPeriod(periods.find(p => p._id === e.target.value))}
                        label="Période Active"
                    >
                        {periods.map(p => (
                            <MenuItem key={p._id} value={p._id}>
                                {p.month}/{p.year} - {p.status}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl style={{ minWidth: 200 }}>
                    <InputLabel>Département</InputLabel>
                    <Select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        label="Département"
                    >
                        {departments.map(dept => (
                            <MenuItem key={dept} value={dept}>
                                {dept}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedPeriod && (
                    <>
                        <Button variant="outlined" onClick={handleCalculateAll}>Relancer Calculs (Masse)</Button>
                        <Button variant="contained" color="warning" onClick={handleClosePeriod} disabled={selectedPeriod.isClosed}>
                            Clôturer & Envoyer Compta
                        </Button>
                    </>
                )}
            </Box>

            <Paper elevation={3}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employé</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Heures (Norm/Sup/Abs)</TableCell>
                            <TableCell>Primes</TableCell>
                            <TableCell>Brut</TableCell>
                            <TableCell>Net</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry) => (
                            <TableRow key={entry._id} sx={{ backgroundColor: entry.status === 'MISSING_DATA' ? '#fafafa' : 'inherit' }}>
                                <TableCell>
                                    <Typography variant="subtitle2">{entry.employeeId?.fullName}</Typography>
                                    <Typography variant="caption">{entry.employeeId?.department}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={entry.status === 'MISSING_DATA' ? 'NON SAISI' : entry.status}
                                        color={
                                            entry.status === 'VALIDATED' ? 'success' :
                                                entry.status === 'SUBMITTED' ? 'info' :
                                                    entry.status === 'DISPUTED' ? 'warning' :
                                                        entry.status === 'REJECTED' ? 'error' : 'default'
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {entry.status === 'MISSING_DATA' ? '-' : `${entry.presence?.normalHours} / ${entry.presence?.overtimeHours} / ${entry.presence?.absences}`}
                                </TableCell>
                                <TableCell>
                                    {entry.status === 'MISSING_DATA' ? '-' : (
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {entry.calculations?.primesTotal} TND
                                            </Typography>
                                            {entry.primes && entry.primes.length > 0 && (
                                                <Box sx={{ mt: 0.5 }}>
                                                    {entry.primes.map((p, idx) => (
                                                        <Typography key={idx} variant="caption" display="block" color="text.secondary">
                                                            • {p.amount} ({p.type})
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {entry.status === 'MISSING_DATA' ? '-' : `${entry.calculations?.grossSalary} TND`}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {entry.status === 'MISSING_DATA' ? '-' : `${entry.calculations?.netSalary} TND`}
                                </TableCell>
                                <TableCell>
                                    {entry.status === 'MISSING_DATA' ? (
                                        <Button size="small" variant="outlined" color="warning" onClick={() => handleRemind(entry)}>
                                            Rappeler
                                        </Button>
                                    ) : (
                                        <>
                                            <Button size="small" variant="outlined" onClick={() => handleValidateClick(entry)} disabled={selectedPeriod?.isClosed || entry.status === 'PAID'}>
                                                Examiner
                                            </Button>
                                            {entry.status === 'VALIDATED' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="secondary"
                                                    sx={{ ml: 1 }}
                                                    onClick={() => PayrollService.downloadPayslip(
                                                        entry._id,
                                                        `bulletin_${entry.employeeId?.fullName}_${selectedPeriod?.month}_${selectedPeriod?.year}.pdf`
                                                    )}
                                                >
                                                    Fiche PDF
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* New Period Dialog */}
            <Dialog open={openNewPeriod} onClose={() => setOpenNewPeriod(false)}>
                <DialogTitle>Ouvrir une nouvelle période de paie</DialogTitle>
                <DialogContent>
                    <Box mt={1} display="flex" gap={2}>
                        <TextField
                            label="Mois"
                            type="number"
                            value={newPeriodData.month}
                            onChange={(e) => setNewPeriodData({ ...newPeriodData, month: Number(e.target.value) })}
                        />
                        <TextField
                            label="Année"
                            type="number"
                            value={newPeriodData.year}
                            onChange={(e) => setNewPeriodData({ ...newPeriodData, year: Number(e.target.value) })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewPeriod(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handleCreatePeriod}>Créer</Button>
                </DialogActions>
            </Dialog>

            {/* Validation Dialog */}
            <Dialog open={openValidate} onClose={() => setOpenValidate(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Valider la paie de {validationEntry?.employeeId?.fullName}</DialogTitle>
                <DialogContent>
                    <Box mt={2}>
                        {/* Dispute Warning */}
                        {validationEntry?.status === 'DISPUTED' && (
                            <Box mb={2} p={2} bgcolor="#ffebee" borderRadius={1} border="1px solid #f44336">
                                <Typography color="error" variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    ⚠️ SIGNALEMENT ERREUR EMPLOYÉ
                                </Typography>
                                <Typography variant="body2">{validationEntry.disputeReason}</Typography>
                            </Box>
                        )}

                        <Typography><strong>Heures Normales:</strong> {validationEntry?.presence?.normalHours}</Typography>
                        <Typography><strong>Heures Sup:</strong> {validationEntry?.presence?.overtimeHours}</Typography>
                        <Typography><strong>Absences:</strong> {validationEntry?.presence?.absences}</Typography>

                        {/* Display Employee Primes */}
                        <Box mt={1} mb={1}>
                            <Typography variant="subtitle2">Détails des Primes (Saisis par l'employé) :</Typography>
                            {validationEntry?.primes && validationEntry.primes.length > 0 ? (
                                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                    {validationEntry.primes.map((prime, index) => (
                                        <li key={index}>
                                            <Typography variant="body2">
                                                <strong>{prime.type}:</strong> {prime.amount} TND
                                                {prime.description && <span style={{ color: 'gray' }}> ({prime.description})</span>}
                                            </Typography>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>Aucune prime saisie.</Typography>
                            )}
                        </Box>

                        <Box my={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                            <Typography variant="caption">CALCUL SYSTÈME</Typography>
                            <Typography>Salaire Brut: {validationEntry?.calculations?.grossSalary} TND</Typography>
                            <Typography>Retenues: {(validationEntry?.calculations?.socialCharges + validationEntry?.calculations?.tax).toFixed(2)} TND</Typography>
                            <Typography variant="h6" color="primary">Net à Payer: {validationEntry?.calculations?.netSalary} TND</Typography>
                        </Box>

                        <TextField
                            label="Commentaire RH (ex: rejet)"
                            fullWidth
                            multiline
                            rows={3}
                            value={rhComment}
                            onChange={(e) => setRhComment(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => confirmValidate('REJECTED')} color="error">Rejeter</Button>
                    <Button onClick={() => confirmValidate('VALIDATED')} variant="contained" color="success">Valider</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RHPayrollDashboard;
