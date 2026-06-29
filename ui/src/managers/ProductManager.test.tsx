import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ReactNode } from "react";
import productsReducer from "../store/productsSlice";
import { useProductManager } from "./ProductManager";
import { api } from "../services/api";

jest.mock("../services/api");
const mockApi = api as jest.Mocked<typeof api>;

function makeStore() {
  return configureStore({ reducer: { products: productsReducer } });
}

function wrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

const prod = (id: string, name: string, categoryId = "c1") => ({
  id,
  ean: "",
  categoryId,
  name,
  description: "",
  images: [],
  createdAt: "2024",
  updatedAt: "2024",
});

describe("useProductManager", () => {
  afterEach(() => jest.resetAllMocks());

  it("ensureLoaded fetches once when cache empty, then serves cache", async () => {
    mockApi.listProducts.mockResolvedValue({
      items: [prod("p1", "Apple")],
      nextCursor: null,
    });
    const store = makeStore();
    const { result } = renderHook(() => useProductManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.ensureLoaded();
    });
    await act(async () => {
      await result.current.ensureLoaded();
    });
    expect(mockApi.listProducts).toHaveBeenCalledTimes(1);
    expect(result.current.items).toHaveLength(1);
  });

  it("reuses cached category results when switching back", async () => {
    mockApi.listProducts
      .mockResolvedValueOnce({ items: [prod("p1", "Apple", "c1")], nextCursor: null })
      .mockResolvedValueOnce({ items: [prod("p2", "Carrot", "c2")], nextCursor: null });

    const store = makeStore();
    const { result } = renderHook(() => useProductManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.ensureLoaded({ categoryId: "c1" });
    });
    await act(async () => {
      await result.current.ensureLoaded({ categoryId: "c2" });
    });
    await act(async () => {
      await result.current.ensureLoaded({ categoryId: "c1" });
    });

    expect(mockApi.listProducts).toHaveBeenCalledTimes(2);
    expect(result.current.items[0].categoryId).toBe("c1");
  });

  it("loadMore appends when nextCursor is set, no-ops otherwise", async () => {
    mockApi.listProducts
      .mockResolvedValueOnce({ items: [prod("p1", "Apple")], nextCursor: "abc" })
      .mockResolvedValueOnce({ items: [prod("p2", "Banana")], nextCursor: null });

    const store = makeStore();
    const { result } = renderHook(() => useProductManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.ensureLoaded();
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.nextCursor).toBe("abc");

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(result.current.nextCursor).toBeNull();

    // No cursor -> no-op.
    await act(async () => {
      await result.current.loadMore();
    });
    expect(mockApi.listProducts).toHaveBeenCalledTimes(2);
  });

  it("fetchOne serves from cache when present", async () => {
    mockApi.listProducts.mockResolvedValue({
      items: [prod("p1", "Apple")],
      nextCursor: null,
    });

    const store = makeStore();
    const { result } = renderHook(() => useProductManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.ensureLoaded();
    });

    let fetched;
    await act(async () => {
      fetched = await result.current.fetchOne("p1");
    });
    expect(fetched).toEqual(prod("p1", "Apple"));
    expect(mockApi.getProduct).not.toHaveBeenCalled();
  });

  it("fetchOne falls back to API on cache miss", async () => {
    const store = makeStore();
    mockApi.getProduct.mockResolvedValue(prod("p9", "Pear"));

    const { result } = renderHook(() => useProductManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.fetchOne("p9");
    });
    expect(mockApi.getProduct).toHaveBeenCalledWith("p9");
    expect(result.current.items.find((p) => p.id === "p9")).toBeDefined();
  });

  it("create/update/remove keep the cache consistent", async () => {
    const store = makeStore();
    mockApi.createProduct.mockResolvedValue(prod("p1", "Apple"));
    mockApi.updateProduct.mockResolvedValue(prod("p1", "Green Apple"));
    mockApi.deleteProduct.mockResolvedValue(undefined);

    const { result } = renderHook(() => useProductManager(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.create({ name: "Apple", categoryId: "c1" });
    });
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await result.current.update("p1", { name: "Green Apple" });
    });
    expect(result.current.items[0].name).toBe("Green Apple");

    await act(async () => {
      await result.current.remove("p1");
    });
    expect(result.current.items).toHaveLength(0);
  });
});
