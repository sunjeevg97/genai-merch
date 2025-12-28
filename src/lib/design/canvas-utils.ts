/**
 * Fabric.js Canvas Utilities
 *
 * Helper functions for working with Fabric.js canvas in the design studio.
 * These utilities handle common canvas operations like initialization,
 * image loading, boundary constraints, and export/import.
 *
 * @requires fabric - Fabric.js library
 * @requires @types/fabric - TypeScript definitions
 */

import { fabric } from 'fabric';

/**
 * Print Area Interface
 *
 * Defines the boundaries where designs can be placed on mockups
 */
export interface PrintArea {
  /** X position of top-left corner (pixels) */
  x: number;
  /** Y position of top-left corner (pixels) */
  y: number;
  /** Width of print area (pixels) */
  width: number;
  /** Height of print area (pixels) */
  height: number;
}

/**
 * Canvas Configuration Options
 */
export interface CanvasOptions {
  /** Background color of canvas */
  backgroundColor?: string;
  /** Whether to preserve object stacking */
  preserveObjectStacking?: boolean;
  /** Selection style */
  selectionColor?: string;
  selectionBorderColor?: string;
}

/**
 * Initialize Fabric.js Canvas
 *
 * Creates and configures a new Fabric.js canvas instance with the specified
 * dimensions and options. This should be called once when the design studio loads.
 *
 * @param canvasElement - The HTML canvas element to initialize
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @param options - Optional canvas configuration
 * @returns Configured Fabric.js canvas instance
 * @throws Error if canvas element is null or dimensions are invalid
 *
 * @example
 * ```typescript
 * const canvasElement = document.getElementById('design-canvas') as HTMLCanvasElement;
 * const canvas = initializeCanvas(canvasElement, 800, 600, {
 *   backgroundColor: '#f0f0f0',
 *   selectionColor: 'rgba(100, 150, 255, 0.3)',
 * });
 * ```
 */
export function initializeCanvas(
  canvasElement: HTMLCanvasElement,
  width: number,
  height: number,
  options?: CanvasOptions
): fabric.Canvas {
  try {
    // Validate inputs
    if (!canvasElement) {
      throw new Error('Canvas element is required');
    }
    if (width <= 0 || height <= 0) {
      throw new Error('Canvas dimensions must be positive');
    }

    // Create Fabric.js canvas
    const canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      backgroundColor: options?.backgroundColor || '#ffffff',
      preserveObjectStacking: options?.preserveObjectStacking ?? true,
      selection: true,
      selectionColor: options?.selectionColor || 'rgba(100, 150, 255, 0.3)',
      selectionBorderColor: options?.selectionBorderColor || '#4a90e2',
      selectionLineWidth: 2,
    });

    console.log(`[Canvas] Initialized canvas: ${width}x${height}`);
    return canvas;
  } catch (error) {
    console.error('[Canvas] Initialization failed:', error);
    throw error;
  }
}

/**
 * Load Image onto Canvas
 *
 * Loads a user's uploaded image onto the canvas, positions it within the print
 * area, and makes it draggable with boundary constraints. The image is automatically
 * centered and scaled to fit the print area.
 *
 * @param canvas - The Fabric.js canvas instance
 * @param imageUrl - URL or data URL of the image to load
 * @param printArea - Print area boundaries for positioning
 * @returns Promise resolving to the loaded Fabric.js image object
 * @throws Error if image fails to load
 *
 * @example
 * ```typescript
 * const printArea = { x: 200, y: 180, width: 400, height: 500 };
 * const image = await loadImageOntoCanvas(canvas, '/uploads/logo.png', printArea);
 * console.log('Image loaded:', image.width, image.height);
 * ```
 */
