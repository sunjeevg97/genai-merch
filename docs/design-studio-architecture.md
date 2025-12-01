# Design Studio Architecture

Technical documentation for the Design Studio MVP feature.

## Overview

The Design Studio is a browser-based design editor that allows users to create custom apparel designs by uploading logos and positioning them on product mockups.

**Key Features:**
- Logo file upload with drag-and-drop
- Interactive canvas with Fabric.js
- Real-time design preview on mockups
- Print quality validation
- Design persistence to database

---

## Component Architecture

### Page Structure

```
/design/create (page.tsx)
├── FileUpload
├── ProductSelector
├── DesignControls
├── DesignCanvas (main canvas)
├── MockupPreview
└── ValidationPanel
```

### Component Responsibilities

#### `/design/create/page.tsx`
- **Purpose**: Main design studio page
- **Layout**: 3-column grid (sidebar, canvas, preview)
- **State Management**: Coordinates all child components
- **Data Flow**: Manages design state and auto-save

#### `FileUpload.tsx`
- **Purpose**: Logo file upload interface
- **Library**: react-dropzone
- **Validation**: Client-side (file type, size)
- **Output**: Uploaded file object
- **Triggers**: Upload to Supabase Storage via API

#### `DesignCanvas.tsx`
- **Purpose**: Interactive design canvas
- **Library**: Fabric.js
- **Features**: Drag, scale, rotate logo on mockup
- **Input**: Mockup URL, logo URL
- **Output**: Canvas state, design export

#### `ProductSelector.tsx`
- **Purpose**: Product type, color, view selection
- **State**: Selected product, color, view
- **Effect**: Updates mockup in DesignCanvas
- **Data Source**: `lib/design/mockups.ts`

#### `DesignControls.tsx`
- **Purpose**: Manual design adjustments
- **Controls**: Position (X/Y), scale, rotation
- **Interaction**: Two-way binding with canvas
- **Actions**: Undo, redo, reset, center

#### `MockupPreview.tsx`
- **Purpose**: Final product preview
- **Input**: Exported canvas image
- **Display**: Realistic mockup rendering
- **Views**: Front, back, side angles

#### `ValidationPanel.tsx`
- **Purpose**: Print quality validation feedback
- **Input**: Validation results from API
- **Display**: DPI, dimensions, warnings, errors
- **Indicator**: Ready for print status

---

## Data Flow

### Upload Flow

```
1. User drops file → FileUpload component
2. Client validation (file type, size)
3. POST /api/designs/upload
   ├── Upload to Supabase Storage
   ├── Generate unique filename
   └── Return file URL
4. POST /api/designs/validate
   ├── Download file from URL
   ├── Sharp: Extract metadata
   ├── Validate DPI (≥150)
   ├── Validate dimensions (≥300x300)
   └── Return validation results
5. Display ValidationPanel results
6. If valid: Add to DesignCanvas
```

### Canvas State Flow

```
1. User manipulates logo on canvas
2. Fabric.js fires events (move, scale, rotate)
3. DesignControls updates with new values
4. Auto-save timer triggers (30 seconds)
5. POST /api/designs/save
   ├── Export canvas to PNG
   ├── Upload exported image
   ├── Serialize canvas state (JSON)
   ├── Save to database
   └── Return design ID
```

### Save Flow

```
Design Record {
  id: string (cuid)
  userId: string
  name: string
  imageUrl: string (exported canvas)
  vectorUrl?: string (optional)
  metadata: {
    canvas: {
      width: number
      height: number
      backgroundColor: string
    }
    logo: {
      originalUrl: string
      position: { x: number, y: number }
      scale: number
      rotation: number
    }
    mockup: {
      type: 't-shirt' | 'hoodie'
      view: 'front' | 'back' | 'side'
      color: string
    }
    printArea: {
      width: number (inches)
      height: number (inches)
      dpi: number
    }
  }
  aiPrompt?: null (not used in MVP)
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## API Routes

### POST `/api/designs/upload`

**Purpose**: Upload logo file to Supabase Storage

**Request**:
```typescript
multipart/form-data
{
  file: File
}
```

**Response**:
```typescript
{
  url: string           // Supabase Storage URL
  fileId: string        // Storage file ID
}
```

**Validation**:
- File type: image/png, image/jpeg, image/jpg
- File size: ≤ 5MB
- Authenticated user required

**Implementation Steps**:
1. Parse multipart form data
2. Validate file type and size
3. Generate unique filename: `{userId}/{timestamp}-{random}.{ext}`
4. Upload to Supabase Storage bucket: `design-assets`
5. Return public URL

---

### POST `/api/designs/validate`

**Purpose**: Validate image for print quality using Sharp

**Request**:
```typescript
{
  fileUrl: string       // URL of uploaded file
}
```

**Response**:
```typescript
{
  isValid: boolean
  dpi: number
  dimensions: {
    width: number
    height: number
  }
  format: string        // 'png' | 'jpeg'
  colorSpace: string    // 'rgb' | 'cmyk'
  warnings: string[]
  errors: string[]
}
```

**Validation Rules**:
- DPI: minimum 150 (warning if < 300)
- Dimensions: minimum 300x300px
- Color space: RGB or CMYK
- Format: PNG or JPEG

**Implementation Steps**:
1. Fetch file from URL
2. Load into Sharp
3. Extract metadata: `sharp(buffer).metadata()`
4. Check DPI: `metadata.density`
5. Check dimensions: `metadata.width`, `metadata.height`
6. Return validation results

---

### POST `/api/designs/save`

**Purpose**: Save design to database

**Request**:
```typescript
{
  name: string
  imageUrl: string      // Exported canvas image
  metadata: {
    canvas: { ... }
    logo: { ... }
    mockup: { ... }
    printArea: { ... }
  }
}
```

**Response**:
```typescript
{
  id: string
  userId: string
  name: string
  imageUrl: string
  metadata: { ... }
  createdAt: string
  updatedAt: string
}
```

**Implementation Steps**:
1. Get authenticated user ID
2. Validate request body with Zod schema
3. Create design record in Prisma
4. Return created design

---

## State Management

### Design State

```typescript
interface DesignState {
  // Upload
  uploadedFile: File | null
  uploadedUrl: string | null
  isUploading: boolean
  uploadError: string | null

