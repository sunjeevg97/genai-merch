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

### Fabric.js Canvas Utilities & Design Studio Patterns

#### Overview

GenAI-Merch includes comprehensive canvas utilities (`@/lib/design/canvas-utils`) that wrap Fabric.js for common design studio operations. These utilities handle initialization, image loading, boundary constraints, and canvas serialization.

**Location**: `src/lib/design/canvas-utils.ts`

**Key Features**:
- Type-safe wrappers for Fabric.js operations
- Print area boundary management
- Canvas state persistence (save/load)
- Image export for production
- Error handling and logging built-in

#### Core Utility Functions

##### 1. `initializeCanvas()`

Creates and configures a Fabric.js canvas instance.

```typescript
import { initializeCanvas } from '@/lib/design/canvas-utils';

// Initialize canvas with default options
const canvas = initializeCanvas(
  canvasElement,
  800,
  600,
  {
    backgroundColor: '#f0f0f0',
    selectionColor: 'rgba(100, 150, 255, 0.3)',
    selectionBorderColor: '#4a90e2',
  }
);
```

**Parameters**:
- `canvasElement`: HTML canvas element
- `width`: Canvas width in pixels
- `height`: Canvas height in pixels
- `options`: Optional configuration (background color, selection style)

**Returns**: Configured `fabric.Canvas` instance

**Throws**: Error if canvas element is null or dimensions are invalid

---

##### 2. `loadImageOntoCanvas()`

Loads an uploaded image onto the canvas, automatically positioning it within the print area.

```typescript
import { loadImageOntoCanvas } from '@/lib/design/canvas-utils';
import { getDefaultMockup } from '@/lib/design/mockups';

const mockup = getDefaultMockup();
const printArea = mockup.printArea;

// Load user's logo
const image = await loadImageOntoCanvas(
  canvas,
  uploadedImageUrl,
  printArea
);

// Image is now centered in print area, scaled to 70% of available space
console.log('Image loaded:', image.width, image.height);
```

**Parameters**:
- `canvas`: Fabric.js canvas instance
- `imageUrl`: URL or data URL of image to load
- `printArea`: Print area boundaries `{ x, y, width, height }`

**Returns**: Promise resolving to `fabric.Image` object

**Behavior**:
- Automatically scales image to fit 70% of print area
- Centers image within print area
- Maintains aspect ratio
- Makes image selectable and draggable
- Sets image as active selection

---

##### 3. `setupPrintAreaBounds()`

Creates a visual guide showing the printable area boundaries.

```typescript
import { setupPrintAreaBounds } from '@/lib/design/canvas-utils';

const bounds = setupPrintAreaBounds(canvas, printArea, {
  stroke: '#e74c3c',
  strokeWidth: 2,
  fill: 'rgba(231, 76, 60, 0.1)',
  strokeDashArray: [5, 5],
});

// Bounds rectangle is non-selectable and stays in background
```

**Parameters**:
- `canvas`: Fabric.js canvas instance
- `printArea`: Print area boundaries
- `options`: Optional styling (stroke color, width, fill, dash pattern)

**Returns**: `fabric.Rect` bounds rectangle

**Use Case**: Visual reference for users showing where designs will print

---

##### 4. `constrainObjectToBounds()`

Prevents objects from being dragged outside the print area.

```typescript
import { constrainObjectToBounds } from '@/lib/design/canvas-utils';

// Attach to canvas movement event
canvas.on('object:moving', (e) => {
  if (e.target) {
    constrainObjectToBounds(e.target, printArea);
  }
});

// Objects will now "stick" to print area edges
```

**Parameters**:
- `obj`: Fabric.js object being moved
- `bounds`: Boundaries to constrain within

**Behavior**:
- Calculates object's bounding rectangle
- Adjusts position if object extends beyond bounds
- Updates object coordinates automatically

**Use Case**: Ensure designs stay within printable area during editing

---

##### 5. `getCanvasAsJSON()`

Exports canvas state for saving to database.

```typescript
import { getCanvasAsJSON } from '@/lib/design/canvas-utils';

// Export canvas state
const canvasJSON = getCanvasAsJSON(canvas);

// Save to database
await prisma.design.create({
  data: {
    userId: user.id,
    name: 'My Design',
    canvasData: canvasJSON,  // Store JSON string
  },
});
```

**Parameters**:
- `canvas`: Fabric.js canvas instance

**Returns**: JSON string containing canvas state

**Includes**: All objects, properties, canvas background, custom properties

---

##### 6. `loadCanvasFromJSON()`

Restores canvas from a previously saved state.

