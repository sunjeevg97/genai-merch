/**
 * AI Follow-Up Questions Loader
 *
 * Enhanced loading state for AI question generation with:
 * - Animated brain/thinking icon
 * - Rotating status messages
 * - Progress indicator
 * - Engaging visual feedback
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, MessageSquare, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ROTATING_MESSAGES = [
  'Analyzing your answers...',
  'Crafting personalized questions...',
  'Thinking of creative ideas...',
  'Almost ready...',
];

const THOUGHT_ICONS = [Brain, Lightbulb, MessageSquare, Sparkles];

export function AIFollowupLoader() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  // Rotate messages every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
      setCurrentIconIndex((prev) => (prev + 1) % THOUGHT_ICONS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = THOUGHT_ICONS[currentIconIndex];

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {/* Animated Icon */}
            <div className="flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIconIndex}
                  initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <CurrentIcon className="w-16 h-16 text-primary" />
                  </motion.div>

                  {/* Pulse Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold">Generating Follow-Up Questions</h2>

            {/* Rotating Messages */}
            <div className="h-7 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMessageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground"
                >
                  {ROTATING_MESSAGES[currentMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2 h-2 bg-primary rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground pt-2">
              Our AI is creating personalized questions based on your answers.
              This usually takes just a few seconds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
