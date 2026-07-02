import { api, ApiError, setTokenProvider } from "./api";

function mockFetch(status: number, body: unknown) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  });
}

describe("api service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    setTokenProvider(() => null);
  });

  it("lists products and builds query string", async () => {
    const fetchMock = mockFetch(200, { items: [], nextCursor: null });
    global.fetch = fetchMock as unknown as typeof fetch;

    await api.listProducts({ q: "apple", categoryId: "c1", limit: 10 });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/products?");
    expect(url).toContain("q=apple");
    expect(url).toContain("categoryId=c1");
    expect(url).toContain("limit=10");
  });

  it("omits empty query params", async () => {
    const fetchMock = mockFetch(200, { items: [], nextCursor: null });
    global.fetch = fetchMock as unknown as typeof fetch;

    await api.listProducts({});
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url.endsWith("/products")).toBe(true);
  });

  it("adds Authorization header for admin calls when token present", async () => {
    const fetchMock = mockFetch(201, { id: "p1" });
    global.fetch = fetchMock as unknown as typeof fetch;
    setTokenProvider(() => "tok123");

    await api.createProduct({ name: "Apple", categoryId: "c1" });

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["Authorization"]).toBe("Bearer tok123");
    expect(init.method).toBe("POST");
  });

  it("throws ApiError with message on non-2xx", async () => {
    const fetchMock = mockFetch(404, { message: "Product not found" });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(api.getProduct("ghost")).rejects.toThrow(ApiError);
    await expect(api.getProduct("ghost")).rejects.toThrow("Product not found");
  });

  it("awaits an async token provider before sending", async () => {
    const fetchMock = mockFetch(201, { id: "p1" });
    global.fetch = fetchMock as unknown as typeof fetch;
    setTokenProvider(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return "refreshed-token";
    });

    await api.createProduct({ name: "Apple", categoryId: "c1" });

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["Authorization"]).toBe("Bearer refreshed-token");
  });

  it("omits Authorization when async provider returns null", async () => {
    const fetchMock = mockFetch(401, { message: "Unauthorized" });
    global.fetch = fetchMock as unknown as typeof fetch;
    setTokenProvider(async () => null);

    await expect(
      api.createProduct({ name: "X", categoryId: "c1" }),
    ).rejects.toThrow(ApiError);

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["Authorization"]).toBeUndefined();
  });

  it("returns undefined for 204 responses", async () => {
    const fetchMock = mockFetch(204, undefined);
    global.fetch = fetchMock as unknown as typeof fetch;
    setTokenProvider(() => "tok");

    await expect(api.deleteProduct("p1")).resolves.toBeUndefined();
  });

  it("sends content type and size in files payload", async () => {
    const fetchMock = mockFetch(200, { uploads: [] });
    global.fetch = fetchMock as unknown as typeof fetch;
    setTokenProvider(() => "tok");

    await api.createImageUploadUrls([
      { contentType: "image/jpeg", size: 1024 },
      { contentType: "image/png", size: 2048 },
    ]);
    const init = fetchMock.mock.calls[0][1];
    expect(JSON.parse(init.body)).toEqual({
      files: [
        { contentType: "image/jpeg", size: 1024 },
        { contentType: "image/png", size: 2048 },
      ],
    });
  });
});
