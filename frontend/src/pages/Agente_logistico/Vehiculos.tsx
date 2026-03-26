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
import PostAddIcon from '@mui/icons-material/PostAdd';
import CircularProgress from "@mui/material/CircularProgress";

import { useNavigate } from "react-router-dom";

type Camion = {
  id: number
  tipo: string
  capacidad : number
  placa: string
}

export default function Vehiculos() {

  const navigate = useNavigate();

/*  enpoitn para ver vehiculos*/

    const [camiones_lista,setCamionesLista]=React.useState<Camion[]>([]);

 const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const obtenerVehiculos = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:4000/agente_logistico/vehiculos/obtener_camiones", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("No se pudieron obtener los viajes");
        }
const data = await response.json();
setCamionesLista(data.data);
      } catch (err) {
        setError("Error al cargar los viajes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    obtenerVehiculos();
  }, []);


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
    Listado de Vehiculos
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
     onClick={() => navigate("/agente_logistico/crear_camion")}


    endIcon ={<PostAddIcon/>}
  >
    Crear camion
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
                Camion
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Tipo
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Capacidad
              </TableCell>

                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Placa
              </TableCell>
              
            </TableRow>
          </TableHead>

        {error && (
          <Typography sx={{ color: "#F9F3EF", fontWeight: "bold", mb: 3 }}>
            {error}
          </Typography>
        )}

          <TableBody>
             {loading ? (
    <TableRow>
      <TableCell colSpan={4} align="center">
        <CircularProgress />
      </TableCell>
    </TableRow>
  ) : (
            camiones_lista.map((camion) => (
              <TableRow
                key={camion.id}
                sx={{
                  transition: "0.25s",
                  "&:hover": {
                    background: "rgba(69,104,130,0.12)"
                  }
                }}
              >
                <TableCell sx={{ fontWeight: "bold", color: "#1B3C53" }}>
                  {camion.id}
                </TableCell>

                <TableCell>{camion.tipo}</TableCell>
                <TableCell>{camion.capacidad}</TableCell>
                <TableCell>{camion.placa}</TableCell>



            
              </TableRow>
            )))}
          </TableBody>
      
        </Table>
      </TableContainer>
    </Box>
    </div>
  )
}