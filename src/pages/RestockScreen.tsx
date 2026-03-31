import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip, InputAdornment, Snackbar, Alert } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SearchIcon from '@mui/icons-material/Search';

export default function RestockScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [topVendidos, setTopVendidos] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidadIngreso, setCantidadIngreso] = useState<number | ''>('');
  const [busqueda, setBusqueda] = useState('');

  // --- NUEVO: ESTADO PARA LA NOTIFICACIÓN ELEGANTE ---
  const [alerta, setAlerta] = useState({ open: false, mensaje: '', tipo: 'success' }); // 'success' = verde, 'error' = rojo

  const cargarDatos = async () => {
    try {
      // --- ACTUALIZADO A LA NUBE ---
      const prodRes = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      setProductos(prodRes.data);

      // --- ACTUALIZADO A LA NUBE ---
      const factRes = await axios.get(`${import.meta.env.VITE_API_URL}/invoices`);
      const facturas = factRes.data;

      const conteoVentas: any = {};
      facturas.forEach((fac: any) => {
        if (fac.items) {
          fac.items.forEach((item: any) => {
            if (!conteoVentas[item.product.id]) {
              conteoVentas[item.product.id] = { nombre: item.product.name, cantidadVendida: 0 };
            }
            conteoVentas[item.product.id].cantidadVendida += item.quantity;
          });
        }
      });

      const top5 = Object.values(conteoVentas).sort((a: any, b: any) => b.cantidadVendida - a.cantidadVendida).slice(0, 5);
      setTopVendidos(top5);

    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirModalIngreso = (producto: any) => {
    setProductoSeleccionado(producto); setCantidadIngreso(''); setModalAbierto(true);
  };

  const confirmarIngreso = async () => {
    if (!cantidadIngreso || Number(cantidadIngreso) <= 0) {
      // Usamos la alerta roja
      setAlerta({ open: true, mensaje: 'Debes ingresar una cantidad válida mayor a 0.', tipo: 'error' });
      return;
    }

    try {
      const nuevoStock = productoSeleccionado.stock + Number(cantidadIngreso);

      // --- ACTUALIZADO A LA NUBE ---
      await axios.patch(`${import.meta.env.VITE_API_URL}/products/${productoSeleccionado.id}`, {
        stock: nuevoStock
      });

      // Usamos la alerta verde de éxito
      setAlerta({ open: true, mensaje: `¡Éxito! Se ingresaron ${cantidadIngreso} unidades de ${productoSeleccionado.name}. Nuevo stock: ${nuevoStock}`, tipo: 'success' });
      
      setModalAbierto(false);
      cargarDatos(); 
    } catch (error) {
      console.error(error);
      setAlerta({ open: true, mensaje: 'Hubo un error de conexión al actualizar el stock.', tipo: 'error' });
    }
  };

  const cerrarAlerta = () => {
    setAlerta({ ...alerta, open: false });
  };

  const productosCriticos = productos.filter(p => p.stock <= p.minStock && !p.isService);

  const productosParaIngresar = productos.filter((prod) => {
    if (prod.isService) return false; 
    const textoBuscado = busqueda.toLowerCase();
    return prod.name.toLowerCase().includes(textoBuscado) || (prod.barcode && prod.barcode.toLowerCase().includes(textoBuscado));
  });

  return (
    <Box sx={{ p: 4, backgroundColor: '#f1f5f9', height: '100vh', overflowY: 'auto' }}>
      
      <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        🚚 Centro de Ingreso de Mercadería y Análisis
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, borderLeft: '7px solid #f97316', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ mr: 1, color: '#f97316' }} /> Top 5: Repuestos Más Vendidos
            </Typography>
            <Table size="small">
              <TableBody>
                {topVendidos.length === 0 ? (
                  <TableRow><TableCell sx={{ border: 'none' }}>No hay ventas registradas aún.</TableCell></TableRow>
                ) : (
                  topVendidos.map((prod: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell sx={{ border: 'none', fontWeight: 'bold' }}>{index + 1}. {prod.nombre}</TableCell>
                      <TableCell align="right" sx={{ border: 'none' }}><Chip label={`${prod.cantidadVendida} vendidos`} color="warning" size="small" sx={{ fontWeight: 'bold', backgroundColor: '#fff7ed', color: '#ea580c' }} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, borderLeft: '7px solid #dc2626', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningAmberIcon sx={{ mr: 1, color: '#dc2626' }} /> ¡Atención! Repuestos por Agotarse
            </Typography>
            <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
              <Table size="small">
                <TableBody>
                  {productosCriticos.length === 0 ? (
                    <TableRow><TableCell sx={{ border: 'none', color: '#16a34a', fontWeight: 'bold' }}>Todo el inventario está sano.</TableCell></TableRow>
                  ) : (
                    productosCriticos.map((prod: any) => (
                      <TableRow key={prod.id}>
                        <TableCell sx={{ border: 'none', fontWeight: 'bold', color: '#dc2626' }}>{prod.name}</TableCell>
                        <TableCell align="right" sx={{ border: 'none' }}><Typography fontWeight="bold" color="#dc2626">Quedan: {prod.stock}</Typography></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="#0f172a">Registrar Entrada de Nuevas Cajas</Typography>
        <TextField size="small" variant="outlined" placeholder="🔍 Buscar para ingresar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ backgroundColor: '#fff', width: '300px' }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
      </Box>

      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#e2e8f0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>CÓDIGO</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>PRODUCTO</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' }}>STOCK ACTUAL</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' }}>AGREGAR MERCADERÍA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosParaIngresar.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No se encontraron productos con esa búsqueda.</TableCell></TableRow>
            ) : (
              productosParaIngresar.map((prod) => (
                <TableRow key={prod.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{prod.barcode}</TableCell>
                  <TableCell>{prod.name}</TableCell>
                  <TableCell align="center"><Typography fontWeight="900" fontSize="1.2rem" color={prod.stock <= prod.minStock ? '#dc2626' : '#0f172a'}>{prod.stock}</Typography></TableCell>
                  <TableCell align="center"><Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => abrirModalIngreso(prod)} sx={{ backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, fontWeight: 'bold', borderRadius: 2 }}>Ingresar</Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modalAbierto} onClose={() => setModalAbierto(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#1e3a8a' }}>Registrar Entrada</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#f1f5f9', textAlign: 'center' }}>
          {productoSeleccionado && (
            <>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>{productoSeleccionado.name}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Stock actual en tienda: <strong>{productoSeleccionado.stock} unidades</strong></Typography>
              <TextField autoFocus fullWidth type="number" label="¿Cuántas unidades llegaron?" variant="outlined" sx={{ backgroundColor: '#fff' }} value={cantidadIngreso} onChange={e => setCantidadIngreso(e.target.value === '' ? '' : Number(e.target.value))} inputProps={{ min: 1, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' } }} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc', justifyContent: 'center' }}>
          <Button onClick={() => setModalAbierto(false)} color="error" sx={{ fontWeight: 'bold', mr: 2 }}>Cancelar</Button>
          <Button onClick={confirmarIngreso} variant="contained" sx={{ fontWeight: 'bold', backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, px: 4 }}>Confirmar y Sumar</Button>
        </DialogActions>
      </Dialog>

      {/* --- AQUÍ ESTÁ EL COMPONENTE DE NOTIFICACIÓN ELEGANTE --- */}
      <Snackbar 
        open={alerta.open} 
        autoHideDuration={5000} 
        onClose={cerrarAlerta} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={cerrarAlerta} severity={alerta.tipo as any} variant="filled" sx={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: 4 }}>
          {alerta.mensaje}
        </Alert>
      </Snackbar>

    </Box>
  );
}