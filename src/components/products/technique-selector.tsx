/**
 * Technique Selector Component
 *
 * Displays print technique options as compact pill buttons with tooltips.
 * Only shown when product supports multiple techniques (e.g., hats, polos).
 */

'use client';

import { cn } from '@/lib/utils';
import type { TechniqueInfo, PrintTechnique } from '@/lib/printful/technique-mapping';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface TechniqueOption {
  value: PrintTechnique;
  label: string;
  description: string;
  isDefault?: boolean;
}

interface TechniqueSelectorProps {
  techniques: TechniqueOption[];
  selectedTechnique: PrintTechnique | null;
  onTechniqueChange: (technique: PrintTechnique) => void;
}

/**
 * Convert TechniqueInfo array to TechniqueOption array
 */
export function toTechniqueOptions(
  techniques: TechniqueInfo[],
  defaultTechnique?: PrintTechnique
): TechniqueOption[] {
  return techniques.map((tech) => ({
    value: tech.technique,
    label: tech.label,
    description: tech.description,
    isDefault: tech.technique === defaultTechnique,
  }));
}

export function TechniqueSelector({
  techniques,
  selectedTechnique,
  onTechniqueChange,
}: TechniqueSelectorProps) {
  // Don't render if there's only one technique (no choice needed)
  if (techniques.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Print Method
      </label>

      <div className="flex flex-wrap gap-1.5">
        {techniques.map((technique) => {
          const isSelected = selectedTechnique === technique.value;

          return (
            <Tooltip key={technique.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onTechniqueChange(technique.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                    'border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-foreground border-border hover:border-primary/50 hover:bg-muted'
                  )}
                >
                  {technique.label}
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                <p className="max-w-xs">{technique.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
