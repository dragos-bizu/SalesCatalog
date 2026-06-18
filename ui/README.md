# ui/

The React + Vite single-page application for SalesCatalog.

Mobile-first, designed to feel like a native app on a phone while remaining a regular responsive web app on desktop.

## Architecture

Clean Architecture with a Manager pattern, organised roughly as:

```
ui/
├── public/
├── src/
│   ├── app/             # App entry, routing, providers
│   ├── pages/           # Route-level components (ProductList, ProductDetail, AdminProducts, ...)
│   ├── components/      # Reusable presentational components
│   ├── managers/        # Business-logic orchestrators (ProductManager, CategoryManager, AuthManager, ...)
│   ├── services/        # Thin HTTP / SDK clients (api.ts, cognito.ts, s3upload.ts)
│   ├── domain/          # Domain models and types (Product, Category)
│   ├── hooks/           # React hooks
│   ├── styles/          # Global styles / theme
│   └── utils/           # Small pure helpers
├── index.html
├── package.json
├── vite.config.ts
└── .env.example
```

### Layer responsibilities

- **services/** — only know how to talk to a remote system (HTTP request, S3 PUT, Cognito Hosted UI). No business logic.
- **managers/** — orchestrate one or more services, handle caching/state, expose a clean API to the UI layer.
- **pages/components/** — only render UI and call managers. No direct HTTP calls.
- **domain/** — pure TypeScript types and value objects shared across all layers.

This keeps UI components easy to test and the data flow predictable.

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

Unit tests use **Jest** + **React Testing Library**. Tests live next to the file they cover, named `*.test.ts` / `*.test.tsx`.

```bash
npm run test
```

## Authentication flow

1. Admin clicks **Sign in** → redirected to the Cognito Hosted UI.
2. Admin chooses **Continue with Google** → completes Google OAuth.
3. Cognito redirects back to `VITE_COGNITO_REDIRECT_URI` with tokens.
4. The app stores the JWT (in memory; refresh tokens via Cognito) and attaches `Authorization: Bearer <id_token>` to admin API calls.
5. Public pages do **not** require any token.

## Image uploads (admin)

1. UI calls `POST /admin/images/upload-url` → receives `{ uploadUrl, key }`.
2. UI performs `fetch(uploadUrl, { method: 'PUT', body: file })` directly to S3.
3. UI calls `POST /products` (or `PUT /products/{id}`) including the returned `key` in the `images` array.
4. Public users see the image at `${VITE_IMAGES_BASE_URL}/${key}`.
