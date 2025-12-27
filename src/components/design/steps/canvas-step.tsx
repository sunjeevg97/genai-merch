/**
 * Canvas Step Component
 *
 * Fifth and final step in the AI-first design wizard.
 * Canvas editor for customizing the selected design.
 *
 * Features:
 * - Auto-selects mockup based on products from step 2
 * - Uses AI-generated design if available from step 4
 * - Falls back to manual logo upload if no AI design
 * - Interactive canvas with drag, scale, rotate
 * - Save and download functionality
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDesignWizard } from '@/lib/store/design-wizard';
import {
  initializeCanvas,
  loadImageOntoCanvas,
  setupPrintAreaBounds,
  constrainObjectToBounds,
  exportCanvasAsImage,
  getCanvasAsJSON,
} from '@/lib/design/canvas-utils';
import {
  getMockupsByProduct,
  getDefaultMockup,
  type Mockup,
  type ProductType,
} from '@/lib/design/mockups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Download,
  Save,
  Upload,
  Loader2,
  Sparkles,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { uploadDesignFile } from '@/lib/supabase/storage';
import { createBrowserClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { fabric } from 'fabric';

/**
 * Product ID to Product Type mapping
 */
const PRODUCT_TYPE_MAP: Record<string, ProductType> = {
  tshirt: 'tshirt',
  sweatshirt: 'sweatshirt',
  hoodie: 'hoodie',
  polo: 'polo',
};

/**
 * Canvas Step Component
 *
 * @example
 * ```tsx
 * <CanvasStep />
 * ```
 */
