/**
 * Design Wizard Store
 *
 * Zustand store for managing the AI-first design wizard state.
 * This store orchestrates the 3-step design creation flow:
 * 1. Event Type Selection
 * 2. Event Details
 * 3. AI Chat Interface (Design Generation)
 *
 * After design selection, users are directed to /products to browse
 * and add items to cart. The wizard supports a return-to-product flow
 * when users create designs from a product detail page.
 *
 * @module lib/store/design-wizard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Event Types
 *
 * Categories of events/purposes for custom merchandise.
 * Used in Step 1 to contextualize the design generation and product recommendations.
 */
export type EventType =
  | 'charity'        // Charity events, fundraisers, non-profits
  | 'sports'         // Sports teams, tournaments, leagues
  | 'company'        // Corporate events, team building, branded merchandise
  | 'family'         // Family reunions, gatherings
  | 'school'         // Schools, universities, graduation
  | 'other';         // Other events/occasions

/**
 * Event Details
 *
 * Dynamic details about the event/occasion.
 * Fields vary based on event type to gather relevant information.
 */
export interface EventDetails {
  // Common fields
  name?: string;              // Event/organization/team name
  description?: string;       // Brief description

  // Charity-specific
  cause?: string;             // Charity focus (health, education, etc.)
  eventType?: string;         // fundraiser, awareness, gala, etc.

  // Sports-specific
  sport?: string;             // Type of sport
  ageGroup?: string;          // youth, adult, senior
  teamLevel?: string;         // recreational, competitive, professional

  // Company-specific
  industry?: string;          // Business industry
  companyEventType?: string;  // conference, team building, etc.

  // Family-specific
  familyName?: string;        // Family surname
  theme?: string;             // Reunion theme
  year?: string;              // Event year/occasion
  location?: string;          // Event location

  // School-specific
  gradeLevel?: string;        // Grade level/department
  schoolEventType?: string;   // graduation, spirit wear, club, etc.

  // Common across all
  targetAudience?: string;    // Who will use/wear these items
  tone?: string;              // Style preference (professional, casual, fun, etc.)
  colors?: string[];          // Preferred colors (if any)
}

/**
 * Brand Assets
 *
 * Optional brand materials provided by the user to inform AI design generation.
 * These assets help maintain brand consistency and identity.
 */
export interface BrandAssets {
  /**
   * Uploaded logo URLs (from Supabase Storage)
   * Array to support multiple logo variations (primary, secondary, etc.)
   */
  logos: string[];

  /**
   * Brand colors in hex format
   * Used to maintain brand color consistency in generated designs
   * @example ['#FF5733', '#3498DB', '#2ECC71']
   */
  colors: string[];

  /**
   * Brand fonts
   * Font names or Google Fonts URLs to use in designs
   * @example ['Roboto', 'Open Sans', 'Montserrat']
   */
  fonts: string[];

  /**
   * Brand voice/tone
   * Description of brand personality to guide AI text generation
   * @example 'Professional and authoritative' or 'Fun and playful'
   */
  voice: string;
}

/**
 * Generated Design
 *
 * Represents a single AI-generated design from DALL-E 3.
 * Includes metadata for tracking and selection.
 */
export interface GeneratedDesign {
  /**
   * Unique identifier for this design
   * Generated on creation for tracking purposes
   */
  id: string;

  /**
   * Public URL of the generated image
   * DALL-E 3 image URL or Supabase Storage URL after upload
   */
  imageUrl: string;

  /**
   * User prompt that generated this design
   * Stored for iteration and refinement
   */
  prompt: string;

  /**
   * Timestamp when design was generated
   */
  createdAt: Date;

  /**
   * Whether this design has been favorited by the user
   * For quick access to preferred designs
   */
  isFavorite?: boolean;
}

/**
 * Question Answer
 *
 * Represents a user's answer to a design clarification question.
 * Used in the interactive question flow to gather design preferences.
 */
export interface QuestionAnswer {
  /**
   * Unique identifier for the question
   * Used to track which question was answered
   */
  questionId: string;

  /**
   * The question text that was asked
   */
  question: string;

