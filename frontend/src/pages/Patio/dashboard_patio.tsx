import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Navbar from "./Navbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";

type Pendientes = {
  id: number;
  nombre_piloto: string;
  fecha: string;
  origen: string;
  destino: string;
  distancia: number;
  peso: number;
  placa : string
  piloto_id: number;
};

export default function DashboardPatio() {
  const [openModal, setOpenModal] = React.useState(false);
  const [transportesPorSalir, setTransportesPorSalir] = React.useState<Pendientes[]>([]);
  const [transporteSeleccionado, setTransporteSeleccionado] = React.useState<Pendientes | null>(null);
  const [peso, setPeso] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const obtenerTransporte = async () => {
      try {
        const response = await fetch("http://localhost:4000/patio/viajes/por_salir");
        if (!response.ok) {
          throw new Error("No se pudieron obtener los viajes");
        }

        const data = await response.json();
        setTransportesPorSalir(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    obtenerTransporte();
  }, []);

  const validarViaje = async () => {
    try {
      if (!transporteSeleccionado) {
        alert("Selecciona un viaje");
        return;
      }

      if (!peso || Number(peso) <= 0) {
        alert("Ingresa un peso válido");
        return;
      }

      setLoading(true);

      const payload = {
        placa: transporteSeleccionado.placa,
        peso: Number(peso),
      };

      const response = await fetch("http://localhost:4000/patio/vehiculos/validar_capacidad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

  const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "No se pudo validar el viaje");
}


if (!data.valido) {
  alert(" Se ha superado el peso permitido del vehículo");
  return;
}

alert(" Peso validado correctamente");
      cerrarModal();
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al validar el peso");
    } finally {
      setLoading(false);
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
  };

  const abrirModal = (transporte: Pendientes) => {
    setTransporteSeleccionado(transporte);
    setPeso(transporte.peso ? String(transporte.peso) : "");
    setOpenModal(true);
  };

  const cerrarModal = () => {
    setOpenModal(false);
    setTransporteSeleccionado(null);
    setPeso("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1B3C53 0%, #D2C1B6 100%)",
      }}
    >
      <Navbar />

      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="#F9F3EF"
          mb={1}
          sx={{ fontFamily: "Poppins" }}
        >
          Autorizar salida de vehículo
        </Typography>

        <Box
          sx={{
            border: "1px solid rgba(218, 209, 209, 0.2)",
            borderRadius: "18px",
            p: { xs: 2, md: 4 },
            boxShadow: "0 10px 30px rgba(221, 236, 236, 0.15)",
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Poppins",
              fontWeight: "bold",
              color: "#F9F3EF",
              mb: 3,
            }}
          >
            Transportes a punto de salir
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              background: "rgba(249,243,239,0.96)",
              boxShadow: "0 8px 24px rgba(27,60,83,0.15)",
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: "linear-gradient(135deg, #1B3C53, #456882)",
                  }}
                >
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                    Viaje
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                    Piloto
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                    Origen
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                    Destino
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                    Fecha de salida
                  </TableCell>
               
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>
                    Acción
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {transportesPorSalir.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(210,193,182,0.18)",
                      },
                    }}
                  >
                    <TableCell sx={{ color: "#1B3C53", fontWeight: 600 }}>
                      Viaje #{item.id}
                    </TableCell>

                    <TableCell sx={{ color: "#456882" }}>
                      {item.nombre_piloto}
                    </TableCell>

                    <TableCell sx={{ color: "#456882" }}>
                      {item.origen}
                    </TableCell>

                    <TableCell sx={{ color: "#456882" }}>
                      {item.destino}
                    </TableCell>

                    <TableCell sx={{ color: "#456882" }}>
                      {item.fecha}
                    </TableCell>

         

                    <TableCell align="center">
                      <Button
                        variant="contained"
                        onClick={() => abrirModal(item)}
                        sx={{
                          textTransform: "none",
                          fontWeight: "bold",
                          borderRadius: "12px",
                          px: 2.5,
                          py: 1,
                          background: "linear-gradient(135deg, #456882, #1B3C53)",
                          boxShadow: "0 6px 14px rgba(27,60,83,0.25)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #5B7F99, #244B66)",
                          },
                        }}
                      >
                        Validar peso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
              maxWidth: "900px",
              border: "1px solid rgba(14, 14, 14, 0.2)",
              borderRadius: "16px",
              p: 4,
              boxShadow: "0 10px 30px rgba(18, 19, 19, 0.15)",
              background: "rgba(210, 193, 182, 0.9)",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: "Poppins",
                fontWeight: "bold",
                color: "rgb(27, 60, 83)",
                mb: 2,
              }}
            >
              Validar peso
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "rgb(27, 60, 83)",
                fontFamily: "Poppins",
                mb: 4,
              }}
            >
              Ingresa el peso del transporte
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              <TextField
                label="Viaje"
                value={`Viaje #${transporteSeleccionado?.id || ""}`}
                InputProps={{ readOnly: true }}
                sx={{ ...inputCafe, width: { xs: "100%", sm: 620 } }}
              />

              <TextField
                label="Piloto"
                value={transporteSeleccionado?.nombre_piloto || ""}
                InputProps={{ readOnly: true }}
                sx={{ ...inputCafe, width: { xs: "100%", sm: 620 } }}
              />

              <TextField
                label="Peso"
                variant="outlined"
                placeholder="Ej. 2500"
                onChange={(e) => {
                  const valor = e.target.value;
                  if (/^\d*\.?\d*$/.test(valor)) {
                    setPeso(valor);
                  }
                }}
                sx={{
                  ...inputCafe,
                  width: { xs: "100%", sm: 620 },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  width: { xs: "100%", sm: "auto" },
                  mt: 1,
                }}
              >
                <Button
                  variant="contained"
                  onClick={validarViaje}
                  disabled={loading}
                  sx={{
                    height: 56,
                    px: 4,
                    width: { xs: "100%", sm: 220 },
                    background: "#456882",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    textTransform: "none",
                    "&:hover": {
                      background: "#1B3C53",
                    },
                  }}
                >
                  {loading ? "Validando..." : "Validar peso"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={cerrarModal}
                  sx={{
                    height: 56,
                    px: 4,
                    width: { xs: "100%", sm: 220 },
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