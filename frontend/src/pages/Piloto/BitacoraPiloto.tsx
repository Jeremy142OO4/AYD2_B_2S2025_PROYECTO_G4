import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import NavbarPiloto from "./Navbar_piloto";
import { getCurrentUser } from "../../util/auth";

type Piloto = {
  piloto_id: number;
  usuario_id: number;
  licencia: string;
  nombre: string;
  foto_perfil: string;
};

type Evento = {
  orden_id: number;
  descripcion: string;
  fecha: string;
  tipo: string;
  imagen?: string | null;
};

export default function Bitacora_piloto() {
  const currentUser = getCurrentUser();

  const [nombrePiloto, setNombrePiloto] = React.useState("");
  const [eventos, setEventos] = React.useState<Evento[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtro, setFiltro] = React.useState("");

  React.useEffect(() => {
    const cargarBitacora = async () => {
      try {
        if (!currentUser) {
          console.error("No hay usuario en sesión");
          return;
        }

        // 1. Obtener pilotos
        const resPilotos = await fetch(
          "http://localhost:4000/agente_logistico/piloto/obtener_pilotos"
        );

        if (!resPilotos.ok) {
          throw new Error("No se pudieron obtener los pilotos");
        }

        const dataPilotos = await resPilotos.json();

        const pilotoEncontrado = dataPilotos.data.find(
          (p: Piloto) => p.usuario_id === currentUser.userId
        );

        if (!pilotoEncontrado) {
          throw new Error("No se encontró piloto para este usuario");
        }

        // 2. Obtener bitácora del piloto usando su id
        const resBitacora = await fetch(
          `http://localhost:4000/agente_logistico/piloto/bitacora/${pilotoEncontrado.piloto_id}`
        );

        if (!resBitacora.ok) {
          throw new Error("No se pudo obtener la bitácora");
        }

        const dataBitacora = await resBitacora.json();

        setNombrePiloto(dataBitacora.nombre || pilotoEncontrado.nombre || "");
        setEventos(dataBitacora.eventos || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarBitacora();
  }, [currentUser]);

  const obtenerUrlImagen = (imagen?: string | null) => {
    if (!imagen || imagen.trim() === "") return null;

    if (imagen.startsWith("data:image")) return imagen;

    return `data:image/jpeg;base64,${imagen}`;
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "Sin fecha";
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return fecha;
    return f.toLocaleString("es-GT");
  };

  const eventosFiltrados = eventos.filter((evento) => {
    const texto = filtro.toLowerCase();

    return (
      (evento.tipo || "").toLowerCase().includes(texto) ||
      (evento.descripcion || "").toLowerCase().includes(texto) ||
      (evento.fecha || "").toLowerCase().includes(texto) ||
      evento.orden_id?.toString().includes(texto)
    );
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(130deg, #1B3C53 50%, #D2C1B6 90%)",
      }}
    >
      <NavbarPiloto />

      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography
          variant="h4"
          sx={{
            color: "#F9F3EF",
            fontWeight: "bold",
            fontFamily: "Poppins",
            mb: 1,
          }}
        >
          Mi bitácora
        </Typography>

        <Typography
          sx={{
            color: "#F9F3EF",
            fontFamily: "Poppins",
            mb: 3,
          }}
        >
          {nombrePiloto
            ? `Eventos registrados por ${nombrePiloto}.`
            : "Eventos registrados del piloto."}
        </Typography>

        <TextField
          fullWidth
          label="Buscar por tipo, descripción, fecha o id de orden"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          sx={{
            mb: 4,
            background: "rgba(249,243,239,0.92)",
            borderRadius: "12px",
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              fontFamily: "Poppins",
            },
            "& .MuiInputLabel-root": {
              fontFamily: "Poppins",
            },
          }}
        />

        {loading ? (
          <Typography sx={{ color: "#F9F3EF", fontFamily: "Poppins" }}>
            Cargando bitácora...
          </Typography>
        ) : eventosFiltrados.length === 0 ? (
          <Typography sx={{ color: "#F9F3EF", fontFamily: "Poppins" }}>
            No hay eventos para mostrar.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
              },
              gap: 3,
            }}
          >
            {eventosFiltrados.map((evento, index) => {
              const imagenUrl = obtenerUrlImagen(evento.imagen);

              return (
                <Card
                  key={`${evento.orden_id}-${index}`}
                  sx={{
                    borderRadius: "18px",
                    background:
                      "linear-gradient(135deg, rgb(249,243,239), rgb(210,193,182))",
                    boxShadow: "0 8px 24px rgba(121,85,72,0.16)",
                    border: "1px solid rgb(210, 193, 182)",
                  }}
                >
                  <CardContent>
                    <Typography
                      sx={{
                        color: "#456882",
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "Poppins",
                        mb: 1,
                      }}
                    >
                      Orden #{evento.orden_id}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#1B3C53",
                        fontWeight: "bold",
                        fontFamily: "Poppins",
                        mb: 1,
                        fontSize: "1.1rem",
                      }}
                    >
                      Tipo: {evento.tipo || "Sin dato"}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#5D4037",
                        fontFamily: "Poppins",
                        mb: 1,
                      }}
                    >
                      Descripción: {evento.descripcion || "Sin descripción"}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#5D4037",
                        fontFamily: "Poppins",
                        mb: 2,
                      }}
                    >
                      Fecha: {formatearFecha(evento.fecha)}
                    </Typography>

                    <Chip
                      label={evento.tipo || "Sin tipo"}
                      sx={{
                        mb: 2,
                        background: "rgba(69,104,130,0.15)",
                        color: "#1B3C53",
                        fontWeight: "bold",
                        borderRadius: "10px",
                        fontFamily: "Poppins",
                      }}
                    />

                    {imagenUrl ? (
                      <Box
                        component="img"
                        src={imagenUrl}
                        alt={`Evento orden ${evento.orden_id}`}
                        sx={{
                          width: "100%",
                          height: 220,
                          objectFit: "cover",
                          borderRadius: "12px",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: 220,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "12px",
                          background: "rgba(210,193,182,0.35)",
                          color: "#5D4037",
                          fontFamily: "Poppins",
                          fontWeight: "bold",
                          border: "1px dashed rgba(93,64,55,0.35)",
                        }}
                      >
                        Sin foto
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}