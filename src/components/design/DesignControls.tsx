/**
 * Design Controls Component
 */
'use client';

import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import type { DesignState } from './DesignCanvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, Maximize2, RotateCcw, FlipHorizontal, FlipVertical, RotateCw, ZoomIn, ZoomOut, ChevronDown, Trash2, Undo2, Redo2, Lock, Unlock, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface DesignControlsProps {
  canvas: fabric.Canvas | null;
  designState: DesignState | null;
  onReset: () => void;
  onCenter: () => void;
  onFlip: () => void;
  onRotate: (degrees: number) => void;
  onScale: (scale: number) => void;
}

export function DesignControls({ canvas, designState, onReset, onCenter, onFlip, onRotate, onScale }: DesignControlsProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);
  const [flipVertical, setFlipVertical] = useState(false);

  useEffect(() => {
    if (designState) {
      setRotation(designState.logoRotation || 0);
      setScale(Math.round((designState.logoScaleX || 1) * 100));
    }
  }, [designState]);

  const handleCenter = () => { onCenter(); toast.success('Logo centered'); };
  const handleResetPosition = () => { onReset(); toast.success('Position reset'); };
  const handleFitToPrintArea = () => { onScale(1); setScale(100); toast.success('Fit to print area'); };
  const handleResetSize = () => { onReset(); setScale(100); toast.success('Size reset'); };
  const handleScaleChange = (value: number[]) => { const newScale = value[0]; setScale(newScale); onScale(newScale / 100); };
  const handleFlipHorizontal = () => { onFlip(); };
  const handleFlipVertical = () => { if (!canvas) return; const activeObj = canvas.getActiveObject(); if (activeObj) { activeObj.set({ flipY: !activeObj.flipY }); activeObj.setCoords(); canvas.renderAll(); setFlipVertical(!flipVertical); toast.success(activeObj.flipY ? 'Flipped vertical' : 'Unflipped vertical'); } };
  const handleRotationChange = (value: number[]) => { const newRotation = value[0]; setRotation(newRotation); onRotate(newRotation); };
  const handleResetRotation = () => { setRotation(0); onRotate(0); toast.success('Rotation reset'); };
  const handleOpacityChange = (value: number[]) => { if (!canvas) return; const newOpacity = value[0]; setOpacity(newOpacity); const activeObj = canvas.getActiveObject(); if (activeObj) { activeObj.set({ opacity: newOpacity / 100 }); canvas.renderAll(); } };
  const handleBringToFront = () => { if (!canvas) return; const activeObj = canvas.getActiveObject(); if (activeObj) { canvas.bringToFront(activeObj); canvas.renderAll(); toast.success('Brought to front'); } };
  const handleSendToBack = () => { if (!canvas) return; const activeObj = canvas.getActiveObject(); if (activeObj) { canvas.sendToBack(activeObj); canvas.renderAll(); toast.success('Sent to back'); } };
  const handleClearCanvas = () => { setIsClearDialogOpen(true); };
  const confirmClearCanvas = () => { if (!canvas) return; const objects = canvas.getObjects(); objects.forEach((obj) => { if (obj.evented !== false && obj.selectable !== false) { canvas.remove(obj); } }); canvas.renderAll(); setIsClearDialogOpen(false); toast.success('Canvas cleared'); };
  const handleUndo = () => { toast.info('Undo not yet implemented'); };
  const handleRedo = () => { toast.info('Redo not yet implemented'); };

  const hasLogo = designState && designState.logoWidth > 0;

  return (
    <TooltipProvider>
      <Card className='w-full max-w-sm p-4 space-y-4'>
        <div>
          <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'><Maximize2 className='h-4 w-4' />Position</h3>
          <div className='space-y-2'>
            <div className='grid grid-cols-2 gap-2'>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleCenter} disabled={!hasLogo} className='w-full'><Maximize2 className='h-4 w-4 mr-2' />Center</Button></TooltipTrigger><TooltipContent><p>Center logo in print area (C)</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleResetPosition} disabled={!hasLogo} className='w-full'><RotateCcw className='h-4 w-4 mr-2' />Reset</Button></TooltipTrigger><TooltipContent><p>Reset to original position</p></TooltipContent></Tooltip>
            </div>
            {hasLogo && designState && (<div className='text-xs text-muted-foreground bg-muted p-2 rounded'><div className='flex justify-between'><span>X:</span><span className='font-mono'>{Math.round(designState.logoX)}px</span></div><div className='flex justify-between'><span>Y:</span><span className='font-mono'>{Math.round(designState.logoY)}px</span></div></div>)}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'><ZoomIn className='h-4 w-4' />Size</h3>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-2'>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleFitToPrintArea} disabled={!hasLogo} className='w-full'><ZoomOut className='h-4 w-4 mr-2' />Fit</Button></TooltipTrigger><TooltipContent><p>Fit to print area</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleResetSize} disabled={!hasLogo} className='w-full'><RotateCcw className='h-4 w-4 mr-2' />Reset</Button></TooltipTrigger><TooltipContent><p>Reset to original size</p></TooltipContent></Tooltip>
            </div>
            <div className='space-y-2'><div className='flex items-center justify-between'><Label htmlFor='size-slider' className='text-xs'>Scale</Label><span className='text-xs font-mono text-muted-foreground'>{scale}%</span></div><Slider id='size-slider' min={10} max={200} step={1} value={[scale]} onValueChange={handleScaleChange} disabled={!hasLogo} className='w-full' /></div>
            {hasLogo && designState && (<div className='text-xs text-muted-foreground bg-muted p-2 rounded'><div className='flex justify-between'><span>Width:</span><span className='font-mono'>{Math.round(designState.logoWidth)}px</span></div><div className='flex justify-between'><span>Height:</span><span className='font-mono'>{Math.round(designState.logoHeight)}px</span></div></div>)}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'><RotateCw className='h-4 w-4' />Transform</h3>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-2'>
              <Tooltip><TooltipTrigger asChild><Button variant={designState?.isFlipped ? 'default' : 'outline'} size='sm' onClick={handleFlipHorizontal} disabled={!hasLogo} className='w-full'><FlipHorizontal className='h-4 w-4 mr-2' />H-Flip</Button></TooltipTrigger><TooltipContent><p>Flip horizontal (F)</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant={flipVertical ? 'default' : 'outline'} size='sm' onClick={handleFlipVertical} disabled={!hasLogo} className='w-full'><FlipVertical className='h-4 w-4 mr-2' />V-Flip</Button></TooltipTrigger><TooltipContent><p>Flip vertical</p></TooltipContent></Tooltip>
            </div>
            <div className='space-y-2'><div className='flex items-center justify-between'><Label htmlFor='rotation-slider' className='text-xs'>Rotation</Label><span className='text-xs font-mono text-muted-foreground'>{rotation}°</span></div><Slider id='rotation-slider' min={-180} max={180} step={1} value={[rotation]} onValueChange={handleRotationChange} disabled={!hasLogo} className='w-full' /></div>
            <Button variant='outline' size='sm' onClick={handleResetRotation} disabled={!hasLogo} className='w-full'><RotateCcw className='h-4 w-4 mr-2' />Reset Rotation</Button>
          </div>
        </div>
        <Separator />
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild><Button variant='ghost' className='w-full justify-between'><span className='text-sm font-semibold'>Advanced</span><ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} /></Button></CollapsibleTrigger>
          <CollapsibleContent className='space-y-3 mt-3'>
            <div className='space-y-2'><div className='flex items-center justify-between'><Label htmlFor='opacity-slider' className='text-xs'>Opacity</Label><span className='text-xs font-mono text-muted-foreground'>{opacity}%</span></div><Slider id='opacity-slider' min={0} max={100} step={1} value={[opacity]} onValueChange={handleOpacityChange} disabled={!hasLogo} className='w-full' /></div>
            <div className='flex items-center justify-between'><Label htmlFor='aspect-ratio' className='text-xs flex items-center gap-2'>{lockAspectRatio ? <Lock className='h-3 w-3' /> : <Unlock className='h-3 w-3' />}Lock Aspect Ratio</Label><Switch id='aspect-ratio' checked={lockAspectRatio} onCheckedChange={setLockAspectRatio} disabled={!hasLogo} /></div>
            <div className='grid grid-cols-2 gap-2'>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleBringToFront} disabled={!hasLogo} className='w-full'><ArrowUp className='h-4 w-4 mr-2' />Front</Button></TooltipTrigger><TooltipContent><p>Bring to front</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleSendToBack} disabled={!hasLogo} className='w-full'><ArrowDown className='h-4 w-4 mr-2' />Back</Button></TooltipTrigger><TooltipContent><p>Send to back</p></TooltipContent></Tooltip>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Separator />
        <div>
          <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'><AlertCircle className='h-4 w-4' />Actions</h3>
          <div className='space-y-2'>
            <div className='grid grid-cols-2 gap-2'>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleUndo} disabled className='w-full'><Undo2 className='h-4 w-4 mr-2' />Undo</Button></TooltipTrigger><TooltipContent><p>Undo last action (Ctrl+Z)</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant='outline' size='sm' onClick={handleRedo} disabled className='w-full'><Redo2 className='h-4 w-4 mr-2' />Redo</Button></TooltipTrigger><TooltipContent><p>Redo last action (Ctrl+Y)</p></TooltipContent></Tooltip>
            </div>
            <Tooltip><TooltipTrigger asChild><Button variant='destructive' size='sm' onClick={handleClearCanvas} disabled={!hasLogo} className='w-full'><Trash2 className='h-4 w-4 mr-2' />Clear Canvas</Button></TooltipTrigger><TooltipContent><p>Remove all objects from canvas</p></TooltipContent></Tooltip>
          </div>
        </div>
      </Card>
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}><DialogContent><DialogHeader><DialogTitle>Clear Canvas?</DialogTitle><DialogDescription>This will remove all objects from the canvas. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant='outline' onClick={() => setIsClearDialogOpen(false)}>Cancel</Button><Button variant='destructive' onClick={confirmClearCanvas}>Clear Canvas</Button></DialogFooter></DialogContent></Dialog>
    </TooltipProvider>
  );
}
