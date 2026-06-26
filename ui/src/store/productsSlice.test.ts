import reducer, {
  fetchProducts,
  productRemoved,
  productUpserted,
} from "./productsSlice";
import type { Product } from "../domain/types";

const prod = (id: string, name: string): Product => ({
  id,
  ean: "",
  categoryId: "c1",
  name,
  description: "",
  images: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

describe("productsSlice", () => {
  it("replaces items on fetch fulfilled (no append)", () => {
    const state = reducer(undefined, {
      type: fetchProducts.fulfilled.type,
      payload: {
        page: { items: [prod("p1", "Apple")], nextCursor: "abc" },
        args: { categoryId: "c1", q: null },
      },
    });
    expect(state.items).toHaveLength(1);
    expect(state.nextCursor).toBe("abc");
    expect(state.activeCategoryId).toBe("c1");
    expect(state.loaded).toBe(true);
  });

  it("appends items when args.append is true", () => {
    let state = reducer(undefined, {
      type: fetchProducts.fulfilled.type,
      payload: { page: { items: [prod("p1", "Apple")], nextCursor: "c" }, args: {} },
    });
    state = reducer(state, {
      type: fetchProducts.fulfilled.type,
      payload: {
        page: { items: [prod("p2", "Banana")], nextCursor: null },
        args: { append: true },
      },
    });
    expect(state.items.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(state.nextCursor).toBeNull();
  });

  it("upserts a product at the front, then updates in place", () => {
    let state = reducer(undefined, productUpserted(prod("p1", "Apple")));
    expect(state.items).toHaveLength(1);
    state = reducer(state, productUpserted(prod("p1", "Green Apple")));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].name).toBe("Green Apple");
  });

  it("removes a product", () => {
    let state = reducer(undefined, productUpserted(prod("p1", "Apple")));
    state = reducer(state, productRemoved("p1"));
    expect(state.items).toHaveLength(0);
  });

  it("sets error on rejected", () => {
    const state = reducer(undefined, {
      type: fetchProducts.rejected.type,
      error: { message: "nope" },
    });
    expect(state.error).toBe("nope");
  });
});
