import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Box, Grid, Paper, Typography, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Autocomplete, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import BackspaceIcon from '@mui/icons-material/Backspace';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BuildIcon from '@mui/icons-material/Build';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

interface Product {
  id: number;
  barcode: string | null;
  name: string;
  salePrice: number;
  stock: number;
  isService: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosScreen() {
  const [catalogo, setCatalogo] = useState<Product[]>([]);
  const [clientesDb, setClientesDb] = useState<any[]>([]);
  
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [valorBuscador, setValorBuscador] = useState<Product | null>(null);
  const [textoIngresado, setTextoIngresado] = useState('');

  // --- DATOS OFICIALES DEL SAR ---
  const sarRTN = "18041987005000"; 
  const sarCAI = "387D05-2EEA45-76DEE0-63BE03-090928-C6";
  const sarRango = "000-001-01-00000251 al 000-001-01-00000300";
  const sarFechaLimite = "26/06/2026";

  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
  const [nombreCliente, setNombreCliente] = useState('Consumidor Final');
  const [rtnCliente, setRtnCliente] = useState('');
  
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [esOtroBanco, setEsOtroBanco] = useState(false);
  const [detalleManoObra, setDetalleManoObra] = useState('');
  const [precioManoObra, setPrecioManoObra] = useState<number | ''>('');

  const [ticketImprimir, setTicketImprimir] = useState<any>(null); 

  const [referenciaTrabajo, setReferenciaTrabajo] = useState(''); 
  const [idDraftActual, setIdDraftActual] = useState<number | null>(null); 
  const [listaDrafts, setListaDrafts] = useState<any[]>([]);
  const [modalDraftsAbierto, setModalDraftsAbierto] = useState(false);

  useEffect(() => {
    // --- ACTUALIZADO A LA NUBE ---
    axios.get(`${import.meta.env.VITE_API_URL}/products`).then(res => setCatalogo(res.data)).catch(console.error);
    axios.get(`${import.meta.env.VITE_API_URL}/clients`).then(res => setClientesDb(res.data)).catch(console.error);
    cargarBorradores();
  }, []);

  const cargarBorradores = () => {
    // --- ACTUALIZADO A LA NUBE ---
    axios.get(`${import.meta.env.VITE_API_URL}/drafts`).then(res => setListaDrafts(res.data)).catch(console.error);
  };

  const agregarAlCarrito = (producto: Product) => {
    setCarrito(curr => {
      const existe = curr.find(item => item.product.id === producto.id);
      if (existe) return curr.map(item => item.product.id === producto.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...curr, { product: producto, quantity: 1 }];
    });
  };

  const actualizarCantidad = (id: number, cant: number) => {
    if (cant < 1) return; 
    setCarrito(curr => curr.map(item => item.product.id === id ? { ...item, quantity: cant } : item));
  };

  const eliminarDelCarrito = (id: number) => setCarrito(carrito.filter(item => item.product.id !== id));

  const limpiarPantalla = () => {
    Swal.fire({
      title: '¿Limpiar mesa?',
      text: "Se borrarán todos los repuestos agregados y empezarás de cero.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setCarrito([]); setClienteSeleccionado(null); setNombreCliente('Consumidor Final'); setRtnCliente(''); setTextoIngresado('');
        setMetodoPago('Efectivo'); setEsOtroBanco(false); setDetalleManoObra(''); setPrecioManoObra('');
        setReferenciaTrabajo(''); setIdDraftActual(null);
        Swal.fire({ icon: 'success', title: 'Mesa limpia', timer: 1000, showConfirmButton: false });
      }
    });
  };

  const subtotalRepuestos = carrito.reduce((suma, item) => suma + (item.quantity * item.product.salePrice), 0);
  const isv = subtotalRepuestos * 0.15; 
  const totalManoObra = Number(precioManoObra) || 0;
  const totalRecargo = (metodoPago === 'Transferencia' && esOtroBanco) ? 40 : 0;
  
  const importeExento = totalManoObra + totalRecargo; 
  const totalGeneral = subtotalRepuestos + isv + importeExento;

