# GenAI-Merch Project Constitution

## Project Overview

GenAI-Merch is an AI-powered custom apparel design and group ordering platform that revolutionizes how teams, organizations, and groups create and order custom merchandise.

### Core Value Proposition
- **AI-Powered Design Generation**: Leverage OpenAI DALL-E 3 to generate custom apparel designs from text prompts
- **Print-on-Demand Fulfillment**: Seamless integration with Printful API for professional POD fulfillment
- **Group Ordering Automation**: Streamlined logistics for bulk orders with individual sizing and payment collection
- **End-to-End Solution**: From design concept to doorstep delivery

### Target Customers
- **Sports Teams**: Youth leagues, recreational teams, competitive clubs
- **Corporations**: Employee apparel, event merchandise, branded swag
- **Charities & Nonprofits**: Fundraising merchandise, event T-shirts
- **Families**: Reunion shirts, special occasion apparel

### Core Differentiators
1. AI-powered design generation eliminates need for graphic design skills
2. Automated group ordering logistics (size collection, payment tracking, bulk fulfillment)
3. Integrated POD fulfillment removes inventory risk
4. Collaborative design editing with live preview

---

## Tech Stack

### Frontend
- **Next.js 14** with TypeScript (App Router)
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **Fabric.js** for interactive design canvas
- **React Hook Form** for form management
- **Zod** for schema validation

### Backend & Infrastructure
- **Supabase**
  - PostgreSQL database
  - Authentication & authorization
  - File storage for designs and assets
- **Prisma ORM** for type-safe database operations
- **Next.js API Routes** for backend logic

### Third-Party Integrations
- **OpenAI DALL-E 3 API** - AI design generation
- **Printful API** - POD fulfillment and product catalog
- **Stripe** - Payment processing and checkout
- **Resend** - Transactional email delivery

### Development Tools
- **TypeScript** - Type safety across the stack
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vercel** - Deployment platform (production & preview)

---

## Development Workflows

### Starting Development

**1. Start the development server:**
```bash
npm run dev
```
- Server runs at http://localhost:3000
- Hot reload enabled with Turbopack
- Environment variables loaded from .env.local

**2. Access Prisma Studio (Database GUI):**
```bash
npm run db:studio
```
- Opens at http://localhost:5555
- Visual database browser
- Edit data directly in the browser

### Before Starting Work
1. **Always create a feature branch** before making changes
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Or use the automated command:
   ```bash
   /start-feature your-feature-name
   ```

2. **Pull latest changes** from main/staging
   ```bash
   git pull origin main
   ```

3. **Install dependencies** if needed
   ```bash
   npm install
   ```

4. **Run database migrations** if schema changed
   ```bash
   npm run db:migrate
   ```

### During Development

**Development Server:**
```bash
npm run dev          # Start Next.js dev server
```

**Database Operations:**
```bash
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema changes (dev only)
npm run db:migrate   # Create and run migration
npm run db:generate  # Generate Prisma Client
npm run db:seed      # Seed database with test data
```

**Code Quality:**
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # Check TypeScript types
```

**Best Practices:**
1. **Run the development server** and test changes locally
2. **Use TypeScript strictly** - no `any` types without justification
3. **Follow component patterns** established in the codebase
4. **Test API integrations** with all third-party services
5. **Check Prisma Studio** to verify database changes

### After Making Changes

**Quality Checks:**
```bash
npm run type-check   # Must pass
npm run lint         # Must pass
npm run build        # Must succeed
```

**Git Workflow:**
1. **Stage changes**
   ```bash
   git add .
   ```

2. **Commit with descriptive messages** (conventional commits)
   ```bash
   git commit -m "feat(design): add AI design generation"
   ```

3. **Push to remote**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Use ship command** for automated checks
   ```bash
   /ship-feature
   ```

### Testing Strategy
- Unit tests for utility functions and business logic
- Integration tests for API routes
- E2E tests for critical user flows (design creation, checkout)
- Manual testing of Printful and Stripe integrations in sandbox mode

### Available NPM Scripts

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

**Code Quality:**
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run type-check` - TypeScript type checking

**Database (Prisma):**
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data

### Custom Claude Commands

**Start a new feature:**
```bash
/start-feature [feature-name]
```
- Creates feature branch
- Sets up documentation
- Follows project conventions

**Ship a completed feature:**
```bash
/ship-feature
```
- Runs quality checks
- Updates documentation
- Guides through merge process

### VSCode Setup