export async function loadImageOntoCanvas(
  canvas: fabric.Canvas,
  imageUrl: string,
  printArea: PrintArea
): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Canvas] Loading image:', imageUrl);

      fabric.Image.fromURL(
        imageUrl,
        (img: fabric.Image | null) => {
          console.log('[Canvas] Image callback received:', {
            hasImg: !!img,
            width: img?.width,
            height: img?.height,
            src: img?.getSrc?.(),
          });

          if (!img || !img.width || !img.height) {
            console.error('[Canvas] Image loaded but invalid:', {
              hasImg: !!img,
              width: img?.width,
              height: img?.height,
            });
            reject(new Error('Failed to load image'));
            return;
          }

          // Calculate scaling to fit within print area (70% of print area)
          const maxWidth = printArea.width * 0.7;
          const maxHeight = printArea.height * 0.7;
          const scaleX = maxWidth / img.width!;
          const scaleY = maxHeight / img.height!;
          const scale = Math.min(scaleX, scaleY);

          // Configure image
          img.set({
            left: printArea.x + printArea.width / 2,
            top: printArea.y + printArea.height / 2,
            originX: 'center',
            originY: 'center',
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockRotation: false,
            centeredRotation: true,
          });

          // Add to canvas
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();

          console.log('[Canvas] Image loaded and positioned');
          resolve(img);
        },
        {
          crossOrigin: 'anonymous',
        }
      );
    } catch (error) {
      console.error('[Canvas] Failed to load image:', error);
      reject(error);
    }
  });
}

/**
 * Setup Print Area Bounds
 *
 * Creates a visual guide showing the printable area boundaries on the canvas.
 * This rectangle is non-selectable and serves as a reference for users.
 *
 * @param canvas - The Fabric.js canvas instance
 * @param printArea - Print area boundaries
 * @param options - Optional styling for the bounds rectangle
 * @returns The created bounds rectangle object
 *
 * @example
 * ```typescript
 * const printArea = { x: 200, y: 180, width: 400, height: 500 };
 * const bounds = setupPrintAreaBounds(canvas, printArea, {
 *   stroke: '#e74c3c',
 *   strokeWidth: 2,
 *   fill: 'rgba(231, 76, 60, 0.1)',
 * });
 * ```
 */
export function setupPrintAreaBounds(
  canvas: fabric.Canvas,
  printArea: PrintArea,
  options?: {
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    strokeDashArray?: number[];
  }
): fabric.Rect {
  try {
    console.log('[Canvas] Setting up print area bounds:', printArea);

    // Create boundary rectangle
    const boundsRect = new fabric.Rect({
      left: printArea.x,
      top: printArea.y,
      width: printArea.width,
      height: printArea.height,
      fill: options?.fill || 'rgba(100, 150, 255, 0.05)',
      stroke: options?.stroke || '#4a90e2',
      strokeWidth: options?.strokeWidth || 2,
      strokeDashArray: options?.strokeDashArray || [5, 5],
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });

    // Add to canvas as background layer
    canvas.add(boundsRect);
    canvas.sendToBack(boundsRect);
    canvas.renderAll();

    return boundsRect;
  } catch (error) {
    console.error('[Canvas] Failed to setup print area bounds:', error);
    throw error;
  }
}

/**
 * Constrain Object to Bounds
 *
 * Ensures an object stays within the specified boundaries during movement.
 * This function should be called from the canvas's 'object:moving' event handler.
 *
 * @param obj - The Fabric.js object being moved
 * @param bounds - The boundaries to constrain within
 *
 * @example
 * ```typescript
 * const printArea = { x: 200, y: 180, width: 400, height: 500 };
 *
 * canvas.on('object:moving', (e) => {
 *   if (e.target) {
 *     constrainObjectToBounds(e.target, printArea);
 *   }
 * });
 * ```
 */
