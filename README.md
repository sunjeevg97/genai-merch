# GenAI-Merch

AI-powered custom apparel platform with smart group ordering and automated fulfillment.

## Overview

GenAI-Merch is a modern web application that revolutionizes custom merchandise creation for teams, organizations, and events. Featuring AI-powered design generation, streamlined group ordering, and integrated fulfillment, it makes creating and distributing custom apparel effortless.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Supabase** - PostgreSQL database, authentication, and storage
- **Prisma ORM** - Type-safe database access
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Stripe** - Payment processing
- **Printful** - Print-on-demand fulfillment
- **OpenAI DALL-E 3** - AI design generation

## Features

- **AI Design Generation** - Create custom designs using natural language prompts
- **Group Ordering** - Coordinate team merchandise with shared campaigns
- **Brand Profiles** - Maintain consistent branding across designs
- **Automated Fulfillment** - Direct integration with Printful for printing and shipping
- **Secure Payments** - Stripe-powered checkout
- **User Authentication** - Supabase Auth with email/password
- **Organization Management** - Multi-tenant support for teams and companies

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)
- Printful account (for fulfillment)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd genai-merch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in all required environment variables in `.env.local`:
   - Supabase credentials
   - Database URL
   - Stripe API keys
   - OpenAI API key
   - Printful API key
   - Resend API key

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   brew install supabase/tap/supabase

   # Login to Supabase
   supabase login --token YOUR_ACCESS_TOKEN

   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF
   ```

5. **Run database migrations**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql
   mkdir -p supabase/migrations
   mv migration.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_init.sql
   supabase db push --linked
   ```

6. **Seed the database (optional)**
   ```bash
   # Run the seed SQL in Supabase SQL Editor
   # See prisma/seed.ts for seed data structure
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   - Import your repository on [Vercel](https://vercel.com)
   - Add all environment variables from `.env.local`
   - Deploy

3. **Configure Supabase**
   - Add your Vercel domain to Supabase Auth allowed URLs
   - Update redirect URLs for authentication

**Deployed Application:** [Add URL after deployment]

## Project Structure

```
genai-merch/
├── .claude/              # Claude Code custom commands
│   └── commands/         # Custom slash commands
├── .vscode/              # VSCode settings and extensions
├── docs/                 # Project documentation
│   ├── architecture.md   # System architecture
│   └── features/         # Feature documentation
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Database seeding script
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js app router
│   │   ├── (auth)/       # Authentication pages
│   │   ├── api/          # API routes
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # shadcn/ui components
│   └── lib/              # Utility functions and API clients
│       ├── prisma/       # Prisma client and queries
│       └── supabase/     # Supabase clients
├── supabase/             # Supabase migrations
│   └── migrations/       # SQL migration files
├── CLAUDE.md             # Project constitution and guidelines
├── CONTRIBUTING.md       # Contribution guidelines
└── vercel.json           # Vercel configuration
```

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript compiler checks

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `OPENAI_API_KEY` - OpenAI API key for DALL-E
- `PRINTFUL_API_KEY` - Printful API key
- `RESEND_API_KEY` - Resend API key for emails

## Key Features Documentation

### AI Design Generation
Users can describe their desired design in natural language, and the system uses OpenAI's DALL-E 3 to generate custom artwork optimized for apparel printing.

### Group Ordering
Organize team merchandise campaigns with:
- Shared design selection
- Individual size and quantity choices
- Deadline management
- Bulk order coordination
- Individual payment processing

### Organization Management
Multi-tenant architecture supports:
- Team/company accounts
- Role-based access control (owner, admin, member)
- Brand profile management
- Centralized design library

### Print-on-Demand Integration
Seamless Printful integration handles:
- Product catalog sync
- Order submission
- Fulfillment tracking
- Shipping notifications

## Database Schema

The application uses 7 main models:
- **User** - User accounts synced with Supabase Auth
- **Organization** - Team/company accounts
- **OrganizationMember** - User-organization relationships with roles
- **BrandProfile** - Brand guidelines (colors, fonts, logos)
- **Design** - Custom apparel designs with AI metadata
- **GroupOrder** - Bulk order campaigns
- **Order** - Individual merchandise orders

See `prisma/schema.prisma` for the complete schema definition.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## License

[Add license information]

## Support

For questions or issues:
- Create an issue in the repository
- Contact [your email/support channel]

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Prisma](https://prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [Stripe](https://stripe.com)
- [Printful](https://printful.com)
- [OpenAI](https://openai.com)
