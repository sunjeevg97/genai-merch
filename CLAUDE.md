# GenAI-Merch Project Constitution

## Project Overview

GenAI-Merch is an AI-powered custom apparel design and group ordering platform that revolutionizes how teams, organizations, and groups create and order custom merchandise.

### Core Value Proposition
- **AI-Powered Design Generation**: Leverage Google Gemini Imagen 3 to generate custom apparel designs from text prompts
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

## Use Context7 by Default

Always use Context7 when you need:
- **Code generation** - Generate boilerplate, components, utilities, or full features
- **Setup or configuration steps** - Set up new libraries, configure tools, or initialize services
- **Library/API documentation** - Look up syntax, best practices, or API reference for dependencies

Context7 provides up-to-date, accurate information about libraries, frameworks, and APIs used in this project. Use it proactively before writing code to ensure you're following current best practices and using the correct syntax.

**When to use Context7:**
- ✅ Before implementing a new feature with unfamiliar libraries
- ✅ When setting up third-party integrations (Stripe, Printful, OpenAI)
- ✅ When uncertain about API syntax or parameters
- ✅ Before configuring build tools, linters, or development environment

**Example usage:**
```
User: "Add a new Stripe checkout flow"
Assistant: [Uses Context7 to look up latest Stripe API docs and best practices]
Assistant: [Generates code using current Stripe SDK syntax]
```

---

## Tech Stack

### Frontend
- **Next.js 14** with TypeScript (App Router)
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **Fabric.js** for interactive design canvas
- **Zustand** for state management
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
- **Google Gemini Imagen 3 API** - AI design generation
- **Replicate Real-ESRGAN API** - AI image upscaling for print preparation
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

#### Zustand (`zustand@^5.0.9`)
**Purpose:** Lightweight state management for React applications

**Use Cases:**
- Managing AI-first design wizard flow (5-step process)
- Global state for multi-step forms and wizards
- Sharing state across components without prop drilling
- Persisting user selections to localStorage
- DevTools integration for debugging state changes

**Installation:**
```bash
npm install zustand@^5.0.9
```

**Why Zustand over Redux/Context API:**
- **Simpler API:** No providers, actions, or reducers
- **Smaller bundle size:** ~1KB vs Redux's ~3KB
- **Better performance:** Only components using state re-render
- **Built-in persistence:** Easy localStorage integration
- **DevTools support:** Out-of-the-box debugging
- **TypeScript-first:** Excellent type inference

**Basic Usage:**
```typescript
import { create } from 'zustand';

interface BearStore {
  bears: number;
  increase: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}));

// In component
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears</h1>;
}
```

**Design Wizard Store (`lib/store/design-wizard.ts`):**

Our Zustand store manages the complete AI-first design wizard flow:

**State Shape:**
```typescript
{
  // Navigation
  currentStep: 1-5,           // Event Type → Products → Brand Assets → AI Chat → Canvas
  isComplete: boolean,         // Whether wizard is finished

  // Step 1: Event Type
  eventType: EventType | null, // 'charity' | 'fundraiser' | 'company' | 'sports' | 'school' | 'personal'

  // Step 2: Product Selection
  selectedProducts: string[],  // Array of product mockup IDs

  // Step 3: Brand Assets (Optional)
  brandAssets: {
    logos: string[],           // URLs of uploaded logos
    colors: string[],          // Brand colors in hex format
    fonts: string[],           // Font names or URLs
    voice: string              // Brand voice description
  },
  hasBrandAssets: boolean,     // Whether user uploaded any assets

  // Step 4: AI Design Generation
  generatedDesigns: [{
    id: string,
    imageUrl: string,          // DALL-E 3 generated image URL
    prompt: string,            // Original prompt
    createdAt: Date,
    isFavorite: boolean
  }],
  selectedDesignId: string | null,
  finalDesignUrl: string | null, // Design to apply to canvas
}
```

**Usage Example:**
```typescript
import { useDesignWizard } from '@/lib/store/design-wizard';

function EventTypeStep() {
  const { eventType, setEventType, nextStep } = useDesignWizard();

  return (
    <button onClick={() => {
      setEventType('charity');
      nextStep();
    }}>
      Select Charity Event
    </button>
  );
}
```

**When to Use Zustand vs React State:**

**Use Zustand for:**
- ✅ Wizard/multi-step form state that persists across steps
- ✅ Global app state (user preferences, shopping cart)
- ✅ State shared across multiple unrelated components
- ✅ State that needs localStorage persistence
- ✅ Complex state with many actions/updates

**Use React State (useState) for:**
- ✅ Component-local UI state (open/closed, hover, focus)
- ✅ Form field values (use with react-hook-form)
- ✅ Temporary state that doesn't need persistence
- ✅ State used by a single component and its children
- ✅ Simple toggle states

**Middleware Features:**

Our store uses two Zustand middleware:

1. **`persist`** - Auto-saves state to localStorage
   - Survives page refreshes
   - Allows users to resume where they left off
   - Only persists essential state (excludes UI state)

2. **`devtools`** - Redux DevTools integration
   - Time-travel debugging
   - State inspection
   - Action logging
   - Named as "DesignWizard" in DevTools

**Documentation:** https://github.com/pmndrs/zustand

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

## AI Prompt System

GenAI-Merch uses a sophisticated prompt building system to optimize interactions with OpenAI's GPT-4 (chat) and DALL-E 3 (image generation) APIs.

**Location**: `src/lib/ai/prompts.ts`

### Overview

The prompt system provides two main functions:
1. **Chat System Prompts** - Guide GPT-4 to act as a design assistant
2. **Image Generation Prompts** - Optimize DALL-E 3 to create print-ready merchandise designs

Both functions incorporate contextual information from the design wizard:
- Event type (charity, sports, company, etc.)
- Selected products (t-shirts, mugs, etc.)
- Brand assets (colors, fonts, voice)

### Core Functions

#### 1. `buildChatSystemPrompt()`

Creates a system prompt for GPT-4 to help users describe their design vision.

```typescript
import { buildChatSystemPrompt } from '@/lib/ai/prompts';

const systemPrompt = buildChatSystemPrompt({
  eventType: 'sports',
  products: ['tshirt', 'hoodie'],
  brandAssets: {
    colors: ['#FF0000', '#000000'],
    fonts: ['Roboto Bold'],
    voice: 'Bold and energetic',
    logos: []
  }
});

// Use with OpenAI Chat API
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]
});
```

**What it includes:**
- Role definition (design assistant)
- Event context (e.g., "sports team")
- Product context (e.g., "t-shirts and hoodies")
- Brand guidelines (colors, voice, fonts)
- Guidance on asking clarifying questions
- Instructions to gather design details

**Purpose**: The assistant helps users refine their ideas into clear design briefs that DALL-E 3 can execute.

---

#### 2. `buildImageGenerationPrompt()`

Creates an optimized prompt for DALL-E 3 to generate merchandise designs.

```typescript
import { buildImageGenerationPrompt } from '@/lib/ai/prompts';

const imagePrompt = buildImageGenerationPrompt(
  'A bold lion mascot with flames in the background',
  {
    eventType: 'sports',
    products: ['tshirt'],
    brandAssets: {
      colors: ['#FF0000', '#FFD700'],
      fonts: [],
      voice: 'Bold and energetic',
      logos: []
    }
  }
);

// Use with DALL-E 3
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: imagePrompt,
  size: '1024x1024',
  quality: 'hd',
  n: 1
});
```

**What it includes:**
- User's design description
- Event type context
- Product placement guidance
- Brand colors to incorporate
- Print-friendly design specifications
- Technical requirements (vector-style, high contrast, limited colors)

**Output**: A comprehensive prompt that produces designs optimized for merchandise printing.

---

#### 3. `buildRefinementPrompt()`

Creates a prompt for refining existing designs based on user feedback.

```typescript
import { buildRefinementPrompt } from '@/lib/ai/prompts';

const refinedPrompt = buildRefinementPrompt(
  'A bold lion mascot',
  'Make the lion more fierce and add lightning instead of flames',
  context
);

// Use with DALL-E 3 for iterations
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: refinedPrompt,
  size: '1024x1024'
});
```

**Use Case**: When users want to iterate on a design with specific changes.

---

#### 4. `getStarterPrompts()`

Returns contextual starter prompts based on event type.

```typescript
import { getStarterPrompts } from '@/lib/ai/prompts';

const starters = getStarterPrompts('charity');
// Returns:
// [
//   'Create a heart-centered design for our charity event',
//   'Design a compassionate logo that inspires giving',
//   'Make an uplifting design that represents hope and community'
// ]
```

**Use Case**: Help users get started if they're not sure what to create.

---

### Design Context Interface

All prompt functions accept a `DesignContext` object:

```typescript
interface DesignContext {
  eventType: EventType | null;  // 'charity' | 'fundraiser' | 'company' | 'sports' | 'school' | 'personal'
  products: string[];            // ['tshirt', 'mug', 'hat', etc.]
  brandAssets?: {
    colors: string[];            // ['#FF5733', '#3498DB']
    fonts: string[];             // ['Roboto', 'Open Sans']
    voice: string;               // 'Fun and playful'
    logos: string[];             // ['https://...']
  };
}
```

---

### When to Use Each Function

#### Use `buildChatSystemPrompt()` when:
- ✅ Creating a conversational design assistant
- ✅ Helping users describe their vision
- ✅ Asking clarifying questions
- ✅ Refining ideas before generation
- ✅ Providing design suggestions

**Example Flow**:
```
User: "I need something for our team"
Assistant (GPT-4): "I'd love to help! Since this is for a sports team,
                    should the design include your team mascot or logo?
                    What colors should I focus on?"
```

#### Use `buildImageGenerationPrompt()` when:
- ✅ User is ready to generate a design
- ✅ Converting user's vision to image
- ✅ Creating initial design concepts
- ✅ Generating multiple variations

**Example**:
```
User description: "Bold lion with flames"
→ DALL-E 3 prompt: "Bold lion with flames. Design style: Clean, vector-style
                    illustration suitable for merchandise printing. Context:
                    This design is for a sports team. Color palette: #FF0000,
                    #FFD700. High contrast, bold lines..."
```

#### Use `buildRefinementPrompt()` when:
- ✅ User wants to modify existing design
- ✅ Iterating based on feedback
- ✅ Fine-tuning specific elements

**Example**:
```
Original: "Bold lion mascot"
Feedback: "Make it more fierce, add lightning"
→ Refined prompt: "Based on this design: 'Bold lion mascot'
                   Make these changes: Make it more fierce, add lightning..."
```

#### Use `getStarterPrompts()` when:
- ✅ User lands on AI chat step
- ✅ Showing contextual suggestions
- ✅ Helping overcome blank canvas syndrome

---

### Usage in AI Chat Step

The AI Chat Step component uses these prompts like this:

```typescript
import {
  buildChatSystemPrompt,
  buildImageGenerationPrompt,
  getStarterPrompts
} from '@/lib/ai/prompts';
import { useDesignWizard } from '@/lib/store/design-wizard';

function AiChatStep() {
  const { eventType, selectedProducts, brandAssets } = useDesignWizard();

  // Build context once
  const context = {
    eventType,
    products: selectedProducts,
    brandAssets
  };

  // Get system prompt for chat
  const systemPrompt = buildChatSystemPrompt(context);

  // Show starter prompts
  const starters = getStarterPrompts(eventType);

  // When user describes design
  async function handleChatMessage(userMessage: string) {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        systemPrompt,
        userMessage
      })
    });
  }

  // When user is ready to generate
  async function handleGenerateDesign(userPrompt: string) {
    const imagePrompt = buildImageGenerationPrompt(userPrompt, context);

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: imagePrompt })
    });
  }
}
```

---

### Prompt Engineering Best Practices

**For Chat Prompts:**
1. Provide clear role definition
2. Include all relevant context
3. Give specific guidelines
4. Encourage clarifying questions
5. Focus on gathering details

**For Image Generation:**
1. Start with user's description
2. Add merchandise-specific requirements
3. Specify print-friendly characteristics
4. Include brand colors explicitly
5. Request appropriate style (vector, high contrast)
6. Avoid photorealistic or complex gradients

**Technical Specifications for Print:**
- "Vector-style illustration"
- "High contrast, bold lines"
- "Limited color palette"
- "Simple shapes for screen printing"
- "No photorealistic details"
- "No gradients or overly complex patterns"

---

### Modifying Prompts

To customize prompts for your use case:

**1. Update event type descriptions:**
```typescript
// In prompts.ts
const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  charity: 'charity event, fundraiser, or non-profit organization',
  sports: 'sports team, tournament, league, or athletic event',
  // Add or modify event types
};
```

**2. Adjust product descriptions:**
```typescript
const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  tshirt: 'centered on the front of a t-shirt',
  mug: 'wrapping around a coffee mug',
  // Add or modify product types
};
```

**3. Change technical requirements:**
```typescript
// In buildImageGenerationPrompt()
sections.push(
  'Technical requirements: ' +
  'Simple shapes that work well for screen printing. ' +
  'Custom requirement here...'
);
```

**4. Update guidelines:**
```typescript
// In buildChatSystemPrompt()
sections.push(
  '\n\nGUIDELINES:\n' +
  '- Your custom guideline\n' +
  '- Another guideline\n'
);
```

---

### Testing Prompts

**Test different event types:**
```typescript
const contexts = [
  { eventType: 'charity', products: ['tshirt'] },
  { eventType: 'sports', products: ['hoodie'] },
  { eventType: 'company', products: ['mug'] }
];

contexts.forEach(ctx => {
  const prompt = buildChatSystemPrompt(ctx);
  console.log('Prompt for', ctx.eventType, ':', prompt);
});
```

**Test with/without brand assets:**
```typescript
// Without brand assets
const prompt1 = buildImageGenerationPrompt('Bold lion', {
  eventType: 'sports',
  products: ['tshirt']
});

// With brand assets
const prompt2 = buildImageGenerationPrompt('Bold lion', {
  eventType: 'sports',
  products: ['tshirt'],
  brandAssets: {
    colors: ['#FF0000', '#FFD700'],
    voice: 'Bold and energetic',
    fonts: [],
    logos: []
  }
});

// Compare outputs
console.log('Without assets:', prompt1);
console.log('With assets:', prompt2);
```

---

### Common Patterns

**Chat → Generate Flow:**
```typescript
// 1. User starts chat
const systemPrompt = buildChatSystemPrompt(context);
const chatResponse = await gpt4Chat(systemPrompt, userMessage);

// 2. User is ready to generate
const imagePrompt = buildImageGenerationPrompt(refinedIdea, context);
const imageResponse = await dalleGenerate(imagePrompt);

// 3. User wants to refine
const refinedPrompt = buildRefinementPrompt(imagePrompt, feedback, context);
const refinedImage = await dalleGenerate(refinedPrompt);
```

**Starter Prompts UI:**
```tsx
const starters = getStarterPrompts(eventType);

return (
  <div>
    <p>Try these prompts:</p>
    {starters.map((prompt, i) => (
      <button key={i} onClick={() => setUserPrompt(prompt)}>
        {prompt}
      </button>
    ))}
  </div>
);
```

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

### Typography
- **Geometric Contrast** - Bold headings with friendly body text
  - **Display/Headings**: Space Grotesk (600-700 weight)
  - **Body Text**: DM Sans (400-500 weight)
  - **Code/Mono**: Geist Mono
- **Implementation**:
  - Fonts loaded via `next/font/google` in `src/app/layout.tsx`
  - Global font hierarchy in `src/app/globals.css` using CSS custom properties
  - Headings automatically use Space Grotesk with `-0.01em` letter-spacing
  - Body text uses DM Sans for readability
- **Typography Scale**: 12-level semantic scale from Display Large (64px) to Overline (12px)
- **Performance**: Automatic font subsetting and preloading via Next.js optimization
- **Why this pairing**:
  - Space Grotesk provides bold, distinctive character for headings
  - DM Sans offers warm, approachable readability for long-form content
  - Shared x-heights ensure visual harmony while maintaining contrast
- **Preview**: View all typography options at `/theme-preview`

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

## Shopping Cart System

GenAI-Merch uses Zustand for client-side cart state management with localStorage persistence. The cart supports custom designs, quantity management, and real-time price calculations.

### Cart Architecture

**Location**: `src/lib/cart/store.ts`

**State Management**: Zustand with persist middleware

**Key Features**:
- Client-side state management with localStorage persistence
- Real-time subtotal and item count calculations
- Support for custom designs on products
- Quantity controls with validation (1-99 items)
- Duplicate detection (same variant + design)
- Cart drawer state management

### Cart Store Structure

```typescript
interface CartItem {
  id: string;                    // Temporary UI ID (auto-generated)
  productVariantId: string;      // Database ProductVariant ID
  product: {
    name: string;                // Product name
    imageUrl: string;            // Product image
    productType: string;         // e.g., "t-shirt", "mug"
  };
  variant: {
    name: string;                // Variant name (e.g., "Medium / Black")
    size: string | null;         // Size (e.g., "Medium", "Large")
    color: string | null;        // Color (e.g., "Black", "White")
  };
  design: {
    id: string;                  // Design database ID
    imageUrl: string;            // Full design image URL
    thumbnailUrl?: string;       // Optional thumbnail
  } | null;                      // Null for non-custom products
  quantity: number;              // Item quantity (1-99)
  unitPrice: number;             // Price per item in cents
}

interface CartStore {
  // State
  items: CartItem[];             // All cart items
  isOpen: boolean;               // Cart drawer open/closed

  // Computed Values (auto-calculated)
  subtotal: number;              // Sum of all item totals (cents)
  itemCount: number;             // Sum of all quantities

  // Actions
  addItem(item);                 // Add item to cart
  removeItem(itemId);            // Remove item from cart
  updateQuantity(itemId, qty);   // Update item quantity
  clearCart();                   // Remove all items
  openCart();                    // Open cart drawer
  closeCart();                   // Close cart drawer
}
```

### Usage Patterns

#### Adding Items to Cart

```typescript
'use client';

import { useCart } from '@/lib/cart/store';

function ProductPage({ product, variant }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      productVariantId: variant.id,
      product: {
        name: product.name,
        imageUrl: product.imageUrl,
        productType: product.productType,
      },
      variant: {
        name: variant.name,
        size: variant.size,
        color: variant.color,
      },
      design: null, // or { id, imageUrl, thumbnailUrl } for custom designs
      quantity: 1,
      unitPrice: variant.price, // in cents
    });
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

#### Using Cart State

```typescript
import { useCart } from '@/lib/cart/store';

function CartButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button onClick={openCart}>
      Cart ({itemCount})
    </button>
  );
}
```

#### Optimized Selectors

```typescript
import {
  useCartItems,
  useCartSubtotal,
  useCartItemCount,
  useCartIsOpen
} from '@/lib/cart/store';

// Only re-renders when items change
const items = useCartItems();

// Only re-renders when subtotal changes
const subtotal = useCartSubtotal();

// Only re-renders when item count changes
const itemCount = useCartItemCount();

// Only re-renders when drawer state changes
const isOpen = useCartIsOpen();
```

### Cart Persistence

**Storage Key**: `genai-merch-cart`

**Persisted Data**: Only `items` array is persisted to localStorage

**Computed Values**: `subtotal` and `itemCount` are recalculated on app load

**Rehydration**:
```typescript
onRehydrateStorage: () => (state) => {
  if (state) {
    state.subtotal = state._calculateSubtotal();
    state.itemCount = state._calculateItemCount();
  }
}
```

**Why Persist Only Items?**
- UI state (`isOpen`) should not persist across sessions
- Computed values (`subtotal`, `itemCount`) are derived from items
- Smaller localStorage footprint
- Prevents stale computed values

### Cart Page Components

#### Cart Item (`components/cart/cart-item.tsx`)

Displays individual cart item with:
- Product/design image with "Custom" badge
- Product name and variant details (size, color)
- Quantity controls (+/- buttons, input field)
- Price per item and total price
- Remove button
- Mobile-responsive layout

**Features**:
- Quantity validation (1-99)
- Responsive price display (desktop vs mobile)
- Image fallback for missing images
- Custom design badge overlay

#### Cart Summary (`components/cart/cart-summary.tsx`)

Shows order summary:
- Item count and subtotal
- Shipping estimate (calculated at checkout)
- Tax estimate (calculated at checkout)
- Disclaimer about final costs
- Sticky positioning (desktop)

#### Checkout Button (`components/cart/checkout-button.tsx`)

Handles checkout initiation:
- Disabled when cart is empty
- Loading state during processing
- Error handling with toast notifications
- Future: Stripe checkout integration

### Cart Page (`app/cart/page.tsx`)

**Features**:
- Empty state with CTA buttons
- Item list with quantity controls
- Cart summary sidebar (desktop)
- Mobile-optimized layout (sticky summary at bottom)
- Continue shopping link
- Real-time price calculations

**Empty State**:
- Friendly illustration with PackageOpen icon
- "Your cart is empty" message
- Two CTAs: "Start Designing" and "Browse Products"
- Links to `/design` and `/products`

**Layout**:
- Desktop: 2-column grid (items left, summary right)
- Mobile: Single column, summary at bottom
- Responsive breakpoint: `lg:` (1024px)

### Duplicate Item Detection

When adding items to cart, the store checks if an identical item already exists:

```typescript
const existingItemIndex = items.findIndex(
  (i) =>
    i.productVariantId === item.productVariantId &&
    i.design?.id === item.design?.id
);

