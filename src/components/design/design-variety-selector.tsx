/**
 * Design Variety Selector Component
 *
 * Allows users to choose how their 3 generated designs should differ:
 * - 'Variations': Same core concept with different emphasis
 * - 'Different Concepts': Distinct visual approaches
 *
 * Features:
 * - Two large side-by-side cards
 * - Visual icons (Layers for variations, Sparkles for concepts)
 * - Clear descriptions explaining each option
 * - "Generate 3 Designs" button at bottom
 * - Framer Motion entrance animations
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Sparkles, ArrowLeft, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DesignVarietySelectorProps {
  /** Callback when user selects variety level and clicks generate */
  onSelect: (level: 'variations' | 'different-concepts') => void;

  /** Callback when user clicks back button */
  onBack?: () => void;

  /** Whether generation is in progress */
  loading?: boolean;
}

export function DesignVarietySelector({
  onSelect,
  onBack,
  loading = false,
}: DesignVarietySelectorProps) {
  const [selected, setSelected] = useState<'variations' | 'different-concepts' | null>(null);

  const handleGenerate = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back Button */}
          {onBack && (
            <Button variant="ghost" size="sm" className="mb-6" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">Choose Your Design Variety</h1>
            <p className="text-muted-foreground text-lg">
              How should your 3 designs differ from each other?
            </p>
          </div>
        </motion.div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Variations Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`
                cursor-pointer transition-all duration-200 h-full
                ${
                  selected === 'variations'
                    ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary hover:shadow-md'
                }
              `}
              onClick={() => setSelected('variations')}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      ${
                        selected === 'variations'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      }
                    `}
                  >
                    <Layers className="w-8 h-8" />
                  </div>
                  {selected === 'variations' && (
                    <Badge variant="default" className="bg-primary">
                      Selected
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">Variations</CardTitle>
                <CardDescription className="text-base">
                  Same core concept, different emphasis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  All 3 designs will share the same overall concept and style, but will vary in:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Color dominance and contrast</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Element sizing and scale</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Composition and layout</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Detail level and complexity</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    <strong>Best for:</strong> When you have a clear vision and want options to
                    choose from
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Different Concepts Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`
                cursor-pointer transition-all duration-200 h-full
                ${
                  selected === 'different-concepts'
                    ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary hover:shadow-md'
                }
              `}
              onClick={() => setSelected('different-concepts')}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      ${
                        selected === 'different-concepts'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent/10 text-accent'
                      }
                    `}
                  >
                    <Sparkles className="w-8 h-8" />
                  </div>
                  {selected === 'different-concepts' && (
                    <Badge variant="default" className="bg-primary">
                      Selected
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">Different Concepts</CardTitle>
                <CardDescription className="text-base">
                  Distinct visual approaches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Each of the 3 designs will explore a unique visual style:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Bold graphic with high contrast</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Detailed illustration with textures</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Minimalist modern with clean lines</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">Different compositional approaches</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    <strong>Best for:</strong> When you're exploring options and want to see
                    diverse styles
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            className="min-w-[280px]"
            disabled={!selected || loading}
            onClick={handleGenerate}
          >
            {loading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating Designs...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate 3 Designs
              </>
            )}
          </Button>
        </motion.div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            This will generate 3 unique designs. Generation typically takes 15-30 seconds.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
