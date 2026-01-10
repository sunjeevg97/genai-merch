/**
 * Shopping Cart Store
 *
 * Zustand store for managing shopping cart state.
 * Persists to localStorage for cart recovery.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

/**
 * Cart Item Type
 */
export interface CartItem {
  id: string; // Temporary UI ID (generated)
  productVariantId: string; // Database ProductVariant ID
  product: {
    name: string;
    imageUrl: string;
    productType: string;
  };
  variant: {
    name: string;
    size: string | null;
    color: string | null;
  };
  design: {
    id: string;
    imageUrl: string;
    thumbnailUrl?: string;
  } | null;
  // Mockup-specific configuration (optional)
  mockupConfig?: {
    mockupUrl: string; // Generated mockup preview URL
    technique: string; // Printing technique (dtg, embroidery, etc.)
    placement: string; // Design placement (front, back, etc.)
    styleId: number; // Printful mockup style ID
    styleName: string; // Customer-friendly style name
  };
  quantity: number;
  unitPrice: number; // Price in cents
}

/**
 * Cart Store State
 */
interface CartStore {
  // State
  items: CartItem[];
  isOpen: boolean;

  // Computed values
  subtotal: number;
  itemCount: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Internal helpers
  _calculateSubtotal: () => number;
  _calculateItemCount: () => number;
}

/**
 * Generate unique ID for cart item
 */
function generateCartItemId(): string {
  return `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cart Store
 */
export const useCart = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        isOpen: false,
        subtotal: 0,
        itemCount: 0,

        // Calculate subtotal
        _calculateSubtotal: () => {
          const { items } = get();
          return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        },

        // Calculate item count
        _calculateItemCount: () => {
          const { items } = get();
          return items.reduce((sum, item) => sum + item.quantity, 0);
        },

        /**
         * Add item to cart
         *
         * If item with same variant and design already exists, increase quantity.
         * Otherwise, add as new item.
         */
        addItem: (item) => {
          const { items, _calculateSubtotal, _calculateItemCount } = get();

          // Check if item already exists (same variant + design + mockup configuration)
          const existingItemIndex = items.findIndex(
            (i) =>
              i.productVariantId === item.productVariantId &&
              i.design?.id === item.design?.id &&
              i.mockupConfig?.styleId === item.mockupConfig?.styleId &&
              i.mockupConfig?.placement === item.mockupConfig?.placement &&
              i.mockupConfig?.technique === item.mockupConfig?.technique
          );

          let newItems: CartItem[];

          if (existingItemIndex >= 0) {
            // Update quantity of existing item
            newItems = items.map((i, index) =>
              index === existingItemIndex
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            // Add new item with generated ID
            newItems = [...items, { ...item, id: generateCartItemId() }];
          }

          set({
            items: newItems,
            subtotal: _calculateSubtotal(),
            itemCount: _calculateItemCount(),
            isOpen: true, // Open cart when item is added
          });
        },

        /**
         * Remove item from cart
         */
        removeItem: (itemId) => {
          const { items, _calculateSubtotal, _calculateItemCount } = get();
          const newItems = items.filter((item) => item.id !== itemId);

          set({
            items: newItems,
            subtotal: _calculateSubtotal(),
            itemCount: _calculateItemCount(),
          });
        },

        /**
         * Update item quantity
         *
         * If quantity is 0 or negative, remove item.
         */
        updateQuantity: (itemId, quantity) => {
          const { items, removeItem, _calculateSubtotal, _calculateItemCount } = get();

          // Remove item if quantity is 0 or negative
          if (quantity <= 0) {
            removeItem(itemId);
            return;
          }

          // Update quantity
          const newItems = items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          );

          set({
            items: newItems,
            subtotal: _calculateSubtotal(),
            itemCount: _calculateItemCount(),
          });
        },

        /**
         * Clear all items from cart
         */
        clearCart: () => {
          set({
            items: [],
            subtotal: 0,
            itemCount: 0,
            isOpen: false,
          });
        },

        /**
         * Open cart drawer
         */
        openCart: () => {
          set({ isOpen: true });
        },

        /**
         * Close cart drawer
         */
        closeCart: () => {
          set({ isOpen: false });
        },
      }),
      {
        name: 'genai-merch-cart', // localStorage key
        // Only persist items, not UI state
        partialize: (state) => ({ items: state.items }),
        // Recalculate computed values on rehydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.subtotal = state._calculateSubtotal();
            state.itemCount = state._calculateItemCount();
          }
        },
      }
    ),
    { name: 'CartStore' }
  )
);

/**
 * Cart Selectors (for optimized rerenders)
 */
export const useCartItems = () => useCart((state) => state.items);
export const useCartSubtotal = () => useCart((state) => state.subtotal);
export const useCartItemCount = () => useCart((state) => state.itemCount);
export const useCartIsOpen = () => useCart((state) => state.isOpen);
