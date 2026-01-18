import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Avatar,
    Container,
    Paper,
    Divider,
    Button,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Email as EmailIcon,
    Description as ContractIcon,
    Payments as PayrollIcon,
    Assessment as PerformanceIcon,
    EventBusy as LeaveIcon,
    GroupAdd as RecruitmentIcon,
    Download as DownloadIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    Campaign as CampaignIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Notifications as NotificationsIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Custom Styled Components
const HeroSection = styled(Paper)(({ theme }) => ({
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    marginBottom: theme.spacing(4),
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
}));

const StatCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
    }
}));

const QuickActionCard = styled(Card)(({ theme }) => ({
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
    }
}));

const HomePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeCampaigns: 0,
        pendingEvaluations: 0,
        pendingLeaves: 0,
        avgScore: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        if (['rh', 'directeur', 'chef_equipe', 'manager'].includes(user?.role)) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, activitiesRes] = await Promise.all([
                api.getDashboardStats(),
                api.getRecentActivities()
            ]);
            setStats(dashboardRes.data);
            setRecentActivities(activitiesRes.data.slice(0, 5));
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const generatePDFReport = async () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(102, 126, 234);
        doc.text('Récapitulatif Général - ERP RH', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
        doc.text(`Par: ${user?.fullName} (${user?.role})`, 14, 33);

        // Statistics Section
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Statistiques Globales', 14, 45);

        const statsData = [
            ['Indicateur', 'Valeur'],
            ['Total Employés', (stats.totalEmployees || 0).toString()],
            ['Campagnes Actives', (stats.activeCampaigns || 0).toString()],
            ['Évaluations En Attente', (stats.pendingEvaluations || 0).toString()],
            ['Demandes de Congé En Attente', (stats.pendingLeaves || 0).toString()],
            ['Score Moyen', `${stats.avgScore || 0}%`]
        ];

        autoTable(doc, {
            startY: 50,
            head: [statsData[0]],
            body: statsData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] }
        });

        // Recent Activities
        let finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text('Activités Récentes', 14, finalY);

        const activitiesData = [
            ['Date', 'Description'],
            ...recentActivities.map(activity => [
                new Date(activity.createdAt).toLocaleDateString('fr-FR'),
                activity.description
            ])
        ];

        autoTable(doc, {
            startY: finalY + 5,
            head: [activitiesData[0]],
            body: activitiesData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [102, 126, 234] }
        });

        // Modules Section
        finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text('Modules Disponibles', 14, finalY);

        const modulesData = [
            ['Module', 'Description'],
            ['Email Automation', 'Automatisation des e-mails et dashboard de suivi'],
            ['Gestion des Contrats', 'Suivi, signature et archivage des contrats'],
            ['Paie & Rémunération', 'Gestion des fiches de paie et rémunérations'],
            ['Performance & Évaluation', 'Campagnes d\'évaluation et objectifs SMART'],
            ['Demandes de Congé', 'Gestion des congés et soldes'],
            ['Recrutement', 'Pipeline de recrutement et gestion des talents']
        ];

        autoTable(doc, {
            startY: finalY + 5,
            head: [modulesData[0]],
            body: modulesData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Page ${i} sur ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        doc.save(`Recapitulatif_ERP_RH_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Quick actions for management roles
    const quickActions = [
        {
            title: 'Campagnes',
            icon: <CampaignIcon />,
            path: '/campaigns',
            color: '#667eea',
            roles: ['rh', 'directeur']
        },
        {
            title: 'Utilisateurs',
            icon: <PeopleIcon />,
            path: '/users',
            color: '#764ba2',
            roles: ['rh', 'directeur']
        },
        {
            title: 'Évaluer Équipe',
            icon: <PerformanceIcon />,
            path: '/evaluations/chef-equipe',
            color: '#f093fb',
            roles: ['rh', 'directeur', 'chef_equipe', 'manager']
        },
        {
            title: 'Recrutement',
            icon: <RecruitmentIcon />,
            path: '/recruitment',
            color: '#4facfe',
            roles: ['rh', 'directeur', 'manager']
        }
    ];

    const filteredQuickActions = quickActions.filter(action =>
        action.roles.includes(user?.role)
    );

    // Show simple module view for employees
    if (user?.role === 'employee') {
        const modules = [
            {
                title: 'Email Automation',
                description: 'Automatisation des e-mails et dashboard de suivi.',
                icon: <EmailIcon fontSize="large" />,
                path: '/emails',
                color: '#3f51b5'
            },
            {
                title: 'Mes Contrats',
                description: 'Consultez et signez vos contrats de travail.',
                icon: <ContractIcon fontSize="large" />,
                path: '/contracts',
                color: '#f44336'
            },
            {
                title: 'Ma Paie',
                description: 'Consultez vos fiches de paie.',
                icon: <PayrollIcon fontSize="large" />,
                path: '/payroll',
                color: '#4caf50'
            },
            {
                title: 'Mes Évaluations',
                description: 'Consultez et complétez vos auto-évaluations.',
                icon: <PerformanceIcon fontSize="large" />,
                path: '/my-evaluations',
                color: '#ff9800'
            },
            {
                title: 'Mes Congés',
                description: 'Posez vos congés et suivez vos soldes.',
                icon: <LeaveIcon fontSize="large" />,
                path: '/leave',
                color: '#00bcd4'
            }
        ];

        return (
            <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                <HeroSection>
                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                        Bienvenue, {user?.fullName.split(' ')[0]}
                    </Typography>
                    <Typography variant="h6">
                        Gérez votre carrière et vos demandes en toute simplicité.
                    </Typography>
                </HeroSection>

                <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
                    Vos Services
                </Typography>

                <Grid container spacing={4}>
                    {modules.map((mod, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <QuickActionCard>
                                <CardActionArea onClick={() => navigate(mod.path)} sx={{ p: 3 }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Avatar
                                            sx={{
                                                bgcolor: mod.color,
                                                width: 70,
                                                height: 70,
                                                margin: '0 auto 20px'
                                            }}
                                        >
                                            {mod.icon}
                                        </Avatar>
                                        <Typography variant="h5" gutterBottom fontWeight="bold">
                                            {mod.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {mod.description}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </QuickActionCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        );
    }

    // Management Dashboard
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            {/* Hero Section */}
            <HeroSection>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                            Tableau de Bord {user?.role === 'rh' ? 'RH' : user?.role === 'directeur' ? 'Direction' : 'Manager'}
                        </Typography>
                        <Typography variant="h6">
                            Vue d'ensemble de toutes vos fonctionnalités
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={generatePDFReport}
                        sx={{
                            bgcolor: 'white',
                            color: '#667eea',
                            '&:hover': { bgcolor: '#f0f0f0' }
                        }}
                    >
                        Télécharger Récapitulatif
                    </Button>
                </Box>
            </HeroSection>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <StatCard>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Employés
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.totalEmployees}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: '#667eea' }}>
                                    <PeopleIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <StatCard>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Campagnes
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="primary">
                                        {stats.activeCampaigns}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: '#764ba2' }}>
                                    <CampaignIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <StatCard>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Évaluations
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                                        {stats.pendingEvaluations}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: '#ff9800' }}>
                                    <PendingIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <StatCard>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Congés
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="info.main">
                                        {stats.pendingLeaves}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: '#00bcd4' }}>
                                    <LeaveIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <StatCard>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Score Moyen
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="success.main">
                                        {stats.avgScore}%
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: '#4caf50' }}>
                                    <TrendingUpIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Actions Rapides
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {filteredQuickActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <QuickActionCard onClick={() => navigate(action.path)}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: action.color,
                                        width: 60,
                                        height: 60,
                                        margin: '0 auto 15px'
                                    }}
                                >
                                    {action.icon}
                                </Avatar>
                                <Typography variant="h6" fontWeight="bold">
                                    {action.title}
                                </Typography>
                            </CardContent>
                        </QuickActionCard>
                    </Grid>
                ))}
            </Grid>

            {/* Recent Activities */}
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Activités Récentes
            </Typography>
            <Paper sx={{ p: 2 }}>
                <List>
                    {recentActivities.map((activity, index) => (
                        <React.Fragment key={activity._id}>
                            <ListItem>
                                <ListItemIcon>
                                    <NotificationsIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={activity.description}
                                    secondary={new Date(activity.createdAt).toLocaleString('fr-FR')}
                                />
                            </ListItem>
                            {index < recentActivities.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    {recentActivities.length === 0 && (
                        <ListItem>
                            <ListItemText
                                primary="Aucune activité récente"
                                sx={{ textAlign: 'center', color: 'text.secondary' }}
                            />
                        </ListItem>
                    )}
                </List>
            </Paper>
        </Container>
    );
};

export default HomePage;
