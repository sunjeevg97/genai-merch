/**
 * Generating Designs Loader
 *
 * Enhanced loading state for design generation with:
 * - 3 skeleton placeholder cards with shimmer effects
 * - Rotating motivational messages
 * - Animated progress indicator
 * - Estimated time remaining
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ROTATING_MESSAGES = [
  'Creating magic...',
  'Crafting your designs...',
  'Almost there...',
  'Bringing your vision to life...',
  'Designing something amazing...',
  'Just a few more seconds...',
];

interface GeneratingDesignsLoaderProps {
  /**
   * Number of designs being generated (default: 3)
   */
  count?: number;

  /**
   * Estimated time in seconds (default: 20)
   */
  estimatedTime?: number;
}

export function GeneratingDesignsLoader({
  count = 3,
  estimatedTime = 20,
}: GeneratingDesignsLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Rotate messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate progress (0-90% over estimated time)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(Math.floor(elapsed));

      // Progress from 0 to 90% over estimated time
      // Last 10% reserved for actual completion
      const progressPercent = Math.min((elapsed / estimatedTime) * 90, 90);
      setProgress(progressPercent);
    }, 100);

    return () => clearInterval(interval);
  }, [estimatedTime]);

  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
      {/* Header with Icon and Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-8"
      >
        <div className="flex items-center justify-center">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <Sparkles className="w-16 h-16 text-primary" />
            <motion.div
              className="absolute inset-0"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="w-16 h-16 text-primary" />
            </motion.div>
          </motion.div>
        </div>

        <h2 className="text-3xl font-bold">Generating Your Designs</h2>

        {/* Rotating Messages */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              {ROTATING_MESSAGES[currentMessageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Time Remaining */}
        {remainingTime > 0 && (
          <p className="text-sm text-muted-foreground">
            Estimated time remaining: {remainingTime} second{remainingTime !== 1 ? 's' : ''}
          </p>
        )}
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mb-12"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Skeleton Placeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Image Skeleton */}
                <div className="relative aspect-square bg-muted">
                  <Skeleton className="w-full h-full" />

                  {/* Shimmer Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.2,
                    }}
                  />

                  {/* Design Number Badge */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Design {index + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section Skeleton */}
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Helper Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center text-sm text-muted-foreground max-w-md"
      >
        <p>
          We're creating {count} unique design{count !== 1 ? 's' : ''} for you using AI.
          This typically takes 15-30 seconds.
        </p>
      </motion.div>
    </div>
  );
}
