import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography
} from "@mui/material"
import { Button } from "@mui/material"

import RouteIcon from "@mui/icons-material/Route"

import CloseIcon from "@mui/icons-material/Close"
import Modal from '@mui/material/Modal';
import CircularProgress from "@mui/material/CircularProgress";


import { useNavigate } from "react-router-dom";

type Orden = {
  id: number
  cliente: string
  fecha : string
  origen : string
  destino : string
  distancia :number
  nombre_piloto : string
}

export default function Bitacora() {

  const navigate = useNavigate();
 
      const [ordenes_lista,setOrdenesLista]=React.useState<Orden[]>([]);
  
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    /* Enpoint ge para obtener ordenes*/
  
    React.useEffect(() => {
      const obtenerOrdenes = async () => {
        try {
          setLoading(true);
          setError("");
  
          const response = await fetch("http://localhost:4000/agente_logistico/bitacora/obtener_bitacora", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          if (!response.ok) {
            throw new Error("No se pudieron obtener los viajes");
          }
  
  const data = await response.json();
  setOrdenesLista(data.data);
  
        } catch (err) {
          setError("Error al cargar los viajes");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
  
      obtenerOrdenes();
    }, []);
  



 
  
    const estiloModal = {
      position: "absolute" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: { xs: "92%", sm: 500, md: 850 },
      maxHeight: "85vh",
      overflowY: "auto",
      background: "rgba(249,243,239,0.92)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(139,94,60,0.35)",
      borderRadius: "18px",
      boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
      p: 3,
    }
  
   const [mostrarAsignar, setMostrarAsignar] = React.useState(false)
  const [viajeSeleccionado, setOrdenSeleccionado] = React.useState<Orden | null>(null)
  const abrirAsignar = (viaje: Orden) => {
    setOrdenSeleccionado(viaje)
    setMostrarAsignar(true)
  }

  const cerrarAsignar = () => {
    setMostrarAsignar(false)
  }
  return (
    <div  style={{
background : "#1B3C53",
borderRadius: "18px",
 padding: "24px",


    }}>
<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 4
  }}
>
  <Typography variant="h5" fontWeight="bold" color="white" fontFamily="Poppins" >
    Bitacora de Viajes
  </Typography>

</Box>

<Box>

      <TableContainer
        component={Paper}
        sx={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(69,104,130,0.5)",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(27,60,83,0.25)",
          overflow: "hidden"
        }}
      >
        <Table>

          <TableHead>
            <TableRow
              sx={{
                background:
                  "linear-gradient(135deg, rgba(69,104,130,0.75), rgba(27,60,83,0.85))"
              }}
            >
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                ID Orden
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Piloto
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                origen
              </TableCell>
                     <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Destino
              </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Distancia
              </TableCell>
              
   <TableCell sx={{ color: "white", fontWeight: "bold" }}>
              </TableCell>
            </TableRow>
          </TableHead>
       {loading && (
  <Box sx={{display:"flex", justifyContent:"center", mt:4}}>
     <CircularProgress/>
  </Box>
)}

        {error && (
          <Typography sx={{ color: "#F9F3EF", fontWeight: "bold", mb: 3 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && (
          <TableBody>
            {ordenes_lista.map((orden) => (
              <TableRow
                key={orden.id}
                sx={{
                  transition: "0.25s",
                  "&:hover": {
                    background: "rgba(69,104,130,0.12)"
                  }
                }}
              >
                <TableCell sx={{ fontWeight: "bold", color: "#1B3C53" }}>
                  {orden.id}
                </TableCell>

                <TableCell>{orden.nombre_piloto}</TableCell>

                <TableCell>{ orden.origen}               </TableCell>
                <TableCell>{ orden.destino}               </TableCell>
                <TableCell>{ orden.distancia}               </TableCell>

                                            <TableCell>
  <Button
    startIcon={<RouteIcon />}
                      onClick={() => abrirAsignar(orden)}

    sx={{
      background: "rgba(139, 94, 60, 0.25)",
      color: "#5C4033",
      border: "1px solid rgba(139,94,60,0.5)",
      backdropFilter: "blur(6px)",
      borderRadius: "10px",
      textTransform: "none",
      fontWeight: "bold",
      transition: "0.25s",
      "&:hover": {
        background: "rgba(139,94,60,0.4)",
        transform: "translateY(-2px)"
      }
    }}
  >
    Ver ubicacion
  </Button>
</TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
        </Table>
      </TableContainer>
    </Box>

    <Modal open={mostrarAsignar} onClose={cerrarAsignar}>
  <Box sx={estiloModal}>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography variant="h6" fontWeight="bold" color="#5C4033">
        Ubicación del viaje
      </Typography>

      <Button
        onClick={cerrarAsignar}
        sx={{ minWidth: "auto", color: "#5C4033" }}
      >
        <CloseIcon />
      </Button>
    </Box>

    <Typography sx={{ mb: 1 }}>
      <strong>ID Orden:</strong> {viajeSeleccionado?.id}
    </Typography>

    <Typography sx={{ mb: 2 }}>
      <strong>Piloto:</strong> {viajeSeleccionado?.nombre_piloto}
    </Typography>

    <Box
      sx={{
        width: "100%",
        height: { xs: 300, sm: 400, md: 450 },
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(139,94,60,0.35)",
        boxShadow: "0 10px 28px rgba(121,85,72,0.14)",
      }}
    >
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15447.786918922946!2d-90.61099061363286!3d14.545038974014995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2sgt!4v1774314242636!5m2!1ses!2sgt"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        title="Ubicación del viaje"
      />
    </Box>
  </Box>
</Modal>
    </div>
  )
}