import { fireEvent, render, screen } from "@testing-library/react";
import { CategoryTabs } from "./CategoryTabs";

const categories = [
  { id: "c1", name: "Fruit", createdAt: "", updatedAt: "" },
  { id: "c2", name: "Vegetables", createdAt: "", updatedAt: "" },
];

describe("CategoryTabs", () => {
  it("renders 'All products' and category tabs", () => {
    render(
      <CategoryTabs
        categories={categories}
        selectedCategoryId={null}
        onChange={() => undefined}
      />, 
    );
    expect(screen.getByRole("tab", { name: /all products/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /fruit/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /vegetables/i })).toBeInTheDocument();
  });

  it("maps 'All products' to null", () => {
    const onChange = jest.fn();
    render(
      <CategoryTabs categories={categories} selectedCategoryId="c1" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /all products/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