  /**
   * User's answer to the question
   * Can be a single value (string) or multiple values (string[]) for multi-select questions
   */
  answer: string | string[];

  /**
   * Timestamp when the question was answered
   */
  answeredAt: Date;
}

/**
 * Design Feedback
 *
 * User feedback on generated designs for iteration.
 * Collected through multi-select chips to minimize typing.
 */
export interface DesignFeedback {
  /**
   * Aspects the user liked about the designs
   * @example ['colors', 'style', 'composition']
   */
  likes: string[];

  /**
   * Aspects the user disliked about the designs
   * @example ['complexity', 'imagery']
   */
  dislikes: string[];

  /**
   * Optional additional notes from the user
   * Rarely used - preference is for chip-based feedback
   */
  additionalNotes?: string;
}

/**
 * Wizard Steps
 *
 * Enumeration of the three steps in the streamlined design wizard flow.
 * After completing the wizard, users are directed to /products to browse
 * and apply their design to products.
 */
export enum WizardStep {
  EventType = 1,      // Step 1: Select event type/purpose
  EventDetails = 2,   // Step 2: Provide event details
  AiChat = 3,         // Step 3: AI chat interface for design generation
}

/**
 * Design Wizard State
 *
 * Complete state shape for the design wizard.
 * Manages the entire user journey through the AI-first design flow.
 */
export interface DesignWizardState {
  // ============================================================================
  // Navigation State
  // ============================================================================

  /**
   * Current active step in the wizard
   * 1 = Event Type, 2 = Event Details, 3 = AI Chat
   */
  currentStep: WizardStep;

  /**
   * Whether the wizard has been completed
   * Set to true when user selects final design
   */
  isComplete: boolean;

  /**
   * Product ID to return to after wizard completion
   * Set when user navigates to wizard from a product detail page
   * Used to redirect back to that product after design selection
   * @default null
   */
  returnToProductId: string | null;

  // ============================================================================
  // Step 1: Event Type Selection
  // ============================================================================

  /**
   * Selected event type
   * Helps contextualize AI design generation and product recommendations
   * @default null
   */
  eventType: EventType | null;

  // ============================================================================
  // Step 2: Event Details
  // ============================================================================

  /**
   * Event-specific details gathered from user
   * Dynamic based on selected event type
   * @default {}
   */
  eventDetails: EventDetails;

  // ============================================================================
  // Step 3: AI Chat & Design Generation
  // ============================================================================

  /**
   * User's brand assets for design consistency (optional - collapsible in Step 3)
   * All fields are optional
   * @default { logos: [], colors: [], fonts: [], voice: '' }
   */
  brandAssets: BrandAssets;

  /**
   * Interactive question flow state
   * Answers to clarifying questions about design preferences
   * @default []
   */
  questionAnswers: QuestionAnswer[];

  /**
   * Current question index in the guided flow
   * Tracks progress through the question sequence
   * @default 0
   */
  currentQuestionIndex: number;

  /**
   * Total number of questions in the flow
   * Includes both fixed questions and AI-generated follow-ups
   * @default 0
   */
  totalQuestions: number;

  /**
   * Design variety level chosen by user
   * Determines whether to generate variations or different concepts
   * @default null
   */
  designVarietyLevel: 'variations' | 'different-concepts' | null;

  /**
   * User feedback on generated designs
   * Collected for iteration and refinement
   * @default null
   */
  designFeedback: DesignFeedback | null;

  /**
   * Array of designs generated by DALL-E 3
   * Stores all generated variations for user selection
   */
  generatedDesigns: GeneratedDesign[];

  /**
   * Currently selected design for preview/editing
   * References a design from generatedDesigns array
   */
  selectedDesignId: string | null;

  /**
   * Final design chosen by user to show on products
   * Set when user saves design and moves to product selection
   */
  finalDesignUrl: string | null;

  /**
   * Database Design record ID (real UUID)
   * Set after design is saved to database
   */
  savedDesignId: string | null;

  /**
   * Print-ready design URL (optimized, upscaled, 300 DPI)
   * Set after design preparation completes
   */
  printReadyUrl: string | null;

