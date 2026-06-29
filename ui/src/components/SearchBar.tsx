import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  disabled?: boolean;
}

/**
 * Controlled search input with an explicit Search button.
 *
 * No auto-search while typing: network calls happen only when the user clicks
 * Search (or presses Enter in the field).
 */
export function SearchBar({ value, onChange, onSearch, disabled }: SearchBarProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1,
        alignItems: { xs: "stretch", sm: "center" },
        mb: 2,
      }}
    >
      <TextField
        fullWidth
        size="small"
        label={t("search.label")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSearch();
          }
        }}
      />
      <Button
        variant="contained"
        startIcon={<SearchIcon />}
        onClick={onSearch}
        disabled={disabled}
        sx={{
          width: { xs: "100%", sm: "auto" },
          px: { xs: 2, sm: 1.75 },
          py: { xs: 1, sm: 0.5 },
        }}
      >
        {t("search.button")}
      </Button>
    </Box>
  );
}
