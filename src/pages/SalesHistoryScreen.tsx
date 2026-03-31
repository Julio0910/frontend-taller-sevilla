import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Box, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DownloadIcon from '@mui/icons-material/Download';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

export default function SalesHistoryScreen() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [trabajosAfuera, setTrabajosAfuera] = useState<any[]>([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any | null>(null);
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);

  // --- DATOS OFICIALES DEL SAR ---
  const sarRTN = "18041987005000"; 
  const sarCAI = "387D05-2EEA45-76DEE0-63BE03-090928-C6";
  const sarRango = "000-001-01-00000251 al 000-001-01-00000300";
  const sarFechaLimite = "26/06/2026";

  const cargarDatos = async () => { 
    try {
      const resFacturas = await axios.get(`${import.meta.env.VITE_API_URL}/invoices`);
      setFacturas(resFacturas.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const resTrabajos = await axios.get(`${import.meta.env.VITE_API_URL}/workers/jobs`);
      const trabajosExternos = resTrabajos.data.filter((job: any) => job.isOutside === true);
      setTrabajosAfuera(trabajosExternos);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudieron cargar los datos del reporte.' });
    }
  };
  
  useEffect(() => { cargarDatos(); }, []);

  const verDetalleFactura = async (id: number) => { 
    try { 
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/${id}`); 
      setFacturaSeleccionada(response.data); 
    } catch (error) { 
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Ocurrió un error al cargar los detalles de esta factura.' }); 
    } 
  };

  const exportarAExcel = () => {
    try {
      const datosParaExcel = facturas.map((fac) => ({
        "N° Factura": fac.invoiceNumber,
        "Tipo": fac.taxAmount > 0 ? "Factura Oficial" : "Registro Interno",
        "Fecha": new Date(fac.createdAt).toLocaleDateString(),
        "Hora": new Date(fac.createdAt).toLocaleTimeString(),
        "Cliente": fac.client?.name || 'Consumidor Final',
        "RTN": fac.client?.rtn || 'N/A',
        "Método de Pago": fac.paymentMethod,
        "Gravado 15% (Lps)": fac.subtotal,
        "ISV 15% (Lps)": fac.taxAmount,
        "Mano de Obra/Exento (Lps)": fac.laborPrice || 0,
        "Recargos ACH (Lps)": fac.surcharge || 0,
        "Total Pagado (Lps)": fac.totalAmount
      }));
      const hojaDeTrabajo = XLSX.utils.json_to_sheet(datosParaExcel);
      const libroDeTrabajo = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, "Reporte de Ventas");
      XLSX.writeFile(libroDeTrabajo, "Reporte_Ventas_Taller_Sevilla.xlsx");
      
      Swal.fire({ icon: 'success', title: '¡Excel Descargado!', text: 'El reporte se generó correctamente.', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el archivo Excel.' });
    }
  };

  const hoy = new Date().toLocaleDateString();
  const facturasDeHoy = facturas.filter(fac => new Date(fac.createdAt).toLocaleDateString() === hoy);
  const trabajosAfueraHoy = trabajosAfuera.filter(job => new Date(job.createdAt).toLocaleDateString() === hoy);
  const totalIngresosAfuera = trabajosAfueraHoy.reduce((suma, job) => suma + job.jobValue, 0);

  const totalHoy = facturasDeHoy.reduce((suma, fac) => suma + fac.totalAmount, 0) + totalIngresosAfuera;
  const totalHistorico = facturas.reduce((suma, fac) => suma + fac.totalAmount, 0) + trabajosAfuera.reduce((suma, job) => suma + job.jobValue, 0);
  
  const efectivoLocal = facturasDeHoy.filter(f => f.paymentMethod.includes('Efectivo')).reduce((s, f) => s + f.totalAmount, 0);
  const totalEfectivo = efectivoLocal + totalIngresosAfuera; 
  const totalTransferencias = facturasDeHoy.filter(f => !f.paymentMethod.includes('Efectivo')).reduce((s, f) => s + f.totalAmount, 0);
  
  const totalManoObra = facturasDeHoy.reduce((s, f) => s + (f.laborPrice || 0) + (f.surcharge || 0), 0);
  const totalRepuestos = facturasDeHoy.reduce((s, f) => s + f.subtotal, 0);
  const totalISV = facturasDeHoy.reduce((s, f) => s + f.taxAmount, 0);

  return (
    <Box sx={{ p: 4, backgroundColor: '#f1f5f9', height: '100vh', overflowY: 'auto', '@media print': { height: 'auto', overflow: 'visible', p: 0 } }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }} className="no-print">
        <Typography variant="h4" fontWeight="900" color="#0f172a">📊 Reportes y Cierre de Caja</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<PointOfSaleIcon />} onClick={() => setModalCierreAbierto(true)} sx={{ backgroundColor: '#eab308', '&:hover': { backgroundColor: '#ca8a04' }, fontWeight: 'bold', color: '#000' }}>
            Imprimir Cierre Diario
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportarAExcel} sx={{ backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, fontWeight: 'bold' }}>
            Exportar a Excel
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }} className="no-print">
        <Grid item xs={12} md={4}><Paper elevation={4} sx={{ p: 3, borderRadius: 3, borderLeft: '7px solid #16a34a' }}><Grid container alignItems="center"><Grid item><AccountBalanceWalletIcon sx={{ fontSize: 50, color: '#16a34a', mr: 2 }} /></Grid><Grid item><Typography variant="subtitle2" color="text.secondary">Dinero en Caja (Hoy)</Typography><Typography variant="h4" fontWeight="900">Lps. {totalHoy.toFixed(2)}</Typography></Grid></Grid></Paper></Grid>
        <Grid item xs={12} md={4}><Paper elevation={4} sx={{ p: 3, borderRadius: 3, borderLeft: '7px solid #1e3a8a' }}><Grid container alignItems="center"><Grid item><AccountBalanceWalletIcon sx={{ fontSize: 50, color: '#1e3a8a', mr: 2 }} /></Grid><Grid item><Typography variant="subtitle2" color="text.secondary">Total Ingresos (Siempre)</Typography><Typography variant="h4" fontWeight="900">Lps. {totalHistorico.toFixed(2)}</Typography></Grid></Grid></Paper></Grid>
      </Grid>

      <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 2 }} className="no-print">Registro de Facturas Emitidas</Typography>
      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflowY: 'auto' }} className="no-print">
        <Table stickyHeader size="small">
          <TableHead sx={{ backgroundColor: '#e2e8f0' }}><TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>N° FACTURA / REGISTRO</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>TIPO</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>FECHA</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>CLIENTE</TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>TOTAL</TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>ACCIONES</TableCell>
          </TableRow></TableHead>
          <TableBody>{facturas.map((fac) => (
            <TableRow key={fac.id} hover>
              <TableCell sx={{ fontWeight: 'bold' }}>{fac.invoiceNumber}</TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ backgroundColor: fac.taxAmount > 0 ? '#dbeafe' : '#f1f5f9', color: fac.taxAmount > 0 ? '#1e3a8a' : '#475569', p: 0.5, borderRadius: 1, fontWeight: 'bold' }}>
                  {fac.taxAmount > 0 ? 'Factura SAR' : 'Reg. Interno'}
                </Typography>
              </TableCell>
              <TableCell>{new Date(fac.createdAt).toLocaleDateString()} {new Date(fac.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
              <TableCell>{fac.client?.name || 'Consumidor Final'}</TableCell>
              <TableCell align="right" sx={{ fontWeight: '900', color: '#16a34a', fontSize: '1.1rem' }}>Lps. {fac.totalAmount.toFixed(2)}</TableCell>
              <TableCell align="center"><IconButton color="primary" onClick={() => verDetalleFactura(fac.id)}><VisibilityIcon /></IconButton></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </TableContainer>

      {/* --- MODAL 1: REIMPRESIÓN VISTA PREVIA --- */}
      <Dialog open={facturaSeleccionada !== null} onClose={() => setFacturaSeleccionada(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#1e3a8a', color: '#fff' }} className="no-print">Vista Previa del Documento</DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#e2e8f0' }}>
          {facturaSeleccionada && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }} className="no-print-padding">
              <Box id="area-impresion-factura" sx={{ 
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
                    {/* LOGICA INTELIGENTE: Si tiene impuesto (SAR), muestra CAI. Si es 0 (Interna), oculta esto. */}
                    {facturaSeleccionada.taxAmount > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2"><strong>CAI:</strong> {sarCAI}</Typography>
                        <Typography variant="body2"><strong>Rango Autorizado:</strong> {sarRango}</Typography>
                        <Typography variant="body2"><strong>Fecha Límite Emisión:</strong> {sarFechaLimite}</Typography>
                      </Box>
                    )}
                    <Box sx={{ mt: facturaSeleccionada.taxAmount > 0 ? 0 : 2 }}>
                      <Typography variant="body2"><strong>Cliente:</strong> {facturaSeleccionada.client?.name || 'Consumidor Final'}</Typography>
                      <Typography variant="body2"><strong>RTN:</strong> {facturaSeleccionada.client?.rtn || 'Consumidor Final'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={5} sx={{ textAlign: 'right' }}>
                    <Box sx={{ border: '2px solid #000', p: 1, borderRadius: 1, display: 'inline-block', textAlign: 'center', minWidth: '200px', backgroundColor: facturaSeleccionada.taxAmount === 0 ? '#f8fafc' : 'transparent' }}>
                      <Typography variant="subtitle1" fontWeight="bold">{facturaSeleccionada.taxAmount > 0 ? 'COPIA DE FACTURA' : 'REGISTRO INTERNO'}</Typography>
                      <Typography variant="body1" fontWeight="bold">N° {facturaSeleccionada.invoiceNumber}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 2 }}><strong>Fecha:</strong> {new Date(facturaSeleccionada.createdAt).toLocaleDateString('es-HN')}</Typography>
                    <Typography variant="body2"><strong>Condición de Pago:</strong> Contado ({facturaSeleccionada.paymentMethod})</Typography>
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
                    {facturaSeleccionada.items.map((item: any, index: number) => (
                      <TableRow key={index} sx={{ '& td': { border: '1px solid #000', fontSize: '0.85rem', py: 0.5 } }}>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell>
                            {item.product?.name || 'Producto Eliminado'}
                            {item.product?.barcode && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Código: {item.product.barcode}</Typography>}
                        </TableCell>
                        <TableCell align="right">{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {facturaSeleccionada.laborPrice > 0 && (
                      <TableRow sx={{ '& td': { border: '1px solid #000', fontSize: '0.85rem', py: 0.5 } }}>
                        <TableCell align="center">1</TableCell>
                        <TableCell>Mano de Obra: {facturaSeleccionada.laborDesc || 'Servicio'}</TableCell>
                        <TableCell align="right">{facturaSeleccionada.laborPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{facturaSeleccionada.laborPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    {facturaSeleccionada.surcharge > 0 && (
                      <TableRow sx={{ '& td': { border: '1px solid #000', fontSize: '0.85rem', py: 0.5 } }}>
                        <TableCell align="center">1</TableCell>
                        <TableCell>Comisión Transacción Bancaria</TableCell>
                        <TableCell align="right">{facturaSeleccionada.surcharge.toFixed(2)}</TableCell>
                        <TableCell align="right">{facturaSeleccionada.surcharge.toFixed(2)}</TableCell>
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
                        {/* LÓGICA INTELIGENTE EN TOTALES */}
                        {facturaSeleccionada.taxAmount > 0 ? (
                          <>
                            <TableRow><TableCell>Importe Exento:</TableCell><TableCell align="right">Lps. {((facturaSeleccionada.laborPrice || 0) + (facturaSeleccionada.surcharge || 0)).toFixed(2)}</TableCell></TableRow>
                            <TableRow><TableCell>Importe Gravado 15%:</TableCell><TableCell align="right">Lps. {facturaSeleccionada.subtotal.toFixed(2)}</TableCell></TableRow>
                            <TableRow><TableCell>15% I.S.V.:</TableCell><TableCell align="right">Lps. {facturaSeleccionada.taxAmount.toFixed(2)}</TableCell></TableRow>
                          </>
                        ) : (
                          <TableRow><TableCell>Subtotal:</TableCell><TableCell align="right">Lps. {facturaSeleccionada.subtotal.toFixed(2)}</TableCell></TableRow>
                        )}
                        <TableRow><TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>TOTAL PAGADO:</TableCell><TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Lps. {facturaSeleccionada.totalAmount.toFixed(2)}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Typography variant="caption" fontWeight="bold">ORIGINAL: Cliente / COPIA: Obligado Tributario</Typography>
                    <Box sx={{ textAlign: 'center', width: '250px' }}>
                      <Divider sx={{ borderColor: '#000', mb: 0.5 }} />
                      <Typography variant="caption">Firma Conforme Cliente</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">--- ESTA ES UNA COPIA FIEL DEL DOCUMENTO ORIGINAL ---</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>¡Gracias por confiar su vehículo en Taller Sevilla!</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="no-print" sx={{ backgroundColor: '#f8fafc', p: 2 }}>
          <Button onClick={() => setFacturaSeleccionada(null)} color="error" variant="outlined" sx={{ fontWeight: 'bold' }}>Cerrar</Button>
          <Button onClick={() => window.print()} variant="contained" color="primary" startIcon={<PrintIcon />} sx={{ fontWeight: 'bold', px: 4 }}>Imprimir Copia</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL 2: REPORTE DE CIERRE DIARIO --- */}
      <Dialog open={modalCierreAbierto} onClose={() => setModalCierreAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#eab308', color: '#000' }} className="no-print">Vista Previa: Cierre de Caja</DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }} className="no-print-padding">
              <Box id="area-impresion-cierre" sx={{ 
                width: '100%', maxWidth: '210mm', backgroundColor: '#fff', p: 5, boxShadow: 3, color: '#000', fontFamily: 'Arial, sans-serif', margin: '0 auto',
                '@media print': { maxWidth: '100%', height: 'auto', margin: 0, padding: 0, boxShadow: 'none', pageBreakInside: 'avoid' }
              }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" fontWeight="900">INVERSIONES SEVILLA</Typography>
                  <Typography variant="body1" fontWeight="bold">REPORTE DE CIERRE DE CAJA DIARIO</Typography>
                  <Typography variant="body2">Fecha de Cierre: {hoy}</Typography>
                  <Typography variant="body2">Operaciones Registradas Hoy: {facturasDeHoy.length}</Typography>
                  <Typography variant="body2">Trabajos de Mecánicos Afuera: {trabajosAfueraHoy.length}</Typography>
                </Box>

                <Divider sx={{ borderBottomWidth: 3, borderColor: '#000', mb: 3 }} />

                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, textTransform: 'uppercase' }}>1. Desglose de Ventas (Facturado SAR)</Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableBody sx={{ '& td': { py: 1, fontSize: '1rem' } }}>
                    <TableRow><TableCell>Venta en Repuestos (Gravado):</TableCell><TableCell align="right">Lps. {totalRepuestos.toFixed(2)}</TableCell></TableRow>
                    <TableRow><TableCell>Mano de Obra / Exentos:</TableCell><TableCell align="right">Lps. {totalManoObra.toFixed(2)}</TableCell></TableRow>
                    <TableRow><TableCell>Impuestos Recaudados (ISV):</TableCell><TableCell align="right">Lps. {totalISV.toFixed(2)}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 'bold', borderTop: '2px solid #000' }}>SUBTOTAL FACTURADO:</TableCell><TableCell align="right" sx={{ fontWeight: 'bold', borderTop: '2px solid #000' }}>Lps. {(totalRepuestos + totalManoObra + totalISV).toFixed(2)}</TableCell></TableRow>
                  </TableBody>
                </Table>

                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, textTransform: 'uppercase' }}>2. Ingresos de Dinero (Arqueo de Gaveta)</Typography>
                <Table size="small" sx={{ mb: 4, border: '1px solid #000' }}>
                  <TableBody sx={{ '& td': { border: '1px solid #000', py: 1.5, fontSize: '1.1rem' } }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>💵 EFECTIVO EN GAVETA (Ventas Locales):</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Lps. {efectivoLocal.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>🚗 EFECTIVO EXTRA (Trabajos Afuera):</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>Lps. {totalIngresosAfuera.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: '900', backgroundColor: '#e2e8f0' }}>💰 TOTAL EFECTIVO A DEPOSITAR:</TableCell>
                      <TableCell align="right" sx={{ fontWeight: '900', backgroundColor: '#e2e8f0' }}>Lps. {totalEfectivo.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>📱 Transferencias/Depósitos (Banco):</TableCell>
                      <TableCell align="right">Lps. {totalTransferencias.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
                  <Box sx={{ textAlign: 'center', width: '200px' }}>
                    <Divider sx={{ borderColor: '#000', mb: 1 }} />
                    <Typography variant="body2">Firma del Cajero</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', width: '200px' }}>
                    <Divider sx={{ borderColor: '#000', mb: 1 }} />
                    <Typography variant="body2">Firma de Administración</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" display="block" align="center" sx={{ mt: 4, color: 'text.secondary' }}>* Este documento es de control interno del taller y no representa una factura fiscal.</Typography>
              </Box>
            </Box>
        </DialogContent>
        <DialogActions className="no-print" sx={{ backgroundColor: '#f8fafc', p: 2 }}>
          <Button onClick={() => setModalCierreAbierto(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cerrar</Button>
          <Button onClick={() => window.print()} variant="contained" color="warning" startIcon={<PrintIcon />} sx={{ fontWeight: 'bold', px: 4, color: '#000' }}>Imprimir Arqueo (Canon)</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}