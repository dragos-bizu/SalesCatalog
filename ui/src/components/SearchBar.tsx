import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

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
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        label="Search products"
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
      >
        Search
      </Button>
    </Box>
  );
}
