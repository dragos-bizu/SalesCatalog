import { compressImage, compressImages } from "./imageCompression";

function fakeFile(name: string, type: string, size = 1024): File {
  const file = new File(["x"], name, { type });
  // jsdom File doesn't let us set size directly; emulate it.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("compressImage", () => {
  it("returns non-image files unchanged", async () => {
    const f = fakeFile("a.pdf", "application/pdf", 5_000_000);
    expect(await compressImage(f)).toBe(f);
  });

  it("returns gif files unchanged (preserve animation)", async () => {
    const f = fakeFile("a.gif", "image/gif", 5_000_000);
    expect(await compressImage(f)).toBe(f);
  });

  it("skips small images below the threshold", async () => {
    const f = fakeFile("small.jpg", "image/jpeg", 1024);
    expect(await compressImage(f)).toBe(f);
  });

  it("falls back to original when browser canvas APIs are unavailable", async () => {
    // jsdom has no createImageBitmap, so compression is not supported.
    const f = fakeFile("big.jpg", "image/jpeg", 5_000_000);
    expect(await compressImage(f)).toBe(f);
  });

  it("compressImages maps files best-effort", async () => {
    const files = [
      fakeFile("a.jpg", "image/jpeg", 5_000_000),
      fakeFile("b.png", "image/png", 5_000_000),
    ];
    const out = await compressImages(files);
    expect(out).toHaveLength(2);
    // Fallback in jsdom -> originals preserved.
    expect(out[0]).toBe(files[0]);
    expect(out[1]).toBe(files[1]);
  });
});
