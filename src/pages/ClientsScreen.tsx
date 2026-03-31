import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContactsIcon from '@mui/icons-material/Contacts';

const clienteInicial = {
  name: '',
  rtn: '',
  email: '',
  phone: '',
  address: ''
};

export default function ClientsScreen() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(clienteInicial);
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  const cargarClientes = async () => {
    try {
      // AQUÍ ESTÁ LA NUEVA URL CON AXIOS
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/clients`);
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const abrirModalParaEditar = (cliente: any) => {
    setIdEdicion(cliente.id);
    setNuevoCliente({
      name: cliente.name || '',
      rtn: cliente.rtn || '',
      email: cliente.email || '',
      phone: cliente.phone || '',
      address: cliente.address || ''
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevoCliente(clienteInicial);
    setIdEdicion(null);
  };

  const guardarCliente = async () => {
    if (!nuevoCliente.name.trim()) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    try {
      if (idEdicion) {
        // ACTUALIZAR CON LA NUEVA URL
        await axios.patch(`${import.meta.env.VITE_API_URL}/clients/${idEdicion}`, nuevoCliente);
      } else {
        // CREAR NUEVO CON LA NUEVA URL
        await axios.post(`${import.meta.env.VITE_API_URL}/clients`, nuevoCliente);
      }
      cerrarModal();
      cargarClientes();
    } catch (error) {
      console.error(error);
      alert("Error al guardar. Revisa los datos.");
    }
  };

  const eliminarCliente = async (id: number) => {
    if (window.confirm("¿Seguro que deseas borrar este cliente? Se mantendrá en las facturas viejas, pero ya no aparecerá en la caja.")) {
      try {
        // ELIMINAR CON LA NUEVA URL
        await axios.delete(`${import.meta.env.VITE_API_URL}/clients/${id}`);
        cargarClientes();
      } catch (error) {
        alert("Error al eliminar. Tal vez tiene facturas amarradas recientemente.");
      }
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f1f5f9', height: '100vh', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center' }}>
          <ContactsIcon sx={{ fontSize: 40, mr: 2, color: '#1e3a8a' }} />
          Directorio de Clientes y Talleres
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />} 
          onClick={() => setModalAbierto(true)} 
          sx={{ fontWeight: 'bold', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' }, borderRadius: 3, py: 1.5, px: 3, boxShadow: 4 }}
        >
          Nuevo Cliente
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3 }}>
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: '#e2e8f0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>NOMBRE DEL CLIENTE / TALLER</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>RTN</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>TELÉFONO</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>DIRECCIÓN</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', color: '#1e3a8a' }}>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="h6" color="text.secondary">Aún no hay clientes registrados.</Typography>
                  <Typography variant="body2" color="text.secondary">Haz clic en 'Nuevo Cliente' para empezar a guardar sus datos.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell sx={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.1rem' }}>{cliente.name}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>{cliente.rtn || 'N/A'}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>{cliente.phone || 'N/A'}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>{cliente.address || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => abrirModalParaEditar(cliente)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => eliminarCliente(cliente.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* FORMULARIO DE CLIENTE */}
      <Dialog open={modalAbierto} onClose={cerrarModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#1e3a8a' }}>
          {idEdicion ? 'Actualizar Datos del Cliente' : 'Registrar Nuevo Cliente'}
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#f1f5f9' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nombre del Cliente o Taller *" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoCliente.name} onChange={e => setNuevoCliente({...nuevoCliente, name: e.target.value})} autoFocus />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="RTN (Opcional)" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoCliente.rtn} onChange={e => setNuevoCliente({...nuevoCliente, rtn: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Teléfono (Opcional)" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoCliente.phone} onChange={e => setNuevoCliente({...nuevoCliente, phone: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Dirección o Ciudad (Opcional)" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoCliente.address} onChange={e => setNuevoCliente({...nuevoCliente, address: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Correo Electrónico (Opcional)" variant="outlined" sx={{ backgroundColor: '#fff' }} value={nuevoCliente.email} onChange={e => setNuevoCliente({...nuevoCliente, email: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc' }}>
          <Button onClick={cerrarModal} color="error" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
          <Button onClick={guardarCliente} variant="contained" sx={{ fontWeight: 'bold', backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }}>
            {idEdicion ? 'Guardar Cambios' : 'Registrar Cliente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}