```typescript
import { loadCanvasFromJSON } from '@/lib/design/canvas-utils';

// Load design from database
const design = await prisma.design.findUnique({
  where: { id: designId },
});

// Restore canvas
await loadCanvasFromJSON(canvas, design.canvasData);

// Canvas now shows saved design with all objects
```

**Parameters**:
- `canvas`: Fabric.js canvas instance
- `json`: JSON string from `getCanvasAsJSON()`

**Returns**: Promise that resolves when canvas is loaded

**Use Case**: Load saved designs for editing or viewing

---

##### 7. `exportCanvasAsImage()`

Exports canvas as high-resolution PNG for production.

```typescript
import { exportCanvasAsImage } from '@/lib/design/canvas-utils';

// Export at 2x resolution (default)
const dataURL = exportCanvasAsImage(canvas, {
  format: 'png',
  quality: 1.0,
  multiplier: 2,  // 2x resolution for print quality
});

// Convert to blob and upload
const blob = await fetch(dataURL).then(r => r.blob());
const file = new File([blob], 'design.png', { type: 'image/png' });

// Upload to storage
const result = await uploadDesignExport(file, userId, designId);
```

**Parameters**:
- `canvas`: Fabric.js canvas instance
- `options`: Export configuration
  - `format`: 'png' or 'jpeg' (default: 'png')
  - `quality`: 0.0 to 1.0 (default: 1.0)
  - `multiplier`: Resolution multiplier (default: 2 for 2x)

**Returns**: Base64 data URL of exported image

**Use Case**: Generate final design images for Printful submission

---

#### Bonus Utility Functions

##### Additional Helper Functions

```typescript
import {
  clearCanvas,
  getActiveObject,
  removeActiveObject,
  scaleActiveObject,
  rotateActiveObject,
} from '@/lib/design/canvas-utils';

// Clear entire canvas
clearCanvas(canvas);

// Get currently selected object
const activeObj = getActiveObject(canvas);
if (activeObj) {
  console.log('Selected:', activeObj.type);
}

// Delete selected object
const removed = removeActiveObject(canvas);
if (removed) {
  console.log('Object deleted');
}

// Scale selected object
scaleActiveObject(canvas, 1.2);  // Make 20% larger
scaleActiveObject(canvas, 0.8);  // Make 20% smaller

// Rotate selected object
rotateActiveObject(canvas, 45);   // Rotate 45° clockwise
rotateActiveObject(canvas, -90);  // Rotate 90° counter-clockwise
```

---

#### Design Studio Workflow Pattern

Here's the recommended pattern for implementing the design studio page:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeCanvas, loadImageOntoCanvas, setupPrintAreaBounds, constrainObjectToBounds } from '@/lib/design/canvas-utils';
import { getDefaultMockup } from '@/lib/design/mockups';

export default function DesignStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [mockup, setMockup] = useState(getDefaultMockup());

  // Step 1: Initialize canvas on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = initializeCanvas(
      canvasRef.current,
      800,
      600,
      {
        backgroundColor: '#ffffff',
      }
    );

    setCanvas(fabricCanvas);

    // Cleanup on unmount
    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Step 2: Setup print area bounds when mockup changes
  useEffect(() => {
    if (!canvas) return;

    setupPrintAreaBounds(canvas, mockup.printArea);
  }, [canvas, mockup]);

  // Step 3: Add boundary constraints
  useEffect(() => {
    if (!canvas) return;

    const handleMoving = (e: fabric.IEvent) => {
      if (e.target) {
        constrainObjectToBounds(e.target, mockup.printArea);
      }
    };

    canvas.on('object:moving', handleMoving);

    return () => {
      canvas.off('object:moving', handleMoving);
    };
  }, [canvas, mockup]);

  // Step 4: Handle file upload
  const handleFileUploaded = async (data: UploadResultData) => {
    if (!canvas) return;

    try {
      const image = await loadImageOntoCanvas(
        canvas,
        data.publicUrl,
        mockup.printArea
      );
      console.log('Logo loaded onto canvas');
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} />
      <FileUpload onFileUploaded={handleFileUploaded} />
    </div>
  );
}
```

---

#### Best Practices

**1. Canvas Initialization**
- Always initialize canvas in `useEffect` to avoid SSR issues
- Store canvas instance in state for access across component
- Clean up canvas on unmount with `canvas.dispose()`

**2. Event Handling**
- Attach event listeners in `useEffect` with cleanup
- Use `canvas.on()` and `canvas.off()` for proper subscription management
- Common events: `object:moving`, `object:scaling`, `object:rotating`, `selection:created`, `selection:cleared`

**3. Print Area Management**
- Load mockup data from `@/lib/design/mockups`
- Always setup print area bounds for user guidance
- Enforce boundary constraints on object movement
- Update bounds when user switches mockups

**4. Image Loading**
- Use `crossOrigin: 'anonymous'` to avoid CORS issues
- Handle Promise rejection for failed image loads
- Show loading state during image load
- Center and scale images automatically with `loadImageOntoCanvas()`

**5. State Persistence**
- Save canvas JSON to database regularly (auto-save)
- Include `getCanvasAsJSON()` in save operations
- Load canvas state with `loadCanvasFromJSON()` on page load
- Store both canvas JSON (editable) and exported PNG (final)

**6. Export for Production**
- Always export at 2x or higher resolution (`multiplier: 2`)
- Use PNG format for designs with transparency
- Convert data URL to blob before uploading to storage
- Validate exported image meets print quality requirements (DPI, dimensions)

**7. Error Handling**
- Wrap all canvas operations in try-catch blocks
- Check for null canvas before operations
- Provide user feedback for errors (file load failures, etc.)
- Log errors for debugging

**8. Performance**
- Limit canvas size to reasonable dimensions (avoid 10000x10000px)
- Use `canvas.renderAll()` sparingly - built-in to most operations
- Debounce auto-save to avoid excessive database writes
- Consider disabling object caching for dynamic designs: `obj.set({ objectCaching: false })`

---

#### Common Patterns

**Auto-Save Pattern**:
```typescript
import { getCanvasAsJSON } from '@/lib/design/canvas-utils';
import { useDebounce } from '@/hooks/useDebounce';

