import * as React from "react"

import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import MenuItem from "@mui/material/MenuItem"
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace"
import { useNavigate } from "react-router-dom"

export default function CrearCamion() {
  const navigate = useNavigate()

  /* enpoint post para crear camion */

  

  const [placa, setPlaca] = React.useState("");
  const [tipo, setTipo] = React.useState("");
  const [capacidad, setCapacidad] = React.useState("")
  
  
  
  
  
      /* Post para crear orden   */
      
const CrearCamion = async () => {

  if (!placa.trim() || !tipo.trim() || !capacidad.trim()) {
  alert("Todos los campos son obligatorios");
  return;
}

if (isNaN(parseFloat(capacidad)) || parseFloat(capacidad) <= 0) {
  alert("La capacidad debe ser un número mayor a 0");
  return;
}

  try {
    const payload = {
      placa: placa.trim(),
      tipo: tipo.trim(),
      capacidad: parseFloat(capacidad)
    };

    console.log("Enviando:", payload);

    const response = await fetch("http://localhost:4000/agente_logistico/vehiculos/crear_camion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Respuesta backend:", data);

    if (!response.ok) {
      throw new Error(data.error || "No se pudo crear el camion");
    }

    alert(data.message);
  } catch (error) {
    console.error("Error real:", error);
  }
};
  
  const inputGlass = {
    background: "rgba(69,104,130,0.45)",
    borderRadius: "12px",
    backdropFilter: "blur(8px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",

    "& .MuiInputBase-input": {
      color: "#fff",
    },

    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.7)",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#fff",
    },

    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.4)",
      },
      "&:hover fieldset": {
        borderColor: "#fff",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#fff",
      },
    },
  }

  return (
    <Box p={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg,#D2C1B6,#1B3C53)",
          borderRadius: "16px",
          padding: "24px",
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold"  fontFamily="Poppins">
          Crear Camión
        </Typography>

        <Button
          variant="contained"
          sx={{
            background: "linear-gradient(135deg,#456882,#1B3C53)",
            borderRadius: "12px",
            fontWeight: "bold",
            px: 3,
            py: 1.2,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          }}
          startIcon={<KeyboardBackspaceIcon />}
          onClick={() => navigate(-1)}
        >
          Regresar
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 350px" },
          gap: 3,
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: "18px",
            background: "linear-gradient(135deg,#D2C1B6,#1B3C53)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              select
              label="Tipo de camión"
              variant="outlined"
              fullWidth
              defaultValue=""
              sx={inputGlass}
              onChange={(e)=> setTipo(e.target.value)}
            >
              <MenuItem value="Liviano">Liviano</MenuItem>
              <MenuItem value="Mediano">Mediano</MenuItem>
              <MenuItem value="Pesado">Pesado</MenuItem>
              <MenuItem value="Furgón">Furgón</MenuItem>
              <MenuItem value="Refrigerado">Refrigerado</MenuItem>
              <MenuItem value="Plataforma">Plataforma</MenuItem>
            </TextField>

            <TextField
              label="Capacidad"
              variant="outlined"
              fullWidth
              placeholder="Ej. 5 toneladas"
              sx={inputGlass}
              type = "number"    inputProps={{
    step: "0.01",   // permite decimales
    min: 0          // no negativos
  }} 
              onChange={(e)=> setCapacidad(e.target.value)}
            />

            <TextField
              label="Placa"
              variant="outlined"
              fullWidth
              placeholder="Ej. Hino 300"
              sx={inputGlass}
              onChange={(e)=> setPlaca(e.target.value)}
            />

        

            <TextField
              label="Descripción"
              variant="outlined"
              multiline
              rows={4}
              fullWidth
              sx={{
                ...inputGlass,
                gridColumn: "1 / -1",
              }}
            />
                 <Button
          variant="contained"
          sx={{
            background: "linear-gradient(135deg,#456882,#1B3C53)",
            borderRadius: "12px",
            fontWeight: "bold",
            px: 3,
            py: 1.2,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          }}
          startIcon={<KeyboardBackspaceIcon />}
     onClick={CrearCamion}
        >
          Crear
        </Button>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: "18px",
            background: "rgba(69,104,130,0.15)",
            border: "2px dashed rgba(27,60,83,0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 350,
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Foto del Camión
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 200,
              borderRadius: "12px",
              background: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            Vista previa
          </Box>

          <Button
            variant="outlined"
            component="label"
            sx={{
              borderColor: "#456882",
              color: "#1B3C53",
              fontWeight: "bold",
            }}
          >
            Subir Foto
            <input type="file" hidden accept="image/*" />
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}