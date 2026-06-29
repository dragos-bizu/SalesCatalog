import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "./ProductCard";

const product = {
  id: "p1",
  ean: "",
  categoryId: "c1",
  name: "Apple",
  description: "Red apple",
  images: ["products/a.jpg"],
  createdAt: "",
  updatedAt: "",
};

describe("ProductCard", () => {
  it("links to /products/:id", () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/p1");
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });
});