export function CanvasStep() {
  const {
    selectedProducts,
    finalDesignUrl,
    eventType,
    brandAssets,
    generatedDesigns,
    selectedDesignId,
    previousStep,
    complete,
  } = useDesignWizard();

  // Canvas refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  const [mockup, setMockup] = useState<Mockup | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasLoadedDesign, setHasLoadedDesign] = useState(false);

  /**
   * Get current user ID
   */
  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  /**
   * Auto-select mockup based on first selected product
   */
  useEffect(() => {
    if (selectedProducts.length === 0) {
      setMockup(getDefaultMockup());
      return;
    }

    // Get the first product and map to product type
    const firstProductId = selectedProducts[0];
    const productType = PRODUCT_TYPE_MAP[firstProductId];

    if (productType) {
      // Try to find a mockup for this product type
      const mockupsForProduct = getMockupsByProduct(productType);
      if (mockupsForProduct.length > 0) {
        setMockup(mockupsForProduct[0]); // Use the first available mockup
      } else {
        setMockup(getDefaultMockup());
      }
    } else {
      setMockup(getDefaultMockup());
    }
  }, [selectedProducts]);

  /**
   * Initialize canvas on mount
   */
  useEffect(() => {
    if (!canvasRef.current || !mockup || isInitialized) return;

    try {
      const canvas = initializeCanvas(canvasRef.current, 600, 700, {
        backgroundColor: '#f8f9fa',
        selectionColor: 'rgba(100, 150, 255, 0.3)',
        selectionBorderColor: '#4a90e2',
      });

      canvasInstanceRef.current = canvas;

      // Setup print area bounds
      setupPrintAreaBounds(canvas, mockup.printArea, {
        stroke: '#4a90e2',
        strokeWidth: 2,
        fill: 'rgba(74, 144, 226, 0.05)',
        strokeDashArray: [5, 5],
      });

      setIsInitialized(true);

      console.log('[Canvas Step] Canvas initialized');

      // Cleanup on unmount
      return () => {
        if (canvasInstanceRef.current) {
          canvasInstanceRef.current.dispose();
          canvasInstanceRef.current = null;
        }
      };
    } catch (error) {
      console.error('[Canvas Step] Failed to initialize canvas:', error);
      toast.error('Failed to initialize canvas');
    }
  }, [mockup, isInitialized]);

  /**
   * Load AI-generated design or brand logo when canvas is ready
   */
  useEffect(() => {
    if (!canvasInstanceRef.current || !mockup || hasLoadedDesign) return;

    const loadDesignImage = async () => {
      const canvas = canvasInstanceRef.current;
      if (!canvas) return;

      try {
        let imageUrl: string | null = null;

        // Priority 1: Use final design URL (from step 4)
        if (finalDesignUrl) {
          imageUrl = finalDesignUrl;
          console.log('[Canvas Step] Loading AI-generated design');
        }
        // Priority 2: Use first brand logo if available
        else if (brandAssets.logos.length > 0) {
          imageUrl = brandAssets.logos[0];
          console.log('[Canvas Step] Loading brand logo');
        }

        if (imageUrl) {
          await loadImageOntoCanvas(canvas, imageUrl, mockup.printArea);
          setHasLoadedDesign(true);
          toast.success('Design loaded onto canvas');
        }
      } catch (error) {
        console.error('[Canvas Step] Failed to load design image:', error);
        toast.error('Failed to load design image');
      }
    };

    loadDesignImage();
  }, [isInitialized, mockup, finalDesignUrl, brandAssets.logos, hasLoadedDesign]);

  /**
   * Add boundary constraints on object movement
   */
  useEffect(() => {
    if (!canvasInstanceRef.current || !mockup) return;

    const canvas = canvasInstanceRef.current;

    const handleMoving = (e: fabric.IEvent) => {
      if (e.target) {
        constrainObjectToBounds(e.target, mockup.printArea);
      }
    };

    canvas.on('object:moving', handleMoving);

    return () => {
      canvas.off('object:moving', handleMoving);
    };
  }, [isInitialized, mockup]);

  /**
   * Handle file upload (manual logo upload)
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejected) => {
          const error = rejected.errors[0];
          if (error.code === 'file-too-large') {
            toast.error(`${rejected.file.name} is too large. Max size is 5MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${rejected.file.name} is not a valid file type. Use PNG, JPG, or SVG.`);
          } else {
            toast.error(`${rejected.file.name} was rejected.`);
          }
        });
        return;
      }

      if (!userId) {
        toast.error('Please sign in to upload files');
        return;
      }

      if (!canvasInstanceRef.current || !mockup) {
        toast.error('Canvas not ready');
        return;
      }

      setIsUploading(true);

      const file = acceptedFiles[0];

      try {
        const result = await uploadDesignFile(file, userId);

        if (result.success && result.url) {
          // Load uploaded image onto canvas
          await loadImageOntoCanvas(canvasInstanceRef.current, result.url, mockup.printArea);
          setHasLoadedDesign(true);
          toast.success('Logo uploaded and added to canvas');
        } else {
          toast.error(result.error || 'Failed to upload logo');
        }
      } catch (error) {
        console.error('[Canvas Step] Upload error:', error);
        toast.error('Error uploading logo');
      } finally {
        setIsUploading(false);
      }
    },
    [userId, mockup]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    disabled: isUploading,
  });

  /**
   * Handle Save Design
   */
  const handleSave = async () => {
    if (!canvasInstanceRef.current) {
      toast.error('Canvas not ready');
      return;
    }

    setIsSaving(true);

    try {
      // Export canvas as JSON for saving
      const canvasJSON = getCanvasAsJSON(canvasInstanceRef.current);

      // Export as image
      const imageUrl = exportCanvasAsImage(canvasInstanceRef.current, {
        format: 'png',
        quality: 1.0,
        multiplier: 2,
      });

      // Here you would save to database
      // For now, just show success message
      console.log('[Canvas Step] Design saved:', {
        canvasJSON: canvasJSON.substring(0, 100) + '...',
        imageUrl: imageUrl.substring(0, 50) + '...',
        metadata: {
          eventType,
          products: selectedProducts,
          hasAIDesign: !!finalDesignUrl,
          brandColors: brandAssets.colors,
        },
      });

      toast.success('Design saved successfully');
      complete();
    } catch (error) {
      console.error('[Canvas Step] Save error:', error);
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle Download Design
   */
  const handleDownload = () => {
    if (!canvasInstanceRef.current) {
      toast.error('Canvas not ready');
      return;
    }

    setIsDownloading(true);

    try {
      // Export canvas as high-res image
      const dataURL = exportCanvasAsImage(canvasInstanceRef.current, {
        format: 'png',
        quality: 1.0,
        multiplier: 3, // 3x resolution for better quality
      });

      // Create download link
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `design-${Date.now()}.png`;
      link.click();

      toast.success('Design downloaded successfully');
    } catch (error) {
      console.error('[Canvas Step] Download error:', error);
      toast.error('Failed to download design');
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Canvas control functions
   */
  const handleRotate = () => {
    if (!canvasInstanceRef.current) return;
    const activeObj = canvasInstanceRef.current.getActiveObject();
    if (activeObj) {
      const currentAngle = activeObj.angle || 0;
      activeObj.rotate(currentAngle + 15);
      activeObj.setCoords();
      canvasInstanceRef.current.renderAll();
    } else {
      toast.error('Please select an object first');
    }
  };

  const handleZoomIn = () => {
    if (!canvasInstanceRef.current) return;
    const activeObj = canvasInstanceRef.current.getActiveObject();
    if (activeObj) {
      activeObj.scale((activeObj.scaleX || 1) * 1.1);
      activeObj.setCoords();
      canvasInstanceRef.current.renderAll();
    } else {
      toast.error('Please select an object first');
    }
  };

  const handleZoomOut = () => {
    if (!canvasInstanceRef.current) return;
    const activeObj = canvasInstanceRef.current.getActiveObject();
    if (activeObj) {
      activeObj.scale((activeObj.scaleX || 1) * 0.9);
      activeObj.setCoords();
      canvasInstanceRef.current.renderAll();
    } else {
      toast.error('Please select an object first');
    }
  };

  const handleDelete = () => {
    if (!canvasInstanceRef.current) return;
    const activeObj = canvasInstanceRef.current.getActiveObject();
    if (activeObj) {
      canvasInstanceRef.current.remove(activeObj);
      canvasInstanceRef.current.renderAll();
      toast.success('Object deleted');
    } else {
      toast.error('Please select an object first');
    }
  };

  /**
   * Get selected design info
   */
  const selectedDesign = generatedDesigns.find((d) => d.id === selectedDesignId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Canvas Editor</h2>
        <p className="text-lg text-muted-foreground">
          Customize your design: drag, scale, rotate, and position on the mockup
        </p>
      </div>

      {/* AI Design Badge */}
      {finalDesignUrl && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="flex items-center gap-2 py-1.5 px-3">
            <Sparkles className="h-4 w-4" />
            AI Generated Design
          </Badge>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Canvas */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 flex items-center justify-center">
                {/* Mockup Background */}
                {mockup && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <Image
                      src={mockup.imageUrl}
                      alt={mockup.name}
                      width={600}
                      height={700}
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Canvas Element */}
                <canvas ref={canvasRef} className="relative z-10" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Controls and Upload */}
        <div className="space-y-4">
          {/* Canvas Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canvas Controls</CardTitle>
              <CardDescription>Adjust the selected object</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Click an object to select it, then use the controls above
              </p>
            </CardContent>
          </Card>

          {/* Upload Additional Logo */}
          {!hasLoadedDesign && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload Logo</CardTitle>
                <CardDescription>Add your logo to the canvas</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-6
                    text-center cursor-pointer
                    transition-all duration-200
                    ${
                      isDragActive
                        ? 'border-primary bg-primary/5 scale-105'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    }
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm font-medium">Uploading...</p>
                    </div>
                  ) : isDragActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-primary" />
                      <p className="text-sm text-primary font-medium">Drop your logo here...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Upload a logo</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, or SVG (max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mockup Info */}
          {mockup && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Mockup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={mockup.imageUrl}
                      alt={mockup.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{mockup.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {mockup.productType} • {mockup.color}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Design Info */}
          {selectedDesign && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Design Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs">
                  <p className="font-medium mb-1">Original Prompt:</p>
                  <p className="text-muted-foreground italic">{selectedDesign.prompt}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator />

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={previousStep} type="button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to AI Design
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            type="button"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download
          </Button>
          <Button onClick={handleSave} disabled={isSaving} type="button">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Design
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Your design is being created on {mockup?.name || 'the selected mockup'}</p>
        <p>Click Save when you're happy with the positioning</p>
      </div>
    </div>
  );
}
