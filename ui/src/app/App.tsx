import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { theme } from "../theme/theme";
import { HomePage } from "../pages/HomePage";

/**
 * Root application component.
 *
 * Wires the Redux store + MUI theme + baseline reset around the app.
 * Routing and auth are added in later steps.
 */
export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HomePage />
      </ThemeProvider>
    </Provider>
  );
}
