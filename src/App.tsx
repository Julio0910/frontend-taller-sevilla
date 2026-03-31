import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EngineeringIcon from '@mui/icons-material/Engineering'; 
import CarRepairIcon from '@mui/icons-material/CarRepair'; 
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import ContactsIcon from '@mui/icons-material/Contacts'; // <-- Nuevo ícono de libreta

import HomeScreen from './pages/HomeScreen';
import PosScreen from './pages/PosScreen';
import InventoryScreen from './pages/InventoryScreen';
import SalesHistoryScreen from './pages/SalesHistoryScreen';
import RestockScreen from './pages/RestockScreen';
import LoginScreen from './pages/LoginScreen';
import ClientsScreen from './pages/ClientsScreen'; // <-- Nueva pantalla de Clientes
import WorkersScreen from './pages/WorkersScreen';
import InternalSalesScreen from './pages/InternalSalesScreen';

function App() {
  const [estaLogueado, setEstaLogueado] = useState(false);

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

  if (!estaLogueado) {
    return <LoginScreen onLoginExitoso={iniciarSesion} />;
  }

  return (
    <BrowserRouter>
      <CssBaseline />
      
      <AppBar position="static" sx={{ backgroundColor: '#1e3a8a', boxShadow: 6 }} className="no-print">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          
          <Typography variant="h5" sx={{ fontWeight: '900', display: 'flex', alignItems: 'center', letterSpacing: 1, color: '#fff' }}>
            <CarRepairIcon sx={{ mr: 1.5, fontSize: 32 }} /> TALLER SEVILLA <span style={{ color: '#93c5fd', marginLeft: '10px', fontSize: '1rem', fontWeight: 'bold' }}>| EL PROGRESO</span>
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button color="inherit" component={Link} to="/" startIcon={<HomeIcon />} sx={{ mr: 1, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Inicio
            </Button>
            <Button color="inherit" component={Link} to="/caja" startIcon={<EngineeringIcon />} sx={{ mr: 1, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Caja
            </Button>
            <Button color="inherit" component={Link} to="/inventario" startIcon={<InventoryIcon />} sx={{ mr: 1, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Inventario
            </Button>
            <Button color="inherit" component={Link} to="/ingreso" startIcon={<LocalShippingIcon />} sx={{ mr: 1, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Control de Mercaderia
            </Button>
            
            {/* --- NUEVO BOTÓN: CLIENTES --- */}
            <Button color="inherit" component={Link} to="/clientes" startIcon={<ContactsIcon />} sx={{ mr: 1, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Clientes
            </Button>

            <Button color="inherit" component={Link} to="/ventas" startIcon={<ReceiptIcon />} sx={{ mr: 2, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Reportes
            </Button>

            <Button color="inherit" component={Link} to="/trabajadores" startIcon={<EngineeringIcon />} sx={{ mr: 2, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Trabajadores
            </Button>
            
            <Button color="inherit" component={Link} to="/registro-interno" startIcon={<EngineeringIcon />} sx={{ mr: 2, fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', '&:hover': { color: '#fb923c' } }}>
              Registro Interno
            </Button>
            
            <Tooltip title="Cerrar Sesión y Bloquear Sistema">
              <IconButton color="error" onClick={cerrarSesion} sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fef08a' } }}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ height: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/caja" element={<PosScreen />} />
          <Route path="/inventario" element={<InventoryScreen />} />
          <Route path="/ventas" element={<SalesHistoryScreen />} />
          <Route path="/ingreso" element={<RestockScreen />} />
          <Route path="/clientes" element={<ClientsScreen />} /> {/* <-- Nueva Ruta */}
          <Route path="/trabajadores" element={<WorkersScreen />} /> {/* <-- Nueva Ruta */}
          <Route path="/registro-interno" element={<InternalSalesScreen />} /> {/* <-- Nueva Ruta */} 
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;