if (existingItemIndex >= 0) {
  // Increase quantity of existing item
  newItems = items.map((i, index) =>
    index === existingItemIndex
      ? { ...i, quantity: i.quantity + item.quantity }
      : i
  );
} else {
  // Add as new item
  newItems = [...items, { ...item, id: generateCartItemId() }];
}
```

**Logic**:
- Same variant + same design = increase quantity
- Same variant + different design = separate items
- Different variant = separate items

### Price Calculations

**Unit Price**: Always stored in cents (e.g., `2299` = $22.99)

**Item Total**: `unitPrice × quantity`

**Subtotal**: Sum of all item totals
```typescript
_calculateSubtotal: () => {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
```

**Display Formatting**:
```typescript
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

### Best Practices

**1. Always Use Store Actions**
```typescript
// ✅ Good
const { addItem, removeItem } = useCart();
addItem(newItem);

// ❌ Bad - Never mutate state directly
const { items } = useCart();
items.push(newItem); // This won't work!
```

**2. Use Optimized Selectors**
```typescript
// ✅ Good - Only re-renders when itemCount changes
const itemCount = useCartItemCount();

// ❌ Less optimal - Re-renders on any store change
const { itemCount } = useCart();
```

**3. Handle Edge Cases**
```typescript
// Check if cart is empty before checkout
if (itemCount === 0) {
  toast.error('Your cart is empty');
  return;
}

// Validate quantity before updating
const clampedQuantity = Math.max(1, Math.min(99, newQuantity));
updateQuantity(itemId, clampedQuantity);
```

**4. Provide User Feedback**
```typescript
import { toast } from 'sonner';

const handleAddToCart = () => {
  addItem(newItem);
  toast.success('Added to cart', {
    description: `${product.name} has been added to your cart.`,
  });
};
```

### Future Enhancements

**Cart Drawer**:
- Slide-out drawer component (instead of full page)
- Quick add/remove without leaving current page
- Mini cart preview in header

**Cart Recovery**:
- Email abandoned cart reminders
- Save cart to user account (database)
- Sync cart across devices

**Advanced Features**:
- Bulk discounts (e.g., 10+ items = 10% off)
- Promo codes and coupons
- Gift wrapping options
- Estimated delivery dates

**Checkout Integration**:
- Stripe Checkout session creation
- Printful order submission
- Order confirmation emails

### Troubleshooting

**Cart Not Persisting**:
- Check localStorage quota (usually 5-10MB)
- Verify `genai-merch-cart` key in localStorage
- Check browser console for errors

**Subtotal Incorrect**:
- Prices must be in cents (not dollars)
- Verify `unitPrice` is a number, not string
- Check for floating-point precision errors

**Items Duplicating**:
- Ensure `productVariantId` is consistent
- Check `design?.id` comparison logic
- Verify `generateCartItemId()` creates unique IDs

**Quantity Validation Not Working**:
- Input type must be "number"
- Use `parseInt()` when reading input value
- Clamp values to 1-99 range

---

## Stripe Checkout Integration

GenAI-Merch uses Stripe Checkout for secure payment processing. The checkout flow creates orders in the database with PENDING_PAYMENT status, generates a Stripe checkout session with automatic tax calculation and shipping options, and redirects users to Stripe's hosted checkout page.

### Checkout Flow Overview

**Complete User Journey**:
1. User adds items to cart (with optional custom designs)
2. User navigates to checkout step in wizard or `/cart` page
3. User reviews order summary (items, estimated shipping, estimated tax)
4. User clicks "Proceed to Payment"
5. System creates Order in database with PENDING_PAYMENT status
6. System creates Stripe Checkout Session with order metadata
7. User redirects to Stripe Checkout (hosted page)
8. User enters shipping address and selects shipping method
9. User enters payment information
10. Stripe processes payment and calculates final shipping + tax
11. User redirects to success page with order confirmation
12. Cart is automatically cleared
13. Order status updates via Stripe webhooks (future)

**Key Architecture Components**:
- `POST /api/stripe/create-checkout` - Creates checkout session and order
- `GET /api/stripe/session/[sessionId]` - Retrieves session details for success page
- `src/lib/stripe/client.ts` - Client-side Stripe helpers
- `src/components/design/steps/checkout-step.tsx` - Checkout review page
- `src/app/checkout/success/page.tsx` - Order confirmation page

### Order Lifecycle

**Order Status Flow**:
```
PENDING_PAYMENT → PAID → SUBMITTED_TO_POD → IN_PRODUCTION → SHIPPED → DELIVERED
     ↓              ↓
 CANCELLED     REFUNDED
```

**Status Definitions**:
- `PENDING_PAYMENT`: Order created, awaiting Stripe payment
- `PAID`: Payment confirmed by Stripe (via webhook)
- `SUBMITTED_TO_POD`: Order submitted to Printful for fulfillment
- `IN_PRODUCTION`: Printful is manufacturing the order
- `SHIPPED`: Order shipped, tracking number available
- `DELIVERED`: Order delivered to customer
- `CANCELLED`: Order cancelled before payment or fulfillment
- `REFUNDED`: Payment refunded after completion

**Order Metadata**:
- `orderNumber`: Unique identifier (format: ORD-YYYYMMDD-XXXX)
- `stripeCheckoutSessionId`: Stripe session ID for tracking
- `stripePaymentIntentId`: Stripe payment intent (set by webhook)
- `printfulOrderId`: Printful order ID (set when submitted)
- Pricing: `subtotal`, `shipping`, `tax`, `total` (all in cents)
- Timestamps: `createdAt`, `paidAt`, `shippedAt`, `deliveredAt`

### Stripe Checkout API Route

**Location**: `src/app/api/stripe/create-checkout/route.ts`

**Request** (`POST /api/stripe/create-checkout`):
```json
{
  "items": [
    {
      "id": "cart-item-id",
      "productVariantId": "variant-uuid",
      "product": {
        "name": "Bella Canvas 3001 T-Shirt",
        "imageUrl": "https://...",
        "productType": "t-shirt"
      },
      "variant": {
        "name": "Medium / Black",
        "size": "M",
        "color": "Black"
      },
      "design": {
        "id": "design-uuid",
        "imageUrl": "https://...",
        "thumbnailUrl": "https://..."
      },
      "mockupConfig": {
        "mockupUrl": "https://printful-mockup.jpg",
        "technique": "dtg",
        "placement": "front",
        "styleId": 123,
        "styleName": "Men's T-Shirt"
      },
      "quantity": 2,
      "unitPrice": 2299
    }
  ],
  "successUrl": "https://example.com/checkout/success",
  "cancelUrl": "https://example.com/cart"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_...",
  "sessionUrl": "https://checkout.stripe.com/c/pay/...",
  "orderId": "order-uuid",
  "orderNumber": "ORD-20260102-ABCD"
}
```

**Processing Steps**:
1. **Validate Request**: Zod schema validation for all fields
2. **Check Stock**: Verify all product variants are in stock
3. **Verify Prices**: Security check - ensure prices haven't changed
4. **Calculate Totals**: Sum all item prices (shipping/tax calculated by Stripe)
5. **Generate Order Number**: Unique format ORD-YYYYMMDD-XXXX
6. **Create Order**: Insert into database with PENDING_PAYMENT status
7. **Create Stripe Session**: With shipping options, automatic tax, line items
8. **Update Order**: Store Stripe session ID
9. **Log Status**: Create OrderStatusHistory entry
10. **Return Response**: Session ID and URL for redirect

**Stripe Session Configuration**:
- **Mode**: `payment` (one-time payment)
- **Line Items**: Product name, variant, price, quantity, custom design info
- **Shipping Address Collection**: Enabled for 8 countries (US, CA, GB, etc.)
- **Shipping Options**:
  - Standard: $5.99 (5-10 business days)
  - Express: $12.99 (2-3 business days)
- **Automatic Tax**: Enabled (Stripe calculates based on shipping address)
- **Payment Intent Metadata**: `order_id`, `order_number`, `user_id`
- **Session Expiration**: 30 minutes
- **Idempotency Key**: `checkout_{order_id}` (prevents duplicate sessions)

**Error Handling**:
- `400 Bad Request`: Invalid input, product not found, out of stock, price mismatch
- `404 Not Found`: Product variant not found in database
- `500 Internal Server Error`: Stripe API error, database error

### Stripe Client Helpers

**Location**: `src/lib/stripe/client.ts`

**Functions**:

1. **`getStripe()`** - Singleton Stripe.js instance
   ```typescript
   const stripe = await getStripe();
   ```

2. **`createCheckoutSession(request)`** - Create checkout session
   ```typescript
   const { sessionId, sessionUrl, orderId, orderNumber } =
     await createCheckoutSession({ items });
   ```

3. **`redirectToCheckout(sessionUrl)`** - Redirect to Stripe Checkout
   ```typescript
   await redirectToCheckout(sessionUrl);
   // Redirects user to Stripe's hosted checkout page
   ```

4. **`retrieveCheckoutSession(sessionId)`** - Get session details
   ```typescript
   const data = await retrieveCheckoutSession(sessionId);
   // Returns { session, order } with full details
   ```

5. **`formatPrice(cents)`** - Format cents to currency string
   ```typescript
   formatPrice(2299); // "$22.99"
   ```

### Session Retrieval API Route

**Location**: `src/app/api/stripe/session/[sessionId]/route.ts`

**Request** (`GET /api/stripe/session/{sessionId}`):
```
GET /api/stripe/session/cs_test_abc123
```

**Response**:
```json
{
  "session": {
    "id": "cs_test_abc123",
    "status": "complete",
    "amount_total": 3498,
    "currency": "usd",
    "customer_email": "user@example.com",
    "customer_name": "John Doe",
    "shipping": {
      "amount": 599,
      "name": "standard_shipping"
    },
    "shipping_details": {
      "name": "John Doe",
      "address": {
        "line1": "123 Main St",
        "line2": null,
        "city": "Los Angeles",
        "state": "CA",
        "postal_code": "90001",
        "country": "US"
      }
    },
    "tax": 199
  },
  "order": {
    "id": "order-uuid",
    "orderNumber": "ORD-20260102-ABCD",
    "status": "PENDING_PAYMENT",
    "subtotal": 2299,
    "shipping": 599,
    "tax": 199,
    "total": 3097,
    "currency": "USD",
    "createdAt": "2026-01-02T10:30:00Z",
    "items": [
      {
        "id": "item-uuid",
        "productName": "Bella Canvas 3001 T-Shirt",
        "variantName": "Medium / Black",
        "quantity": 1,
        "unitPrice": 2299,
        "thumbnailUrl": "https://mockup.jpg",
        "customization": {
          "technique": "dtg",
          "placement": "front",
          "mockupUrl": "https://...",
          "designUrl": "https://..."
        }
      }
    ],
    "shippingAddress": {
      "name": "John Doe",
      "address1": "123 Main St",
      "city": "Los Angeles",
      "stateCode": "CA",
      "zip": "90001",
      "countryCode": "US"
    }
  }
}
```

**Purpose**: Used by success page to display order confirmation with accurate shipping and tax amounts calculated by Stripe.

### Checkout Step Component

**Location**: `src/components/design/steps/checkout-step.tsx`

**Features**:
- **Order Review**: Display all cart items with images, variants, quantities
- **Mockup Preview**: Show generated mockups if available
- **Price Breakdown**: Subtotal, estimated shipping, estimated tax, total
- **Shipping Info**: Collected during Stripe Checkout (not on this page)
- **Secure Badge**: "Secure payment processing powered by Stripe"
- **What's Next Card**: Expected timeline for order fulfillment

**User Flow**:
1. User clicks "Proceed to Payment" button
2. Button shows "Processing..." loading state
3. `createCheckoutSession()` called with cart items
4. Toast notification: "Redirecting to checkout... Order {number} created"
5. `redirectToCheckout(sessionUrl)` redirects to Stripe
6. User completes payment on Stripe's hosted page
7. Stripe redirects to `/checkout/success?session_id={id}`

**Error Handling**:
- Empty cart: Show error toast, don't proceed
- API errors: Show toast with error message, re-enable button
- Network errors: Show generic "Please try again" message

### Success Page

**Location**: `src/app/checkout/success/page.tsx`

**Features**:
- **Success Icon**: Green checkmark with confirmation message
- **Order Number**: Display prominent order number
- **Order Items**: List of all purchased items with images
- **Shipping Address**: Customer's shipping destination
- **Price Breakdown**: Final subtotal, shipping, tax, total (from Stripe)
- **Action Buttons**: "Continue Shopping" and "Track Order"
- **Email Confirmation Notice**: Assurance email is sent

**Data Flow**:
1. Extract `session_id` from URL query params
2. Call `/api/stripe/session/{sessionId}` to get full details
3. Display order information from database + Stripe session
4. **Clear cart** using `clearCart()` from Zustand store
5. Show success toast notification
6. If session_id missing or API fails, show error state

**Error States**:
- **No Session ID**: "Please complete checkout first"
- **Order Not Found**: "Order not found in database"
- **API Error**: "Failed to load order details"
- All errors show "Continue Shopping" button

### Integration Patterns

**Pattern 1: Create Session + Redirect**
```typescript
// In checkout component
const handleCheckout = async () => {
  const { sessionUrl, orderNumber } = await createCheckoutSession({ items });
  toast.success(`Order ${orderNumber} created`);
  await redirectToCheckout(sessionUrl);
};
```

**Pattern 2: Retrieve Session on Success Page**
```typescript
// In success page
useEffect(() => {
  const sessionId = searchParams.get('session_id');
  const { session, order } = await retrieveCheckoutSession(sessionId);
  setOrderDetails(order);
  clearCart(); // Clear cart after successful order
}, []);
```

**Pattern 3: Guest Checkout Support**
```typescript
// API route handles both authenticated and guest users
const user = await getUser(); // May be null
const userId = user?.id || undefined;

// Order created with optional user relation
const orderData: any = { /* ... */ };
if (userId) {
  orderData.user = { connect: { id: userId } };
}
const order = await prisma.order.create({ data: orderData });
```

### Security Measures

**1. Price Verification**:
```typescript
// Verify client-sent prices match database prices
if (variant.price !== item.unitPrice) {
  return NextResponse.json({
    error: 'Price mismatch',
    message: 'Price has changed. Please refresh your cart.'
  }, { status: 400 });
}
```

**2. Stock Validation**:
```typescript
// Check inventory before creating order
if (!variant.inStock) {
  return NextResponse.json({
    error: 'Product out of stock'
  }, { status: 400 });
}
```

**3. Idempotency**:
```typescript
// Prevent duplicate checkout sessions
const session = await stripe.checkout.sessions.create(
  { /* ... */ },
  { idempotencyKey: `checkout_${order.id}` }
);
```

**4. Input Validation**:
```typescript
// Zod schema validation on all API inputs
const validation = checkoutRequestSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({
    error: 'Invalid request',
    details: validation.error.issues
  }, { status: 400 });
}
```

**5. Metadata Tracking**:
```typescript
// Store order ID in Stripe for reconciliation
metadata: {
  order_id: order.id,
  order_number: orderNumber,
  user_id: userId || 'guest'
}
```

### Testing Checklist

**Complete Checkout Flow**:
- [ ] Add items to cart (authenticated user)
- [ ] Add items to cart (guest user)
- [ ] Navigate to checkout step
- [ ] Verify order summary displays correctly
- [ ] Click "Proceed to Payment"
- [ ] Verify redirect to Stripe Checkout
- [ ] Complete test payment with Stripe test card: `4242 4242 4242 4242`
- [ ] Verify redirect to success page with correct order details
- [ ] Verify cart is cleared after successful checkout
- [ ] Verify order exists in database with PENDING_PAYMENT status
- [ ] Verify OrderStatusHistory entry created

**Error Scenarios**:
- [ ] Empty cart → Cannot proceed to checkout
- [ ] Out of stock product → Error message shown
- [ ] Price mismatch → Error message shown
- [ ] Network error → User-friendly error message
- [ ] Cancel payment on Stripe → Redirect to `/cart`, order remains PENDING
- [ ] Invalid session_id on success page → Error state shown

**Edge Cases**:
- [ ] Multiple items with different variants
- [ ] Items with custom designs + mockups
- [ ] Items without custom designs
- [ ] Guest checkout (no user account)
- [ ] Expired Stripe session (30 min timeout)
- [ ] Browser back button from Stripe checkout page

**Database Verification**:
```sql
-- Verify order created correctly
SELECT * FROM "Order" WHERE "orderNumber" = 'ORD-20260102-ABCD';

-- Check order items
SELECT * FROM "OrderItem" WHERE "orderId" = 'order-uuid';

-- Verify status history
SELECT * FROM "OrderStatusHistory"
WHERE "orderId" = 'order-uuid'
ORDER BY "createdAt" DESC;
```

### Future Enhancements

**Stripe Webhooks** (High Priority):
- Listen for `checkout.session.completed` event
- Update Order status to PAID when payment succeeds
- Save shipping address from Stripe to database
- Update order totals with final shipping + tax amounts
- Send order confirmation email via Resend
- Submit order to Printful for fulfillment

**Order Tracking**:
- `/orders/[orderId]` page showing real-time status
- Printful webhook integration for status updates
- Email notifications for status changes
- Tracking number display with carrier links

**Advanced Features**:
- Save payment methods for faster checkout
- Address book for returning customers
- Order history page showing all past orders
- Reorder functionality (add previous order to cart)
- Gift options and messages
- Discount codes and promotions

### Troubleshooting

**Issue: "Stripe failed to load"**
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in `.env.local`
- Verify environment variable starts with `pk_test_` or `pk_live_`
- Clear browser cache and reload

**Issue: "Failed to create checkout session"**
- Check `STRIPE_SECRET_KEY` is set in server environment
- Verify API version matches: `2025-12-15.clover`
- Check server logs for detailed Stripe error messages
- Verify product variants have valid printfulVariantId

**Issue: Order created but payment not processing**
- This is expected - order is created BEFORE payment
- Status will be PENDING_PAYMENT until Stripe webhook confirms payment
- Future webhook integration will update status to PAID

**Issue: Cart not clearing after successful checkout**
- Verify `clearCart()` is called in success page useEffect
- Check browser console for JavaScript errors
- Ensure Zustand store is properly initialized
- Try clearing localStorage: `localStorage.removeItem('genai-merch-cart')`

**Issue: Success page shows "Order Not Found"**
- Verify session_id is in URL query params
- Check order was created in database (query by session ID)
- Verify `/api/stripe/session/[sessionId]` route is working
- Check server logs for database errors

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
- Browse products page with responsive grid layout
- Filter by category (apparel, accessories, home-living)
- Sort by price, featured, newest
- Server-side rendering with Suspense streaming
- Empty state with one-click product sync
- Product cards with images, pricing, badges
- SEO-optimized with proper meta tags
- Synced with Printful product catalog
- Product variants (sizes, colors)
- Pricing with markup configuration (2x + .99)

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

**IMPORTANT**: GenAI-Merch uses **Clerk** for authentication and **Supabase** for database/storage only.

- **Authentication Provider**: Clerk (embedded components, OAuth, webhooks)
- **Database**: Supabase PostgreSQL via Prisma ORM
- **User Sync**: Clerk webhooks sync users to Supabase `User` table with `clerkId` field

### Clerk + Supabase Architecture

```
Clerk (Auth Provider)
    ↓ user.created/user.updated events (Primary Path)
Webhook (/api/webhooks/clerk)
    ↓ creates/updates
Supabase User Table (via Prisma)
    ↓ user.id used in
Designs, Orders, Carts, etc.

────────────────────────────────────────
Fallback Path (if webhook delayed/fails):
Clerk (Auth Provider)
    ↓ API request with clerkUserId
getSupabaseUser(clerkUserId)
    ↓ user not found → fetch from Clerk API
    ↓ auto-create in database
Supabase User Table (via Prisma)
```

### Auto-Sync Fallback Mechanism

**Problem**: Webhooks can be delayed or fail, causing "User not found in database" errors when users try to use the app immediately after signup.

**Solution**: The `getSupabaseUser()` helper automatically creates users on-demand by fetching data from Clerk API.

**How It Works**:

1. **Check database first**: `prisma.user.findUnique({ where: { clerkId } })`
2. **If user doesn't exist**: Fetch user details from Clerk API via `clerkClient().users.getUser(clerkUserId)`
3. **Extract user data**: Email (primary), firstName, lastName
4. **Create in database**: `prisma.user.create({ clerkId, email, name })`
5. **Return user**: Ready for immediate use

**Code Example** (`@/lib/clerk/server`):
```typescript
export async function getSupabaseUser(clerkUserId: string) {
  // Check database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  // Auto-create if missing (webhook fallback)
  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);

    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
      },
    });
  }

  return user;
}
```

**Benefits**:
- ✅ **Zero downtime**: Users can use the app immediately after signup
- ✅ **Resilient**: Works even if webhooks fail or are delayed
- ✅ **Transparent**: Users never see "User not found" errors
- ✅ **Idempotent**: Safe to call multiple times (checks database first)

**When to Use**:
- All API routes that need database user records
- Server components that display user data
- Background jobs that operate on user data

**Best Practices**:
- Always use `getSupabaseUser()` instead of direct Prisma queries for Clerk users
- Webhook remains the primary sync mechanism (event-driven, instant)
- Auto-sync is a defensive fallback (on-demand, reliable)

### Authentication Patterns

#### Client Components (useAuth Hook)

```tsx
'use client'
import { useAuth } from '@clerk/nextjs'

export default function MyComponent() {
  const { userId, isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>
  }

  return <div>User ID: {userId}</div>
}
```

**Key Points**:
- `userId` is the Clerk user ID (matches `clerkId` in database)
- `isLoaded` indicates auth state is ready
- `isSignedIn` is true when user is authenticated
- No async operations needed - hook provides immediate access

#### Server Components (auth Function)

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/signin')
  }

  // Get full user data from database
  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  return <div>Welcome {user?.email}</div>
}
```

**Helper Function** (`@/lib/clerk/server`):
```tsx
import { requireClerkAuth } from '@/lib/clerk/server'

