import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import {
    Email as EmailIcon,
    Send as SendIcon,
    History as HistoryIcon,
    Settings as SettingsIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    AutoFixHigh as AutomationIcon,
    Edit as EditIcon,
    NotificationsActive as ReminderIcon,
    Assignment as AssignmentIcon,
    FactCheck as ValidationIcon,
    UploadFile as UploadIcon,
    Visibility as ViewIcon,
    AttachFile as FileIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const EmailAutomationPage = () => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [tasks, setTasks] = useState({ missingDocs: [], trialPending: [] });
    const [pendingDocs, setPendingDocs] = useState([]);
    const [myTasks, setMyTasks] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [selectedDocName, setSelectedDocName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [testUser, setTestUser] = useState({ id: '', docs: '' });
    const fileInputRef = useRef(null);

    const isPowerUser = ['rh', 'directeur'].includes(user?.role);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                api.get('/emails/templates'),
                api.get('/emails/logs'),
                api.get('/emails/tasks'),
                !isPowerUser ? api.get('/emails/my-tasks') : Promise.resolve({ data: null }),
                isPowerUser ? api.get('/documents/pending') : Promise.resolve({ data: [] })
            ]);

            if (results[0].status === 'fulfilled') setTemplates(results[0].value.data);
            if (results[1].status === 'fulfilled') setLogs(results[1].value.data);
            if (results[2].status === 'fulfilled') setTasks(results[2].value.data);
            if (results[3].status === 'fulfilled') setMyTasks(results[3].value.data);
            if (results[4].status === 'fulfilled') setPendingDocs(results[4].value.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRunAutomation = async () => {
        try {
            await api.post('/emails/run-automation');
            alert('Analyse lancée : Détection des documents manquants et périodes d\'essai terminées.');
            fetchData();
        } catch (err) {
            console.error('Automation Error:', err);
            const msg = err.response?.data?.message || err.message;
            alert('Erreur lors du lancement d\'analyse : ' + msg);
        }
    };

    const handleValidateTrial = async (userId, status) => {
        try {
            await api.post('/emails/validate-trial', { userId, status });
            alert(`Période d'essai ${status === 'validated' ? 'validée' : 'refusée'} !`);
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            alert('Erreur lors de la validation : ' + msg);
        }
    };

    const handleVerifyDocument = async (docId, status, rejectionReason = '') => {
        try {
            await api.post('/documents/verify', { docId, status, rejectionReason });
            alert(`Document ${status === 'verified' ? 'validé' : 'rejeté'} !`);
            fetchData();
        } catch (err) {
            alert('Erreur lors de la vérification.');
        }
    };

    const handleSendReminder = async () => {
        if (!testUser.id) return alert('Veuillez entrer un ID employé');
        try {
            await api.post('/emails/send-reminder', {
                userId: testUser.id,
                templateName: 'DOC_REMINDER',
                additionalInfo: testUser.docs
            });
            alert('Rappel envoyé et loggé !');
            setOpenDialog(false);
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            alert('Erreur d\'envoi : ' + msg);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Basic size check (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Le fichier est trop volumineux (max 5Mo).");
                return;
            }

            // Specific type checks
            if (selectedDocName === 'Photo' && !file.type.startsWith('image/')) {
                alert("Veuillez sélectionner une image pour la Photo.");
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleUploadDocument = async () => {
        if (!selectedFile) return alert("Veuillez sélectionner un fichier avant d'envoyer.");

        try {
            const formData = new FormData();
            formData.append('name', selectedDocName);
            formData.append('file', selectedFile);

            await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert(`Document ${selectedDocName} envoyé avec succès ! Il est maintenant en attente de vérification par le RH.`);
            setOpenUploadDialog(false);
            setSelectedFile(null);
            fetchData();
        } catch (err) {
            console.error('Upload Error:', err);
            const msg = err.response?.data?.message || "Erreur lors de l'envoi du document.";
            alert(msg);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    // Get restricted accept types based on document name
    const getAcceptTypes = () => {
        if (selectedDocName === 'Photo') return "image/jpeg,image/png";
        if (selectedDocName === 'RIB') return ".pdf,image/jpeg,image/png";
        return ".pdf,image/jpeg,image/png,.doc,.docx";
    };

    return (
        <Box sx={{ p: 4 }}>
            {/* Header Area */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: 'primary.main', mb: 1 }}>
                        Email Automation Hub
                    </Typography>
                    <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 600 }}>
                        {isPowerUser ?
                            "Gérez les flux de communication automatiques et surveillez les triggers ERP selon le workflow BPMN." :
                            "Consultez les communications reçues et vos tâches de workflow liées à l'automatisation."
                        }
                    </Typography>
                    <Divider sx={{ mt: 2, width: 100, borderBottomWidth: 4, borderRadius: 2, borderColor: 'primary.main' }} />
                </Box>
                {isPowerUser ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Card variant="outlined" sx={{ px: 2, display: 'flex', alignItems: 'center', borderColor: 'success.light', bgcolor: 'success.50' }}>
                            <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                            <Typography variant="caption" fontWeight="bold">Workflow Online</Typography>
                        </Card>
                        <Button
                            variant="contained"
                            startIcon={<AutomationIcon />}
                            onClick={handleRunAutomation}
                            size="large"
                            sx={{ borderRadius: 3, py: 1.5, px: 3, boxShadow: 4 }}
                        >
                            Trigger ERP Analyse
                        </Button>
                    </Box>
                ) : (
                    <Card variant="outlined" sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', borderColor: 'primary.light', bgcolor: 'primary.50' }}>
                        <Typography variant="caption" fontWeight="bold">Statut: {user?.role?.toUpperCase()} | Connecté</Typography>
                    </Card>
                )}
            </Box>

            {/* Main Interface */}
            <Paper sx={{ width: '100%', mb: 4, borderRadius: 4, overflow: 'hidden', boxShadow: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab icon={<HistoryIcon />} iconPosition="start" label="Historique & Logs" />
                    {isPowerUser ? (
                        [
                            <Tab key="temp" icon={<SettingsIcon />} iconPosition="start" label="Configuration" />,
                            <Tab key="rem" icon={<ReminderIcon />} iconPosition="start" label="Rappels & Workflow" />,
                            <Tab key="verif" icon={<ValidationIcon />} iconPosition="start" label="Vérification Docs" />
                        ]
                    ) : (
                        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Mes Actions Workflow" />
                    )}
                </Tabs>

                {/* --- Tab 0: Logs --- */}
                {tabValue === 0 && (
                    <Box sx={{ p: 3 }}>
                        <TableContainer component={Box}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date & Heure</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Destinataire</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Sujet du Message</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Déclencheur Workflow</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log._id} hover>
                                            <TableCell>{new Date(log.sentAt).toLocaleString('fr-FR')}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ mr: 1.5, width: 32, height: 32, bgcolor: 'primary.light', fontSize: 14 }}>
                                                        {log.recipientId?.fullName?.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">{log.recipientId?.fullName}</Typography>
                                                        <Typography variant="caption" color="textSecondary">{log.recipientId?.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{log.subject}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={log.status === 'sent' ? 'Délivré' : 'Echec'}
                                                    color={log.status === 'sent' ? 'success' : 'error'}
                                                    variant="outlined"
                                                    sx={{ borderRadius: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                                    {log.senderId ? `Action: ${log.senderId.fullName}` : 'Automatisation ERP'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                                <Typography color="textSecondary">Aucun envoi enregistré dans le workflow pour le moment.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* --- Power User Specific Contents --- */}
                {isPowerUser && (
                    <>
                        {tabValue === 1 && (
                            <Box sx={{ p: 4 }}>
                                <Grid container spacing={3}>
                                    {templates.map((temp) => (
                                        <Grid item xs={12} md={6} lg={4} key={temp._id}>
                                            <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                                <CardHeader
                                                    avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><SettingsIcon /></Avatar>}
                                                    title={<Typography fontWeight="bold">{temp.name}</Typography>}
                                                    subheader={temp.description}
                                                    action={<IconButton><EditIcon /></IconButton>}
                                                />
                                                <CardContent>
                                                    <Typography variant="subtitle2" color="primary" gutterBottom>Sujet: {temp.subject}</Typography>
                                                    <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, minHeight: 120 }}>
                                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                                                            {temp.body}
                                                        </Typography>
                                                    </Paper>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                        {tabValue === 2 && (
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>Documents Manquants (Workflow RH)</Typography>
                                        <List>
                                            {tasks.missingDocs.map(user => (
                                                <ListItem key={user._id} divider sx={{ flexWrap: 'wrap' }}>
                                                    <ListItemText
                                                        primary={user.fullName}
                                                        secondary={`Manque: ${user.missingDocuments.join(", ")}`}
                                                    />
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<ReminderIcon />}
                                                        onClick={() => {
                                                            setTestUser({ id: user._id, docs: user.missingDocuments.join(", ") });
                                                            setOpenDialog(true);
                                                        }}
                                                    >
                                                        Relancer Manuellement
                                                    </Button>
                                                </ListItem>
                                            ))}
                                            {tasks.missingDocs.length === 0 && <Typography color="textSecondary">Aucun document manquant détecté.</Typography>}
                                        </List>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>Périodes d'essai à suivre (Manager)</Typography>
                                        <List>
                                            {tasks.trialPending.map(u => (
                                                <ListItem key={u._id} divider sx={{ flexWrap: 'wrap' }}>
                                                    <ListItemText
                                                        primary={u.fullName}
                                                        secondary={`Fin prévue: ${new Date(u.trialPeriodEnd).toLocaleDateString()}`}
                                                    />
                                                    <Box sx={{ mt: 1 }}>
                                                        <Chip label="En attente Manager" size="small" variant="outlined" color="warning" />
                                                    </Box>
                                                </ListItem>
                                            ))}
                                            {tasks.trialPending.length === 0 && <Typography color="textSecondary">Aucune validation en attente.</Typography>}
                                        </List>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                        {tabValue === 3 && (
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>Documents en attente de vérification</Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Employé</TableCell>
                                                <TableCell>Document</TableCell>
                                                <TableCell>Soumis le</TableCell>
                                                <TableCell>Fichier</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendingDocs.map(doc => (
                                                <TableRow key={doc._id}>
                                                    <TableCell>{doc.employeeId?.fullName}</TableCell>
                                                    <TableCell>{doc.name}</TableCell>
                                                    <TableCell>{new Date(doc.uploadedAt).toLocaleString()}</TableCell>
                                                    <TableCell><Chip size="small" icon={<ViewIcon />} label="Voir fichier" onClick={() => window.open(`http://localhost:5001${doc.fileUrl}`, '_blank')} /></TableCell>
                                                    <TableCell align="right">
                                                        <Button color="success" onClick={() => handleVerifyDocument(doc._id, 'verified')}>Valider</Button>
                                                        <Button color="error" onClick={() => {
                                                            const reason = prompt("Motif du rejet :");
                                                            if (reason) handleVerifyDocument(doc._id, 'rejected', reason);
                                                        }}>Rejeter</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {pendingDocs.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                        Toutes les vérifications sont à jour. ✓
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </>
                )}

                {/* --- NON-Power User Specific Content --- */}
                {!isPowerUser && tabValue === 1 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Avatar sx={{ m: 'auto', width: 80, height: 80, bgcolor: 'secondary.light', mb: 3 }}>
                            {user?.role === 'manager' ? <ValidationIcon sx={{ fontSize: 40 }} /> : <UploadIcon sx={{ fontSize: 40 }} />}
                        </Avatar>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            {user?.role === 'manager' ? "Validation de Période d'Essai" : "Mise à jour Dossier RH"}
                        </Typography>

                        {user?.role === 'manager' ? (
                            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                                <Typography color="textSecondary" sx={{ mb: 4 }}>
                                    Selon le workflow ERP, vous devez valider la période d'essai de vos collaborateurs.
                                </Typography>
                                <List sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                                    {tasks.trialPending.map(u => (
                                        <ListItem key={u._id} divider>
                                            <ListItemText
                                                primary={u.fullName}
                                                secondary={`Échéance : ${new Date(u.trialPeriodEnd).toLocaleDateString()}`}
                                            />
                                            <IconButton color="success" onClick={() => handleValidateTrial(u._id, 'validated')}><CheckCircleIcon /></IconButton>
                                            <IconButton color="error" onClick={() => handleValidateTrial(u._id, 'rejected')}><ErrorIcon /></IconButton>
                                        </ListItem>
                                    ))}
                                    {tasks.trialPending.length === 0 && <Typography sx={{ p: 4 }}>Toutes vos validations sont à jour. ✓</Typography>}
                                </List>
                            </Box>
                        ) : (
                            <Box sx={{ maxWidth: 650, mx: 'auto' }}>
                                <Typography color="textSecondary" sx={{ mb: 4 }}>
                                    Suivi de votre dossier administratif (Collection Docs)
                                </Typography>

                                {myTasks && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                                <Typography variant="subtitle2" gutterBottom>Documents Validés ({myTasks.verifiedDocuments?.length || 0})</Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {myTasks.verifiedDocuments?.map(d => <Chip key={d} label={d} size="small" color="success" />)}
                                                    {myTasks.verifiedDocuments?.length === 0 && <Typography variant="caption">Aucun document validé.</Typography>}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'error.light', bgcolor: 'error.50', borderRadius: 3 }}>
                                                <Typography variant="subtitle2" color="error" gutterBottom>Action Requise : Documents Rejetés/Manquants</Typography>
                                                <List dense>
                                                    {myTasks.rejectedDocuments?.map(d => (
                                                        <ListItem
                                                            key={d.name}
                                                            secondaryAction={
                                                                <IconButton edge="end" color="error" onClick={() => { setSelectedDocName(d.name); setOpenUploadDialog(true); }}>
                                                                    <UploadIcon />
                                                                </IconButton>
                                                            }
                                                        >
                                                            <ListItemText primary={d.name} secondary={`Motif: ${d.reason}`} primaryTypographyProps={{ color: 'error', fontWeight: 'bold' }} />
                                                        </ListItem>
                                                    ))}
                                                    {myTasks.missingDocuments?.map(d => (
                                                        <ListItem
                                                            key={d}
                                                            secondaryAction={
                                                                <IconButton edge="end" color="primary" onClick={() => { setSelectedDocName(d); setOpenUploadDialog(true); }}>
                                                                    <UploadIcon />
                                                                </IconButton>
                                                            }
                                                        >
                                                            <ListItemText primary={d} secondary="À fournir impérativement" />
                                                        </ListItem>
                                                    ))}
                                                    {myTasks.rejectedDocuments?.length === 0 && myTasks.missingDocuments?.length === 0 && (
                                                        <Typography variant="caption" sx={{ p: 2, display: 'block' }}>Votre dossier est complet et à jour. ✓</Typography>
                                                    )}
                                                </List>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.50', borderRadius: 3 }}>
                                                <Typography variant="subtitle2" color="primary" gutterBottom>Période d'Essai</Typography>
                                                <Typography variant="h5" fontWeight="bold">{myTasks.trialStatus?.toUpperCase()}</Typography>
                                                <Typography variant="caption">Fin prévue le {new Date(myTasks.trialEnd).toLocaleDateString()}</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            {/* --- Dialogs --- */}

            {/* Manual Reminder Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: 4, width: 500 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Nouveau Rappel Manuel RH</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField label="ID de l'employé" fullWidth variant="filled" value={testUser.id} onChange={(e) => setTestUser({ ...testUser, id: e.target.value })} />
                        <TextField label="Documents à réclamer" multiline rows={4} fullWidth variant="filled" value={testUser.docs} onChange={(e) => setTestUser({ ...testUser, docs: e.target.value })} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} color="inherit">Annuler</Button>
                    <Button onClick={handleSendReminder} variant="contained" startIcon={<SendIcon />} sx={{ borderRadius: 2 }}>Expédier</Button>
                </DialogActions>
            </Dialog>

            {/* Document Upload Dialog */}
            <Dialog open={openUploadDialog} onClose={() => { setOpenUploadDialog(false); setSelectedFile(null); }} PaperProps={{ sx: { borderRadius: 4, width: 400 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Charger {selectedDocName}</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                        <input
                            type="file"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Box
                            sx={{
                                mt: 1,
                                p: 4,
                                border: '2px dashed',
                                borderColor: selectedFile ? 'primary.main' : 'divider',
                                borderRadius: 3,
                                bgcolor: 'grey.50',
                                cursor: 'pointer',
                                transition: '0.3s',
                                '&:hover': { bgcolor: 'grey.100', borderColor: 'primary.light' }
                            }}
                            onClick={() => fileInputRef.current.click()}
                        >
                            {selectedFile ? (
                                <Box>
                                    <FileIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                    <Typography variant="body2" fontWeight="bold">{selectedFile.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body2">Cliquez pour choisir un fichier</Typography>
                                    <Typography variant="caption" color="textSecondary">PDF, JPG, PNG (Max 5MB)</Typography>
                                </Box>
                            )}
                        </Box>
                        <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
                            Document : {selectedDocName}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => { setOpenUploadDialog(false); setSelectedFile(null); }} color="inherit">Annuler</Button>
                    <Button
                        onClick={handleUploadDocument}
                        variant="contained"
                        disabled={!selectedFile}
                        startIcon={<CheckCircleIcon />}
                        sx={{ borderRadius: 2 }}
                    >
                        Confirmer l'envoi
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmailAutomationPage;
