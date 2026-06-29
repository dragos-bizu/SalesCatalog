# ui/

The React + Vite single-page application for SalesCatalog.

Mobile-first, designed to feel like a native app on a phone while remaining a regular responsive web app on desktop.

## Tech stack

| Concern        | Choice                                                |
| -------------- | ----------------------------------------------------- |
| Build/dev      | Vite                                                  |
| Language       | TypeScript                                            |
| UI components  | **Material UI (MUI)** — components **and** styling    |
| Styling        | MUI `sx` prop + MUI theme (no Tailwind, no CSS files) |
| State / cache  | **Redux Toolkit** (plain slices)                      |
| Routing        | React Router                                          |
| Tests          | **Jest** + React Testing Library                      |
| Auth           | Cognito Hosted UI (authorization code + PKCE)         |

### State management

Redux Toolkit holds fetched **products** and **categories** in the store so
navigating between pages does not re-trigger API calls. Managers decide when a
fetch is needed (e.g. cache empty or explicitly refreshed) and otherwise serve
data straight from the store. There is also a small slice for auth/session and
transient UI state.

## Architecture

Clean Architecture with a Manager pattern, organised roughly as:

```
ui/
├── public/
├── src/
│   ├── app/             # App entry, routing, providers, MUI theme provider
│   ├── store/           # Redux Toolkit store + slices (products, categories, auth, ui)
│   ├── pages/           # Route-level components (ProductList, ProductDetail, AdminProducts, ...)
│   ├── components/      # Reusable presentational components (single responsibility)
│   ├── managers/        # Business-logic orchestrators (ProductManager, CategoryManager, AuthManager, ...)
│   ├── services/        # Thin HTTP / SDK clients (api.ts, cognito.ts, s3upload.ts)
│   ├── domain/          # Domain models and types (Product, Category)
│   ├── hooks/           # React hooks (incl. typed useAppDispatch/useAppSelector)
│   ├── theme/           # MUI theme definition
│   └── utils/           # Small pure helpers
├── index.html
├── package.json
├── vite.config.ts
└── .env.example
```

### Layer responsibilities

- **services/** — only know how to talk to a remote system (HTTP request, S3 PUT, Cognito Hosted UI). No business logic.
- **store/** — Redux Toolkit slices holding cached server data and app state. The single source of truth the UI reads from.
- **managers/** — orchestrate services + store: decide whether to read from cache or fetch, dispatch the results into the store, and expose a clean API (usually via hooks) to the UI layer.
- **pages/components/** — only render UI and call managers/selectors. No direct HTTP calls. Each component has a single responsibility.
- **domain/** — pure TypeScript types and value objects shared across all layers.

This keeps UI components easy to test and the data flow predictable.

### How API calls are limited

A component asks a Manager for data → the Manager checks the Redux store →
if the data is already cached, it is returned without a network call; only on
a cache miss (or an explicit refresh / after a mutation) does the Manager call
the API service and store the result. Mutations (create/update/delete) update
the store so lists stay consistent without a full refetch.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build locally
npm run lint     # run eslint
npm run test     # run Jest unit tests
```

## Environment variables

The app reads its runtime configuration from Vite environment variables (prefixed `VITE_`). Copy `.env.example` to `.env` and fill in the values:

| Variable                      | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| `VITE_API_BASE_URL`           | Base URL of the deployed API Gateway.                   |
| `VITE_IMAGES_BASE_URL`        | Base URL of the images CloudFront distribution.         |
| `VITE_COGNITO_DOMAIN`         | Cognito Hosted UI domain.                               |
| `VITE_COGNITO_CLIENT_ID`      | Cognito User Pool Client ID.                            |
| `VITE_COGNITO_REDIRECT_URI`   | Redirect URI registered in the Cognito app client.      |
| `VITE_COGNITO_LOGOUT_URI`     | Logout redirect URI.                                    |

The actual values come from the SAM stack outputs after deployment.

## Tests

Unit tests use **Jest** + **React Testing Library** (jsdom environment). Tests
live next to the file they cover, named `*.test.ts` / `*.test.tsx`. Redux
slices and Managers are tested in isolation; components are tested by rendering
with a test store provider.

```bash
npm run test
```

## Authentication flow

1. Admin clicks **Sign in** → redirected to the Cognito Hosted UI.
2. Admin chooses **Continue with Google** → completes Google OAuth.
3. Cognito redirects back to `VITE_COGNITO_REDIRECT_URI` with tokens.
4. The app stores the JWT (in memory; refresh tokens via Cognito) and attaches `Authorization: Bearer <id_token>` to admin API calls.
5. Admin pages/actions require membership in the configured Cognito group (`VITE_ADMIN_GROUP`, default `admins`).
6. Public pages do **not** require any token.

## Image uploads (admin)

1. UI calls `POST /admin/images/upload-url` → receives `{ uploadUrl, key }`.
2. UI performs `fetch(uploadUrl, { method: 'PUT', body: file })` directly to S3.
3. UI calls `POST /products` (or `PUT /products/{id}`) including the returned `key` in the `images` array.
4. Public users see the image at `${VITE_IMAGES_BASE_URL}/${key}`.