export default async function ProtectedPage() {
  const clerkUserId = await requireClerkAuth()
  // Guaranteed to be authenticated (redirects if not)

  const user = await getSupabaseUser(clerkUserId)
  return <div>Welcome {user?.email}</div>
}
```

#### API Routes (auth Function)

```tsx
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Supabase user for database operations
  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Use user.id for database operations
  const design = await prisma.design.create({
    data: {
      userId: user.id,
      name: 'My Design',
      // ...
    }
  })

  return NextResponse.json({ design })
}
```

### Clerk Components

#### SignIn Component
```tsx
// src/app/(auth)/signin/[[...signin]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          }
        }}
      />
    </div>
  )
}
```

**IMPORTANT**: Auth pages must use catch-all routes `[[...param]]` for Clerk's multi-step flows.

#### SignUp Component
```tsx
// src/app/(auth)/signup/[[...signup]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          }
        }}
      />
    </div>
  )
}
```

#### UserButton Component
```tsx
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Navbar() {
  return (
    <header>
      <SignedOut>
        <Button asChild>
          <Link href="/signin">Sign In</Link>
        </Button>
      </SignedOut>

      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-10 h-10"
            }
          }}
        />
      </SignedIn>
    </header>
  )
}
```

### Middleware Route Protection

**Location**: `src/middleware.ts` (must be in `src/` directory)

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/design(.*)',
  '/orders(.*)',
  '/groups(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Protected Routes**:
- `/dashboard/*`, `/design/*`, `/orders/*`, `/groups/*`

**Public Routes**:
- `/`, `/signin`, `/signup`, `/products`, etc.

**Behavior**:
- Unauthenticated users are redirected to `/signin`
- Authenticated users accessing `/signin` or `/signup` are redirected to `/design/create`

### Webhook User Sync

**Endpoint**: `POST /api/webhooks/clerk`

Syncs Clerk users to Supabase `User` table on these events:
- `user.created` - Creates user in database
- `user.updated` - Updates user email/name
- `user.deleted` - Soft delete or cleanup (optional)

**Database Schema**:
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique  // Clerk user ID
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  designs       Design[]
  orders        Order[]
  // ... other relations
}
```

**Webhook Implementation** (`src/app/api/webhooks/clerk/route.ts`):
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET!)
  const evt = wh.verify(body, headers) as WebhookEvent

  if (evt.type === 'user.created') {
    await prisma.user.create({
      data: {
        clerkId: evt.data.id,
        email: evt.data.email_addresses[0].email_address,
        name: `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim() || null,
      },
    })
  }

  if (evt.type === 'user.updated') {
    await prisma.user.update({
      where: { clerkId: evt.data.id },
      data: {
        email: evt.data.email_addresses[0].email_address,
        name: `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim() || null,
      },
    })
  }

  return NextResponse.json({ received: true })
}
```

### Environment Variables

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/design/create
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/design/create

# Webhook (from Clerk Dashboard)
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase (database/storage only - NOT auth)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Supabase Database Client

**IMPORTANT**: Supabase is used for **database and storage only**. Authentication is handled by Clerk.

#### Server Client (RLS-enabled queries)
```tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createServerClient()

  // Query with RLS policies applied
  const { data } = await supabase
    .from('designs')
    .select('*')
    .eq('userId', userId)
}
```

#### Service Client (Admin operations)
```tsx
import { createServiceClient } from '@/lib/supabase/server'

// ⚠️ Server-side only - bypasses RLS
const supabase = createServiceClient()

// Admin operations that bypass Row Level Security
const { data } = await supabase
  .from('designs')
  .select('*')
```

### Best Practices

1. **Use Clerk for all authentication operations**
   - Sign in/sign up via Clerk components
   - User state via `useAuth()` hook (client) or `auth()` function (server)
   - Sign out via Clerk `UserButton` component

2. **Use Supabase for database/storage only**
   - Database queries via Prisma ORM (preferred) or Supabase client
   - File storage via Supabase Storage
   - **Never** use Supabase auth functions

3. **User ID mapping**
   - Clerk `userId` = Database `clerkId` field
   - Database `id` field = Primary key for relations
   - Always map Clerk ID to database user:
     ```tsx
     const user = await prisma.user.findUnique({
       where: { clerkId: clerkUserId }
     })
     ```

4. **Handle webhook sync failures**
   - Webhook creates users automatically on sign-up
   - If webhook fails, user may exist in Clerk but not database
   - Check for null user in API routes and handle gracefully

5. **Environment configuration**
   - Use separate Clerk projects for development/production
   - Configure webhook endpoints in Clerk Dashboard
   - Test webhooks with Clerk Dashboard webhook tester

6. **Catch-all routes for auth pages**
   - Auth pages **must** use `[[...param]]` syntax
   - Example: `/app/(auth)/signin/[[...signin]]/page.tsx`
   - Allows Clerk to handle multi-step flows (OAuth, email verification)

7. **Middleware location**
   - Middleware **must** be at `src/middleware.ts` when using `src/` directory
   - DO NOT place at root `middleware.ts`

### Migration from Supabase Auth

If migrating from Supabase Auth to Clerk:

1. **Install Clerk packages**
   ```bash
   npm install @clerk/nextjs svix
   ```

2. **Update Prisma schema**
   ```prisma
   model User {
     clerkId String @unique  // Add this field
     // ... existing fields
   }
   ```

   Run migration:
   ```bash
   npx prisma migrate dev --name add_clerk_id
   ```

3. **Configure Clerk**
   - Enable email/password + OAuth providers
   - Set redirect URLs
   - Create webhook endpoint for user sync

4. **Update all auth code**
   - Replace `createBrowserClient()` → `useAuth()` hook
   - Replace `getUser()` → `auth()` function
   - Replace `requireAuth()` → `requireClerkAuth()`
   - Update API routes to use `auth()` and map to database user

5. **Test thoroughly**
   - Sign up flow and webhook sync
   - Sign in/out with redirects
   - Protected routes
   - API route authentication
   - Client component auth state

---

## Database & Prisma ORM

### Database Schema

GenAI-Merch uses PostgreSQL (via Supabase) with Prisma ORM for type-safe database access.

#### Core Models

**User** - User accounts (synced with Supabase Auth)
- `id`, `email`, `name`
- Relations: organizations, designs, orders, groupOrders, carts, addresses

**Organization** - Team/company accounts
- `id`, `name`, `slug`
- Relations: members, brandProfile

**BrandProfile** - Brand identity for organizations
- `logoUrl`, `colorPalette`, `fonts` (JSON)
- One-to-one with Organization

**Design** - Custom apparel designs
- `name`, `imageUrl`, `vectorUrl`, `metadata` (JSON)
- `aiPrompt` (if AI-generated)
- Relations: user, cartItems, orderItems

**OrganizationMember** - User-Organization relationships
- `role`: member, admin, owner
- Unique constraint on (userId, organizationId)

**GroupOrder** - Team/event bulk orders
- `name`, `slug`, `deadline`
- `status`: open → closed → processing
- Relations: createdBy (user), orders

---

#### E-commerce Models

**Product** - Product catalog synced from Printful API
- `printfulId` (unique), `name`, `description`
- `category`: apparel, accessories, home-living
- `productType`: t-shirt, hoodie, mug, etc.
- `basePrice` (cents), `currency` (USD)
- `imageUrl`, `mockupUrl`
- `active` (boolean), `metadata` (JSON - Printful data)
- Relations: variants
- **Indexes**: printfulId, category, productType, active

**ProductVariant** - Size/color variants with pricing
- `printfulVariantId` (unique), `name` (e.g., "Medium / Black")
- `size`, `color`, `price` (cents), `inStock`
- `imageUrl`, `metadata` (JSON - Printful data)
- Relations: product, cartItems, orderItems
- **Indexes**: printfulVariantId, productId

**Cart** - Shopping cart (authenticated or guest)
- `userId` (optional for guests), `sessionId` (for guests)
- `expiresAt` (for guest cart cleanup)
- Relations: user, items
- **Indexes**: userId, sessionId

**CartItem** - Items in shopping cart
- `productVariantId`, `designId` (optional)
- `customizationData` (JSON - design URL, placement, preview)
- `quantity`, `unitPrice` (cents, frozen at add-to-cart time)
- Relations: cart, productVariant, design
- **Indexes**: cartId

**Order** - Customer orders (comprehensive e-commerce version)
- `orderNumber` (unique, e.g., "ORD-20240101-ABCD")
- `status`: PENDING_PAYMENT → PAID → SUBMITTED_TO_POD → IN_PRODUCTION → SHIPPED → DELIVERED (or CANCELLED/REFUNDED)
- **Stripe Integration**: `stripePaymentIntentId`, `stripeCheckoutSessionId`
- **Printful Integration**: `printfulOrderId`, `printfulStatus`
- **Pricing** (all in cents): `subtotal`, `shipping`, `tax`, `total`
- `currency` (default USD)
- **Shipping**: `shippingAddressId`, `trackingNumber`, `trackingUrl`, `carrier`
- **Timestamps**: `createdAt`, `paidAt`, `shippedAt`, `deliveredAt`
- `metadata` (JSON - additional order data)
- Relations: user, groupOrder, shippingAddress, items, statusHistory
- **Indexes**: userId, status, printfulOrderId, orderNumber

**OrderItem** - Frozen snapshot of order line items
- `productVariantId`, `designId` (optional)
- `productName`, `variantName` (frozen from time of order)
- `customizationData` (JSON - design URL, placement)
- `quantity`, `unitPrice` (cents)
- `thumbnailUrl`, `printfulItemId`
- Relations: order, productVariant, design
- **Indexes**: orderId

**Address** - Shipping addresses
- `userId` (optional - can be guest), `name`, `email`, `phone`
- `address1`, `address2`, `city`, `stateCode`, `countryCode`, `zip`
- `isDefault` (boolean)
- Relations: user, orders
- **Indexes**: userId

**OrderStatusHistory** - Audit trail for order status changes
- `orderId`, `fromStatus` (null for initial), `toStatus`
- `changedBy`: "system", "webhook:stripe", "webhook:printful", "admin:userId"
- `reason` (optional explanation)
- `createdAt`
- Relations: order
- **Indexes**: orderId, createdAt

---

#### Data Flow

**Shopping Cart Flow:**
1. User selects ProductVariant from Product catalog
2. Adds to Cart (with optional Design customization)
3. CartItem created with frozen `unitPrice`
4. Cart can be saved for authenticated users or expires for guests

**Order Creation Flow:**
1. User checks out from Cart
2. Order created with unique `orderNumber`
3. CartItems converted to OrderItems (frozen snapshots)
4. Stripe Checkout Session created
5. Status: PENDING_PAYMENT

**Payment & Fulfillment Flow:**
1. Stripe webhook confirms payment → Status: PAID
2. Order submitted to Printful API → Status: SUBMITTED_TO_POD
3. Printful webhook: production started → Status: IN_PRODUCTION
4. Printful webhook: shipped → Status: SHIPPED (+ tracking info)
5. Printful webhook: delivered → Status: DELIVERED

**Status History:**
- Every status change logged in OrderStatusHistory
- Tracks who/what triggered the change (user, webhook, system)
- Provides audit trail for customer service

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

### Chat API

**Endpoint**: `POST /api/chat`

Stream AI chat responses for design guidance using GPT-4.

#### Request

**Method**: POST
**Content-Type**: `application/json`
**Authentication**: Required (Supabase session cookie)

**Body Parameters**:
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  eventType?: 'charity' | 'fundraiser' | 'company' | 'sports' | 'school' | 'personal' | null;
  products?: string[];
  brandAssets?: {
    colors?: string[];
    fonts?: string[];
    voice?: string;
    logos?: string[];
  };
}
```

#### Response

**Success (200)**: Returns a text stream response
- Content-Type: `text/plain; charset=utf-8`
- Headers:
  - `X-RateLimit-Remaining`: Number of remaining requests in current window

**Streaming Format**: Server-Sent Events (SSE) text stream
```
Hello! I can help
 you create an amazing
 design for your...
```

**Error (401 - Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

**Error (429 - Rate Limit Exceeded)**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

**Error (400 - Validation Error)**:
```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "invalid_type",
      "path": ["messages"],
      "message": "Required"
    }
  ]
}
```

#### Features

1. **Authentication**: Requires valid Supabase session
2. **Rate Limiting**: 100 requests per hour per user (in-memory)
3. **Streaming**: Real-time response streaming for better UX
4. **Context-Aware**: Uses event type, products, and brand assets to build contextual system prompts
5. **Validation**: Zod schema validation for all inputs
6. **Error Handling**: Comprehensive error handling with detailed messages

#### Example Usage

**JavaScript/TypeScript with Vercel AI SDK**:
```typescript
import { useChat } from 'ai/react';

function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      eventType: 'sports',
      products: ['tshirt', 'hoodie'],
      brandAssets: {
        colors: ['#FF0000', '#000000'],
        voice: 'Bold and energetic'
      }
    }
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

**Fetch API**:
```typescript
async function streamChat(messages, context) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      eventType: context.eventType,
      products: context.products,
      brandAssets: context.brandAssets,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Chat request failed');
  }

  // Handle streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    console.log('Received:', text);
  }
}
```

**cURL** (for testing):
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=YOUR_TOKEN" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Help me design a logo for my sports team"
      }
    ],
    "eventType": "sports",
    "products": ["tshirt"],
    "brandAssets": {
      "colors": ["#FF0000", "#000000"]
    }
  }' \
  --no-buffer
```

#### Rate Limiting

**Current Implementation**: In-memory rate limiter
- **Limit**: 100 requests per hour per user
- **Window**: Rolling 1-hour window
- **Storage**: In-memory Map (resets on server restart)
- **Headers**: `X-RateLimit-Remaining` included in response

**Production Recommendation**:
Use Redis-based rate limiting for distributed environments:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
});

const { success, remaining } = await ratelimit.limit(userId);
```

#### Logging

All chat requests are logged with:
- **User ID**: Authenticated user identifier
- **Message Count**: Number of messages in conversation
- **Event Type**: Selected event category
- **Products Count**: Number of selected products
- **Has Brand Assets**: Boolean flag

**Example Log Output**:
```
[Chat API] Request: {
  userId: 'abc123-def456',
  messageCount: 3,
  eventType: 'sports',
  productsCount: 2,
  hasBrandAssets: true
}
```

### Design Generation API

**Endpoint**: `POST /api/generate-design`

Generate custom merchandise designs using GPT-4 + Google Gemini Imagen 3.

#### Two-Step Process

1. **GPT-4 Prompt Refinement**: Optimizes user's prompt for Gemini Imagen 3
2. **Gemini Imagen 3 Image Generation**: Creates the actual design image

#### Request

**Method**: POST
**Content-Type**: `application/json`
**Authentication**: Required (Supabase session cookie)

**Body Parameters**:
```typescript
{
  prompt: string; // User's design description (1-1000 chars)
  eventType?: 'charity' | 'fundraiser' | 'company' | 'sports' | 'school' | 'personal' | null;
  products?: string[];
  brandAssets?: {
    colors?: string[];
    fonts?: string[];
    voice?: string;
    logos?: string[];
  };
}
```

#### Response

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "revisedPrompt": "DALL-E's interpretation of the prompt",
    "originalPrompt": "User's original prompt",
    "refinedPrompt": "GPT-4 refined prompt"
  }
}
```

**Headers**:
- `X-RateLimit-Remaining`: Number of remaining generations in current window

**Error (401 - Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

**Error (429 - Rate Limit Exceeded)**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 design generations per hour. Please try again later."
}
```

**Error (400 - Content Policy Violation)**:
```json
{
  "error": "Content policy violation",
  "message": "Your prompt was flagged by our content policy. Please try a different description."
}
```

**Error (400 - Validation Error)**:
```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "too_small",
      "path": ["prompt"],
      "message": "Prompt is required"
    }
  ]
}
```

#### Features

1. **Two-Step AI Process**: GPT-4 optimizes prompts, then DALL-E 3 generates images
2. **Authentication**: Requires valid Supabase session
3. **Rate Limiting**: 10 generations per hour per user (in-memory)
4. **Context-Aware**: Uses event type, products, and brand assets for better designs
5. **Validation**: Zod schema validation for all inputs
6. **Error Handling**: Handles content policy violations, rate limits, quota issues
7. **Logging**: Tracks prompts, generation time, and success/failure

#### Example Usage

**JavaScript/TypeScript**:
```typescript
async function generateDesign(prompt: string, context?: DesignContext) {
  const response = await fetch('/api/generate-design', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      eventType: context?.eventType,
      products: context?.products,
      brandAssets: context?.brandAssets,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Design generation failed');
  }

  const result = await response.json();
  return result.data;
}

// Usage
const design = await generateDesign(
  'A bold lion mascot with our team colors',
  {
    eventType: 'sports',
    products: ['tshirt'],
    brandAssets: {
      colors: ['#FF0000', '#000000'],
      voice: 'Bold and energetic',
    },
  }
);

console.log('Generated design:', design.imageUrl);
```

**React Component**:
```typescript
import { useState } from 'react';

function DesignGenerator() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          eventType: 'sports',
          products: ['tshirt'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      setImageUrl(result.data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your design..."
      />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Design'}
      </button>
      {error && <p className="error">{error}</p>}
      {imageUrl && <img src={imageUrl} alt="Generated design" />}
    </div>
  );
}
```

**cURL** (for testing):
```bash
curl -X POST http://localhost:3000/api/generate-design \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=YOUR_TOKEN" \
  -d '{
    "prompt": "A bold lion mascot for our sports team",
    "eventType": "sports",
    "products": ["tshirt"],
    "brandAssets": {
      "colors": ["#FF0000", "#000000"],
      "voice": "Bold and energetic"
    }
  }'
```

#### Rate Limiting

**Current Implementation**: In-memory rate limiter
- **Limit**: 10 generations per hour per user
- **Window**: Rolling 1-hour window
- **Storage**: In-memory Map (resets on server restart)
- **Headers**: `X-RateLimit-Remaining` included in response

**Production Recommendation**:
Use Redis-based rate limiting for distributed environments:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});

const { success, remaining } = await ratelimit.limit(userId);
```

#### Cost Tracking

**DALL-E 3 Pricing** (as of 2025):
- Standard quality (1024x1024): $0.040 per image
- HD quality (1024x1024): $0.080 per image

**GPT-4 Pricing** (approximate):
- GPT-4 Omni Mini: ~$0.0001 per prompt refinement

**Estimated Cost per Generation**: ~$0.04 (standard quality)

To track costs:
```typescript
// Add to logging
console.log('[Generate Design] Cost estimate:', {
  dalle3: '$0.040',
  gpt4: '$0.0001',
  total: '$0.0401',
});
```

#### Image Persistence

**Important**: DALL-E image URLs expire after a few hours. For production:

```typescript
// After DALL-E generation, upload to Supabase Storage
import { createServiceClient } from '@/lib/supabase/server';

const supabase = createServiceClient();

// Download image from DALL-E URL
const imageResponse = await fetch(imageUrl);
const imageBuffer = await imageResponse.arrayBuffer();

// Upload to Supabase Storage
const fileName = `${userId}/${Date.now()}.png`;
const { data, error } = await supabase.storage
  .from('generated-designs')
  .upload(fileName, imageBuffer, {
    contentType: 'image/png',
  });

if (data) {
  const { data: publicUrlData } = supabase.storage
    .from('generated-designs')
    .getPublicUrl(fileName);

  const permanentUrl = publicUrlData.publicUrl;
}
```

#### Logging

All generation requests are logged with:
- **User ID**: Authenticated user identifier
- **Prompt**: User's original prompt (truncated to 100 chars)
- **Event Type**: Selected event category
- **Products Count**: Number of selected products
- **Has Brand Assets**: Boolean flag
- **Duration**: Total generation time in milliseconds
- **Remaining**: Generations remaining in rate limit window

**Example Log Output**:
```
[Generate Design] Request: {
  userId: '64ad7ae3-e873-43fd',
  prompt: 'A bold lion mascot with our team colors...',
  eventType: 'sports',
  productsCount: 1,
  hasBrandAssets: true
}
[Generate Design] Step 1: Refining prompt with GPT-4...
[Generate Design] Refined prompt: A bold, stylized lion mascot in red and black...
[Generate Design] Step 2: Generating image with DALL-E 3...
[Generate Design] Success: {
  userId: '64ad7ae3-e873-43fd',
  imageUrl: 'https://oaidalleapiprodscus...',
  duration: '8742ms',
  remaining: 9
}
```

#### Error Handling

**Content Policy Violations**:
- Prompts are screened by OpenAI's content policy
- Violations return 400 status with clear message
- User should revise their prompt

**Rate Limits**:
- App-level: 10 generations per hour per user
- OpenAI-level: Handled with 429 response
- Both provide clear error messages

**Quota Issues**:
- OpenAI API key quota exceeded returns 503
- Requires adding credits or upgrading plan

---

### Design Preparation API

**Endpoint**: `POST /api/design/prepare`

Prepares AI-generated designs for professional print-on-demand production. Converts raw Gemini Imagen 3 output (1024x1024) into print-ready files that meet Printful's quality requirements.

Based on Printful's guidelines: https://www.printful.com/blog/everything-you-need-to-know-to-prepare-the-perfect-printfile

#### Overview

The design preparation pipeline transforms AI-generated designs into production-ready files through a four-step process:

1. **Validation** - Verify dimensions, file size, format, and DPI requirements
2. **Upscaling** - AI upscale with Replicate Real-ESRGAN (1024x1024 → 4096x4096, 4x)
3. **Optimization** - Convert to sRGB, set 300 DPI metadata, compress, generate thumbnail
4. **Upload & Database Update** - Store in Supabase, update Design record with print-ready URLs

**Print Requirements** (Printful):
- Minimum dimensions: 2048x2048 pixels
- Target DPI: 300
- Color space: sRGB
- Max file size: 10MB
- Formats: PNG or JPG

#### Request

**Method**: POST
**Content-Type**: `application/json`
**Authentication**: Required (Clerk session)

**Body Parameters**:
```typescript
{
  designId: string; // Database Design ID to prepare
}
```

#### Response

**Success (200)**:
```json
{
  "success": true,
  "printReadyUrl": "https://...supabase.co/storage/.../print-ready/design-id.png",
  "thumbnailUrl": "https://...supabase.co/storage/.../print-ready/design-id_thumb.png",
  "metadata": {
    "originalDimensions": { "width": 1024, "height": 1024 },
    "finalDimensions": { "width": 4096, "height": 4096 },
    "upscaled": true,
    "dpi": 300,
    "fileSize": 3456789,
    "format": "png"
  }
}
```

**Error (400 - Validation Failed)**:
```json
{
  "error": "Preparation failed",
  "message": "Validation failed: Image dimensions too small. Minimum 2048x2048px required. Got 1024x1024px."
}
```

**Error (401 - Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

**Error (403 - Forbidden)**:
```json
{
  "error": "Unauthorized: Design belongs to another user"
}
```

**Error (404 - Not Found)**:
```json
{
  "error": "Design not found"
}
```

**Error (503 - Service Error)**:
```json
{
  "error": "Upscaling service error",
  "message": "Failed to upscale design. Please try again later."
}
```

#### Four-Step Pipeline

**Step 1: Validation (`validateDesignFile`)**

Checks design against print requirements:
- Dimensions: Min 2048x2048 pixels
- File size: Max 10MB
- Format: PNG or JPG only
- Effective DPI: Calculated based on assumed 8.5" print width

Returns validation result with warnings (non-fatal) and errors (fatal):

```typescript
{
  valid: boolean;
  width: number;
  height: number;
  format: string;
  size: number;
  effectiveDPI?: number;
  warnings: string[]; // e.g., "Low effective DPI (120)"
  errors: string[];   // e.g., "File size too large"
}
```

**Step 2: Upscaling (`upscaleDesign`)**

Only triggered if dimensions < 2048x2048. Uses Replicate Real-ESRGAN:

- Model: `nightmareai/real-esrgan` (production-grade upscaler)
- Scale: 4x (1024x1024 → 4096x4096)
- Face enhance: Disabled (not needed for merchandise)
- Processing time: 5-15 seconds per image

Input: Data URL or HTTP URL
Output: Data URL with upscaled image (base64-encoded PNG)

**Step 3: Optimization (`optimizeForPrint`)**

Prepares design for print services using Sharp:

- **Color space**: Convert to sRGB (print compatibility)
- **DPI metadata**: Set to 300 DPI
- **Compression**: PNG with level 6, quality 90 (balance quality/size)
- **Thumbnail**: Generate 400x400 preview (compression level 9, quality 80)

Output:
```typescript
{
  buffer: Buffer;        // Optimized print-ready file
  thumbnailBuffer: Buffer; // 400x400 thumbnail
  width: number;
  height: number;
  size: number;         // File size in bytes
  metadata: {
    dpi: 300;
    colorSpace: 'sRGB';
    format: 'png';
    compressionLevel: 6;
  };
}
```

**Step 4: Upload & Database Update**

Uploads two files to Supabase Storage:
- `{userId}/print-ready/{designId}.png` - Print-ready file
- `{userId}/print-ready/{designId}_thumb.png` - Thumbnail

Updates Design record with:
```typescript
{
  printReadyUrl: string;
  printReadyMetadata: {
    originalDimensions: { width, height };
    finalDimensions: { width, height };
    upscaled: boolean;
    dpi: 300;
    fileSize: number;
    format: string;
    colorSpace: 'sRGB';
    thumbnailUrl: string;
    preparedAt: string; // ISO timestamp
  };
  preparedAt: DateTime;
}
```

#### Example Usage

**JavaScript/TypeScript**:
```typescript
async function prepareDesignForPrint(designId: string) {
  const response = await fetch('/api/design/prepare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ designId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Preparation failed');
  }

  const result = await response.json();

  console.log('Print-ready URL:', result.printReadyUrl);
  console.log('Thumbnail URL:', result.thumbnailUrl);
  console.log('Was upscaled:', result.metadata.upscaled);
  console.log('Final dimensions:', result.metadata.finalDimensions);

  return result;
}

// Usage
try {
  const prepared = await prepareDesignForPrint('design-abc-123');
  // Use prepared.printReadyUrl for Printful submission
} catch (error) {
  console.error('Failed to prepare design:', error);
}
```

**React Component**:
```typescript
import { useState } from 'react';

function DesignPrepareButton({ designId }: { designId: string }) {
  const [preparing, setPreparing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePrepare = async () => {
    setPreparing(true);
    setError(null);

    try {
      const response = await fetch('/api/design/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Preparation failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div>
      <button onClick={handlePrepare} disabled={preparing}>
        {preparing ? 'Preparing for Print...' : 'Prepare for Print'}
      </button>
      {error && <p className="error">{error}</p>}
      {result && (
        <div>
          <p>✓ Print-ready file created!</p>
          <p>Dimensions: {result.metadata.finalDimensions.width}x{result.metadata.finalDimensions.height}</p>
          <p>Upscaled: {result.metadata.upscaled ? 'Yes (4x)' : 'No'}</p>
          <a href={result.printReadyUrl} target="_blank">View Print-Ready File</a>
        </div>
      )}
    </div>
  );
}
```

**cURL** (for testing):
```bash
curl -X POST http://localhost:3000/api/design/prepare \
  -H "Content-Type: application/json" \
  -H "Cookie: your-clerk-session-cookie" \
  -d '{
    "designId": "cm3abc123xyz"
  }'
```

#### GET Endpoint - Check Preparation Status

**Endpoint**: `GET /api/design/prepare?designId={id}`

Check if a design has been prepared for print.

**Request**:
```
GET /api/design/prepare?designId=cm3abc123xyz
```

**Response**:
```json
{
  "prepared": true,
  "printReadyUrl": "https://...supabase.co/.../print-ready/cm3abc123xyz.png",
  "metadata": {
    "originalDimensions": { "width": 1024, "height": 1024 },
    "finalDimensions": { "width": 4096, "height": 4096 },
    "upscaled": true,
    "dpi": 300,
    "fileSize": 3456789,
    "format": "png",
    "colorSpace": "sRGB",
    "thumbnailUrl": "https://...supabase.co/.../print-ready/cm3abc123xyz_thumb.png",
    "preparedAt": "2026-01-19T10:30:00.000Z"
  },
  "preparedAt": "2026-01-19T10:30:00.000Z"
}
```

If not prepared:
```json
{
  "prepared": false,
  "printReadyUrl": null,
  "metadata": null,
  "preparedAt": null
}
```

#### Processing Time

**Expected Duration**:
- Without upscaling: 2-5 seconds (validation + optimization + upload)
- With upscaling: 7-20 seconds (+ Replicate Real-ESRGAN processing)

**Breakdown**:
1. Validation: <100ms (Sharp metadata inspection)
2. Upscaling: 5-15 seconds (Replicate API, if needed)
3. Optimization: 500ms-2s (Sharp processing)
4. Upload: 500ms-2s (Supabase Storage, depends on file size)

#### Error Handling

**Common Errors**:

1. **Image too small + upscaling fails**
   - Error: "Failed to upscale design: Replicate API error"
   - Solution: Check Replicate API status, verify REPLICATE_API_TOKEN
   - Retry: User can retry preparation

2. **File size exceeds 10MB after upscaling**
   - Error: "Validation failed: File size too large"
   - Solution: This should be rare (compression usually brings size down)
   - Workaround: Increase MAX_FILE_SIZE constant if needed

3. **Invalid image format**
   - Error: "Validation failed: Invalid format. Must be PNG or JPG"
   - Solution: Ensure Gemini Imagen 3 returns PNG (default)

4. **Storage upload fails**
   - Error: "Storage error: Failed to save print-ready design"
   - Solution: Check Supabase Storage bucket configuration
   - Verify: `designs` bucket exists and has proper RLS policies

5. **Design not found**
   - Error: "Design not found"
   - Solution: Verify designId is correct and design exists in database

6. **Unauthorized access**
   - Error: "Unauthorized: Design belongs to another user"
   - Solution: User can only prepare their own designs
   - Security: Ownership check prevents unauthorized preparation

#### Utility Functions

**Location**: `src/lib/design/prepare-for-print.ts`

All four functions are exported and can be used independently:

```typescript
import {
  upscaleDesign,
  validateDesignFile,
  optimizeForPrint,
  prepareDesignForPrint,
} from '@/lib/design/prepare-for-print';

// 1. Upscale only
const upscaledDataUrl = await upscaleDesign(designUrl);

// 2. Validate only
const buffer = await fetch(imageUrl).then(r => r.arrayBuffer()).then(Buffer.from);
const validation = await validateDesignFile(buffer);
console.log('Valid:', validation.valid);
console.log('Warnings:', validation.warnings);
console.log('Errors:', validation.errors);

// 3. Optimize only (for images that don't need upscaling)
const optimized = await optimizeForPrint(buffer);
console.log('Optimized size:', optimized.size);

// 4. Complete pipeline (recommended)
const result = await prepareDesignForPrint(designId);
```

#### Integration Patterns

**Pattern 1: Prepare After Generation**

Automatically prepare designs immediately after AI generation:

```typescript
// In /api/generate-design route
const design = await prisma.design.create({ data: {...} });

// Trigger preparation in background (don't await)
fetch('/api/design/prepare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ designId: design.id }),
}).catch(console.error);

return design;
```

**Pattern 2: Prepare Before Checkout**

Only prepare designs when user adds to cart:

```typescript
async function addToCart(designId: string, productVariant: ProductVariant) {
  // Check if design is already prepared
  const response = await fetch(`/api/design/prepare?designId=${designId}`);
  const status = await response.json();

  if (!status.prepared) {
    // Prepare design before adding to cart
    await fetch('/api/design/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId }),
    });
  }

  // Add to cart with print-ready URL
  // ...
}
```

**Pattern 3: Batch Preparation**

Prepare multiple designs in parallel:

```typescript
async function prepareMultipleDesigns(designIds: string[]) {
  const preparations = designIds.map(id =>
    fetch('/api/design/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId: id }),
    }).then(r => r.json())
  );

  const results = await Promise.all(preparations);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Prepared ${successful.length}/${designIds.length} designs`);

  return { successful, failed };
}
```

#### Best Practices

1. **Prepare designs asynchronously** - Don't block user actions
2. **Check preparation status** before re-preparing (use GET endpoint)
3. **Show progress indicators** during preparation (7-20 seconds is noticeable)
4. **Handle upscaling failures gracefully** - Retry or notify user
5. **Store print-ready URLs** in cart items for Printful submission
6. **Use thumbnails** for preview in cart/checkout
7. **Validate before submitting to Printful** - Ensure printReadyUrl exists
8. **Monitor Replicate API usage** - Upscaling costs ~$0.002 per image

#### Troubleshooting

**Issue: Upscaling takes too long (> 30 seconds)**
- Check Replicate API status: https://status.replicate.com
- Verify REPLICATE_API_TOKEN is valid
- Consider increasing timeout in production

**Issue: Designs look different after preparation**
- sRGB conversion can shift colors slightly
- This is expected and necessary for print compatibility
- Preview print-ready file before finalizing

**Issue: File size increased dramatically after upscaling**
- 4x upscaling (1024 → 4096) increases pixel count by 16x
- Compression (level 6) usually brings size back down
- Typical: 1MB → 3-5MB after upscaling + optimization

**Issue: "Storage error" when uploading**
- Verify Supabase Storage `designs` bucket exists
- Check RLS policies allow authenticated users to upload to own folder
- Ensure Storage API URL is correct in environment

**Issue: Database update fails**
- Verify Prisma schema has `printReadyUrl`, `printReadyMetadata`, `preparedAt` fields
- Run `npx prisma db push` if schema was just updated
- Check database connection

---

### Product Catalog Sync API

**Endpoint**: `GET /api/printful/sync-catalog`

Syncs products from Printful API into our database. Called by cron job to keep product catalog up-to-date.

#### Overview

The product sync process:
1. Fetches all products from Printful API
2. Filters to only supported categories and product types
3. Upserts products and variants into database
4. Applies 2x markup pricing strategy
5. Returns sync statistics

**Supported Categories**:
- Apparel (t-shirts, sweatshirts, hoodies, polos, tank tops)
- Accessories (hats, caps, beanies, tote bags, stickers)
- Home & Living (mugs, cups)

**Excluded Product Types**:
- Baby clothes
- Posters
- Phone cases
- Canvas prints
- Pillows, blankets, towels
- Leggings, yoga wear

#### Request

**Method**: GET
**Authentication**: Required (`x-cron-secret` header)

**Headers**:
```bash
x-cron-secret: your_cron_secret_here
```

**Authorization**:
- Endpoint verifies `x-cron-secret` header matches `CRON_SECRET` environment variable
- Returns 401 if secret is missing or incorrect
- Prevents unauthorized catalog syncs

#### Response

**Success (200)**:
```json
{
  "products_synced": 45,
  "variants_synced": 1234,
  "products_skipped": 407,
  "errors": [],
  "duration_ms": 245678
}
```

**With Errors** (still 200):
```json
{
  "products_synced": 43,
  "variants_synced": 1200,
  "products_skipped": 407,
  "errors": [
    {
      "product_id": 123,
      "error": "Failed to fetch variants: Network timeout"
    },
    {
      "product_id": 456,
      "variant_id": 7890,
      "error": "Invalid variant data"
    }
  ],
  "duration_ms": 245678
}
```

**Error (401 - Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

**Error (500 - Server Error)**:
```json
{
  "error": "Server configuration error"
}
```

#### Pricing Strategy

**Formula**: `(Printful Base Price × 2) - $0.01`

**Steps**:
1. Multiply Printful base price by 2.0 (100% markup)
2. Round to nearest dollar
3. Subtract $0.01 to get .99 ending

**Examples**:
- Printful: $11.50 → Retail: $22.99
- Printful: $24.95 → Retail: $48.99
- Printful: $18.00 → Retail: $35.99

**Why .99 pricing?**
- Psychological pricing strategy
- Common in retail/e-commerce
- Appears more affordable than rounded prices

**Price Storage**:
- All prices stored in cents (integer)
- Example: $22.99 = 2299 cents
- Prevents floating-point precision issues

#### Product Filtering

**Helper Function**: `shouldIncludeProduct(product)`
**Location**: `src/lib/printful/products.ts`

```typescript
import { shouldIncludeProduct } from '@/lib/printful/products';

const allProducts = await printful.getProducts();
const supported = allProducts.filter(shouldIncludeProduct);
```

**Filtering Logic**:
1. Exclude discontinued products
2. Check for excluded keywords (baby, poster, phone-case, etc.)
3. Match supported product types or keywords
4. Default: exclude if no match

#### Variant Parsing

**Helper Function**: `parseVariantAttributes(variantName)`

Extracts size and color from Printful variant names:

```typescript
import { parseVariantAttributes } from '@/lib/printful/products';

parseVariantAttributes("Medium / Black");
// { size: "Medium", color: "Black" }

parseVariantAttributes("S / White");
// { size: "S", color: "White" }

parseVariantAttributes("11oz");
// { size: "11oz", color: null }
```

**Variant Name Formats**:
- Standard: "Size / Color" (most common)
- Size only: "11oz", "One Size"
- Handles XXS, XS, S, M, L, XL, XXL, XXXL

#### Database Operations

**Product Upsert**:
```typescript
await prisma.product.upsert({
  where: { printfulId: product.id },
  update: {
    name: product.title,
    basePrice: lowestVariantPrice,
    imageUrl: productImage,
    metadata: productData,
    // ...
  },
  create: {
    printfulId: product.id,
    name: product.title,
    category: 'apparel',
    // ...
  },
});
```

**Variant Upsert**:
```typescript
await prisma.productVariant.upsert({
  where: { printfulVariantId: variant.id },
  update: {
    price: retailPriceCents,
    inStock: variant.in_stock,
    // ...
  },
  create: {
    printfulVariantId: variant.id,
    productId: dbProduct.id,
    price: retailPriceCents,
    // ...
  },
});
```

**Transaction Safety**:
- Each product synced independently
- If one product fails, others continue
- Errors logged but don't fail entire sync
- Useful for partial syncs or API hiccups

#### Triggering Sync

**Manual Trigger** (for testing):
```bash
curl -X GET http://localhost:3000/api/printful/sync-catalog \
  -H "x-cron-secret: your_cron_secret_here"
```

**Production Trigger** (Vercel Cron):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/printful/sync-catalog",
    "schedule": "0 0 * * *"
  }]
}
```

**Schedule Options**:
- Daily: `0 0 * * *` (midnight UTC)
- Weekly: `0 0 * * 0` (Sunday midnight)
- Twice daily: `0 0,12 * * *` (midnight & noon)

**Vercel Configuration**:
1. Add CRON_SECRET to environment variables
2. Deploy vercel.json with cron configuration
3. Vercel automatically sends x-cron-secret header

#### Logging

All sync operations are logged with:
- Product processing status
- Variant counts
- Errors with context
- Performance metrics

**Example Log Output**:
```
=== Starting Printful Catalog Sync ===

[Sync] Fetching products from Printful...
[Sync] Fetched 452 products from Printful
[Sync] Filtered to 45 supported products

[Sync] Processing product: Bella Canvas 3001 T-Shirt (ID: 71)
[Sync] Product upserted: cmj...
[Sync] Found 180 variants for product 71
[Sync] Product 71 complete: 180 variants synced

[Sync] Processing product: Gildan 18500 Hoodie (ID: 146)
[Sync] Product upserted: cmj...
[Sync] Found 192 variants for product 146
[Sync] Product 146 complete: 192 variants synced

=== Sync Complete ===
Products synced: 45
Variants synced: 1234
Products skipped: 407
Errors: 0
Duration: 245678ms
```

#### Performance

**Expected Duration**: 3-5 minutes for full catalog
- Depends on: number of products, API rate limits, network speed
- Printful rate limit: 120 req/min (handled automatically)
- Database operations: bulk upserts for efficiency

**Optimization Tips**:
- Run during low-traffic hours
- Monitor rate limit info
- Check logs for slow products
- Consider partial syncs for updates

#### Helper Functions

**Location**: `src/lib/printful/products.ts`

```typescript
// Calculate retail price
import { calculateRetailPrice } from '@/lib/printful/products';
const retailPrice = calculateRetailPrice(1150); // 2299 cents ($22.99)

// Parse variant attributes
import { parseVariantAttributes } from '@/lib/printful/products';
const { size, color } = parseVariantAttributes("Medium / Black");

// Check if product should be synced
import { shouldIncludeProduct } from '@/lib/printful/products';
const include = shouldIncludeProduct(product);

// Map to category
import { mapProductCategory } from '@/lib/printful/products';
const category = mapProductCategory(product); // 'apparel'

// Price conversion
import { parsePriceToCents, formatCentsToDollars } from '@/lib/printful/products';
const cents = parsePriceToCents("11.50"); // 1150
const formatted = formatCentsToDollars(2299); // "$22.99"
```

#### Error Handling

**Common Errors**:
1. **Network timeout** - Printful API slow/unavailable
2. **Rate limit** - Too many requests (handled with backoff)
3. **Invalid data** - Malformed product/variant data
4. **Database error** - Unique constraint violations, connection issues

**Error Recovery**:
- Errors logged with full context
- Product ID and variant ID included
- Sync continues with remaining products
- Partial success possible

**Retry Strategy**:
- Run sync again to catch failed products
- Upsert logic prevents duplicates
- Failed products will be retried on next sync

#### Best Practices

1. **Schedule regular syncs**
   - Daily: Keep catalog up-to-date
   - Weekly: Reduce API usage
   - After Printful product launches

2. **Monitor sync results**
   - Check error count
   - Verify product count matches expectations
   - Review skipped products

3. **Test in development**
   - Use sandbox Printful API token
   - Verify pricing calculations
   - Check product filtering logic

4. **Secure the endpoint**
   - Use strong CRON_SECRET (32+ random chars)
   - Rotate secret periodically
   - Never expose secret in client code

5. **Handle failures gracefully**
   - Errors are expected (network issues, etc.)
   - Partial syncs are acceptable
   - Re-run sync to recover

---

## Printful API Client

GenAI-Merch includes a comprehensive Printful API client for print-on-demand fulfillment operations.

**Location**: `src/lib/printful/client.ts`
**Types**: `src/lib/printful/types.ts`

### Overview

The PrintfulClient class handles all interactions with the Printful API:
- Product catalog management
- Mockup generation with custom designs
- Order creation and fulfillment
- Shipping rate calculation
- Rate limiting (120 requests per minute)
- Exponential backoff on rate limit errors
- Comprehensive error handling and logging

### Setup

```typescript
import { printful } from '@/lib/printful/client';
// OR
import { getPrintfulClient } from '@/lib/printful/client';
const printful = getPrintfulClient();
```

The client automatically uses the `PRINTFUL_API_TOKEN` environment variable.

### Product Catalog Methods

#### Get All Products

```typescript
const products = await printful.getProducts();
console.log(`Found ${products.length} products`);

// Filter by category
const apparelProducts = await printful.getProducts(categoryId);
```

**Returns**: Array of `PrintfulProduct` objects with:
- `id`, `type`, `title`, `brand`, `model`
- `variant_count`, `image`, `description`
- `avg_fulfillment_time`, `techniques`, `files`, `options`

#### Get Single Product

```typescript
const product = await printful.getProduct(71); // Bella Canvas 3001
console.log(product.title); // "Bella + Canvas 3001 Unisex Short Sleeve Jersey T-Shirt with Tear Away Label"
console.log(product.variant_count); // 180+ variants (sizes & colors)
```

#### Get Product Variants

```typescript
const variants = await printful.getProductVariants(71);

// Find specific variant
const blackMedium = variants.find(
  v => v.size === 'M' && v.color === 'Black'
);

console.log(blackMedium.id); // 4012
console.log(blackMedium.price); // "11.50"
console.log(blackMedium.in_stock); // true
```

**Variant Properties**:
- `id`, `product_id`, `name`, `size`, `color`, `color_code`
- `image`, `price`, `in_stock`
- `availability_regions`, `availability_status`

#### Get Single Variant

```typescript
const variant = await printful.getVariant(4012);
console.log(variant.price); // Current price
console.log(variant.in_stock); // Availability
```

### Mockup Generation

#### Create Mockup Task

Generate product mockups with your custom design applied.

```typescript
const taskKey = await printful.createMockup({
  variant_ids: [4012, 4013], // Black M, Black L
  format: 'png',
  files: [{
    placement: 'front',
    image_url: 'https://example.com/design.png',
    position: {
      area_width: 1800,
      area_height: 2400,
      width: 1800,
      height: 1800,
      top: 300,
      left: 0
    }
  }]
});

console.log('Mockup task created:', taskKey);
```

#### Check Mockup Status

```typescript
const task = await printful.getMockupTaskStatus(taskKey);

if (task.status === 'completed') {
  console.log('Mockups ready:');
  task.mockups?.forEach(mockup => {
    console.log(`- ${mockup.placement}: ${mockup.mockup_url}`);
  });
} else if (task.status === 'failed') {
  console.error('Mockup generation failed:', task.error);
} else {
  console.log('Mockup generation in progress...');
}
```

**Status Values**: `pending`, `completed`, `failed`

### Order Management

#### Create Order

```typescript
const order = await printful.createOrder({
  recipient: {
    name: 'John Doe',
    address1: '123 Main St',
    city: 'Los Angeles',
    state_code: 'CA',
    country_code: 'US',
    zip: '90001',
    email: 'john@example.com',
    phone: '555-0123'
  },
  items: [{
    variant_id: 4012, // Black M
    quantity: 2,
    files: [{
      url: 'https://example.com/design.png'
    }],
    retail_price: '29.99'
  }],
  retail_costs: {
    currency: 'USD',
    subtotal: '59.98',
    shipping: '5.99',
    tax: '4.50'
  }
});

console.log('Order created:', order.id);
console.log('Status:', order.status); // 'draft'
```

**Orders are created as drafts** and must be confirmed separately.

#### Confirm Draft Order

```typescript
const confirmedOrder = await printful.confirmOrder(order.id);
console.log('Order confirmed:', confirmedOrder.status); // 'pending'
```

#### Get Order Details

```typescript
// By Printful order ID
const order = await printful.getOrder(12345);

// By your external order ID
const order = await printful.getOrder('@order-abc-123');

console.log('Status:', order.status);
console.log('Shipments:', order.shipments);
console.log('Tracking:', order.shipments[0]?.tracking_url);
```

**Order Statuses**:
- `draft` - Order created, not confirmed
- `pending` - Confirmed, awaiting fulfillment
- `failed` - Fulfillment failed
- `canceled` - Order canceled
- `onhold` - On hold (payment/address issue)
- `inprocess` - Being fulfilled
- `partial` - Partially fulfilled
- `fulfilled` - Completely fulfilled

#### Cancel Order

```typescript
const canceledOrder = await printful.cancelOrder(12345);
console.log('Order canceled:', canceledOrder.status); // 'canceled'
```

**Note**: Only `draft` and `pending` orders can be canceled.

#### List Orders

```typescript
// Get all orders
const allOrders = await printful.getOrders();

// Filter by status
const pendingOrders = await printful.getOrders('pending');
const fulfilledOrders = await printful.getOrders('fulfilled');

// Pagination
const page2 = await printful.getOrders(undefined, 20, 20); // offset 20, limit 20
```

### Shipping Rates

Calculate shipping costs before order creation:

```typescript
const rates = await printful.getShippingRates({
  recipient: {
    address1: '123 Main St',
    city: 'Los Angeles',
    state_code: 'CA',
    country_code: 'US',
    zip: '90001'
  },
  items: [
    { variant_id: 4012, quantity: 2 },
    { variant_id: 4013, quantity: 1 }
  ],
  currency: 'USD'
});

rates.forEach(rate => {
  console.log(`${rate.name}: $${rate.rate}`);
  console.log(`  Delivery: ${rate.minDeliveryDays}-${rate.maxDeliveryDays} days`);
});
```

**Example Output**:
```
STANDARD: $4.99
  Delivery: 7-10 days
EXPEDITED: $9.99
  Delivery: 3-5 days
EXPRESS: $19.99
  Delivery: 1-2 days
```

### Error Handling

All methods throw `PrintfulError` on failure:

```typescript
import { PrintfulError } from '@/lib/printful/types';

try {
  const order = await printful.createOrder(orderData);
} catch (error) {
  if (error instanceof PrintfulError) {
    console.error('Printful error:', {
      statusCode: error.statusCode, // HTTP status (400, 429, 500, etc.)
      code: error.code,              // Printful error code
      message: error.message,        // Error description
      reason: error.reason           // Additional details
    });

    // Handle specific errors
    if (error.statusCode === 429) {
      // Rate limit exceeded - client will auto-retry
      console.log('Rate limit hit, request will be retried');
    } else if (error.statusCode === 401) {
      // Invalid API token
      console.error('Check PRINTFUL_API_TOKEN environment variable');
    } else if (error.code === 400) {
      // Bad request - check order data
      console.error('Invalid request:', error.message);
    }
  }
}
```

### Rate Limiting

The client automatically handles Printful's rate limit (120 requests per minute):

- Uses `bottleneck` package for queue management
- Exponential backoff on 429 errors
- Automatic retry with increasing delays
- Rate limit info available via `getRateLimitInfo()`

```typescript
const rateLimitInfo = printful.getRateLimitInfo();
console.log(`Remaining: ${rateLimitInfo?.remaining}/${rateLimitInfo?.limit}`);
console.log(`Resets at: ${new Date(rateLimitInfo?.reset * 1000)}`);
```

**Bottleneck Configuration**:
- Reservoir: 120 requests
- Refresh interval: 60 seconds
- Max concurrent: 10 requests
- Min time between requests: 500ms
- Auto-retry on 429 with exponential backoff

### Logging

All API calls are automatically logged:

```
[Printful] GET /products {}
[Printful] Success GET /products {
  status: 200,
  duration: '847ms',
  rateLimit: { limit: 120, remaining: 119, reset: 60 }
}
```

**Log Entries Include**:
- HTTP method and endpoint
- Request body (for POST/PUT)
- Response status
- Duration in milliseconds
- Current rate limit info
- Error details (on failure)

### Testing Connection

Verify API token is valid:

```typescript
try {
  const isConnected = await printful.testConnection();
  console.log('Printful API connected:', isConnected);
} catch (error) {
  console.error('Connection failed - check PRINTFUL_API_TOKEN');
}
```

### Complete Example: Product to Order Flow

```typescript
import { printful } from '@/lib/printful/client';

async function createCustomOrder() {
  // 1. Get product variants
  const variants = await printful.getProductVariants(71);
  const blackMedium = variants.find(v => v.size === 'M' && v.color === 'Black');

  // 2. Generate mockup
  const taskKey = await printful.createMockup({
    variant_ids: [blackMedium.id],
    files: [{
      placement: 'front',
      image_url: 'https://mysite.com/design.png'
    }]
  });

  // 3. Wait for mockup
  let task;
  do {
    task = await printful.getMockupTaskStatus(taskKey);
    if (task.status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } while (task.status === 'pending');

  // 4. Get shipping rates
  const rates = await printful.getShippingRates({
    recipient: {
      address1: '123 Main St',
      city: 'Los Angeles',
      state_code: 'CA',
      country_code: 'US',
      zip: '90001'
    },
    items: [{ variant_id: blackMedium.id, quantity: 1 }]
  });

  const standardShipping = rates.find(r => r.id === 'STANDARD');

  // 5. Create order
  const order = await printful.createOrder({
    recipient: {
      name: 'John Doe',
      address1: '123 Main St',
      city: 'Los Angeles',
      state_code: 'CA',
      country_code: 'US',
      zip: '90001'
    },
    items: [{
      variant_id: blackMedium.id,
      quantity: 1,
      files: [{ url: 'https://mysite.com/design.png' }],
      retail_price: '29.99'
    }],
    retail_costs: {
      currency: 'USD',
      subtotal: '29.99',
      shipping: standardShipping.rate
    }
  });

  // 6. Confirm order
  const confirmed = await printful.confirmOrder(order.id);

  console.log('Order confirmed:', confirmed.id);
  console.log('Dashboard:', confirmed.dashboard_url);

  return confirmed;
}
```

### TypeScript Types

All Printful API types are fully typed in `@/lib/printful/types`:

```typescript
import type {
  PrintfulProduct,
  PrintfulProductVariant,
  PrintfulOrder,
  PrintfulOrderRequest,
  PrintfulMockupRequest,
  PrintfulShippingRate,
  PrintfulError
} from '@/lib/printful/types';
```

**Key Types**:
- `PrintfulProduct` - Product catalog item
- `PrintfulProductVariant` - Size/color variant
- `PrintfulOrder` - Order details
- `PrintfulOrderRequest` - Order creation payload
- `PrintfulOrderItem` - Line item in order
- `PrintfulRecipient` - Shipping address
- `PrintfulMockupRequest` - Mockup generation request
- `PrintfulMockupTask` - Mockup generation status
- `PrintfulShippingRate` - Shipping option
- `PrintfulError` - Custom error class

### Best Practices

1. **Always use the singleton instance**
   ```typescript
   import { printful } from '@/lib/printful/client';
   // NOT: new PrintfulClient()
   ```

2. **Handle errors gracefully**
   - Wrap all calls in try-catch
   - Check for PrintfulError instance
   - Show user-friendly messages

3. **Respect rate limits**
   - Client handles this automatically
   - Check `getRateLimitInfo()` if needed
   - Don't create multiple client instances

4. **Use external IDs for orders**
   - Set your order ID in order metadata
   - Query by external ID: `@your-order-id`
   - Easier reconciliation with your database

5. **Test in sandbox mode**
   - Use Printful sandbox API token for development
   - Sandbox orders are free and not fulfilled
   - Switch to production token for live orders

6. **Store mockup URLs**
   - Mockup generation takes 3-10 seconds
   - Save mockup URLs to your database
   - Don't regenerate on every page load

7. **Confirm orders after payment**
   - Create orders as drafts
   - Confirm only after Stripe payment success
   - Prevents fulfillment of unpaid orders

---

## Product Catalog Page

The product catalog page displays all products from Printful in a responsive grid layout with filtering and sorting capabilities.

**Location**: `app/products/page.tsx`

### Architecture

**Server Components** (default):
- `app/products/page.tsx` - Main page component
- `ProductGrid` - Grid container for products
- `ProductCard` - Individual product display
- Fetches data from database server-side
- Supports streaming with Suspense

**Client Components** (interactive):
- `ProductFilters` - Category tabs and sort dropdown
- `EmptyState` - Product sync trigger button

### Page Features

1. **Responsive Grid Layout**
   - 1 column on mobile
   - 2 columns on tablet
   - 3 columns on desktop
   - 4 columns on large screens

2. **Category Filtering**
   - All Products
   - Apparel (t-shirts, hoodies, etc.)
   - Accessories (hats, bags, etc.)
   - Home & Living (mugs, etc.)
   - Shows product count for each category

3. **Sorting Options**
   - Featured (default - by category, then price)
   - Price: Low to High
   - Price: High to Low
   - Newest

4. **Product Cards Display**
   - Product image from Printful
   - Product name
   - Starting price ("From $22.99")
   - Product type badge
   - Variant count
   - Category color-coded badge
   - Hover effects with scale animation

5. **Empty State**
   - Friendly message when no products
   - One-click product sync button
   - Calls `/api/printful/sync-catalog`
   - Shows progress and results

### Component Structure

```
app/products/
└── page.tsx                          # Main page (Server Component)

components/products/
├── product-grid.tsx                  # Grid container
├── product-card.tsx                  # Individual product card
├── product-filters.tsx               # Filters (Client Component)
└── empty-state.tsx                   # Empty state (Client Component)

lib/products/
└── queries.ts                        # Database queries
```

### Database Queries

**Location**: `src/lib/products/queries.ts`

#### Get Products

```typescript
import { getProducts } from '@/lib/products/queries';

const products = await getProducts({
  category: 'apparel',
  sort: 'price-asc',
  minPrice: 1000, // cents
  maxPrice: 5000, // cents
  search: 't-shirt',
});
```

**Available Filters**:
- `category`: 'apparel' | 'accessories' | 'home-living' | undefined
- `sort`: 'featured' | 'price-asc' | 'price-desc' | 'newest'
- `minPrice`: number (in cents)
- `maxPrice`: number (in cents)
- `search`: string (searches name, description, productType)

#### Get Product Counts

```typescript
import { getProductCounts } from '@/lib/products/queries';

const counts = await getProductCounts();
// { all: 216, apparel: 180, accessories: 24, 'home-living': 12 }
```

#### Get Product by ID

```typescript
import { getProductById } from '@/lib/products/queries';

const product = await getProductById('product-id');
// Returns product with all variants
```

#### Get Price Range

```typescript
import { getPriceRange } from '@/lib/products/queries';

const range = await getPriceRange();
// { min: 1999, max: 8999 } (in cents)
```

### URL Query Parameters

The page supports query parameters for filtering and sorting:

```
/products                              # All products, featured sort
/products?category=apparel             # Apparel only
/products?category=accessories&sort=price-asc  # Accessories, low to high
/products?sort=newest                  # All products, newest first
```

**Parameters**:
- `category`: 'apparel' | 'accessories' | 'home-living'
- `sort`: 'featured' | 'price-asc' | 'price-desc' | 'newest'

Parameters update via `router.push()` with `scroll: false` for smooth filtering.

### Product Card Component

**Features**:
- Responsive image with aspect ratio preservation
- Category badge with color coding:
  - Apparel: Blue
  - Accessories: Purple
  - Home & Living: Green
- Product name (2-line clamp)
- Description (2-line clamp)
- Starting price calculation (lowest variant)
- Variant count display
- Hover effects:
  - Card shadow increase
  - Image scale 1.05x
  - Title color change to primary

**Code Example**:
```tsx
import { ProductCard } from '@/components/products/product-card';

<ProductCard product={product} />
```

### Product Grid Component

**Features**:
- Responsive Tailwind grid
- Gap spacing: 1.5rem (gap-6)
- Auto-adjusts columns based on screen size

**Code Example**:
```tsx
import { ProductGrid } from '@/components/products/product-grid';

<ProductGrid products={products} />
```

### Product Filters Component

**Features**:
- Category tabs with counts
- Sort dropdown
- Updates URL query params
- No page reload (client-side navigation)
- Mobile-responsive layout

**Code Example**:
```tsx
import { ProductFilters } from '@/components/products/product-filters';

<ProductFilters counts={{ all: 216, apparel: 180, ... }} />
```

### Empty State Component

**Features**:
- Displays when no products in database
- One-click sync button
- Calls `/api/printful/sync-catalog`
- Shows loading spinner during sync
- Success/error toast notifications
- Auto-reloads page after successful sync

**Code Example**:
```tsx
import { EmptyState } from '@/components/products/empty-state';

{products.length === 0 && <EmptyState />}
```

### Streaming with Suspense

The page uses React Suspense for streaming:

```tsx
<Suspense fallback={<ProductGridSkeleton count={12} />}>
  <ProductsContent category={category} sort={sort} />
</Suspense>
```

**Benefits**:
- Instant page load with skeleton UI
- Products stream in as they're fetched
- Better perceived performance
- No layout shift

**Skeleton Components**:
- `ProductCardSkeleton` - Animated loading card
- `ProductGridSkeleton` - Grid of skeletons

### SEO Optimization

**Meta Tags**:
```typescript
export const metadata: Metadata = {
  title: 'Custom Products | GenAI-Merch',
  description: 'Browse our custom apparel, accessories, and home & living products...',
  keywords: ['custom t-shirts', 'custom hoodies', ...],
};
```

**Benefits**:
- Better search engine ranking
- Rich social media previews
- Improved discoverability

### Navigation

Products are clickable and navigate to detail page:

```
/products → /products/[productId]
```

Click handler uses Next.js `Link` component for:
- Client-side navigation
- Prefetching on hover
- Fast page transitions

### Performance Optimizations

1. **Image Optimization**
   - Next.js Image component
   - Automatic WebP conversion
   - Lazy loading
   - Responsive sizes

2. **Database Queries**
   - Only fetch first 5 variants per product (catalog view)
   - Indexed queries (printfulId, category)
   - Optimized sorting

3. **Streaming**
   - Suspense boundaries
   - Progressive rendering
   - Skeleton UI

4. **Client State**
   - URL-based filtering (shareable)
   - No unnecessary re-renders
   - Smooth transitions with `scroll: false`

### Accessibility

- Semantic HTML (cards, links, buttons)
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Focus indicators
- ARIA labels where needed

### Mobile Responsiveness

**Breakpoints**:
- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: 1024px - 1280px (3 columns)
- Large: > 1280px (4 columns)

**Mobile Optimizations**:
- Stacked filters
- Abbreviated category labels
- Touch-friendly card sizes
- Optimized images

### Testing Checklist

✅ **Page Load**:
- Products display correctly
- Skeleton shows while loading
- No layout shift

✅ **Filtering**:
- Category tabs work
- Query params update
- Product count accurate
- Empty results handled

✅ **Sorting**:
- All sort options work
- Order is correct
- Query params update

✅ **Responsive**:
- Mobile layout (1 column)
- Tablet layout (2 columns)
- Desktop layout (3-4 columns)

✅ **Cards**:
- Images load
- Prices display correctly
- Badges show category
- Hover effects work
- Links navigate correctly

✅ **Empty State**:
- Shows when no products
- Sync button works
- Toast notifications appear
- Page reloads after sync

### Common Issues

**Issue: Products not showing**
- Check database has products (`SELECT COUNT(*) FROM "Product"`)
- Run product sync if empty
- Verify filters aren't too restrictive

**Issue: Images not loading**
- Check Printful image URLs are valid
- Verify Next.js Image config allows Printful domain
- Check network requests for CORS issues

**Issue: Filters not working**
- Verify query params in URL
- Check client component is properly marked (`'use client'`)
- Verify router.push is being called

**Issue: Slow page load**
- Check database query performance
- Verify indexes exist on Product table
- Consider pagination for large catalogs

### Future Enhancements

- **Pagination**: Add pagination for large catalogs (100+ products)
- **Search**: Full-text search across product names/descriptions
- **Price Filter**: Range slider for price filtering
- **Quick View**: Modal for quick product preview
- **Favorites**: Save favorite products
- **Compare**: Compare multiple products side-by-side

---

## Mockup Generation API

GenAI-Merch integrates with Printful's Mockup Generator API to create realistic product previews with custom designs overlaid on product images.

### Mockup Generation Flow

**3-Step Process**:
1. **Create Task**: Submit mockup generation request to Printful
2. **Poll Status**: Check task completion status every 2 seconds
3. **Return URL**: Once complete, return high-resolution mockup URL

**Location**: `src/lib/printful/mockups.ts`

**API Endpoint**: `POST /api/printful/mockup`

### Mockup Utilities (`lib/printful/mockups.ts`)

#### Core Function: `generateMockup()`

```typescript
import { generateMockup } from '@/lib/printful/mockups';

const result = await generateMockup(
  productVariantId,      // Database ProductVariant ID
  printfulVariantId,     // Printful catalog variant ID (integer)
  designImageUrl,        // URL of design image
  'front'                // Placement: 'front' | 'back' | 'left' | 'right'
);

// Returns:
// {
//   mockupUrl: 'https://...',  // High-res mockup image URL
//   variantId: 4012,           // Printful variant ID
//   placement: 'front'         // Placement used
// }
```

#### Types

```typescript
// Placement options
type MockupPlacement =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'sleeve_left'
  | 'sleeve_right';

// Mockup request structure
interface MockupRequest {
  format: 'jpg' | 'png';
  width: number;
  products: Array<{
    source: 'catalog';
    catalog_variant_id: number;
    placements: Array<{
      placement: MockupPlacement;
      technique: 'dtg' | 'embroidery' | 'sublimation';
      image_url: string;
    }>;
  }>;
}

// Mockup result
interface MockupResult {
  mockupUrl: string;
  variantId: number;
  placement: string;
}
```

#### Helper Functions

**Get Default Print Technique**:
```typescript
import { getDefaultTechnique } from '@/lib/printful/mockups';

const technique = getDefaultTechnique('t-shirt');  // 'dtg'
const technique = getDefaultTechnique('hat');      // 'embroidery'
const technique = getDefaultTechnique('mug');      // 'sublimation'
```

**Get Available Placements**:
```typescript
import { getAvailablePlacements } from '@/lib/printful/mockups';

const placements = getAvailablePlacements('t-shirt');
// ['front', 'back']

const placements = getAvailablePlacements('mug');
// ['front']

const placements = getAvailablePlacements('hat');
// ['front']
```

**Generate Cache Key**:
```typescript
import { generateMockupCacheKey } from '@/lib/printful/mockups';

const cacheKey = generateMockupCacheKey(
  'variant-123',
  'https://example.com/design.png',
  'front'
);
// 'mockup:variant-123:front:a1b2c3d4e5f6g7h8'
```

### Mockup API Route

**Endpoint**: `POST /api/printful/mockup`

**Request Body**:
```json
{
  "productVariantId": "variant-uuid-here",
  "designImageUrl": "https://example.com/design.png",
  "placement": "front"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "mockupUrl": "https://printful-mockup-cdn.com/mockup.jpg",
  "variantId": 4012,
  "placement": "front",
  "cached": false
}
```

**Response (Cached)**:
```json
{
  "success": true,
  "mockupUrl": "https://printful-mockup-cdn.com/mockup.jpg",
  "cached": true
}
```

**Response (Error)**:
```json
{
  "error": "Mockup generation failed",
  "message": "Invalid design image URL"
}
```

#### Validation

**Zod Schema**:
```typescript
const mockupRequestSchema = z.object({
  productVariantId: z.string().min(1, 'Product variant ID is required'),
  designImageUrl: z.string().url('Design image URL must be a valid URL'),
  placement: z
    .enum(['front', 'back', 'left', 'right', 'sleeve_left', 'sleeve_right'])
    .optional()
    .default('front'),
});
```

**Errors**:
- `400 Bad Request`: Invalid input (missing fields, invalid URL)
- `404 Not Found`: Product variant not found in database
- `500 Internal Server Error`: Mockup generation failed

### Caching Strategy

**Cache Key Format**: `mockup:{variantId}:{placement}:{hash}`

**Hash Calculation**:
- SHA-256 hash of `productVariantId:designImageUrl:placement`
- Truncated to 16 characters for brevity
- Ensures unique cache keys for each design/variant/placement combo

**Cache Storage**:
- **Current**: In-memory Map (development)
- **Production**: Redis or database table recommended
- **TTL**: 7 days (604,800,000 ms)

**Cache Cleanup**:
- Expired entries removed on each request
- In-memory cache cleared on server restart
- For production, use Redis with automatic TTL expiration

#### In-Memory Cache (Current)

```typescript
const mockupCache = new Map<string, {
  url: string;
  expiresAt: number
}>();

// Cache entry
mockupCache.set(cacheKey, {
  url: 'https://...',
  expiresAt: Date.now() + CACHE_TTL_MS
});

// Check cache
const cached = mockupCache.get(cacheKey);
if (cached && cached.expiresAt > Date.now()) {
  return cached.url;  // Cache hit
}
```

#### Redis Cache (Recommended for Production)

```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Cache mockup URL
await redis.set(cacheKey, mockupUrl, { ex: 604800 }); // 7 days TTL

// Get from cache
const cached = await redis.get(cacheKey);
if (cached) {
  return cached;  // Cache hit
}
```

### Printful Mockup API Integration

#### Step 1: Create Mockup Task

**Endpoint**: `POST /mockup-generator/create-task/433`

**Request**:
```json
{
  "format": "jpg",
  "width": 1200,
  "products": [{
    "source": "catalog",
    "catalog_variant_id": 4012,
    "placements": [{
      "placement": "front",
      "technique": "dtg",
      "image_url": "https://example.com/design.png"
    }]
  }]
}
```

**Response**:
```json
{
  "result": {
    "task_key": "gt-20231201-abc123def456"
  }
}
```

#### Step 2: Poll Task Status

**Endpoint**: `GET /mockup-generator/task?task_key={key}`

**Response (Pending)**:
```json
{
  "result": {
    "status": "pending"
  }
}
```

**Response (Completed)**:
```json
{
  "result": {
    "status": "completed",
    "mockups": [{
      "mockup_url": "https://printful-mockup-cdn.com/mockup.jpg",
      "variant_id": 4012,
      "placement": "front"
    }]
  }
}
```

**Response (Failed)**:
```json
{
  "result": {
    "status": "failed",
    "error": {
      "code": "INVALID_IMAGE",
      "message": "Design image URL is not accessible"
    }
  }
}
```

#### Polling Configuration

```typescript
const maxAttempts = 15;      // Max polling attempts
const intervalMs = 2000;     // Poll every 2 seconds
const maxTimeoutMs = 30000;  // 30 seconds total timeout

// Polling loop
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  const status = await checkTaskStatus(taskKey);

  if (status.result.status === 'completed') {
    return status.result.mockups[0].mockup_url;
  }

  if (status.result.status === 'failed') {
    throw new Error(status.result.error.message);
  }

  await new Promise(resolve => setTimeout(resolve, intervalMs));
}

throw new Error('Mockup generation timed out');
```

### Usage Examples

#### Generate Mockup from Product Page

```typescript
'use client';

import { useState } from 'react';

function ProductMockupPreview({ variant, designUrl }) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateMockup = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/printful/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId: variant.id,
          designImageUrl: designUrl,
          placement: 'front',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mockup');
      }

      const data = await response.json();
      setMockupUrl(data.mockupUrl);
    } catch (error) {
      console.error('Mockup generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {mockupUrl ? (
        <img src={mockupUrl} alt="Product mockup" />
      ) : (
        <button onClick={generateMockup} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Mockup'}
        </button>
      )}
    </div>
  );
}
```

#### Batch Generate Mockups

```typescript
async function generateAllMockups(variant, designs) {
  const mockups = await Promise.all(
    designs.map(async (design) => {
      const response = await fetch('/api/printful/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId: variant.id,
          designImageUrl: design.imageUrl,
          placement: 'front',
        }),
      });

      const data = await response.json();
      return {
        designId: design.id,
        mockupUrl: data.mockupUrl,
      };
    })
  );

  return mockups;
}
```

### Error Handling

**Common Errors**:

1. **Invalid Design URL**
   - Error: `Design image URL is not accessible`
   - Cause: URL is broken, CORS issues, or private URL
   - Solution: Ensure design is publicly accessible

2. **Unsupported Variant**
   - Error: `Product variant does not have a Printful variant ID`
   - Cause: Variant not synced from Printful
   - Solution: Re-run product sync

3. **Generation Timeout**
   - Error: `Mockup generation timed out after 30 seconds`
   - Cause: Printful API slow or down
   - Solution: Retry request, check Printful status

4. **Invalid Placement**
   - Error: `Placement 'sleeve_left' not supported for this product`
   - Cause: Placement not available for product type
   - Solution: Use `getAvailablePlacements()` to check first

**Error Handling Pattern**:
```typescript
try {
  const mockup = await generateMockup(variantId, printfulId, designUrl, 'front');
  console.log('Mockup generated:', mockup.mockupUrl);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      // Retry logic
      console.log('Retrying mockup generation...');
    } else if (error.message.includes('not accessible')) {
      // Invalid design URL
      console.error('Design image is not accessible');
    } else {
      // Generic error
      console.error('Mockup generation failed:', error.message);
    }
  }
}
```

### Best Practices

**1. Pre-check Design URLs**
```typescript
// Validate design URL is accessible before generating mockup
async function validateDesignUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
```

**2. Use Caching Aggressively**
```typescript
// Check cache before generating
const cacheKey = generateMockupCacheKey(variantId, designUrl, 'front');
const cached = await redis.get(cacheKey);

if (cached) {
  return cached; // Skip expensive API call
}
```

**3. Generate Mockups Asynchronously**
```typescript
// Don't block UI while generating
async function queueMockupGeneration(variantId, designUrl) {
  // Queue in background job
  await fetch('/api/jobs/mockup', {
    method: 'POST',
    body: JSON.stringify({ variantId, designUrl }),
  });

  // Return immediately
  return { status: 'queued' };
}
```

**4. Handle Multiple Placements**
```typescript
const placements = getAvailablePlacements(product.productType);
const mockups = await Promise.all(
  placements.map(p => generateMockup(variantId, printfulId, designUrl, p))
);
```

**5. Retry Failed Generations**
```typescript
async function generateMockupWithRetry(
  variantId,
  printfulId,
  designUrl,
  placement,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateMockup(variantId, printfulId, designUrl, placement);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Exponential backoff
    }
  }
}
```

### Performance Considerations

**Mockup Generation Time**:
- Average: 5-10 seconds
- Can vary based on Printful API load
- Polling adds 2 seconds per check (avg 3-5 checks)

**Caching Impact**:
- First request: 5-10 seconds (API call)
- Cached requests: <100ms (memory/Redis lookup)
- Cache hit rate: ~80-90% for popular products

**Optimization Tips**:
1. Generate mockups during design creation (background job)
2. Pre-generate mockups for popular product/design combos
3. Use CDN for mockup URLs (Printful provides CDN URLs)
4. Lazy-load mockup images on product pages
5. Show placeholder while generating

### Future Enhancements

- **Database caching**: Store mockups in database table
- **Background jobs**: Queue mockup generation with job processor
- **Multiple placements**: Generate front + back mockups simultaneously
- **Mockup variants**: Generate mockups for all color variants
- **Mockup templates**: Pre-defined layouts for common use cases
- **Real-time updates**: WebSocket notifications when mockup ready

---

## Mockup Preview Integration

The product detail page integrates real-time mockup generation to show customers exactly how their custom design will look on the selected product.

### Overview

When a user selects or uploads a design on the product detail page, the system:
1. Automatically generates a realistic product mockup via Printful API
2. Shows loading state during generation (5-10 seconds)
3. Displays the mockup with the design overlaid on the product
4. Caches the mockup for instant retrieval on subsequent views
5. Allows toggling between product view and mockup preview
6. Supports placement selection (front/back) for applicable products

### MockupPreview Component

**Location**: `src/components/products/mockup-preview.tsx`

A client-side component that handles mockup generation, caching, and display.

#### Props Interface

```typescript
interface MockupPreviewProps {
  productVariantId: string | null;  // Database ProductVariant ID
  designUrl: string | null;          // URL of the design image
  productImageUrl: string;           // Fallback product image
  productType: string;               // Product type for placement logic
  placement?: MockupPlacement;       // Design placement (default: 'front')
  onPlacementChange?: (placement: MockupPlacement) => void;
}
```

#### Component States

1. **No Design** - Shows default product image
2. **Loading** - Shows spinner with "Generating Preview" message
3. **Error** - Shows error message with retry button
4. **Ready** - Shows generated mockup with optional cached badge

#### Caching Strategy

**Dual-Layer Caching**:

1. **Client-Side Cache** (sessionStorage)
   - Key: `mockup:${productVariantId}:${placement}:${designUrl}`
   - Lifetime: Session duration
   - Purpose: Instant retrieval within same browser session

2. **Server-Side Cache** (in-memory Map, production: Redis)
   - Key: SHA-256 hash of variant + design + placement
   - TTL: 7 days
   - Purpose: Share cached mockups across users and sessions

**Cache Flow**:
```
User selects design
    ↓
Check sessionStorage → HIT: Show mockup instantly
    ↓ MISS
Call /api/printful/mockup
    ↓
API checks server cache → HIT: Return cached URL (cached: true)
    ↓ MISS
Generate via Printful API (5-10 seconds)
    ↓
Store in server cache + return URL
    ↓
Component stores in sessionStorage
    ↓
Show mockup
```

#### Auto-Loading Cached Mockups

**Feature**: Automatically loads previously generated mockups when viewing product detail pages or changing variants.

**How It Works**:
- When `productVariantId`, `selectedTechnique`, or `designUrl` changes, a `useEffect` hook triggers
- Checks `sessionStorage` for cached mockups matching the current variant + technique + design combination
- If cached mockups exist → loads them instantly with success toast notification
- If no cached mockups exist → shows "Generate Images" button for manual generation

**Benefits**:
1. **Instant Load Times**: Previously generated mockups appear immediately without regeneration
2. **Seamless Variant Switching**: Change size/color and see cached mockups if available
3. **Improved UX**: Customers don't wait for regeneration when viewing products they've already customized
4. **Session Persistence**: Cache survives within the same browser session

**Implementation** (`mockup-preview.tsx:413-512`):
```typescript
useEffect(() => {
  const loadCachedMockups = async () => {
    // Early return if required data is missing
    if (!productVariantId || !designUrl || !selectedTechnique || !product?.id || availableTechniques.length === 0) {
      setGeneratedMockups([]);
      return;
    }

    console.log('[Mockup Preview] Variant or technique changed, checking for cached mockups...');

    try {
      // Fetch available mockup styles for this product
      const response = await fetch(`/api/printful/mockup-styles?printfulProductId=${printfulProductId}`);
      const data = await response.json();
      const styles = data.styles || [];

      // Build combinations of style × placement for selected technique
      const combinations = [...]; // Logic to build combinations

      // Check sessionStorage cache for each combination
      const cachedMockups = [];
      for (const combo of combinations) {
        const cacheKey = `mockup:${productVariantId}:${combo.placement}:style${combo.styleId}:${selectedTechnique}:${designUrl}`;
        const cachedUrl = sessionStorage.getItem(cacheKey);

        if (cachedUrl) {
          cachedMockups.push({ ...combo, mockupUrl: cachedUrl });
        }
      }

      if (cachedMockups.length > 0) {
        // Load cached mockups instantly
        setGeneratedMockups(cachedMockups);
        toast.success(`Loaded ${cachedMockups.length} cached mockup${cachedMockups.length > 1 ? 's' : ''}`, {
          description: 'Previously generated mockups are ready to view',
        });
      } else {
        // Clear display, user can generate new ones
        setGeneratedMockups([]);
      }
    } catch (error) {
      console.error('[Mockup Preview] Error loading cached mockups:', error);
    }
  };

  loadCachedMockups();
}, [productVariantId, selectedTechnique, designUrl, product?.id, printfulProductId, availableTechniques]);
```

**User Flow Example**:
```
1. Customer selects "Unisex Classic Tee" + Design + Size M + Black
   → Auto-selects DTG technique
   → Checks cache → No mockups found
   → Shows "Generate Images" button

2. Customer clicks "Generate Images"
   → Generates 4 mockups (front, back, sleeve_left, sleeve_right)
   → Stores in sessionStorage

3. Customer changes to Size L + White
   → productVariantId changes
   → Auto-checks cache for new variant
   → No cached mockups for this variant
   → Shows "Generate Images" button

4. Customer generates mockups for Size L
   → Stores in sessionStorage

5. Customer switches back to Size M + Black
   → productVariantId changes back
   → Auto-checks cache
   → Cache HIT! Loads 4 mockups instantly
   → Toast: "Loaded 4 cached mockups"
   → Customer sees mockups immediately (no regeneration)
```

#### Usage Example

```typescript
import { MockupPreview } from '@/components/products/mockup-preview';

export function ProductPage() {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [design, setDesign] = useState<DesignData | null>(null);
  const [placement, setPlacement] = useState<MockupPlacement>('front');

  return (
    <div>
      {design && selectedVariant ? (
        <MockupPreview
          productVariantId={selectedVariant.id}
          designUrl={design.imageUrl}
          productImageUrl={product.imageUrl}
          productType={product.productType}
          placement={placement}
          onPlacementChange={setPlacement}
        />
      ) : (
        <Image src={product.imageUrl} alt={product.name} />
      )}
    </div>
  );
}
```

### Product Detail Page Integration

**Location**: `src/app/products/[productId]/page.tsx`

#### Features Added

1. **View Mode Toggle**
   - "Product View" - Shows original product image
   - "Mockup Preview" - Shows generated mockup with design
   - Appears only when design and variant are selected

2. **Placement Selector**
   - Shows "Front" / "Back" tabs for shirts, hoodies, sweatshirts
   - Hidden for products with single placement (mugs, hats)
   - Updates mockup when placement changes

3. **Auto-Switch to Mockup**
   - Automatically switches to mockup view when design is selected
   - Provides seamless transition from design upload to preview

4. **Mockup Regeneration**
   - "Regenerate Mockup" button in MockupPreview component
   - Clears cache and generates fresh mockup
   - Useful if design or variant changes

#### Implementation Pattern

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MockupPreview } from '@/components/products/mockup-preview';
import type { MockupPlacement } from '@/lib/printful/mockups';

export default function ProductDetailPage() {
  const [viewMode, setViewMode] = useState<'product' | 'mockup'>('product');
  const [placement, setPlacement] = useState<MockupPlacement>('front');
  const [design, setDesign] = useState<DesignData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Auto-switch to mockup view when design is selected
  useEffect(() => {
    if (design && selectedVariant) {
      setViewMode('mockup');
    }
  }, [design, selectedVariant]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left: Product Image/Mockup */}
      <div className="space-y-4">
        {/* View Mode Toggle */}
        {design && selectedVariant && (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'product' | 'mockup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="product">Product View</TabsTrigger>
              <TabsTrigger value="mockup">
                <Eye className="mr-2 h-4 w-4" />
                Mockup Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Placement Selector (shirts only) */}
        {viewMode === 'mockup' && design && product.productType.includes('shirt') && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Placement:</span>
            <Tabs value={placement} onValueChange={(v) => setPlacement(v as MockupPlacement)}>
              <TabsList>
                <TabsTrigger value="front">Front</TabsTrigger>
                <TabsTrigger value="back">Back</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Conditional Rendering */}
        {viewMode === 'mockup' && design ? (
          <MockupPreview
            productVariantId={selectedVariant?.id || null}
            designUrl={design.imageUrl}
            productImageUrl={product.imageUrl}
            productType={product.productType}
            placement={placement}
            onPlacementChange={setPlacement}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={selectedVariant?.imageUrl || product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          </Card>
        )}
      </div>

      {/* Right: Product Details & Cart */}
      <div className="space-y-6">
        {/* ... variant selector, design upload, add to cart ... */}
      </div>
    </div>
  );
}
```

### User Flow

1. **User arrives on product detail page**
   - Sees default product image in "Product View"
   - Selects size and color variant

2. **User uploads or selects a design**
   - Design preview shows in DesignPreview component
   - Page auto-switches to "Mockup Preview" mode
   - MockupPreview component:
     - Checks sessionStorage cache → MISS
     - Calls `/api/printful/mockup` with variant + design + placement
     - Shows loading state: "Generating Preview... This may take 5-10 seconds"

3. **API generates mockup** (first request)
   - Checks server cache → MISS
   - Calls Printful Mockup API (5-10 seconds)
   - Stores in server cache (7-day TTL)
   - Returns mockup URL with `cached: false`

4. **Component displays mockup**
   - Stores mockup URL in sessionStorage
   - Renders mockup image
   - Shows toast: "Mockup generated!"

5. **User changes placement** (front → back)
   - MockupPreview re-triggers generation with new placement
   - Checks sessionStorage → MISS (different cache key)
   - Calls API → checks server cache → generates if needed
   - Displays new mockup

6. **User refreshes page or navigates away and returns**
   - sessionStorage cleared (new session)
   - BUT server cache still valid
   - API returns cached mockup instantly (<100ms)
   - Component stores in sessionStorage again

7. **Another user views same product + design**
   - Server cache HIT → instant mockup retrieval
   - No Printful API call needed

### Performance Metrics

**Cold Start** (no cache):
- Time: 5-10 seconds
- API calls: 1 (Printful Mockup API)
- User sees: Loading spinner

**Warm Start** (server cache):
- Time: <500ms
- API calls: 1 (our API only, returns cached)
- User sees: Loading spinner briefly

**Hot Start** (sessionStorage cache):
- Time: <50ms
- API calls: 0
- User sees: Instant mockup display

**Cache Hit Rates**:
- sessionStorage: ~30-40% (same session)
- Server cache: ~80-90% (popular products)
- Combined: ~85-95% of requests served from cache

### Error Handling

**Error States Handled**:

1. **Missing Variant/Design**
   - Shows default product image
   - No error message (expected state)

2. **API Error** (network, timeout, etc.)
   - Shows error card with icon and message
   - Displays retry button
   - User can click to regenerate

3. **Printful API Failure**
   - API route catches error, returns 500
   - Component shows: "Mockup generation failed: [reason]"
   - Retry button clears cache and retries

4. **Invalid Design URL**
   - API validates URL accessibility
   - Returns 400 with clear error message
   - Component shows error with guidance

**Retry Logic**:
```typescript
const handleRetry = () => {
  // Clear sessionStorage cache
  const cacheKey = getCacheKey();
  if (cacheKey) {
    sessionStorage.removeItem(cacheKey);
  }

  // Regenerate mockup
  generateMockup();
};
```

### Loading States

**Loading Indicators**:

1. **Initial Load**
   - Blue card background
   - Spinning loader icon
   - "Generating Preview" heading
   - "Creating a realistic mockup with your design..."
   - "This may take 5-10 seconds"

2. **Cached Badge**
   - Green badge in top-right corner
   - Shows "Cached" when mockup retrieved from cache
   - Helps users understand fast load times

### Best Practices

**1. Preload Mockups**
```typescript
// Generate mockups in background when user uploads design
useEffect(() => {
  if (design && variants.length > 0) {
    // Preload mockup for first variant
    const firstVariant = variants[0];
    fetch('/api/printful/mockup', {
      method: 'POST',
      body: JSON.stringify({
        productVariantId: firstVariant.id,
        designImageUrl: design.imageUrl,
        placement: 'front'
      })
    });
  }
}, [design, variants]);
```

**2. Clear Cache When Design Changes**
```typescript
useEffect(() => {
  // Clear sessionStorage when design URL changes
  sessionStorage.clear(); // Or selectively remove mockup keys
}, [design?.imageUrl]);
```

**3. Show Cached State**
```typescript
{cached && (
  <Badge variant="secondary" className="bg-green-100 text-green-800">
    Cached
  </Badge>
)}
```

**4. Provide Regenerate Option**
```typescript
<Button
  variant="outline"
  size="sm"
  className="w-full"
  onClick={handleRetry}
  disabled={loading}
