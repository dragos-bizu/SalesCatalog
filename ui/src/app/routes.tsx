import { createBrowserRouter } from "react-router-dom";
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

/**
 * Application route map.
 *
 * Public routes are siblings of admin routes inside a single Layout. Admin
 * routes are wrapped in RequireAuth, which redirects to /login when no
 * Cognito session exists.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // --- Public ---
      { index: true, element: <HomePage /> },
      { path: "products/:id", element: <ProductDetailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "auth/callback", element: <AuthCallbackPage /> },

      // --- Admin (auth-gated) ---
      {
        path: "admin",
        element: (
          <RequireAuth>
            <AdminProductsPage />
          </RequireAuth>
        ),
      },
      {
        path: "admin/products/new",
        element: (
          <RequireAuth>
            <AdminProductFormPage />
          </RequireAuth>
        ),
      },
      {
        path: "admin/products/:id/edit",
        element: (
          <RequireAuth>
            <AdminProductFormPage />
          </RequireAuth>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <RequireAuth>
            <AdminCategoriesPage />
          </RequireAuth>
        ),
      },

      // --- 404 ---
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