function DesignCanvas({ designId }: { designId: string }) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  // Auto-save on canvas changes
  useEffect(() => {
    if (!canvas) return;

    const handleModified = useDebounce(async () => {
      const canvasJSON = getCanvasAsJSON(canvas);

      await fetch(`/api/designs/${designId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasData: canvasJSON }),
      });

      console.log('Design auto-saved');
    }, 2000); // Save 2 seconds after last change

    canvas.on('object:modified', handleModified);
    canvas.on('object:added', handleModified);
    canvas.on('object:removed', handleModified);

    return () => {
      canvas.off('object:modified', handleModified);
      canvas.off('object:added', handleModified);
      canvas.off('object:removed', handleModified);
    };
  }, [canvas, designId]);

  return <canvas ref={canvasRef} />;
}
```

**Mockup Switcher Pattern**:
```typescript
import { MOCKUPS } from '@/lib/design/mockups';

function MockupSelector({ onMockupChange }) {
  return (
    <div>
      {MOCKUPS.map((mockup) => (
        <button
          key={mockup.id}
          onClick={() => onMockupChange(mockup)}
        >
          {mockup.name}
        </button>
      ))}
    </div>
  );
}

// In parent component:
const handleMockupChange = (newMockup: Mockup) => {
  setMockup(newMockup);

  // Optionally clear canvas or adjust existing designs
  // clearCanvas(canvas);

  // Or preserve designs and update bounds
  if (canvas) {
    setupPrintAreaBounds(canvas, newMockup.printArea);
  }
};
```

**Undo/Redo Pattern**:
```typescript
function useCanvasHistory(canvas: fabric.Canvas | null) {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveState = () => {
    if (!canvas) return;
    const json = getCanvasAsJSON(canvas);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), json]);
    setHistoryIndex(prev => prev + 1);
  };

  const undo = async () => {
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1;
      await loadCanvasFromJSON(canvas, history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const redo = async () => {
    if (historyIndex < history.length - 1 && canvas) {
      const newIndex = historyIndex + 1;
      await loadCanvasFromJSON(canvas, history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  return { saveState, undo, redo, canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 };
}
```

---

#### Troubleshooting

**Issue: Canvas is blank after initialization**
- Ensure canvas element exists before calling `initializeCanvas()`
- Check that canvas width/height are positive numbers
- Verify canvas is visible in DOM (not `display: none`)

**Issue: Images not loading**
- Check CORS headers on image URLs
- Verify image URLs are accessible
- Use `crossOrigin: 'anonymous'` in `loadImageOntoCanvas()`
- Check browser console for CORS or 404 errors

**Issue: Objects can be dragged outside bounds**
- Ensure `constrainObjectToBounds()` is attached to `object:moving` event
- Verify print area coordinates are correct
- Check that event listener is not being removed prematurely

**Issue: Canvas state not persisting**
- Verify `getCanvasAsJSON()` is called before save
- Check that JSON string is being stored in database
- Ensure custom properties are included in `toJSON()` call
- Verify `loadCanvasFromJSON()` is awaited

**Issue: Exported images are low quality**
- Increase `multiplier` option (default: 2, try 3 or 4)
- Use `format: 'png'` for better quality than JPEG
- Set `quality: 1.0` for maximum quality
- Check source image resolution before export

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

**Bucket Name**: `designs`

```
designs/
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

The `designs` bucket has the following RLS policies:

**Upload Policy:**
```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  USING (
    bucket_id = 'designs' AND
    (storage.foldername(name))[1] = auth.uid()
  );
```

**Read Policy:**
```sql
-- Public read access to all design assets
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'designs');
```

**Delete Policy:**
```sql
-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'designs' AND
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

## API Routes

GenAI-Merch provides REST API endpoints for design studio operations.

### File Upload API

**Endpoint**: `POST /api/designs/upload`

Upload logo files to Supabase Storage with authentication and validation.

#### Request

**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Supabase session cookie)

**Body Parameters**:
- `file` (File, required): The image file to upload
  - Allowed types: PNG, JPG, JPEG
  - Max size: 5MB
  - MIME types: `image/png`, `image/jpeg`, `image/jpg`

#### Response

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "filePath": "user-abc123/logos/1702123456789-xyz789-logo.png",
    "publicUrl": "https://...supabase.co/storage/v1/object/public/design-assets/...",
    "fileName": "logo.png",
    "fileSize": 245678
  }
}
```

**Error (400 - Bad Request)**:
```json
{
  "success": false,
  "error": "No file provided"
}
```

**Error (401 - Unauthorized)**:
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

**Error (500 - Server Error)**:
```json
{
  "success": false,
  "error": "Upload failed: Storage bucket not found"
}
```

#### Error Messages

| Status | Error Message | Description |
|--------|---------------|-------------|
| 401 | `Not authenticated` | User is not signed in |
| 400 | `No file provided` | Request missing file field |
| 400 | `Invalid file type. Only PNG and JPG files are allowed` | File type not PNG/JPG |
| 400 | `File too large. Maximum size is 5MB` | File exceeds size limit |
| 500 | `Upload failed: {reason}` | Server-side upload error |

#### Example Usage

**JavaScript/TypeScript**:
```typescript
async function uploadLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/designs/upload', {
    method: 'POST',
    body: formData,
    // Cookies sent automatically by browser
  });

  const result = await response.json();

  if (result.success) {
    console.log('Uploaded to:', result.data.publicUrl);
    return result.data;
  } else {
    throw new Error(result.error);
  }
}
```

**cURL** (for testing):
```bash
# 1. Get auth token from browser (DevTools > Application > Cookies)
# Look for cookie starting with "sb-" containing "auth-token"

