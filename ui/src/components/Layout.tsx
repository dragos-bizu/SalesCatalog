import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Link as RouterLink, Outlet } from "react-router-dom";

/**
 * Application chrome shared by every route: the top AppBar and the main
 * content container. Individual pages render inside <Outlet />.
 */
export function Layout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky">
        <Toolbar>
          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            startIcon={<StorefrontIcon />}
            sx={{ textTransform: "none", fontSize: "1.1rem", mr: "auto" }}
          >
            SalesCatalog
          </Button>
          <Button component={RouterLink} to="/admin" color="inherit">
            Admin
          </Button>
          <Button component={RouterLink} to="/login" color="inherit">
            Sign in
          </Button>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{ py: 2, textAlign: "center", color: "text.secondary" }}
      >
        <Typography variant="body2">SalesCatalog</Typography>
      </Box>
    </Box>
  );
}
