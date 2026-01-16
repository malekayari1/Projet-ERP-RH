import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  BarChart as ReportsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Description as ContractIcon,
  Payments as PayrollIcon,
  EventBusy as LeaveIcon,
  GroupAdd as RecruitmentIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

// Contenu principal : plus de décalage latéral, le drawer sera toujours flottant
const Main = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

// AppBar standard (ne se décale plus quand le drawer est ouvert)
const AppBarStyled = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const menuItems = [
    { text: 'Accueil', icon: <HomeIcon />, path: '/' },
    { text: 'Performance', icon: <DashboardIcon />, path: '/evaluations/performance' },

    // Modules RH / Direction
    { text: 'Auto-E-mails', icon: <EmailIcon />, path: '/emails', roles: ['rh', 'directeur', 'manager'] },
    { text: 'Contrats', icon: <ContractIcon />, path: '/contracts', roles: ['rh', 'directeur'] },
    { text: 'Recrutement', icon: <RecruitmentIcon />, path: '/recruitment', roles: ['rh', 'directeur', 'manager'] },

    // Modules Communs
    { text: 'Paie', icon: <PayrollIcon />, path: '/payroll', roles: ['rh', 'directeur', 'employee'] },
    { text: 'Congés', icon: <LeaveIcon />, path: '/leave' },

    // Sections spécifiques Campagnes (existant)
    { text: 'Campagnes', icon: <AssessmentIcon />, path: '/campaigns', roles: ['rh', 'directeur'] },
    { text: 'Gérer évaluations', icon: <AssessmentIcon />, path: '/evaluations/rh', roles: ['rh', 'directeur'] },
    { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/users', roles: ['rh', 'directeur'] },
    { text: 'Rapports', icon: <ReportsIcon />, path: '/reports', roles: ['rh', 'directeur'] },

    // Rôles spécifiques
    { text: 'Évaluer équipe', icon: <AssessmentIcon />, path: '/evaluations/chef-equipe', roles: ['chef_equipe'] },
    { text: 'Valider (Manager)', icon: <AssessmentIcon />, path: '/evaluations/manager', roles: ['manager'] },
    { text: 'Mes évaluations', icon: <AssessmentIcon />, path: '/my-evaluations', roles: ['employee'] },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const isActive = (path) => {
    return location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path));
  };

  const drawer = (
    <div>
      <DrawerHeader>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
          ERP RH
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{
              marginRight: 2,
              ...(mobileOpen && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => isActive(item.path))?.text || 'Tableau de bord'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Profil">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-search-account-menu"
                aria-haspopup="true"
                color="inherit"
              >
                <Avatar
                  alt={user?.fullName}
                  src={user?.avatar}
                  sx={{ width: 32, height: 32 }}
                >
                  {user?.fullName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBarStyled>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Main>
        <DrawerHeader />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Main>

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        id="primary-search-account-menu"
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profil
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Déconnexion
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