>
  <RefreshCw className="mr-2 h-4 w-4" />
  Regenerate Mockup
</Button>
```

**5. Handle Placement-Specific Caching**
```typescript
// Each placement gets its own cache entry
const getCacheKey = () => {
  if (!productVariantId || !designUrl) return null;
  return `mockup:${productVariantId}:${placement}:${designUrl}`;
};
```

### Troubleshooting

**Issue: Mockups not generating**
- Verify `PRINTFUL_API_KEY` is set in environment variables
- Check Printful API status: https://status.printful.com
- Verify product variant has `printfulVariantId` in database
- Check browser console for API errors

**Issue: Mockups showing old design**
- Clear sessionStorage: `sessionStorage.clear()`
- Click "Regenerate Mockup" button
- Verify design URL is updated correctly

**Issue: Slow mockup generation**
- Normal: 5-10 seconds for first generation
- Check Printful API response time in logs
- Consider pre-generating mockups in background

**Issue: Cache not working**
- Verify sessionStorage is enabled in browser
- Check server cache implementation (in-memory Map vs Redis)
- Review cache key generation logic

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

## AI-First Design Wizard Flow

GenAI-Merch features a comprehensive 5-step wizard that guides users from concept to final design. The wizard leverages AI at every step while maintaining full user control.

### Wizard Steps Overview

**Step 1: Event Type Selection**
- User selects the purpose of their merchandise (charity, sports, company, family, school, other)
- This context informs AI design generation in later steps
- Influences design recommendations and starter prompts
- **Auto-clear feature**: Changing event type clears event details to prevent orphaned data

**Step 2: Event Details**
- Dynamic form based on event type selection
- Gathers event-specific information (team name, cause, industry, etc.)
- Required fields vary by event type (validated before progression)
- All details feed into AI prompt generation for personalized designs

**Step 3: AI Design Chat**
- Split-screen interface: Chat on left, generated designs gallery on right
- Users chat with GPT-4 to refine their design ideas
- DALL-E 3 generates designs based on user descriptions
- **Optional brand assets**: Upload logos, define colors, fonts, and brand voice
- All generated designs are saved to the Zustand store
- Users select their favorite design to continue

**Step 4: Choose Products**
- Full product catalog with filtering and search
- Inline cart sidebar for real-time order building
- Product detail modal with mockup preview
- Auto-generates mockups with wizard design
- Cached mockup loading for instant retrieval

**Step 5: Checkout & Payment**
- Order review with mockup previews
- Stripe checkout integration
- Guest checkout support
- Order creation with PENDING_PAYMENT status
- Redirect to Stripe hosted checkout
- Success page with order confirmation

---

### Wizard Navigation System

The wizard features a sticky header with integrated navigation controls that provides a seamless user experience across all steps.

#### Navigation Components

**Progress Dots** - Visual indicator of current step (1-5)
- Clickable for completed steps (navigate back)
- Shows checkmarks for completed steps
- Current step highlighted with ring
- Disabled for future steps

**Back Button** - Navigate to previous step
- Hidden on Step 1
- Smooth scroll to top on navigation
- Accessible keyboard navigation

**Restart Button** - Reset wizard with confirmation dialog
- Hidden on Step 5 (Checkout)
- Confirmation dialog prevents accidental resets
- Clears all wizard state including cart

#### Implementation Details

**Location**: `src/components/design/design-wizard.tsx` lines 124-218

**Features**:
- Sticky positioning with backdrop blur (`sticky top-0 bg-background/95 backdrop-blur`)
- Responsive layout (mobile-friendly with abbreviated labels)
- Smooth scroll to top on navigation
- AnimatePresence for step transitions
- 32px spacing (`mt-8`) between header and content for better visual hierarchy

**Code Example**:
```typescript
<div className="sticky top-0 z-20 bg-background/95 backdrop-blur">
  <div className="container mx-auto px-4 py-3">
    <div className="flex items-center justify-between gap-4">
      {/* Left: Back Button */}
      {currentStep > 1 && (
        <Button variant="ghost" size="sm" onClick={() => previousStep()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}

      {/* Center: Progress Dots */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <button
            onClick={() => step < currentStep && goToStep(step)}
            disabled={step > currentStep}
            className={/* dynamic styling */}
          >
            {step < currentStep ? <Check /> : <span>{step}</span>}
          </button>
        ))}
      </div>

      {/* Right: Restart Button */}
      {currentStep < 5 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            {/* Confirmation dialog */}
          </DialogContent>
        </Dialog>
      )}
    </div>
  </div>
