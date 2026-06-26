import { render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the app title", () => {
    render(<HomePage />);
    expect(screen.getByText("SalesCatalog")).toBeInTheDocument();
  });

  it("renders the get started button", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeInTheDocument();
  });
});
