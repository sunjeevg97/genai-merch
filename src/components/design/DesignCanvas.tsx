/**
 * Design Canvas Component
 *
 * The main interactive canvas for the design studio.
 * Handles mockup display, logo positioning, and design editing.
 *
 * Features:
 * - Fabric.js-based interactive canvas
 * - Mockup background with print area boundaries
 * - Logo upload, positioning, and resizing
 * - Boundary constraints (keeps designs within print area)
 * - Canvas controls (center, reset, delete, flip)
 * - Keyboard accessibility
 * - Responsive design
 */

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { fabric } from 'fabric';
import {
  initializeCanvas,
  loadImageOntoCanvas,
  setupPrintAreaBounds,
  constrainObjectToBounds,
  clearCanvas,
  getActiveObject,
  removeActiveObject,
} from '@/lib/design/canvas-utils';
import type { PrintArea } from '@/lib/design/canvas-utils';
import type { Mockup } from '@/lib/design/mockups';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Maximize2,
  RotateCw,
  Trash2,
  FlipHorizontal,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Design State Interface
 *
 * Represents the current state of the design on the canvas
 */
export interface DesignState {
  /** Logo position X coordinate */
  logoX: number;
  /** Logo position Y coordinate */
  logoY: number;
  /** Logo width */
  logoWidth: number;
  /** Logo height */
  logoHeight: number;
  /** Logo rotation angle in degrees */
  logoRotation: number;
  /** Logo scale X */
  logoScaleX: number;
  /** Logo scale Y */
  logoScaleY: number;
  /** Whether logo is flipped horizontally */
  isFlipped: boolean;
  /** Canvas JSON state (for persistence) */
  canvasJSON?: string;
}

/**
 * Component Props
 */
export interface DesignCanvasProps {
  /** Current mockup to display */
  mockup: Mockup;
  /** User's uploaded logo URL */
  uploadedImageUrl: string | null;
  /** Callback when design updates */
  onDesignChange?: (design: DesignState) => void;
  /** Initial design state for loading existing designs */
  initialDesign?: DesignState | null;
}

/**
 * Design Canvas Component
 */
