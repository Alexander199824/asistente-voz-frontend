import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Dashboard as DashboardIcon,
  Mic as MicIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  PersonAdd as RegisterIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = () => {
  // Estados para los menús
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Obtengo tema y breakpoints para responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Obtengo información y funciones de autenticación
  const { user, logout } = useAuth();
  
  // Hook para navegación
  const navigate = useNavigate();
  
  // Manejadores para menú de usuario
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Manejadores para drawer (menú lateral en móvil)
  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };
  
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };
  
  // Función para cerrar sesión
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/login');
  };
  
  // Contenido del drawer (menú lateral)
  const drawerContent = (
    <Box sx={{ width: 250, pt: 1 }} role="presentation">
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Asistente de Voz
        </Typography>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
        <ListItem 
          button 
          component={RouterLink} 
          to="/assistant"
          onClick={handleDrawerClose}
        >
          <ListItemIcon>
            <MicIcon />
          </ListItemIcon>
          <ListItemText primary="Asistente" />
        </ListItem>
        
        {user && (
          <>
            <ListItem 
              button 
              component={RouterLink} 
              to="/dashboard"
              onClick={handleDrawerClose}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Panel de Control" />
            </ListItem>
            
            <ListItem 
              button 
              component={RouterLink} 
              to="/history"
              onClick={handleDrawerClose}
            >
              <ListItemIcon>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText primary="Historial" />
            </ListItem>
            
            <ListItem 
              button 
              component={RouterLink} 
              to="/settings"
              onClick={handleDrawerClose}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configuración" />
            </ListItem>
          </>
        )}
      </List>
      
      <Divider />
      
      <List>
        {user ? (
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItem>
        ) : (
          <>
            <ListItem 
              button 
              component={RouterLink} 
              to="/login"
              onClick={handleDrawerClose}
            >
              <ListItemIcon>
                <LoginIcon />
              </ListItemIcon>
              <ListItemText primary="Iniciar Sesión" />
            </ListItem>
            
            <ListItem 
              button 
              component={RouterLink} 
              to="/register"
              onClick={handleDrawerClose}
            >
              <ListItemIcon>
                <RegisterIcon />
              </ListItemIcon>
              <ListItemText primary="Registrarse" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );
  
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerOpen}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            component={RouterLink}
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <MicIcon sx={{ mr: 1 }} />
            Asistente de Voz Inteligente
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/assistant"
                sx={{ mr: 1 }}
              >
                Asistente
              </Button>
              
              {user && (
                <>
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to="/dashboard"
                    sx={{ mr: 1 }}
                  >
                    Panel de Control
                  </Button>
                  
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to="/history"
                    sx={{ mr: 1 }}
                  >
                    Historial
                  </Button>
                </>
              )}
            </Box>
          )}
          
          {user ? (
            <Box>
              <Tooltip title={user.username || 'Usuario'}>
                <IconButton
                  color="inherit"
                  onClick={handleUserMenuOpen}
                  aria-controls="user-menu"
                  aria-haspopup="true"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user.username ? user.username[0].toUpperCase() : <PersonIcon />}
                  </Avatar>
                </IconButton>
              </Tooltip>
              
              <Menu
                id="user-menu"
                anchorEl={userMenuAnchor}
                keepMounted
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
              >
                <MenuItem 
                  component={RouterLink} 
                  to="/settings"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Configuración
                </MenuItem>
                
                <Divider />
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              {!isMobile ? (
                <>
                  <Button 
                    color="inherit"
                    component={RouterLink}
                    to="/login"
                    sx={{ mr: 1 }}
                  >
                    Iniciar Sesión
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    color="inherit"
                    component={RouterLink}
                    to="/register"
                  >
                    Registrarse
                  </Button>
                </>
              ) : (
                <IconButton
                  color="inherit"
                  onClick={handleDrawerOpen}
                >
                  <AccountCircle />
                </IconButton>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerClose}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Header;