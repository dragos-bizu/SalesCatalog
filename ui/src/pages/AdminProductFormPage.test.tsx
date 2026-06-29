import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminProductFormPage } from "./AdminProductFormPage";

const navigateMock = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const categoryEnsureLoadedMock = jest.fn().mockResolvedValue(undefined);
const categoryCreateMock = jest.fn();

const productFetchOneMock = jest.fn();
const productCreateMock = jest.fn();
const productUpdateMock = jest.fn();

const uploadImagesMock = jest.fn();
jest.mock("../managers/ImageManager", () => ({
  uploadImages: (...args: unknown[]) => uploadImagesMock(...args),
}));

jest.mock("../managers/CategoryManager", () => ({
  useCategoryManager: () => ({
    items: [
      { id: "c1", name: "Fruit", createdAt: "", updatedAt: "" },
      { id: "c2", name: "Veg", createdAt: "", updatedAt: "" },
    ],
    loaded: true,
    loading: false,
    error: null,
    ensureLoaded: categoryEnsureLoadedMock,
    create: categoryCreateMock,
    update: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock("../managers/ProductManager", () => ({
  useProductManager: () => ({
    items: [],
    nextCursor: null,
    loaded: true,
    loading: false,
    error: null,
    ensureLoaded: jest.fn(),
    loadMore: jest.fn(),
    getById: jest.fn(),
    fetchOne: productFetchOneMock,
    create: productCreateMock,
    update: productUpdateMock,
    remove: jest.fn(),
  }),
}));

function renderNew() {
  return render(
    <MemoryRouter initialEntries={["/admin/products/new"]}>
      <Routes>
        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEdit(id = "p1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/products/${id}/edit`]}>
      <Routes>
        <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminProductFormPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    categoryCreateMock.mockResolvedValue({ id: "c-new", name: "NewCat" });
    productFetchOneMock.mockResolvedValue({
      id: "p1",
      ean: "111",
      categoryId: "c1",
      name: "Apple",
      description: "Red",
      images: ["products/a.jpg"],
      createdAt: "",
      updatedAt: "",
    });
    productCreateMock.mockResolvedValue({ id: "p2" });
    productUpdateMock.mockResolvedValue({ id: "p1" });
    uploadImagesMock.mockResolvedValue([
      { key: "products/u1.jpg", publicUrl: "https://images.example.com/products/u1.jpg" },
    ]);
  });

  it("renders create mode and creates a product", async () => {
    renderNew();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Banana" } });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /category/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Fruit" }));
    fireEvent.change(screen.getByLabelText(/ean/i), { target: { value: "222" } });

    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() => {
      expect(productCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Banana",
          categoryId: "c1",
          ean: "222",
        }),
      );
    });
  });

  it("loads and updates in edit mode", async () => {
    renderEdit("p1");

    await waitFor(() => {
      expect(productFetchOneMock).toHaveBeenCalledWith("p1");
      expect(screen.getByText(/edit product/i)).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Apple")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Green Apple" } });

    const submit = Array.from(document.querySelectorAll("button")).find((b) =>
      /save|create product/i.test(b.textContent ?? ""),
    );
    expect(submit).toBeTruthy();
    fireEvent.click(submit!);

    await waitFor(() => {
      expect(productUpdateMock).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ name: "Green Apple" }),
      );
    });
  });

  it("creates a category inline", async () => {
    renderNew();

    fireEvent.change(screen.getByLabelText(/create new category/i), {
      target: { value: "NewCat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));

    await waitFor(() => {
      expect(categoryCreateMock).toHaveBeenCalledWith({ name: "NewCat" });
    });
  });

  it("uploads selected files and adds keys to chips", async () => {
    renderNew();

    const file = new File(["hello"], "a.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/select files/i).parentElement?.querySelector("input[type='file']") as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /upload selected/i }));

    await waitFor(() => {
      expect(uploadImagesMock).toHaveBeenCalled();
    });
    expect(screen.getByAltText(/product image 1/i)).toBeInTheDocument();
  });
});
