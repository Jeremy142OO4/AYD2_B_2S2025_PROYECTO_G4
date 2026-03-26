import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import HistoryIcon from '@mui/icons-material/History';
import EmojiTransportationIcon from '@mui/icons-material/EmojiTransportation';
import { useNavigate } from "react-router-dom";

const pages = [
  { label: "Viajes", ruta: "/dashboard_patio", icon: <EmojiTransportationIcon /> },
    { label: "Historial", ruta: "/viajes/Historial", icon: <HistoryIcon /> },

];

export default function NavbarPiloto() {
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleEditProfile = () => {
    handleCloseUserMenu();
    navigate("/editar_perfil");
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    localStorage.removeItem("logitrans.session");
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        background: "linear-gradient(135deg, #1B3C53, #456882)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
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
            variant="h6"
            noWrap
            sx={{
              mr: 3,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              letterSpacing: ".08rem",
              color: "inherit",
              cursor: "pointer",
            }}
            onClick={() => navigate("/dashboard_patio")}
          >
            ogiTrans
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton onClick={handleOpenNavMenu} color="inherit">
              <MenuIcon />
            </IconButton>

            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.label}
                  onClick={() => {
                    navigate(page.ruta);
                    handleCloseNavMenu();
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {page.icon}
                    <Typography>{page.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Typography
            variant="h6"
            noWrap
            sx={{
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontWeight: 700,
              color: "inherit",
            }}
          >
            LogiTrans
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            {pages.map((page) => (
              <Button
                key={page.label}
                onClick={() => navigate(page.ruta)}
                startIcon={page.icon}
                sx={{
                  color: "white",
                  borderRadius: "12px",
                  px: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                  "&:hover": {
                    background: "rgba(255,255,255,0.12)",
                  },
                }}
              >
                {page.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Cuenta">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 1 }}>
                    <AccountCircleIcon sx={{ fontSize: 42, color: "white" }} />
                    </IconButton>
                </Tooltip>
                </Box>

            <Menu
              sx={{ mt: "45px" }}
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleEditProfile}>
                <Typography textAlign="center">Editar perfil</Typography>
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                <Typography textAlign="center">Salir</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}