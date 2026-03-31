import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableRow, TableHead, Button, Divider, Chip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [productosCriticos, setProductosCriticos] = useState<any[]>([]);
  const [facturasHoy, setFacturasHoy] = useState<any[]>([]);
  const [totalHoy, setTotalHoy] = useState(0);
  const [ultimasVentas, setUltimasVentas] = useState<any[]>([]);

  useEffect(() => {
    cargarDatosResumen();
  }, []);

  const cargarDatosResumen = async () => {
    try {
      // 1. Revisar Inventario CON LA NUEVA URL
      const prodRes = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      const criticos = prodRes.data.filter((p: any) => p.stock <= p.minStock && !p.isService);
      setProductosCriticos(criticos);

      // 2. Revisar Ventas de Hoy y Últimas 5 CON LA NUEVA URL
      const factRes = await axios.get(`${import.meta.env.VITE_API_URL}/invoices`);
      const todasLasFacturas = factRes.data;
      
      const hoyStr = new Date().toLocaleDateString();
      const deHoy = todasLasFacturas.filter((fac: any) => new Date(fac.createdAt).toLocaleDateString() === hoyStr);
      setFacturasHoy(deHoy);
      
      const sumaHoy = deHoy.reduce((suma: number, fac: any) => suma + fac.totalAmount, 0);
      setTotalHoy(sumaHoy);

      const ordenadas = [...todasLasFacturas].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUltimasVentas(ordenadas.slice(0, 5));

    } catch (error) {
      console.error("Error al cargar el resumen:", error);
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f1f5f9', minHeight: '100vh', overflowY: 'auto' }}>
      
      {/* Mensaje de Bienvenida */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <WavingHandIcon sx={{ fontSize: 40, color: '#f97316', mr: 2 }} />
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a">
            ¡Buen día! Resumen del Taller
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Aquí tienes el estado actual del negocio antes de empezar a operar.
          </Typography>
        </Box>
      </Box>

      {/* --- PANELES SUPERIORES --- */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        
        {/* PANEL IZQUIERDO: ALERTAS DE INVENTARIO */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, borderTop: productosCriticos.length > 0 ? '8px solid #dc2626' : '8px solid #16a34a', height: '100%' }}>
            <Typography variant="h5" fontWeight="bold" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningAmberIcon sx={{ mr: 1, color: productosCriticos.length > 0 ? '#dc2626' : '#16a34a', fontSize: 32 }} /> 
              Urgencias de Inventario
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {productosCriticos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="#16a34a" fontWeight="bold">¡Todo en orden!</Typography>
                <Typography color="text.secondary">No hay repuestos con stock crítico.</Typography>
              </Box>
            ) : (
              <>
                <Typography variant="body1" color="#dc2626" fontWeight="bold" sx={{ mb: 2 }}>
                  Tienes {productosCriticos.length} repuestos a punto de agotarse:
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableBody>
                      {productosCriticos.slice(0, 5).map(prod => (
                        <TableRow key={prod.id}>
                          <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px dashed #cbd5e1' }}>{prod.name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: '900', color: '#dc2626', borderBottom: '1px dashed #cbd5e1' }}>
                            {prod.stock} en tienda
                          </TableCell>
                        </TableRow>
                      ))}
                      {productosCriticos.length > 5 && (
                        <TableRow><TableCell colSpan={2} align="center" sx={{ color: 'text.secondary', border: 'none' }}>...y otros más.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button variant="contained" fullWidth onClick={() => navigate('/ingreso')} endIcon={<ArrowForwardIcon />} sx={{ backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' }, fontWeight: 'bold', py: 1.5 }}>
                  Ir a Ingresar Mercadería
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* PANEL DERECHO: RENDIMIENTO DE HOY */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, borderTop: '8px solid #1e3a8a', height: '100%' }}>
            <Typography variant="h5" fontWeight="bold" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceWalletIcon sx={{ mr: 1, color: '#1e3a8a', fontSize: 32 }} /> 
              Corte de Caja Rápido (Hoy)
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="bold" textTransform="uppercase">Ingresos Recaudados</Typography>
              <Typography variant="h2" fontWeight="900" color="#16a34a">Lps. {totalHoy.toFixed(2)}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                En <strong>{facturasHoy.length}</strong> facturas emitidas el día de hoy.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button variant="outlined" fullWidth onClick={() => navigate('/ventas')} sx={{ fontWeight: 'bold', py: 1.5, color: '#1e3a8a', borderColor: '#1e3a8a' }}>
                  Ver Reporte
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button variant="contained" fullWidth onClick={() => navigate('/caja')} startIcon={<PointOfSaleIcon />} sx={{ fontWeight: 'bold', py: 1.5, backgroundColor: '#1e3a8a', '&:hover': { backgroundColor: '#1e40af' } }}>
                  Abrir Caja
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

      </Grid>

      {/* --- PANEL INFERIOR: ACTIVIDAD RECIENTE --- */}
      <Box>
        <Typography variant="h5" fontWeight="bold" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ReceiptLongIcon sx={{ mr: 1, color: '#64748b', fontSize: 32 }} />
          Actividad Reciente en Caja (Últimas 5 Facturas)
        </Typography>

        <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#e2e8f0' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>N° FACTURA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>HORA EXACTA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>CLIENTE</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>TOTAL</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' }}>MÉTODO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ultimasVentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aún no hay ventas registradas.</TableCell>
                </TableRow>
              ) : (
                ultimasVentas.map((fac) => (
                  <TableRow key={fac.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>{fac.invoiceNumber}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>
                      {new Date(fac.createdAt).toLocaleDateString()} a las {new Date(fac.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>{fac.client?.name || 'Consumidor Final'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: '900', color: '#16a34a', fontSize: '1.1rem' }}>
                      Lps. {fac.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={fac.paymentMethod} size="small" sx={{ backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

    </Box>
  );
}