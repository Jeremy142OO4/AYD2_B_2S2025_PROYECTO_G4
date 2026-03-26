import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser } from "../../util/auth";

const cardAnim = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

type ProfileResponse = {
  error?: string;
  nombreEmpresa?: string;
  correo?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
};

type BasicResponse = {
  error?: string;
  message?: string;
};

export default function PerfilClientePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get("modo") === "editar";
  const currentUser = getCurrentUser();
  const referenceID = currentUser?.userId ?? currentUser?.clienteId;
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

  const [empresa, setEmpresa] = useState({
    nombreEmpresa: "",
    correo: "",
    nit: "",
    direccion: "",
    telefono: "",
  });

  const [security, setSecurity] = useState({
    passwordActual: "",
    passwordNueva: "",
    passwordConfirmacion: "",
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileCards = useMemo(
    () => [
      {
        label: "Nombre de la empresa",
        value: empresa.nombreEmpresa,
        icon: <BusinessOutlinedIcon color="primary" />,
      },
      {
        label: "Correo",
        value: empresa.correo,
        icon: <EmailOutlinedIcon color="primary" />,
      },
      {
        label: "NIT",
        value: empresa.nit,
        icon: <BadgeOutlinedIcon color="primary" />,
      },
      {
        label: "Direccion",
        value: empresa.direccion,
        icon: <PlaceOutlinedIcon color="primary" />,
      },
      {
        label: "Telefono",
        value: empresa.telefono,
        icon: <PhoneOutlinedIcon color="primary" />,
      },
    ],
    [empresa],
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!referenceID) {
        setFeedback({
          type: "error",
          message:
            "No se encontro userId en la sesion. Inicia sesion nuevamente.",
        });
        return;
      }

      setIsLoading(true);
      setFeedback(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/clientes/me/perfil?user_id=${referenceID}`,
        );
        const payload = (await response
          .json()
          .catch(() => ({}))) as ProfileResponse;
        if (!response.ok) {
          throw new Error(
            payload.error ?? "No se pudo cargar el perfil del cliente.",
          );
        }

        setEmpresa({
          nombreEmpresa: payload.nombreEmpresa ?? "",
          correo: payload.correo ?? "",
          nit: payload.nit ?? "",
          direccion: payload.direccion ?? "",
          telefono: payload.telefono ?? "",
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Error inesperado al cargar perfil.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [API_BASE_URL, referenceID]);

  const saveProfile = () => {
    if (!referenceID) {
      setFeedback({
        type: "error",
        message:
          "No se encontro userId en la sesion. Inicia sesion nuevamente.",
      });
      return;
    }

    void (async () => {
      try {
        setIsSaving(true);
        setFeedback(null);

        const payloadToSave = {
          nombreEmpresa: empresa.nombreEmpresa,
          nit: empresa.nit,
          direccion: empresa.direccion,
          telefono: empresa.telefono,
        }

        const response = await fetch(
          `${API_BASE_URL}/api/clientes/me/perfil?user_id=${referenceID}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payloadToSave),
          },
        );

        const payload = (await response
          .json()
          .catch(() => ({}))) as BasicResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo actualizar el perfil.");
        }

        setFeedback({
          type: "success",
          message:
            payload.message ?? "Perfil de empresa actualizado correctamente.",
        });
        navigate("/cliente/perfil", { replace: true });
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Error inesperado al actualizar perfil.",
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const changePassword = () => {
    if (!referenceID) {
      setFeedback({
        type: "error",
        message:
          "No se encontro userId en la sesion. Inicia sesion nuevamente.",
      });
      return;
    }

    if (
      !security.passwordActual ||
      !security.passwordNueva ||
      !security.passwordConfirmacion
    ) {
      setFeedback({
        type: "error",
        message: "Completa todos los campos de contrasena para continuar.",
      });
      return;
    }

    if (security.passwordNueva !== security.passwordConfirmacion) {
      setFeedback({
        type: "error",
        message: "La confirmacion de contrasena no coincide.",
      });
      return;
    }

    void (async () => {
      try {
        setIsChangingPassword(true);
        setFeedback(null);

        const response = await fetch(
          `${API_BASE_URL}/api/clientes/me/contrasena?user_id=${referenceID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(security),
          },
        );

        const payload = (await response
          .json()
          .catch(() => ({}))) as BasicResponse;
        if (!response.ok) {
          throw new Error(
            payload.error ?? "No se pudo actualizar la contrasena.",
          );
        }

        setFeedback({
          type: "success",
          message: payload.message ?? "Contrasena actualizada correctamente.",
        });
        setSecurity({
          passwordActual: "",
          passwordNueva: "",
          passwordConfirmacion: "",
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Error inesperado al actualizar contrasena.",
        });
      } finally {
        setIsChangingPassword(false);
      }
    })();
  };

  const goToEdit = () => {
    setFeedback(null);
    navigate("/cliente/perfil?modo=editar");
  };

  const goToView = () => {
    setFeedback(null);
    navigate("/cliente/perfil", { replace: true });
  };

  return (
    <motion.section
      className="op-module"
      variants={cardAnim}
      initial="hidden"
      animate="show"
    >
      <div className="op-toolbar">
        <Typography variant="h5" className="op-title">
          {isEditMode ? "Editar Perfil de Cliente" : "Perfil de Cliente"}
        </Typography>
      </div>

      <Alert severity="info" sx={{ mb: 2 }}>
        En esta seccion solo se muestran los datos del registro empresarial.
      </Alert>

      {feedback ? (
        <Alert severity={feedback.type}>{feedback.message}</Alert>
      ) : null}

      {isLoading ? (
        <Paper className="op-panel cp-panel" elevation={0} sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando perfil...</Typography>
          </Stack>
        </Paper>
      ) : null}

      {!isEditMode ? (
        <Paper className="op-panel cp-panel" elevation={0} sx={{ p: 2 }}>
          <Typography variant="h6" className="op-title">
            Resumen de Datos
          </Typography>

          <Grid container spacing={1.2}>
            {profileCards.map((item) => (
              <Grid key={item.label} size={{ xs: 12, md: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.35,
                    borderRadius: 2,
                    borderColor: "rgba(69,104,130,0.28)",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 0.6 }}
                  >
                    {item.icon}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: "var(--color-primary-dark)",
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 700, color: "var(--color-primary-dark)" }}
                  >
                    {item.value || "-"}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Button
            className="op-btn op-btn--primary cp-saveBtn"
            onClick={goToEdit}
          >
            Ir a editar perfil
          </Button>
        </Paper>
      ) : (
        <>
          <Paper
            className="op-panel cp-panel cp-editPanel"
            elevation={0}
            sx={{ p: 2 }}
          >
            <Stack
              className="cp-sectionHead"
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Typography variant="h6" className="op-title cp-sectionTitle">
                Datos del Registro
              </Typography>
              <Typography variant="body2" className="cp-sectionHint">
                Actualiza unicamente la informacion de tu registro empresarial.
              </Typography>
            </Stack>

            <Divider />

            <div className="cp-grid cp-grid--edit">
              <TextField
                label="Nombre de la empresa"
                value={empresa.nombreEmpresa}
                onChange={(event) =>
                  setEmpresa((prev) => ({
                    ...prev,
                    nombreEmpresa: event.target.value,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Correo"
                value={empresa.correo}
                fullWidth
                disabled
                helperText="El correo solo se muestra como referencia y no es editable."
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="NIT"
                value={empresa.nit}
                onChange={(event) =>
                  setEmpresa((prev) => ({ ...prev, nit: event.target.value }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Direccion"
                value={empresa.direccion}
                onChange={(event) =>
                  setEmpresa((prev) => ({
                    ...prev,
                    direccion: event.target.value,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Telefono"
                value={empresa.telefono}
                onChange={(event) =>
                  setEmpresa((prev) => ({
                    ...prev,
                    telefono: event.target.value,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            <Box className="cp-formActions">
              <Button
                className="op-btn op-btn--primary cp-saveBtn"
                onClick={saveProfile}
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar Perfil"}
              </Button>
              <Button
                className="op-btn op-btn--ghost cp-saveBtn"
                onClick={goToView}
              >
                Cancelar
              </Button>
            </Box>
          </Paper>

          <Paper
            className="op-panel cp-panel cp-editPanel"
            elevation={0}
            sx={{ p: 2 }}
          >
            <Typography variant="h6" className="op-title cp-sectionTitle">
              Cambio de contrasena
            </Typography>
            <Typography variant="body2" className="cp-sectionHint">
              Usa una contrasena fuerte con mayusculas, numeros y simbolos.
            </Typography>

            <Divider />

            <div className="cp-grid cp-grid--security cp-grid--edit">
              <TextField
                label="Contrasena actual"
                type="password"
                value={security.passwordActual}
                onChange={(event) =>
                  setSecurity((prev) => ({
                    ...prev,
                    passwordActual: event.target.value,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Contrasena nueva"
                type="password"
                value={security.passwordNueva}
                onChange={(event) =>
                  setSecurity((prev) => ({
                    ...prev,
                    passwordNueva: event.target.value,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirmar contrasena nueva"
                type="password"
                value={security.passwordConfirmacion}
                onChange={(event) =>
                  setSecurity((prev) => ({
                    ...prev,
                    passwordConfirmacion: event.target.value,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            <Box className="cp-formActions">
              <Button
                className="op-btn op-btn--primary cp-saveBtn"
                onClick={changePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword
                  ? "Actualizando..."
                  : "Actualizar Contrasena"}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </motion.section>
  );
}