  // Validation
  validation: ValidationResult | null
  isValidating: boolean

  // Product Selection
  selectedProduct: ProductType
  selectedColor: MockupColor
  selectedView: MockupView
  currentMockup: Mockup | null

  // Canvas
  canvas: Canvas | null
  canvasState: CanvasJSON | null
  logoObject: FabricImage | null

  // Design Properties
  logoPosition: { x: number; y: number }
  logoScale: number
  logoRotation: number

  // Save
  designId: string | null
  designName: string
  isSaving: boolean
  lastSaved: Date | null
  isDirty: boolean

  // History
  canUndo: boolean
  canRedo: boolean
}
```

### Auto-Save Strategy

```typescript
// Auto-save every 30 seconds if changes detected
useEffect(() => {
  if (!isDirty) return;

  const timer = setTimeout(async () => {
    await saveDesign();
  }, 30000); // 30 seconds

  return () => clearTimeout(timer);
}, [isDirty, canvas]);

// Mark dirty on canvas changes
canvas.on('object:modified', () => {
  setIsDirty(true);
});
```

---

## File Storage Structure

### Supabase Storage Buckets

**Bucket: `design-assets`**
```
design-assets/
├── {userId}/
│   ├── logos/
│   │   ├── {timestamp}-{random}.png
│   │   └── {timestamp}-{random}.jpg
│   └── exports/
│       ├── {designId}.png
│       └── {designId}.jpg
```

**Access Policies**:
- Users can upload to their own folder: `design-assets/{userId}/`
- Public read access to all files (for displaying in app)
- No delete access (prevent accidental data loss)

---

## Canvas Implementation

### Fabric.js Setup

```typescript
import { Canvas, Image as FabricImage } from 'fabric';

// Initialize canvas
const canvas = new Canvas('canvas-element', {
  width: 1000,
  height: 1200,
  backgroundColor: '#ffffff',
  selection: true,
  preserveObjectStacking: true,
});

// Add mockup background
FabricImage.fromURL('/mockups/tshirt-front-white.png', (mockupImg) => {
  mockupImg.set({
    selectable: false,
    evented: false,
    lockMovementX: true,
    lockMovementY: true,
  });
  canvas.add(mockupImg);
  canvas.sendToBack(mockupImg);
});

// Add logo
FabricImage.fromURL(logoUrl, (logoImg) => {
  logoImg.set({
    left: printArea.x,
    top: printArea.y,
    scaleX: 0.5,
    scaleY: 0.5,
  });
  canvas.add(logoImg);
  canvas.setActiveObject(logoImg);
  canvas.renderAll();
});

// Export canvas
const dataURL = canvas.toDataURL({
  format: 'png',
  quality: 1,
  multiplier: 2, // 2x for higher resolution
});
```

### Canvas Events

```typescript
// Object moved
canvas.on('object:moving', (e) => {
  const obj = e.target;
  updatePosition(obj.left, obj.top);
  setIsDirty(true);
});

// Object scaled
canvas.on('object:scaling', (e) => {
  const obj = e.target;
  updateScale(obj.scaleX);
  setIsDirty(true);
});

// Object rotated
canvas.on('object:rotating', (e) => {
  const obj = e.target;
  updateRotation(obj.angle);
  setIsDirty(true);
});

