/**
 * Event Type Selection Step
 *
 * First step in the AI-first design wizard.
 * Users select the type of event/purpose for their custom merchandise.
 * This selection helps contextualize AI design generation.
 */

'use client';

import { useDesignWizard, type EventType, WizardStep } from '@/lib/store/design-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Event Type Option
 *
 * Configuration for each selectable event type card.
 */
interface EventTypeOption {
  type: EventType;
  emoji: string;
  title: string;
  description: string;
}

/**
 * Event Type Options
 *
 * All available event types with their display properties.
 */
const EVENT_TYPES: EventTypeOption[] = [
  {
    type: 'charity',
    emoji: '❤️',
    title: 'Charity Event',
    description: 'Fundraisers, galas, awareness campaigns, non-profits',
  },
  {
    type: 'sports',
    emoji: '⚽',
    title: 'Sports Team',
    description: 'Team uniforms, tournament gear, league apparel',
  },
  {
    type: 'company',
    emoji: '🏢',
    title: 'Company Event',
    description: 'Corporate events, team building, branded merchandise',
  },
  {
    type: 'family',
    emoji: '👨‍👩‍👧‍👦',
    title: 'Family Reunion',
    description: 'Family gatherings, reunions, celebrations',
  },
  {
    type: 'school',
    emoji: '🎓',
    title: 'School',
    description: 'Class shirts, graduation, club merchandise, spirit wear',
  },
  {
    type: 'other',
    emoji: '🎉',
    title: 'Other',
    description: 'Custom events, special occasions, personal projects',
  },
];

/**
 * Event Type Step Component
 *
 * Displays a grid of event type cards for user selection.
 * Clicking a card sets the event type and advances to the next step.
 *
 * @example
 * ```tsx
 * <EventTypeStep />
 * ```
 */
export function EventTypeStep() {
  const { eventType, setEventType, nextStep } = useDesignWizard();

  /**
   * Handle event type selection
   *
   * Sets the event type in Zustand store and advances to next step.
   */
  const handleSelectEventType = (type: EventType) => {
    setEventType(type);
    nextStep();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">What's the occasion?</h2>
        <p className="text-lg text-muted-foreground">
          Choose the type of event to help us create the perfect design
        </p>
      </div>

      {/* Event Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EVENT_TYPES.map((option) => (
          <Card
            key={option.type}
            className={`
              cursor-pointer
              transition-all
              duration-200
              hover:border-primary
              hover:shadow-lg
              ${eventType === option.type ? 'border-primary ring-2 ring-primary' : 'border-border'}
            `}
            onClick={() => handleSelectEventType(option.type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectEventType(option.type);
              }
            }}
            aria-pressed={eventType === option.type}
          >
            <CardHeader className="text-center pb-3">
              {/* Emoji Icon */}
              <div className="text-5xl mb-2" aria-hidden="true">
                {option.emoji}
              </div>

              {/* Title */}
              <CardTitle className="text-xl">{option.title}</CardTitle>
            </CardHeader>

            <CardContent className="text-center">
              {/* Description */}
              <CardDescription className="text-sm leading-relaxed">
                {option.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Helper Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Don't worry, you can change this later</p>
      </div>
    </div>
  );
}
