/**
 * Brief Composer Step
 *
 * Single screen for project setup: free-text brief is the hero, event type
 * and audience are optional inline pills, style preset lives below the fold
 * but on the same page. Generate hands off to ChatStep, which lands directly
 * on the variety/generate confirmation.
 */

'use client';

import { useState } from 'react';
import { useDesignWizard, type EventType } from '@/lib/store/design-wizard';
import { StylePresetPicker } from '@/components/design/style-preset-picker';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Wand2 } from 'lucide-react';

const EVENT_TYPE_OPTIONS: { value: EventType; label: string; emoji: string }[] = [
  { value: 'charity', label: 'Charity', emoji: '❤️' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'company', label: 'Company', emoji: '🏢' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { value: 'school', label: 'School', emoji: '🎓' },
  { value: 'other', label: 'Other', emoji: '🎉' },
];

const PLACEHOLDER_BY_TYPE: Record<EventType | 'default', string> = {
  default:
    'Describe your design — the vibe, the event, the audience. The more specific, the better.',
  charity: 'A heartfelt design for the Hope Foundation gala…',
  sports: 'A bold mascot design for the Tigers soccer team…',
  company: 'A clean badge for TechCorp\'s 2026 all-hands conference…',
  family: 'Smith Family Reunion 2026 — beachy, retro, fun for all ages…',
  school: 'Lincoln High Class of 2025 graduation shirt…',
  other: 'A custom design for…',
};

/**
 * Generates an "example brief" the user can drop into the composer with one
 * click. The text should be specific enough to feel real (named subject, vibe
 * adjective, audience hint) and short enough to feel editable rather than
 * intimidating. This sets the bar for what a "good" prompt looks like — users
 * tend to anchor on whatever the surprise-me button gives them.
 */
function getSurpriseMePrompt(
  eventType: EventType | null,
  name?: string,
): string {
  const examples: Record<EventType, string> = {
    charity: `A heartfelt badge for the ${name || 'Hope Foundation'} annual fundraiser — warm, hopeful, designed to be worn proudly by volunteers and donors alike.`,
    sports: `A fierce mascot for the ${name || 'Tigers'} soccer team — bold, energetic, ready to print on jerseys, hoodies, and warmup gear.`,
    company: `A clean conference badge for ${name || 'TechCorp'} — modern, confident, the kind of design employees actually want to keep wearing after the event.`,
    family: `A nostalgic crest for the ${name || 'Smith Family Reunion 2026'} — warm, retro, fun for kids and grandparents on one shared shirt.`,
    school: `A spirit design for ${name || 'Lincoln High Class of 2025'} — proud, school-colored, the kind seniors want to keep long after graduation.`,
    other: `A custom emblem for ${name || 'our crew'} — distinctive, memorable, the kind of design people stop and ask about.`,
  };
  return examples[eventType ?? 'other'];
}

export function BriefComposerStep() {
  const {
    eventType,
    eventDetails,
    selectedPresetId,
    setEventType,
    updateEventDetail,
    setSelectedPresetId,
    nextStep,
  } = useDesignWizard();

  // Local state so the textarea stays snappy; we commit to the store on
  // generate (or on blur, see TODO below).
  const [description, setDescription] = useState(eventDetails.description || '');

  // Minimum bar to fire generation: a short brief + a chosen style.
  // Everything else (type, audience, name) is enrichment, never a gate.
  const canGenerate =
    description.trim().length >= 10 && selectedPresetId !== null;

  const handleSurpriseMe = () => {
    const example = getSurpriseMePrompt(eventType, eventDetails.name);
    if (!example) return;
    setDescription(example);
    updateEventDetail('description', example);
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    updateEventDetail('description', description);
    nextStep();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 pb-24">
      {/* Page header */}
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          What are we designing?
        </h2>
        <p className="text-muted-foreground">
          Describe it in your own words. Add structure only if it helps.
        </p>
      </div>

      {/* Hero: the brief */}
      <div className="space-y-3">
        <label htmlFor="brief" className="text-sm font-medium">
          Describe your design
        </label>
        <Textarea
          id="brief"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => updateEventDetail('description', description)}
          placeholder={PLACEHOLDER_BY_TYPE[eventType ?? 'default']}
          rows={5}
          maxLength={500}
          className="text-base resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSurpriseMe}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Surprise me
          </Button>
          <span className="text-xs text-muted-foreground">
            {description.length}/500
          </span>
        </div>
      </div>

      {/* Optional context — inline pills, never required */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-muted-foreground">This is for</span>
        <Select
          value={eventType ?? ''}
          onValueChange={(v) => setEventType(v as EventType)}
        >
          <SelectTrigger className="h-8 w-auto gap-2 border-dashed">
            <SelectValue placeholder="pick a type (optional)" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="mr-2">{opt.emoji}</span>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground">·</span>

        <span className="text-muted-foreground">Audience</span>
        <Input
          type="text"
          value={eventDetails.targetAudience || ''}
          onChange={(e) => updateEventDetail('targetAudience', e.target.value)}
          placeholder="anyone"
          className="h-8 w-36 border-dashed bg-transparent"
        />

        <span className="text-muted-foreground">·</span>

        <span className="text-muted-foreground">Name</span>
        <Input
          type="text"
          value={eventDetails.name || ''}
          onChange={(e) => updateEventDetail('name', e.target.value)}
          placeholder="optional"
          className="h-8 w-44 border-dashed bg-transparent"
        />
      </div>

      {/* Style picker, inline */}
      <div className="border-t pt-8">
        <StylePresetPicker
          eventType={eventType}
          selectedPresetId={selectedPresetId}
          onChange={setSelectedPresetId}
        />
      </div>

      {/* Sticky CTA — visible even when scrolling through the 12-preset library */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            size="lg"
            className="w-full"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Designs
          </Button>
          {!canGenerate && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {description.trim().length < 10
                ? 'Add a short description (at least 10 characters)'
                : 'Pick a style to continue'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
