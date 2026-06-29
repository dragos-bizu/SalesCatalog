import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProductDetailPage } from "./ProductDetailPage";
import { ApiError } from "../services/api";

const fetchOneMock = jest.fn();
const ensureCategoriesLoadedMock = jest.fn().mockResolvedValue(undefined);

jest.mock("../managers/ProductManager", () => ({
  useProductManager: () => ({
    fetchOne: fetchOneMock,
  }),
}));

jest.mock("../managers/CategoryManager", () => ({
  useCategoryManager: () => ({
    items: [{ id: "c1", name: "Fruit", createdAt: "", updatedAt: "" }],
    ensureLoaded: ensureCategoriesLoadedMock,
  }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProductDetailPage", () => {
  beforeEach(() => {
    fetchOneMock.mockReset();
    ensureCategoriesLoadedMock.mockClear();
  });

  it("loads and renders product details", async () => {
    fetchOneMock.mockResolvedValue({
      id: "p1",
      ean: "123",
      categoryId: "c1",
      name: "Apple",
      description: "Red apple",
      images: ["products/a.jpg"],
      createdAt: "",
      updatedAt: "",
    });

    renderAt("/products/p1");

    await waitFor(() => {
      expect(screen.getByText("Apple")).toBeInTheDocument();
    });
    expect(screen.getByText(/Category: Fruit/i)).toBeInTheDocument();
    expect(screen.getByText(/EAN: 123/i)).toBeInTheDocument();
    expect(screen.getByText("Red apple")).toBeInTheDocument();
    expect(ensureCategoriesLoadedMock).toHaveBeenCalled();
  });

  it("shows not found message for 404", async () => {
    fetchOneMock.mockRejectedValue(new ApiError(404, "Product not found"));

    renderAt("/products/missing");

    await waitFor(() => {
      expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    });
  });

  it("shows generic error for non-404 failures", async () => {
    fetchOneMock.mockRejectedValue(new Error("boom"));

    renderAt("/products/p1");

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });
  });

  it("renders no-image placeholder when product has no image", async () => {
    fetchOneMock.mockResolvedValue({
      id: "p1",
      ean: "",
      categoryId: "c1",
      name: "Apple",
      description: "",
      images: [],
      createdAt: "",
      updatedAt: "",
    });

    renderAt("/products/p1");

    await waitFor(() => {
      expect(screen.getByText(/no image/i)).toBeInTheDocument();
    });
  });
});
