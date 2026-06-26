import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { HomePage } from "../pages/HomePage";

/**
 * Root application component.
 *
 * Wires the MUI theme + baseline reset around the app. Routing, the Redux
 * store provider, and auth are added in later steps.
 */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HomePage />
    </ThemeProvider>
  );
}
