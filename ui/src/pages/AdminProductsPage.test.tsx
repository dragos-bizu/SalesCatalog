import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminProductsPage } from "./AdminProductsPage";

const ensureCategoriesLoadedMock = jest.fn().mockResolvedValue(undefined);
const ensureProductsLoadedMock = jest.fn().mockResolvedValue(undefined);
const loadMoreMock = jest.fn().mockResolvedValue(undefined);
const removeMock = jest.fn().mockResolvedValue(undefined);

jest.mock("../managers/CategoryManager", () => ({
  useCategoryManager: () => ({
    items: [{ id: "c1", name: "Fruit", createdAt: "", updatedAt: "" }],
    loaded: true,
    loading: false,
    error: null,
    ensureLoaded: ensureCategoriesLoadedMock,
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock("../managers/ProductManager", () => ({
  useProductManager: () => ({
    items: [
      {
        id: "p1",
        ean: "123",
        categoryId: "c1",
        name: "Apple",
        description: "",
        images: [],
        createdAt: "",
        updatedAt: "",
      },
    ],
    nextCursor: "next",
    loaded: true,
    loading: false,
    error: null,
    ensureLoaded: ensureProductsLoadedMock,
    loadMore: loadMoreMock,
    getById: jest.fn(),
    fetchOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: removeMock,
  }),
}));

describe("AdminProductsPage", () => {
  beforeEach(() => {
    ensureCategoriesLoadedMock.mockClear();
    ensureProductsLoadedMock.mockClear();
    loadMoreMock.mockClear();
    removeMock.mockClear();
  });

  it("renders table view with actions", () => {
    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("table", { name: /admin products table/i })).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new product/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage categories/i })).toBeInTheDocument();
  });

  it("search button triggers reload with applied query", () => {
    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/search products/i), {
      target: { value: "apple" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    expect(ensureProductsLoadedMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("load more calls manager", () => {
    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(loadMoreMock).toHaveBeenCalledTimes(1);
  });

  it("delete confirmation calls remove", async () => {
    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(removeMock).toHaveBeenCalledWith("p1");
    });
  });
});