export function DesignCanvas({
  mockup,
  uploadedImageUrl,
  onDesignChange,
  initialDesign,
}: DesignCanvasProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const logoObjectRef = useRef<fabric.Image | null>(null);
  const mockupBackgroundRef = useRef<fabric.Image | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isLoadingMockup, setIsLoadingMockup] = useState(true);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [designState, setDesignState] = useState<DesignState | null>(
    initialDesign || null
  );

  /**
   * Initialize Fabric.js canvas on mount
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      console.log('[DesignCanvas] Initializing canvas');

      const canvas = initializeCanvas(canvasRef.current, 800, 1000, {
        backgroundColor: '#f5f5f5',
        selectionColor: 'rgba(100, 150, 255, 0.3)',
        selectionBorderColor: '#4a90e2',
      });

      fabricCanvasRef.current = canvas;
      setIsCanvasReady(true);

      console.log('[DesignCanvas] Canvas initialized successfully');

      // Cleanup on unmount
      return () => {
        console.log('[DesignCanvas] Cleaning up canvas');
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    } catch (error) {
      console.error('[DesignCanvas] Failed to initialize canvas:', error);
      setHasError(true);
      setErrorMessage('Failed to initialize design canvas');
    }
  }, []);

  /**
   * Load mockup background when mockup changes
   */
  useEffect(() => {
    if (!isCanvasReady || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    console.log('[DesignCanvas] Loading mockup:', mockup.name);
    setIsLoadingMockup(true);

    // Remove previous mockup if exists
    if (mockupBackgroundRef.current) {
      canvas.remove(mockupBackgroundRef.current);
      mockupBackgroundRef.current = null;
    }

    // Load new mockup as background
    fabric.Image.fromURL(
      mockup.imageUrl,
      (img: fabric.Image) => {
        if (!img || !canvas) {
          console.error('[DesignCanvas] Failed to load mockup image');
          setIsLoadingMockup(false);
          return;
        }

        // Scale mockup to fit canvas
        const scaleX = 800 / (img.width || 800);
        const scaleY = 1000 / (img.height || 1000);
        const scale = Math.min(scaleX, scaleY);

        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          left: 0,
          top: 0,
        });

        canvas.add(img);
        canvas.sendToBack(img);
        mockupBackgroundRef.current = img;

        // Setup print area bounds
        setupPrintAreaBounds(canvas, mockup.printArea, {
          stroke: '#4a90e2',
          strokeWidth: 2,
          fill: 'rgba(100, 150, 255, 0.08)',
          strokeDashArray: [8, 4],
        });

        canvas.renderAll();
        setIsLoadingMockup(false);

        console.log('[DesignCanvas] Mockup loaded successfully');
      },
      {
        crossOrigin: 'anonymous',
      }
    );
  }, [isCanvasReady, mockup]);

  /**
   * Load uploaded logo when uploadedImageUrl changes
   */
  useEffect(() => {
    if (!isCanvasReady || !fabricCanvasRef.current || !uploadedImageUrl) return;

    const canvas = fabricCanvasRef.current;

    console.log('[DesignCanvas] Loading uploaded logo');
    setIsLoadingLogo(true);

    // Remove previous logo if exists
    if (logoObjectRef.current) {
      canvas.remove(logoObjectRef.current);
      logoObjectRef.current = null;
    }

    // Load new logo
    loadImageOntoCanvas(canvas, uploadedImageUrl, mockup.printArea)
      .then((logoImg) => {
        logoObjectRef.current = logoImg;
        setIsLoadingLogo(false);

        // Update design state
        updateDesignStateFromCanvas();

        console.log('[DesignCanvas] Logo loaded successfully');
        toast.success('Logo added to canvas');
      })
      .catch((error) => {
        console.error('[DesignCanvas] Failed to load logo:', error);
        setIsLoadingLogo(false);
        toast.error('Failed to load logo onto canvas');
      });
  }, [isCanvasReady, uploadedImageUrl, mockup.printArea]);

  /**
   * Setup event handlers for canvas interactions
   */
  useEffect(() => {
    if (!isCanvasReady || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Handle object moving - constrain to bounds
    const handleMoving = (e: fabric.IEvent) => {
      if (e.target) {
        constrainObjectToBounds(e.target, mockup.printArea);
      }
    };

    // Handle object modified - update design state
    const handleModified = () => {
      updateDesignStateFromCanvas();
    };

    // Handle object scaling - maintain aspect ratio
    const handleScaling = (e: fabric.IEvent) => {
      if (e.target) {
        // Optionally enforce uniform scaling
        const obj = e.target;
        if (obj.scaleX !== obj.scaleY) {
          const scale = Math.max(obj.scaleX || 1, obj.scaleY || 1);
          obj.set({
            scaleX: scale,
            scaleY: scale,
          });
        }
      }
    };

    // Attach event listeners
    canvas.on('object:moving', handleMoving);
    canvas.on('object:modified', handleModified);
    canvas.on('object:scaling', handleScaling);
    canvas.on('object:rotating', handleModified);

    // Cleanup
    return () => {
      canvas.off('object:moving', handleMoving);
      canvas.off('object:modified', handleModified);
      canvas.off('object:scaling', handleScaling);
      canvas.off('object:rotating', handleModified);
    };
  }, [isCanvasReady, mockup.printArea]);

  /**
   * Update design state from canvas objects
   * Debounced to avoid excessive calls
   */
  const updateDesignStateFromCanvas = useCallback(() => {
    if (!fabricCanvasRef.current || !logoObjectRef.current) return;

    const logo = logoObjectRef.current;

    const newState: DesignState = {
      logoX: logo.left || 0,
      logoY: logo.top || 0,
      logoWidth: (logo.width || 0) * (logo.scaleX || 1),
      logoHeight: (logo.height || 0) * (logo.scaleY || 1),
      logoRotation: logo.angle || 0,
      logoScaleX: logo.scaleX || 1,
      logoScaleY: logo.scaleY || 1,
      isFlipped: logo.flipX || false,
    };

    setDesignState(newState);

    // Debounce callback to parent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onDesignChange) {
        onDesignChange(newState);
      }
    }, 300); // 300ms debounce
  }, [onDesignChange]);

  /**
   * Center logo in print area
   */
  const handleCenterLogo = useCallback(() => {
    if (!logoObjectRef.current || !fabricCanvasRef.current) {
      toast.error('No logo to center');
      return;
    }

    const logo = logoObjectRef.current;
    const canvas = fabricCanvasRef.current;

    logo.set({
      left: mockup.printArea.x + mockup.printArea.width / 2,
      top: mockup.printArea.y + mockup.printArea.height / 2,
      originX: 'center',
      originY: 'center',
    });

    logo.setCoords();
    canvas.renderAll();
    updateDesignStateFromCanvas();

    toast.success('Logo centered');
  }, [mockup.printArea, updateDesignStateFromCanvas]);

  /**
   * Reset logo to original size
   */
  const handleResetSize = useCallback(() => {
    if (!logoObjectRef.current || !fabricCanvasRef.current) {
      toast.error('No logo to reset');
      return;
    }

    const logo = logoObjectRef.current;
    const canvas = fabricCanvasRef.current;

    // Calculate original scale (70% of print area)
    const maxWidth = mockup.printArea.width * 0.7;
    const maxHeight = mockup.printArea.height * 0.7;
    const scaleX = maxWidth / (logo.width || 1);
    const scaleY = maxHeight / (logo.height || 1);
    const scale = Math.min(scaleX, scaleY);

    logo.set({
      scaleX: scale,
      scaleY: scale,
      angle: 0,
    });

    logo.setCoords();
    canvas.renderAll();
    updateDesignStateFromCanvas();

    toast.success('Logo size reset');
  }, [mockup.printArea, updateDesignStateFromCanvas]);

  /**
   * Delete logo from canvas
   */
  const handleDeleteLogo = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const removed = removeActiveObject(canvas);

    if (removed) {
      logoObjectRef.current = null;
      setDesignState(null);
      toast.success('Logo removed');

      if (onDesignChange) {
        onDesignChange({
          logoX: 0,
          logoY: 0,
          logoWidth: 0,
          logoHeight: 0,
          logoRotation: 0,
          logoScaleX: 1,
          logoScaleY: 1,
          isFlipped: false,
        });
      }
    } else {
      toast.error('No logo selected');
    }
  }, [onDesignChange]);

  /**
   * Flip logo horizontally
   */
  const handleFlipLogo = useCallback(() => {
    if (!logoObjectRef.current || !fabricCanvasRef.current) {
      toast.error('No logo to flip');
      return;
    }

    const logo = logoObjectRef.current;
    const canvas = fabricCanvasRef.current;

    logo.set({
      flipX: !logo.flipX,
    });

    logo.setCoords();
    canvas.renderAll();
    updateDesignStateFromCanvas();

    toast.success(logo.flipX ? 'Logo flipped' : 'Logo unflipped');
  }, [updateDesignStateFromCanvas]);

  /**
   * Rotate logo 90 degrees clockwise
   */
  const handleRotateLogo = useCallback(() => {
    if (!logoObjectRef.current || !fabricCanvasRef.current) {
      toast.error('No logo to rotate');
      return;
    }

    const logo = logoObjectRef.current;
    const canvas = fabricCanvasRef.current;

    const currentAngle = logo.angle || 0;
    const newAngle = (currentAngle + 90) % 360;

    logo.set({
      angle: newAngle,
    });

    logo.setCoords();
    canvas.renderAll();
    updateDesignStateFromCanvas();

    toast.success(`Logo rotated to ${newAngle}°`);
  }, [updateDesignStateFromCanvas]);

  /**
   * Keyboard event handler
   */
  useEffect(() => {
    if (!isCanvasReady || !fabricCanvasRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeObject = getActiveObject(fabricCanvasRef.current!);
      if (!activeObject) return;

      const MOVE_STEP = 5; // pixels
      const SCALE_STEP = 0.05;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          activeObject.set({ top: (activeObject.top || 0) - MOVE_STEP });
          constrainObjectToBounds(activeObject, mockup.printArea);
          activeObject.setCoords();
          fabricCanvasRef.current!.renderAll();
          updateDesignStateFromCanvas();
          break;

        case 'ArrowDown':
          e.preventDefault();
          activeObject.set({ top: (activeObject.top || 0) + MOVE_STEP });
          constrainObjectToBounds(activeObject, mockup.printArea);
          activeObject.setCoords();
          fabricCanvasRef.current!.renderAll();
          updateDesignStateFromCanvas();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          activeObject.set({ left: (activeObject.left || 0) - MOVE_STEP });
          constrainObjectToBounds(activeObject, mockup.printArea);
          activeObject.setCoords();
          fabricCanvasRef.current!.renderAll();
          updateDesignStateFromCanvas();
          break;

        case 'ArrowRight':
          e.preventDefault();
          activeObject.set({ left: (activeObject.left || 0) + MOVE_STEP });
          constrainObjectToBounds(activeObject, mockup.printArea);
          activeObject.setCoords();
          fabricCanvasRef.current!.renderAll();
          updateDesignStateFromCanvas();
          break;

        case '+':
        case '=':
          e.preventDefault();
          const scaleUp = (activeObject.scaleX || 1) + SCALE_STEP;
          activeObject.set({ scaleX: scaleUp, scaleY: scaleUp });
          activeObject.setCoords();
          fabricCanvasRef.current!.renderAll();
          updateDesignStateFromCanvas();
          break;

        case '-':
        case '_':
          e.preventDefault();
          const scaleDown = Math.max(
            0.1,
            (activeObject.scaleX || 1) - SCALE_STEP
          );
          activeObject.set({ scaleX: scaleDown, scaleY: scaleDown });
          activeObject.setCoords();
          fabricCanvasRef.current!.renderAll();
          updateDesignStateFromCanvas();
          break;

        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDeleteLogo();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isCanvasReady,
    mockup.printArea,
    updateDesignStateFromCanvas,
    handleDeleteLogo,
  ]);

  /**
   * Render error state
   */
  if (hasError) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">Canvas Error</h3>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full" ref={containerRef}>
      {/* Canvas Container */}
      <Card className="relative mx-auto" style={{ width: '800px' }}>
        {/* Loading Overlay */}
        {(isLoadingMockup || isLoadingLogo) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isLoadingMockup ? 'Loading mockup...' : 'Loading logo...'}
              </p>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="p-4">
          <canvas ref={canvasRef} className="border rounded-lg shadow-sm" />
        </div>

        {/* Canvas Controls */}
        {isCanvasReady && !isLoadingMockup && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={handleCenterLogo}
              disabled={!logoObjectRef.current}
              title="Center logo (C)"
              className="shadow-md"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="secondary"
              onClick={handleRotateLogo}
              disabled={!logoObjectRef.current}
              title="Rotate 90° (R)"
              className="shadow-md"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="secondary"
              onClick={handleFlipLogo}
              disabled={!logoObjectRef.current}
              title="Flip horizontal (F)"
              className="shadow-md"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="destructive"
              onClick={handleDeleteLogo}
              disabled={!logoObjectRef.current}
              title="Delete logo (Del)"
              className="shadow-md"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Keyboard Shortcuts Help */}
      {isCanvasReady && logoObjectRef.current && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            <strong>Keyboard shortcuts:</strong> Arrow keys to move • +/- to
            resize • Delete to remove
          </p>
        </div>
      )}
    </div>
  );
}
