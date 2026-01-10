import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      p={3}
    >
      <Typography variant="h1" color="primary" sx={{ fontSize: 120, fontWeight: 'bold' }}>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        Page non trouvée
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 400 }}>
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </Typography>
      <Button
        variant="contained"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/')}
        size="large"
      >
        Retour à l'accueil
      </Button>
    </Box>
  );
};

export default NotFoundPage;

