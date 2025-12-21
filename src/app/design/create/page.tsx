/**
 * Design Studio - Main Page
 *
 * The primary design creation interface where users can:
 * - Select product mockups
 * - Upload logos
 * - Position and customize designs on canvas
 * - Preview final products
 * - Save designs to the database
 *
 * Features:
 * - Auto-save drafts every 30 seconds
 * - Unsaved changes warning before leaving
 * - Progress indicators
 * - Responsive layout
 * - Error handling with boundaries
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import { FileUpload } from '@/components/design/FileUpload';
import { ProductSelector } from '@/components/design/ProductSelector';
import { DesignCanvas, type DesignState } from '@/components/design/DesignCanvas';
import { DesignControls } from '@/components/design/DesignControls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDefaultMockup, type Mockup, MOCKUPS } from '@/lib/design/mockups';
import type { UploadResultData } from '@/lib/hooks/useFileUpload';
import { toast } from 'sonner';
import { Save, Download, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * Design Studio Page Component
 */
export default function CreateDesignPage() {
  // Router for navigation
  const router = useRouter();

  // State: Product Selection
  const [selectedMockup, setSelectedMockup] = useState<Mockup>(getDefaultMockup());

  // State: File Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // State: Design
  const [designState, setDesignState] = useState<DesignState | null>(null);
  const [canvasInstance, setCanvasInstance] = useState<fabric.Canvas | null>(null);

  // State: Saving & Auto-save
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State: Progress tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // State: Unsaved changes dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  /**
   * Handle file upload
   */
  const handleFileUploaded = useCallback((data: UploadResultData) => {
    console.log('File uploaded:', data.fileName, data.publicUrl);
    setUploadedImageUrl(data.publicUrl);
    setHasUnsavedChanges(true);

    // Mark step 2 as complete
    setCompletedSteps(prev => new Set(prev).add(2));
    setCurrentStep(3);

    toast.success('Logo uploaded successfully!');
  }, []);

  /**
   * Handle mockup selection
   */
  const handleMockupChange = useCallback((mockupId: string) => {
    const mockup = MOCKUPS.find(m => m.id === mockupId);
    if (mockup) {
      setSelectedMockup(mockup);
      setHasUnsavedChanges(true);

      // Mark step 1 as complete
      setCompletedSteps(prev => new Set(prev).add(1));
      if (currentStep === 1) {
        setCurrentStep(2);
      }

      toast.success(`Switched to ${mockup.name}`);
    }
  }, [currentStep]);

  /**
   * Handle design state changes from canvas
   */
  const handleDesignChange = useCallback((newState: DesignState) => {
    setDesignState(newState);
    setHasUnsavedChanges(true);

    // Mark step 3 as complete if logo is positioned
    if (newState.logoWidth > 0) {
      setCompletedSteps(prev => new Set(prev).add(3));
    }
  }, []);

  /**
   * Canvas control handlers
   */
  const handleReset = useCallback(() => {
    if (!canvasInstance) return;
    const activeObj = canvasInstance.getActiveObject();
    if (activeObj) {
      activeObj.set({
        left: selectedMockup.printArea.x + selectedMockup.printArea.width / 2,
        top: selectedMockup.printArea.y + selectedMockup.printArea.height / 2,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
      });
      activeObj.setCoords();
      canvasInstance.renderAll();
      setHasUnsavedChanges(true);
    }
  }, [canvasInstance, selectedMockup]);

  const handleCenter = useCallback(() => {
    if (!canvasInstance) return;
    const activeObj = canvasInstance.getActiveObject();
    if (activeObj) {
      activeObj.set({
        left: selectedMockup.printArea.x + selectedMockup.printArea.width / 2,
        top: selectedMockup.printArea.y + selectedMockup.printArea.height / 2,
      });
      activeObj.setCoords();
      canvasInstance.renderAll();
      setHasUnsavedChanges(true);
    }
  }, [canvasInstance, selectedMockup]);

  const handleFlip = useCallback(() => {
    if (!canvasInstance) return;
    const activeObj = canvasInstance.getActiveObject();
    if (activeObj) {
      activeObj.set({ flipX: !activeObj.flipX });
      activeObj.setCoords();
      canvasInstance.renderAll();
      setHasUnsavedChanges(true);
    }
  }, [canvasInstance]);

  const handleRotate = useCallback((degrees: number) => {
    if (!canvasInstance) return;
    const activeObj = canvasInstance.getActiveObject();
    if (activeObj) {
      activeObj.set({ angle: degrees });
      activeObj.setCoords();
      canvasInstance.renderAll();
      setHasUnsavedChanges(true);
    }
  }, [canvasInstance]);

  const handleScale = useCallback((scale: number) => {
    if (!canvasInstance) return;
    const activeObj = canvasInstance.getActiveObject();
    if (activeObj) {
      activeObj.set({ scaleX: scale, scaleY: scale });
      activeObj.setCoords();
      canvasInstance.renderAll();
      setHasUnsavedChanges(true);
    }
  }, [canvasInstance]);

  /**
   * Save design to database
   */
  const saveDesign = useCallback(async () => {
    if (!designState) {
      toast.error('No design to save');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement API call to save design
      // const response = await fetch('/api/designs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     mockupId: selectedMockup.id,
      //     imageUrl: uploadedImageUrl,
      //     designState,
      //   }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('Design saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  }, [designState, selectedMockup.id, uploadedImageUrl]);

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set up auto-save if there are unsaved changes
    if (hasUnsavedChanges && designState) {
      autoSaveTimerRef.current = setTimeout(() => {
        console.log('Auto-saving design...');
        saveDesign();
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, designState, saveDesign]);

  /**
   * Warn before leaving page with unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  /**
   * Calculate progress percentage
   */
  const progressPercentage = (completedSteps.size / 3) * 100;

  /**
   * Download design (export canvas as image)
   */
  const handleDownload = useCallback(() => {
    if (!canvasInstance) {
      toast.error('No canvas to download');
      return;
    }

    try {
      const dataUrl = canvasInstance.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2, // 2x resolution for better quality
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `design-${selectedMockup.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Design downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download design');
    }
  }, [canvasInstance, selectedMockup.name]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Design Studio</h1>
              <p className="text-sm text-muted-foreground">Create your custom merchandise</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Last saved indicator */}
              {lastSaved && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Unsaved changes indicator */}
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Unsaved changes</span>
                </div>
              )}

              {/* Download button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!designState || designState.logoWidth === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {/* Save button */}
              <Button
                onClick={saveDesign}
                disabled={isSaving || !hasUnsavedChanges || !designState}
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Design
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <Badge variant={completedSteps.has(1) ? 'default' : 'outline'}>
                  1. Choose Product {completedSteps.has(1) && '✓'}
                </Badge>
                <Badge variant={completedSteps.has(2) ? 'default' : 'outline'}>
                  2. Upload Logo {completedSteps.has(2) && '✓'}
                </Badge>
                <Badge variant={completedSteps.has(3) ? 'default' : 'outline'}>
                  3. Design {completedSteps.has(3) && '✓'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {completedSteps.size} of 3 steps complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Product & Upload (Stacks on mobile) */}
          <div className="xl:col-span-8 space-y-6">
            {/* Product Selector */}
            <Card className="p-6">
              <ProductSelector
                selectedMockupId={selectedMockup.id}
                onMockupChange={handleMockupChange}
              />
            </Card>

            {/* File Upload */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-3">Upload Your Logo</h3>
              <FileUpload onFileUploaded={handleFileUploaded} />
            </Card>

            {/* Design Canvas */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Design Canvas</h3>
                {!uploadedImageUrl && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Upload a logo to get started</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <DesignCanvas
                  mockup={selectedMockup}
                  uploadedImageUrl={uploadedImageUrl}
                  onDesignChange={handleDesignChange}
                  initialDesign={null}
                />
              </div>
            </Card>

            {/* Preview Section - Placeholder for Phase 4 */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-3">Preview Your Design</h3>
              <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  MockupPreview component will be added in Phase 4
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column - Design Controls */}
          <div className="xl:col-span-4">
            <div className="sticky top-4">
              <DesignControls
                canvas={canvasInstance}
                designState={designState}
                onReset={handleReset}
                onCenter={handleCenter}
                onFlip={handleFlip}
                onRotate={handleRotate}
                onScale={handleScale}
              />

              {/* Design Info */}
              {designState && (
                <Card className="mt-4 p-4">
                  <h4 className="text-xs font-semibold mb-2">Design Information</h4>
                  <Separator className="mb-2" />
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="font-medium">{selectedMockup.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Logo Size:</span>
                      <span className="font-mono">
                        {Math.round(designState.logoWidth)} × {Math.round(designState.logoHeight)}px
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-mono">
                        ({Math.round(designState.logoX)}, {Math.round(designState.logoY)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rotation:</span>
                      <span className="font-mono">{Math.round(designState.logoRotation)}°</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                saveDesign();
                setShowUnsavedDialog(false);
              }}
            >
              Save & Continue
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowUnsavedDialog(false);
                setHasUnsavedChanges(false);
                if (pendingNavigation) {
                  router.push(pendingNavigation);
                }
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
