import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

/** 404 fallback for unmatched routes. */
export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4">{t("notFound.title")}</Typography>
        <Typography color="text.secondary">{t("notFound.message")}</Typography>
        <Button component={RouterLink} to="/" variant="contained">
          {t("notFound.backHome")}
        </Button>
      </Stack>
    </Paper>
  );
}
