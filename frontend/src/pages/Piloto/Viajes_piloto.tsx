import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import NavbarPiloto from "./Navbar_piloto";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../util/auth";

type Piloto = {
  piloto_id: number;
  usuario_id: number;
  licencia: string;
  nombre: string;
  foto_perfil: string;
};

type Viaje = {
  id: number;
  fecha: string;
  origen: string;
  destino: string;
  distancia: number;
  peso: number;
  placa:string;
};

export default function ViajesPiloto() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [viajes, setViajes] = React.useState<Viaje[]>([]);
  const [nombrePiloto, setNombrePiloto] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const cargarViajesPiloto = async () => {
      try {
        if (!currentUser) {
          console.error("No hay usuario en sesión");
          return;
        }

        // 1. Obtener todos los pilotos
        const resPilotos = await fetch(
          "http://localhost:4000/agente_logistico/piloto/obtener_pilotos"
        );

        if (!resPilotos.ok) {
          throw new Error("No se pudieron obtener los pilotos");
        }

        const dataPilotos = await resPilotos.json();

        // 2. Buscar el piloto cuyo usuario_id coincide con el id del login
        const pilotoEncontrado = dataPilotos.data.find(
          (p: Piloto) => p.usuario_id === currentUser.userId
        );

        if (!pilotoEncontrado) {
          throw new Error("No se encontró piloto para este usuario");
        }

        setNombrePiloto(pilotoEncontrado.nombre);

        // 3. Usar piloto_id para pedir historial
        const resHistorial = await fetch(
          `http://localhost:4000/agente_logistico/piloto/obtener_historial_piloto/${pilotoEncontrado.piloto_id}`
        );

        if (!resHistorial.ok) {
          throw new Error("No se pudo obtener el historial del piloto");
        }

        const dataHistorial = await resHistorial.json();

        setViajes(dataHistorial.viajes || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarViajesPiloto();
  }, [currentUser]);

  const colorEstado = (estado: string) => {
    if (estado === "Pendiente") return "rgba(210,193,182,0.75)";
    if (estado === "En ruta") return "rgba(241, 196, 15, 0.25)";
    return "rgba(46, 204, 113, 0.25)";
  };

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
          Mis viajes
        </Typography>

        <Typography
          sx={{
            color: "#F9F3EF",
            fontFamily: "Poppins",
            mb: 4,
          }}
        >
          {nombrePiloto
            ? `Aquí puedes ver tus Viajes  ${nombrePiloto}.`
            : "Aquí puedes ver los viajes asignados al piloto."}
        </Typography>

        {loading ? (
          <Typography sx={{ color: "#F9F3EF" }}>Cargando viajes...</Typography>
        ) : viajes.length === 0 ? (
          <Typography sx={{ color: "#F9F3EF" }}>
            No hay viajes registrados para este piloto.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                lg: "1fr 1fr 1fr",
              },
              gap: 3,
            }}
          >
            {viajes.map((viaje) => (
              <Card
                key={viaje.id}
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
                    gutterBottom
                    sx={{
                      color: "#456882",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "Poppins",
                    }}
                  >
                    Viaje #{viaje.id}
                  </Typography>

                  <Typography
                    variant="h5"
                    component="div"
                    sx={{
                      color: "#1B3C53",
                      fontWeight: "bold",
                      fontFamily: "Poppins",
                      mb: 1,
                    }}
                  >
                    {viaje.origen} → {viaje.destino}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#5D4037",
                      mb: 1,
                      fontFamily: "Poppins",
                    }}
                  >
                    Fecha: {viaje.fecha}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#5D4037",
                      mb: 1,
                      fontFamily: "Poppins",
                    }}
                  >
                    Distancia: {viaje.distancia} km
                  </Typography>

                  <Typography
                    sx={{
                      color: "#5D4037",
                      mb: 1.5,
                      fontFamily: "Poppins",
                    }}
                  >
                    Peso: {viaje.peso} kg
                  </Typography>

                  <Chip
                    label="Finalizado"
                    sx={{
                      background: colorEstado("Finalizado"),
                      color: "#1B3C53",
                      fontWeight: "bold",
                      borderRadius: "10px",
                      fontFamily: "Poppins",
                    }}
                  />
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
  <Button
  variant="contained"
  onClick={() =>
    navigate("/Viajes/detalle", {
      state: { viaje }
    })
  }
  sx={{
    textTransform: "none",
    fontWeight: "bold",
    borderRadius: "10px",
    background: "#456882",
    fontFamily: "Poppins",
    "&:hover": {
      background: "#1B3C53",
    },
  }}
>
  Ver detalle
</Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}