import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import NavbarPiloto from "./Navbar_piloto";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import { useLocation, useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close"


export default function DetalleViaje() {
const navigate = useNavigate();
const location = useLocation();
const viaje = location.state?.viaje;


const [tipo, setTipo] = React.useState("")
const [descripcion, setDescripcion] = React.useState("")
const [loading, setLoading] = React.useState(false)
const convertirBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
  const pasos = [
    { nombre: "Orden asignada", activo: true },
    { nombre: "Salida de patio", activo: true },
    { nombre: "En tránsito", activo: true },
    { nombre: "Entregado", activo: false },
  ];

  const [imagen, setImagen] = React.useState<File | null>(null);
const [preview, setPreview] = React.useState<string | null>(null);
const manejarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  }
};

const cancelarViaje = async () => {
  try {

    if (!viaje?.id) {
      alert("No hay id de orden")
      return
    }

    const confirmar = window.confirm("¿Seguro que deseas cancelar la entrega?")
    if (!confirmar) return

    setLoading(true)

    const response = await fetch(
      `http://localhost:4000/viajes/detalle/cancelar/${viaje.id}`,
      {
        method: "POST"
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "No se pudo cancelar")
    }

    alert(" Entrega cancelada correctamente")

    navigate(-1)

  } catch (error) {
    alert("Error al cancelar entrega")
  } finally {
    setLoading(false)
  }
}
const guardarEvento = async () => {
  try {

    if (!tipo || !descripcion) {
      alert("Completa todos los campos")
      return
    }

    setLoading(true)

    let fotoBase64 = ""

    if (imagen) {
      fotoBase64 = await convertirBase64(imagen)
    }

    const payload = {
      placa: viaje?.placa,
      tipo: tipo,
      descripcion: descripcion,
      foto: fotoBase64
    }

    const response = await fetch(
      "http://localhost:4000/viajes/detalle/reportar_evento",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Error al reportar evento")
    }

    alert("✅ Evento registrado correctamente")
    cerrarModal()

    setTipo("")
    setDescripcion("")
    setImagen(null)
    setPreview(null)

  } catch (error) {
    alert(" Error al registrar evento")
  } finally {
    setLoading(false)
  }
}
  const [openModal, setOpenModal] = React.useState(false);

  const abrirModal = () => {
    setOpenModal(true);
  };

  const cerrarModal = () => {
    setOpenModal(false);
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
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(130deg, #1B3C53 50%, #D2C1B6 90%)",
      }}
    >
      <NavbarPiloto />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          px: 2,
          py: 4,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              gap: 2,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: "#F9F3EF",
                fontWeight: "bold",
                fontFamily: "Poppins",
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              Estado del viaje
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate(-1)}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: "10px",
                background: "#456882",
                color: "#F9F3EF",
                fontFamily: "Poppins",
                minWidth: { xs: "100%", sm: "160px" },
                "&:hover": {
                  background: "#1B3C53",
                },
              }}
            >
              Regresar
            </Button>
          </Box>

          <Card
            sx={{
              borderRadius: "18px",
              background: "linear-gradient(130deg, #456882 40%, #1B3C53 80%)",
              boxShadow: "0 10px 30px rgba(27,60,83,0.20)",
              border: "1px solid rgba(7, 7, 7, 0.85)",
              p: 3,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                color: "#F9F3EF",
                fontFamily: "Poppins",
                mb: 3,
              }}
            >
              Información General
            </Typography>

            <Divider sx={{ mb: 3, borderColor: "rgba(249,243,239,0.20)" }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Box>
                <Typography sx={{ color: "#F9F3EF", fontWeight: "bold" }}>
                  ID Orden
                </Typography>
<Typography sx={{ color: "#D2C1B6", mb: 2 }}>
  {viaje?.id ?? "Sin dato"}
</Typography>
                <Typography sx={{ color: "#F9F3EF", fontWeight: "bold" }}>
                  Tipo de carga
                </Typography>
                <Typography sx={{ color: "#D2C1B6", mb: 2 }}>Perecedera</Typography>

                <Typography sx={{ color: "#F9F3EF", fontWeight: "bold" }}>
                  Placa vehículo
                </Typography>
<Typography sx={{ color: "#D2C1B6" }}>
  {viaje?.placa ?? "Sin placa"}
</Typography>

       <Typography sx={{ color: "#F9F3EF", fontWeight: "bold" }}>
                  Destino
                </Typography>
<Typography sx={{ color: "#D2C1B6" }}>
  {viaje?.destino ?? "Sin destino"}
</Typography>
              </Box>

              <Box>

 <Typography sx={{ color: "#F9F3EF", fontWeight: "bold" }}>
                  Distancia
                </Typography>
<Typography sx={{ color: "#D2C1B6" }}>
  {viaje?.distancia ?? "Sin distancia"}
</Typography>
   
                <Typography sx={{ color: "#F9F3EF", fontWeight: "bold" }}>
                  Peso registrado
                </Typography>
<Typography sx={{ color: "#D2C1B6", mb: 2 }}>
  {viaje?.peso ?? 0} kg
</Typography>
                    <Typography sx={{ color: "#F9F3EF", fontWeight: "bold" }}>
                  Origen
                </Typography>
<Typography sx={{ color: "#D2C1B6" }}>
  {viaje?.origen ?? "Sin origen"}
</Typography>
              
                <Typography
                  sx={{
                    color: "#A5D6A7",
                    fontWeight: "bold",
                  }}
                >
                  Estado: En tránsito
                </Typography>
              </Box>
            </Box>
          </Card>
        <Card
            sx={{
              borderRadius: "18px",
              background: "linear-gradient(130deg, #456882 40%, #1B3C53 80%)",
              boxShadow: "0 10px 30px rgba(27,60,83,0.20)",
              border: "1px solid rgba(43, 42, 42, 0.85)",
              p: 3,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                color: "#F9F3EF",
                fontFamily: "Poppins",
                mb: 3,
              }}
            >
              Línea de tiempo
            </Typography>

            <Divider sx={{ mb: 3, borderColor: "rgba(249,243,239,0.20)" }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {pasos.map((paso, index) => (
                <Box
                  key={index}
                  sx={{
                    border: paso.activo
                      ? "2px solid rgba(249,243,239,0.35)"
                      : "2px solid rgba(210,193,182,0.25)",
                    borderRadius: "12px",
                    py: 1.4,
                    px: 2,
                    textAlign: "center",
                    background: paso.activo
                      ? "linear-gradient(135deg, #5C87A3, #1B3C53)"
                      : "rgba(210,193,182,0.18)",
                    color: paso.activo ? "#F9F3EF" : "#D2C1B6",
                    fontWeight: "bold",
                    fontFamily: "Poppins",
                  }}
                >
                  {paso.nombre}
                </Box>
              ))}
            </Box>
          </Card>
      

          <Card
            sx={{
              borderRadius: "18px",
              background: "linear-gradient(130deg, #F9F3EF 20%, #D2C1B6 80%)",
              boxShadow: "0 10px 30px rgba(27,60,83,0.20)",
              border: "1px solid rgba(210,193,182,0.85)",
              p: 3,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                color: "#1B3C53",
                fontFamily: "Poppins",
                mb: 3,
                textAlign: "center",
              }}
            >
              Acciones
            </Typography>

            <Divider sx={{ mb: 3, borderColor: "rgba(27,60,83,0.10)" }} />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxWidth: "420px",
                mx: "auto",
              }}
            >
              <Button
                variant="contained"
                onClick={abrirModal}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "10px",
                  background: "rgba(43, 111, 72, 0.90)",
                  fontFamily: "Poppins",
                  py: 1.2,
                  "&:hover": {
                    background: "#1e7a4d",
                  },
                }}
              >
                Reportar evento
              </Button>

        <Button
  variant="contained"
  onClick={cancelarViaje}
  disabled={loading}
  sx={{
    textTransform: "none",
    fontWeight: "bold",
    borderRadius: "10px",
    background: "#D2C1B6",
    color: "#1B3C53",
    fontFamily: "Poppins",
    py: 1.2,
    "&:hover": {
      background: "#c8b3a5",
    },
  }}
