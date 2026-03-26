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
  Typography,
    Divider
} from "@mui/material"
import CircularProgress from "@mui/material/CircularProgress";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Button } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

import GroupAddIcon from '@mui/icons-material/GroupAdd';
import HistoryIcon from "@mui/icons-material/History"
import { useNavigate } from "react-router-dom";

import Modal from '@mui/material/Modal';

type Piloto = {
    piloto_id : number
    usuario_id : number
  nombre: string
  licencia: string
  foto_perfil: string
}

type HistorialViaje = {
  id: number
  fecha: string
  origen : string
  destino: string
  peso: number
    distancia: number

}


export default function Pilotos() {

  const navigate = useNavigate();
 

  /*  endpoint para ver los pilotos */
  
      const [pilotos_lista,setPilotosLista]=React.useState<Piloto[]>([]);
  
   const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
  
    React.useEffect(() => {
      const obtenerPilotos = async () => {
        try {
          setLoading(true);
          setError("");
  
          const response = await fetch("http://localhost:4000/agente_logistico/piloto/obtener_pilotos", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          if (!response.ok) {
            throw new Error("No se pudieron obtener los viajes");
          }
  
          const data = await response.json();
          setPilotosLista(data.data);
        } catch (err) {
          setError("Error al cargar los viajes");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
  
      obtenerPilotos();
    }, []);
  
   

  /*  endpoitn historial */

    /*  endpoint para ver los pilotos */
  const [nombrePiloto, setNombrePiloto] = React.useState("")
      const [historial_lista,setHistorialLista]=React.useState<HistorialViaje[]>([]);
  
   const [loading2, setLoading2] = React.useState(true);
    const [error2, setError2] = React.useState("");
  
const abrirHistorial = async (piloto: Piloto) => {
  setPilotoSeleccionado(piloto)
  setMostrarHistorial(true)

  try {
    setLoading2(true)
    setError2("")

    const response = await fetch(
      `http://localhost:4000/agente_logistico/piloto/obtener_historial_piloto/${piloto.piloto_id}`
    )

    if (!response.ok) {
      throw new Error("No se pudo obtener historial")
    }

    const data = await response.json()

    // 👇 TU BACKEND DEVUELVE
    // { nombre: "...", viajes: [...] }
setNombrePiloto(data.nombre)
    setHistorialLista(data.viajes)

  } catch (err) {
    setError2("Error al cargar historial")
    console.error(err)
  } finally {
    setLoading2(false)
  }
}

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

  const [mostrarHistorial, setMostrarHistorial] = React.useState(false)
  const [pilotoSeleccionado, setPilotoSeleccionado] = React.useState<Piloto | null>(null)


  const cerrarHistorial = () => {
    setMostrarHistorial(false)
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
  <Typography variant="h5" fontWeight="bold" color="white"  fontFamily="Poppins">
    Listado de Pilotos
  </Typography>

  <Button
    variant="contained"
    sx={{
      background: "linear-gradient(135deg,#456882,#1B3C53)",
      borderRadius: "12px",
      fontWeight: "bold",
      padding: "10px 20px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
      "&:hover": {
        background: "linear-gradient(135deg,#1B3C53,#456882)",
        transform: "translateY(-2px)"
      }
    }}
     onClick={() => navigate("/agente_logistico/crear_piloto")}


    endIcon ={<GroupAddIcon/>}
  >
    Agregar piloto
  </Button>
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
                Id
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Nombre
              </TableCell>


              
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Licencia
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
            {pilotos_lista.map((piloto) => (
              <TableRow
                key={piloto.piloto_id}
                sx={{
                  transition: "0.25s",
                  "&:hover": {
                    background: "rgba(69,104,130,0.12)"
                  }
                }}
              >
                <TableCell sx={{ fontWeight: "bold", color: "#1B3C53" }}>
                  {piloto.piloto_id}
                </TableCell>
                   <TableCell sx={{ fontWeight: "bold", color: "#1B3C53" }}>
                  {piloto.nombre}
                </TableCell>


                <TableCell>{piloto.licencia}</TableCell>


          

 <TableCell>
  <Button
    startIcon={<HistoryIcon />}
                      onClick={() => abrirHistorial(piloto)}

    sx={{
      background: "rgba(181, 136, 99, 0.25)",
      color: "#6F4E37",
      border: "1px solid rgba(181,136,99,0.5)",
      backdropFilter: "blur(6px)",
      borderRadius: "10px",
      textTransform: "none",
      fontWeight: "bold",
      transition: "0.25s",
      "&:hover": {
        background: "rgba(181,136,99,0.4)",
        transform: "translateY(-2px)"
      }
    }}
  >
    Ver historial
  </Button>
</TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
        </Table>
      </TableContainer>
    </Box>
 
      <Modal open={mostrarHistorial} onClose={cerrarHistorial}>
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
              Historial de viajes
            </Typography>

            <Button
              onClick={cerrarHistorial}
              sx={{ minWidth: "auto", color: "#5C4033" }}
            >
              <CloseIcon />
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography sx={{ mb: 2 }}>
            <strong>Piloto:</strong> {pilotoSeleccionado?.piloto_id}
          </Typography>
{loading2 && (
  <Box sx={{display:"flex", justifyContent:"center", mt:4}}>
     <CircularProgress/>
  </Box>
)}
        {error2 && (
          <Typography sx={{ color: "#F9F3EF", fontWeight: "bold", mb: 3 }}>
            {error2}
          </Typography>
        )}

        {!loading2 && !error2 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {historial_lista.map((viaje) => (
              <Card
                key={viaje.id}
                sx={{
                  background: "rgba(210,193,182,0.32)",
                  border: "1px solid rgba(139,94,60,0.28)",
                  borderRadius: "14px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 20px rgba(92,64,51,0.12)",
                }}
              >
                <CardContent>
                  <Typography fontWeight="bold" color="#5C4033" mb={1}>
                    Viaje #{viaje.id}
                  </Typography>

<Typography>
<strong>Piloto:</strong> {nombrePiloto}
</Typography>
                  <Typography><strong>Fecha:</strong> {viaje.fecha}</Typography>
                  <Typography><strong>Destino:</strong> {viaje.destino}</Typography>
                  <Typography><strong>Origen:</strong> {viaje.origen}</Typography>
                <Typography><strong>Distancia:</strong> {viaje.distancia} Km</Typography>
                  <Typography><strong>Peso:</strong> {viaje.peso}</Typography>

                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        </Box>
        
      </Modal>
    </div>
  )
}