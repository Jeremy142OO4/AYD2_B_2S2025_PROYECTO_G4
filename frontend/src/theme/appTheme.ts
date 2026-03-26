import { alpha, createTheme } from '@mui/material/styles'

const paletteColors = {
  primaryDark: '#1B3C53',
  primaryLight: '#456882',
  accent: '#D2C1B6',
  background: '#F9F3EF',
  white: '#FFFFFF',
}

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: paletteColors.primaryDark,
      light: paletteColors.primaryLight,
      contrastText: paletteColors.white,
    },
    secondary: {
      main: paletteColors.primaryLight,
      contrastText: paletteColors.white,
    },
    info: {
      main: paletteColors.primaryLight,
      contrastText: paletteColors.white,
    },
    success: {
      main: paletteColors.primaryLight,
      contrastText: paletteColors.white,
    },
    warning: {
      main: paletteColors.accent,
      contrastText: paletteColors.primaryDark,
    },
    error: {
      main: paletteColors.primaryDark,
      contrastText: paletteColors.white,
    },
    text: {
      primary: paletteColors.primaryDark,
      secondary: paletteColors.primaryLight,
    },
    background: {
      default: paletteColors.background,
      paper: paletteColors.white,
    },
  },
  typography: {
    fontFamily: 'Barlow, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${alpha(paletteColors.primaryDark, 0.14)}`,
        },
        standardInfo: {
          backgroundColor: alpha(paletteColors.primaryLight, 0.18),
          color: paletteColors.primaryDark,
        },
        standardSuccess: {
          backgroundColor: alpha(paletteColors.primaryLight, 0.16),
          color: paletteColors.primaryDark,
        },
        standardWarning: {
          backgroundColor: alpha(paletteColors.accent, 0.34),
          color: paletteColors.primaryDark,
        },
        standardError: {
          backgroundColor: alpha(paletteColors.primaryDark, 0.14),
          color: paletteColors.primaryDark,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
})
