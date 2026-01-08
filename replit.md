# Claramente Não Sou um Escritor

## Overview

A minimalist, anonymous personal diary/blog platform with an editorial aesthetic inspired by travel blogs and digital magazines. The site presents personal writings, short stories, and observations in a clean, typographic layout with strong visual hierarchy. Features an 18+ age gate, public diary entries, and a secret admin area for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Animations**: Framer Motion for page transitions and age gate
- **Fonts**: Merriweather (serif) for reading, Inter (sans-serif) for UI

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build Tool**: esbuild for server, Vite for client
- **Session Management**: express-session with MemoryStore

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Database**: PostgreSQL (requires DATABASE_URL environment variable)

### Authentication Pattern
- Simple password-based admin authentication
- Session-based auth stored server-side
- Protected routes check session.isAuthenticated
- No user registration - single admin access

### API Design
- RESTful endpoints under `/api/*`
- Typed route definitions in `shared/routes.ts`
- Request/response validation with Zod schemas
- Shared types between client and server via `@shared/*` alias

### Key Design Decisions
1. **Age Gate**: Cookie-based verification (365-day expiry) before accessing content
2. **Anonymous Writing**: Posts have optional titles, required content, optional images
3. **Visibility Control**: Posts have `isVisible` flag for hiding/showing entries
4. **Editorial Aesthetic**: Pure black/white color scheme, serif typography, generous whitespace
5. **AI Integration**: OpenAI integration for content suggestions (optional feature)

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via DATABASE_URL environment variable
- **Drizzle Kit**: Database migrations in `./migrations` directory

### AI Services
- **OpenAI API**: Used for AI-powered content suggestions
  - Configured via AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL
  - Supports text suggestions and image generation

### Session Storage
- **MemoryStore**: In-memory session storage (development)
- **connect-pg-simple**: Available for PostgreSQL session storage (production)

### Key NPM Packages
- `js-cookie`: Client-side cookie management for age verification
- `date-fns`: Date formatting with Portuguese locale support
- `framer-motion`: Animation library for smooth transitions
- `lucide-react`: Icon library

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (defaults to "secret_key")
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key (optional, for AI features)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL (optional)