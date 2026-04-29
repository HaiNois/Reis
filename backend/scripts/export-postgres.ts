/**
 * Phase 1: Export all data from the current PostgreSQL database.
 * Run while schema.prisma still points at postgresql.
 *
 * Output: backend/migration-data.json (all 19 models).
 * Decimal is serialized as string (Prisma Decimal.toJSON()), Date as ISO.
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import prisma from '../src/config/database.js'

const OUTPUT_FILE = resolve(process.cwd(), 'migration-data.json')

async function main() {
  console.log('Exporting data from PostgreSQL...')

  const data = {
    // Order doesn't matter in export — import script handles FK order.
    users: await prisma.user.findMany(),
    addresses: await prisma.address.findMany(),
    categories: await prisma.category.findMany(),
    collections: await prisma.collection.findMany(),
    collectionProducts: await prisma.collectionProduct.findMany(),
    products: await prisma.product.findMany(),
    productVariants: await prisma.productVariant.findMany(),
    productImages: await prisma.productImage.findMany(),
    cartItems: await prisma.cartItem.findMany(),
    orders: await prisma.order.findMany(),
    orderItems: await prisma.orderItem.findMany(),
    refreshTokens: await prisma.refreshToken.findMany(),
    banners: await prisma.banner.findMany(),
    homepageSections: await prisma.homepageSection.findMany(),
    homepageSectionItems: await prisma.homepageSectionItem.findMany(),
    homepageSectionProducts: await prisma.homepageSectionProduct.findMany(),
    feedbacks: await prisma.feedback.findMany(),
    inventoryLogs: await prisma.inventoryLog.findMany(),
    cmsPages: await prisma.cmsPage.findMany(),
  }

  const counts = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, (v as unknown[]).length])
  )

  writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8')

  console.log('Export complete ->', OUTPUT_FILE)
  console.log('Row counts:')
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(28)} ${count}`)
  }
  const total = Object.values(counts).reduce((a, b) => a + (b as number), 0)
  console.log(`  ${'TOTAL'.padEnd(28)} ${total}`)
}

main()
  .catch((err) => {
    console.error('Export failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
