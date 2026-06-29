import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";

jest.mock("../managers/CategoryManager", () => ({
  useCategoryManager: () => ({
    items: [
      { id: "c1", name: "Fruit", createdAt: "", updatedAt: "" },
      { id: "c2", name: "Veg", createdAt: "", updatedAt: "" },
    ],
    loaded: true,
    loading: false,
    error: null,
    ensureLoaded: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }),
}));

const ensureLoadedMock = jest.fn().mockResolvedValue(undefined);
const loadMoreMock = jest.fn().mockResolvedValue(undefined);

jest.mock("../managers/ProductManager", () => ({
  useProductManager: () => ({
    items: [
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
    ],
    nextCursor: "next",
    loaded: true,
    loading: false,
    error: null,
    ensureLoaded: ensureLoadedMock,
    loadMore: loadMoreMock,
    getById: jest.fn(),
    fetchOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    ensureLoadedMock.mockClear();
    loadMoreMock.mockClear();
  });

  it("renders search + categories + products", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/browse products by category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search products/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /all products/i })).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("search button applies current input and triggers load", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/search products/i), {
      target: { value: "apple" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    // Initial mount + post-search reload (at least 2 calls).
    expect(ensureLoadedMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("load more button calls manager", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(loadMoreMock).toHaveBeenCalledTimes(1);
  });
});
