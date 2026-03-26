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
import MenuItem from "@mui/material/MenuItem"
import { Button } from "@mui/material"
import PostAddIcon from "@mui/icons-material/PostAdd"
import PersonIcon from "@mui/icons-material/Person"
import RouteIcon from "@mui/icons-material/Route"
import TextField from "@mui/material/TextField"
import CloseIcon from "@mui/icons-material/Close"
import Modal from "@mui/material/Modal"
import CircularProgress from "@mui/material/CircularProgress"

import dayjs from "dayjs"
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker"

import { useNavigate } from "react-router-dom"

type Orden = {
  id: number
  nombre_cliente: string
  estado: string
}

type Piloto = {
  piloto_id: number
  usuario_id: number
  nombre: string
  licencia: string
  foto_perfil: string
}

type Vehiculo = {
  id: number
  placa: string
  tipo: string
  capacidad: number
}

export default function Ordenes() {
  const navigate = useNavigate()

  const [vehiculosLista, setVehiculosLista] = React.useState<Vehiculo[]>([])
  const [pilotos_lista, setPilotosLista] = React.useState<Piloto[]>([])
  const [ordenes_lista, setOrdenesLista] = React.useState<Orden[]>([])

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const [mostrarAsignar, setMostrarAsignar] = React.useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = React.useState<Orden | null>(null)

  const [idPiloto, setIdPiloto] = React.useState(0)
  const [idVehiculo, setIdVehiculo] = React.useState(0)
  const [fechaSalida, setFechaSalida] = React.useState<dayjs.Dayjs | null>(dayjs())

  React.useEffect(() => {
    const obtenerVehiculos = async () => {
      try {
        const response = await fetch("http://localhost:4000/agente_logistico/vehiculos/obtener_camiones")
        if (!response.ok) {
          throw new Error("No se pudieron obtener los vehículos")
        }

        const data = await response.json()
        setVehiculosLista(data.data)
      } catch (err) {
        console.error(err)
      }
    }

    obtenerVehiculos()
  }, [])

  React.useEffect(() => {
    const obtenerPilotos = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch("http://localhost:4000/agente_logistico/piloto/obtener_pilotos", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("No se pudieron obtener los pilotos")
        }

        const data = await response.json()
        setPilotosLista(data.data)
      } catch (err) {
        setError("Error al cargar los pilotos")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    obtenerPilotos()
  }, [])

  React.useEffect(() => {
    const obtenerOrdenes = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch("http://localhost:4000/agente_logistico/ordenes/obtener_ordenes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("No se pudieron obtener las órdenes")
        }

        const data = await response.json()
        setOrdenesLista(data.data)
      } catch (err) {
        setError("Error al cargar las órdenes")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    obtenerOrdenes()
  }, [])

  const pilotoSeleccionado = React.useMemo(() => {
    return pilotos_lista.find((piloto) => piloto.piloto_id === idPiloto) || null
  }, [idPiloto, pilotos_lista])

  const abrirAsignar = (orden: Orden) => {
    setOrdenSeleccionada(orden)
    setMostrarAsignar(true)
  }

  const cerrarAsignar = () => {
    setMostrarAsignar(false)
  }

  const asignarViaje = async () => {
    try {
      if (!ordenSeleccionada) {
        alert("No hay una orden seleccionada")
        return
      }

      if (!idVehiculo || !idPiloto || !fechaSalida) {
        alert("Completa vehículo, piloto y fecha")
        return
      }

      const payload = {
        orden_id: ordenSeleccionada.id,
        vehiculo_id: idVehiculo,
        piloto_id: idPiloto,
        fecha_salida: fechaSalida ? fechaSalida.format("DD/MM/YYYY") : ""
      }

      const response = await fetch("http://localhost:4000/agente_logistico/ordenes/asignar_viaje", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "No se pudo asignar el viaje")
      }

      console.log("Viaje asignado:", data)
      cerrarAsignar()
      setIdPiloto(0)
      setIdVehiculo(0)
      setFechaSalida(dayjs())
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const estadoColor = (estado: string) => {
    switch (estado) {
      case "Entregado":
        return {
          background: "rgba(46, 204, 113, 0.18)",
          color: "#1e7a4d",
          border: "1px solid rgba(46,204,113,0.45)"
        }

      case "En Transito":
        return {
          background: "rgba(241, 196, 15, 0.18)",
          color: "#9a7d0a",
          border: "1px solid rgba(241,196,15,0.45)"
        }

      case "Cancelado":
        return {
          background: "rgba(231, 76, 60, 0.16)",
          color: "#922b21",
          border: "1px solid rgba(231,76,60,0.45)"
        }

      case "Registrada":
        return {
          background: "linear-gradient(135deg, rgba(139,94,60,0.18), rgba(210,193,182,0.55))",
          color: "#5C4033",
          border: "1px solid rgba(139,94,60,0.45)",
          boxShadow: "0 4px 12px rgba(92,64,51,0.10)"
        }

      default:
        return {}
    }
  }

  const inputCafe = {
    background: "rgba(210,193,182,0.28)",
    borderRadius: "12px",
    backdropFilter: "blur(8px)",
    boxShadow: "0 8px 20px rgba(92,64,51,0.12)",

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
      borderRadius: "12px",
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

  const estiloModal = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "94%", sm: 700, md: 980 },
    maxHeight: "88vh",
    overflowY: "auto",
    background: "rgba(249,243,239,0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(139,94,60,0.25)",
    borderRadius: "20px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
    p: 3,
  }

  return (
    <div
      style={{
        background: "#1B3C53",
        borderRadius: "18px",
        padding: "24px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="white" fontFamily="Poppins">
          Órdenes
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
          onClick={() => navigate("/agente_logistico/crear_orden")}
          endIcon={<PostAddIcon />}
        >
          Crear Orden
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
                  background: "linear-gradient(135deg, rgba(69,104,130,0.75), rgba(27,60,83,0.85))"
                }}
              >
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Estado</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }} />
              </TableRow>
            </TableHead>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
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

                    <TableCell>{orden.nombre_cliente}</TableCell>

                    <TableCell>
                      <Box
                        sx={{
                          ...estadoColor(orden.estado),
                          padding: "6px 12px",
                          borderRadius: "14px",
                          fontWeight: "bold",
                          backdropFilter: "blur(6px)",
                          width: "fit-content"
                        }}
                      >
                        {orden.estado}
                      </Box>
                    </TableCell>

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
                        Asignar viaje
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
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="#5C4033">
              Asignar viaje
            </Typography>

            <Button
              onClick={cerrarAsignar}
              sx={{ minWidth: "auto", color: "#5C4033" }}
            >
              <CloseIcon />
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.9fr" },
              gap: 3,
              alignItems: "stretch"
            }}
          >
            {/* BOX IZQUIERDO: campos */}
            <Paper
              sx={{
                p: 3,
                borderRadius: "18px",
                background: "linear-gradient(135deg, rgba(249,243,239,0.98), rgba(240,228,220,0.95))",
                boxShadow: "0 10px 28px rgba(121,85,72,0.12)",
              }}
            >
              <Typography variant="h6" fontWeight="bold" color="#5D4037" mb={2}>
                Datos de asignación
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}
              >
                <TextField
                  select
                  label="Piloto"
                  variant="outlined"
                  fullWidth
                  value={idPiloto}
                  onChange={(e) => setIdPiloto(Number(e.target.value))}
                  sx={inputCafe}
                >
                  {pilotos_lista.map((piloto) => (
                    <MenuItem key={piloto.piloto_id} value={piloto.piloto_id}>
                      {piloto.nombre} - Licencia {piloto.licencia}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Vehículo"
                  variant="outlined"
                  fullWidth
                  value={idVehiculo}
                  onChange={(e) => setIdVehiculo(Number(e.target.value))}
                  sx={inputCafe}
                >
                  {vehiculosLista.map((vehiculo) => (
                    <MenuItem key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.placa} - {vehiculo.tipo}
                    </MenuItem>
                  ))}
                </TextField>

                <Box
                  sx={{
                    ...inputCafe,
                    p: 1.5,
                    borderRadius: "14px"
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={["DesktopDatePicker"]}>
                      <DemoItem label="Fecha de salida">
                        <DesktopDatePicker
                          value={fechaSalida}
                          onChange={(newValue) => setFechaSalida(newValue)}
                        />
                      </DemoItem>
                    </DemoContainer>
                  </LocalizationProvider>
                </Box>
              </Box>

              {ordenSeleccionada && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: "14px",
                    background: "rgba(210,193,182,0.22)",
                    border: "1px solid rgba(139,94,60,0.22)"
                  }}
                >
                  <Typography fontWeight="bold" color="#5C4033">
                    Orden seleccionada
                  </Typography>
                  <Typography color="#6D4C41">
                    ID: {ordenSeleccionada.id}
                  </Typography>
                  <Typography color="#6D4C41">
                    Cliente: {ordenSeleccionada.nombre_cliente}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* BOX DERECHO: vista previa */}
            <Paper
              sx={{
                p: 3,
                borderRadius: "18px",
                background: "rgba(249,243,239,0.82)",
                border: "2px dashed rgba(141,110,99,0.40)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                minHeight: 420,
                boxShadow: "0 8px 20px rgba(121,85,72,0.10)",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2} color="#5D4037">
                Vista previa
              </Typography>

              <Box
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: "18px",
                  overflow: "hidden",
                  background: "rgba(210,193,182,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  border: "1px solid rgba(139,94,60,0.28)",
                }}
              >
                {pilotoSeleccionado?.foto_perfil ? (
                  <Box
                    component="img"
                    src={
                      pilotoSeleccionado.foto_perfil.startsWith("data:image")
                        ? pilotoSeleccionado.foto_perfil
                        : `data:image/jpeg;base64,${pilotoSeleccionado.foto_perfil}`
                    }
                    alt={pilotoSeleccionado.nombre}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      color: "#6D4C41"
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 60, mb: 1 }} />
                    <Typography>Sin foto</Typography>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: "14px",
                  background: "rgba(210,193,182,0.18)",
                  border: "1px solid rgba(139,94,60,0.18)"
                }}
              >
                <Typography fontWeight="bold" color="#5C4033">
                  {pilotoSeleccionado ? pilotoSeleccionado.nombre : "Selecciona un piloto"}
                </Typography>

                <Typography color="#6D4C41" mt={1}>
                  Licencia: {pilotoSeleccionado ? pilotoSeleccionado.licencia : "--"}
                </Typography>

                <Typography color="#6D4C41">
                  Vehículo: {idVehiculo ? vehiculosLista.find(v => v.id === idVehiculo)?.placa || "--" : "--"}
                </Typography>

                <Typography color="#6D4C41">
                  Fecha: {fechaSalida ? fechaSalida.format("DD/MM/YYYY") : "--"}
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg,#8B5E3C,#6F4E37)",
                borderRadius: "12px",
                px: 3,
                py: 1.2,
                fontWeight: "bold",
                textTransform: "none",
                boxShadow: "0 8px 18px rgba(92,64,51,0.20)",
                "&:hover": {
                  background: "linear-gradient(135deg,#6F4E37,#5C4033)",
                }
              }}
              onClick={asignarViaje}
            >
              Confirmar asignación
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  )
}