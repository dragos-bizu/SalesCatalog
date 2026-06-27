import { createChallenge, createVerifier } from "./pkce";

describe("PKCE helpers", () => {
  it("createVerifier returns high-entropy base64url strings of valid length", () => {
    const v = createVerifier();
    expect(v.length).toBeGreaterThanOrEqual(43);
    expect(v.length).toBeLessThanOrEqual(128);
    // No padding, no +/ characters.
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
    // Two calls give different values.
    expect(v).not.toBe(createVerifier());
  });

  it("createChallenge derives a base64url SHA-256 of the verifier", async () => {
    const v = "test-verifier";
    const c = await createChallenge(v);
    expect(c).toMatch(/^[A-Za-z0-9_-]+$/);
    // SHA-256 -> 32 bytes -> 43 base64url chars without padding.
    expect(c).toHaveLength(43);
    // Deterministic for the same verifier.
    expect(await createChallenge(v)).toBe(c);
  });
});