  const guardarBorrador = async () => {
    if (carrito.length === 0 && totalManoObra === 0) {
      return Swal.fire({ icon: 'warning', title: 'Mesa vacía', text: 'Agrega repuestos o mano de obra primero.' });
    }
    if (!referenciaTrabajo.trim()) {
      return Swal.fire({ icon: 'warning', title: 'Falta Referencia', text: 'Ponle un nombre al trabajo (Ej: Toyota Hilux Rojo).' });
    }

    const estadoPantalla = { carrito, clienteSeleccionado, nombreCliente, rtnCliente, metodoPago, esOtroBanco, detalleManoObra, precioManoObra };

    try {
      if (idDraftActual) {
        // --- ACTUALIZADO A LA NUBE ---
        await axios.patch(`${import.meta.env.VITE_API_URL}/drafts/${idDraftActual}`, { name: referenciaTrabajo, posState: estadoPantalla });
        Swal.fire({ icon: 'success', title: 'Progreso actualizado', text: 'Tus cambios fueron guardados.', timer: 1500, showConfirmButton: false });
      } else {
        // --- ACTUALIZADO A LA NUBE ---
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/drafts`, { name: referenciaTrabajo, posState: estadoPantalla });
        setIdDraftActual(res.data.id);
        Swal.fire({ icon: 'success', title: 'Ticket guardado', text: 'Puedes limpiar la mesa sin perder este progreso.', timer: 2000, showConfirmButton: false });
      }
      cargarBorradores();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el ticket abierto.' });
    }
  };

  const cargarBorradorGuardado = (draft: any) => {
    const estado = draft.posState;
    setCarrito(estado.carrito || []);
    setClienteSeleccionado(estado.clienteSeleccionado || null);
    setNombreCliente(estado.nombreCliente || 'Consumidor Final');
    setRtnCliente(estado.rtnCliente || '');
    setMetodoPago(estado.metodoPago || 'Efectivo');
    setEsOtroBanco(estado.esOtroBanco || false);
    setDetalleManoObra(estado.detalleManoObra || '');
    setPrecioManoObra(estado.precioManoObra || '');
    
    setReferenciaTrabajo(draft.name);
    setIdDraftActual(draft.id);
    setModalDraftsAbierto(false);
  };

  const eliminarBorradorBaseDatos = (id: number) => {
    Swal.fire({
      title: '¿Eliminar ticket?',
      text: "Se borrará este progreso para siempre.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // --- ACTUALIZADO A LA NUBE ---
        await axios.delete(`${import.meta.env.VITE_API_URL}/drafts/${id}`);
        if (idDraftActual === id) {
          setCarrito([]); setClienteSeleccionado(null); setNombreCliente('Consumidor Final'); setRtnCliente(''); setTextoIngresado('');
          setMetodoPago('Efectivo'); setEsOtroBanco(false); setDetalleManoObra(''); setPrecioManoObra('');
          setReferenciaTrabajo(''); setIdDraftActual(null);
        }
        cargarBorradores();
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false });
      }
    });
  };

  const procesarPago = async () => {
    if (carrito.length === 0 && totalManoObra === 0) { 
      return Swal.fire({ icon: 'warning', title: 'Mesa vacía', text: 'Agrega repuestos o mano de obra para cobrar.' }); 
    }

    try {
      const datosFactura = { 
        paymentMethod: metodoPago + (esOtroBanco ? " (Otro Banco)" : ""), 
        clientId: clienteSeleccionado?.id,
        laborDesc: detalleManoObra,
        laborPrice: totalManoObra,
        surcharge: totalRecargo,
        items: carrito.map(item => ({ productId: item.product.id, quantity: item.quantity, unitPrice: item.product.salePrice })) 
      };

      // --- ACTUALIZADO A LA NUBE ---
      const respuesta = await axios.post(`${import.meta.env.VITE_API_URL}/invoices`, datosFactura);
      
      setTicketImprimir({ 
        numero: respuesta.data.invoiceNumber, 
        fecha: new Date().toLocaleDateString('es-HN'), 
        cliente: nombreCliente, 
        rtn: rtnCliente, 
        items: [...carrito],
        metodoPago: metodoPago,
        recargo: totalRecargo,
        manoObraDesc: detalleManoObra,
        manoObraPrecio: totalManoObra,
        subtotalRepuestos, 
        importeExento,
        isv, 
        total: totalGeneral 
      });

      if (idDraftActual) {
        // --- ACTUALIZADO A LA NUBE ---
        await axios.delete(`${import.meta.env.VITE_API_URL}/drafts/${idDraftActual}`);
        cargarBorradores();
      }

      setCarrito([]); setClienteSeleccionado(null); setNombreCliente('Consumidor Final'); setRtnCliente('');
      setDetalleManoObra(''); setPrecioManoObra(''); setEsOtroBanco(false); setMetodoPago('Efectivo');
      setReferenciaTrabajo(''); setIdDraftActual(null);

      Swal.fire({ icon: 'success', title: '¡Venta Realizada!', text: 'Generando factura SAR...', timer: 1500, showConfirmButton: false });

    } catch (error) { 
      Swal.fire({ icon: 'error', title: 'Error al cobrar', text: 'Revisa tu conexión o el inventario disponible.' });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9' }}>
      
      <Box sx={{ p: 3, flexGrow: 1, overflow: 'hidden' }} className="no-print">
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, backgroundColor: '#fff', p: 2, borderRadius: 2, boxShadow: 1 }}>
          <TextField 
            size="small" 
            variant="outlined" 
            label="Vehículo o Referencia del Trabajo *" 
            placeholder="Ej. Toyota Hilux Juan" 
            value={referenciaTrabajo} 
            onChange={e => setReferenciaTrabajo(e.target.value)} 
            sx={{ width: '400px', backgroundColor: '#f8fafc' }} 
            InputProps={{ style: { fontWeight: 'bold', color: '#0f172a' } }}
          />
          <Box>
            <Button variant="outlined" color="primary" startIcon={<FolderOpenIcon />} onClick={() => setModalDraftsAbierto(true)} sx={{ fontWeight: 'bold', mr: 2 }}>
              Ver Tickets Abiertos ({listaDrafts.length})
            </Button>
            <Button variant="contained" color="info" startIcon={<SaveIcon />} onClick={guardarBorrador} sx={{ fontWeight: 'bold' }}>
              Guardar Progreso
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ height: 'calc(100% - 70px)' }}>
          <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="900" color="#0f172a" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>1️⃣ Buscador de Repuestos</Typography>
            <Paper elevation={4} sx={{ p: 2, mb: 2, borderRadius: 3, borderLeft: '7px solid #1e3a8a' }}>
              <Autocomplete options={catalogo} getOptionLabel={(opcion) => `${opcion.barcode ? opcion.barcode + ' - ' : ''}${opcion.name} (Lps. ${opcion.salePrice})`} value={valorBuscador} onChange={(e, nuevo) => { if (nuevo) { agregarAlCarrito(nuevo); setValorBuscador(null); } }} inputValue={textoIngresado} onInputChange={(e, nuevoTexto) => setTextoIngresado(nuevoTexto)} renderInput={(params) => <TextField {...params} label="Escribir nombre o usar pistola lectora..." variant="outlined" sx={{ backgroundColor: '#fff', fontWeight: 'bold' }} />} />
            </Paper>
            <TableContainer component={Paper} elevation={4} sx={{ flexGrow: 1, borderRadius: 3, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead><TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>REPUESTO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>CANT.</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>PRECIO</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>SUBTOTAL</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>X</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {carrito.length === 0 ? ( <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Mesa vacía.</Typography></TableCell></TableRow> ) : (
                    carrito.map((item) => (
                      <TableRow hover key={item.product.id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{item.product.name}</TableCell>
                        <TableCell align="center"><TextField type="number" size="small" value={item.quantity} onChange={(e) => actualizarCantidad(item.product.id, parseInt(e.target.value))} inputProps={{ min: 1, style: { textAlign: 'center' } }} sx={{ width: '70px', backgroundColor: '#fff' }} /></TableCell>
                        <TableCell align="right">Lps. {item.product.salePrice.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#16a34a' }}>Lps. {(item.quantity * item.product.salePrice).toFixed(2)}</TableCell>
                        <TableCell align="center"><IconButton color="error" size="small" onClick={() => eliminarDelCarrito(item.product.id)}><DeleteIcon /></IconButton></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Paper elevation={4} sx={{ p: 2, mt: 2, borderRadius: 3, borderLeft: '7px solid #8b5cf6' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: '#0f172a' }}><BuildIcon sx={{ mr: 1, color: '#8b5cf6' }} /> Añadir Mano de Obra (Exento de ISV)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}><TextField fullWidth size="small" label="Descripción detallada..." variant="outlined" value={detalleManoObra} onChange={(e) => setDetalleManoObra(e.target.value)} sx={{ backgroundColor: '#fff' }} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" type="number" label="Precio Total Lps." variant="outlined" value={precioManoObra} onChange={(e) => setPrecioManoObra(e.target.value === '' ? '' : Number(e.target.value))} sx={{ backgroundColor: '#fff' }} /></Grid>
              </Grid>
            </Paper>
            <Box sx={{ mt: 2 }}><Button variant="outlined" color="error" startIcon={<BackspaceIcon />} onClick={limpiarPantalla} sx={{ fontWeight: 'bold' }}>Cancelar y Limpiar Mesa</Button></Box>
          </Grid>

          <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="900" color="#0f172a" sx={{ mb: 1 }}>2️⃣ Cliente y Pago</Typography>
            <Paper elevation={4} sx={{ p: 2, mb: 2, borderRadius: 3, borderLeft: '7px solid #64748b' }}>
              <Autocomplete options={clientesDb} getOptionLabel={(opcion) => `${opcion.name} ${opcion.rtn ? `- RTN: ${opcion.rtn}` : ''}`} value={clienteSeleccionado} onChange={(e, nuevo) => { setClienteSeleccionado(nuevo); setNombreCliente(nuevo ? nuevo.name : 'Consumidor Final'); setRtnCliente(nuevo && nuevo.rtn ? nuevo.rtn : ''); }} renderInput={(params) => <TextField {...params} label="🔍 Buscar Cliente..." size="small" sx={{ mb: 2, backgroundColor: '#f8fafc' }} />} />
              <TextField fullWidth size="small" label="Nombre Factura" sx={{ mb: 2, backgroundColor: '#fff' }} value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} />
              <TextField fullWidth size="small" label="RTN" sx={{ mb: 2, backgroundColor: '#fff' }} value={rtnCliente} onChange={(e) => setRtnCliente(e.target.value)} />
              <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}><AccountBalanceIcon sx={{ mr: 1, fontSize: 18 }} /> Método de Pago</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1, backgroundColor: '#fff' }}>
                <InputLabel>Seleccione</InputLabel>
                <Select value={metodoPago} label="Seleccione" onChange={(e) => { setMetodoPago(e.target.value); if(e.target.value !== 'Transferencia') setEsOtroBanco(false); }}>
                  <MenuItem value="Efectivo">💵 Efectivo</MenuItem>
                  <MenuItem value="Transferencia">📱 Transferencia</MenuItem>
                  <MenuItem value="Depósito">🏦 Depósito</MenuItem>
                </Select>
              </FormControl>
              {metodoPago === 'Transferencia' && <FormControlLabel control={<Checkbox checked={esOtroBanco} onChange={(e) => setEsOtroBanco(e.target.checked)} />} label="A otro banco (+ Lps. 40)" sx={{ color: '#dc2626', fontWeight: 'bold' }} />}
            </Paper>

            <Typography variant="h6" fontWeight="900" color="#0f172a" sx={{ mb: 1 }}>3️⃣ Finalizar</Typography>
            <Paper elevation={4} sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 3, borderLeft: '7px solid #16a34a', flexGrow: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography color="text.secondary">Importe Gravado 15%:</Typography><Typography fontWeight="bold">Lps. {subtotalRepuestos.toFixed(2)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography color="text.secondary">Impuesto ISV (15%):</Typography><Typography fontWeight="bold">Lps. {isv.toFixed(2)}</Typography></Box>
                {importeExento > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography color="text.secondary">Importe Exento:</Typography><Typography fontWeight="bold">Lps. {importeExento.toFixed(2)}</Typography></Box>}
              </Box>
              <Box>
                <Divider sx={{ mb: 2, borderWidth: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}><Typography variant="h4" fontWeight="900">TOTAL:</Typography><Typography variant="h3" fontWeight="900" color="#16a34a">Lps. {totalGeneral.toFixed(2)}</Typography></Box>
                <Button variant="contained" size="large" fullWidth disabled={(carrito.length === 0 && totalManoObra === 0) || totalGeneral === 0} onClick={procesarPago} startIcon={<PointOfSaleIcon sx={{ fontSize: 32 }} />} sx={{ py: 2, fontSize: '1.2rem', fontWeight: '900', backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, borderRadius: 3 }}>
                  IMPRIMIR SAR (FACTURAR)
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* --- MODAL DE TICKETS ABIERTOS --- */}
      <Dialog open={modalDraftsAbierto} onClose={() => setModalDraftsAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
          Vehículos en Taller (Tickets Abiertos)
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {listaDrafts.length === 0 ? (
            <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No hay tickets guardados.</Typography>
          ) : (
            <Table size="small">
              <TableBody>
                {listaDrafts.map(draft => (
                  <TableRow key={draft.id} hover>
                    <TableCell sx={{ p: 2 }}>
                      <Typography fontWeight="bold" color="#1e3a8a">{draft.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Actualizado: {new Date(draft.updatedAt).toLocaleDateString()} {new Date(draft.updatedAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ p: 2 }}>
                      <Button variant="outlined" size="small" onClick={() => cargarBorradorGuardado(draft)} sx={{ mr: 1, fontWeight: 'bold' }}>Cargar a Caja</Button>
                      <IconButton color="error" size="small" onClick={() => eliminarBorradorBaseDatos(draft.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalDraftsAbierto(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* --- FORMATO DE IMPRESIÓN OFICIAL SAR (Oculto hasta que se factura) --- */}
      <Dialog open={ticketImprimir !== null} onClose={() => setTicketImprimir(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#1e3a8a', color: '#fff' }} className="no-print">Vista Previa SAR</DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#e2e8f0' }}>
          {ticketImprimir && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }} className="no-print-padding">
              <Box id="area-impresion" sx={{ 
                width: '100%', maxWidth: '210mm', minHeight: '148mm', backgroundColor: '#fff', p: 5, boxShadow: 3, color: '#000', fontFamily: 'Arial, sans-serif', margin: '0 auto',
                '@media print': { maxWidth: '100%', height: 'auto', margin: 0, padding: 0, boxShadow: 'none', pageBreakInside: 'avoid' }
              }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h4" fontWeight="900" sx={{ textTransform: 'uppercase' }}>INVERSIONES SEVILLA</Typography>
                  <Typography variant="body2" fontWeight="bold">PROP: ALLAN ROEL SEVILLA ZUNIGA</Typography>
                  <Typography variant="body2">Barrio San Miguel, Calle Principal, a la par de Colegio Rómulo E Durón</Typography>
                  <Typography variant="body2">El Progreso, Yoro, Honduras | Cel: +504 9938-9144</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>RTN: {sarRTN}</Typography>
                </Box>
                <Divider sx={{ borderBottomWidth: 2, borderColor: '#000', mb: 2 }} />
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={7}>
                    <Typography variant="body2"><strong>CAI:</strong> {sarCAI}</Typography>
                    <Typography variant="body2"><strong>Rango Autorizado:</strong> {sarRango}</Typography>
                    <Typography variant="body2"><strong>Fecha Límite Emisión:</strong> {sarFechaLimite}</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2"><strong>Cliente:</strong> {ticketImprimir.cliente}</Typography>
                      <Typography variant="body2"><strong>RTN:</strong> {ticketImprimir.rtn || 'Consumidor Final'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={5} sx={{ textAlign: 'right' }}>
                    <Box sx={{ border: '2px solid #000', p: 1, borderRadius: 1, display: 'inline-block', textAlign: 'center', minWidth: '200px' }}>
                      <Typography variant="subtitle1" fontWeight="bold">FACTURA</Typography>
                      <Typography variant="body1" fontWeight="bold">N° {ticketImprimir.numero}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 2 }}><strong>Fecha:</strong> {ticketImprimir.fecha}</Typography>
                    <Typography variant="body2"><strong>Condición de Pago:</strong> Contado ({ticketImprimir.metodoPago})</Typography>
                  </Grid>
                </Grid>
                <Table size="small" sx={{ mb: 2, border: '1px solid #000' }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f0f0f0', '& th': { border: '1px solid #000', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 } }}>
                      <TableCell align="center" width="10%">CANT.</TableCell>
                      <TableCell>DESCRIPCIÓN</TableCell>
                      <TableCell align="right" width="20%">PRECIO UNIT.</TableCell>
                      <TableCell align="right" width="20%">TOTAL Lps.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ticketImprimir.items.map((item: any, index: number) => (
                      <TableRow key={index} sx={{ '& td': { border: '1px solid #000', fontSize: '0.85rem', py: 0.5 } }}>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell align="right">{item.product.salePrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{(item.quantity * item.product.salePrice).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {ticketImprimir.manoObraPrecio > 0 && (
                      <TableRow sx={{ '& td': { border: '1px solid #000', fontSize: '0.85rem', py: 0.5 } }}>
                        <TableCell align="center">1</TableCell>
                        <TableCell>Mano de Obra: {ticketImprimir.manoObraDesc || 'Servicio'}</TableCell>
                        <TableCell align="right">{ticketImprimir.manoObraPrecio.toFixed(2)}</TableCell>
                        <TableCell align="right">{ticketImprimir.manoObraPrecio.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    {ticketImprimir.recargo > 0 && (
                      <TableRow sx={{ '& td': { border: '1px solid #000', fontSize: '0.85rem', py: 0.5 } }}>
                        <TableCell align="center">1</TableCell>
                        <TableCell>Comisión Transacción Bancaria</TableCell>
                        <TableCell align="right">{ticketImprimir.recargo.toFixed(2)}</TableCell>
                        <TableCell align="right">{ticketImprimir.recargo.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <Grid container>
                  <Grid item xs={7}>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem' }}>* La firma del cliente acepta el trabajo realizado y los repuestos detallados.</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>* No se aceptan devoluciones en partes eléctricas.</Typography>
                  </Grid>
                  <Grid item xs={5}>
                    <Table size="small" sx={{ border: '1px solid #000' }}>
                      <TableBody sx={{ '& td': { border: '1px solid #000', py: 0.5, fontSize: '0.85rem' } }}>
                        <TableRow><TableCell>Importe Exento:</TableCell><TableCell align="right">Lps. {ticketImprimir.importeExento.toFixed(2)}</TableCell></TableRow>
                        <TableRow><TableCell>Importe Gravado 15%:</TableCell><TableCell align="right">Lps. {ticketImprimir.subtotalRepuestos.toFixed(2)}</TableCell></TableRow>
                        <TableRow><TableCell>Importe Gravado 18%:</TableCell><TableCell align="right">Lps. 0.00</TableCell></TableRow>
                        <TableRow><TableCell>15% I.S.V.:</TableCell><TableCell align="right">Lps. {ticketImprimir.isv.toFixed(2)}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 'bold' }}>TOTAL A PAGAR:</TableCell><TableCell align="right" sx={{ fontWeight: 'bold' }}>Lps. {ticketImprimir.total.toFixed(2)}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Typography variant="caption" fontWeight="bold">ORIGINAL: Cliente / COPIA: Obligado Tributario</Typography>
                  <Box sx={{ textAlign: 'center', width: '250px' }}>
                    <Divider sx={{ borderColor: '#000', mb: 0.5 }} />
                    <Typography variant="caption">Firma Conforme Cliente</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="no-print" sx={{ backgroundColor: '#f8fafc', p: 2 }}>
          <Button onClick={() => setTicketImprimir(null)} color="error" variant="outlined" sx={{ fontWeight: 'bold' }}>Cerrar y Volver</Button>
          <Button onClick={() => window.print()} variant="contained" color="primary" startIcon={<PrintIcon />} sx={{ fontWeight: 'bold', px: 4 }}>Mandar a Imprimir Canon</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}