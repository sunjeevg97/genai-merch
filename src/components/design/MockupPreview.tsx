/**
 * MockupPreview Component
 *
 * Displays a preview of the final product with the design applied
 * Shows realistic mockup rendering
 *
 * Features:
 * - Product mockup display
 * - Design overlay
 * - Multiple view angles (front, back, side)
 * - Zoom controls
 */

'use client';

interface MockupPreviewProps {
  designUrl?: string;
  mockupType?: 't-shirt' | 'hoodie';
  mockupView?: 'front' | 'back' | 'side';
  mockupColor?: string;
}

export function MockupPreview({
  designUrl,
  mockupType = 't-shirt',
  mockupView = 'front',
  mockupColor = 'white',
}: MockupPreviewProps) {
  return (
    <div className="mockup-preview">
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        {designUrl ? (
          <img
            src={designUrl}
            alt="Design preview"
            className="max-w-full max-h-full"
          />
        ) : (
          <p className="text-muted-foreground">Preview will appear here</p>
        )}
      </div>
    </div>
  );
}
