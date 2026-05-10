/**
 * Wizard Completion Step
 *
 * Shown after the user selects their final design in the AI Chat step.
 * Provides clear CTAs to continue the journey:
 * - Apply to Products → navigates to /products or returnToProductId
 * - Create Another Design → resets wizard
 * - Go to Dashboard → /dashboard
 *
 * Features celebratory animations and a large design preview.
 */

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, Sparkles, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDesignWizard } from '@/lib/store/design-wizard';
import Image from 'next/image';

/**
 * Animation variants for staggered children
 */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const checkmarkVariants = {
  hidden: { scale: 0, rotate: -180 },
  show: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
};

export function WizardCompletionStep() {
  const router = useRouter();
  const { finalDesignUrl, returnToProductId, resetWizard, completeDesignWizard } = useDesignWizard();

  /**
   * Handle "Apply to Products" CTA
   * Navigates to the specific product if returnToProductId is set,
   * otherwise navigates to the products catalog
   */
  const handleApplyToProducts = () => {
    completeDesignWizard();

    if (returnToProductId) {
      router.push(`/products/${returnToProductId}`);
    } else {
      router.push('/products');
    }
  };

  /**
   * Handle "Create Another Design" CTA
   * Resets the wizard and stays on the same page
   */
  const handleCreateAnother = () => {
    resetWizard();
    // Scroll to top for fresh start
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle "Go to Dashboard" CTA
   */
  const handleGoToDashboard = () => {
    completeDesignWizard();
    router.push('/dashboard');
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Celebratory Icon */}
      <motion.div
        className="relative mb-8"
        variants={checkmarkVariants}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        {/* Sparkle decorations */}
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' as const }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -left-3"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring' as const }}
        >
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-center mb-3"
        variants={itemVariants}
      >
        You did it! 🎊
      </motion.h1>

      <motion.p
        className="text-lg text-muted-foreground text-center mb-8 max-w-md"
        variants={itemVariants}
      >
        Your design is ready to shine on some amazing products.
      </motion.p>

      {/* Design Preview */}
      {finalDesignUrl && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <Image
                  src={finalDesignUrl}
                  alt="Your design"
                  fill
                  className="object-contain p-4"
                  unoptimized={finalDesignUrl.startsWith('data:')}
                />
              </div>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground text-center mt-3">
            Don&apos;t worry, your design is saved and waiting for you.
          </p>
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md"
        variants={itemVariants}
      >
        {/* Primary CTA */}
        <Button
          size="lg"
          onClick={handleApplyToProducts}
          className="w-full sm:w-auto flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
        >
          <ShoppingBag className="w-5 h-5" />
          See It on Products
          <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Secondary CTA */}
        <Button
          size="lg"
          variant="outline"
          onClick={handleCreateAnother}
          className="w-full sm:w-auto flex-1 gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Create Another Design
        </Button>
      </motion.div>

      {/* Tertiary Link */}
      <motion.div variants={itemVariants} className="mt-6">
        <Button
          variant="ghost"
          onClick={handleGoToDashboard}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}
