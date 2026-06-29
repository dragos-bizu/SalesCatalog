import MenuIcon from "@mui/icons-material/Menu";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { type MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Outlet } from "react-router-dom";
import { useAuthManager } from "../managers/AuthManager";

/**
 * Application chrome shared by every route: the top AppBar and the main
 * content container. Individual pages render inside <Outlet />.
 */
export function Layout() {
  const { t } = useTranslation();
  const { isAuthenticated, email, signOut } = useAuthManager();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  function openMenu(event: MouseEvent<HTMLElement>) {
    setMenuAnchorEl(event.currentTarget);
  }

  function closeMenu() {
    setMenuAnchorEl(null);
  }

  function onSignOut() {
    closeMenu();
    signOut();
  }

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
            {t("app.name")}
          </Button>
          {!isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isAuthenticated ? (
                <>
                  <Button component={RouterLink} to="/admin" color="inherit">
                    {t("nav.admin")}
                  </Button>
                  {email && (
                    <Typography
                      variant="body2"
                      sx={{ mx: 1, opacity: 0.85 }}
                      data-testid="auth-email"
                    >
                      {email}
                    </Typography>
                  )}
                  <Button color="inherit" onClick={signOut}>
                    {t("nav.signOut")}
                  </Button>
                </>
              ) : (
                <Button component={RouterLink} to="/login" color="inherit">
                  {t("nav.signIn")}
                </Button>
              )}
            </Box>
          ) : (
            <Box>
              <IconButton
                color="inherit"
                aria-label={t("nav.menu", "menu")}
                onClick={openMenu}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={closeMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                {isAuthenticated ? (
                  [
                    <MenuItem
                      key="admin"
                      component={RouterLink}
                      to="/admin"
                      onClick={closeMenu}
                    >
                      {t("nav.admin")}
                    </MenuItem>,
                    <MenuItem key="email" disabled>
                      {email || "-"}
                    </MenuItem>,
                    <MenuItem key="signout" onClick={onSignOut}>
                      {t("nav.signOut")}
                    </MenuItem>,
                  ]
                ) : (
                  <MenuItem component={RouterLink} to="/login" onClick={closeMenu}>
                    {t("nav.signIn")}
                  </MenuItem>
                )}
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{ py: 2, textAlign: "center", color: "text.secondary" }}
      >
        <Typography variant="body2">{t("app.footer")}</Typography>
      </Box>
    </Box>
  );
}
