/**
 * Phase 3: Import data into the new MySQL database.
 * Run AFTER schema.prisma has been switched to mysql and `prisma db push` has created empty tables.
 *
 * Input: backend/migration-data.json (from export-postgres.ts).
 * Idempotent: uses createMany({ skipDuplicates: true }) where supported, else createMany only.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import prisma from '../src/config/database.js'

const INPUT_FILE = resolve(process.cwd(), 'migration-data.json')

type AnyRow = Record<string, unknown>

// Decimal was serialized as string by Prisma's Decimal.toJSON() — Prisma mysql accepts string.
// Date was serialized as ISO string — need to convert back.
const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
  'expiresAt',
  'startsAt',
  'endsAt',
  'startDate',
  'endDate',
])

function rehydrate<T extends AnyRow>(rows: T[]): T[] {
  return rows.map((row) => {
    const out: AnyRow = { ...row }
    for (const field of DATE_FIELDS) {
      if (out[field] && typeof out[field] === 'string') {
        out[field] = new Date(out[field] as string)
      }
    }
    return out as T
  })
}

async function insert<T extends AnyRow>(label: string, model: { createMany: Function }, rows: T[]) {
  if (rows.length === 0) {
    console.log(`  ${label.padEnd(28)} 0 (skip)`)
    return
  }
  const data = rehydrate(rows)
  const result = await model.createMany({ data, skipDuplicates: true })
  console.log(`  ${label.padEnd(28)} ${result.count}/${rows.length}`)
}

async function main() {
  console.log('Loading migration-data.json...')
  const raw = JSON.parse(readFileSync(INPUT_FILE, 'utf8'))

  console.log('Importing to MySQL (FK order)...')

  // Level 0 — no dependencies
  await insert('users', prisma.user, raw.users)
  await insert('collections', prisma.collection, raw.collections)
  await insert('banners', prisma.banner, raw.banners)
  await insert('feedbacks', prisma.feedback, raw.feedbacks)
  await insert('cmsPages', prisma.cmsPage, raw.cmsPages)
  await insert('homepageSections', prisma.homepageSection, raw.homepageSections)

  // Level 1 — Category self-reference: parent null first, then children.
  const parents = (raw.categories as AnyRow[]).filter((c) => c.parentId == null)
  const children = (raw.categories as AnyRow[]).filter((c) => c.parentId != null)
  await insert('categories (roots)', prisma.category, parents)
  await insert('categories (children)', prisma.category, children)

  // Level 2 — depends on Category, User
  await insert('products', prisma.product, raw.products)
  await insert('addresses', prisma.address, raw.addresses)
  await insert('refreshTokens', prisma.refreshToken, raw.refreshTokens)

  // Level 3 — depends on Product
  await insert('productVariants', prisma.productVariant, raw.productVariants)
  await insert('productImages', prisma.productImage, raw.productImages)
  await insert('collectionProducts', prisma.collectionProduct, raw.collectionProducts)
  await insert('homepageSectionItems', prisma.homepageSectionItem, raw.homepageSectionItems)
  await insert('homepageSectionProducts', prisma.homepageSectionProduct, raw.homepageSectionProducts)

  // Level 4 — depends on Variant
  await insert('cartItems', prisma.cartItem, raw.cartItems)
  await insert('inventoryLogs', prisma.inventoryLog, raw.inventoryLogs)

  // Level 5 — Order + OrderItem
  await insert('orders', prisma.order, raw.orders)
  await insert('orderItems', prisma.orderItem, raw.orderItems)

  console.log('\nImport complete.')
}

main()
  .catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