Install recommended extensions:
- Prisma (syntax highlighting, formatting)
- Tailwind CSS IntelliSense (class autocomplete)
- ESLint (linting)
- Prettier (code formatting)
- Error Lens (inline error display)

Settings are pre-configured in `.vscode/settings.json`:
- Format on save enabled
- ESLint auto-fix on save
- Tailwind class completion
- TypeScript strict mode

### Development Best Practices

1. **Always run type-check before committing**
2. **Use Prisma Studio to inspect database changes**
3. **Test auth flows in incognito mode**
4. **Check responsive design on mobile**
5. **Verify environment variables are set**
6. **Use custom commands for consistency**
7. **Keep CLAUDE.md updated with project context**

---

## Coding Standards

### TypeScript
- **Strict mode enabled** - no implicit any, strict null checks
- **Proper typing** for all functions, props, and API responses
- **Type imports** from Prisma for database models
- **Avoid `any`** - use `unknown` or proper types
- **Interface over type** for object shapes (unless union needed)

### Component Architecture
- **Use shadcn/ui components** as foundation where possible
- **Server Components by default** - use Client Components only when needed
- **Colocation** - keep related files together
- **Barrel exports** for cleaner imports
- **Component composition** over prop drilling

### Styling
- **Tailwind CSS for all styling** - no custom CSS files
- **Use design tokens** from tailwind.config for consistency
- **Responsive by default** - mobile-first approach
- **shadcn/ui theming** for consistent look and feel
- **Dark mode support** where applicable

### Database & API
- **Prisma for all database operations** - no raw SQL unless absolutely necessary
- **API routes follow REST conventions**
  - GET for reading
  - POST for creating
  - PATCH for updating
  - DELETE for removing
- **Validate all inputs** with Zod schemas
- **Error handling on all API calls** with try-catch blocks
- **Return consistent error shapes**
  ```typescript
  { error: string, details?: any }
  ```
- **Use Supabase RLS policies** for data access control

### Error Handling
- **Try-catch blocks** around all async operations
- **Proper HTTP status codes** in API responses
- **User-friendly error messages** on the frontend
- **Log errors** for debugging (without exposing sensitive data)
- **Graceful degradation** when third-party services fail

### Security
- **Never commit .env files** or secrets
- **Validate all user inputs** server-side with Zod
- **Use Supabase RLS** for database security
- **Sanitize data** before rendering
- **Implement rate limiting** on sensitive endpoints
- **Use environment variables** for all API keys and secrets

