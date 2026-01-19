/**
 * Interactive Question Flow Step (New Chat Step)
 *
 * Replaces the old chat interface with a guided question flow.
 * Implements a state machine that orchestrates:
 * 1. Fixed questions (3 per event type)
 * 2. AI-generated follow-up questions (0-2, enforced 5 question max)
 * 3. Design variety selection
 * 4. Batch design generation (3 designs)
 * 5. Design results gallery
 * 6. Optional feedback and iteration
 */

'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { getFixedQuestions } from '@/lib/ai/question-templates';
import { QuestionContainer } from '@/components/design/questions/question-container';
import { YesNoQuestion } from '@/components/design/questions/yes-no-question';
import { StyleQuestion } from '@/components/design/questions/style-question';
import { MultiSelectQuestion } from '@/components/design/questions/multi-select-question';
import { ColorQuestion } from '@/components/design/questions/color-question';
import { DesignVarietySelector } from '@/components/design/design-variety-selector';
import { DesignResults } from '@/components/design/design-results';
import { DesignFeedbackComponent } from '@/components/design/design-feedback';
import { GeneratingDesignsLoader } from '@/components/design/loading/generating-designs-loader';
import { AIFollowupLoader } from '@/components/design/loading/ai-followup-loader';
import { toast } from 'sonner';
import type { DesignQuestion } from '@/lib/ai/question-templates';

/**
 * Flow States
 *
 * State machine for the question flow progression.
 */
type FlowState =
  | 'questions' // Asking fixed + AI questions
  | 'ai-followup' // Loading AI-generated questions
  | 'variety-selection' // Choosing variety level
  | 'generating' // Generating 3 designs
  | 'results' // Showing 3 designs
  | 'feedback' // Collecting feedback
  | 'regenerating'; // Regenerating with feedback

/**
 * Generated Design Interface
 */
interface GeneratedDesign {
  id: string;
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  metadata?: {
    index: number;
    varietyLevel: 'variations' | 'different-concepts';
    eventType: string;
    generatedAt: string;
  };
}

