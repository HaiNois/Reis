import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantName: string
  price: number
  image: string
  quantity: number
  maxQuantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxQuantity) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity }] }
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.min(quantity, i.maxQuantity) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
)