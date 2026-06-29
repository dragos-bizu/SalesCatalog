import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { Category } from "../domain/types";

export interface CategoryTabsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onChange: (categoryId: string | null) => void;
}

/**
 * Category selector used on the public home page.
 * Includes the required "All products" tab.
 */
export function CategoryTabs({
  categories,
  selectedCategoryId,
  onChange,
}: CategoryTabsProps) {
  return (
    <Tabs
      value={selectedCategoryId ?? "all"}
      onChange={(_, value: string) => onChange(value === "all" ? null : value)}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ mb: 2 }}
    >
      <Tab label="All products" value="all" />
      {categories.map((c) => (
        <Tab key={c.id} label={c.name} value={c.id} />
      ))}
    </Tabs>
  );
}
