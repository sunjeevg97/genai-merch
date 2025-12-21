/**
 * Design Wizard Store
 *
 * Zustand store for managing the AI-first design wizard state.
 * This store orchestrates the multi-step design creation flow:
 * 1. Event Type Selection
 * 2. Product Selection
 * 3. Brand Assets Upload (Optional)
 * 4. AI Chat Interface (Design Generation)
 * 5. Canvas Editor (Final Tweaks)
 *
 * @module lib/store/design-wizard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Event Types
 *
 * Categories of events/purposes for custom merchandise.
 * Used in Step 1 to contextualize the design generation.
 */
export type EventType =
  | 'charity'        // Charity events, fundraisers, non-profits
  | 'fundraiser'     // School fundraisers, team fundraisers
  | 'company'        // Corporate events, team building, branded merchandise
  | 'sports'         // Sports teams, tournaments, leagues
  | 'school'         // Schools, universities, graduation
  | 'personal';      // Personal events, birthdays, weddings

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
 * Wizard Steps
 *
 * Enumeration of the five steps in the design wizard flow.
 */
export enum WizardStep {
  EventType = 1,      // Step 1: Select event type/purpose
  Products = 2,       // Step 2: Select products for merchandise
  BrandAssets = 3,    // Step 3: Upload brand assets (optional)
  AiChat = 4,         // Step 4: AI chat interface for design generation
  Canvas = 5,         // Step 5: Final canvas editor for tweaks
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
   * 1 = Event Type, 2 = Products, 3 = Brand Assets, 4 = AI Chat, 5 = Canvas
   */
  currentStep: WizardStep;

  /**
   * Whether the wizard has been completed
   * Set to true when user reaches the end of the flow
   */
  isComplete: boolean;

  // ============================================================================
  // Step 1: Event Type Selection
  // ============================================================================

  /**
   * Selected event type
   * Helps contextualize AI design generation
   * @default null
   */
  eventType: EventType | null;

  // ============================================================================
  // Step 2: Product Selection
  // ============================================================================

  /**
   * Array of selected product IDs
   * References mockups from the mockups configuration
   * @example ['tshirt-white-front', 'sweatshirt-black-front']
   */
  selectedProducts: string[];

  // ============================================================================
  // Step 3: Brand Assets (Optional)
  // ============================================================================

  /**
   * User's brand assets for design consistency
   * All fields are optional - user can skip this step
   * @default { logos: [], colors: [], fonts: [], voice: '' }
   */
  brandAssets: BrandAssets;

  /**
   * Whether user has completed brand assets step
   * True if user clicked "Continue" (with or without uploading assets)
   */
  hasBrandAssets: boolean;

  // ============================================================================
  // Step 4: AI Chat & Design Generation
  // ============================================================================

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
   * Final design chosen by user to apply to canvas
   * Set when user clicks "Apply to Canvas" in AI chat step
   */
  finalDesignUrl: string | null;

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
   * @param step - The step number to navigate to (1-5)
   */
  goToStep: (step: WizardStep) => void;

  // ============================================================================
  // Step 1 Actions: Event Type
  // ============================================================================

  /**
   * Set the event type for the design
   * @param eventType - The selected event type
   */
  setEventType: (eventType: EventType) => void;

  // ============================================================================
  // Step 2 Actions: Product Selection
  // ============================================================================

  /**
   * Set the array of selected products
   * @param products - Array of product mockup IDs
   */
  setSelectedProducts: (products: string[]) => void;

  /**
   * Add a single product to the selection
   * @param productId - Product mockup ID to add
   */
  addProduct: (productId: string) => void;

  /**
   * Remove a single product from the selection
   * @param productId - Product mockup ID to remove
   */
  removeProduct: (productId: string) => void;

  /**
   * Toggle a product (add if not selected, remove if selected)
   * @param productId - Product mockup ID to toggle
   */
  toggleProduct: (productId: string) => void;

  // ============================================================================
  // Step 3 Actions: Brand Assets
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
   * Set brand fonts
   * @param fonts - Array of font names
   */
  setFonts: (fonts: string[]) => void;

  /**
   * Set brand voice/tone
   * @param voice - Brand voice description
   */
  setVoice: (voice: string) => void;

  /**
   * Mark brand assets step as completed
   * @param hasAssets - Whether user uploaded any assets
   */
  completeBrandAssets: (hasAssets: boolean) => void;

  // ============================================================================
  // Step 4 Actions: AI Design Generation
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
  eventType: null,
  selectedProducts: [],
  brandAssets: {
    logos: [],
    colors: [],
    fonts: [],
    voice: '',
  },
  hasBrandAssets: false,
  generatedDesigns: [],
  selectedDesignId: null,
  finalDesignUrl: null,
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
          if (currentStep < WizardStep.Canvas) {
            set({ currentStep: currentStep + 1 });
          }
        },

        previousStep: () => {
          const { currentStep } = get();
          if (currentStep > WizardStep.EventType) {
            set({ currentStep: currentStep - 1 });
          }
        },

        goToStep: (step: WizardStep) => {
          set({ currentStep: step });
        },

        // ========================================================================
        // Step 1 Actions: Event Type
        // ========================================================================

        setEventType: (eventType: EventType) => {
          set({ eventType });
        },

        // ========================================================================
        // Step 2 Actions: Product Selection
        // ========================================================================

        setSelectedProducts: (products: string[]) => {
          set({ selectedProducts: products });
        },

        addProduct: (productId: string) => {
          const { selectedProducts } = get();
          if (!selectedProducts.includes(productId)) {
            set({ selectedProducts: [...selectedProducts, productId] });
          }
        },

        removeProduct: (productId: string) => {
          const { selectedProducts } = get();
          set({
            selectedProducts: selectedProducts.filter(id => id !== productId)
          });
        },

        toggleProduct: (productId: string) => {
          const { selectedProducts } = get();
          if (selectedProducts.includes(productId)) {
            get().removeProduct(productId);
          } else {
            get().addProduct(productId);
          }
        },

        // ========================================================================
        // Step 3 Actions: Brand Assets
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

        completeBrandAssets: (hasAssets: boolean) => {
          set({ hasBrandAssets: hasAssets });
        },

        // ========================================================================
        // Step 4 Actions: AI Design Generation
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
        partialize: (state) => ({
          // Only persist essential state, exclude UI-specific state
          currentStep: state.currentStep,
          eventType: state.eventType,
          selectedProducts: state.selectedProducts,
          brandAssets: state.brandAssets,
          hasBrandAssets: state.hasBrandAssets,
          generatedDesigns: state.generatedDesigns,
          selectedDesignId: state.selectedDesignId,
          finalDesignUrl: state.finalDesignUrl,
        }),
      }
    ),
    {
      name: 'DesignWizard', // DevTools name
    }
  )
);
