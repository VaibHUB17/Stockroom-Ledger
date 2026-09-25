# Stockroom Ledger — Product Admin Dashboard

A lightweight, typographically focused product inventory dashboard built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Axios**, querying the [DummyJSON API](https://dummyjson.com).

Designed with the **Stockroom Ledger** aesthetic: IBM Plex typography, crisp hairline borders, high-contrast badges, tabular figures, and zero third-party UI/table/query libraries.

---

## Getting Started

### Prerequisites
- Node.js 18.18+ (tested on Node.js 24)
- npm 9+

### Installation & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build and run production server:**
   ```bash
   npm run build
   npm run start
   ```

---

## Demo Credentials

- **Username**: `emilys`
- **Password**: `emilyspass`
- **Endpoint**: `POST https://dummyjson.com/auth/login`

A one-click **"Fill demo credentials"** button is provided on the login page for instant sign-in.

---

## Requirements Checklist (Assessment Verification)

| Requirement Category | Specification in PDF | Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **Login Page** | `POST /auth/login` with `emilys` / `emilyspass` | Complete | Handled via `src/lib/api/auth.ts` and `src/app/login/page.tsx`. |
| | One-click demo credentials fill button | Complete | `#fill-demo-credentials` button on the login form. |
| | Show errors for wrong details | Complete | Accessible `role="alert"` inline error messages. |
| | Only logged-in users can open product pages | Complete | Protected by route proxy (`src/proxy.ts`). |
| | Add a logout button | Complete | Header button calling `clearSession()` and redirecting to `/login`. |
| **Product List** | Show image, title, category, price, rating, stock | Complete | Rendered in desktop table (`ProductTable.tsx`) and mobile cards (`ProductCard.tsx`). |
| | Use a table on desktop and cards on mobile | Complete | Breakpoint-based layout switching at `md` (`768px`). |
| **Pagination** | Load data page by page using `limit` and `skip` | Complete | Calculated as `skip = (page - 1) * limit` in `src/lib/api/products.ts`. |
| | Show page numbers, Previous/Next buttons | Complete | Smart page windowing with ellipsis in `Pagination.tsx`. |
| | Page size options (10, 20, 50) | Complete | Dropdown selector updating `limit` query param in URL. |
| | Text like "Showing 21–40 of 194" | Complete | Formatted as `Showing {start}–{end} of {total}` with tabular figures. |
| **Search** | Search products with `/products/search?q=` | Complete | Typed search querying `/products/search` endpoint. |
| | Debounce typing before calling API | Complete | Custom `useDebouncedValue` hook with 350ms delay. |
| | Go back to page 1 when search changes | Complete | Reset page to 1 automatically in URL state updater. |
| **Filter & Sort** | Filter by category (`/products/categories`) | Complete | Loaded dynamically via `getCategories()` into dropdown. |
| | Sort by price, rating, or title (asc/desc) | Complete | Controlled sort dropdown supporting all permutations. |
| **Product Details** | Page at `/products/[id]` | Complete | App Router dynamic route at `src/app/products/[id]/page.tsx`. |
| | Show images, description, price, and reviews | Complete | Interactive image gallery, specs grid, and customer review cards. |
| | Show "not found" page for wrong ID | Complete | Custom `not-found.tsx` rendering when product ID is invalid. |
| **Add, Edit, Delete**| Form with validation to add or edit product | Complete | Native `<dialog>` modal with price, stock, category validation. |
| | Confirm popup before deleting | Complete | Native confirmation modal with cancel button focused first. |
| **States** | Loader while loading | Complete | Skeletons matching exact row and card heights. |
| | Message when nothing is found | Complete | Empty view with clear-filters action button. |
| | Retry button when something fails | Complete | Error view with friendly message and retry callback. |
| **Rules** | One shared Axios setup file | Complete | Single instance in `src/lib/http.ts` with token and error interceptors. |
| | Keep page, search, filter, sort in URL | Complete | Synced via `src/lib/url-state.ts`. Sharing URL restores exact state. |
| | No React Query, SWR, or ready-made table libs| Complete | All custom React hooks and native components. |
| | Small components, API calls in separate files| Complete | Clean modular separation in `src/components` and `src/lib/api`. |
| **Careful Edge Cases**| Race conditions: old search results never replace new | Complete | `AbortController` cancels previous requests on new inputs. |
| | Search & category mutual exclusivity handled | Complete | Search resets category; category selection clears search query. |
| | Mutations not saved by API handled | Complete | Client-side overlay in `src/lib/overlay.ts` persists to `localStorage`. |
| | Wrong URL values (`?page=abc`, `?page=999`) don't break | Complete | Sanitized: `page=abc` -> 1; `page=999` clamped to maximum valid page. |
| | Rapid clicking Save or Login sends 1 request | Complete | Handled via `useSubmitGuard` hook with synchronous ref lock. |

---

## Technical Decisions & Notes

### 1. Architectural Choices
- **Next.js 16 App Router & React 19**: Used the current App Router with server-rendered shells and focused client components for interactive tables, dialogs, and filters.
- **Single Shared Axios Client (`src/lib/http.ts`)**: All HTTP communication runs through one Axios instance configured with a 10-second timeout, JSON headers, and request/response interceptors. The request interceptor attaches the Bearer token from cookies/localStorage. The response interceptor normalizes error structures into user-friendly messages and handles 401 unauthenticated errors centrally.
- **No Third-Party Table or State Libraries**: Hand-rolled the pagination logic, debounce hook (`useDebouncedValue`), and URL state synchronizer. This keeps the bundle tiny and gives full control over how queries serialize to the address bar.
- **URL as Single Source of Truth (`src/lib/url-state.ts`)**: Page number, search query, category slug, sorting field, sorting direction, and page size are all tracked as URL search parameters (`?page=1&limit=10&sortBy=title&order=asc`). Sharing or refreshing the link restores the exact view. Invalid parameters like `?page=abc` fall back safely to page 1, and out-of-range pages like `?page=999` clamp to the maximum valid page once the total count is loaded.
- **Handling DummyJSON Constraints**:
  - *Search vs Category Mutual Exclusivity*: DummyJSON exposes separate endpoints for `/products/search?q=` and `/products/category/{cat}` but provides no endpoint that accepts both. Rather than faking client-side filtering over incomplete subsets, the UI enforces mutual exclusivity: typing in search clears the active category, and choosing a category clears the search query. A helper note in the toolbar explains this behavior clearly to the user.
  - *Non-Persistent Mutations*: DummyJSON simulates POST, PUT, and DELETE without storing records on the server. To give a realistic user experience where added, edited, or deleted items persist across page refreshes, a local overlay system (`src/lib/overlay.ts`) stores mutation diffs in `localStorage`. Local changes are merged cleanly into server responses, marked with a small "Local" badge, and accompanied by an honest transparency notice.
- **Double-Submit Prevention (`src/hooks/useSubmitGuard.ts`)**: Built a hook backed by a synchronous `useRef` flag. When the user rapidly clicks "Log in" or "Save product", the first click locks execution immediately; subsequent clicks within the same microtask are dropped before any network request is fired.
- **Search Race Condition Safety**: Used `AbortController` inside `useProductList`. When a user types quickly, previous pending requests are aborted before the new one fires, preventing old slow responses from overwriting fresh data.

### 2. One Problem Faced and How It Was Fixed
**The Problem**: DummyJSON does not persist mutations. When adding a new product via `POST /products/add`, the API returns a mock product with an ID, but subsequent `GET /products` requests do not include it. In an admin dashboard, if a user adds or edits an item and it disappears on page refresh, the application feels broken. Furthermore, naive client-side caching often leads to pagination discrepancies: if you simply append an item to the current page array, changing pages or adjusting page limits (`10`, `20`, `50`) loses track of the item or creates duplicate keys.

**The Solution**: Built a client-side mutation overlay (`src/lib/overlay.ts`) that persists to `localStorage`:
1. **Added Products**: Assigned high IDs starting at `10000` to prevent collisions with server IDs. These are prepended to page 1 results and counted toward the total pagination item count.
2. **Updated Products**: Stored as key-value property maps indexed by product ID. When the API returns a page containing that product, the local modifications are merged over the server record.
3. **Deleted Products**: Stored in a deleted IDs set. Any matching records returned by the API are filtered out.
4. **Transparency**: Added a subtle inline badge ("Local") next to locally created items and an honest notice below the toolbar stating: *"Saved in this browser only. The demo API does not store changes."*

### 3. Where AI Helped
- **Scaffolding TypeScript Type Definitions**: Generated initial schema interfaces from DummyJSON documentation (`Product`, `Review`, `ProductInput`).
- **End-to-End Test Scenarios**: Assisted in authoring a Puppeteer test suite to simulate edge cases like rapid 10-click submissions, debounced search, bad URL recovery, and viewport screenshots.
- **Layout and Spacing Verification**: Checked contrast ratios and spacing tokens across mobile (390px), tablet (768px), and desktop (1440px) breakpoints.

---

## Project Structure

```
product-admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with IBM Plex fonts & metadata
│   │   ├── page.tsx               # Root redirect to /products
│   │   ├── login/
│   │   │   └── page.tsx           # Login page with demo helper
│   │   └── products/
│   │       ├── page.tsx           # Main inventory catalog page
│   │       └── [id]/
│   │           ├── page.tsx       # Product detail page
│   │           └── not-found.tsx  # 404 page for missing products
│   ├── components/
│   │   ├── Navbar.tsx             # Top navigation with user badge & logout
│   │   ├── Toolbar.tsx            # Search, category, sort, limit, and add button
│   │   ├── ProductTable.tsx       # Desktop table with sticky header
│   │   ├── ProductCard.tsx        # Mobile card list
│   │   ├── Pagination.tsx         # Page controls and "Showing X-Y of Z"
│   │   ├── ProductFormDialog.tsx  # Add/edit native modal with validation
│   │   ├── ConfirmDialog.tsx      # Delete confirmation modal
│   │   ├── StockIndicator.tsx     # Color-coded stock pill badge
│   │   ├── StateViews.tsx         # Skeletons, empty state, and error retry state
│   │   ├── LocalNotice.tsx        # Transparency banner for local mutations
│   │   └── icons.tsx              # Clean SVG icons
│   ├── hooks/
│   │   ├── useDebouncedValue.ts   # Debounce timer hook
│   │   ├── useSubmitGuard.ts      # Rapid-click prevention hook
│   │   └── useProductList.ts      # Product fetching and cancel token hook
│   ├── lib/
│   │   ├── types.ts               # TypeScript data models
│   │   ├── http.ts                # Shared Axios client with interceptors
│   │   ├── auth-storage.ts        # Cookie & localStorage session helpers
│   │   ├── url-state.ts           # URL query parser, builder, and sanitizer
│   │   ├── overlay.ts             # Local mutation overlay engine
│   │   └── api/
│   │       ├── auth.ts            # Login API endpoint
│   │       ├── categories.ts      # Categories API endpoint
│   │       └── products.ts        # Products CRUD API endpoints
│   └── proxy.ts                   # Next.js 16 route guard proxy
├── README.md
└── package.json
```
