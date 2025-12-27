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

Generate custom merchandise designs using GPT-4 + DALL-E 3.

#### Two-Step Process

1. **GPT-4 Prompt Refinement**: Optimizes user's prompt for DALL-E 3
2. **DALL-E 3 Image Generation**: Creates the actual design image

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
- User selects the purpose of their merchandise (charity, sports, company, etc.)
- This context informs AI design generation in later steps
- Influences design recommendations and starter prompts

**Step 2: Product Selection**
- User selects which products they want to order (t-shirts, hoodies, mugs, etc.)
- Multiple products can be selected
- The first selected product determines the default mockup in the canvas editor

**Step 3: Brand Assets Upload (Optional)**
- Users can upload logos, brand colors, fonts, and define brand voice
- All fields are optional - users can skip this step entirely
- Uploaded assets are used to inform AI design generation
- Assets are stored in Supabase Storage under `{userId}/logos/`

**Step 4: AI Design Chat**
- Split-screen interface: Chat on left, generated designs gallery on right
- Users chat with GPT-4 to refine their design ideas
- Users can generate designs with DALL-E 3 based on their description
- All generated designs are saved to the Zustand store
- Users select their favorite design to continue to the canvas

**Step 5: Canvas Editor**
- Interactive Fabric.js canvas for final design customization
- **Auto-loads AI-generated design** from step 4 if available
- **Auto-selects mockup** based on first product from step 2
- Falls back to manual logo upload if no AI design was generated
- Users can drag, scale, rotate, and position designs
- Export options: Save to database and Download as PNG

---

### Canvas Step Integration

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

## Notes & Reminders

- **Cost optimization**: Monitor OpenAI and Printful API usage
- **Webhook security**: Always verify Stripe and Printful webhook signatures
- **Image optimization**: Compress designs before upload to reduce storage costs
- **Rate limiting**: Implement on AI generation endpoints to prevent abuse
- **Testing accounts**: Use Stripe test mode and Printful sandbox for development
- **Accessibility**: Follow WCAG guidelines for all UI components
- **Performance**: Lazy load images and components where possible

---

**Last Updated**: 2025-12-27 (Implemented Canvas Step with AI design integration and auto-mockup selection)
