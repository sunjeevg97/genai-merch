# Design Studio MVP

## Overview

Basic design canvas where users can upload logos and position them on apparel mockups.

This feature provides the core design functionality for GenAI-Merch, allowing users to create custom apparel designs by uploading their logos and positioning them on t-shirt mockups. This MVP focuses on essential features needed to create and save basic designs.

## User Stories

- **As a user, I want to upload a PNG/JPG logo** so that I can use my brand assets in designs
- **As a user, I want to select a t-shirt mockup** so that I can visualize my logo on different products
- **As a user, I want to drag and position my logo** so that I can place it exactly where I want it
- **As a user, I want to resize my logo** so that I can adjust the size to look good on the mockup
- **As a user, I want to see a preview of the final product** so that I know what the printed result will look like

## Technical Approach

### Canvas Manipulation
- **Library**: Fabric.js for interactive canvas manipulation
- **Features**:
  - Drag and drop logo positioning
  - Resize handles with aspect ratio lock
  - Rotation controls
  - Zoom in/out for precision
  - Undo/redo functionality

### File Upload
- **Storage**: Supabase Storage for uploaded logos
- **Client-side validation**:
  - File types: PNG, JPG, JPEG only
  - Max file size: 5MB
  - Minimum dimensions: 300x300px for print quality
- **Server-side validation**:
  - DPI check (minimum 150 DPI recommended)
  - Color mode detection (CMYK preferred for print)
  - File sanitization

### Mockup System
- **Initial mockups**: 3 basic t-shirt views (front, back, side)
- **Storage**: Static mockup images in `/public/mockups/`
- **Print areas**: Defined print zones for each mockup
- **Restrictions**: Keep logo within printable area

### Data Model

```typescript
// Extension to existing Design model
interface DesignData {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;      // Final rendered design
  vectorUrl?: string;    // Optional vector upload
  metadata: {
    canvas: {
      width: number;
      height: number;
      backgroundColor: string;
    };
    logo: {
      originalUrl: string;  // Supabase storage URL
      position: { x: number; y: number };
      scale: number;
      rotation: number;
    };
    mockup: {
      type: string;         // "t-shirt"
      view: string;         // "front", "back", "side"
      color: string;        // "white", "black", etc.
    };
    printArea: {
      width: number;        // inches
      height: number;       // inches
      dpi: number;          // 300 recommended
    };
  };
  aiPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Component Structure

```
src/app/dashboard/design/
├── page.tsx                    # Main design studio page
├── components/
│   ├── DesignCanvas.tsx        # Fabric.js canvas wrapper
│   ├── LogoUpload.tsx          # File upload component
│   ├── MockupSelector.tsx      # Mockup selection UI
│   ├── DesignControls.tsx      # Position, size, rotation controls
│   ├── DesignToolbar.tsx       # Save, export, undo/redo
│   └── DesignPreview.tsx       # Final product preview
└── hooks/
    ├── useCanvas.ts            # Canvas state management
    ├── useDesignState.ts       # Design data management
    └── useFileUpload.ts        # Upload handling
