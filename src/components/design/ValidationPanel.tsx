/**
 * ValidationPanel Component
 *
 * Displays design validation status and warnings
 *
 * Features:
 * - DPI validation
 * - Dimension validation
 * - Print area validation
 * - Color space warnings
 * - Export readiness indicator
 */

'use client';

interface ValidationResult {
  isValid: boolean;
  dpi?: number;
  dimensions?: { width: number; height: number };
  warnings?: string[];
  errors?: string[];
}

interface ValidationPanelProps {
  validation?: ValidationResult;
}

export function ValidationPanel({ validation }: ValidationPanelProps) {
  if (!validation) {
    return (
      <div className="validation-panel">
        <p className="text-sm text-muted-foreground">
          Upload a design to see validation results
        </p>
      </div>
    );
  }

  const { isValid, dpi, dimensions, warnings = [], errors = [] } = validation;

  return (
    <div className="validation-panel space-y-4">
      <div className="flex items-center gap-2">
        {isValid ? (
          <>
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm font-medium text-success">
              Ready for print
            </span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm font-medium text-destructive">
              Print quality issues detected
            </span>
          </>
        )}
      </div>

      {dpi && (
        <div className="text-sm">
          <span className="font-medium">DPI:</span>{' '}
          <span className={dpi < 150 ? 'text-destructive' : 'text-success'}>
            {dpi}
          </span>
          {dpi < 150 && (
            <p className="text-xs text-destructive mt-1">
              Minimum 150 DPI recommended for print
            </p>
          )}
        </div>
      )}

      {dimensions && (
        <div className="text-sm">
          <span className="font-medium">Dimensions:</span>{' '}
          {dimensions.width} x {dimensions.height} px
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-warning">Warnings:</p>
          {warnings.map((warning, i) => (
            <p key={i} className="text-xs text-warning">
              • {warning}
            </p>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">Errors:</p>
          {errors.map((error, i) => (
            <p key={i} className="text-xs text-destructive">
              • {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