</div>
```

**Recent Improvements**:
- Removed FloatingNextButton component (redundant after unified navigation)
- Added spacing between header and content for better UX
- Integrated all navigation into single sticky header

---

### Event Details Auto-Clear Feature

When a user navigates back to Step 1 and selects a different event type, the event details form is automatically cleared to prevent orphaned data from the previous type.

#### Why This Matters

**Problem**: Without auto-clearing, changing from "Charity" to "Sports" would leave charity-specific fields (like `cause`) in the state, creating data inconsistency and confusing AI prompts.

**Solution**: The `setEventType()` function in the Zustand store detects event type changes and conditionally clears the `eventDetails` object.

#### Implementation

**Location**: `src/lib/store/design-wizard.ts` lines 691-704

```typescript
setEventType: (eventType: EventType) => {
  const { eventType: currentEventType } = get();

  // Only clear eventDetails if event type actually changed
  if (currentEventType !== eventType) {
    set({
      eventType,
      eventDetails: {}, // Clear old details for new event type
    });
  } else {
    // Same event type - preserve existing details
    set({ eventType });
  }
},
```

#### Behavior

- **Type changed** (Charity → Sports): Form cleared, providing a fresh start for the new event type
- **Same type re-selected** (Sports → Sports): Form preserved, preventing accidental data loss

#### Benefits

1. **Data Consistency**: Prevents orphaned fields from previous event type
2. **Better UX**: Users expect a clean form when changing event type
3. **AI Prompt Quality**: Ensures AI prompts only include relevant event details
4. **Correct Validation**: No ghost validation errors from previous type's fields

---

### Canvas Step Integration

> **Note**: The canvas editor is no longer part of the main 5-step wizard flow (which now ends at Checkout). This documentation is preserved for reference as the canvas editor may be used in other parts of the application or future features.

The canvas step (`src/components/design/steps/canvas-step.tsx`) seamlessly integrates AI-generated designs with the interactive canvas editor.

#### Key Features

**1. Auto-Mockup Selection**
```typescript
// Maps product IDs to product types for mockup selection
const PRODUCT_TYPE_MAP = {
  tshirt: 'tshirt',
  sweatshirt: 'sweatshirt',
  hoodie: 'hoodie',
  polo: 'polo',
};

