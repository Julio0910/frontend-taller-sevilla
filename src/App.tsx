import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { 
  CssBaseline, AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider 
} from '@mui/material';

// ÍCONOS
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EngineeringIcon from '@mui/icons-material/Engineering'; 
import CarRepairIcon from '@mui/icons-material/CarRepair'; 
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import ContactsIcon from '@mui/icons-material/Contacts';
import MenuIcon from '@mui/icons-material/Menu'; // <-- Nuevo ícono de hamburguesa

import HomeScreen from './pages/HomeScreen';
import PosScreen from './pages/PosScreen';
import InventoryScreen from './pages/InventoryScreen';
import SalesHistoryScreen from './pages/SalesHistoryScreen';
import RestockScreen from './pages/RestockScreen';
import LoginScreen from './pages/LoginScreen';
import ClientsScreen from './pages/ClientsScreen';
import WorkersScreen from './pages/WorkersScreen';
import InternalSalesScreen from './pages/InternalSalesScreen';

function App() {
  const [estaLogueado, setEstaLogueado] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false); // <-- Estado para el menú lateral

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('tallerSevillaAuth');
    if (sesionGuardada === 'true') {
      setEstaLogueado(true);
    }
  }, []);

  const iniciarSesion = () => {
    localStorage.setItem('tallerSevillaAuth', 'true');
    setEstaLogueado(true);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('tallerSevillaAuth');
    setEstaLogueado(false);
  };

  const toggleMenuMovil = () => {
    setMenuMovilAbierto(!menuMovilAbierto);
  };

  if (!estaLogueado) {
    return <LoginScreen onLoginExitoso={iniciarSesion} />;
  }

  // --- LISTA DE ENLACES PARA EL MENÚ (Para no repetir código) ---
  const enlacesMenu = [
    { texto: 'Inicio', ruta: '/', icono: <HomeIcon /> },
    { texto: 'Caja', ruta: '/caja', icono: <EngineeringIcon /> },
    { texto: 'Inventario', ruta: '/inventario', icono: <InventoryIcon /> },
    { texto: 'Control Mercadería', ruta: '/ingreso', icono: <LocalShippingIcon /> },
    { texto: 'Clientes', ruta: '/clientes', icono: <ContactsIcon /> },
    { texto: 'Reportes', ruta: '/ventas', icono: <ReceiptIcon /> },
    { texto: 'Trabajadores', ruta: '/trabajadores', icono: <EngineeringIcon /> },
    { texto: 'Registro Interno', ruta: '/registro-interno', icono: <EngineeringIcon /> },
  ];

  return (
    <BrowserRouter>
      <CssBaseline />
      
      <AppBar position="static" sx={{ backgroundColor: '#1e3a8a', boxShadow: 6 }} className="no-print">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          
          {/* TÍTULO RESPONSIVO */}
          <Typography variant="h6" sx={{ fontWeight: '900', display: 'flex', alignItems: 'center', letterSpacing: 1, color: '#fff', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            <CarRepairIcon sx={{ mr: 1.5, fontSize: { xs: 24, sm: 32 } }} /> 
            TALLER SEVILLA 
            {/* Ocultamos "EL PROGRESO" en celulares muy pequeños para que no se desborde */}
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, color: '#93c5fd', marginLeft: '10px', fontSize: '1rem', fontWeight: 'bold' }}>
              | EL PROGRESO
            </Box>
          </Typography>
          
          {/* --- MENÚ PARA COMPUTADORAS (Se oculta en pantallas lg y menores) --- */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center' }}>
            {enlacesMenu.map((enlace) => (
              <Button key={enlace.texto} color="inherit" component={Link} to={enlace.ruta} startIcon={enlace.icono} sx={{ mr: 0.5, fontWeight: 'bold', fontSize: '0.8rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
                {enlace.texto}
              </Button>
            ))}
            
            <Tooltip title="Cerrar Sesión">
              <IconButton color="error" onClick={cerrarSesion} sx={{ ml: 1, backgroundColor: '#fff', '&:hover': { backgroundColor: '#fef08a' } }}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* --- BOTÓN DE HAMBURGUESA PARA CELULARES (Se muestra en pantallas md y menores) --- */}
          <IconButton color="inherit" edge="end" onClick={toggleMenuMovil} sx={{ display: { xs: 'flex', lg: 'none' } }}>
            <MenuIcon fontSize="large" />
          </IconButton>

        </Toolbar>
      </AppBar>

      {/* --- PANEL LATERAL DESLIZABLE (DRAWER) PARA CELULARES --- */}
      <Drawer anchor="right" open={menuMovilAbierto} onClose={toggleMenuMovil}>
        <Box sx={{ width: 260, backgroundColor: '#f8fafc', height: '100%' }} role="presentation" onClick={toggleMenuMovil} onKeyDown={toggleMenuMovil}>
          <Box sx={{ p: 2, backgroundColor: '#1e3a8a', color: '#fff', display: 'flex', alignItems: 'center' }}>
            <CarRepairIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">Menú Principal</Typography>
          </Box>
          <Divider />
          <List>
            {enlacesMenu.map((enlace) => (
              <ListItem key={enlace.texto} disablePadding>
                <ListItemButton component={Link} to={enlace.ruta} sx={{ '&:hover': { backgroundColor: '#e2e8f0' } }}>
                  <ListItemIcon sx={{ color: '#1e3a8a' }}>
                    {enlace.icono}
                  </ListItemIcon>
                  <ListItemText primary={<Typography fontWeight="bold" color="#334155">{enlace.texto}</Typography>} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={cerrarSesion} sx={{ '&:hover': { backgroundColor: '#fee2e2' } }}>
                <ListItemIcon sx={{ color: '#dc2626' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={<Typography fontWeight="bold" color="#dc2626">Cerrar Sesión</Typography>} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* CONTENIDO PRINCIPAL DE LAS PANTALLAS */}
      <Box sx={{ height: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/caja" element={<PosScreen />} />
          <Route path="/inventario" element={<InventoryScreen />} />
          <Route path="/ventas" element={<SalesHistoryScreen />} />
          <Route path="/ingreso" element={<RestockScreen />} />
          <Route path="/clientes" element={<ClientsScreen />} /> 
          <Route path="/trabajadores" element={<WorkersScreen />} /> 
          <Route path="/registro-interno" element={<InternalSalesScreen />} /> 
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;