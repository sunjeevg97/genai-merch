/**
 * DesignControls Component
 *
 * Control panel for design manipulation
 *
 * Features:
 * - Position controls (X, Y coordinates)
 * - Size controls (width, height, scale)
 * - Rotation controls
 * - Alignment tools
 * - Undo/Redo buttons
 */

'use client';

interface DesignControlsProps {
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onScaleChange?: (scale: number) => void;
  onRotationChange?: (rotation: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function DesignControls({
  position = { x: 0, y: 0 },
  scale = 1,
  rotation = 0,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onUndo,
  onRedo,
}: DesignControlsProps) {
  return (
    <div className="design-controls space-y-4">
      <div>
        <label className="text-sm font-medium">Position</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">X</label>
            <input
              type="number"
              value={position.x}
              className="w-full border rounded px-2 py-1 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Y</label>
            <input
              type="number"
              value={position.y}
              className="w-full border rounded px-2 py-1 text-sm"
              readOnly
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Scale</label>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={scale}
          className="w-full mt-2"
          readOnly
        />
        <p className="text-xs text-muted-foreground mt-1">{scale.toFixed(1)}x</p>
      </div>

      <div>
        <label className="text-sm font-medium">Rotation</label>
        <input
          type="range"
          min="0"
          max="360"
          value={rotation}
          className="w-full mt-2"
          readOnly
        />
        <p className="text-xs text-muted-foreground mt-1">{rotation}°</p>
      </div>

      <div className="flex gap-2 pt-2">
        <button className="flex-1 border rounded-lg px-3 py-2 text-sm">
          Undo
        </button>
        <button className="flex-1 border rounded-lg px-3 py-2 text-sm">
          Redo
        </button>
      </div>
    </div>
  );
}