// Auto-selects mockup based on first product
const firstProductId = selectedProducts[0];
const productType = PRODUCT_TYPE_MAP[firstProductId];
const mockup = getMockupsByProduct(productType)[0];
```

**2. AI Design Loading Priority**
```typescript
// Priority 1: AI-generated design from step 4
if (finalDesignUrl) {
  await loadImageOntoCanvas(canvas, finalDesignUrl, mockup.printArea);
}
// Priority 2: Brand logo from step 3
else if (brandAssets.logos.length > 0) {
  await loadImageOntoCanvas(canvas, brandAssets.logos[0], mockup.printArea);
}
// Priority 3: Manual upload interface shown
```

**3. Canvas Controls**
- **Rotate**: 15° increments
- **Zoom In/Out**: 10% scale adjustments
- **Delete**: Remove selected object
- **Drag**: Move within print area bounds
- **Manual Scale/Rotate**: Via Fabric.js handles

**4. Design Metadata Saved**
When a design is saved, the following metadata is captured:
```typescript
{
  canvasJSON: string,        // Fabric.js canvas state (editable)
  imageUrl: string,          // Exported PNG (final design)
  metadata: {
    eventType: string,       // From step 1
    products: string[],      // From step 2
    hasAIDesign: boolean,    // Whether design was AI-generated
    brandColors: string[],   // From step 3
    aiPrompt?: string,       // Original prompt if AI-generated
  }
}
```

#### Workflow Examples

**AI Design Workflow:**
1. User generates design in step 4: "Bold lion mascot with team colors"
2. User selects design and clicks "Continue to Canvas"
3. Canvas step auto-loads:
   - Mockup: t-shirt (from step 2 product selection)
   - Design: AI-generated lion image (from step 4)
   - Badge: "AI Generated Design" displayed
4. User adjusts positioning, rotation, scale as needed
5. User clicks "Save Design" - metadata includes original AI prompt

**Manual Upload Workflow:**
1. User skips AI design generation in step 4
2. Canvas step auto-loads:
   - Mockup: hoodie (from step 2 product selection)
   - Design: Brand logo (from step 3 brand assets)
3. OR user uploads new logo via drag-and-drop interface
4. User positions and saves

**Hybrid Workflow:**
1. User generates AI design but also has brand assets
2. Canvas loads AI design automatically
3. User can delete AI design and upload manual logo if needed
4. Full flexibility to switch between approaches

#### Technical Implementation

**Canvas Initialization:**
```typescript
const canvas = initializeCanvas(canvasRef.current, 600, 700, {
  backgroundColor: '#f8f9fa',
  selectionColor: 'rgba(100, 150, 255, 0.3)',
});

