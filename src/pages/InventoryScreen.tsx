import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Switch, FormControlLabel, IconButton, InputAdornment } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search'; // <-- Ícono de lupa

const productoInicial = { barcode: '', name: '', description: '', costPrice: 0, salePrice: 0, stock: 0, minStock: 5, isService: false, categoryId: 1 };

export default function InventoryScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState(productoInicial);
  const [idEdicion, setIdEdicion] = useState<number | null>(null);
  
  // NUEVO: Estado para el buscador
  const [busqueda, setBusqueda] = useState('');

  const cargarInventario = () => { 
    // --- ACTUALIZADO A LA NUBE ---
    axios.get(`${import.meta.env.VITE_API_URL}/products`)
      .then(res => setProductos(res.data))
      .catch(error => console.error(error)); 
  };
  
  useEffect(() => cargarInventario(), []);

  const abrirModalParaEditar = (producto: any) => { setIdEdicion(producto.id); setNuevoProducto({ ...producto, barcode: producto.barcode || '' }); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setNuevoProducto(productoInicial); setIdEdicion(null); };

  const guardarProducto = async () => {
    try {
      const datosAEnviar = { ...nuevoProducto, costPrice: Number(nuevoProducto.costPrice), salePrice: Number(nuevoProducto.salePrice), stock: Number(nuevoProducto.stock), minStock: Number(nuevoProducto.minStock) };
      if (idEdicion) { 
        // --- ACTUALIZADO A LA NUBE ---
        await axios.put(`${import.meta.env.VITE_API_URL}/products/${idEdicion}`, datosAEnviar); 
      } 
      else { 
        // --- ACTUALIZADO A LA NUBE ---
        await axios.post(`${import.meta.env.VITE_API_URL}/products`, datosAEnviar); 
      }
      cerrarModal(); cargarInventario();
    } catch (error) { alert("Error al guardar. Revisa los datos."); }
  };

  const eliminarProducto = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este repuesto por completo del catálogo?")) {
      try {
        // --- ACTUALIZADO A LA NUBE ---
        await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);
        cargarInventario();
      } catch (error) {
        alert("Error al eliminar. Revisa la consola.");
      }
    }
  };

  // NUEVO: Filtro inteligente (Busca por nombre o código)
  const productosFiltrados = productos.filter((prod) => {
    const textoBuscado = busqueda.toLowerCase();
    const nombreCumple = prod.name.toLowerCase().includes(textoBuscado);
    const codigoCumple = prod.barcode ? prod.barcode.toLowerCase().includes(textoBuscado) : false;
    return nombreCumple || codigoCumple;
  });

  return (
    <Box sx={{ p: 4, backgroundColor: '#f1f5f9', height: '100vh', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a">
          📦 Inventario de Repuestos y Servicios
        </Typography>
        <Button variant="contained" startIcon={<ConstructionIcon />} onClick={() => setModalAbierto(true)} sx={{ fontWeight: 'bold', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' }, borderRadius: 3, py: 1.5, px: 3, boxShadow: 4 }}>
          Nuevo Repuesto
        </Button>
      </Box>

      {/* --- NUEVA BARRA DE BÚSQUEDA --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3, backgroundColor: '#fff' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="🔍 Buscar repuesto por nombre o escanear código de barras..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            sx: { fontWeight: 'bold', fontSize: '1.1rem' }
          }}
        />
      </Paper>

      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: '#e2e8f0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>CÓDIGO</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>DESCRIPCIÓN REPUESTO</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>COSTO Lps.</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>VENTA Lps.</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', color: '#1e3a8a' }}>STOCK ACTUAL</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', color: '#1e3a8a' }}>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Usamos el arreglo filtrado en lugar del original */}
            {productosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No se encontraron productos con esa búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              productosFiltrados.map((prod) => (
                <TableRow key={prod.id} hover>
                  <TableCell sx={{ color: '#0f172a', fontWeight: 'bold' }}>{prod.barcode || 'N/A'}</TableCell>
                  <TableCell sx={{ color: '#0f172a' }}>{prod.name}{prod.isService && <Typography variant="caption" color="primary" sx={{ display: 'block' }}>(Servicio)</Typography>}</TableCell>
                  <TableCell align="right">Lps. {prod.costPrice.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#16a34a' }}>Lps. {prod.salePrice.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="900" fontSize="1.1rem" color={prod.stock <= prod.minStock && !prod.isService ? '#dc2626' : '#0f172a'}>
                      {prod.isService ? '∞' : prod.stock}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => abrirModalParaEditar(prod)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => eliminarProducto(prod.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* FORMULARIO DE INGRESO (Sin cambios) */}
      <Dialog open={modalAbierto} onClose={cerrarModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#1e3a8a' }}>{idEdicion ? 'Actualizar Repuesto' : 'Ingresar Nuevo Repuesto/Servicio'}</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#f1f5f9' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Código (Escanea aquí)" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.barcode} onChange={e => setNuevoProducto({...nuevoProducto, barcode: e.target.value})} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Nombre del Repuesto *" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.name} onChange={e => setNuevoProducto({...nuevoProducto, name: e.target.value})} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Costo Lps. *" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.costPrice} onChange={e => setNuevoProducto({...nuevoProducto, costPrice: Number(e.target.value)})} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Venta Lps. *" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.salePrice} onChange={e => setNuevoProducto({...nuevoProducto, salePrice: Number(e.target.value)})} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Stock Actual *" variant="outlined" sx={{ backgroundColor: '#fff' }} disabled={nuevoProducto.isService} value={nuevoProducto.stock} onChange={e => setNuevoProducto({...nuevoProducto, stock: Number(e.target.value)})} /></Grid>
            <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={nuevoProducto.isService} onChange={e => setNuevoProducto({...nuevoProducto, isService: e.target.checked, stock: 0})} />} label="Es un Servicio" disabled={idEdicion !== null} sx={{ mt: 1 }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc' }}>
          <Button onClick={cerrarModal} color="error" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
          <Button onClick={guardarProducto} variant="contained" sx={{ fontWeight: 'bold', backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }}>{idEdicion ? 'Actualizar Cambios' : 'Guardar Repuesto'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}