export function ChatStep() {
  const {
    eventType,
    eventDetails,
    brandAssets,
    questionAnswers,
    currentQuestionIndex,
    totalQuestions,
    designVarietyLevel,
    designFeedback,
    addQuestionAnswer,
    setCurrentQuestionIndex,
    setTotalQuestions,
    setDesignVarietyLevel,
    setDesignFeedback,
    resetQuestionFlow,
    addGeneratedDesign,
    selectDesign,
    setFinalDesign,
    nextStep,
  } = useDesignWizard();

  // Flow state machine
  const [flowState, setFlowState] = useState<FlowState>('questions');
  const [questions, setQuestions] = useState<DesignQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | string[] | undefined>(undefined);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  // Load fixed questions on mount
  useEffect(() => {
    if (!eventType) return;

    const fixedQuestions = getFixedQuestions(eventType);
    setQuestions(fixedQuestions);
    setTotalQuestions(fixedQuestions.length); // Will be updated when AI questions added
  }, [eventType, setTotalQuestions]);

  /**
   * Handle question answer submission
   */
  const handleQuestionAnswer = (answer: string | string[]) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Save answer to store
    addQuestionAnswer({
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer,
      answeredAt: new Date(),
    });

    // Check if more questions remain
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(undefined);
    } else {
      // All questions answered - check if we need AI follow-ups
      const hasAIQuestions = questions.some((q) => q.id.startsWith('follow-up-'));

      if (!hasAIQuestions) {
        // Generate AI follow-ups
        generateAIFollowUps();
      } else {
        // All done, move to variety selection
        setFlowState('variety-selection');
      }
    }
  };

  /**
   * Generate AI follow-up questions
   */
  const generateAIFollowUps = async () => {
    setFlowState('ai-followup');

    try {
      const response = await fetch('/api/ai/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          eventDetails,
          fixedAnswers: questionAnswers,
          brandAssets,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate follow-up questions');
      }

      const data = await response.json();
      const followUpQuestions = data.questions || [];

      console.log('[Chat Step] AI follow-ups:', followUpQuestions);

      if (followUpQuestions.length > 0) {
        // Enforce maximum of 5 total questions (3 fixed + 2 AI max)
        const maxFollowUps = Math.min(followUpQuestions.length, 5 - questions.length);
        const limitedFollowUps = followUpQuestions.slice(0, maxFollowUps);

        console.log('[Chat Step] Adding', limitedFollowUps.length, 'follow-up questions (enforcing 5 question limit)');

        // Add follow-ups to question list
        setQuestions((prev) => [...prev, ...limitedFollowUps]);
        setTotalQuestions(questions.length + limitedFollowUps.length);

        // Resume question flow
        setFlowState('questions');
      } else {
        // No follow-ups generated, skip to variety selection
        console.log('[Chat Step] No follow-ups generated, proceeding to variety selection');
        setFlowState('variety-selection');
      }
    } catch (error) {
      console.error('[Chat Step] Error generating follow-ups:', error);
      toast.error('Failed to generate follow-up questions');

      // Continue anyway
      setFlowState('variety-selection');
    }
  };

  /**
   * Handle variety level selection and start generation
   */
  const handleVarietySelected = async (level: 'variations' | 'different-concepts') => {
    setDesignVarietyLevel(level);
    setFlowState('generating');

    try {
      const response = await fetch('/api/generate-designs-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: questionAnswers,
          eventType,
          eventDetails,
          brandAssets,
          varietyLevel: level,
          count: 3,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate designs');
      }

      const data = await response.json();
      const designs = data.designs || [];

      console.log('[Chat Step] Generated designs:', designs);

      if (designs.length === 0) {
        throw new Error('No designs generated');
      }

      setGeneratedDesigns(designs);
      setFlowState('results');
      toast.success(`${designs.length} designs generated!`);
    } catch (error) {
      console.error('[Chat Step] Error generating designs:', error);
      toast.error('Failed to generate designs');
      setFlowState('variety-selection'); // Go back
    }
  };

  /**
   * Handle design selection
   */
  const handleDesignSelect = (designId: string) => {
    setSelectedDesignId(designId);
  };

  /**
   * Handle "Continue" from results
   */
  const handleContinueFromResults = () => {
    if (!selectedDesignId) return;

    const selectedDesign = generatedDesigns.find((d) => d.id === selectedDesignId);
    if (!selectedDesign) return;

    // Save to wizard store
    addGeneratedDesign({
      id: selectedDesign.id,
      imageUrl: selectedDesign.imageUrl,
      prompt: selectedDesign.prompt,
      createdAt: new Date(),
      isFavorite: true,
    });

    selectDesign(selectedDesign.id);
    setFinalDesign(selectedDesign.imageUrl);

    // Move to next wizard step (Product Selection)
    nextStep();
  };

  /**
   * Handle "Regenerate All" from results
   */
  const handleRegenerateAll = () => {
    if (!designVarietyLevel) return;
    handleVarietySelected(designVarietyLevel);
  };

  /**
   * Handle feedback submission
   */
  const handleFeedbackSubmit = async (feedback: NonNullable<typeof designFeedback>) => {
    setDesignFeedback(feedback);
    setFlowState('regenerating');

    // TODO: Build iteration prompt with feedback
    // For now, just regenerate with same variety level
    try {
      const response = await fetch('/api/generate-designs-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: questionAnswers,
          eventType,
          eventDetails,
          brandAssets,
          varietyLevel: designVarietyLevel,
          count: 3,
          feedback, // Include feedback in request
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate designs');
      }

      const data = await response.json();
      const designs = data.designs || [];

      setGeneratedDesigns(designs);
      setFlowState('results');
      toast.success('Designs regenerated with your feedback!');
    } catch (error) {
      console.error('[Chat Step] Error regenerating designs:', error);
      toast.error('Failed to regenerate designs');
      setFlowState('feedback');
    }
  };

  /**
   * Handle "Continue" from feedback (skip iteration)
   */
  const handleSkipFeedback = () => {
    setFlowState('results');
  };

  /**
   * Render question input based on type
   */
  const renderQuestionInput = (question: DesignQuestion) => {
    switch (question.type) {
      case 'yes-no':
        return (
          <YesNoQuestion
            options={question.options || []}
            value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
            onChange={(value) => setCurrentAnswer(value)}
          />
        );

      case 'style':
        return (
          <StyleQuestion
            options={question.options || []}
            value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
            onChange={(value) => setCurrentAnswer(value)}
          />
        );

      case 'multi-select':
        return (
          <MultiSelectQuestion
            options={question.options || []}
            value={Array.isArray(currentAnswer) ? currentAnswer : []}
            onChange={(values) => setCurrentAnswer(values)}
            maxSelections={question.maxSelections || 3}
          />
        );

      case 'color':
        return (
          <ColorQuestion
            options={question.options || []}
            value={Array.isArray(currentAnswer) ? currentAnswer : []}
            onChange={(values) => setCurrentAnswer(values)}
            maxSelections={question.maxSelections || 3}
          />
        );

      default:
        return <p className="text-muted-foreground">Unknown question type</p>;
    }
  };

  // Render appropriate UI based on flow state
  return (
    <AnimatePresence mode="wait">
      {flowState === 'questions' && questions.length > 0 && (
        <QuestionContainer
          question={questions[currentQuestionIndex]}
          currentIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          onAnswer={() => handleQuestionAnswer(currentAnswer!)}
          onBack={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : undefined}
          currentAnswer={currentAnswer}
          disableContinue={!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
        >
          {renderQuestionInput(questions[currentQuestionIndex])}
        </QuestionContainer>
      )}

      {flowState === 'ai-followup' && <AIFollowupLoader />}

      {flowState === 'variety-selection' && (
        <DesignVarietySelector
          onSelect={handleVarietySelected}
          onBack={() => setFlowState('questions')}
          loading={false}
        />
      )}

      {flowState === 'generating' && <GeneratingDesignsLoader count={3} estimatedTime={20} />}

      {flowState === 'results' && (
        <DesignResults
          designs={generatedDesigns}
          onSelect={handleDesignSelect}
          onRegenerateAll={handleRegenerateAll}
          onContinue={handleContinueFromResults}
          selectedDesignId={selectedDesignId}
          loading={false}
        />
      )}

      {flowState === 'feedback' && (
        <DesignFeedbackComponent
          designs={generatedDesigns}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleSkipFeedback}
          loading={false}
        />
      )}

      {flowState === 'regenerating' && <GeneratingDesignsLoader count={3} estimatedTime={20} />}
    </AnimatePresence>
  );
}
