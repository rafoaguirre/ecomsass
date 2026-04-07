'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ───────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  price: { amount: string; currency: string };
  image?: string;
  quantity: number;
}

export interface StoreGroup {
  storeId: string;
  storeName: string;
  storeSlug: string;
  items: CartItem[];
}

interface CartState {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearStore: (storeId: string) => void;
  clearCart: () => void;

  // Computed helpers
  totalItems: () => number;
  totalPrice: () => number;
  groupedByStore: () => StoreGroup[];
  subtotalsByCurrency: () => { amount: string; currency: string }[];
  getItemQuantity: (productId: string) => number;
}

// ── Store ───────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, ...item, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        }));
      },

      clearStore: (storeId) => {
        set((state) => ({
          items: state.items.filter((i) => i.storeId !== storeId),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + Number(i.price.amount) * i.quantity, 0),

      groupedByStore: () => {
        const groups = new Map<string, StoreGroup>();
        for (const item of get().items) {
          let group = groups.get(item.storeId);
          if (!group) {
            group = {
              storeId: item.storeId,
              storeName: item.storeName,
              storeSlug: item.storeSlug,
              items: [],
            };
            groups.set(item.storeId, group);
          }
          group.items.push(item);
        }
        return Array.from(groups.values());
      },

      getItemQuantity: (productId) =>
        get().items.find((i) => i.productId === productId)?.quantity ?? 0,

      subtotalsByCurrency: () => {
        const totals: Record<string, number> = {};
        for (const item of get().items) {
          const c = item.price.currency;
          totals[c] = (totals[c] ?? 0) + Number(item.price.amount) * item.quantity;
        }
        return Object.entries(totals).map(([currency, amount]) => ({
          amount: String(amount),
          currency,
        }));
      },
    }),
    {
      name: 'ecomsaas-cart',
    }
  )
);
