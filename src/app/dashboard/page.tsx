'use client';

/**
 * Dashboard Page
 *
 * Post-sign-in landing page with 3 animated CTA cards.
 * Serves as the hub for all user actions: Create Design, Browse Products, My Designs.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Wand2, ShoppingBag, Images, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * CTA Card Configuration
 */
interface CTACard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  iconBg: string;
  badge?: string;
  disabled?: boolean;
}

const CTA_CARDS: CTACard[] = [
  {
    title: 'Design Something Amazing',
    description: "Let our AI help you create a one-of-a-kind design. It's easier than you think!",
    icon: Wand2,
    href: '/design/create',
    gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20',
    iconBg: 'bg-violet-500/10 text-violet-500',
  },
  {
    title: 'Explore Products',
    description: 'T-shirts, hoodies, mugs and more — all ready for your personal touch.',
    icon: ShoppingBag,
    href: '/products',
    gradient: 'from-blue-500/20 via-cyan-500/10 to-teal-500/20',
    iconBg: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Your Creations',
    description: 'See all the awesome designs you\'ve made. (Coming soon!)',
    icon: Images,
    href: '/designs',
    gradient: 'from-amber-500/20 via-orange-500/10 to-rose-500/20',
    iconBg: 'bg-amber-500/10 text-amber-500',
    badge: 'Coming Soon',
    disabled: false, // Still navigable to see placeholder
  },
];

/**
 * Animation Variants
 */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
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

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

/**
 * Get time-based greeting
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Working late';
}

/**
 * Dashboard Skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl space-y-8">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto h-6 w-80" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Page Component
 */
export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  const greeting = getGreeting();
  const firstName = user?.firstName || 'there';

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl space-y-10">
        {/* Header */}
        <motion.div
          className="space-y-3 text-center"
          variants={headerVariants}
          initial="hidden"
          animate="show"
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            What would you like to do today?
          </p>
        </motion.div>

        {/* CTA Cards */}
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {CTA_CARDS.map((card) => (
            <motion.div key={card.title} variants={cardVariants}>
              <Link href={card.href} className="block h-full">
                <Card
                  className={`group relative h-full cursor-pointer overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${
                    card.disabled ? 'opacity-75' : ''
                  }`}
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  <CardContent className="relative flex h-full flex-col p-6">
                    {/* Badge */}
                    {card.badge && (
                      <Badge
                        variant="secondary"
                        className="absolute right-4 top-4 bg-muted/80 backdrop-blur-sm"
                      >
                        {card.badge}
                      </Badge>
                    )}

                    {/* Icon */}
                    <div
                      className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <card.icon className="h-7 w-7" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col">
                      <h2 className="mb-2 text-xl font-semibold tracking-tight">
                        {card.title}
                      </h2>
                      <p className="mb-6 flex-1 text-sm text-muted-foreground">
                        {card.description}
                      </p>

                      {/* CTA Arrow */}
                      <div className="flex items-center text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
                        <span>Get started</span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle hint for first-time users */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
            <Sparkles className="h-4 w-4" />
            <span>Ready to bring your ideas to life?</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
