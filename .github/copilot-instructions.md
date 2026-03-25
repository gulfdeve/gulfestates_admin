# Gulf Estates Admin Dashboard — Copilot Instructions

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build (lint is skipped intentionally)
npm run start      # Start prod server via Next.js
node server.js     # Start prod server via custom HTTP server (Namecheap hosting)
npm run lint       # Run ESLint
```

There are no automated tests in this project.

## Architecture

This is a **Next.js 15 App Router** admin dashboard for the Gulf Estates real estate platform, backed by a separate Express/Node API at `https://backend.gulfestates.ae`.

### Routing

Content routes are **triplicated** under language-prefix directories:

```
app/
  en/properties/add-new/page.tsx   # English
  es/properties/add-new/page.tsx   # Spanish
  fr/properties/add-new/page.tsx   # French
  (auth)/admin/login/              # Auth routes (no layout)
  clients/                         # Non-localized admin routes
  dashboard/                       # Non-localized admin routes
  settings/                        # Non-localized admin routes
  marketing/                       # Non-localized admin routes
```

Language-specific page files pass a `lang` prop (`"en" | "es" | "fr"`) to the shared form components. UI string translations live in `data/translations.ts`.

### Authentication & Authorization

Two-layer system:

1. **`ProtectedLayout`** (`components/layout/ProtectedLayout.tsx`): wraps every page (except `/admin/login`). Validates JWT on every route change by calling `/api/auth/me`. Redirects to `/admin/login` if invalid.

2. **`AuthProvider`** / **`useAuth`** (`contexts/AuthContext.tsx`): provides `user`, `role`, `isAuthenticated`, and `checkAccess`. Initializes from `localStorage` first, then syncs with the API.

JWT (`adminToken`) and user object (`adminUser`) are stored in **`localStorage`**. All authenticated API calls attach `Authorization: Bearer <token>`.

Roles (from most to least privileged): `superadmin` → `admin` → `customer-manager` → `user`. Access rules are defined in `utils/routeProtection.ts`.

3. **`RouteGuard`** (`components/auth/RouteGuard.tsx`): wrap any sensitive page's JSX in `<RouteGuard>` to enforce role-based access with an inline "Access Denied" UI.

### API Calls

`next.config.mjs` proxies all `/api/*` requests to the backend, bypassing CORS:

```
/api/:path* → https://backend.gulfestates.ae/api/:path*
```

Client-side code reads `process.env.NEXT_PUBLIC_API_URL` for the base URL, then appends `/api/...`. On production `NEXT_PUBLIC_API_URL` is empty (making URLs relative so the Next.js proxy handles them). On localhost set it to `http://localhost:5000`.

### Component Structure

```
components/
  auth/          # RouteGuard, AuthGuard
  common/        # LoadingSpinner, DeleteConfirmModal
  layout/        # Navbar, Sidebar, ProtectedLayout
  properties/    # PropertyForm sub-sections (BasicInformation, PricingAndDetails, SeoSection, etc.)
  blogs/         # BlogTable, TagInput
  pages/         # PageContentForm, PagesContentTable
  clients/       # Client-facing data tables
  ...            # Other domain folders mirror app/ sections
```

## Key Conventions

### Forms

- Complex multi-section forms (e.g., AddPropertyForm) use **`react-hook-form`**.
- Simpler single-page forms (e.g., CreateBlog) use plain `useState`.
- Forms that support multilingual content include fields named with suffixes: `propertyTitle`, `propertyTitle_es`, `propertyTitle_fr`.

### Rich Text Editing

JoditEditor is always loaded with **dynamic import and `ssr: false`**:

```ts
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });
```

All HTML coming from the editor or the API must be sanitized before rendering using `sanitizeHtml` or `cleanHtmlContent` from `@/utils/htmlCleaner.ts` (DOMPurify-based).

### File Uploads

- All client-side file validation goes through `@/utils/fileValidation.ts` before any upload.
- Key limits: main image 1 MB, additional images 20 files / 15 MB total, documents (PDF) 15 MB.
- Images are uploaded to Cloudinary via the backend endpoint `POST /api/upload/image`; the returned URL is stored, not the raw file.

### Toasts / Notifications

All user-facing feedback uses **`sonner`**:

```ts
import { toast } from "sonner";
toast.success("Done!"); // or toast.error(...)
```

`<Toaster>` is mounted once in `app/layout.tsx`.

### Styling

Tailwind CSS v4 (PostCSS plugin, not the old `tailwind.config.js` approach). Primary colour is referenced as `bg-primary`/`text-primary` via CSS variable. Scrollable areas use the `custom-scrollbar` utility class.

### Custom Production Server

`server.js` is the entry point for Namecheap hosting. It always runs Next.js in production mode (`dev: false`). Do not change this flag.