  /**
   * Design preparation status
   * Tracks the progress of saving and preparing the design
   */
  preparationStatus: 'idle' | 'saving' | 'preparing' | 'completed' | 'failed';

  /**
   * Preparation error message (if failed)
   * Stores error details when preparation fails
   */
  preparationError: string | null;

  // ============================================================================
  // Step 4: Product Selection
  // ============================================================================

  /**
   * Array of recommended product IDs based on event type and details
   * Auto-populated when user reaches this step
   * @example ['tshirt-id-1', 'hoodie-id-2']
   */
  recommendedProducts: string[];

  /**
   * Array of product IDs selected by the user
   * User can select multiple products to create designs for
   * @example ['tshirt-id-1', 'hoodie-id-2']
   */
  selectedProducts: string[];

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  /**
   * Navigate to the next step in the wizard
   * Validates current step before proceeding
   */
  nextStep: () => void;

  /**
   * Navigate to the previous step in the wizard
   * Allows user to go back and modify selections
   */
  previousStep: () => void;

  /**
   * Jump to a specific step in the wizard
   * @param step - The step number to navigate to (1-3)
   */
  goToStep: (step: WizardStep) => void;

  /**
   * Reset the wizard to initial state
   * Clears all selections and returns to step 1
   */
  resetWizard: () => void;

  /**
   * Set the product ID to return to after wizard completion
   * @param productId - The product ID to return to, or null to clear
   */
  setReturnToProductId: (productId: string | null) => void;

  /**
   * Complete the design wizard
   * Called when user selects their final design in step 3
   * Marks wizard as complete and prepares for navigation to products
   */
  completeDesignWizard: () => void;

  // ============================================================================
  // Step 1 Actions: Event Type
  // ============================================================================

  /**
   * Set the event type for the design
   * @param eventType - The selected event type
   */
  setEventType: (eventType: EventType) => void;

  // ============================================================================
  // Step 2 Actions: Event Details
  // ============================================================================

  /**
   * Set all event details at once
   * @param details - Complete event details object
   */
  setEventDetails: (details: EventDetails) => void;

  /**
   * Update a single field in event details
   * @param field - The field to update
   * @param value - The new value
   */
  updateEventDetail: <K extends keyof EventDetails>(field: K, value: EventDetails[K]) => void;

  // ============================================================================
  // Step 3 Actions: Brand Assets (Optional in AI Chat)
  // ============================================================================

  /**
   * Set all brand assets at once
   * @param assets - Complete brand assets object
   */
  setBrandAssets: (assets: BrandAssets) => void;

  /**
   * Add a logo URL to brand assets
   * @param logoUrl - Public URL of uploaded logo
   */
  addLogo: (logoUrl: string) => void;

  /**
   * Remove a logo from brand assets
   * @param logoUrl - Logo URL to remove
   */
  removeLogo: (logoUrl: string) => void;

  /**
   * Add a color to brand assets
   * @param color - Hex color code
   */
  addColor: (color: string) => void;

  /**
   * Remove a color from brand assets
   * @param color - Hex color code to remove
   */
  removeColor: (color: string) => void;

  /**
   * Set all brand colors at once
   * @param colors - Array of hex color codes
   */
  setColors: (colors: string[]) => void;

  /**
   * Set brand fonts
   * @param fonts - Array of font names
   */
  setFonts: (fonts: string[]) => void;

  /**
   * Set brand voice/tone
   * @param voice - Brand voice description
   */
  setVoice: (voice: string) => void;

  // ============================================================================
  // Step 3 Actions: Interactive Question Flow
  // ============================================================================

  /**
   * Add a user's answer to a question
   * @param answer - Question answer object
   */
  addQuestionAnswer: (answer: QuestionAnswer) => void;

  /**
   * Set the current question index
   * @param index - Index of the current question
   */
  setCurrentQuestionIndex: (index: number) => void;

  /**
   * Set the total number of questions
   * @param total - Total questions in the flow
   */
  setTotalQuestions: (total: number) => void;

  /**
   * Set the design variety level
   * @param level - Variety level choice
   */
  setDesignVarietyLevel: (level: 'variations' | 'different-concepts') => void;