setupPrintAreaBounds(canvas, mockup.printArea, {
  stroke: '#4a90e2',
  strokeWidth: 2,
  fill: 'rgba(74, 144, 226, 0.05)',
});
```

**Boundary Constraints:**
```typescript
canvas.on('object:moving', (e) => {
  if (e.target) {
    constrainObjectToBounds(e.target, mockup.printArea);
  }
});
```

**Export Options:**
- **Save**: 2x resolution PNG + Canvas JSON for editing
- **Download**: 3x resolution PNG for high-quality preview

#### File Upload Integration

Manual logo upload uses the same Supabase Storage infrastructure as brand assets:
- **Location**: `{userId}/logos/{timestamp}-{random}-{filename}.png`
- **Validation**: Client-side (file type, size) + Server-side (DPI, dimensions)
- **Max Size**: 5MB
- **Formats**: PNG, JPG, SVG

---

## 5-Step Design Wizard with Integrated Checkout

GenAI-Merch features a complete 5-step wizard flow that takes users from concept to payment:

### Wizard Steps

**Step 1: Event Type Selection**
- User selects purpose: charity, sports, company, family, school, other
- Contextualizes AI design generation in later steps

**Step 2: Event Details**
- Dynamic form based on event type
- Gathers relevant context (team name, sport, cause, etc.)
- All fields feed into AI prompt generation

**Step 3: AI Design Chat**
- Split-screen: Chat interface + design gallery
- Optional brand assets (logos, colors, fonts, voice)
- GPT-4 helps refine design ideas
- DALL-E 3 generates designs
- Designs saved to Zustand store

**Step 4: Product Showcase**
- Full product catalog with filtering and search
- Inline cart sidebar for real-time order building
- Product detail modal with mockup preview
- **Auto-generates mockups** with wizard design
- **Cached mockup loading** - instant retrieval on variant switching
- Add to cart with customization metadata

**Step 5: Checkout & Payment**
- Order review with mockup previews
- Stripe checkout integration
- Guest checkout support
- Order creation with PENDING_PAYMENT status
- Redirect to Stripe hosted checkout
- Success page with order confirmation

### Cart Integration in Step 4

The Product Showcase step includes a persistent cart sidebar:

**Features:**
- Real-time cart updates
- Quantity controls (+/- buttons)
- Item removal
- Mockup thumbnails
- Technique and placement badges
- Subtotal calculation
- "Proceed to Checkout" button → Step 5

**Cart Item Structure:**
```typescript
{
  id: string,                  // Temporary cart ID
  productVariantId: string,    // Database variant ID
  product: { name, imageUrl, productType },
  variant: { name, size, color },
  design: {
    id: 'wizard-design',      // Placeholder (not database ID)
    imageUrl: string,          // Design URL
    thumbnailUrl: string
  },
  mockupConfig: {
    mockupUrl: string,         // Generated mockup
    technique: 'dtg' | 'embroidery' | 'sublimation',
    placement: 'front' | 'back' | 'sleeve_left' | 'sleeve_right',
    styleId: number,           // Printful style ID
    styleName: string          // e.g., "Men's T-Shirt"
  },
  quantity: number,
  unitPrice: number            // Price in cents
}
```

### Checkout Navigation Flow

**Cart Sidebar → Checkout Step:**
1. User clicks "Proceed to Checkout" in cart sidebar (Step 4)
2. `handleCheckout` calls `nextStep()` from Zustand store
3. `currentStep` changes from 4 → 5
4. Design Wizard re-renders with CheckoutStep component
5. URL remains `/design/create` (no query param update needed)

**Checkout Step → Stripe Payment:**
1. User reviews order items and pricing
2. Clicks "Proceed to Payment" button
3. `createCheckoutSession()` API call creates:
   - Order record with PENDING_PAYMENT status
   - OrderItems with frozen product/variant details
   - Stripe checkout session with line items
4. Design records handled intelligently:
   - **Placeholder IDs** (`'wizard-design'`) → stored in customizationData only
   - **Real UUIDs** → connected to Design table relation
   - UUID validation regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
5. Redirects to Stripe hosted checkout page
6. After payment, redirects to success page
7. Cart automatically cleared on success

### Key Implementation Details

**Wizard State Management (Zustand):**
```typescript
interface DesignWizardState {
  currentStep: 1 | 2 | 3 | 4 | 5,
  eventType: EventType | null,
  eventDetails: EventDetails,
  brandAssets: BrandAssets,
  generatedDesigns: GeneratedDesign[],
  selectedDesignId: string | null,
  finalDesignUrl: string | null,

  // Navigation
  nextStep: () => void,
  previousStep: () => void,
  goToStep: (step) => void,
}
```

**Cart State Management (Zustand):**
```typescript
interface CartStore {
  items: CartItem[],
  subtotal: number,        // Auto-calculated
  itemCount: number,       // Auto-calculated

  addItem: (item) => void,
  removeItem: (id) => void,
  updateQuantity: (id, qty) => void,
  clearCart: () => void,
}
```

**Checkout API Route (`/api/stripe/create-checkout`):**
- Validates product availability and pricing
- Creates Order with PENDING_PAYMENT status
- Creates OrderItems with customization metadata
- Handles placeholder vs real Design IDs
- Creates Stripe session with shipping options
- Returns session ID and URL for redirect

**Success Page (`/checkout/success`):**
- Retrieves session details from Stripe
- Displays order confirmation
- Shows final pricing (with Stripe-calculated shipping/tax)
- Automatically clears cart
- Provides "Track Order" and "Continue Shopping" CTAs

### Recent Fixes (2026-01-10)

**Fix 1: Checkout Button Navigation**
- **Issue**: Cart sidebar "Proceed to Checkout" button wasn't navigating to Step 5
- **Root Cause**: Button called `complete()` instead of `nextStep()`
- **Solution**: Updated ProductShowcaseStep to call `nextStep()` for checkout navigation
- **Files Changed**: `src/components/design/steps/product-showcase-step.tsx`

**Fix 2: Design Record Connection Error**
- **Issue**: Checkout failed with "No 'Design' record found" error
- **Root Cause**: Cart items had placeholder ID `'wizard-design'` instead of database UUID
- **Solution**: Added UUID validation before Design relation connection
- **Impact**: Placeholder IDs skip relation, design URL still saved in customizationData
- **Files Changed**: `src/app/api/stripe/create-checkout/route.ts`

---

## Order Fulfillment System (Trigger.dev)

GenAI-Merch uses Trigger.dev for background job processing to handle Printful order submission after Stripe payment confirmation.

### Architecture Overview

```
Customer Payment (Stripe Checkout)
         ↓
Stripe Webhook (checkout.session.completed)
         ↓
Update Order Status → PAID
         ↓
Trigger Background Job (submit-pod-order)
         ↓
Fetch Order Details from Database
         ↓
Build Printful Order Payload
         ↓
Submit to Printful API (createOrder + confirmOrder)
         ↓
Update Order Status → SUBMITTED_TO_POD
         ↓
Save printfulOrderId to Database
```

### Key Components

**1. Trigger.dev Configuration**
- **Location**: `trigger.config.ts`
- **Tasks Directory**: `src/trigger/`
- **Default Retry**: 3 attempts with exponential backoff (1s, 2s, 4s)

**2. Order Submission Job (`src/trigger/submit-pod-order.ts`)**
- Fetches order with all relations (items, variants, shipping address)
- Validates order can be submitted (PAID status, has address, has design URLs)
- Builds Printful payload from order items with design files
- Creates draft order, then confirms for fulfillment
- Updates database with Printful order ID and status
- On final failure: Auto-refunds via Stripe, marks order as FAILED/REFUNDED

**3. Stripe Webhook Handler (`src/app/api/webhooks/stripe/route.ts`)**
- Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- Handles `checkout.session.completed` event:
  - Updates order totals with Stripe-calculated shipping/tax
  - Saves shipping address from Stripe session
  - Updates order status to PAID
  - Triggers Printful submission job
- Handles `checkout.session.expired`: Cancels pending orders
- Idempotency: Tracks processed event IDs to prevent duplicates

**4. Order Status Utilities (`src/lib/orders/status.ts`)**
- `updateOrderStatus()` - Updates status with automatic history tracking
- `createStatusHistory()` - Creates audit trail entry
- `getOrderForPrintful()` - Fetches order with all required relations
- `validateOrderForPrintful()` - Validates order can be submitted
- `handleOrderFailure()` - Handles failure with auto-refund via Stripe

### Order Status Flow

```
PENDING_PAYMENT (Order created in checkout)
      ↓ Stripe webhook: checkout.session.completed
PAID (Payment confirmed)
      ↓ Trigger.dev job: submit-pod-order
SUBMITTED_TO_POD (Sent to Printful)
      ↓ Printful webhook (future)
IN_PRODUCTION (Being manufactured)
      ↓ Printful webhook (future)
SHIPPED (Tracking number available)
      ↓ Delivery confirmation
DELIVERED
```

**Failure Paths:**
- `PAID → FAILED → REFUNDED` (Printful submission fails after 3 retries)
- `PENDING_PAYMENT → CANCELLED` (Checkout session expires)

### Environment Variables

```bash
# Trigger.dev (get from dashboard after `npx trigger.dev@latest dev`)
TRIGGER_SECRET_KEY=tr_dev_...

# Stripe Webhook (from Stripe CLI or Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_...

# Database (CRITICAL for Trigger.dev workers)
DATABASE_URL="postgresql://...pooler.supabase.com:5432/postgres"  # Pooler URL
DIRECT_DATABASE_URL="postgresql://...db.PROJECT-REF.supabase.co:5432/postgres"  # Direct URL
```

### Database Connection Configuration (Critical)

Trigger.dev workers run in isolated environments that can't connect through Supabase's connection pooler. This causes a `FATAL: Tenant or user not found` error.

**Solution: Three-part configuration**

**1. Prisma Schema (`prisma/schema.prisma`):**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

**2. Trigger.dev Config (`trigger.config.ts`):**
```typescript
import { prismaExtension } from '@trigger.dev/build/extensions/prisma';

export default defineConfig({
  // ...
  build: {
    extensions: [
      prismaExtension({
        schema: 'prisma/schema.prisma',
        directUrlEnvVarName: 'DIRECT_DATABASE_URL',
      }),
    ],
  },
});
```

**3. Prisma Client Runtime Override (`src/lib/prisma.ts`):**
```typescript
// Use direct URL for Trigger.dev workers (bypasses pooler issues)
// Falls back to DATABASE_URL for Next.js app
const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

export const prisma = new PrismaClient({
  datasourceUrl: databaseUrl,  // Runtime override - THIS IS THE KEY FIX
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
});
```

**Why this works:**
- `directUrl` in Prisma schema only affects migrations, NOT runtime queries
- `datasourceUrl` in PrismaClient constructor overrides the schema's `url` at runtime
- Both Next.js app and Trigger.dev workers now use `DIRECT_DATABASE_URL`
- Direct connection (`db.*.supabase.co`) bypasses pooler routing issues

**Troubleshooting:**
- If you see `FATAL: Tenant or user not found` - check that `DIRECT_DATABASE_URL` is set
- If Trigger.dev tasks fail with database errors - verify the Prisma extension is configured
- Get direct URL from: Supabase Dashboard → Settings → Database → Connection string → URI (Direct)

### Local Development

**1. Start Trigger.dev dev server:**
```bash
npx trigger.dev@latest dev
```

**2. Forward Stripe webhooks (separate terminal):**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**3. Copy the webhook secret from Stripe CLI output to `.env.local`**

### Testing Checklist

**Test Payment Flow:**
1. Create test order in design wizard
2. Complete checkout with test card: `4242 4242 4242 4242`
3. Check Trigger.dev dashboard for job execution
4. Verify order status updated to SUBMITTED_TO_POD in database
5. Check Printful dashboard for order (in sandbox mode)

**Test Failure Handling:**
1. Temporarily set invalid Printful API key
2. Complete checkout
3. Verify job retries 3 times in Trigger.dev dashboard
4. Verify refund created in Stripe dashboard
5. Verify order status is REFUNDED in database

### Monitoring

- **Trigger.dev Dashboard**: View job executions, logs, retries, and failures
- **Stripe Dashboard**: Monitor webhook deliveries and payment events
- **Console Logs**: Detailed `[Stripe Webhook]` and `[Order Status]` prefixed logs

---

## Notes & Reminders

- **Cost optimization**: Monitor OpenAI and Printful API usage
- **Webhook security**: Always verify Stripe and Printful webhook signatures
- **Image optimization**: Compress designs before upload to reduce storage costs
- **Rate limiting**: Implement on AI generation endpoints to prevent abuse
- **Testing accounts**: Use Stripe test mode and Printful sandbox for development
- **Accessibility**: Follow WCAG guidelines for all UI components
- **Performance**: Lazy load images and components where possible
- **Design placeholder IDs**: Always use `'wizard-design'` for non-persisted designs in cart

---

**Last Updated**: 2026-01-24 (Added Trigger.dev database connection fix for Supabase pooler issues)


<!-- TRIGGER.DEV basic START -->
# Trigger.dev Basic Tasks (v4)

**MUST use `@trigger.dev/sdk`, NEVER `client.defineJob`**

## Basic Task

```ts
import { task } from "@trigger.dev/sdk";

export const processData = task({
  id: "process-data",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: { userId: string; data: any[] }) => {
    // Task logic - runs for long time, no timeouts
    console.log(`Processing ${payload.data.length} items for user ${payload.userId}`);
    return { processed: payload.data.length };
  },
});
```

## Schema Task (with validation)

```ts
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const validatedTask = schemaTask({
  id: "validated-task",
  schema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
  run: async (payload) => {
    // Payload is automatically validated and typed
    return { message: `Hello ${payload.name}, age ${payload.age}` };
  },
});
```

## Triggering Tasks

### From Backend Code

```ts
import { tasks } from "@trigger.dev/sdk";
import type { processData } from "./trigger/tasks";

// Single trigger
const handle = await tasks.trigger<typeof processData>("process-data", {
  userId: "123",
  data: [{ id: 1 }, { id: 2 }],
});

// Batch trigger (up to 1,000 items, 3MB per payload)
const batchHandle = await tasks.batchTrigger<typeof processData>("process-data", [
  { payload: { userId: "123", data: [{ id: 1 }] } },
  { payload: { userId: "456", data: [{ id: 2 }] } },
]);
```

### Debounced Triggering

Consolidate multiple triggers into a single execution:

```ts
// Multiple rapid triggers with same key = single execution
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique key for debounce group
      delay: "5s",              // Wait before executing
    },
  }
);

// Trailing mode: use payload from LAST trigger
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",  // Default is "leading" (first payload)
    },
  }
);
```

**Debounce modes:**
- `leading` (default): Uses payload from first trigger, subsequent triggers only reschedule
- `trailing`: Uses payload from most recent trigger

### From Inside Tasks (with Result handling)

```ts
export const parentTask = task({
  id: "parent-task",
  run: async (payload) => {
    // Trigger and continue
    const handle = await childTask.trigger({ data: "value" });

    // Trigger and wait - returns Result object, NOT task output
    const result = await childTask.triggerAndWait({ data: "value" });
    if (result.ok) {
      console.log("Task output:", result.output); // Actual task return value
    } else {
      console.error("Task failed:", result.error);
    }

    // Quick unwrap (throws on error)
    const output = await childTask.triggerAndWait({ data: "value" }).unwrap();

    // Batch trigger and wait
    const results = await childTask.batchTriggerAndWait([
      { payload: { data: "item1" } },
      { payload: { data: "item2" } },
    ]);

    for (const run of results) {
      if (run.ok) {
        console.log("Success:", run.output);
      } else {
        console.log("Failed:", run.error);
      }
    }
  },
});

export const childTask = task({
  id: "child-task",
  run: async (payload: { data: string }) => {
    return { processed: payload.data };
  },
});
```

> Never wrap triggerAndWait or batchTriggerAndWait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Waits

```ts
import { task, wait } from "@trigger.dev/sdk";

export const taskWithWaits = task({
  id: "task-with-waits",
  run: async (payload) => {
    console.log("Starting task");

    // Wait for specific duration
    await wait.for({ seconds: 30 });
    await wait.for({ minutes: 5 });
    await wait.for({ hours: 1 });
    await wait.for({ days: 1 });

    // Wait until specific date
    await wait.until({ date: new Date("2024-12-25") });

    // Wait for token (from external system)
    await wait.forToken({
      token: "user-approval-token",
      timeoutInSeconds: 3600, // 1 hour timeout
    });

    console.log("All waits completed");
    return { status: "completed" };
  },
});
```

> Never wrap wait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Key Points

- **Result vs Output**: `triggerAndWait()` returns a `Result` object with `ok`, `output`, `error` properties - NOT the direct task output
- **Type safety**: Use `import type` for task references when triggering from backend
- **Waits > 5 seconds**: Automatically checkpointed, don't count toward compute usage
- **Debounce + idempotency**: Idempotency keys take precedence over debounce settings

## NEVER Use (v2 deprecated)

```ts
// BREAKS APPLICATION
client.defineJob({
  id: "job-id",
  run: async (payload, io) => {
    /* ... */
  },
});
```

Use SDK (`@trigger.dev/sdk`), check `result.ok` before accessing `result.output`

<!-- TRIGGER.DEV basic END -->

<!-- TRIGGER.DEV advanced-tasks START -->
# Trigger.dev Advanced Tasks (v4)

**Advanced patterns and features for writing tasks**

## Tags & Organization

```ts
import { task, tags } from "@trigger.dev/sdk";

export const processUser = task({
  id: "process-user",
  run: async (payload: { userId: string; orgId: string }, { ctx }) => {
    // Add tags during execution
    await tags.add(`user_${payload.userId}`);
    await tags.add(`org_${payload.orgId}`);

    return { processed: true };
  },
});

// Trigger with tags
await processUser.trigger(
  { userId: "123", orgId: "abc" },
  { tags: ["priority", "user_123", "org_abc"] } // Max 10 tags per run
);

// Subscribe to tagged runs
for await (const run of runs.subscribeToRunsWithTag("user_123")) {
  console.log(`User task ${run.id}: ${run.status}`);
}
```

**Tag Best Practices:**

- Use prefixes: `user_123`, `org_abc`, `video:456`
- Max 10 tags per run, 1-64 characters each
- Tags don't propagate to child tasks automatically

## Batch Triggering v2

Enhanced batch triggering with larger payloads and streaming ingestion.

### Limits

- **Maximum batch size**: 1,000 items (increased from 500)
- **Payload per item**: 3MB each (increased from 1MB combined)
- Payloads > 512KB automatically offload to object storage

### Rate Limiting (per environment)

| Tier | Bucket Size | Refill Rate |
|------|-------------|-------------|
| Free | 1,200 runs | 100 runs/10 sec |
| Hobby | 5,000 runs | 500 runs/5 sec |
| Pro | 5,000 runs | 500 runs/5 sec |

### Concurrent Batch Processing

| Tier | Concurrent Batches |
|------|-------------------|
| Free | 1 |
| Hobby | 10 |
| Pro | 10 |

### Usage

```ts
import { myTask } from "./trigger/myTask";

// Basic batch trigger (up to 1,000 items)
const runs = await myTask.batchTrigger([
  { payload: { userId: "user-1" } },
  { payload: { userId: "user-2" } },
  { payload: { userId: "user-3" } },
]);

// Batch trigger with wait
const results = await myTask.batchTriggerAndWait([
  { payload: { userId: "user-1" } },
  { payload: { userId: "user-2" } },
]);

for (const result of results) {
  if (result.ok) {
    console.log("Result:", result.output);
  }
}

// With per-item options
const batchHandle = await myTask.batchTrigger([
  {
    payload: { userId: "123" },
    options: {
      idempotencyKey: "user-123-batch",
      tags: ["priority"],
    },
  },
  {
    payload: { userId: "456" },
    options: {
      idempotencyKey: "user-456-batch",
    },
  },
]);
```

## Debouncing

Consolidate multiple triggers into a single execution by debouncing task runs with a unique key and delay window.

### Use Cases

- **User activity updates**: Batch rapid user actions into a single run
- **Webhook deduplication**: Handle webhook bursts without redundant processing
- **Search indexing**: Combine document updates instead of processing individually
- **Notification batching**: Group notifications to prevent user spam

### Basic Usage

```ts
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique identifier for debounce group
      delay: "5s",              // Wait duration ("5s", "1m", or milliseconds)
    },
  }
);
```

### Execution Modes

**Leading Mode** (default): Uses payload/options from the first trigger; subsequent triggers only reschedule execution time.

```ts
// First trigger sets the payload
await myTask.trigger({ action: "first" }, {
  debounce: { key: "my-key", delay: "10s" }
});

// Second trigger only reschedules - payload remains "first"
await myTask.trigger({ action: "second" }, {
  debounce: { key: "my-key", delay: "10s" }
});
// Task executes with { action: "first" }
```

**Trailing Mode**: Uses payload/options from the most recent trigger.

```ts
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",
    },
  }
);
```

In trailing mode, these options update with each trigger:
- `payload` — task input data
- `metadata` — run metadata
- `tags` — run tags (replaces existing)
- `maxAttempts` — retry attempts
- `maxDuration` — maximum compute time
- `machine` — machine preset

### Important Notes

- Idempotency keys take precedence over debounce settings
- Compatible with `triggerAndWait()` — parent runs block correctly on debounced execution
- Debounce key is scoped to the task

## Concurrency & Queues

```ts
import { task, queue } from "@trigger.dev/sdk";

// Shared queue for related tasks
const emailQueue = queue({
  name: "email-processing",
  concurrencyLimit: 5, // Max 5 emails processing simultaneously
});

// Task-level concurrency
export const oneAtATime = task({
  id: "sequential-task",
  queue: { concurrencyLimit: 1 }, // Process one at a time
  run: async (payload) => {
    // Critical section - only one instance runs
  },
});

// Per-user concurrency
export const processUserData = task({
  id: "process-user-data",
  run: async (payload: { userId: string }) => {
    // Override queue with user-specific concurrency
    await childTask.trigger(payload, {
      queue: {
        name: `user-${payload.userId}`,
        concurrencyLimit: 2,
      },
    });
  },
});

export const emailTask = task({
  id: "send-email",
  queue: emailQueue, // Use shared queue
  run: async (payload: { to: string }) => {
    // Send email logic
  },
});
```

## Error Handling & Retries

```ts
import { task, retry, AbortTaskRunError } from "@trigger.dev/sdk";