# 2. Upload file
curl -X POST http://localhost:3000/api/designs/upload \
  -H "Cookie: sb-{project-id}-auth-token={your-token}" \
  -F "file=@/path/to/your/logo.png"
```

#### Security Features

1. **Authentication**: Requires valid Supabase session
2. **File Type Validation**: Server-side MIME type and extension check
3. **File Size Validation**: Enforced 5MB limit
4. **Filename Sanitization**: Special characters removed, unique timestamps added
5. **User-Scoped Storage**: Files stored in user-specific folders (`{userId}/logos/`)
6. **No Overwrites**: Unique filenames prevent accidental overwrites

#### Rate Limiting

**Recommended Configuration**:
- **Limit**: 10 uploads per minute per user
- **Implementation**: Use middleware or Upstash Rate Limit
- **Headers**: Add `X-RateLimit-Limit`, `X-RateLimit-Remaining` headers

**Setup with Upstash** (optional):
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/designs/upload')) {
    const userId = await getUserId(request);
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      return new Response("Too many requests", { status: 429 });
    }
  }
}
```

#### Logging

All upload attempts are logged with:
- **User ID**: Authenticated user identifier
- **File name**: Original filename
- **File size**: In MB
- **Timestamp**: ISO 8601 format
- **Result**: Success or error message
- **Duration**: Upload time in milliseconds

**Example Log Output**:
```
[Upload] Request from user: abc123-def456-ghi789
[Upload] Starting upload - user: abc123-def456-ghi789, file: logo.png, size: 2.3MB
[Upload] Success - user: abc123-def456-ghi789, file: logo.png, path: abc123-def456-ghi789/logos/1702123456789-xyz789-logo.png, duration: 847ms
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

**Last Updated**: 2025-12-01 (Added Supabase Storage helpers for file upload, validation, and management)
