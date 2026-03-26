import * as React from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from "@mui/material"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"

type Orden = {
  id: number
  nombre_cliente: string
  estado: string
}

export default function AgenteLogistico() {
  const [ordenes, setOrdenes] = React.useState<Orden[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

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
        setOrdenes(data.data || [])
      } catch (err) {
        setError("Error al cargar las órdenes")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    obtenerOrdenes()
  }, [])

  const normalizarEstado = (estado: string) => estado.trim().toLowerCase()

  const totalOrdenes = ordenes.length
  const registradas = ordenes.filter((o) => normalizarEstado(o.estado) === "registrada").length
  const enTransito = ordenes.filter((o) => normalizarEstado(o.estado) === "en transito").length
  const entregadas = ordenes.filter((o) => normalizarEstado(o.estado) === "entregado").length

  const dataPie = [
    { name: "Registradas", value: registradas },
    { name: "En tránsito", value: enTransito },
    { name: "Entregadas", value: entregadas },
  ]

  const dataBar = [
    { estado: "Registradas", cantidad: registradas },
    { estado: "En tránsito", cantidad: enTransito },
    { estado: "Entregadas", cantidad: entregadas },
  ]

  const ultimasOrdenes = [...ordenes].slice(0, 5)

  const colores = ["#1B3C53", "#456882", "#D2C1B6"]

  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minHeight: "100vh",
      }}
    >
  

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Typography sx={{ color: "red", fontWeight: "bold" }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Card sx={cardSmall}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#1B3C53" }}>
                  Total de órdenes
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {totalOrdenes}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={cardSmallDark}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  En tránsito
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {enTransito}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={cardSmallSoft}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#5C4033" }}>
                  Entregadas
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "#5C4033" }}>
                  {entregadas}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Card sx={cardBig}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#1B3C53" }}>
                Órdenes por estado
              </Typography>

              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dataPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {dataPie.map((_, index) => (
                        <Cell key={index} fill={colores[index % colores.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card sx={cardBig}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#1B3C53" }}>
                Comparación de estados
              </Typography>

              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={dataBar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="estado" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#456882" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card sx={cardList}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#1B3C53" }}>
                Últimas órdenes
              </Typography>

              <List>
                {ultimasOrdenes.map((orden) => (
                  <ListItem
                    key={orden.id}
                    sx={{
                      background: "rgba(255,255,255,0.35)",
                      borderRadius: "10px",
                      mb: 1
                    }}
                  >
                    <ListItemText
                      primary={`Orden #${orden.id} - ${orden.nombre_cliente}`}
                      secondary={`Estado: ${orden.estado}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

const glass = {
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.25)",
  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
}

const cardBig = {
  ...glass,
  background: "rgba(255,255,255,0.65)",
}

const cardList = {
  ...glass,
  background: "rgba(255,255,255,0.60)",
}

const cardSmall = {
  ...glass,
  minWidth: 240,
  background: "rgba(255,255,255,0.7)",
}

const cardSmallDark = {
  ...glass,
  minWidth: 240,
  background: "rgba(27,60,83,0.82)",
  color: "white",
}

const cardSmallSoft = {
  ...glass,
  minWidth: 240,
  background: "rgba(210,193,182,0.75)",
}