/**
 * My Designs Page (Placeholder)
 *
 * Coming soon page for viewing and managing saved designs.
 * Shows a friendly placeholder with CTA to create first design.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Images, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Animation variants for staggered entrance
 */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
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

export default function DesignsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Icon with Coming Soon Badge */}
        <motion.div variants={itemVariants} className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20">
            <Images className="h-12 w-12 text-primary" />
          </div>
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 gap-1 bg-amber-100 text-amber-800 border-amber-200"
          >
            <Clock className="h-3 w-3" />
            Coming Soon
          </Badge>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl md:text-4xl font-bold mb-3"
        >
          Your Designs
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-lg text-muted-foreground max-w-md mb-8"
        >
          Soon you&apos;ll be able to see all your creations in one place! In the
          meantime, why not create something new?
        </motion.p>

        {/* Feature Preview Card */}
        <motion.div variants={itemVariants} className="w-full max-w-md mb-8">
          <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-2">
                What&apos;s coming:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  View all your AI-generated designs
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Reuse designs across different products
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Organize with tags and collections
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Share designs with your team
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <Button asChild size="lg" className="gap-2">
            <Link href="/design/create">
              <Sparkles className="h-5 w-5" />
              Create Your First Design
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
