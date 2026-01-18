import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const roleLabels = {
  employee: 'Employé',
  chef_equipe: 'Chef d\'équipe',
  manager: 'Manager',
  rh: 'Ressources Humaines'
};

const roleColors = {
  employee: 'default',
  chef_equipe: 'info',
  manager: 'warning',
  rh: 'secondary'
};

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mon Profil
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: 48,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {user.fullName?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.fullName}
              </Typography>
              <Chip
                label={roleLabels[user.role] || user.role}
                color={roleColors[user.role] || 'default'}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations personnelles
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Nom complet
                      </Typography>
                      <Typography variant="body1">
                        {user.fullName}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <EmailIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <BadgeIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Rôle
                      </Typography>
                      <Typography variant="body1">
                        {roleLabels[user.role] || user.role}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <BusinessIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Département
                      </Typography>
                      <Typography variant="body1">
                        {user.department || 'Non défini'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;

