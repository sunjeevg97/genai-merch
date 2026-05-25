/**
 * Verification script for cart store fix (fix/checkout-flow).
 *
 * Asserts that subtotal and itemCount stay in sync with items
 * after addItem, updateQuantity, and removeItem.
 *
 * Run: npx tsx scripts/verify-cart-fix.ts
 */

// Stub localStorage so persist middleware doesn't crash in Node
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => { storage.set(k, v); },
  removeItem: (k: string) => { storage.delete(k); },
};

import { useCart } from '../src/lib/cart/store';

function snap() {
  const s = useCart.getState();
  return {
    itemsLen: s.items.length,
    itemCount: s.itemCount,
    subtotal: s.subtotal,
  };
}

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  expected=${JSON.stringify(expected)}  actual=${JSON.stringify(actual)}`);
  if (!ok) process.exitCode = 1;
}

const baseItem = {
  productVariantId: 'pv-test',
  product: { name: 'Test Tee', imageUrl: '', productType: 't-shirt' },
  variant: { name: 'M / Black', size: 'M', color: 'Black' },
  design: null,
  quantity: 1,
  unitPrice: 2299,
};

// ---- Bug #1 reproduction: addItem from empty ----
useCart.getState().clearCart();
assertEq('init: empty', snap(), { itemsLen: 0, itemCount: 0, subtotal: 0 });

useCart.getState().addItem({ ...baseItem });
assertEq('after addItem x1 (BUG #1)', snap(), { itemsLen: 1, itemCount: 1, subtotal: 2299 });

useCart.getState().addItem({ ...baseItem, productVariantId: 'pv-2' });
assertEq('after addItem x2 different variant', snap(), { itemsLen: 2, itemCount: 2, subtotal: 4598 });

// ---- Bug #2 reproduction: updateQuantity ----
const firstId = useCart.getState().items[0].id;
useCart.getState().updateQuantity(firstId, 3);
assertEq('after updateQuantity to 3 (BUG #2)', snap(), { itemsLen: 2, itemCount: 4, subtotal: 2299 * 3 + 2299 });

useCart.getState().updateQuantity(firstId, 1);
assertEq('after updateQuantity back to 1', snap(), { itemsLen: 2, itemCount: 2, subtotal: 4598 });

// ---- removeItem ----
useCart.getState().removeItem(firstId);
assertEq('after removeItem', snap(), { itemsLen: 1, itemCount: 1, subtotal: 2299 });

// ---- updateQuantity to 0 triggers removeItem internally ----
const remainingId = useCart.getState().items[0].id;
useCart.getState().updateQuantity(remainingId, 0);
assertEq('after updateQuantity(0) -> remove', snap(), { itemsLen: 0, itemCount: 0, subtotal: 0 });

console.log(process.exitCode === 1 ? '\n--- FAILURES ABOVE ---' : '\n--- ALL CART STORE INVARIANTS HOLD ---');