export const resilientTask = task({
  id: "resilient-task",
  retry: {
    maxAttempts: 10,
    factor: 1.8, // Exponential backoff multiplier
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  catchError: async ({ error, ctx }) => {
    // Custom error handling
    if (error.code === "FATAL_ERROR") {
      throw new AbortTaskRunError("Cannot retry this error");
    }

    // Log error details
    console.error(`Task ${ctx.task.id} failed:`, error);

    // Allow retry by returning nothing
    return { retryAt: new Date(Date.now() + 60000) }; // Retry in 1 minute
  },
  run: async (payload) => {
    // Retry specific operations
    const result = await retry.onThrow(
      async () => {
        return await unstableApiCall(payload);
      },
      { maxAttempts: 3 }
    );

    // Conditional HTTP retries
    const response = await retry.fetch("https://api.example.com", {
      retry: {
        maxAttempts: 5,
        condition: (response, error) => {
          return response?.status === 429 || response?.status >= 500;
        },
      },
    });

    return result;
  },
});
```

## Machines & Performance

```ts
export const heavyTask = task({
  id: "heavy-computation",
  machine: { preset: "large-2x" }, // 8 vCPU, 16 GB RAM
  maxDuration: 1800, // 30 minutes timeout
  run: async (payload, { ctx }) => {
    // Resource-intensive computation
    if (ctx.machine.preset === "large-2x") {
      // Use all available cores
      return await parallelProcessing(payload);
    }

    return await standardProcessing(payload);
  },
});

// Override machine when triggering
await heavyTask.trigger(payload, {
  machine: { preset: "medium-1x" }, // Override for this run
});
```

**Machine Presets:**

- `micro`: 0.25 vCPU, 0.25 GB RAM
- `small-1x`: 0.5 vCPU, 0.5 GB RAM (default)
- `small-2x`: 1 vCPU, 1 GB RAM
- `medium-1x`: 1 vCPU, 2 GB RAM
- `medium-2x`: 2 vCPU, 4 GB RAM
- `large-1x`: 4 vCPU, 8 GB RAM
- `large-2x`: 8 vCPU, 16 GB RAM

## Idempotency

```ts
import { task, idempotencyKeys } from "@trigger.dev/sdk";

export const paymentTask = task({
  id: "process-payment",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { orderId: string; amount: number }) => {
    // Automatically scoped to this task run, so if the task is retried, the idempotency key will be the same
    const idempotencyKey = await idempotencyKeys.create(`payment-${payload.orderId}`);

    // Ensure payment is processed only once
    await chargeCustomer.trigger(payload, {
      idempotencyKey,
      idempotencyKeyTTL: "24h", // Key expires in 24 hours
    });
  },
});

// Payload-based idempotency
import { createHash } from "node:crypto";

function createPayloadHash(payload: any): string {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(payload));
  return hash.digest("hex");
}

export const deduplicatedTask = task({
  id: "deduplicated-task",
  run: async (payload) => {
    const payloadHash = createPayloadHash(payload);
    const idempotencyKey = await idempotencyKeys.create(payloadHash);

    await processData.trigger(payload, { idempotencyKey });
  },
});
```

## Metadata & Progress Tracking

```ts
import { task, metadata } from "@trigger.dev/sdk";

export const batchProcessor = task({
  id: "batch-processor",
  run: async (payload: { items: any[] }, { ctx }) => {
    const totalItems = payload.items.length;

    // Initialize progress metadata
    metadata
      .set("progress", 0)
      .set("totalItems", totalItems)
      .set("processedItems", 0)
      .set("status", "starting");

    const results = [];

    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];

      // Process item
      const result = await processItem(item);
      results.push(result);

      // Update progress
      const progress = ((i + 1) / totalItems) * 100;
      metadata
        .set("progress", progress)
        .increment("processedItems", 1)
        .append("logs", `Processed item ${i + 1}/${totalItems}`)
        .set("currentItem", item.id);
    }

    // Final status
    metadata.set("status", "completed");

    return { results, totalProcessed: results.length };
  },
});

// Update parent metadata from child task
export const childTask = task({
  id: "child-task",
  run: async (payload, { ctx }) => {
    // Update parent task metadata
    metadata.parent.set("childStatus", "processing");
    metadata.root.increment("childrenCompleted", 1);

    return { processed: true };
  },
});
```

## Logging & Tracing

```ts
import { task, logger } from "@trigger.dev/sdk";

export const tracedTask = task({
  id: "traced-task",
  run: async (payload, { ctx }) => {
    logger.info("Task started", { userId: payload.userId });

    // Custom trace with attributes
    const user = await logger.trace(
      "fetch-user",
      async (span) => {
        span.setAttribute("user.id", payload.userId);
        span.setAttribute("operation", "database-fetch");

        const userData = await database.findUser(payload.userId);
        span.setAttribute("user.found", !!userData);

        return userData;
      },
      { userId: payload.userId }
    );

    logger.debug("User fetched", { user: user.id });

    try {
      const result = await processUser(user);
      logger.info("Processing completed", { result });
      return result;
    } catch (error) {
      logger.error("Processing failed", {
        error: error.message,
        userId: payload.userId,
      });
      throw error;
    }
  },
});
```

## Hidden Tasks

```ts
// Hidden task - not exported, only used internally
const internalProcessor = task({
  id: "internal-processor",
  run: async (payload: { data: string }) => {
    return { processed: payload.data.toUpperCase() };
  },
});

// Public task that uses hidden task
export const publicWorkflow = task({
  id: "public-workflow",
  run: async (payload: { input: string }) => {
    // Use hidden task internally
    const result = await internalProcessor.triggerAndWait({
      data: payload.input,
    });

    if (result.ok) {
      return { output: result.output.processed };
    }

    throw new Error("Internal processing failed");
  },
});
```

## Best Practices

- **Concurrency**: Use queues to prevent overwhelming external services
- **Retries**: Configure exponential backoff for transient failures
- **Idempotency**: Always use for payment/critical operations
- **Metadata**: Track progress for long-running tasks
- **Machines**: Match machine size to computational requirements
- **Tags**: Use consistent naming patterns for filtering
- **Debouncing**: Use for user activity, webhooks, and notification batching
- **Batch triggering**: Use for bulk operations up to 1,000 items
- **Error Handling**: Distinguish between retryable and fatal errors

Design tasks to be stateless, idempotent, and resilient to failures. Use metadata for state tracking and queues for resource management.

<!-- TRIGGER.DEV advanced-tasks END -->

<!-- TRIGGER.DEV config START -->
# Trigger.dev Configuration (v4)

**Complete guide to configuring `trigger.config.ts` with build extensions**

## Basic Configuration

```ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "<project-ref>", // Required: Your project reference
  dirs: ["./trigger"], // Task directories
  runtime: "node", // "node", "node-22", or "bun"
  logLevel: "info", // "debug", "info", "warn", "error"

  // Default retry settings
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },

  // Build configuration
  build: {
    autoDetectExternal: true,
    keepNames: true,
    minify: false,
    extensions: [], // Build extensions go here
  },

  // Global lifecycle hooks
  onStartAttempt: async ({ payload, ctx }) => {
    console.log("Global task start");
  },
  onSuccess: async ({ payload, output, ctx }) => {
    console.log("Global task success");
  },
  onFailure: async ({ payload, error, ctx }) => {
    console.log("Global task failure");
  },
});
```

## Build Extensions

### Database & ORM

#### Prisma

```ts
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

extensions: [
  prismaExtension({
    schema: "prisma/schema.prisma",
    version: "5.19.0", // Optional: specify version
    migrate: true, // Run migrations during build
    directUrlEnvVarName: "DIRECT_DATABASE_URL",
    typedSql: true, // Enable TypedSQL support
  }),
];
```

#### TypeScript Decorators (for TypeORM)

```ts
import { emitDecoratorMetadata } from "@trigger.dev/build/extensions/typescript";

extensions: [
  emitDecoratorMetadata(), // Enables decorator metadata
];
```

### Scripting Languages

#### Python

```ts
import { pythonExtension } from "@trigger.dev/build/extensions/python";

extensions: [
  pythonExtension({
    scripts: ["./python/**/*.py"], // Copy Python files
    requirementsFile: "./requirements.txt", // Install packages
    devPythonBinaryPath: ".venv/bin/python", // Dev mode binary
  }),
];

// Usage in tasks
const result = await python.runInline(`print("Hello, world!")`);
const output = await python.runScript("./python/script.py", ["arg1"]);
```

### Browser Automation

#### Playwright

```ts
import { playwright } from "@trigger.dev/build/extensions/playwright";

extensions: [
  playwright({
    browsers: ["chromium", "firefox", "webkit"], // Default: ["chromium"]
    headless: true, // Default: true
  }),
];
```

#### Puppeteer

```ts
import { puppeteer } from "@trigger.dev/build/extensions/puppeteer";

extensions: [puppeteer()];

// Environment variable needed:
// PUPPETEER_EXECUTABLE_PATH: "/usr/bin/google-chrome-stable"
```

#### Lightpanda

```ts
import { lightpanda } from "@trigger.dev/build/extensions/lightpanda";

extensions: [
  lightpanda({
    version: "latest", // or "nightly"
    disableTelemetry: false,
  }),
];
```

### Media Processing

#### FFmpeg

```ts
import { ffmpeg } from "@trigger.dev/build/extensions/core";

extensions: [
  ffmpeg({ version: "7" }), // Static build, or omit for Debian version
];

// Automatically sets FFMPEG_PATH and FFPROBE_PATH
// Add fluent-ffmpeg to external packages if using
```

#### Audio Waveform

```ts
import { audioWaveform } from "@trigger.dev/build/extensions/audioWaveform";

extensions: [
  audioWaveform(), // Installs Audio Waveform 1.1.0
];
```

### System & Package Management

#### System Packages (apt-get)

```ts
import { aptGet } from "@trigger.dev/build/extensions/core";

extensions: [
  aptGet({
    packages: ["ffmpeg", "imagemagick", "curl=7.68.0-1"], // Can specify versions
  }),
];
```

#### Additional NPM Packages

Only use this for installing CLI tools, NOT packages you import in your code.

```ts
import { additionalPackages } from "@trigger.dev/build/extensions/core";

extensions: [
  additionalPackages({
    packages: ["wrangler"], // CLI tools and specific versions
  }),
];
```

#### Additional Files

```ts
import { additionalFiles } from "@trigger.dev/build/extensions/core";

extensions: [
  additionalFiles({
    files: ["wrangler.toml", "./assets/**", "./fonts/**"], // Glob patterns supported
  }),
];
```

### Environment & Build Tools

#### Environment Variable Sync

```ts
import { syncEnvVars } from "@trigger.dev/build/extensions/core";

extensions: [
  syncEnvVars(async (ctx) => {
    // ctx contains: environment, projectRef, env
    return [
      { name: "SECRET_KEY", value: await getSecret(ctx.environment) },
      { name: "API_URL", value: ctx.environment === "prod" ? "api.prod.com" : "api.dev.com" },
    ];
  }),
];
```

#### ESBuild Plugins

```ts
import { esbuildPlugin } from "@trigger.dev/build/extensions";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

extensions: [
  esbuildPlugin(
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    { placement: "last", target: "deploy" } // Optional config
  ),
];
```

## Custom Build Extensions

```ts
import { defineConfig } from "@trigger.dev/sdk";

const customExtension = {
  name: "my-custom-extension",

  externalsForTarget: (target) => {
    return ["some-native-module"]; // Add external dependencies
  },

  onBuildStart: async (context) => {
    console.log(`Build starting for ${context.target}`);
    // Register esbuild plugins, modify build context
  },

  onBuildComplete: async (context, manifest) => {
    console.log("Build complete, adding layers");
    // Add build layers, modify deployment
    context.addLayer({
      id: "my-layer",
      files: [{ source: "./custom-file", destination: "/app/custom" }],
      commands: ["chmod +x /app/custom"],
    });
  },
};

export default defineConfig({
  project: "my-project",
  build: {
    extensions: [customExtension],
  },
});
```

## Advanced Configuration

### Telemetry

```ts
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { OpenAIInstrumentation } from "@langfuse/openai";

export default defineConfig({
  // ... other config
  telemetry: {
    instrumentations: [new PrismaInstrumentation(), new OpenAIInstrumentation()],
    exporters: [customExporter], // Optional custom exporters
  },
});
```

### Machine & Performance

```ts
export default defineConfig({
  // ... other config
  defaultMachine: "large-1x", // Default machine for all tasks
  maxDuration: 300, // Default max duration (seconds)
  enableConsoleLogging: true, // Console logging in development
});
```

## Common Extension Combinations

### Full-Stack Web App

```ts
extensions: [
  prismaExtension({ schema: "prisma/schema.prisma", migrate: true }),
  additionalFiles({ files: ["./public/**", "./assets/**"] }),
  syncEnvVars(async (ctx) => [...envVars]),
];
```

### AI/ML Processing

```ts
extensions: [
  pythonExtension({
    scripts: ["./ai/**/*.py"],
    requirementsFile: "./requirements.txt",
  }),
  ffmpeg({ version: "7" }),
  additionalPackages({ packages: ["wrangler"] }),
];
```

### Web Scraping

```ts
extensions: [
  playwright({ browsers: ["chromium"] }),
  puppeteer(),
  additionalFiles({ files: ["./selectors.json", "./proxies.txt"] }),
];
```

## Best Practices

- **Use specific versions**: Pin extension versions for reproducible builds
- **External packages**: Add modules with native addons to the `build.external` array
- **Environment sync**: Use `syncEnvVars` for dynamic secrets
- **File paths**: Use glob patterns for flexible file inclusion
- **Debug builds**: Use `--log-level debug --dry-run` for troubleshooting

Extensions only affect deployment, not local development. Use `external` array for packages that shouldn't be bundled.

<!-- TRIGGER.DEV config END -->

<!-- TRIGGER.DEV scheduled-tasks START -->
# Scheduled tasks (cron)

Recurring tasks using cron. For one-off future runs, use the **delay** option.

## Define a scheduled task

```ts
import { schedules } from "@trigger.dev/sdk";

export const task = schedules.task({
  id: "first-scheduled-task",
  run: async (payload) => {
    payload.timestamp; // Date (scheduled time, UTC)
    payload.lastTimestamp; // Date | undefined
    payload.timezone; // IANA, e.g. "America/New_York" (default "UTC")
    payload.scheduleId; // string
    payload.externalId; // string | undefined
    payload.upcoming; // Date[]

    payload.timestamp.toLocaleString("en-US", { timeZone: payload.timezone });
  },
});
```

> Scheduled tasks need at least one schedule attached to run.

## Attach schedules

**Declarative (sync on dev/deploy):**

```ts
schedules.task({
  id: "every-2h",
  cron: "0 */2 * * *", // UTC
  run: async () => {},
});

schedules.task({
  id: "tokyo-5am",
  cron: { pattern: "0 5 * * *", timezone: "Asia/Tokyo", environments: ["PRODUCTION", "STAGING"] },
  run: async () => {},
});
```

**Imperative (SDK or dashboard):**

```ts
await schedules.create({
  task: task.id,
  cron: "0 0 * * *",
  timezone: "America/New_York", // DST-aware
  externalId: "user_123",
  deduplicationKey: "user_123-daily", // updates if reused
});
```

### Dynamic / multi-tenant example

```ts
// /trigger/reminder.ts
export const reminderTask = schedules.task({
  id: "todo-reminder",
  run: async (p) => {
    if (!p.externalId) throw new Error("externalId is required");
    const user = await db.getUser(p.externalId);
    await sendReminderEmail(user);
  },
});
```

```ts
// app/reminders/route.ts
export async function POST(req: Request) {
  const data = await req.json();
  return Response.json(
    await schedules.create({
      task: reminderTask.id,
      cron: "0 8 * * *",
      timezone: data.timezone,
      externalId: data.userId,
      deduplicationKey: `${data.userId}-reminder`,
    })
  );
}
```

## Cron syntax (no seconds)

```
* * * * *
| | | | └ day of week (0–7 or 1L–7L; 0/7=Sun; L=last)
| | | └── month (1–12)
| | └──── day of month (1–31 or L)
| └────── hour (0–23)
└──────── minute (0–59)
```

## When schedules won't trigger

- **Dev:** only when the dev CLI is running.
- **Staging/Production:** only for tasks in the **latest deployment**.

## SDK management (quick refs)

```ts
await schedules.retrieve(id);
await schedules.list();
await schedules.update(id, { cron: "0 0 1 * *", externalId: "ext", deduplicationKey: "key" });
await schedules.deactivate(id);
await schedules.activate(id);
await schedules.del(id);
await schedules.timezones(); // list of IANA timezones
```

## Dashboard

Create/attach schedules visually (Task, Cron pattern, Timezone, Optional: External ID, Dedup key, Environments). Test scheduled tasks from the **Test** page.

<!-- TRIGGER.DEV scheduled-tasks END -->

<!-- TRIGGER.DEV realtime START -->
# Trigger.dev Realtime (v4)

**Real-time monitoring and updates for runs**

## Core Concepts

Realtime allows you to:

- Subscribe to run status changes, metadata updates, and streams
- Build real-time dashboards and UI updates
- Monitor task progress from frontend and backend

## Authentication

### Public Access Tokens

```ts
import { auth } from "@trigger.dev/sdk";

// Read-only token for specific runs
const publicToken = await auth.createPublicToken({
  scopes: {
    read: {
      runs: ["run_123", "run_456"],
      tasks: ["my-task-1", "my-task-2"],
    },
  },
  expirationTime: "1h", // Default: 15 minutes
});
```

### Trigger Tokens (Frontend only)

```ts
// Single-use token for triggering tasks
const triggerToken = await auth.createTriggerPublicToken("my-task", {
  expirationTime: "30m",
});
```

## Backend Usage

### Subscribe to Runs

```ts
import { runs, tasks } from "@trigger.dev/sdk";

// Trigger and subscribe
const handle = await tasks.trigger("my-task", { data: "value" });

// Subscribe to specific run
for await (const run of runs.subscribeToRun<typeof myTask>(handle.id)) {
  console.log(`Status: ${run.status}, Progress: ${run.metadata?.progress}`);
  if (run.status === "COMPLETED") break;
}

// Subscribe to runs with tag
for await (const run of runs.subscribeToRunsWithTag("user-123")) {
  console.log(`Tagged run ${run.id}: ${run.status}`);
}

// Subscribe to batch
for await (const run of runs.subscribeToBatch(batchId)) {
  console.log(`Batch run ${run.id}: ${run.status}`);
}
```

### Realtime Streams v2 (Recommended)

```ts
import { streams, InferStreamType } from "@trigger.dev/sdk";

// 1. Define streams (shared location)
export const aiStream = streams.define<string>({
  id: "ai-output",
});

export type AIStreamPart = InferStreamType<typeof aiStream>;

// 2. Pipe from task
export const streamingTask = task({
  id: "streaming-task",
  run: async (payload) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: payload.prompt }],
      stream: true,
    });

    const { waitUntilComplete } = aiStream.pipe(completion);
    await waitUntilComplete();
  },
});

// 3. Read from backend
const stream = await aiStream.read(runId, {
  timeoutInSeconds: 300,
  startIndex: 0, // Resume from specific chunk
});

for await (const chunk of stream) {
  console.log("Chunk:", chunk); // Fully typed
}
```

Enable v2 by upgrading to 4.1.0 or later.

## React Frontend Usage

### Installation

```bash
npm add @trigger.dev/react-hooks
```

### Triggering Tasks

```tsx
"use client";
import { useTaskTrigger, useRealtimeTaskTrigger } from "@trigger.dev/react-hooks";
import type { myTask } from "../trigger/tasks";

function TriggerComponent({ accessToken }: { accessToken: string }) {
  // Basic trigger
  const { submit, handle, isLoading } = useTaskTrigger<typeof myTask>("my-task", {
    accessToken,
  });

  // Trigger with realtime updates
  const {
    submit: realtimeSubmit,
    run,
    isLoading: isRealtimeLoading,
  } = useRealtimeTaskTrigger<typeof myTask>("my-task", { accessToken });

  return (
    <div>
      <button onClick={() => submit({ data: "value" })} disabled={isLoading}>
        Trigger Task
      </button>

      <button onClick={() => realtimeSubmit({ data: "realtime" })} disabled={isRealtimeLoading}>
        Trigger with Realtime
      </button>

      {run && <div>Status: {run.status}</div>}
    </div>
  );
}
```

### Subscribing to Runs

```tsx
"use client";
import { useRealtimeRun, useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";
import type { myTask } from "../trigger/tasks";

function SubscribeComponent({ runId, accessToken }: { runId: string; accessToken: string }) {
  // Subscribe to specific run
  const { run, error } = useRealtimeRun<typeof myTask>(runId, {
    accessToken,
    onComplete: (run) => {
      console.log("Task completed:", run.output);
    },
  });

  // Subscribe to tagged runs
  const { runs } = useRealtimeRunsWithTag("user-123", { accessToken });

  if (error) return <div>Error: {error.message}</div>;
  if (!run) return <div>Loading...</div>;

  return (
    <div>
      <div>Status: {run.status}</div>
      <div>Progress: {run.metadata?.progress || 0}%</div>
      {run.output && <div>Result: {JSON.stringify(run.output)}</div>}

      <h3>Tagged Runs:</h3>
      {runs.map((r) => (
        <div key={r.id}>
          {r.id}: {r.status}
        </div>
      ))}
    </div>
  );
}
```

### Realtime Streams with React

```tsx
"use client";
import { useRealtimeStream } from "@trigger.dev/react-hooks";
import { aiStream } from "../trigger/streams";

function StreamComponent({ runId, accessToken }: { runId: string; accessToken: string }) {
  // Pass defined stream directly for type safety
  const { parts, error } = useRealtimeStream(aiStream, runId, {
    accessToken,
    timeoutInSeconds: 300,
    throttleInMs: 50, // Control re-render frequency
  });

  if (error) return <div>Error: {error.message}</div>;
  if (!parts) return <div>Loading...</div>;

  const text = parts.join(""); // parts is typed as AIStreamPart[]

  return <div>Streamed Text: {text}</div>;
}
```

### Wait Tokens

```tsx
"use client";
import { useWaitToken } from "@trigger.dev/react-hooks";

function WaitTokenComponent({ tokenId, accessToken }: { tokenId: string; accessToken: string }) {
  const { complete } = useWaitToken(tokenId, { accessToken });

  return <button onClick={() => complete({ approved: true })}>Approve Task</button>;
}
```

### SWR Hooks (Fetch Once)

```tsx
"use client";
import { useRun } from "@trigger.dev/react-hooks";
import type { myTask } from "../trigger/tasks";

function SWRComponent({ runId, accessToken }: { runId: string; accessToken: string }) {
  const { run, error, isLoading } = useRun<typeof myTask>(runId, {
    accessToken,
    refreshInterval: 0, // Disable polling (recommended)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Run: {run?.status}</div>;
}
```

## Run Object Properties

Key properties available in run subscriptions:

- `id`: Unique run identifier
- `status`: `QUEUED`, `EXECUTING`, `COMPLETED`, `FAILED`, `CANCELED`, etc.
- `payload`: Task input data (typed)
- `output`: Task result (typed, when completed)
- `metadata`: Real-time updatable data
- `createdAt`, `updatedAt`: Timestamps
- `costInCents`: Execution cost

## Best Practices

- **Use Realtime over SWR**: Recommended for most use cases due to rate limits
- **Scope tokens properly**: Only grant necessary read/trigger permissions
- **Handle errors**: Always check for errors in hooks and subscriptions
- **Type safety**: Use task types for proper payload/output typing
- **Cleanup subscriptions**: Backend subscriptions auto-complete, frontend hooks auto-cleanup

<!-- TRIGGER.DEV realtime END -->