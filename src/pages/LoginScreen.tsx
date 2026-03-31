import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, InputAdornment, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CarRepairIcon from '@mui/icons-material/CarRepair';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface LoginProps {
  onLoginExitoso: () => void;
}

export default function LoginScreen({ onLoginExitoso }: LoginProps) {
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState(false);

  const claveMaestra = "Sevilla2026"; // <--- AQUÍ PUEDES CAMBIAR LA CONTRASEÑA

  const intentarIngresar = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === claveMaestra) {
      setError(false);
      onLoginExitoso();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
      <Paper elevation={10} sx={{ p: 5, borderRadius: 4, width: '100%', maxWidth: '400px', textAlign: 'center', borderTop: '8px solid #f97316' }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box sx={{ backgroundColor: '#1e3a8a', p: 2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CarRepairIcon sx={{ fontSize: 50, color: '#fff' }} />
          </Box>
        </Box>

        <Typography variant="h4" fontWeight="900" color="#1e3a8a" sx={{ letterSpacing: 1, mb: 1 }}>
          TALLER SEVILLA
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 'bold' }}>
          ACCESO ADMINISTRATIVO
        </Typography>

        <form onSubmit={intentarIngresar}>
          <TextField
            fullWidth
            type={mostrarPassword ? 'text' : 'password'}
            label="Contraseña Maestra"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            helperText={error ? "Contraseña incorrecta." : ""}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color={error ? "error" : "action"} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setMostrarPassword(!mostrarPassword)} edge="end">
                    {mostrarPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large"
            sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
          >
            ENTRAR AL SISTEMA
          </Button>
        </form>

      </Paper>
    </Box>
  );
}