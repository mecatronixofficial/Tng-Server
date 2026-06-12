# Backend — Thangavel Textile API

Standalone NestJS API serving the Thangavel Textile storefront and admin panel.

This is one half of a two-app project. See the **top-level [README.md](../README.md)** for the full guide.

## TL;DR

```bash
cp .env.example .env                  # then edit — set MONGODB_URI at minimum
npm install
npm run start:dev                     # → http://localhost:4000/api/v1
npm run seed                          # one-time: populate DB with the 19 seed products + content
```

Swagger docs: `http://localhost:4000/api/docs`.

## What's inside

- JWT auth (`/auth/login`, `/auth/me`)
- Full CRUD for products, categories, blogs, banners, offers, testimonials, orders
- Server-side Cloudinary image upload endpoint
- Aggregated dashboard stats for the admin panel
- Auto-creates an initial admin user on first boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars
- Rate limiting, Helmet, CORS allow-list, global validation, unified error format

## Scripts

```bash
npm run start:dev      # Watch mode
npm run build          # Compile TS → dist/
npm run start:prod     # Run compiled output
npm run seed           # Reset and reseed the database (drops collections except users)
npm run lint
```

See the top-level README for environment variables, MongoDB Atlas setup, and the full API surface.
