import React from 'react';
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
    Divider
} from '@mui/material';
import {
    Email as EmailIcon,
    Description as ContractIcon,
    Payments as PayrollIcon,
    Assessment as PerformanceIcon,
    EventBusy as LeaveIcon,
    GroupAdd as RecruitmentIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

// Custom Styled Components
const HeroSection = styled(Paper)(({ theme, image }) => ({
    position: 'relative',
    color: '#fff',
    marginBottom: theme.spacing(4),
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${image})`,
    height: '350px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: theme.spacing(6),
    borderRadius: theme.shape.borderRadius * 2,
    overflow: 'hidden',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
}));

const ModuleCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'all 0.3s ease-in-out',
    borderRadius: theme.shape.borderRadius * 2,
    '&:hover': {
        transform: 'translateY(-10px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        '& .MuiAvatar-root': {
            backgroundColor: theme.palette.primary.main,
            color: '#fff'
        }
    }
}));

const HomePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Role-based hero data
    const getHeroData = () => {
        switch (user?.role) {
            case 'rh':
                return {
                    title: 'Bonjour, Responsable RH',
                    subtitle: 'Gérez vos talents et optimisez les processus de l\'entreprise.',
                    image: '/assets/rh_hero.png'
                };
            case 'directeur':
                return {
                    title: 'Tableau de bord de Direction',
                    subtitle: 'Vision stratégique et pilotage de la performance globale.',
                    image: '/assets/director_hero.png'
                };
            case 'chef_equipe':
            case 'manager':
                return {
                    title: `Espace ${user?.role === 'manager' ? 'Manager' : 'Chef d\'Équipe'}`,
                    subtitle: 'Accompagnez votre équipe vers l\'excellence.',
                    image: '/assets/team_hero.png'
                };
            case 'employee':
                return {
                    title: `Bienvenue, ${user?.fullName.split(' ')[0]}`,
                    subtitle: 'Gérez votre carrière et vos demandes en toute simplicité.',
                    image: '/assets/employee_hero.png'
                };
            default:
                return {
                    title: 'Bienvenue sur ERP RH',
                    subtitle: 'Votre plateforme de gestion intégrée.',
                    image: '/assets/employee_hero.png'
                };
        }
    };

    const hero = getHeroData();

    // Available modules with role restrictions
    const modules = [
        {
            title: 'Auto-E-mails',
            description: 'Automatisation des e-mails et dashboard de suivi.',
            icon: <EmailIcon fontSize="large" />,
            path: '/emails',
            roles: ['rh', 'directeur', 'manager'],
            color: '#3f51b5'
        },
        {
            title: 'Gestion des Contrats',
            description: 'Suivi, signature et archivage des contrats de travail.',
            icon: <ContractIcon fontSize="large" />,
            path: '/contracts',
            roles: ['rh', 'directeur'],
            color: '#f44336'
        },
        {
            title: 'Paie & Rémunération',
            description: 'Consultez les fiches de paie et gérez les rémunérations.',
            icon: <PayrollIcon fontSize="large" />,
            path: '/payroll',
            roles: ['rh', 'directeur', 'employee'],
            color: '#4caf50'
        },
        {
            title: 'Performance & Évaluation',
            description: 'Campagnes d\'évaluation et suivi des objectifs SMART.',
            icon: <PerformanceIcon fontSize="large" />,
            path: '/evaluations/performance',
            roles: ['rh', 'directeur', 'manager', 'chef_equipe', 'employee'],
            color: '#ff9800'
        },
        {
            title: 'Demandes de Congé',
            description: 'Posez vos congés et suivez vos soldes restants.',
            icon: <LeaveIcon fontSize="large" />,
            path: '/leave',
            roles: ['rh', 'directeur', 'manager', 'chef_equipe', 'employee'],
            color: '#00bcd4'
        },
        {
            title: 'Recrutement & Embauche',
            description: 'Gérez le pipeline de recrutement et les nouveaux talents.',
            icon: <RecruitmentIcon fontSize="large" />,
            path: '/recruitment',
            roles: ['rh', 'directeur', 'manager'],
            color: '#9c27b0'
        }
    ];

    const filteredModules = modules.filter(mod => mod.roles.includes(user?.role));

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <HeroSection image={hero.image}>
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                    {hero.title}
                </Typography>
                <Typography variant="h5">
                    {hero.subtitle}
                </Typography>
            </HeroSection>

            <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
                Vos Services
            </Typography>

            <Grid container spacing={4}>
                {filteredModules.map((mod, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <ModuleCard>
                            <CardActionArea
                                onClick={() => navigate(mod.path)}
                                sx={{ height: '100%', p: 2 }}
                            >
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: 'background.paper',
                                            color: mod.color,
                                            width: 70,
                                            height: 70,
                                            margin: '0 auto 20px',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                            border: `1px solid ${mod.color}`
                                        }}
                                    >
                                        {mod.icon}
                                    </Avatar>
                                    <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                                        {mod.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {mod.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </ModuleCard>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default HomePage;
