// Tests the route map by rendering it via MemoryRouter at different URLs.
//
// We don't reuse the production `router` (createBrowserRouter) here because
// the data-router API requires Fetch globals at module init, which jsdom
// doesn't provide. The component->path mapping under test is identical.

import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer from "../store/authSlice";
import productsReducer from "../store/productsSlice";
import categoriesReducer from "../store/categoriesSlice";
import { Layout } from "../components/Layout";
import { RequireAuth } from "../components/RequireAuth";
import { HomePage } from "../pages/HomePage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { LoginPage } from "../pages/LoginPage";
import { AuthCallbackPage } from "../pages/AuthCallbackPage";
import { AdminProductsPage } from "../pages/AdminProductsPage";
import { AdminProductFormPage } from "../pages/AdminProductFormPage";
import { AdminCategoriesPage } from "../pages/AdminCategoriesPage";
import { NotFoundPage } from "../pages/NotFoundPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="admin"
          element={
            <RequireAuth>
              <AdminProductsPage />
            </RequireAuth>
          }
        />
        <Route
          path="admin/products/new"
          element={
            <RequireAuth>
              <AdminProductFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="admin/products/:id/edit"
          element={
            <RequireAuth>
              <AdminProductFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="admin/categories"
          element={
            <RequireAuth>
              <AdminCategoriesPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function renderAt(initial: string) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      products: productsReducer,
      categories: categoriesReducer,
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initial]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
}

describe("router", () => {
  it("renders the home page at /", () => {
    renderAt("/");
    expect(screen.getByText(/public catalog/i)).toBeInTheDocument();
  });

  it("renders the product detail page with the URL id", () => {
    renderAt("/products/abc-123");
    expect(screen.getByText(/product detail/i)).toBeInTheDocument();
    expect(screen.getByText("abc-123")).toBeInTheDocument();
  });

  it("renders the login page", () => {
    renderAt("/login");
    expect(screen.getByText(/admin sign in/i)).toBeInTheDocument();
  });

  it("renders the auth callback page", async () => {
    // No ?code= present -> async useEffect transitions to the error path.
    renderAt("/auth/callback?");
    await waitFor(() => {
      expect(screen.getByText(/sign-in failed/i)).toBeInTheDocument();
    });
  });

  it("redirects unauthenticated users from /admin to /login", () => {
    renderAt("/admin");
    expect(screen.getByText(/admin sign in/i)).toBeInTheDocument();
  });

  it("redirects unauthenticated users from /admin/products/new to /login", () => {
    renderAt("/admin/products/new");
    expect(screen.getByText(/admin sign in/i)).toBeInTheDocument();
  });

  it("renders the 404 page for unknown URLs", () => {
    renderAt("/this/does/not/exist");
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
