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

type OrdenAPI = {
  id: number;
  nombre_cliente: string;
  estado: string;
};

type OrdenSeleccionada = {
  id: number;
  codigo: string;
  cliente: string;
  servicio: string;
  fecha: string;
  estado: string;
};

export default function Validar_orden() {
  const [openModal, setOpenModal] = React.useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] =
    React.useState<OrdenSeleccionada | null>(null);

  const [ordenes, setOrdenes] = React.useState<OrdenAPI[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [observacion, setObservacion] = React.useState("");
  const [validando, setValidando] = React.useState(false);

  React.useEffect(() => {
    const obtenerOrdenes = async () => {
      try {
        const res = await fetch(
          "http://localhost:4000/agente_logistico/ordenes/obtener_ordenes"
        );

        const data = await res.json();

        const soloDespacho = data.data.filter(
          (o: OrdenAPI) => o.estado === "Listo para Despacho"
        );

        setOrdenes(soloDespacho);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    obtenerOrdenes();
  }, []);

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

  const abrirModal = (item: OrdenAPI) => {
    setOrdenSeleccionada({
      id: item.id,
      codigo: `ORD-${item.id}`,
      cliente: item.nombre_cliente,
      servicio: item.estado,
      fecha: "",
      estado: item.estado,
    });
    setObservacion("");
    setOpenModal(true);
  };

  const cerrarModal = () => {
    setOpenModal(false);
    setOrdenSeleccionada(null);
    setObservacion("");
  };

  const confirmarValidacion = async () => {
    if (!ordenSeleccionada) return;

    try {
      setValidando(true);

      const res = await fetch(
        `http://localhost:4000/viajes/detalle/validar/${ordenSeleccionada.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            observacion: observacion,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "No se pudo validar la orden");
        return;
      }

      alert("Orden validada correctamente");

      setOrdenes((prev) =>
        prev.filter((orden) => orden.id !== ordenSeleccionada.id)
      );

      cerrarModal();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al validar la orden");
    } finally {
      setValidando(false);
    }
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
          Órdenes pendientes por validar
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
            Lista de órdenes pendientes
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
                    Código
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                    Cliente
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                    Estado
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "#fff", fontWeight: "bold" }}
                  >
                    Acción
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Cargando órdenes...
                    </TableCell>
                  </TableRow>
                ) : (
                  ordenes.map((item) => (
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
                        ORD-{item.id}
                      </TableCell>

                      <TableCell sx={{ color: "#456882" }}>
                        {item.nombre_cliente}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={item.estado}
                          sx={{
                            background: "#A5D6A7",
                            color: "#1B5E20",
                            fontWeight: "bold",
                            borderRadius: "10px",
                          }}
                        />
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
                            background:
                              "linear-gradient(135deg, #456882, #1B3C53)",
                            boxShadow: "0 6px 14px rgba(27,60,83,0.25)",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #5B7F99, #244B66)",
                            },
                          }}
                        >
                          Validar orden
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
              Validar orden de servicio
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "rgb(27, 60, 83)",
                fontFamily: "Poppins",
                mb: 4,
              }}
            >
              Verifica la información de la orden seleccionada
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
                label="Código de orden"
                variant="outlined"
                value={ordenSeleccionada?.codigo || ""}
                InputProps={{ readOnly: true }}
                sx={{
                  ...inputCafe,
                  width: { xs: "100%", sm: 620 },
                }}
              />

              <TextField
                label="Cliente"
                variant="outlined"
                value={ordenSeleccionada?.cliente || ""}
                InputProps={{ readOnly: true }}
                sx={{
                  ...inputCafe,
                  width: { xs: "100%", sm: 620 },
                }}
              />

              <TextField
                label="Estado"
                variant="outlined"
                value={ordenSeleccionada?.estado || ""}
                InputProps={{ readOnly: true }}
                sx={{
                  ...inputCafe,
                  width: { xs: "100%", sm: 620 },
                }}
              />

              <TextField
                label="Observación"
                variant="outlined"
                placeholder="Escribe una observación o comentario"
                multiline
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
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
                  onClick={confirmarValidacion}
                  disabled={validando}
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
                  {validando ? "Validando..." : "Confirmar validación"}
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