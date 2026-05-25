/**
 * Design Context Banner
 *
 * Shows when the user has a design ready from the wizard.
 * Displays a thumbnail of the design and provides a "Change Design" link.
 * Appears at the top of the products page to give context.
 */

'use client';

import { useState } from 'react';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function DesignContextBanner() {
  const { finalDesignUrl } = useDesignWizard();
  const [hidden, setHidden] = useState(false);

  if (!finalDesignUrl || hidden) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Design Thumbnail */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm">
                <Image
                  src={finalDesignUrl}
                  alt="Your design"
                  fill
                  className="object-contain p-1"
                  unoptimized={finalDesignUrl.startsWith('data:')}
                />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                    <Palette className="h-3 w-3" />
                    Design Ready
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Browse products and see your design come to life!
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-primary hover:text-primary/80"
                >
                  <Link href="/design/create">
                    Change Design
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setHidden(true)}
                  title="Hide banner (design is preserved)"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