>
  {loading ? "Cancelando..." : "Cancelar entrega"}
</Button>
            </Box>
          </Card>
        </Box>
      </Box>

      <Modal open={openModal} onClose={cerrarModal}>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: 2,
          }}
        >
     <Box
  sx={{
    width: "100%",
    maxWidth: "760px",
    maxHeight: "90vh",
    overflowY: "auto",
    border: "1px solid rgba(14, 14, 14, 0.2)",
    borderRadius: "18px",
    p: { xs: 3, sm: 4 },
    boxShadow: "0 10px 30px rgba(18, 19, 19, 0.15)",
    background: "rgba(210, 193, 182, 0.95)",
  }}
>
     <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 1,
  }}
>
  <Typography
    variant="h4"
    sx={{
      fontFamily: "Poppins",
      fontWeight: "bold",
      color: "rgb(27, 60, 83)",
    }}
  >
    Reportar evento
  </Typography>

  <Button
    onClick={cerrarModal}
    sx={{ minWidth: "auto", color: "#5C4033" }}
  >
    <CloseIcon />
  </Button>
</Box>
            <Typography
              sx={{
                color: "rgb(27, 60, 83)",
                fontFamily: "Poppins",
                mb: 3,
              }}
            >
              Completa la información del evento ocurrido durante el viaje.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                width: "100%",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "rgb(27, 60, 83)",
                    fontFamily: "Poppins",
                    fontWeight: "bold",
                    mb: 1,
                  }}
                >
                  Tipo
                </Typography>

      <TextField
  label="Tipo de evento"
  fullWidth
  value={tipo}
  onChange={(e)=>setTipo(e.target.value)}
  sx={inputCafe}
