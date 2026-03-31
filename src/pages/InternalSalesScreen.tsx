import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Paper, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, Grid, IconButton, InputAdornment, Divider 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

export default function InternalSalesScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [notas, setNotas] = useState('Registro interno sin factura');

  // Cargar productos de la base de datos
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/products`)
      .then(res => setProductos(res.data))
      .catch(error => console.error("Error cargando productos:", error));
  }, []);

  // Filtrar productos para el buscador
  const productosFiltrados = productos.filter((prod) => {
    const texto = busqueda.toLowerCase();
    return prod.name.toLowerCase().includes(texto) || (prod.barcode && prod.barcode.toLowerCase().includes(texto));
  });

  // Funciones del carrito
  const agregarAlCarrito = (producto: any) => {
    if (!producto.isService && producto.stock <= 0) {
      alert("¡No hay stock de este repuesto!");
      return;
    }
    
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const cambiarCantidad = (id: number, cantidad: number) => {
    if (cantidad < 1) return;
    setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad } : item));
  };

  // Matemática SIN ISV
  const granTotal = carrito.reduce((suma, item) => suma + (item.salePrice * item.cantidad), 0);

  // Registrar la venta en la base de datos
  const registrarVentaInterna = async () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    try {
      const datosVenta = {
        customerName: nombreCliente || 'Cliente General',
        notes: notas,
        subtotal: granTotal,
        isv: 0, // <-- AQUÍ ESTÁ LA MAGIA: 0 IMPUESTOS
        total: granTotal,
        items: carrito.map(item => ({
          productId: item.id,
          quantity: item.cantidad,
          unitPrice: item.salePrice
        }))
      };

      // Mandamos a guardar a la ruta de facturas/ventas
      await axios.post(`${import.meta.env.VITE_API_URL}/invoices`, datosVenta);
      
      alert("✅ Venta interna registrada con éxito!");
      setCarrito([]);
      setNombreCliente('');
      // Recargar productos para actualizar el stock visualmente
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      setProductos(res.data);

    } catch (error) {
      console.error(error);
      alert("Hubo un error al registrar la venta. Revisa la consola.");
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f8fafc', height: '100vh', overflowY: 'auto' }}>
      <Typography variant="h4" fontWeight="900" color="#334155" sx={{ mb: 3 }}>
        📝 Registro Interno de Ventas (Sin ISV)
      </Typography>

      <Grid container spacing={3}>
        {/* LADO IZQUIERDO: Buscador y Catálogo */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: '#fff', height: '100%' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="🔍 Buscar repuesto por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />

            <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Precio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', textAlign: 'center' }}>Stock</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', textAlign: 'center' }}>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productosFiltrados.map((prod) => (
                    <TableRow key={prod.id} hover>
                      <TableCell>{prod.name}</TableCell>
                      <TableCell>Lps. {prod.salePrice.toFixed(2)}</TableCell>
                      <TableCell align="center">{prod.isService ? '∞' : prod.stock}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => agregarAlCarrito(prod)}>
                          <AddShoppingCartIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* LADO DERECHO: Carrito y Totales */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: '#f1f5f9', borderTop: '5px solid #64748b' }}>
            <Typography variant="h6" fontWeight="bold" color="#334155" sx={{ mb: 2 }}>
              Detalle del Registro
            </Typography>

            <TextField fullWidth size="small" label="Nombre del Cliente (Opcional)" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} sx={{ mb: 2, backgroundColor: '#fff' }} />
            <TextField fullWidth size="small" label="Notas / Observaciones" value={notas} onChange={e => setNotas(e.target.value)} sx={{ mb: 3, backgroundColor: '#fff' }} />

            <Divider sx={{ mb: 2 }} />

            {/* Lista del Carrito */}
            <Box sx={{ minHeight: 200, maxHeight: 250, overflowY: 'auto', mb: 2 }}>
              {carrito.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 5 }}>Agrega productos para registrar.</Typography>
              ) : (
                carrito.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, backgroundColor: '#fff', borderRadius: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Lps. {item.salePrice} c/u</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField type="number" size="small" value={item.cantidad} onChange={(e) => cambiarCantidad(item.id, Number(e.target.value))} inputProps={{ min: 1 }} sx={{ width: 60, mr: 1 }} />
                      <IconButton color="error" size="small" onClick={() => eliminarDelCarrito(item.id)}><DeleteIcon /></IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* TOTAL SIN ISV */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" color="#334155">TOTAL:</Typography>
              <Typography variant="h4" fontWeight="900" color="#16a34a">Lps. {granTotal.toFixed(2)}</Typography>
            </Box>

            <Button 
              fullWidth 
              variant="contained" 
              size="large" 
              startIcon={<SaveIcon />} 
              onClick={registrarVentaInterna}
              sx={{ backgroundColor: '#475569', '&:hover': { backgroundColor: '#334155' }, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              Guardar Registro Interno
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}