export function constrainObjectToBounds(
  obj: fabric.Object,
  bounds: PrintArea
): void {
  try {
    if (!obj) return;

    // Get object's bounding rectangle
    const objBounds = obj.getBoundingRect();

    // Calculate boundaries
    const minX = bounds.x;
    const minY = bounds.y;
    const maxX = bounds.x + bounds.width;
    const maxY = bounds.y + bounds.height;

    // Constrain horizontal position
    if (objBounds.left < minX) {
      obj.set('left', obj.left! + (minX - objBounds.left));
    }
    if (objBounds.left + objBounds.width > maxX) {
      obj.set('left', obj.left! - (objBounds.left + objBounds.width - maxX));
    }

    // Constrain vertical position
    if (objBounds.top < minY) {
      obj.set('top', obj.top! + (minY - objBounds.top));
    }
    if (objBounds.top + objBounds.height > maxY) {
      obj.set('top', obj.top! - (objBounds.top + objBounds.height - maxY));
    }

    obj.setCoords();
  } catch (error) {
    console.error('[Canvas] Failed to constrain object:', error);
  }
}

/**
 * Get Canvas as JSON
 *
 * Exports the current canvas state as a JSON string. This includes all objects,
 * their properties, and the canvas background. Useful for saving designs to a database.
 *
 * @param canvas - The Fabric.js canvas instance
 * @returns JSON string representation of the canvas
 * @throws Error if serialization fails
 *
 * @example
 * ```typescript
 * const canvasData = getCanvasAsJSON(canvas);
 * await fetch('/api/designs/save', {
 *   method: 'POST',
 *   body: JSON.stringify({ canvasData }),
 * });
 * ```
 */
export function getCanvasAsJSON(canvas: fabric.Canvas): string {
  try {
    console.log('[Canvas] Exporting canvas to JSON');

    const json = canvas.toJSON([
      'selectable',
      'hasControls',
      'hasBorders',
      'lockRotation',
      'centeredRotation',
    ]);

    const jsonString = JSON.stringify(json, null, 2);
    console.log('[Canvas] Canvas exported to JSON, size:', jsonString.length, 'bytes');

    return jsonString;
  } catch (error) {
    console.error('[Canvas] Failed to export canvas to JSON:', error);
    throw error;
  }
}

/**
 * Load Canvas from JSON
 *
 * Restores a canvas from a previously saved JSON state. This clears the current
 * canvas and rebuilds it from the saved data.
 *
 * @param canvas - The Fabric.js canvas instance
 * @param json - JSON string representation of the canvas
 * @returns Promise that resolves when canvas is loaded
 * @throws Error if JSON is invalid or loading fails
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/designs/123');
 * const { canvasData } = await response.json();
 * await loadCanvasFromJSON(canvas, canvasData);
 * console.log('Design loaded successfully');
 * ```
 */
export async function loadCanvasFromJSON(
  canvas: fabric.Canvas,
  json: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Canvas] Loading canvas from JSON');

      // Parse JSON
      const canvasData = typeof json === 'string' ? JSON.parse(json) : json;

      // Load canvas from JSON
      canvas.loadFromJSON(canvasData, () => {
        canvas.renderAll();
        console.log('[Canvas] Canvas loaded from JSON successfully');
        resolve();
      });
    } catch (error) {
      console.error('[Canvas] Failed to load canvas from JSON:', error);
      reject(error);
    }
  });
}

/**
 * Export Canvas as Image
 *
 * Exports the current canvas as a high-resolution PNG image. Returns a base64
 * data URL that can be used for previews or downloads.
 *
 * @param canvas - The Fabric.js canvas instance
 * @param options - Export options (format, quality, multiplier)
 * @returns Base64 data URL of the exported image
 * @throws Error if export fails
 *
 * @example
 * ```typescript
 * // Export as high-res PNG
 * const imageUrl = exportCanvasAsImage(canvas, {
 *   format: 'png',
 *   multiplier: 2, // 2x resolution
 * });
 *
 * // Display in img tag
 * const img = document.createElement('img');
 * img.src = imageUrl;
 *
 * // Or download
 * const link = document.createElement('a');
 * link.href = imageUrl;
 * link.download = 'design.png';
 * link.click();
 * ```
 */
