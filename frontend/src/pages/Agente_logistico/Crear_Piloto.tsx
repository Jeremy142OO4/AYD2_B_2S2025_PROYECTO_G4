import * as React from "react"

import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import MenuItem from "@mui/material/MenuItem"
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace"
import PersonIcon from "@mui/icons-material/Person"
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { useNavigate } from "react-router-dom"

export default function CrearPiloto() {
  const navigate = useNavigate()

  /* endpoitn para crear piloto */


  
  
  const [nombre, setNombre] = React.useState("");
  const [Correo, setCorreo] = React.useState("");
  const [password, setPassword] = React.useState("");
    const [licencia, setLicencia] = React.useState("");
  const [foto, setFoto] = React.useState("")
  
  
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = () => {
    const base64String = reader.result as string;

    // GUARDAR COMPLETO (para enviar al backend)
    setFoto(base64String);
  };

  reader.readAsDataURL(file);
};
  const preview = foto
  ? foto.substring(foto.indexOf(",") + 1)
  : null;
  
      /* Post para crear orden   */
      
  const guardarPiloto = async () => {
    try {
      const response = await fetch("http://localhost:4000/agente_logistico/piloto/agregar_piloto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
         nombre : nombre,
         correo : Correo,
         password : password,
         foto_perfil: preview,
         licencia : licencia
        }),
      });
  
      if (!response.ok) {
        throw new Error("No se pudo guardar el evento");
      }
  
      const data = await response.json();
     
      console.log("Evento guardado:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  const inputCafe = {
    background: "rgba(210,193,182,0.28)",
    borderRadius: "12px",
    backdropFilter: "blur(8px)",
    boxShadow: "0 8px 20px rgba(92,64,51,0.18)",

    "& .MuiInputBase-input": {
      color: "#4E342E",
    },

    "& .MuiInputLabel-root": {
      color: "rgba(78,52,46,0.78)",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#5D4037",
    },

    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "rgba(160,120,96,0.45)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(121,85,72,0.75)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#8D6E63",
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
          background: "linear-gradient(135deg, rgb(249,243,239), rgb(210,193,182))",
          borderRadius: "16px",
          padding: "24px",
          mb: 4,
          boxShadow: "0 8px 24px rgba(121,85,72,0.16)",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="#4E342E"  fontFamily="Poppins">
          Crear Piloto
        </Typography>

        <Button
          variant="contained"
          startIcon={<KeyboardBackspaceIcon />}
          onClick={() => navigate(-1)}
          sx={{
            background: "linear-gradient(135deg, #A1887F, #6D4C41)",
            borderRadius: "12px",
            fontWeight: "bold",
            px: 3,
            py: 1.2,
            boxShadow: "0 8px 20px rgba(92,64,51,0.22)",
            "&:hover": {
              background: "linear-gradient(135deg, #8D6E63, #5D4037)",
            },
          }}
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
            background: "linear-gradient(135deg, rgb(249,243,239), rgb(210,193,182))",
            boxShadow: "0 10px 28px rgba(121,85,72,0.14)",
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
              label="Piloto"
              variant="outlined"
              fullWidth
              placeholder="Ej. Juan Pérez"
              sx={inputCafe}
              onChange={(e)=> setNombre(e.target.value)}
            />

            <TextField
              select
              label="Tipo de licencia"
              variant="outlined"
              fullWidth
              defaultValue=""
              sx={inputCafe}
              onChange={(e)=> setLicencia(e.target.value)}

            >
              <MenuItem value="A">Licencia A</MenuItem>
              <MenuItem value="B">Licencia B</MenuItem>
              <MenuItem value="C">Licencia C</MenuItem>
              <MenuItem value="M">Licencia M</MenuItem>
              <MenuItem value="E">Licencia E</MenuItem>
            </TextField>

       
            <TextField
              label="correo"
              variant="outlined"
              fullWidth
              placeholder="Ej. pilotoTrans@gmail.com"
              sx={inputCafe}
              onChange={(e)=> setCorreo(e.target.value)}
            />

            <TextField
              label="password"
              variant="outlined"
              fullWidth
              placeholder="Ej. 5555"
              sx={inputCafe}
              onChange={(e)=> setPassword(e.target.value)}
            />
  <Button
          variant="contained"
          startIcon={<PersonAddAltIcon/>}
          onClick={guardarPiloto}
          sx={{
            background: "linear-gradient(135deg, #A1887F, #6D4C41)",
            borderRadius: "12px",
            fontWeight: "bold",
            px: 3,
            py: 1.2,
            boxShadow: "0 8px 20px rgba(92,64,51,0.22)",
            "&:hover": {
              background: "linear-gradient(135deg, #8D6E63, #5D4037)",
            },
          }}
        >
          Guardar
        </Button>
      
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: "18px",
            background: "rgba(249,243,239,0.7)",
            border: "2px dashed rgba(141,110,99,0.55)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 350,
            boxShadow: "0 8px 20px rgba(121,85,72,0.12)",
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2} color="#5D4037">
            Foto del Piloto
          </Typography>

      <Box
  sx={{
    width: "100%",
    height: 200,
    borderRadius: "12px",
    background: "rgba(210,193,182,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    mb: 2,
    color: "#6D4C41",
    overflow: "hidden",
  }}
>
  {foto ? (
    <img
      src={`data:image/png;base64,${preview}`}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <>
      <PersonIcon sx={{ mr: 1 }} />
      Vista previa
    </>
  )}
</Box>

          <Button
            variant="outlined"
            component="label"
            sx={{
              borderColor: "#8D6E63",
              color: "#5D4037",
              fontWeight: "bold",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.25)",
              "&:hover": {
                borderColor: "#6D4C41",
                background: "rgba(210,193,182,0.22)",
              },
            }}
          >
            Subir Foto
<input
  type="file"
  hidden
  accept="image/*"
  onChange={handleFoto}
/>
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}