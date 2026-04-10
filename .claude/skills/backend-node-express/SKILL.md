---
name: backend-node-express
description: Tạo API endpoint, Prisma model, Express middleware nhanh cho dự án Reis. Kích hoạt khi user cần: tạo API, thêm route, tạo Prisma model, viết business logic, middleware, validation, hoặc bất kỳ Node.js/Express task nào. Speedup bằng conventions và patterns chuẩn.
---

# Backend Node.js + Express Skill

Skill chuyên về **Node.js + Express + Prisma** development cho Reis project.

## Trigger

User nói một trong các patterns sau:
- "tạo API", "thêm endpoint", "API mới"
- "tạo route", "thêm route"
- "Prisma model", "update schema"
- "middleware", "validation"
- "business logic", "service"
- "DTO", "schema validation"
- "Node.js", "Express setup"
- "auth", "JWT", "login"

## Project Context

- Backend source: `d:/Reis/backend/src/`
- Prisma schema: `d:/Reis/backend/prisma/schema.prisma`
- Package: `d:/Reis/backend/package.json`
- Database: PostgreSQL 16 (port 5434)
- Docs: `d:/Reis/CLAUDE.md`

## Standard Output Format

```
(1) Giả định
- List các assumptions

(2) Thiết kế / Kế hoạch
- Module structure
- Route path + HTTP method
- Request/Response DTOs
- Prisma model changes (nếu có)
- Middleware chain
- Business logic layer

(3) Deliverables
- Files to create/update (exact paths)
- Prisma migration commands
- API contract (request/response shapes)

(4) Next actions (3-7 items)
- Task 1
- Task 2
...
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Database | snake_case | `product_variant`, `order_item` |
| API Routes | kebab-case | `/api/v1/product-variants` |
| Files | kebab-case | `product-service.ts`, `auth-middleware.ts` |
| DTOs | PascalCase + suffix | `CreateProductDto`, `ProductResponse` |
| Validation | Zod schemas | `createProductSchema` |
| Modules | kebab-case folder | `modules/product/` |

## Module Structure Pattern

```
backend/src/modules/{module-name}/
├── routes.ts           # Express Router
├── controller.ts       # Request handlers
├── service.ts          # Business logic
├── validator.ts        # Zod schemas
├── dto/
│   ├── create-{resource}.dto.ts
│   └── update-{resource}.dto.ts
└── types.ts            # Module-specific types
```

## API Response Pattern

```typescript
// Success response
res.status(200).json({
  success: true,
  data: responseData,
  meta: { page: 1, limit: 20, total: 100 }
})

// Error response
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: [{ field: 'email', message: 'Invalid email format' }]
  }
})
```

## Route Patterns

```typescript
// List with pagination
GET /api/v1/products?page=1&limit=20&category=shirt&sort=price_asc

// Detail
GET /api/v1/products/:slug

// Create
POST /api/v1/products
Body: CreateProductDto

// Update (full)
PUT /api/v1/products/:id
Body: UpdateProductDto

// Update (partial)
PATCH /api/v1/products/:id
Body: PartialUpdateProductDto

// Soft delete
DELETE /api/v1/products/:id
```

## Middleware Stack Order

```
1. helmet (security headers)
2. cors
3. express.json (body parsing)
4. rate limiting
5. authentication (JWT verify)
6. authorization (RBAC)
7. validation (Zod schemas)
8. route handlers
9. error handler
```

## Prisma Model Pattern

```prisma
model Product {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  basePrice   Decimal   @db.Decimal(10, 2)
  images      String[]
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([slug])
  @@index([categoryId])
  @@index([createdAt])
}
```

## Validation Pattern (Zod)

```typescript
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string().url()).min(1),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductDto = z.infer<typeof createProductSchema>
export type UpdateProductDto = z.infer<typeof updateProductSchema>
```

## Implementation Steps

1. **Analyze**: Đọc requirement, check existing modules
2. **Plan**: Xác định files cần tạo/update, Prisma changes
3. **Implement**: Code với TypeScript strict, error handling
4. **Migrate**: Run `npx prisma migrate dev` nếu có schema changes
5. **Test**: Verify API response format

## Quality Checklist

- [ ] TypeScript strict (no `any`)
- [ ] Zod validation on all inputs
- [ ] Error handling (try-catch, custom errors)
- [ ] Logging (Winston)
- [ ] Rate limiting applied
- [ ] Pagination meta in response
- [ ] Soft delete where needed
- [ ] Indexes on foreign keys, slug
- [ ] Prisma migration run

## Database Migrations

```bash
# Create migration
cd d:/Reis/backend && npx prisma migrate dev --name add_product_variants

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Missing/invalid JWT |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate slug) |
| INTERNAL_ERROR | 500 | Server error |
