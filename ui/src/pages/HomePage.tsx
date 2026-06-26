import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import StorefrontIcon from "@mui/icons-material/Storefront";

/**
 * Temporary landing page used to verify the Vite + MUI scaffold renders.
 * Replaced by the real catalog pages in later steps.
 */
export function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static">
        <Toolbar>
          <StorefrontIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            SalesCatalog
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            It works! 🎉
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Vite + React + TypeScript + Material UI scaffold is up and running.
          </Typography>
          <Button variant="contained" size="large">
            Get started
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