  /**
   * Set design feedback for iteration
   * @param feedback - User feedback object
   */
  setDesignFeedback: (feedback: DesignFeedback) => void;

  /**
   * Reset the question flow state
   * Clears all answers and resets indices
   */
  resetQuestionFlow: () => void;

  // ============================================================================
  // Step 3 Actions: AI Design Generation
  // ============================================================================

  /**
   * Add a newly generated design to the collection
   * @param design - Generated design object
   */
  addGeneratedDesign: (design: GeneratedDesign) => void;

  /**
   * Select a design for preview
   * @param designId - ID of the design to select
   */
  selectDesign: (designId: string) => void;

  /**
   * Toggle favorite status of a design
   * @param designId - ID of the design to toggle
   */
  toggleFavorite: (designId: string) => void;

  /**
   * Remove a design from the collection
   * @param designId - ID of the design to remove
   */
  removeDesign: (designId: string) => void;

  /**
   * Set the final design to apply to canvas
   * @param imageUrl - Public URL of the final design
   */
  setFinalDesign: (imageUrl: string) => void;

  /**
   * Set the saved design database ID
   * @param id - UUID of the saved Design record
   */
  setSavedDesignId: (id: string | null) => void;

  /**
   * Set the print-ready design URL
   * @param url - Public URL of the print-ready design
   */
  setPrintReadyUrl: (url: string | null) => void;

  /**
   * Set the preparation status
   * @param status - Current preparation status
   */
  setPreparationStatus: (status: DesignWizardState['preparationStatus']) => void;

  /**
   * Set the preparation error message
   * @param error - Error message or null to clear
   */
  setPreparationError: (error: string | null) => void;

  // ============================================================================
  // Step 4 Actions: Product Recommendations
  // ============================================================================

  /**
   * Set recommended products based on event type and details
   * @param products - Array of recommended product IDs
   */
  setRecommendedProducts: (products: string[]) => void;

  /**
   * Toggle product selection (add if not selected, remove if already selected)
   * @param productId - Product ID to toggle
   */
  toggleProduct: (productId: string) => void;

  // ============================================================================
  // Utility Actions
  // ============================================================================

  /**
   * Reset the entire wizard to initial state
   * Clears all selections and generated designs
   */
  reset: () => void;

  /**
   * Mark the wizard as complete
   * Called when user finishes the canvas step
   */
  complete: () => void;
}

/**
 * Initial State
 *
 * Default values for the wizard state.
 * Used when creating a new design or resetting the wizard.
 */
const initialState = {
  currentStep: WizardStep.EventType,
  isComplete: false,
  returnToProductId: null,
  eventType: null,
  eventDetails: {},
  brandAssets: {
    logos: [],
    colors: [],
    fonts: [],
    voice: '',
  },
  questionAnswers: [],
  currentQuestionIndex: 0,
  totalQuestions: 0,
  designVarietyLevel: null,
  designFeedback: null,
  generatedDesigns: [],
  selectedDesignId: null,
  finalDesignUrl: null,
  savedDesignId: null,
  printReadyUrl: null,
  preparationStatus: 'idle' as const,
  preparationError: null,
  recommendedProducts: [],
  selectedProducts: [],
};

/**
 * Design Wizard Store
 *
 * Zustand store with devtools and persistence middleware.
 * Persists wizard state to localStorage for session recovery.
 *
 * @example
 * ```tsx
 * import { useDesignWizard } from '@/lib/store/design-wizard';
 *
 * function MyComponent() {
 *   const { currentStep, eventType, setEventType, nextStep } = useDesignWizard();
 *
 *   return (
 *     <button onClick={() => {
 *       setEventType('charity');
 *       nextStep();
 *     }}>
 *       Select Charity Event
 *     </button>
 *   );
 * }
 * ```
 */
