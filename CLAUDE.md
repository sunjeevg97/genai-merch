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
