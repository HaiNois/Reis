---
name: frontend-react-vite
description: Tạo component/page React mới nhanh cho dự án Reis. Kích hoạt khi user cần: tạo component, tạo page mới, thêm feature frontend, setup React hook, hoặc bất kỳ React/Vite task nào. Speedup development bằng reusable components và conventions chuẩn.
---

# Frontend React + Vite Skill

Skill chuyên về **React + Vite + Tailwind** development cho Reis project.

## Trigger

User nói một trong các patterns sau:
- "tạo component", "thêm component mới", "tạo page"
- "thêm feature", "build cái này", "làm cái này"
- "React hook mới", "setup state cho..."
- "thêm routing", "tạo layout mới"
- "Vite config", "Tailwind setup"
- "shadcn component", "UI component"

## Project Context

- Frontend source: `d:/Reis/frontend/src/`
- Package: `d:/Reis/frontend/package.json`
- Tailwind config: `d:/Reis/frontend/tailwind.config.js`
- Vite config: `d:/Reis/frontend/vite.config.ts`
- Docs: `d:/Reis/CLAUDE.md`

## Standard Output Format

```
(1) Giả định
- List các assumptions

(2) Thiết kế / Kế hoạch
- Component structure
- Props/DTO interface
- State management approach
- Routing setup (nếu có)

(3) Deliverables
- Files to create/update (exact paths)
- API endpoints cần thiết
- DB changes (nếu có)

(4) Next actions (3-7 items)
- Task 1
- Task 2
...
```

## Component Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase + use prefix | `useProductList.ts` |
| Services | camelCase | `productApi.ts` |
| Stores | camelCase | `cartStore.ts` |
| Types | PascalCase + suffix | `ProductResponse`, `CreateProductDto` |
| Utils | camelCase | `formatCurrency.ts` |

## File Structure

```
frontend/src/
├── components/
│   ├── ui/           # shadcn components: Button, Input, Modal, etc.
│   ├── layout/       # Header, Footer, Container, MainLayout
│   ├── product/      # ProductCard, ProductGrid, ProductGallery
│   ├── cart/         # CartItem, CartSummary
│   └── checkout/    # AddressForm, PaymentForm
├── pages/
│   ├── storefront/   # Home, Catalog, ProductDetail, Collections
│   ├── account/      # Login, Register, Profile, Orders
│   └── admin/        # Dashboard, Products, Orders, Categories
├── hooks/           # useAuth, useCart, useToast
├── services/        # api.ts (axios instance), orderApi.ts
├── stores/          # authStore.ts, cartStore.ts (Zustand)
├── types/           # DTOs, interfaces
└── utils/           # formatPrice, formatDate
```

## shadcn/ui Components

Available components (check trong `components/ui/`):
- `Button`, `Input`, `Label`, `Textarea`
- `Dialog`, `Sheet`, `Tabs`, `Select`
- `Badge`, `Card`, `Separator`
- `Table`, `Avatar`, `DropdownMenu`
- `Carousel`, `Toast` (Sonner)

## State Management

### Zustand Stores
```typescript
// Pattern cho store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, variant: Variant) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, qty: number) => void
  clearCart: () => void
  total: number
}
```

### TanStack Query
```typescript
// Pattern cho API calls
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`),
  })
}
```

## Routing Pattern

```typescript
// pages/storefront/Home.tsx
const Home = () => { ... }
export default Home

// Router setup (App.tsx)
<Route path="/" element={<MainLayout />}>
  <Route index element={<Home />} />
  <Route path="products" element={<Catalog />} />
  <Route path="products/:slug" element={<ProductDetail />} />
</Route>
```

## API Service Pattern

```typescript
// services/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

// Interceptors for auth, error handling
api.interceptors.response.use(...)
```

## Implementation Steps

1. **Analyze**: Đọc requirement, check existing similar components
2. **Plan**: Xác định files cần tạo/update, follow output format
3. **Implement**: Code với TypeScript strict, error handling
4. **Verify**: TypeScript compile, imports correct

## Example: Tạo Product Card

```
(1) Giả định
- Product có: id, name, slug, images[], basePrice
- Variant có: id, size, color, price, stock
- Hover effect: show quick-view button

(2) Thiết kế / Kế hoạch
- File: components/product/ProductCard.tsx
- Props: ProductCardProps { product, variant?, onQuickView? }
- Image: Embla Carousel cho gallery
- Price: formatted currency
- CTA: Add to Cart button

(3) Deliverables
- Create: frontend/src/components/product/ProductCard.tsx
- Update: frontend/src/pages/storefront/Catalog.tsx (thêm vào grid)

(4) Next actions
1. Tạo ProductCard component
2. Import vào Catalog page
3. Connect với TanStack Query cho product list
4. Thêm quick-view dialog
5. Handle add to cart action
```

## Quality Checklist

- [ ] TypeScript strict (no `any`)
- [ ] Loading state component
- [ ] Empty state component
- [ ] Error handling
- [ ] Responsive (mobile-first)
- [ ] Accessible (ARIA labels)
- [ ] i18n strings extracted
- [ ] Follow naming conventions
