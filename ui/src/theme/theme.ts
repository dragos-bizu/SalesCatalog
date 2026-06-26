import { createTheme } from "@mui/material/styles";

// Central MUI theme for SalesCatalog. Extend palette/typography here as the
// design evolves; all styling flows through this theme + the `sx` prop.
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
  },
  shape: {
    borderRadius: 10,
  },
});
