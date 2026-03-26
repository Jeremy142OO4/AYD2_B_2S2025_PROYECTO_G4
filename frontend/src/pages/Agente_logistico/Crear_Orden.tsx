import * as React from "react"

import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import { useNavigate } from "react-router-dom";
import MenuItem from "@mui/material/MenuItem"

type Cliente = {
  cliente_id: number
  usuario_id: number
  nombre: string
  correo: string
  telefono: string
}

type Contrato = {
  id: number
  nombre_cliente: string
  origen: string
  destino: string
  activo: boolean
}

export default function CrearOrden() {

      const navigate = useNavigate();
const [idcliente, setIdCliente] = React.useState(0)
const [idContrato, setIdContrato] = React.useState(0)
const [origen, setOrigen] = React.useState("")
const [destino, setDestino] = React.useState("")
const [distancia, setDistancia] = React.useState("")
const [peso, setPeso] = React.useState("")

const [clientes, setClientes] = React.useState<Cliente[]>([])
const [contratos, setContratos] = React.useState<Contrato[]>([])


React.useEffect(() => {
  const obtenerClientes = async () => {
    try {
      const response = await fetch("http://localhost:4000/obtener_clientes_id")
      if (!response.ok) throw new Error("No se pudieron obtener los clientes")

      const data = await response.json()
      setClientes(data.data)
    } catch (error) {
      console.error("Error al obtener clientes:", error)
    }
  }

  const obtenerContratos = async () => {
    try {
      const response = await fetch("http://localhost:4000/obtener_contratos_id")
      if (!response.ok) throw new Error("No se pudieron obtener los contratos")

      const data = await response.json()
      setContratos(data.data)
    } catch (error) {
      console.error("Error al obtener contratos:", error)
    }
  }

  obtenerClientes()
  obtenerContratos()
}, [])

    /* Post para crear orden   */
    
const guardarOrden = async () => {
  try {
    if (!idcliente || !idContrato || !origen || !peso) {
      alert("Completa los campos obligatorios")
      return
    }

    const response = await fetch("http://localhost:4000/agente_logistico/ordenes/crear_orden", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cliente_id: idcliente,
        contrato_id: idContrato,
        origen: origen,
        destino : destino,
        distancia :Number(distancia),
        estado_id: 1,
        peso: Number(peso),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "No se pudo guardar la orden")
    }

    setDestino("")
    setIdContrato(0)
    setDistancia("")
    setIdCliente(0)
    setOrigen("")
    setPeso("")

    console.log("Orden guardada:", data)
  } catch (error) {
    console.error("Error:", error)
  }
}

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
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
                      
          background: "linear-gradient(135deg,#D2C1B6,#1B3C53)",
          borderRadius : "16px",
          padding : "24px",

          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold"  fontFamily="Poppins" >
          Crear Orden
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
          startIcon ={<KeyboardBackspaceIcon/>}
     onClick={() => navigate(-1)}
        >
          Regresar
        </Button>
      </Box>

      {/* GRID PRINCIPAL */}
  
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
  label="Cliente"
  variant="outlined"
  fullWidth
  value={idcliente}
  onChange={(e) => setIdCliente(Number(e.target.value))}
  sx={inputGlass}
>
  {clientes.map((cliente) => (
    <MenuItem key={cliente.cliente_id} value={cliente.cliente_id}>
      {cliente.nombre} - ID {cliente.cliente_id}
    </MenuItem>
  ))}
</TextField>

<TextField
  select
  label="Contrato"
  variant="outlined"
  fullWidth
  value={idContrato}
  onChange={(e) => setIdContrato(Number(e.target.value))}
  sx={inputGlass}
>
  {contratos
    .filter((contrato) => contrato.activo)
    .map((contrato) => (
      <MenuItem key={contrato.id} value={contrato.id}>
        ID {contrato.id} - {contrato.nombre_cliente} ({contrato.origen} → {contrato.destino})
      </MenuItem>
    ))}
</TextField>
            <TextField label="Origen" variant="outlined" fullWidth onChange={(e)=> setOrigen(e.target.value)} sx={inputGlass} />
            <TextField label="Destino" variant="outlined" fullWidth onChange={(e)=> setDestino(e.target.value)}  sx={inputGlass} />
            <TextField   type = "number"    inputProps={{
    step: "0.01",   // permite decimales
    min: 0          // no negativos
  }} 
  label="Distancia" variant="outlined" onChange={(e)=> setDistancia(e.target.value)}  fullWidth sx={inputGlass} />
            <TextField  type = "number"    inputProps={{
    step: "0.01",   // permite decimales
    min: 0          // no negativos
  }}
  label="Peso" variant="outlined" onChange={(e)=> setPeso(e.target.value)}  fullWidth sx={inputGlass} />
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
          startIcon ={<LibraryAddIcon/>}
     onClick={guardarOrden}
        >
          Crear Orden
        </Button>
      
          </Box>
        </Paper>

    </Box>
  )
}