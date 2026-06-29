import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "../services/api";
import { AdminCategoriesPage } from "./AdminCategoriesPage";

const ensureLoadedMock = jest.fn().mockResolvedValue(undefined);
const createMock = jest.fn();
const updateMock = jest.fn();
const removeMock = jest.fn();

jest.mock("../managers/CategoryManager", () => ({
  useCategoryManager: () => ({
    items: [
      { id: "c1", name: "Fruit", createdAt: "", updatedAt: "" },
      { id: "c2", name: "Vegetables", createdAt: "", updatedAt: "" },
    ],
    loaded: true,
    loading: false,
    error: null,
    ensureLoaded: ensureLoadedMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
  }),
}));

describe("AdminCategoriesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createMock.mockResolvedValue({ id: "c3", name: "Dairy" });
    updateMock.mockResolvedValue({ id: "c1", name: "Fruits" });
    removeMock.mockResolvedValue(undefined);
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>,
    );
  }

  it("renders existing categories", () => {
    renderPage();
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
  });

  it("creates a category", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/new category/i), {
      target: { value: "Dairy" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({ name: "Dairy" });
    });
  });

  it("edits a category", async () => {
    renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    const editInput = screen.getByDisplayValue("Fruit");
    fireEvent.change(editInput, { target: { value: "Fruits" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith("c1", { name: "Fruits" });
    });
  });

  it("deletes a category after confirmation", async () => {
    renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: /^delete$/i })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(removeMock).toHaveBeenCalledWith("c1");
    });
  });

  it("shows specific 409 message when delete is blocked", async () => {
    removeMock.mockRejectedValueOnce(
      new ApiError(409, "Category still has products"),
    );

    renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: /^delete$/i })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/cannot delete category: it still has products/i),
      ).toBeInTheDocument();
    });
  });
});