/>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "rgb(27, 60, 83)",
                    fontFamily: "Poppins",
                    fontWeight: "bold",
                    mb: 1,
                  }}
                >
                  Observación
                </Typography>

         <TextField
  label="Observación"
  multiline
  rows={4}
  fullWidth
  value={descripcion}
  onChange={(e)=>setDescripcion(e.target.value)}
  sx={inputCafe}
/>

              </Box>

         <Box>
  <Typography
    sx={{
      color: "rgb(27, 60, 83)",
      fontFamily: "Poppins",
      fontWeight: "bold",
      mb: 1,
    }}
  >
    Agregar foto
  </Typography>

  <Button
    variant="outlined"
    component="label"
    sx={{
      borderRadius: "10px",
      fontWeight: "bold",
      textTransform: "none",
      color: "#1B3C53",
      borderColor: "#1B3C53",
      px: 3,
      py: 1.2,
      "&:hover": {
        borderColor: "#456882",
        background: "rgba(69,104,130,0.08)",
      },
    }}
  >
    Seleccionar imagen
    <input
      type="file"
      hidden
      accept="image/*"
      onChange={manejarImagen}
    />
  </Button>

  {/* PREVIEW */}
  {preview && (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        component="img"
        src={preview}
        sx={{
          width: "100%",
          maxWidth: "320px",
          borderRadius: "14px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
          border: "3px solid #456882",
        }}
      />
    </Box>
  )}
</Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "flex-end",
                  mt: 1,
                }}
              >
               <Button
  variant="contained"
  onClick={guardarEvento}
  disabled={loading}
>
  {loading ? "Guardando..." : "Guardar evento"}
</Button>
                <Button
                  variant="outlined"
                  onClick={cerrarModal}
                  sx={{
                    height: 52,
                    px: 4,
                    borderRadius: "10px",
                    fontWeight: "bold",
                    textTransform: "none",
                    color: "#1B3C53",
                    borderColor: "#1B3C53",
                    "&:hover": {
                      borderColor: "#456882",
                      background: "rgba(69,104,130,0.08)",
                    },
                  }}
                >
                  Cerrar
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}