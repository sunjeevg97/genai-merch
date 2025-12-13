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

## Key Dependencies

### Design Studio Dependencies (Sprint 3-4)

#### Fabric.js (`fabric@^6.9.0`)
**Purpose:** HTML5 canvas manipulation for interactive design editing

**Use Cases:**
- Interactive design canvas with drag-and-drop positioning
- Logo resizing with aspect ratio lock
- Rotation controls for design elements
- Undo/redo functionality
- Export canvas to PNG/JPG for final design

**Installation:**
```bash
npm install fabric@^6.9.0
npm install --save-dev @types/fabric@^5.3.10
```

**Basic Usage:**
```typescript
import { Canvas, Image as FabricImage } from 'fabric';

// Initialize canvas
const canvas = new Canvas('canvas-id', {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff'
});

// Add image to canvas
FabricImage.fromURL('/mockup.png', (img) => {
  canvas.add(img);
  canvas.renderAll();
});

// Export to image
const dataURL = canvas.toDataURL({
  format: 'png',
  quality: 1,
  multiplier: 2  // 2x resolution for print quality
});
```

**Key Features Used:**
- Object manipulation (drag, scale, rotate)
- Canvas export to image formats
- Layer management
- Event handling for user interactions
- JSON serialization for saving canvas state

**Documentation:** http://fabricjs.com/docs/

---

#### Sharp (`sharp@^0.34.5`)
**Purpose:** High-performance Node.js image processing for server-side validation and optimization

**Use Cases:**
- DPI validation for uploaded logos (minimum 150 DPI for print)
- Image dimension checking (minimum 300x300px)
- Format conversion (PNG, JPG, WebP)
- Image optimization and compression
- Metadata extraction (color space, dimensions, format)

**Installation:**
```bash
npm install sharp@^0.34.5
```

**Basic Usage:**
```typescript
import sharp from 'sharp';

// Validate image for print quality
async function validateDesignImage(filePath: string) {
  const metadata = await sharp(filePath).metadata();

  // Check DPI (density)
  const dpi = metadata.density || 72;
  if (dpi < 150) {
    throw new Error('Image DPI too low for print. Minimum 150 DPI required.');
  }

  // Check dimensions
  if (metadata.width < 300 || metadata.height < 300) {
    throw new Error('Image dimensions too small. Minimum 300x300px required.');
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    dpi: dpi,
    colorSpace: metadata.space
  };
}

// Optimize uploaded image
async function optimizeImage(inputBuffer: Buffer) {
  return await sharp(inputBuffer)
    .resize(4500, 5400, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 90 })
    .toBuffer();
}
```

**Key Features Used:**
- Metadata extraction and validation
- Image resizing and optimization
- Format conversion
- Quality control for print-ready files
- Buffer-based processing (works with uploads)

**Important Notes:**
- Server-side only (Node.js API routes)
- Native dependencies - may require platform-specific builds
- High performance - faster than ImageMagick or GraphicsMagick

**Documentation:** https://sharp.pixelplumbing.com/

---

#### React Dropzone (`react-dropzone@^14.3.8`)
**Purpose:** Drag-and-drop file upload component for React

**Use Cases:**
- Logo file upload with drag-and-drop interface
- File type validation (PNG, JPG, JPEG only)
- File size validation (max 5MB)
- Multiple file upload (for future features)
- Visual feedback during drag operations

**Installation:**
```bash
npm install react-dropzone@^14.3.8
```

**Basic Usage:**
```typescript
'use client';

import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';

export function LogoUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 5 * 1024 * 1024,  // 5MB
    multiple: false,
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop your logo here...</p>
      ) : (
        <p>Drag and drop a logo, or click to select</p>
      )}
    </div>
  );
}
```

**Key Features Used:**
- File type restrictions via MIME types
- File size validation
- Drag-and-drop state management
- Visual feedback states (active, reject)
- Accessibility support (keyboard navigation)
- Multiple file support (disabled for MVP, single logo only)

**Validation:**
- Client-side: MIME type, file size, file count
- Server-side: Additional validation with Sharp (DPI, dimensions)

**Documentation:** https://react-dropzone.js.org/

---

### Dependency Management Best Practices

1. **Keep dependencies updated** - Check for security updates regularly
2. **Review bundle size** - Monitor impact on client-side bundle with `npm run build`
3. **Server vs. Client** - Use Sharp server-side only, Fabric.js and React Dropzone client-side
4. **Type safety** - Install `@types/*` packages for TypeScript support
5. **Version pinning** - Use exact versions in production, caret (^) in development

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

## File Storage (Supabase Storage)

GenAI-Merch uses Supabase Storage for managing design files, logos, and exported designs.

### Storage Helper Functions

All storage operations are handled through helper functions in `@/lib/supabase/storage`:

