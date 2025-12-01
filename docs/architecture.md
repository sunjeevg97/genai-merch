# GenAI-Merch Architecture

This document provides a comprehensive overview of the GenAI-Merch system architecture, including database design, API structure, authentication flow, and third-party integrations.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [API Routes Structure](#api-routes-structure)
- [Authentication Flow](#authentication-flow)
- [Third-Party Integrations](#third-party-integrations)
- [Security Considerations](#security-considerations)

## System Overview

GenAI-Merch is a full-stack Next.js application that enables users to create custom apparel designs using AI, coordinate group orders, and manage automated fulfillment. The application follows a modern serverless architecture with the following key components:

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                    Next.js 14 App Router                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Vercel Edge Network                       │
│                  (CDN + Serverless Functions)                │
└───┬─────────┬─────────┬─────────────┬─────────────┬─────────┘
    │         │         │             │             │
    │         │         │             │             │
┌───▼───┐ ┌───▼───┐ ┌───▼───────┐ ┌───▼──────┐ ┌───▼────────┐
│Supabase│ │Stripe │ │  OpenAI   │ │ Printful │ │   Resend   │
│Auth/DB │ │Payment│ │  DALL-E 3 │ │Fulfillment│ │   Email    │
└────────┘ └───────┘ └───────────┘ └──────────┘ └────────────┘
```

### Key Design Principles

1. **Serverless-First**: Leverages Vercel's serverless functions for API routes
2. **Type Safety**: Full TypeScript coverage with Prisma for database type safety
3. **Multi-Tenancy**: Organization-based architecture for team/company accounts
4. **API-First**: External integrations abstracted through internal API routes
5. **Real-time Updates**: Supabase Realtime for live order status updates
6. **Security**: Row-level security policies in Supabase, server-side validation

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library built on Radix UI
- **React Hook Form** - Form state management
- **Zod** - Runtime validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client
- **Supabase** - PostgreSQL database, authentication, storage
- **PostgreSQL** - Relational database

### Third-Party Services
- **Stripe** - Payment processing
- **Printful** - Print-on-demand fulfillment
- **OpenAI DALL-E 3** - AI image generation
- **Resend** - Transactional email

## Database Schema

The application uses a PostgreSQL database managed through Prisma ORM. The schema consists of 7 main models:

### Entity Relationship Diagram

```
┌──────────┐         ┌─────────────────────┐         ┌──────────────┐
│   User   │◄───────┤OrganizationMember   ├────────►│Organization  │
└────┬─────┘         └─────────────────────┘         └──────┬───────┘
     │                                                        │
     │ 1:N                                                    │ 1:1
     │                                                        │
┌────▼─────┐                                         ┌───────▼──────┐
│  Design  │                                         │BrandProfile  │
└────┬─────┘                                         └──────────────┘
     │ 1:N
     │
┌────▼─────┐         ┌─────────────┐
│  Order   │────────►│ GroupOrder  │
└──────────┘   N:1   └─────────────┘
```

### Model Descriptions

#### User
Represents user accounts synchronized with Supabase Auth.

**Fields:**
- `id` (String, CUID) - Primary key
- `email` (String, unique) - User email address
- `name` (String?, optional) - User display name
- `createdAt` (DateTime) - Account creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- `organizations` → OrganizationMember[] (user's organization memberships)
- `designs` → Design[] (user's created designs)
- `orders` → Order[] (user's individual orders)
- `groupOrders` → GroupOrder[] (group orders created by user)

#### Organization
Multi-tenant support for teams, companies, or event organizers.

**Fields:**
- `id` (String, CUID) - Primary key
- `name` (String) - Organization display name
- `slug` (String, unique) - URL-friendly identifier
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- `members` → OrganizationMember[] (organization members)
- `brandProfile` → BrandProfile? (optional brand guidelines)

#### OrganizationMember
Junction table managing user-organization relationships with role-based access.

**Fields:**
- `id` (String, CUID) - Primary key
- `userId` (String) - Foreign key to User
- `organizationId` (String) - Foreign key to Organization
- `role` (String) - Access level: "member", "admin", or "owner"
- `createdAt` (DateTime) - Membership creation timestamp

**Unique Constraint:** `[userId, organizationId]` - User can only have one membership per organization

#### BrandProfile
Maintains consistent branding for organization designs.

**Fields:**
- `id` (String, CUID) - Primary key
- `organizationId` (String, unique) - Foreign key to Organization
- `logoUrl` (String?, optional) - Brand logo file URL
- `colorPalette` (JSON) - Array of hex color codes
- `fonts` (JSON) - Font specifications (heading, body, logo fonts)
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**JSON Structure:**
```typescript
// colorPalette
["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

// fonts
{
  "heading": "Inter",
  "body": "Inter",
  "logo": "Playfair Display"
}
```

#### Design
Custom apparel designs, either uploaded or AI-generated.

**Fields:**
- `id` (String, CUID) - Primary key
- `userId` (String) - Foreign key to User (creator)
- `name` (String) - Design name/title
- `imageUrl` (String) - Raster image URL (PNG/JPG)
- `vectorUrl` (String?, optional) - Vector file URL (SVG)
- `metadata` (JSON) - Design specifications
- `aiPrompt` (String?, optional) - Original AI prompt if AI-generated
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Metadata Structure:**
```typescript
{
  "dpi": 300,
  "width": 4500,
  "height": 5400,
  "colorMode": "CMYK",
  "printArea": "full"
}
```

**Relations:**
- `user` → User (design creator)
- `orders` → Order[] (orders using this design)

#### Order
Individual merchandise orders.

**Fields:**
- `id` (String, CUID) - Primary key
- `userId` (String) - Foreign key to User
- `designId` (String) - Foreign key to Design
- `groupOrderId` (String?, optional) - Foreign key to GroupOrder
- `productType` (String) - Product category (e.g., "t-shirt", "hoodie")
- `size` (String) - Size selection (e.g., "S", "M", "L", "XL")
- `quantity` (Int) - Number of items
- `status` (String) - Order status: "pending", "processing", "shipped", "delivered"
- `stripeSessionId` (String?, optional) - Stripe checkout session ID
- `printfulOrderId` (String?, optional) - Printful fulfillment order ID
- `shippingAddress` (JSON) - Complete shipping address
- `price` (Float) - Total price in cents
- `createdAt` (DateTime) - Order creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- `user` → User (customer)
- `design` → Design (selected design)
- `groupOrder` → GroupOrder? (optional group order association)

#### GroupOrder
Coordinated bulk orders for teams, events, or campaigns.

**Fields:**
- `id` (String, CUID) - Primary key
- `name` (String) - Group order name
- `slug` (String, unique) - URL-friendly identifier
- `deadline` (DateTime) - Order deadline
- `status` (String) - Status: "open", "closed", "processing"
- `createdById` (String) - Foreign key to User (organizer)
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- `createdBy` → User (group order organizer)
- `orders` → Order[] (individual orders in this group order)

## API Routes Structure

The API follows RESTful conventions with Next.js App Router route handlers. All routes are located in `src/app/api/`.

### Planned API Routes

#### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in existing user
- `POST /api/auth/signout` - Sign out current user
- `GET /api/auth/session` - Get current session

#### Designs
- `GET /api/designs` - List user's designs
- `POST /api/designs` - Create new design (upload or AI generation)
- `GET /api/designs/[id]` - Get specific design
- `PATCH /api/designs/[id]` - Update design metadata
- `DELETE /api/designs/[id]` - Delete design

#### AI Generation
- `POST /api/ai/generate` - Generate design with DALL-E 3
  - Body: `{ prompt: string, style?: string }`
  - Returns: `{ imageUrl: string, metadata: object }`

#### Orders
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get specific order
- `PATCH /api/orders/[id]` - Update order status

#### Group Orders
- `GET /api/group-orders` - List available group orders
- `POST /api/group-orders` - Create new group order
- `GET /api/group-orders/[slug]` - Get group order details
- `PATCH /api/group-orders/[slug]` - Update group order
- `POST /api/group-orders/[slug]/join` - Join group order

#### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/[slug]` - Get organization details
- `PATCH /api/organizations/[slug]` - Update organization
- `POST /api/organizations/[slug]/members` - Add member
- `DELETE /api/organizations/[slug]/members/[userId]` - Remove member

#### Brand Profiles
- `GET /api/organizations/[slug]/brand` - Get brand profile
- `POST /api/organizations/[slug]/brand` - Create brand profile
- `PATCH /api/organizations/[slug]/brand` - Update brand profile

#### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/webhook` - Handle Stripe webhooks
- `GET /api/payments/session/[id]` - Get checkout session status

#### Fulfillment
- `POST /api/fulfillment/submit-order` - Submit order to Printful
- `POST /api/fulfillment/webhook` - Handle Printful webhooks
- `GET /api/fulfillment/products` - Get available products from Printful

### API Response Format

All API routes follow a consistent response format:

**Success Response:**
```typescript
{
  success: true,
  data: any
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    message: string,
    code?: string
  }
}
```

### Middleware

- **Authentication Middleware**: Validates Supabase session tokens
- **CORS Middleware**: Configured for cross-origin requests
- **Rate Limiting**: Prevents API abuse
- **Error Handling**: Centralized error formatting

## Authentication Flow

GenAI-Merch uses Supabase Auth for user authentication with email/password.

### Sign Up Flow

```
1. User submits registration form
   └─► Email, Password, Name

2. Client calls Supabase Auth API
   └─► supabase.auth.signUp()

3. Supabase creates auth user
   └─► Returns user ID and session

4. Application creates User record
   └─► POST /api/auth/signup
   └─► Prisma creates User with Supabase user.id

5. User redirected to dashboard
   └─► Session stored in cookies
```

### Sign In Flow

```
1. User submits sign-in form
   └─► Email, Password

2. Client calls Supabase Auth API
   └─► supabase.auth.signInWithPassword()

3. Supabase validates credentials
   └─► Returns session tokens

4. Session stored in secure cookies
   └─► HttpOnly, Secure, SameSite=Lax

5. User redirected to dashboard
```

### Protected Routes

Protected routes use middleware to verify authentication:

```typescript
// src/middleware.ts
export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/orders/:path*']
};
```

### Row-Level Security (RLS)

Supabase RLS policies ensure data isolation:

```sql
-- Users can only read their own user record
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid() = id);

-- Users can only create/read/update their own designs
CREATE POLICY "Users manage own designs"
  ON "Design" FOR ALL
  USING (auth.uid() = "userId");

-- Organization members can view organization data
CREATE POLICY "Members view organization"
  ON "Organization" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "OrganizationMember"
      WHERE "organizationId" = "Organization".id
      AND "userId" = auth.uid()
    )
  );
```

## Third-Party Integrations

### Supabase

**Purpose:** PostgreSQL database, authentication, file storage

**Configuration:**
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Features Used:**
- PostgreSQL database with Prisma ORM
- Authentication (email/password)
- Storage for design files and logos
- Realtime subscriptions for order updates
- Row-level security policies

### Stripe

**Purpose:** Payment processing for merchandise orders

**Configuration:**
```typescript
// src/lib/stripe/client.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});
```

**Integration Flow:**
1. User completes order details
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe-hosted checkout
4. Stripe processes payment
5. Webhook confirms payment success
6. Order status updated, fulfillment triggered

**Webhook Events:**
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Payment failed/abandoned
- `payment_intent.succeeded` - Payment confirmed

### OpenAI DALL-E 3

**Purpose:** AI-powered design generation

**Configuration:**
```typescript
// src/lib/openai/client.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});
```

**Generation Flow:**
1. User provides text prompt and style preferences
2. Backend calls DALL-E 3 API
3. OpenAI generates design image
4. Image downloaded and uploaded to Supabase Storage
5. Design record created in database
6. Image URL returned to client

**Parameters:**
- Model: `dall-e-3`
- Quality: `hd`
- Size: `1024x1024` (upscaled for print)
- Style: `vivid` or `natural`

### Printful

**Purpose:** Print-on-demand fulfillment and shipping

**Configuration:**
```typescript
// src/lib/printful/client.ts
import axios from 'axios';

export const printfulClient = axios.create({
  baseURL: 'https://api.printful.com',
  headers: {
    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
  }
});
```

**Integration Flow:**
1. Order confirmed and paid via Stripe
2. Backend submits order to Printful API
3. Printful prints and ships merchandise
4. Webhook updates order status
5. Customer receives tracking information

**Webhook Events:**
- `package_shipped` - Order shipped
- `package_returned` - Return initiated
- `order_failed` - Fulfillment failed

**Product Sync:**
- Sync available products and variants
- Cache product catalog locally
- Update pricing and availability

### Resend

**Purpose:** Transactional email delivery

**Configuration:**
```typescript
// src/lib/resend/client.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);
```

**Email Types:**
- Welcome emails (new user registration)
- Order confirmation
- Shipping notifications
- Group order invitations
- Group order deadline reminders

## Security Considerations

### Environment Variables

All sensitive credentials stored as environment variables:
- Never commit `.env.local` to version control
- Use Vercel environment variables for production
- Rotate API keys regularly

### API Security

1. **Authentication**: All protected routes require valid Supabase session
2. **Authorization**: RLS policies enforce data access rules
3. **Input Validation**: Zod schemas validate all request bodies
4. **Rate Limiting**: Prevent API abuse and DDoS
5. **CORS**: Restrict cross-origin requests
6. **Webhook Verification**: Validate Stripe/Printful webhook signatures

### Database Security

1. **Row-Level Security**: Enforced at database level
2. **Parameterized Queries**: Prisma prevents SQL injection
3. **Connection Pooling**: Secure, limited connections
4. **Encryption**: Data encrypted at rest and in transit

### Client Security

1. **HTTPS Only**: All traffic over TLS
2. **HttpOnly Cookies**: Session tokens inaccessible to JavaScript
3. **Content Security Policy**: Prevent XSS attacks
4. **CSRF Protection**: Token-based protection

### File Upload Security

1. **File Type Validation**: Only allow image files
2. **File Size Limits**: Prevent storage abuse
3. **Virus Scanning**: Scan uploaded files
4. **Signed URLs**: Time-limited access to private files

## Deployment Architecture

### Vercel Deployment

```
Production Environment
├── Edge Network (CDN)
│   └── Static assets cached globally
├── Serverless Functions (iad1 region)
│   ├── API Routes
│   └── Server Components
└── Environment Variables
    ├── Database credentials
    ├── API keys
    └── Service tokens
```

### Build Process

1. Install dependencies (`npm install`)
2. Generate Prisma client (`prisma generate`)
3. Build Next.js app (`next build`)
4. Deploy to Vercel edge network
5. Environment variables injected at runtime

### Database Migrations

- Migrations managed via Supabase CLI
- Pushed to production database before deployment
- Automated via CI/CD pipeline

## Performance Optimizations

1. **Image Optimization**: Next.js automatic image optimization
2. **Code Splitting**: Automatic route-based splitting
3. **Static Generation**: Pre-render marketing pages
4. **Caching**: Redis cache for product catalog
5. **Database Indexes**: Optimized queries with proper indexes
6. **Connection Pooling**: Efficient database connections

## Monitoring and Logging

- **Vercel Analytics**: Performance monitoring
- **Error Tracking**: Sentry integration (future)
- **Database Logs**: Supabase dashboard
- **API Logs**: Vercel function logs
- **Uptime Monitoring**: Status page (future)

## Future Architecture Considerations

1. **Microservices**: Split large services (design generation, fulfillment)
2. **Message Queue**: Async processing for heavy tasks
3. **CDN**: CloudFront for global asset delivery
4. **Search**: Algolia for design search
5. **Real-time**: WebSocket for live order tracking
6. **Mobile**: React Native app
