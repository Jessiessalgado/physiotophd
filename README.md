# PhysioToPhD

An interdisciplinary digital health platform connecting physiotherapy, rehabilitation technology, neuroscience, and evidence-based practice.

[Visit the live project](https://physiotophd.vercel.app)

## Overview

PhysioToPhD explores how technology can support rehabilitation, clinical education, and knowledge translation. The project combines a public research-oriented website and blog with a protected content management area.

The platform is designed around topics such as neurorehabilitation, virtual reality, biomechanics, pediatric rehabilitation, wearable technology, robotics, and digital health.

## Features

- Public landing page and research-focused blog
- Dynamic articles, categories, tags, and institutional pages
- Protected administration area
- Rich-text content editor
- Contact form and content management workflows
- SEO metadata, sitemap, and structured data
- Supabase authentication and database integration
- Row Level Security migrations and automated security checks
- Responsive interface and dark-mode support

## Technology stack

- **Frontend:** React 19, TypeScript, TanStack Start, TanStack Router
- **UI:** Tailwind CSS, Radix UI, Lucide React
- **Data and authentication:** Supabase
- **Validation and forms:** Zod, React Hook Form
- **Build and runtime:** Vite, Bun, Nitro
- **Quality and security:** ESLint, Prettier, Gitleaks, Supabase DB Lint

## Architecture

```text
Browser
  -> TanStack Start application
      -> Public pages and blog
      -> Authenticated CMS
      -> Server functions and API routes
          -> Supabase Auth, Postgres, and Storage
```

Database schema changes are versioned in `supabase/migrations`. Server-only Supabase access is isolated from the browser client, and CI performs dependency, secret, and Row Level Security checks.

## Local development

### Requirements

- Bun
- A Supabase project

### Setup

```bash
git clone https://github.com/Jessiessalgado/physiotophd.git
cd physiotophd
bun install
cp .env.example .env
bun run dev
```

Add your own public Supabase project values to `.env` before starting the application.

## Available commands

```bash
bun run dev       # Start the development server
bun run build     # Create a production build
bun run preview   # Preview the production build
bun run lint      # Run ESLint
bun run format    # Format the codebase with Prettier
bun audit --prod  # Audit production dependencies
```

## Security

Only Supabase publishable client values belong in local frontend environment variables. Administrative keys and database connection strings must be stored as deployment or GitHub Actions secrets and must never be committed.

See [`docs/security-ci.md`](./docs/security-ci.md) for details about the automated security workflow.

## Project status

PhysioToPhD is under active development. The public experience, CMS, content model, and deployment workflow continue to evolve.

## Author

**Jessica Silva Salgado**  
Physical Therapist & IT Support Analyst working at the intersection of healthcare, technology, and human movement.

[LinkedIn](https://www.linkedin.com/in/jessica-silva-salgado-a075b2a5/) · [GitHub](https://github.com/Jessiessalgado)