export const useDesignWizard = create<DesignWizardState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================================================
        // Navigation Actions
        // ========================================================================

        nextStep: () => {
          const { currentStep } = get();
          console.log('[Design Wizard Store] nextStep called, currentStep:', currentStep);
          if (currentStep < WizardStep.AiChat) {
            const newStep = currentStep + 1;
            set({ currentStep: newStep });
            console.log('[Design Wizard Store] Moved to step:', newStep);
          } else {
            console.log('[Design Wizard Store] Already at final step (AiChat), cannot proceed');
          }
        },

        previousStep: () => {
          const { currentStep } = get();
          if (currentStep > WizardStep.EventType) {
            set({ currentStep: currentStep - 1 });
          }
        },

        goToStep: (step: WizardStep) => {
          console.log('[Design Wizard Store] goToStep called with step:', step);
          set({ currentStep: step });
          console.log('[Design Wizard Store] currentStep set to:', step);
        },

        /**
         * Reset Wizard
         *
         * Clears all wizard state and returns to step 1.
         * Used for "Start Over" functionality.
         */
        resetWizard: () => {
          console.log('[DesignWizard] Resetting wizard to initial state');

          set({
            // Reset navigation
            currentStep: WizardStep.EventType,
            isComplete: false,

            // Clear event selection
            eventType: null,
            eventDetails: {},

            // Clear brand assets
            brandAssets: {
              logos: [],
              colors: [],
              fonts: [],
              voice: '',
            },

            // Clear questions & answers
            questionAnswers: [],
            currentQuestionIndex: 0,
            totalQuestions: 0,

            // Clear design variety and feedback
            designVarietyLevel: null,
            designFeedback: null,

            // Clear AI designs
            generatedDesigns: [],
            selectedDesignId: null,
            finalDesignUrl: null,

            // Clear design preparation
            savedDesignId: null,
            printReadyUrl: null,
            preparationStatus: 'idle' as const,
            preparationError: null,

            // Clear product selection
            recommendedProducts: [],
            selectedProducts: [],

            // Clear return to product
            returnToProductId: null,
          });
        },

        /**
         * Set Return To Product ID
         *
         * Sets the product ID to navigate back to after wizard completion.
         * Used when user starts wizard from a product detail page.
         */
        setReturnToProductId: (productId: string | null) => {
          console.log('[DesignWizard] Setting returnToProductId:', productId);
          set({ returnToProductId: productId });
        },

        /**
         * Complete Design Wizard
         *
         * Called when user selects their final design and is ready to apply it.
         * Marks the wizard as complete and logs the completion.
         */
        completeDesignWizard: () => {
          const { finalDesignUrl, returnToProductId } = get();
          console.log('[DesignWizard] Completing wizard', {
            hasFinalDesign: !!finalDesignUrl,
            returnToProductId,
          });
          set({ isComplete: true });
        },

        // ========================================================================
        // Step 1 Actions: Event Type
        // ========================================================================

        setEventType: (eventType: EventType) => {
          const { eventType: currentEventType } = get();

          // Only clear eventDetails if event type actually changed
          if (currentEventType !== eventType) {
            set({
              eventType,
              eventDetails: {}, // Clear old details for new event type
            });
          } else {
            // Same event type - preserve existing details
            set({ eventType });
          }
        },

        // ========================================================================
        // Step 2 Actions: Event Details
        // ========================================================================

        setEventDetails: (details: EventDetails) => {
          set({ eventDetails: details });
        },

        updateEventDetail: <K extends keyof EventDetails>(field: K, value: EventDetails[K]) => {
          const { eventDetails } = get();
          set({
            eventDetails: {
              ...eventDetails,
              [field]: value,
            },
          });
        },

        // ========================================================================
        // Step 3 Actions: Brand Assets (Optional in AI Chat)
        // ========================================================================

        setBrandAssets: (assets: BrandAssets) => {
          set({ brandAssets: assets });
        },

        addLogo: (logoUrl: string) => {
          const { brandAssets } = get();
          set({
            brandAssets: {
              ...brandAssets,
              logos: [...brandAssets.logos, logoUrl],
            },
          });
        },

        removeLogo: (logoUrl: string) => {
          const { brandAssets } = get();
          set({
            brandAssets: {
              ...brandAssets,
              logos: brandAssets.logos.filter(url => url !== logoUrl),
            },
          });
        },

        addColor: (color: string) => {
          const { brandAssets } = get();
          if (!brandAssets.colors.includes(color)) {
            set({
              brandAssets: {
                ...brandAssets,
                colors: [...brandAssets.colors, color],
              },
            });
          }
        },

        removeColor: (color: string) => {
          const { brandAssets } = get();
          set({
            brandAssets: {
              ...brandAssets,
              colors: brandAssets.colors.filter(c => c !== color),
            },
          });
        },

        setColors: (colors: string[]) => {
          const { brandAssets } = get();
          set({
            brandAssets: {
              ...brandAssets,
              colors,
            },
          });
        },

        setFonts: (fonts: string[]) => {
          const { brandAssets } = get();
          set({
            brandAssets: {
              ...brandAssets,
              fonts,
            },
          });
        },

        setVoice: (voice: string) => {
          const { brandAssets } = get();
          set({
            brandAssets: {
              ...brandAssets,
              voice,
            },
          });
        },

        // ========================================================================
        // Step 3 Actions: Interactive Question Flow
        // ========================================================================

        addQuestionAnswer: (answer: QuestionAnswer) => {
          const { questionAnswers } = get();
          set({
            questionAnswers: [...questionAnswers, answer],
          });
        },

        setCurrentQuestionIndex: (index: number) => {
          set({ currentQuestionIndex: index });
        },

        setTotalQuestions: (total: number) => {
          set({ totalQuestions: total });
        },

        setDesignVarietyLevel: (level: 'variations' | 'different-concepts') => {
          set({ designVarietyLevel: level });
        },

        setDesignFeedback: (feedback: DesignFeedback) => {
          set({ designFeedback: feedback });
        },

        resetQuestionFlow: () => {
          set({
            questionAnswers: [],
            currentQuestionIndex: 0,
            totalQuestions: 0,
            designVarietyLevel: null,
            designFeedback: null,
          });
        },

        // ========================================================================
        // Step 3 Actions: AI Design Generation
        // ========================================================================

        addGeneratedDesign: (design: GeneratedDesign) => {
          const { generatedDesigns } = get();
          set({
            generatedDesigns: [...generatedDesigns, design],
            selectedDesignId: design.id, // Auto-select newly generated design
          });
        },

        selectDesign: (designId: string) => {
          set({ selectedDesignId: designId });
        },

        toggleFavorite: (designId: string) => {
          const { generatedDesigns } = get();
          set({
            generatedDesigns: generatedDesigns.map(design =>
              design.id === designId
                ? { ...design, isFavorite: !design.isFavorite }
                : design
            ),
          });
        },

        removeDesign: (designId: string) => {
          const { generatedDesigns, selectedDesignId } = get();
          const newDesigns = generatedDesigns.filter(d => d.id !== designId);

          set({
            generatedDesigns: newDesigns,
            // If we removed the selected design, clear selection
            selectedDesignId: selectedDesignId === designId ? null : selectedDesignId,
          });
        },

        setFinalDesign: (imageUrl: string) => {
          set({ finalDesignUrl: imageUrl });
        },

        setSavedDesignId: (id: string | null) => {
          set({ savedDesignId: id });
        },

        setPrintReadyUrl: (url: string | null) => {
          set({ printReadyUrl: url });
        },

        setPreparationStatus: (status: DesignWizardState['preparationStatus']) => {
          set({ preparationStatus: status });
        },

        setPreparationError: (error: string | null) => {
          set({ preparationError: error });
        },

        // ========================================================================
        // Step 4 Actions: Product Recommendations
        // ========================================================================

        setRecommendedProducts: (products: string[]) => {
          set({ recommendedProducts: products });
        },

        toggleProduct: (productId: string) => {
          const { selectedProducts } = get();
          if (selectedProducts.includes(productId)) {
            // Remove if already selected
            set({ selectedProducts: selectedProducts.filter(id => id !== productId) });
          } else {
            // Add if not selected
            set({ selectedProducts: [...selectedProducts, productId] });
          }
        },

        // ========================================================================
        // Utility Actions
        // ========================================================================

        reset: () => {
          set(initialState);
        },

        complete: () => {
          set({ isComplete: true });
        },
      }),
      {
        name: 'design-wizard-storage', // localStorage key
        // Custom storage with error handling for quota exceeded errors
        storage: {
          getItem: (name) => {
            try {
              const str = localStorage.getItem(name);
              return str ? JSON.parse(str) : null;
            } catch (error) {
              console.error('[DesignWizard] Failed to read from localStorage:', error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              // Quota exceeded - log warning but don't crash
              console.warn('[DesignWizard] Failed to persist to localStorage (quota exceeded):', error);
              // Try to clear and save minimal state
              try {
                localStorage.removeItem(name);
                console.log('[DesignWizard] Cleared storage due to quota error');
              } catch (e) {
                // Ignore cleanup errors
              }
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.error('[DesignWizard] Failed to remove from localStorage:', error);
            }
          },
        },
        // Handle localStorage errors gracefully (quota exceeded, corrupted data)
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('[DesignWizard] Failed to rehydrate from localStorage:', error);
            // Clear corrupted storage
            try {
              localStorage.removeItem('design-wizard-storage');
              console.log('[DesignWizard] Cleared corrupted storage');
            } catch (e) {
              console.error('[DesignWizard] Failed to clear storage:', e);
            }
          }
        },
        // Type assertion needed because Zustand v5 typing expects full state
        // but partialize intentionally returns only the fields we want to persist
        partialize: (state) => {
          // Filter out base64 data URLs from generatedDesigns to prevent localStorage quota errors
          // Base64 images from AI generation can be 1-5MB each, exceeding localStorage limits
          // HTTP URLs (from Supabase Storage after save) are safe to persist
          const isHttpUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');

          const persistableDesigns = state.generatedDesigns.filter(
            design => isHttpUrl(design.imageUrl)
          );

          // Only persist finalDesignUrl if it's an HTTP URL (not base64)
          const persistableFinalDesignUrl = state.finalDesignUrl && isHttpUrl(state.finalDesignUrl)
            ? state.finalDesignUrl
            : null;

          return {
            // Only persist essential state, exclude UI-specific state
            currentStep: state.currentStep,
            returnToProductId: state.returnToProductId,
            eventType: state.eventType,
            eventDetails: state.eventDetails,
            brandAssets: state.brandAssets,
            questionAnswers: state.questionAnswers,
            currentQuestionIndex: state.currentQuestionIndex,
            totalQuestions: state.totalQuestions,
            designVarietyLevel: state.designVarietyLevel,
            designFeedback: state.designFeedback,
            // Only persist designs with HTTP URLs (not base64 data URLs)
            generatedDesigns: persistableDesigns,
            selectedDesignId: persistableDesigns.length > 0 ? state.selectedDesignId : null,
            finalDesignUrl: persistableFinalDesignUrl,
            savedDesignId: state.savedDesignId,
            printReadyUrl: state.printReadyUrl,
            preparationStatus: state.preparationStatus,
            preparationError: state.preparationError,
            recommendedProducts: state.recommendedProducts,
            selectedProducts: state.selectedProducts,
          } as DesignWizardState;
        },
      }
    ),
    {
      name: 'DesignWizard', // DevTools name
    }
  )
);

/**
 * Get wizard design data for cart items
 *
 * Retrieves the design information from wizard state for use in cart items.
 * Returns real Design ID + print-ready URL (or fallback to original).
 *
 * @param state - Current wizard state
 * @returns Design data object or null if no design is saved
 *
 * @example
 * ```tsx
 * const designData = getWizardDesignData(useDesignWizard.getState());
 * if (designData) {
 *   addItem({ ...item, design: designData });
 * }
 * ```
 */
export function getWizardDesignData(state: DesignWizardState): {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  printReadyUrl: string;
} | null {
  const { savedDesignId, finalDesignUrl, printReadyUrl } = state;

  if (!savedDesignId || !finalDesignUrl) return null;

  return {
    id: savedDesignId,
    imageUrl: finalDesignUrl,
    thumbnailUrl: finalDesignUrl,
    printReadyUrl: printReadyUrl || finalDesignUrl, // Fallback to original if not prepared
  };
}
