import { NavLink, Outlet } from "react-router-dom"
import * as React from "react"
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LogoutSharpIcon from "@mui/icons-material/LogoutSharp"
import DashboardIcon from "@mui/icons-material/Dashboard"
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import CommuteIcon from '@mui/icons-material/Commute';
import Groups2Icon from '@mui/icons-material/Groups2';
import BookIcon from '@mui/icons-material/Book';
type Props = {
  onLogout: () => void
}

export default function MenuInicial({ onLogout }: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const theme = createTheme({
    palette: {
      mode: "light",
      primary: { main: "#456882" },
      secondary: { main: "#C9B59C" },
    },
  })

  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "100vh",
          backgroundColor: "#F8FAFC",
        }}
      >
        <aside
          style={{
            background: "#1B3C53",
            color: "#D2C1B6",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "2px 0 10px rgba(0,0,0,0.08)",
          }}
        >
          <div>
          <Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 2,
    mb: 3,
  }}
>
  <Box
    sx={{
      width: 48,
      height: 48,
      borderRadius: "12px",
      background: "linear-gradient(135deg,#456882,#1B3C53)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 26,
      fontWeight: "bold",
      color: "#F9F3EF",
      fontFamily: "Poppins",
      boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
    }}
  >
    L
  </Box>

  <Typography
    sx={{
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "0.5px",
      color: "#F9F3EF",
      fontFamily: "Poppins",
    }}
  >
    LogiTrans
  </Typography>
</Box>

            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <NavLink
                to="/agente_logistico"
                end
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "#F9F3EF",
                  backgroundColor: isActive ? "#456882" : "transparent",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                })}
              >
                <DashboardIcon fontSize="small" />
            <Typography
    sx={{
      
      fontFamily: "Poppins",
    }}
  >
    Inicio
  </Typography>
              </NavLink>

                  <NavLink
                to="/agente_logistico/ordenes"
                end
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "#F9F3EF",
                  backgroundColor: isActive ? "#456882" : "transparent",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                })}
              >
                <ReceiptLongIcon fontSize="small" />
                          <Typography
    sx={{
      
      fontFamily: "Poppins",
    }}
  >
    Ordenes
  </Typography>
              </NavLink>

                  <NavLink
                to="/agente_logistico/vehiculos"
                end
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "#F9F3EF",
                  backgroundColor: isActive ? "#456882" : "transparent",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                })}
              >
                <CommuteIcon fontSize="small" />
          <Typography
    sx={{
      
      fontFamily: "Poppins",
    }}
  >
    Vehiculos
  </Typography>              </NavLink>
                    <NavLink
                to="/agente_logistico/piloto"
                end
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "#F9F3EF",
                  backgroundColor: isActive ? "#456882" : "transparent",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                })}
              >
                <Groups2Icon fontSize="small" />
                          <Typography
    sx={{
      
      fontFamily: "Poppins",
    }}
  >
    Pilotos
  </Typography>
              </NavLink>
                      <NavLink
                to="/agente_logistico/bitacora"
                end
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "#F9F3EF",
                  backgroundColor: isActive ? "#456882" : "transparent",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                })}
              >
                <BookIcon fontSize="small" />
                          <Typography
    sx={{
      
      fontFamily: "Poppins",
    }}
  >
    Bitacora
  </Typography>
              </NavLink>
            </nav>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: "20px",
            }}
          >
            <Tooltip title="Cuenta">
              <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                  color: "#F9F3EF",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.16)",
                  },
                }}
              >
                <LocalShippingIcon sx={{ width: 38, height: 38 }} />
              </IconButton>
            </Tooltip>
          </div>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Divider />

            <MenuItem
              onClick={() => {
                handleClose()
                onLogout()
              }}
            >
              <ListItemIcon>
                <LogoutSharpIcon fontSize="small" />
              </ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </aside>

        <main
          style={{
            padding: "32px",
            backgroundColor: "#D2C1B6",
          }}
        >
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  )
}