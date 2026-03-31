import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // <-- ¡AQUÍ IMPORTAMOS LA MAGIA!
import { Box, Paper, Typography, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, FormControlLabel, Checkbox, Divider } from '@mui/material';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DeleteIcon from '@mui/icons-material/Delete';

export default function WorkersScreen() {
  const [workers, setWorkers] = useState<any[]>([]);
  
  const [modalNuevoMecanico, setModalNuevoMecanico] = useState(false);
  const [modalNuevoTrabajo, setModalNuevoTrabajo] = useState(false);
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState<any>(null);

  const [nombreMecanico, setNombreMecanico] = useState('');
  const [telefonoMecanico, setTelefonoMecanico] = useState('');
  
  const [descTrabajo, setDescTrabajo] = useState('');
  const [valorTotal, setValorTotal] = useState<number | ''>('');
  const [comision, setComision] = useState<number | ''>('');
  const [esTrabajoFuera, setEsTrabajoFuera] = useState(false);

  const cargarMecanicos = () => {
    // --- ACTUALIZADO A LA NUBE ---
    axios.get(`${import.meta.env.VITE_API_URL}/workers`).then(res => setWorkers(res.data)).catch(console.error);
  };

  useEffect(() => { cargarMecanicos(); }, []);

  const guardarMecanico = async () => {
    if (!nombreMecanico) {
      // ALERTA BONITA DE ERROR
      return Swal.fire({ icon: 'error', title: 'Faltan datos', text: 'El nombre del mecánico es obligatorio.', confirmButtonColor: '#3085d6' });
    }
    
    // --- ACTUALIZADO A LA NUBE ---
    await axios.post(`${import.meta.env.VITE_API_URL}/workers`, { name: nombreMecanico, phone: telefonoMecanico });
    setNombreMecanico(''); setTelefonoMecanico('');
    setModalNuevoMecanico(false);
    cargarMecanicos();
    
    // ALERTA BONITA DE ÉXITO (Se cierra sola)
    Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'El mecánico se registró correctamente.', timer: 1500, showConfirmButton: false });
  };

  const abrirModalTrabajo = (mecanico: any) => {
    setMecanicoSeleccionado(mecanico);
    setDescTrabajo(''); setValorTotal(''); setComision(''); setEsTrabajoFuera(false);
    setModalNuevoTrabajo(true);
  };

  const guardarTrabajo = async () => {
    if (!descTrabajo || valorTotal === '' || comision === '') {
      return Swal.fire({ icon: 'warning', title: 'Campos vacíos', text: 'Por favor, llena todos los campos del trabajo.', confirmButtonColor: '#f59e0b' });
    }
    
    // --- ACTUALIZADO A LA NUBE ---
    await axios.post(`${import.meta.env.VITE_API_URL}/workers/${mecanicoSeleccionado.id}/jobs`, {
      description: descTrabajo,
      jobValue: Number(valorTotal),
      workerCut: Number(comision),
      isOutside: esTrabajoFuera
    });
    
    setModalNuevoTrabajo(false);
    cargarMecanicos();
    
    Swal.fire({ icon: 'success', title: '¡Trabajo Registrado!', text: 'Las comisiones se han actualizado.', timer: 1500, showConfirmButton: false });
  };

  const eliminarTrabajo = (jobId: number) => {
    // PREGUNTA BONITA DE SÍ O NO
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrará este trabajo y se restará la comisión.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // --- ACTUALIZADO A LA NUBE ---
        await axios.delete(`${import.meta.env.VITE_API_URL}/workers/jobs/${jobId}`);
        cargarMecanicos();
        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El trabajo ha sido borrado.', timer: 1500, showConfirmButton: false });
      }
    });
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center' }}>
          <EngineeringIcon sx={{ fontSize: 40, mr: 2, color: '#f59e0b' }} />
          Control de Personal y Comisiones
        </Typography>
        <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setModalNuevoMecanico(true)} sx={{ backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' }, fontWeight: 'bold' }}>
          Nuevo Mecánico
        </Button>
      </Box>

      <Grid container spacing={4}>
        {workers.map(worker => {
          const totalComisiones = worker.jobs?.reduce((sum: number, job: any) => sum + job.workerCut, 0) || 0;
          const totalGenerado = worker.jobs?.reduce((sum: number, job: any) => sum + job.jobValue, 0) || 0;

          return (
            <Grid item xs={12} md={6} key={worker.id}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, borderTop: '5px solid #f59e0b' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">{worker.name}</Typography>
                  <Button variant="outlined" size="small" startIcon={<BuildIcon />} onClick={() => abrirModalTrabajo(worker)} sx={{ fontWeight: 'bold' }}>
                    Registrar Trabajo
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3, mb: 2, backgroundColor: '#f8fafc', p: 2, borderRadius: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Generado al Taller</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="#16a34a">Lps. {totalGenerado.toFixed(2)}</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Comisión a Pagarle</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="#dc2626">Lps. {totalComisiones.toFixed(2)}</Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Historial de Trabajos:</Typography>
                <TableContainer sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Descripción</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Cobro</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Su Comisión</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>X</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {worker.jobs?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center">Sin trabajos registrados</TableCell></TableRow>
                      ) : (
                        worker.jobs?.map((job: any) => (
                          <TableRow key={job.id} hover>
                            <TableCell>
                              {job.description} 
                              {job.isOutside && <span style={{ color: '#8b5cf6', fontSize: '0.7rem', marginLeft: '5px', fontWeight: 'bold' }}>(Afuera)</span>}
                            </TableCell>
                            <TableCell align="right">Lps. {job.jobValue.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 'bold' }}>Lps. {job.workerCut.toFixed(2)}</TableCell>
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => eliminarTrabajo(job.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={modalNuevoMecanico} onClose={() => setModalNuevoMecanico(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Agregar Mecánico</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="Nombre del Mecánico" sx={{ mb: 2 }} value={nombreMecanico} onChange={e => setNombreMecanico(e.target.value)} />
          <TextField fullWidth label="Teléfono (Opcional)" value={telefonoMecanico} onChange={e => setTelefonoMecanico(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalNuevoMecanico(false)} color="inherit">Cancelar</Button>
          <Button onClick={guardarMecanico} variant="contained" color="warning" sx={{ fontWeight: 'bold' }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={modalNuevoTrabajo} onClose={() => setModalNuevoTrabajo(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Registrar Trabajo - {mecanicoSeleccionado?.name}
        </DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="Descripción del Trabajo (Ej: Cambio de frenos)" sx={{ mb: 3 }} value={descTrabajo} onChange={e => setDescTrabajo(e.target.value)} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Valor Cobrado al Cliente (Lps)" value={valorTotal} onChange={e => setValorTotal(e.target.value === '' ? '' : Number(e.target.value))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Comisión del Mecánico (Lps)" value={comision} onChange={e => setComision(e.target.value === '' ? '' : Number(e.target.value))} />
            </Grid>
          </Grid>
          <Box sx={{ backgroundColor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #cbd5e1' }}>
            <FormControlLabel 
              control={<Checkbox checked={esTrabajoFuera} onChange={e => setEsTrabajoFuera(e.target.checked)} color="secondary" />} 
              label={<Typography fontWeight="bold" color="#8b5cf6">El trabajo se hizo afuera del taller</Typography>} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalNuevoTrabajo(false)} color="inherit">Cancelar</Button>
          <Button onClick={guardarTrabajo} variant="contained" color="primary" startIcon={<AttachMoneyIcon />} sx={{ fontWeight: 'bold' }}>Registrar Pago</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}