import reducer, {
  selectEmail,
  selectIdToken,
  selectIsAuthenticated,
  signedOut,
  tokensSet,
} from "./authSlice";
import type { RootState } from "./store";

// Header.payload.signature with payload = base64url({ "email": "a@b.com" }).
const FAKE_ID_TOKEN = "h." + btoa('{"email":"a@b.com"}') + ".s";

describe("authSlice", () => {
  beforeEach(() => localStorage.clear());

  it("starts with no tokens", () => {
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state.idToken).toBeNull();
    expect(state.expiresAt).toBeNull();
  });

  it("stores tokens and derives email", () => {
    const expiresAt = Date.now() + 3600_000;
    const state = reducer(
      undefined,
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "atk",
        refreshToken: "rtk",
        expiresAt,
      }),
    );
    expect(state.idToken).toBe(FAKE_ID_TOKEN);
    expect(state.refreshToken).toBe("rtk");
    expect(state.expiresAt).toBe(expiresAt);
    expect(state.email).toBe("a@b.com");
  });

  it("preserves the previous refresh token on a silent refresh", () => {
    const first = reducer(
      undefined,
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "atk",
        refreshToken: "rtk-original",
        expiresAt: Date.now() + 3600_000,
      }),
    );
    const second = reducer(
      first,
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "atk2",
        refreshToken: null, // refresh response often omits this
        expiresAt: Date.now() + 7200_000,
      }),
    );
    expect(second.refreshToken).toBe("rtk-original");
    expect(second.accessToken).toBe("atk2");
  });

  it("signedOut clears everything", () => {
    const populated = reducer(
      undefined,
      tokensSet({
        idToken: FAKE_ID_TOKEN,
        accessToken: "atk",
        refreshToken: "rtk",
        expiresAt: Date.now() + 1000,
      }),
    );
    const cleared = reducer(populated, signedOut());
    expect(cleared.idToken).toBeNull();
    expect(cleared.refreshToken).toBeNull();
    expect(cleared.email).toBeNull();
  });

  describe("selectors", () => {
    function makeState(auth: Partial<RootState["auth"]>): RootState {
      return {
        auth: {
          idToken: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          email: null,
          ...auth,
        },
      } as RootState;
    }

    it("isAuthenticated requires a token and a future expiry", () => {
      expect(selectIsAuthenticated(makeState({}))).toBe(false);
      expect(
        selectIsAuthenticated(
          makeState({ idToken: "x", expiresAt: Date.now() - 1000 }),
        ),
      ).toBe(false);
      expect(
        selectIsAuthenticated(
          makeState({ idToken: "x", expiresAt: Date.now() + 60_000 }),
        ),
      ).toBe(true);
    });

    it("selectIdToken / selectEmail", () => {
      const s = makeState({ idToken: "tk", email: "a@b.com" });
      expect(selectIdToken(s)).toBe("tk");
      expect(selectEmail(s)).toBe("a@b.com");
    });
  });
});