```

### API Routes

```
POST   /api/designs                    # Create new design
GET    /api/designs                    # List user's designs
GET    /api/designs/[id]               # Get specific design
PATCH  /api/designs/[id]               # Update design
DELETE /api/designs/[id]               # Delete design
POST   /api/designs/[id]/export        # Export final design image
POST   /api/uploads/logo               # Upload logo file
GET    /api/mockups                    # Get available mockups
```

### Workflow

1. **User enters design studio**
   - Create new blank design or load existing design
   - Initialize canvas with default mockup

2. **Upload logo**
   - User selects file from computer
   - Client validates file type and size
   - Upload to Supabase Storage
   - Server validates DPI and dimensions
   - Logo appears on canvas

3. **Position and customize**
   - User drags logo to desired position
   - User resizes using corner handles
   - User rotates if needed
   - Changes auto-save to draft

4. **Preview and save**
   - User clicks "Preview" to see final result
   - User clicks "Save" to finalize design
   - Canvas exports to PNG
   - Design record saved to database

## Success Criteria

- ✅ Users can upload files <5MB (PNG, JPG, JPEG)
- ✅ Logos position correctly on mockups with drag and drop
- ✅ Logos resize proportionally with aspect ratio lock
- ✅ Design saves to database with all metadata
- ✅ No console errors during normal operation
- ✅ Canvas renders correctly on desktop browsers (Chrome, Firefox, Safari)
- ✅ Upload validates file type and size before submission
- ✅ Server-side DPI validation warns if image quality is too low
- ✅ Auto-save functionality preserves work every 30 seconds
- ✅ User can load previously saved designs

## Non-Goals (Future Iterations)

- Multiple logos on one design (single logo only for MVP)
- Text editing (logos/images only)
- Advanced image filters or effects
- Mobile/tablet canvas support (desktop only for MVP)
- Real-time collaboration
- AI-generated backgrounds

## Technical Dependencies

### New NPM Packages
```json
{
  "fabric": "^5.3.0",           // Canvas manipulation
  "@supabase/storage-js": "^2.5.5"  // Already installed via Supabase client
}
```

### Mockup Assets
- 3 t-shirt mockup images (front, back, side views)
- White and black color variants
- High resolution (2000x2000px minimum)

## Database Changes

No schema changes required. Uses existing `Design` model with JSON `metadata` field to store canvas state.

## Testing Plan

### Manual Testing
- [ ] Upload PNG logo and verify it appears on canvas
- [ ] Upload JPG logo and verify it appears on canvas
- [ ] Try uploading file >5MB and verify rejection
- [ ] Try uploading non-image file and verify rejection
- [ ] Drag logo around canvas and verify smooth movement
- [ ] Resize logo using corner handles and verify proportional scaling
- [ ] Rotate logo and verify smooth rotation
- [ ] Switch mockup types and verify logo persists
- [ ] Save design and verify it appears in designs list
- [ ] Load saved design and verify all properties restored
- [ ] Upload low-DPI image and verify warning message
- [ ] Test undo/redo functionality
- [ ] Test auto-save by refreshing page

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Security Considerations

1. **File Upload Security**
   - Validate MIME types on server
   - Scan uploads for malicious content
   - Generate unique filenames to prevent overwrites
   - Store in isolated Supabase bucket with RLS policies

2. **Storage Policies**
   - Users can only upload to their own folder
   - Public read access for design images
   - Private access for original uploads
   - File size limits enforced at storage level

3. **Data Validation**
   - Validate all canvas coordinates are within bounds
   - Sanitize design names and metadata
   - Prevent XSS in user-provided text

## Performance Considerations

- Lazy load Fabric.js library (only on design studio page)
- Optimize mockup images (WebP format with fallbacks)
- Debounce auto-save to reduce database writes
- Use canvas thumbnails for design list (not full images)
- Implement loading states for upload operations

## Timeline

**Sprint 3-4 (Weeks 3-4)**

### Week 3
- Day 1-2: Set up Fabric.js canvas and basic mockup display
- Day 3-4: Implement file upload to Supabase Storage
- Day 5: Build drag and drop functionality

### Week 4
- Day 1-2: Add resize and rotation controls
- Day 3: Implement save/load functionality
- Day 4: Add auto-save and undo/redo
- Day 5: Testing, bug fixes, and polish

## Future Enhancements (Post-MVP)

1. **Advanced Editing** (Sprint 5-6)
   - Multiple logos per design
   - Text overlay with custom fonts
   - Image filters and effects

2. **AI Features** (Sprint 7-8)
   - AI background removal for logos
   - AI-generated design suggestions
   - Smart positioning recommendations

3. **Mobile Support** (Future)
   - Touch-optimized canvas controls
   - Responsive design studio layout
   - Mobile file upload

4. **Collaboration** (Future)
   - Share designs with team members
   - Comment on designs
   - Version history

## Open Questions

- [ ] Should we support SVG uploads in MVP? (Answer: No, future enhancement)
- [ ] What's the minimum DPI we'll accept? (Answer: 150 DPI minimum, 300 DPI recommended)
- [ ] Do we need design templates? (Answer: Not for MVP, add in Sprint 5-6)
- [ ] Should auto-save be configurable? (Answer: No, fixed at 30 seconds)

## Resources

- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Print File Specifications](https://www.printful.com/print-file-preparation)