### Code Organization
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── ...          # Feature components
├── lib/             # Utility functions and configs
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── styles/          # Global styles (minimal)
└── prisma/          # Database schema and migrations
```

---

## Git Branching Strategy

### Main Branches
- **`main`** - Production-ready code
  - Deployed to production automatically
  - Protected - requires PR and review
  - Always stable and deployable

- **`staging`** - Pre-production testing environment
  - Integration testing before production
  - Deployed to staging environment
  - Merged to main after QA approval

### Supporting Branches
- **`feature/*`** - New features and enhancements
  - Branch from: `main` or `staging`
  - Merge into: `staging`
  - Naming: `feature/ai-design-editor`, `feature/group-orders`

- **`bugfix/*`** - Bug fixes
  - Branch from: `main` or `staging`
  - Merge into: `staging`
  - Naming: `bugfix/stripe-webhook-error`, `bugfix/image-upload`

- **`hotfix/*`** - Critical production fixes
  - Branch from: `main`
  - Merge into: `main` AND `staging`
  - Naming: `hotfix/payment-processing-error`

### Commit Message Format
Follow conventional commits:
```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(design): add AI design generation with DALL-E 3`
- `fix(checkout): resolve Stripe payment intent error`
- `docs(readme): update setup instructions`

---

## Key Features & Modules

### 1. AI Design Generation
- Text-to-image with DALL-E 3
- Design refinement and iteration
- Style presets and templates
- Design history and versioning

### 2. Design Canvas Editor
- Fabric.js-based interactive canvas
- Real-time preview on product mockups
- Text, image, and shape layers
- Design templates and customization

### 3. Group Ordering System
- Order campaign creation
- Size collection from participants
- Individual payment links via Stripe
- Order tracking dashboard
- Automated bulk submission to Printful

### 4. Product Catalog
- Synced with Printful product catalog
- Product variants (sizes, colors)
- Pricing with markup configuration
- Mockup generation

### 5. Payment Processing
- Stripe checkout integration
- Individual vs. bulk payment flows
- Payment tracking and reconciliation
- Refund handling

### 6. Order Fulfillment
- Printful API integration
- Order submission and tracking
- Shipping notifications
- Fulfillment status webhooks

---

## Authentication & Authorization

### Supabase Client Types

GenAI-Merch uses three types of Supabase clients for different contexts:

#### 1. Browser Client (Client Components)
```tsx
'use client'
import { createBrowserClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createBrowserClient()
  // Use for client-side operations
}
```

#### 2. Server Client (Server Components & API Routes)
```tsx
import { createServerClient } from '@/lib/supabase/client'

export default async function MyPage() {
  const supabase = await createServerClient()
  // Use for server-side operations with user context
}
```

#### 3. Service Client (Admin Operations)
```tsx
import { createServiceClient } from '@/lib/supabase/client'

// ⚠️ Server-side only - bypasses RLS
const supabase = createServiceClient()
// Use for admin operations only
```

### Authentication Patterns

#### Protecting Server Components
```tsx
import { requireAuth } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const user = await requireAuth()
  // User is guaranteed to be authenticated
  return <div>Welcome {user.email}</div>
}
```

#### Getting User in Server Components
```tsx
import { getUser } from '@/lib/supabase/server'

export default async function MyPage() {
  const user = await getUser()
  if (!user) {
    return <div>Please sign in</div>
  }
  return <div>Hello {user.email}</div>
}
```

#### Client-Side Authentication
```tsx
'use client'
import { createBrowserClient } from '@/lib/supabase/client'

export default function SignInForm() {
  const supabase = createBrowserClient()

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }
}
```

### Route Protection

Middleware automatically protects routes:
- **Protected routes**: `/dashboard/*`, `/design/*`, `/orders/*`, `/groups/*`
- **Public routes**: `/`, `/signin`, `/signup`
- Unauthenticated users are redirected to `/signin` with return URL
- Authenticated users accessing `/signin` or `/signup` are redirected to `/dashboard/design`

### Authentication Flow

1. **Sign Up**: User creates account → Email verification → Account activated
2. **Sign In**: User signs in → Session created → Redirected to dashboard
3. **Session Management**: Middleware refreshes sessions automatically
4. **Sign Out**: User signs out → Session cleared → Redirected to home

### Best Practices

1. **Always use the appropriate client type**
   - Browser client for client components
   - Server client for server components
   - Service client only for admin operations

2. **Never expose service role key**
   - Keep service role key server-side only
   - Never use in client components

3. **Leverage Row Level Security (RLS)**
   - Enable RLS on all tables
   - Write policies for proper access control
   - Service client bypasses RLS - use carefully

4. **Handle errors gracefully**
   - Always check for errors in auth operations
   - Display user-friendly error messages
   - Log errors for debugging

5. **Validate user sessions**
   - Middleware handles session refresh
   - Use `getUser()` or `requireAuth()` in server components
   - Check authentication status before protected operations

---

## Database & Prisma ORM

### Database Schema

GenAI-Merch uses PostgreSQL (via Supabase) with Prisma ORM for type-safe database access.

#### Core Models

**User** - User accounts (synced with Supabase Auth)
- `id`, `email`, `name`
- Relations: organizations, designs, orders, groupOrders

**Organization** - Team/company accounts
- `id`, `name`, `slug`
- Relations: members, brandProfile

**BrandProfile** - Brand identity for organizations
- `logoUrl`, `colorPalette`, `fonts` (JSON)
- One-to-one with Organization

**Design** - Custom apparel designs
- `name`, `imageUrl`, `vectorUrl`, `metadata` (JSON)
- `aiPrompt` (if AI-generated)
- Relations: user, orders

**Order** - Individual product orders
- `productType`, `size`, `quantity`, `price`
- `status`: pending → processing → shipped → delivered
- `stripeSessionId`, `printfulOrderId`
- `shippingAddress` (JSON)
- Relations: user, design, groupOrder

**GroupOrder** - Team/event bulk orders
- `name`, `slug`, `deadline`
- `status`: open → closed → processing
- Relations: createdBy (user), orders

**OrganizationMember** - User-Organization relationships
- `role`: member, admin, owner
- Unique constraint on (userId, organizationId)

### Using Prisma Client

#### Import the Singleton Client
```tsx
import { prisma } from '@/lib/prisma'

// Use in Server Components, API Routes, and Server Actions
const users = await prisma.user.findMany()
```

#### Common Query Patterns

**Find One:**
```tsx
const user = await prisma.user.findUnique({
  where: { id: userId }
})
```

**Find Many with Relations:**
```tsx
const designs = await prisma.design.findMany({
  where: { userId },
  include: { user: true },
  orderBy: { createdAt: 'desc' }
})
```

**Create:**
```tsx
const design = await prisma.design.create({
  data: {
    userId,
    name: 'My Design',
    imageUrl: 'https://...',
    metadata: { dpi: 300, width: 4500 }
  }
})
```

**Update:**
```tsx
const order = await prisma.order.update({
  where: { id: orderId },
  data: { status: 'shipped' }
})
```

**Delete:**
```tsx
await prisma.design.delete({
  where: { id: designId }
})
```

### Helper Query Functions

Use pre-built query helpers from `@/lib/prisma/queries`:

```tsx
import {
  getUserById,
  getDesignsByUserId,
  getGroupOrderBySlug,
  createOrder,
  updateOrderStatus
} from '@/lib/prisma/queries'

// Type-safe, reusable queries
const user = await getUserById('user-id')
const designs = await getDesignsByUserId('user-id')
const groupOrder = await getGroupOrderBySlug('summer-camp-2024')
```

### Creating Migrations

**Initial Setup (First Time):**
1. Get your DATABASE_URL from Supabase:
   - Dashboard → Settings → Database → Connection String
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
2. Update `.env.local` with your DATABASE_URL
3. Run initial migration:
   ```bash
   npx prisma migrate dev --name init
   ```

**Adding New Models or Fields:**
1. Update `prisma/schema.prisma`
2. Create and apply migration:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

**Reset Database (Development Only):**
```bash
npx prisma migrate reset
```

**Apply Migrations in Production:**
```bash
npx prisma migrate deploy
```

### Updating Prisma Client

After changing the schema, regenerate the client:
```bash
npx prisma generate
```

This updates TypeScript types for type-safe queries.

### Seeding Data (Development)

Create `prisma/seed.ts` for test data:
```tsx
import { prisma } from '../src/lib/prisma'

async function main() {
  // Create test users, designs, etc.
  await prisma.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User'
    }
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run seed:
```bash
npx prisma db seed
```

### Best Practices

1. **Always use the singleton client** (`@/lib/prisma`)
   - Prevents connection pool exhaustion
   - Properly configured for development and production

2. **Use helper queries for common operations**
   - Defined in `@/lib/prisma/queries.ts`
   - Consistent, type-safe, reusable

3. **Include relations when needed**
   - Use `include` to fetch related data
   - Avoid N+1 queries

4. **Handle errors gracefully**
   - Wrap database operations in try-catch
   - Check for unique constraint violations
   - Provide user-friendly error messages

5. **Use transactions for multi-step operations**
   ```tsx
   await prisma.$transaction(async (tx) => {
     const order = await tx.order.create({ data: orderData })
     await tx.groupOrder.update({
       where: { id: groupOrderId },
       data: { /* ... */ }
     })
   })
   ```

6. **Leverage Prisma's type safety**
   - Let TypeScript catch errors at compile time
   - Use generated types from `@prisma/client`

7. **Sync User model with Supabase Auth**
   - Create/update Prisma User when user signs up/signs in
   - Use Supabase user ID as Prisma User ID
   - Example:
   ```tsx
   import { upsertUser } from '@/lib/prisma/queries'

   // After Supabase auth
   await upsertUser({
     id: supabaseUser.id,
     email: supabaseUser.email,
     name: supabaseUser.user_metadata.name
   })
   ```

---

## Environment Variables

Required environment variables (never commit actual values):

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Printful
PRINTFUL_API_KEY="..."

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Custom Commands

When starting new features, use:
```bash
/start-feature [feature-name]
```

This will:
1. Create a new feature branch
2. Set up boilerplate if needed
3. Update this file with feature context

---

## Notes & Reminders

- **Cost optimization**: Monitor OpenAI and Printful API usage
- **Webhook security**: Always verify Stripe and Printful webhook signatures
- **Image optimization**: Compress designs before upload to reduce storage costs
- **Rate limiting**: Implement on AI generation endpoints to prevent abuse
- **Testing accounts**: Use Stripe test mode and Printful sandbox for development
- **Accessibility**: Follow WCAG guidelines for all UI components
- **Performance**: Lazy load images and components where possible

---

**Last Updated**: 2025-11-30 (Development tooling and automation added)
