/**
 * Design Feedback Component
 *
 * Collects user feedback on generated designs using multi-select chips.
 * Features:
 * - 3 design thumbnails at top
 * - Two-column grid: "What I Liked" / "What I Disliked"
 * - Multi-select badge chips with Lucide icons
 * - Green badges for likes, red for dislikes
 * - "Regenerate with Feedback" button
 * - "Continue" button (skips regeneration)
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Palette,
  Brush,
  Layout,
  Image as ImageIcon,
  Minus,
  Plus,
  X,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { DesignFeedback } from '@/lib/store/design-wizard';

interface GeneratedDesign {
  id: string;
  imageUrl: string;
  prompt: string;
  metadata?: {
    index: number;
  };
}

interface DesignFeedbackProps {
  /** Array of generated designs to show */
  designs: GeneratedDesign[];

  /** Callback when user submits feedback */
  onSubmit: (feedback: DesignFeedback) => void;

  /** Callback when user skips feedback (Continue button) */
  onSkip: () => void;

  /** Whether regeneration is in progress */
  loading?: boolean;
}

// Feedback option definitions
const FEEDBACK_OPTIONS = {
  likes: [
    { value: 'colors', label: 'Colors', icon: Palette },
    { value: 'style', label: 'Style', icon: Brush },
    { value: 'composition', label: 'Layout', icon: Layout },
    { value: 'imagery', label: 'Imagery', icon: ImageIcon },
    { value: 'simplicity', label: 'Simplicity', icon: Minus },
    { value: 'detail', label: 'Detail Level', icon: Plus },
  ],
  dislikes: [
    { value: 'colors', label: 'Colors', icon: Palette },
    { value: 'style', label: 'Style', icon: Brush },
    { value: 'composition', label: 'Layout', icon: Layout },
    { value: 'imagery', label: 'Imagery', icon: ImageIcon },
    { value: 'too-complex', label: 'Too Complex', icon: X },
    { value: 'too-simple', label: 'Too Simple', icon: Minus },
  ],
};

export function DesignFeedbackComponent({
  designs,
  onSubmit,
  onSkip,
  loading = false,
}: DesignFeedbackProps) {
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const toggleLike = (value: string) => {
    setLikes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleDislike = (value: string) => {
    setDislikes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      likes,
      dislikes,
      additionalNotes: additionalNotes.trim() || undefined,
    });
  };

  const hasAnyFeedback = likes.length > 0 || dislikes.length > 0 || additionalNotes.trim();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-3">Provide Feedback</h1>
        <p className="text-muted-foreground text-lg">
          Tell us what you liked and what could be improved
        </p>
      </motion.div>

      {/* Design Thumbnails */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-4 mb-8"
      >
        {designs.map((design, index) => (
          <div
            key={design.id}
            className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border shadow-md"
          >
            <Image
              src={design.imageUrl}
              alt={`Design ${index + 1}`}
              fill
              className="object-contain bg-muted"
              sizes="128px"
            />
            <Badge
              variant="secondary"
              className="absolute bottom-1 right-1 text-xs font-semibold"
            >
              {index + 1}
            </Badge>
          </div>
        ))}
      </motion.div>

      {/* Feedback Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* What I Liked */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle>What I Liked</CardTitle>
                  <CardDescription>Select all that apply</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_OPTIONS.likes.map((option) => {
                  const Icon = option.icon;
                  const isSelected = likes.includes(option.value);

                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`
                        cursor-pointer transition-all duration-200 px-3 py-2
                        ${
                          isSelected
                            ? 'bg-success hover:bg-success/90 text-success-foreground'
                            : 'hover:bg-success/10 hover:border-success'
                        }
                      `}
                      onClick={() => toggleLike(option.value)}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {option.label}
                    </Badge>
                  );
                })}
              </div>
              {likes.length > 0 && (
                <p className="text-sm text-success mt-3">
                  {likes.length} aspect{likes.length > 1 ? 's' : ''} selected
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* What I Disliked */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>What I Disliked</CardTitle>
                  <CardDescription>Select all that apply</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_OPTIONS.dislikes.map((option) => {
                  const Icon = option.icon;
                  const isSelected = dislikes.includes(option.value);

                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`
                        cursor-pointer transition-all duration-200 px-3 py-2
                        ${
                          isSelected
                            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                            : 'hover:bg-destructive/10 hover:border-destructive'
                        }
                      `}
                      onClick={() => toggleDislike(option.value)}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {option.label}
                    </Badge>
                  );
                })}
              </div>
              {dislikes.length > 0 && (
                <p className="text-sm text-destructive mt-3">
                  {dislikes.length} aspect{dislikes.length > 1 ? 's' : ''} selected
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes (Optional)</CardTitle>
            <CardDescription>Any other thoughts or specific requests?</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., 'Make the text larger' or 'Use a different font style'"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        {/* Continue Without Feedback */}
        <Button variant="outline" size="lg" onClick={onSkip} disabled={loading}>
          Continue Without Feedback
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Regenerate with Feedback */}
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!hasAnyFeedback || loading}
          className="min-w-[240px]"
        >
          {loading ? (
            <>
              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              Regenerate with Feedback
            </>
          )}
        </Button>
      </motion.div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {hasAnyFeedback
            ? 'Your feedback will help generate improved designs'
            : 'Select aspects you liked or disliked to refine the designs'}
        </p>
      </motion.div>
    </div>
  );
}
