/**
 * ProductSelector Component
 *
 * Allows users to select product type, color, and view
 *
 * Features:
 * - Product type selection (t-shirt, hoodie, etc.)
 * - Color picker
 * - View selector (front, back, side)
 * - Product specifications display
 */

'use client';

interface ProductSelectorProps {
  selectedProduct?: string;
  selectedColor?: string;
  selectedView?: string;
  onProductChange?: (product: string) => void;
  onColorChange?: (color: string) => void;
  onViewChange?: (view: string) => void;
}

export function ProductSelector({
  selectedProduct = 't-shirt',
  selectedColor = 'white',
  selectedView = 'front',
  onProductChange,
  onColorChange,
  onViewChange,
}: ProductSelectorProps) {
  return (
    <div className="product-selector space-y-4">
      <div>
        <label className="text-sm font-medium">Product Type</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="border rounded-lg p-2 text-sm">T-Shirt</button>
          <button className="border rounded-lg p-2 text-sm">Hoodie</button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Color</label>
        <div className="mt-2 flex gap-2">
          <button className="w-8 h-8 rounded-full bg-white border-2" />
          <button className="w-8 h-8 rounded-full bg-black border-2" />
          <button className="w-8 h-8 rounded-full bg-gray-500 border-2" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">View</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button className="border rounded-lg p-2 text-sm">Front</button>
          <button className="border rounded-lg p-2 text-sm">Back</button>
          <button className="border rounded-lg p-2 text-sm">Side</button>
        </div>
      </div>
    </div>
  );
}