```typescript
import {
  uploadDesignFile,
  uploadDesignExport,
  deleteDesignFile,
  getPublicUrl,
  validateFileSize,
  validateFileType,
} from '@/lib/supabase/storage';
```

### Storage Bucket Structure

**Bucket Name**: `design-assets`

```
design-assets/
├── {userId}/
│   ├── logos/
│   │   └── {timestamp}-{random}-{filename}.png
│   └── exports/
│       └── {designId}.png
```

### Uploading Design Files

#### Upload Logo (Source File)

```typescript
'use client';

import { uploadDesignFile } from '@/lib/supabase/storage';

async function handleFileUpload(file: File, userId: string) {
  // Upload file
  const result = await uploadDesignFile(file, userId);

  if (result.success) {
    console.log('File uploaded successfully');
    console.log('Public URL:', result.url);
    console.log('Storage path:', result.path);

    // Save URL to database or use in design
    setLogoUrl(result.url);
  } else {
    console.error('Upload failed:', result.error);
    // Show error to user
    toast.error(result.error);
  }
}
```

#### Upload Design Export (Final Rendered Design)

```typescript
import { uploadDesignExport } from '@/lib/supabase/storage';

async function saveDesign(canvas: Canvas, userId: string, designId: string) {
  // Export canvas to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png', 1);
  });

  // Convert to File
  const file = new File([blob], 'design.png', { type: 'image/png' });

  // Upload export
  const result = await uploadDesignExport(file, userId, designId);

  if (result.success) {
    console.log('Design exported:', result.url);

    // Save to database
    await prisma.design.update({
      where: { id: designId },
      data: { imageUrl: result.url },
    });
  } else {
    console.error('Export upload failed:', result.error);
  }
}
```

### Validating Files

#### Client-Side Validation

```typescript
import { validateFileSize, validateFileType } from '@/lib/supabase/storage';

function handleFileSelect(file: File) {
  // Check file size (max 5MB)
  if (!validateFileSize(file)) {
    alert('File too large. Maximum size is 5MB.');
    return;
  }

  // Check file type (PNG or JPG)
  if (!validateFileType(file)) {
    alert('Invalid file type. Only PNG and JPG files are allowed.');
    return;
  }

  // File is valid, proceed with upload
  uploadFile(file);
}
```

#### Comprehensive Validation

```typescript
import { validateFile } from '@/lib/supabase/storage';

function validateBeforeUpload(file: File) {
  const validation = validateFile(file);

  if (!validation.isValid) {
    // Show specific error message
    toast.error(validation.error);
    return false;
  }

  return true;
}
```

### Deleting Files

```typescript
import { deleteDesignFile } from '@/lib/supabase/storage';

async function removeDesign(filePath: string) {
  const result = await deleteDesignFile(filePath);

  if (result.success) {
    console.log('File deleted successfully');
  } else {
    console.error('Delete failed:', result.error);
  }
}
```

### Getting Public URLs

```typescript
import { getPublicUrl } from '@/lib/supabase/storage';

function displayStoredImage(filePath: string) {
  const url = getPublicUrl(filePath);

  if (url) {
    return <img src={url} alt="Design" />;
  } else {
    return <p>Failed to load image</p>;
  }
}
```

### React Component Example (File Upload)

```typescript
'use client';

import { useState } from 'react';
import { uploadDesignFile } from '@/lib/supabase/storage';
import { useUser } from '@/hooks/useUser';

export function LogoUploadComponent() {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    const result = await uploadDesignFile(file, user.id);

    if (result.success) {
      setLogoUrl(result.url!);
    } else {
      setError(result.error!);
    }

    setUploading(false);
  }

  return (
    <div>
      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleUpload}
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {logoUrl && <img src={logoUrl} alt="Uploaded logo" />}
    </div>
  );
}
```

### Storage Bucket Policies

The `design-assets` bucket has the following RLS policies:

**Upload Policy:**
```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  USING (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()
  );
```

**Read Policy:**
```sql
-- Public read access to all design assets
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'design-assets');
```

**Delete Policy:**
```sql
-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()
  );
```

### Error Handling Best Practices

Always handle errors from storage operations:

```typescript
try {
  const result = await uploadDesignFile(file, userId);

  if (!result.success) {
    // Handle specific errors
    if (result.error?.includes('too large')) {
      // Show file size error
    } else if (result.error?.includes('Invalid file type')) {
      // Show file type error
    } else {
      // Generic error
      console.error('Upload failed:', result.error);
    }
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

### File Size Limits

- **Maximum file size**: 5MB
- **Recommended**: Compress images before upload
- **Validation**: Automatic via `uploadDesignFile()`

### Supported File Types

- **PNG** (`.png`, `image/png`)
- **JPEG** (`.jpg`, `.jpeg`, `image/jpeg`)

Both MIME type and file extension are validated.

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

**Last Updated**: 2025-12-01 (Added Supabase Storage helpers for file upload, validation, and management)
