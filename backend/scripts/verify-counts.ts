/**
 * Verify: compares row counts in migration-data.json vs live MySQL DB.
 * Run AFTER import-mysql.ts to confirm no rows lost.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import prisma from '../src/config/database.js'

const INPUT_FILE = resolve(process.cwd(), 'migration-data.json')

async function main() {
  const raw = JSON.parse(readFileSync(INPUT_FILE, 'utf8'))

  const pairs: Array<[string, number, () => Promise<number>]> = [
    ['users', raw.users.length, () => prisma.user.count()],
    ['addresses', raw.addresses.length, () => prisma.address.count()],
    ['categories', raw.categories.length, () => prisma.category.count()],
    ['collections', raw.collections.length, () => prisma.collection.count()],
    ['collectionProducts', raw.collectionProducts.length, () => prisma.collectionProduct.count()],
    ['products', raw.products.length, () => prisma.product.count()],
    ['productVariants', raw.productVariants.length, () => prisma.productVariant.count()],
    ['productImages', raw.productImages.length, () => prisma.productImage.count()],
    ['cartItems', raw.cartItems.length, () => prisma.cartItem.count()],
    ['orders', raw.orders.length, () => prisma.order.count()],
    ['orderItems', raw.orderItems.length, () => prisma.orderItem.count()],
    ['refreshTokens', raw.refreshTokens.length, () => prisma.refreshToken.count()],
    ['banners', raw.banners.length, () => prisma.banner.count()],
    ['homepageSections', raw.homepageSections.length, () => prisma.homepageSection.count()],
    [
      'homepageSectionItems',
      raw.homepageSectionItems.length,
      () => prisma.homepageSectionItem.count(),
    ],
    [
      'homepageSectionProducts',
      raw.homepageSectionProducts.length,
      () => prisma.homepageSectionProduct.count(),
    ],
    ['feedbacks', raw.feedbacks.length, () => prisma.feedback.count()],
    ['inventoryLogs', raw.inventoryLogs.length, () => prisma.inventoryLog.count()],
    ['cmsPages', raw.cmsPages.length, () => prisma.cmsPage.count()],
  ]

  let ok = true
  console.log(`${'Table'.padEnd(28)} ${'JSON'.padStart(6)} ${'DB'.padStart(6)}  Status`)
  for (const [name, expected, query] of pairs) {
    const actual = await query()
    const match = actual === expected
    if (!match) ok = false
    console.log(
      `${name.padEnd(28)} ${String(expected).padStart(6)} ${String(actual).padStart(6)}  ${match ? 'OK' : 'MISMATCH'}`
    )
  }

  if (!ok) {
    console.error('\nSome tables have mismatched row counts — review before deleting Postgres volume.')
    process.exit(1)
  }
  console.log('\nAll row counts match.')
}

main()
  .catch((err) => {
    console.error('Verify failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
