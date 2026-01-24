/**
 * Event Details Step
 *
 * Second step in the AI-first design wizard.
 * Users provide event-specific details to inform AI design generation and product recommendations.
 * Form fields are dynamic based on the selected event type from Step 1.
 */

'use client';

import { useState } from 'react';
import { useDesignWizard, type EventType } from '@/lib/store/design-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Trophy,
  Building2,
  Home,
  GraduationCap,
  Sparkles,
  Users,
  Palette,
  ArrowRight,
} from 'lucide-react';

/**
 * Event Details Step Component
 *
 * Renders dynamic form fields based on event type.
 * Validates required fields before allowing progression.
 */
export function EventDetailsStep() {
  const {
    eventType,
    eventDetails,
    updateEventDetail,
    nextStep,
  } = useDesignWizard();

  // Character counter state for Description field
  const [descriptionLength, setDescriptionLength] = useState(0);
  const MAX_DESCRIPTION_LENGTH = 500;

  /**
   * Validate form based on event type
   *
   * All events require a name. Additional required fields vary by type.
   */
  const isFormValid = (): boolean => {
    // Name is always required
    if (!eventDetails.name?.trim()) {
      return false;
    }

    // Event type-specific validation
    switch (eventType) {
      case 'charity':
        // Charity requires cause to inform design recommendations
        return !!eventDetails.cause?.trim();

      case 'sports':
        // Sports requires sport name for product recommendations
        return !!eventDetails.sport?.trim();

      case 'company':
        // Company requires industry for appropriate tone
        return !!eventDetails.industry?.trim();

      case 'family':
        // Family requires family name or year for design personalization
        return !!(eventDetails.familyName?.trim() || eventDetails.year?.trim());

      case 'school':
        // School requires grade level for audience-appropriate products
        return !!eventDetails.gradeLevel?.trim();

      case 'other':
        // Other only requires name
        return true;

      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (isFormValid()) {
      nextStep();
    }
  };

  if (!eventType) {
    return null; // Should not happen, but guard against it
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Tell us about your event</h2>
        <p className="text-sm text-muted-foreground">
          These details help us recommend the perfect products and create custom designs
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Share some information to personalize your experience
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              {getEventTypeIcon(eventType)}
              {getEventTypeLabel(eventType)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Common Fields - All Event Types */}
          <Separator className="bg-muted-foreground/20 h-[2px]" />

          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Event/Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={getNamePlaceholder(eventType)}
              value={eventDetails.name || ''}
              onChange={(e) => updateEventDetail('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Brief Description
            </Label>
            <Textarea
              id="description"
              placeholder="Tell us more about your event..."
              value={eventDetails.description || ''}
              onChange={(e) => {
                updateEventDetail('description', e.target.value);
                setDescriptionLength(e.target.value.length);
              }}
              rows={2}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right">
              {descriptionLength}/{MAX_DESCRIPTION_LENGTH} characters
            </p>
          </div>

          <Separator className="my-6" />

          {/* Event-Specific Section with subtle background */}
          {(eventType === 'charity' || eventType === 'sports' || eventType === 'company' || eventType === 'family' || eventType === 'school') && (
            <div className="rounded-lg bg-muted/30 p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                {getEventTypeIcon(eventType)}
                <span>{getEventTypeLabel(eventType)} Details</span>
              </div>

              {eventType === 'charity' && <CharityFields />}
              {eventType === 'sports' && <SportsFields />}
              {eventType === 'company' && <CompanyFields />}
              {eventType === 'family' && <FamilyFields />}
              {eventType === 'school' && <SchoolFields />}
            </div>
          )}

          <Separator className="my-6" />

          {/* Optional Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Optional Details</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Who will use/wear these items?
                </Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Adults, kids, all ages"
                  value={eventDetails.targetAudience || ''}
                  onChange={(e) => updateEventDetail('targetAudience', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone" className="flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Desired style/tone
                </Label>
                <Select
                  value={eventDetails.tone || ''}
                  onValueChange={(value) => updateEventDetail('tone', value)}
                >
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="fun">Fun & Playful</SelectItem>
                    <SelectItem value="bold">Bold & Energetic</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleContinue}
              disabled={!isFormValid()}
              className="w-full"
              size="lg"
            >
              Continue to AI Design Chat
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {!isFormValid() && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Please fill in all required fields (*)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Event Type-Specific Field Components
// =============================================================================

/** Charity-specific form fields */
function CharityFields() {
  const { eventDetails, updateEventDetail } = useDesignWizard();

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="cause">Charity Cause/Focus</Label>
        <Input
          id="cause"
          placeholder="e.g., Health, Education, Environment"
          value={eventDetails.cause || ''}
          onChange={(e) => updateEventDetail('cause', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventType">Type of Event</Label>
        <Select
          value={eventDetails.eventType || ''}
          onValueChange={(value) => updateEventDetail('eventType', value)}
        >
          <SelectTrigger id="eventType">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fundraiser">Fundraiser</SelectItem>
            <SelectItem value="awareness">Awareness Campaign</SelectItem>
            <SelectItem value="gala">Gala</SelectItem>
            <SelectItem value="volunteer">Volunteer Event</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Sports-specific form fields */
function SportsFields() {
  const { eventDetails, updateEventDetail } = useDesignWizard();

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="sport">Sport/Activity</Label>
        <Input
          id="sport"
          placeholder="e.g., Soccer, Basketball, Baseball"
          value={eventDetails.sport || ''}
          onChange={(e) => updateEventDetail('sport', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ageGroup">Age Group</Label>
        <Select
          value={eventDetails.ageGroup || ''}
          onValueChange={(value) => updateEventDetail('ageGroup', value)}
        >
          <SelectTrigger id="ageGroup">
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youth">Youth (Under 18)</SelectItem>
            <SelectItem value="adult">Adult (18+)</SelectItem>
            <SelectItem value="senior">Senior (55+)</SelectItem>
            <SelectItem value="mixed">Mixed Ages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="teamLevel">Team Level</Label>
        <Select
          value={eventDetails.teamLevel || ''}
          onValueChange={(value) => updateEventDetail('teamLevel', value)}
        >
          <SelectTrigger id="teamLevel">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recreational">Recreational</SelectItem>
            <SelectItem value="competitive">Competitive</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Company-specific form fields */
function CompanyFields() {
  const { eventDetails, updateEventDetail } = useDesignWizard();

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          placeholder="e.g., Technology, Healthcare, Finance"
          value={eventDetails.industry || ''}
          onChange={(e) => updateEventDetail('industry', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyEventType">Type of Event</Label>
        <Select
          value={eventDetails.companyEventType || ''}
          onValueChange={(value) => updateEventDetail('companyEventType', value)}
        >
          <SelectTrigger id="companyEventType">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conference">Conference</SelectItem>
            <SelectItem value="team-building">Team Building</SelectItem>
            <SelectItem value="branded-merch">Branded Merchandise</SelectItem>
            <SelectItem value="employee-gifts">Employee Gifts</SelectItem>
            <SelectItem value="trade-show">Trade Show</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Family-specific form fields */
function FamilyFields() {
  const { eventDetails, updateEventDetail } = useDesignWizard();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="familyName">Family Surname</Label>
        <Input
          id="familyName"
          placeholder="e.g., Smith, Johnson"
          value={eventDetails.familyName || ''}
          onChange={(e) => updateEventDetail('familyName', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Reunion Theme (if any)</Label>
        <Input
          id="theme"
          placeholder="e.g., Beach Party, 80s Throwback"
          value={eventDetails.theme || ''}
          onChange={(e) => updateEventDetail('theme', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year/Occasion</Label>
          <Input
            id="year"
            placeholder="e.g., 2025, 50th Anniversary"
            value={eventDetails.year || ''}
            onChange={(e) => updateEventDetail('year', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g., Lake Tahoe, Florida"
            value={eventDetails.location || ''}
            onChange={(e) => updateEventDetail('location', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

/** School-specific form fields */
function SchoolFields() {
  const { eventDetails, updateEventDetail } = useDesignWizard();

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="gradeLevel">Grade Level/Department</Label>
        <Input
          id="gradeLevel"
          placeholder="e.g., 5th Grade, Math Department"
          value={eventDetails.gradeLevel || ''}
          onChange={(e) => updateEventDetail('gradeLevel', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolEventType">Type</Label>
        <Select
          value={eventDetails.schoolEventType || ''}
          onValueChange={(value) => updateEventDetail('schoolEventType', value)}
        >
          <SelectTrigger id="schoolEventType">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="graduation">Graduation</SelectItem>
            <SelectItem value="spirit-wear">Spirit Wear</SelectItem>
            <SelectItem value="club">Club/Organization</SelectItem>
            <SelectItem value="sports">School Sports</SelectItem>
            <SelectItem value="field-trip">Field Trip</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/** Get placeholder text for event name based on type */
function getNamePlaceholder(eventType: EventType): string {
  const placeholders: Record<EventType, string> = {
    charity: 'e.g., Hope Foundation Gala',
    sports: 'e.g., Tigers Soccer Team',
    company: 'e.g., TechCorp Annual Conference',
    family: 'e.g., Smith Family Reunion',
    school: 'e.g., Lincoln High Class of 2025',
    other: 'e.g., My Event',
  };

  return placeholders[eventType];
}

/** Get icon for event type */
function getEventTypeIcon(eventType: EventType) {
  const icons = {
    charity: <Heart className="h-3.5 w-3.5" />,
    sports: <Trophy className="h-3.5 w-3.5" />,
    company: <Building2 className="h-3.5 w-3.5" />,
    family: <Home className="h-3.5 w-3.5" />,
    school: <GraduationCap className="h-3.5 w-3.5" />,
    other: <Sparkles className="h-3.5 w-3.5" />,
  };
  return icons[eventType];
}

/** Get display label for event type */
function getEventTypeLabel(eventType: EventType): string {
  const labels = {
    charity: 'Charity',
    sports: 'Sports',
    company: 'Company',
    family: 'Family',
    school: 'School',
    other: 'Other',
  };
  return labels[eventType];
}
