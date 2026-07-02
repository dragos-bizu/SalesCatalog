import { uploadImages } from "./ImageManager";
import { api } from "../services/api";

jest.mock("../services/api");
const mockApi = api as jest.Mocked<typeof api>;

function fakeFile(name: string, type: string, size = 1): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("uploadImages", () => {
  afterEach(() => {
    jest.resetAllMocks();
    // @ts-expect-error reset
    delete global.fetch;
  });

  it("no-ops on empty array", async () => {
    const result = await uploadImages([]);
    expect(result).toEqual([]);
    expect(mockApi.createImageUploadUrls).not.toHaveBeenCalled();
  });

  it("requests presigned URLs, PUTs each file, returns key+publicUrl", async () => {
    mockApi.createImageUploadUrls.mockResolvedValue({
      uploads: [
        {
          uploadUrl: "https://s3/u1",
          key: "products/a.jpg",
          publicUrl: "https://cdn/products/a.jpg",
          contentType: "image/jpeg",
        },
        {
          uploadUrl: "https://s3/u2",
          key: "products/b.png",
          publicUrl: "https://cdn/products/b.png",
          contentType: "image/png",
        },
      ],
    });

    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await uploadImages([
      fakeFile("a.jpg", "image/jpeg"),
      fakeFile("b.png", "image/png"),
    ]);

    expect(mockApi.createImageUploadUrls).toHaveBeenCalledWith([
      { contentType: "image/jpeg", size: 1 },
      { contentType: "image/png", size: 1 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall[0]).toBe("https://s3/u1");
    expect(firstCall[1].method).toBe("PUT");
    expect(firstCall[1].headers["Content-Type"]).toBe("image/jpeg");

    expect(result).toEqual([
      { key: "products/a.jpg", publicUrl: "https://cdn/products/a.jpg" },
      { key: "products/b.png", publicUrl: "https://cdn/products/b.png" },
    ]);
  });

  it("rejects files above the upload size limit", async () => {
    const big = fakeFile("huge.jpg", "image/jpeg", 6 * 1024 * 1024);
    await expect(uploadImages([big])).rejects.toThrow(/exceeds the 5 MB upload limit/);
    expect(mockApi.createImageUploadUrls).not.toHaveBeenCalled();
  });

  it("throws when a PUT fails", async () => {
    mockApi.createImageUploadUrls.mockResolvedValue({
      uploads: [
        {
          uploadUrl: "https://s3/u1",
          key: "products/a.jpg",
          publicUrl: "https://cdn/products/a.jpg",
          contentType: "image/jpeg",
        },
      ],
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 403 }) as unknown as typeof fetch;

    await expect(
      uploadImages([fakeFile("a.jpg", "image/jpeg")]),
    ).rejects.toThrow("S3 upload failed (403)");
  });
});
