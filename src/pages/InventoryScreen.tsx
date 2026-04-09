import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Switch, FormControlLabel, 
  IconButton, InputAdornment, Card, CardContent, CardActions, Divider 
} from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

const productoInicial = { barcode: '', name: '', description: '', costPrice: 0, salePrice: 0, stock: 0, minStock: 5, isService: false, categoryId: 1 };

export default function InventoryScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState(productoInicial);
  const [idEdicion, setIdEdicion] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargarInventario = () => { 
    axios.get(`${import.meta.env.VITE_API_URL}/products`)
      .then(res => setProductos(res.data))
      .catch(error => console.error(error)); 
  };
  
  useEffect(() => cargarInventario(), []);

  const abrirModalParaEditar = (producto: any) => { setIdEdicion(producto.id); setNuevoProducto({ ...producto, barcode: producto.barcode || '' }); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setNuevoProducto(productoInicial); setIdEdicion(null); };

  const guardarProducto = async () => {
    try {
      const datosAEnviar: any = {
       ...nuevoProducto,
        costPrice: Number(nuevoProducto.costPrice),
        salePrice: Number(nuevoProducto.salePrice),
        stock: Number(nuevoProducto.stock),
        minStock: Number(nuevoProducto.minStock)
      };

      delete datosAEnviar.id;
      delete datosAEnviar.createdAt;
      delete datosAEnviar.updatedAt;
      delete datosAEnviar.category;

      if (idEdicion) { 
        await axios.patch(`${import.meta.env.VITE_API_URL}/products/${idEdicion}`, datosAEnviar); 
      } 
      else { 
        await axios.post(`${import.meta.env.VITE_API_URL}/products`, datosAEnviar); 
      }
      cerrarModal(); cargarInventario();
    } catch (error) { alert("Error al guardar. Revisa los datos."); }
  };

  const eliminarProducto = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este repuesto por completo del catálogo?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);
        cargarInventario();
      } catch (error) {
        alert("Error al eliminar. Revisa la consola.");
      }
    }
  };

  const productosFiltrados = productos.filter((prod) => {
    const textoBuscado = busqueda.toLowerCase();
    const nombreCumple = prod.name.toLowerCase().includes(textoBuscado);
    const codigoCumple = prod.barcode ? prod.barcode.toLowerCase().includes(textoBuscado) : false;
    return nombreCumple || codigoCumple;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f1f5f9', height: '100vh', overflowY: 'auto' }}>
      
      {/* --- ENCABEZADO RESPONSIVE --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ fontSize: { xs: '1.8rem', md: '2.125rem' } }}>
          📦 Inventario
        </Typography>
        <Button variant="contained" startIcon={<ConstructionIcon />} onClick={() => setModalAbierto(true)} sx={{ fontWeight: 'bold', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' }, borderRadius: 3, py: 1.5, px: 3, boxShadow: 4 }}>
          Nuevo Repuesto
        </Button>
      </Box>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <Paper elevation={2} sx={{ p: { xs: 1, md: 2 }, mb: 3, borderRadius: 3, backgroundColor: '#fff' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="🔍 Buscar nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>,
            sx: { fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.1rem' } }
          }}
        />
      </Paper>

      {/* =======================================================
          VISTA 1: TABLA (SOLO SE VE EN COMPUTADORAS / PANTALLAS md O MAYORES)
          ======================================================= */}
      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
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
            {productosFiltrados.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No se encontraron productos.</TableCell></TableRow>
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

      {/* =======================================================
          VISTA 2: TARJETAS MÓVILES (SOLO SE VE EN CELULARES / PANTALLAS xs y sm)
          ======================================================= */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {productosFiltrados.length === 0 ? (
           <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>No se encontraron productos.</Typography>
        ) : (
          productosFiltrados.map((prod) => (
            <Card key={prod.id} elevation={3} sx={{ mb: 2, borderRadius: 3 }}>
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ lineHeight: 1.2 }}>
                    {prod.name}
                  </Typography>
                  {prod.isService && <Typography variant="caption" sx={{ backgroundColor: '#dbeafe', color: '#1e3a8a', px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold' }}>Servicio</Typography>}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                  Código: {prod.barcode || 'N/A'}
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Precio Costo</Typography>
                    <Typography variant="body1">Lps. {prod.costPrice.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Precio Venta</Typography>
                    <Typography variant="body1" fontWeight="bold" color="#16a34a">Lps. {prod.salePrice.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                     <Typography variant="caption" color="text.secondary" display="block">Stock Actual</Typography>
                     <Typography variant="h6" fontWeight="900" color={prod.stock <= prod.minStock && !prod.isService ? '#dc2626' : '#0f172a'}>
                      {prod.isService ? '∞ (Ilimitado)' : `${prod.stock} unidades`}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', backgroundColor: '#f8fafc', px: 2 }}>
                <IconButton color="primary" onClick={() => abrirModalParaEditar(prod)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => eliminarProducto(prod.id)}><DeleteIcon /></IconButton>
              </CardActions>
            </Card>
          ))
        )}
      </Box>

      {/* FORMULARIO DE INGRESO (MODAL) */}
      <Dialog open={modalAbierto} onClose={cerrarModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#1e3a8a', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
          {idEdicion ? 'Actualizar Repuesto' : 'Ingresar Nuevo Repuesto/Servicio'}
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#f1f5f9', p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Código (Escanea aquí)" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.barcode} onChange={e => setNuevoProducto({...nuevoProducto, barcode: e.target.value})} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Nombre del Repuesto *" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.name} onChange={e => setNuevoProducto({...nuevoProducto, name: e.target.value})} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Costo Lps." variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.costPrice} onChange={e => setNuevoProducto({...nuevoProducto, costPrice: Number(e.target.value)})} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Venta Lps. *" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoProducto.salePrice} onChange={e => setNuevoProducto({...nuevoProducto, salePrice: Number(e.target.value)})} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Stock Actual *" variant="outlined" sx={{ backgroundColor: '#fff' }} disabled={nuevoProducto.isService} value={nuevoProducto.stock} onChange={e => setNuevoProducto({...nuevoProducto, stock: Number(e.target.value)})} /></Grid>
            <Grid item xs={6} md={3}><FormControlLabel control={<Switch checked={nuevoProducto.isService} onChange={e => setNuevoProducto({...nuevoProducto, isService: e.target.checked, stock: 0})} />} label="Es Servicio" disabled={idEdicion !== null} sx={{ mt: 1 }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button onClick={cerrarModal} color="error" fullWidth sx={{ fontWeight: 'bold' }}>Cancelar</Button>
          <Button onClick={guardarProducto} variant="contained" fullWidth sx={{ fontWeight: 'bold', backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, m: '0 !important' }}>{idEdicion ? 'Actualizar' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}