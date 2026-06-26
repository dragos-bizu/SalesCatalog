import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "../store/store";
import { theme } from "../theme/theme";
import { router } from "./routes";

/**
 * Root application component.
 *
 * Wires the Redux store + MUI theme + baseline reset + the React Router
 * around the app. Cognito auth lands in a later step.
 */
export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  );
}
