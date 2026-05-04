# ShaadiHub — Karachi Wedding Marketplace

## Overview
A full-stack multi-vendor wedding marketplace for Karachi, Pakistan. Couples browse and book verified vendors (catering, photography, halls, decor, etc.). Vendors manage their listings and bookings. Admins moderate the platform.

## Architecture

### Monorepo Structure
```
artifacts/
  shaadihub/       — React + Vite frontend (TypeScript, shadcn/ui, wouter)
  api-server/      — Express 5 backend (TypeScript, Drizzle ORM, JWT)
lib/
  db/              — PostgreSQL schema + migrations (Drizzle)
  api-spec/        — OpenAPI spec + codegen config
  api-zod/         — Generated Zod schemas from OpenAPI
  api-client-react/ — Generated React Query hooks (Orval)
```

### Routing
- `/` → ShaadiHub frontend (Vite dev server)
- `/api` → API Server (Express, port 8080)

## Frontend Pages
- **Home** — Full landing page: hero with image collage + floating cards, search bar, social proof, stats bar, live featured vendors (API), browse-by-category grid, how-it-works, trust strip, testimonials, CTA band
- **Vendor Listing** — Filter sidebar (category/area/price/rating), search, pagination
- **Vendor Profile** — Image gallery, packages, reviews, booking modal, WhatsApp link
- **Login / Register** — JWT auth, role toggle (user/vendor)
- **User Dashboard** — Favorites, bookings status, wedding checklist (localStorage)
- **Vendor Dashboard** — Profile edit, portfolio upload, package CRUD, booking approval
- **Admin Panel** — Stats, vendor moderation (approve/feature/suspend/delete), user block

## Backend Routes (all under /api)
- `POST /auth/register` — creates user (+ vendor profile if role=vendor)
- `POST /auth/login` — returns JWT
- `GET/PUT /vendors` — list & update vendors with filters
- `GET /vendors/:id` — vendor detail with images, packages
- `GET /vendors/me/profile` — authenticated vendor's own profile
- `POST /vendors/:id/images` — Cloudinary or base64 image upload
- `DELETE /vendors/:id/images/:imageId`
- `POST/PUT/DELETE /vendors/:id/packages`
- `GET /vendors/:id/reviews` — list reviews
- `POST /vendors/:id/reviews` — create review (users only)
- `GET/POST /bookings` — user creates booking, vendor approves
- `PATCH /bookings/:id/status` — vendor/admin update status
- `GET /users/me` — authenticated user profile
- `GET/POST /users/favorites` — toggle favorites
- `GET /admin/stats` — platform stats
- `GET /admin/vendors` — all vendors (admin)
- `GET /admin/users` — all users (admin)
- `POST /admin/vendors/:id/approve|suspend|feature` — moderation
- `DELETE /admin/vendors/:id`
- `POST /admin/users/:id/block`

## Database Schema (PostgreSQL via Drizzle)
- **users** — id, name, email, password_hash, role (user/vendor/admin), phone, avatar_url, is_active, is_blocked
- **vendors** — id, user_id, category, title, description, location, area, city, lat/lng, price_range, capacity, whatsapp, cover_image_url, verified, is_featured, is_suspended, rating, total_reviews, profile_views
- **vendor_images** — id, vendor_id, image_url, public_id, is_cover
- **packages** — id, vendor_id, name, description, price, features (JSON array), is_popular
- **reviews** — id, vendor_id, user_id, rating, comment, created_at
- **bookings** — id, vendor_id, user_id, package_id, status, event_date, guest_count, notes, total_amount
- **favorites** — user_id, vendor_id (composite PK)
- **subscriptions** — vendor_id, plan, status, expires_at

## Auth
- JWT (jose library) stored in localStorage as `shaadihub_token`
- `setAuthTokenGetter` wires JWT into all generated API hooks
- Roles: user, vendor, admin
- Passwords hashed with bcryptjs

## Demo Credentials (password: shaadihub2024)
- Admin: admin@shaadihub.com
- User: ayesha@example.com
- Vendors: ahmed@example.com, sunrise@example.com, royal@example.com, bloom@example.com, nadia@example.com, elite@example.com

## Key Dependencies
**Frontend:** react, vite, typescript, wouter, @tanstack/react-query, shadcn/ui, tailwindcss, lucide-react, @workspace/api-client-react
**Backend:** express 5, drizzle-orm, pg, jose, bcryptjs, multer, cloudinary, pino
**Shared:** @workspace/db, @workspace/api-zod

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — JWT signing secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional for image uploads (falls back to base64)
