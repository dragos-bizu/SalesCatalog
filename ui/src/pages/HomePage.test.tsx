import { render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the catalog title", () => {
    render(<HomePage />);
    expect(screen.getByText("SalesCatalog")).toBeInTheDocument();
  });

  it("mentions the upcoming public catalog content", () => {
    render(<HomePage />);
    expect(screen.getByText(/public catalog/i)).toBeInTheDocument();
  });
});
