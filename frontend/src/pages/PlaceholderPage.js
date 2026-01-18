import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';

const PlaceholderPage = ({ title }) => {
    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center', borderRadius: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    {title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Ce module est actuellement en cours de développement.
                    Il fera partie de la prochaine mise à jour de l'ERP RH.
                </Typography>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <img
                        src="/api/placeholder/400/300"
                        alt="Coming Soon"
                        style={{ maxWidth: '100%', borderRadius: 8, opacity: 0.6 }}
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default PlaceholderPage;
