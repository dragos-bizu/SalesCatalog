import reducer, {
  categoryRemoved,
  categoryUpserted,
  fetchCategories,
} from "./categoriesSlice";
import type { Category } from "../domain/types";

const cat = (id: string, name: string): Category => ({
  id,
  name,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

describe("categoriesSlice", () => {
  it("has the expected initial state", () => {
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state.items).toEqual([]);
    expect(state.loaded).toBe(false);
  });

  it("stores items on fetch fulfilled", () => {
    const items = [cat("c1", "Fruit")];
    const state = reducer(undefined, {
      type: fetchCategories.fulfilled.type,
      payload: items,
    });
    expect(state.items).toEqual(items);
    expect(state.loaded).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("sets error on fetch rejected", () => {
    const state = reducer(undefined, {
      type: fetchCategories.rejected.type,
      error: { message: "boom" },
    });
    expect(state.error).toBe("boom");
  });

  it("upserts a category (insert then update)", () => {
    let state = reducer(undefined, categoryUpserted(cat("c1", "Fruit")));
    expect(state.items).toHaveLength(1);
    state = reducer(state, categoryUpserted(cat("c1", "Fruits")));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].name).toBe("Fruits");
  });

  it("removes a category", () => {
    let state = reducer(undefined, categoryUpserted(cat("c1", "Fruit")));
    state = reducer(state, categoryRemoved("c1"));
    expect(state.items).toHaveLength(0);
  });
});
