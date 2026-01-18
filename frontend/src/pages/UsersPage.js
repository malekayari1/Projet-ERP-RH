import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  InputAdornment,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PersonOff as PersonOffIcon,
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import * as api from '../services/api';

const roleConfig = {
  employee: { label: 'Employé', color: 'default' },
  chef_equipe: { label: 'Chef d\'équipe', color: 'info' },
  manager: { label: 'Manager', color: 'warning' },
  rh: { label: 'RH', color: 'secondary' },
  directeur: { label: 'Directeur', color: 'error' }
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [chefsEquipe, setChefsEquipe] = useState([]);
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    supervisorId: '',
    managerId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        api.getUsers(),
        api.getDepartments()
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);

      // Récupérer les chefs d'équipe et managers pour les listes déroulantes
      const chefs = usersRes.data.filter(u => u.role === 'chef_equipe' && u.isActive);
      const mgrs = usersRes.data.filter(u => u.role === 'manager' && u.isActive);
      setChefsEquipe(chefs);
      setManagers(mgrs);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department || '',
        supervisorId: user.supervisorId?._id || '',
        managerId: user.managerId?._id || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        supervisorId: '',
        managerId: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password) delete dataToSend.password;
      if (!dataToSend.supervisorId) dataToSend.supervisorId = null;
      if (!dataToSend.managerId) dataToSend.managerId = null;

      if (editingUser) {
        await api.updateUser(editingUser._id, dataToSend);
        setSuccess('Utilisateur modifié avec succès');
      } else {
        await api.createUser(dataToSend);
        setSuccess('Utilisateur créé avec succès');
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur?')) return;
    try {
      await api.deactivateUser(userId);
      setSuccess('Utilisateur désactivé');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la désactivation');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getStats = () => {
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      byRole: Object.keys(roleConfig).reduce((acc, role) => {
        acc[role] = users.filter(u => u.role === role).length;
        return acc;
      }, {})
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestion des utilisateurs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvel utilisateur
        </Button>
      </Box>

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

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Employés</Typography>
              <Typography variant="h4">{stats.byRole.employee}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Chefs d'équipe</Typography>
              <Typography variant="h4" color="info.main">{stats.byRole.chef_equipe}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Managers</Typography>
              <Typography variant="h4" color="warning.main">{stats.byRole.manager}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 250 }}
          />
          <TextField
            select
            label="Rôle"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tous les rôles</MenuItem>
            {Object.entries(roleConfig).map(([value, config]) => (
              <MenuItem key={value} value={value}>{config.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Département</TableCell>
              <TableCell>Superviseur</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} hover sx={{ opacity: user.isActive ? 1 : 0.5 }}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {user.fullName.charAt(0)}
                    </Avatar>
                    <Typography>{user.fullName}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={roleConfig[user.role]?.label || user.role}
                    color={roleConfig[user.role]?.color || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>
                  {user.supervisorId?.fullName || user.managerId?.fullName || '-'}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.isActive ? 'Actif' : 'Inactif'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {user.isActive && (
                    <Tooltip title="Désactiver">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeactivate(user._id)}
                      >
                        <PersonOffIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" py={3}>
                    Aucun utilisateur trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom complet"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              fullWidth
            />
            <TextField
              select
              label="Rôle"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              fullWidth
            >
              {Object.entries(roleConfig).map(([value, config]) => (
                <MenuItem key={value} value={value}>{config.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Département"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Aucun</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
              <MenuItem value="__new__">
                <em>+ Nouveau département</em>
              </MenuItem>
            </TextField>
            {formData.department === '__new__' && (
              <TextField
                label="Nom du nouveau département"
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                fullWidth
              />
            )}
            {formData.role === 'employee' && (
              <TextField
                select
                label="Chef d'équipe (superviseur)"
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                fullWidth
              >
                <MenuItem value="">Aucun</MenuItem>
                {chefsEquipe.map((chef) => (
                  <MenuItem key={chef._id} value={chef._id}>{chef.fullName}</MenuItem>
                ))}
              </TextField>
            )}
            {formData.role === 'chef_equipe' && (
              <TextField
                select
                label="Manager"
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                fullWidth
              >
                <MenuItem value="">Aucun</MenuItem>
                {managers.map((mgr) => (
                  <MenuItem key={mgr._id} value={mgr._id}>{mgr.fullName}</MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.fullName || !formData.email || (!editingUser && !formData.password)}
          >
            {editingUser ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;