// Selection changed
canvas.on('selection:created', (e) => {
  setSelectedObject(e.selected[0]);
});
```

---

## Validation Logic

### Client-Side Validation

```typescript
// File type and size
function validateFileBeforeUpload(file: File): boolean {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PNG and JPG allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  return true;
}
```

### Server-Side Validation (Sharp)

```typescript
import sharp from 'sharp';

async function validateImage(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();

  const dpi = metadata.density || 72;
  const { width, height } = metadata;

  const errors = [];
  const warnings = [];

  // DPI validation
  if (dpi < 150) {
    errors.push('DPI too low for print quality (minimum 150 DPI)');
  } else if (dpi < 300) {
    warnings.push('DPI acceptable but 300 DPI recommended for best quality');
  }

  // Dimension validation
  if (width < 300 || height < 300) {
    errors.push('Image dimensions too small (minimum 300x300px)');
  }

  return {
    isValid: errors.length === 0,
    dpi,
    dimensions: { width, height },
    format: metadata.format,
    colorSpace: metadata.space,
    errors,
    warnings,
  };
}
```

---

## Error Handling

### Upload Errors

```typescript
try {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/designs/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const { url } = await response.json();
  return url;
} catch (error) {
  if (error.message.includes('authentication')) {
    // Redirect to login
  } else if (error.message.includes('file size')) {
    // Show file size error
  } else {
    // Generic error
  }
}
```

### Canvas Errors

```typescript
// Handle image load failures
FabricImage.fromURL(imageUrl, (img) => {
  if (!img.width || !img.height) {
    showError('Failed to load image');
    return;
  }
  canvas.add(img);
}, {
  crossOrigin: 'anonymous'
});

// Handle export failures
try {
  const dataURL = canvas.toDataURL({ format: 'png' });
  if (!dataURL) {
    throw new Error('Canvas export failed');
  }
} catch (error) {
  showError('Failed to export design');
}
```

---

## Performance Considerations

### Lazy Loading

```typescript
// Load Fabric.js only on design page
const DesignCanvas = dynamic(() => import('./DesignCanvas'), {
  ssr: false, // Client-side only
  loading: () => <p>Loading canvas...</p>
});
```

### Image Optimization

```typescript
// Optimize uploaded images before storage
await sharp(buffer)
  .resize(4500, 5400, {
    fit: 'inside',
    withoutEnlargement: true,
  })
  .png({ quality: 90, compressionLevel: 9 })
  .toBuffer();
```

### Debounced Auto-Save

```typescript
// Debounce canvas change events
const debouncedSave = useMemo(
  () => debounce(saveDesign, 30000),
  []
);

canvas.on('object:modified', debouncedSave);
```

---

## Testing Strategy

### Manual Testing Checklist

- [ ] Upload PNG file (< 5MB, ≥ 300x300px)
- [ ] Upload JPG file (< 5MB, ≥ 300x300px)
- [ ] Upload file > 5MB (should reject)
- [ ] Upload non-image file (should reject)
- [ ] Drag logo on canvas
- [ ] Resize logo with corner handles
- [ ] Rotate logo
- [ ] Switch product color
- [ ] Switch product view
- [ ] Save design
- [ ] Load saved design
- [ ] Undo/redo operations
- [ ] Auto-save after 30 seconds
- [ ] Validation panel shows correct DPI
- [ ] Validation panel shows warnings for low DPI

### Integration Testing

```typescript
// Test upload flow
describe('Design Upload', () => {
  it('uploads valid PNG file', async () => {
    const file = new File(['...'], 'logo.png', { type: 'image/png' });
    const result = await uploadFile(file);
    expect(result.url).toBeDefined();
  });

  it('rejects file > 5MB', async () => {
    const largeFile = new File([new ArrayBuffer(6000000)], 'large.png');
    await expect(uploadFile(largeFile)).rejects.toThrow('too large');
  });
});
```

---

## Security Considerations

### File Upload Security

1. **Validate MIME types** on server (don't trust client)
2. **Scan files** for malicious content
3. **Generate random filenames** to prevent overwrites
4. **Isolate user files** in separate storage folders
5. **Set file size limits** at storage layer

### Storage Policies

```sql
-- Supabase RLS policy
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid());

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'design-assets');
```

---

## Future Enhancements

1. **Multiple Logos**: Support multiple logos per design
2. **Text Overlay**: Add text with custom fonts
3. **Image Filters**: Apply effects (grayscale, sepia, etc.)
4. **Templates**: Pre-designed templates for quick start
5. **Collaboration**: Share designs with team members
6. **Version History**: Track design changes over time
7. **AI Background Removal**: Auto-remove logo backgrounds
8. **Smart Positioning**: AI-suggested logo placement
9. **Mobile Support**: Touch-optimized canvas controls
10. **Real-time Preview**: Live mockup updates as user edits

---

**Last Updated**: 2025-12-01 (Sprint 3-4 folder structure)