export function exportCanvasAsImage(
  canvas: fabric.Canvas,
  options?: {
    format?: 'png' | 'jpeg';
    quality?: number;
    multiplier?: number;
  }
): string {
  try {
    console.log('[Canvas] Exporting canvas as image');

    const dataURL = canvas.toDataURL({
      format: options?.format || 'png',
      quality: options?.quality || 1.0,
      multiplier: options?.multiplier || 2, // 2x resolution by default
    });

    console.log('[Canvas] Canvas exported as image, size:', dataURL.length, 'bytes');
    return dataURL;
  } catch (error) {
    console.error('[Canvas] Failed to export canvas as image:', error);
    throw error;
  }
}

/**
 * Clear Canvas
 *
 * Removes all objects from the canvas, leaving it blank.
 *
 * @param canvas - The Fabric.js canvas instance
 *
 * @example
 * ```typescript
 * clearCanvas(canvas);
 * console.log('Canvas cleared');
 * ```
 */
export function clearCanvas(canvas: fabric.Canvas): void {
  try {
    console.log('[Canvas] Clearing canvas');
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
  } catch (error) {
    console.error('[Canvas] Failed to clear canvas:', error);
    throw error;
  }
}

/**
 * Get Active Object
 *
 * Returns the currently selected object on the canvas, or null if none selected.
 *
 * @param canvas - The Fabric.js canvas instance
 * @returns The active object, or null
 *
 * @example
 * ```typescript
 * const activeObj = getActiveObject(canvas);
 * if (activeObj) {
 *   console.log('Selected object:', activeObj.type);
 * }
 * ```
 */
export function getActiveObject(canvas: fabric.Canvas): fabric.Object | null {
  return canvas.getActiveObject() || null;
}

/**
 * Remove Active Object
 *
 * Removes the currently selected object from the canvas.
 *
 * @param canvas - The Fabric.js canvas instance
 * @returns True if an object was removed, false otherwise
 *
 * @example
 * ```typescript
 * const removed = removeActiveObject(canvas);
 * if (removed) {
 *   console.log('Object deleted');
 * }
 * ```
 */
export function removeActiveObject(canvas: fabric.Canvas): boolean {
  try {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      canvas.remove(activeObj);
      canvas.renderAll();
      console.log('[Canvas] Removed active object');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Canvas] Failed to remove active object:', error);
    return false;
  }
}

/**
 * Scale Active Object
 *
 * Scales the currently selected object by a multiplier.
 *
 * @param canvas - The Fabric.js canvas instance
 * @param scale - Scale multiplier (e.g., 1.1 for 10% larger, 0.9 for 10% smaller)
 *
 * @example
 * ```typescript
 * scaleActiveObject(canvas, 1.2); // Make 20% larger
 * scaleActiveObject(canvas, 0.8); // Make 20% smaller
 * ```
 */
export function scaleActiveObject(canvas: fabric.Canvas, scale: number): void {
  try {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.scale(scale);
      activeObj.setCoords();
      canvas.renderAll();
      console.log('[Canvas] Scaled active object:', scale);
    }
  } catch (error) {
    console.error('[Canvas] Failed to scale active object:', error);
  }
}

/**
 * Rotate Active Object
 *
 * Rotates the currently selected object by a specified angle.
 *
 * @param canvas - The Fabric.js canvas instance
 * @param angle - Angle in degrees (positive for clockwise, negative for counter-clockwise)
 *
 * @example
 * ```typescript
 * rotateActiveObject(canvas, 45);  // Rotate 45 degrees clockwise
 * rotateActiveObject(canvas, -90); // Rotate 90 degrees counter-clockwise
 * ```
 */
export function rotateActiveObject(canvas: fabric.Canvas, angle: number): void {
  try {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      const currentAngle = activeObj.angle || 0;
      activeObj.rotate(currentAngle + angle);
      activeObj.setCoords();
      canvas.renderAll();
      console.log('[Canvas] Rotated active object:', angle);
    }
  } catch (error) {
    console.error('[Canvas] Failed to rotate active object:', error);
  }
}
