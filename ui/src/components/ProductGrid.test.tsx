import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductGrid } from "./ProductGrid";

const products = [
  {
    id: "p1",
    ean: "",
    categoryId: "c1",
    name: "Apple",
    description: "Red apple",
    images: [],
    createdAt: "",
    updatedAt: "",
  },
];

describe("ProductGrid", () => {
  it("shows skeletons while loading and empty", () => {
    const { container } = render(<ProductGrid products={[]} loading />);
    // Skeleton renders with this class.
    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
  });

  it("shows empty message when not loading and no items", () => {
    render(<ProductGrid products={[]} loading={false} />);
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it("renders product cards", () => {
    render(
      <MemoryRouter>
        <ProductGrid products={products} loading={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });
});
