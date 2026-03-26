# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Prisma

```bash
npx prisma generate          # Regenerate Prisma client (run after schema changes)
npx prisma migrate dev       # Apply migrations and regenerate client
npx prisma migrate deploy    # Apply migrations in production
npx prisma studio            # Open Prisma GUI
```

The Prisma client is generated to `app/generated/prisma/` (not the default location).

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 · PostgreSQL

This is a boxing gym management system. The database schema is the most complete part of the codebase; the UI is still boilerplate.

### Database domain

For any database-related questions, refer to @prisma/schema.prisma for the full schema.

Key entities in `prisma/schema.prisma`:

- **Alumno** — students, the central entity. Has level (`Nivel`), shift (`Turno`), status (`EstadoAlumno`), weight category (`CategoriaPeso`), and payment/attendance/progress/fight relationships.
- **Pago** — monthly payment records with method (`MetodoPago`) and status (`EstadoPago`), supports partial payments (abonos).
- **Asistencia** — daily attendance with entry/exit times; composite unique index on `(alumnoId, fecha)`.
- **ProgresoFisico** — physical measurements over time (weight, height, body fat %, BMI).
- **Combate** — fight records with opponent, result (`ResultadoCombate`), and event info.
- **Resena** — student reviews/testimonials with moderation status (`EstadoResena`).

All child records cascade-delete when the parent `Alumno` is deleted.

### UI / Responsive design

The system is used on both desktop computers and mobile phones. All screens must look and work correctly on both. Use a mobile-first approach with Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) and always test layouts at small viewports.

### App Router structure

Source lives in `app/`. The Prisma client is imported from `@/app/generated/prisma` (generated path, not the standard `@prisma/client`).

Environment variable `DATABASE_URL` must be set (see `.env`). Local default: `postgresql://postgres:103671@localhost:5432/box_db?schema=public`.
