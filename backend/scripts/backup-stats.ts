import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Products
  const products = await prisma.product.findMany({
    where: { isDelete: false },
    orderBy: { createdAt: 'asc' }
  })

  console.log('-- =====================================')
  console.log('-- PRODUCTS BACKUP')
  console.log('-- =====================================')
  console.log('-- Total:', products.length, 'products')
  console.log('')

  for (const p of products) {
    const images = await prisma.productImage.findMany({
      where: { productId: p.id },
      orderBy: { sortOrder: 'asc' }
    })
    const variants = await prisma.productVariant.findMany({
      where: { productId: p.id }
    })

    console.log(`-- Product: ${p.name} (${p.slug})`)
    console.log(`-- ID: ${p.id}`)
    console.log(`-- Images: ${images.length}, Variants: ${variants.length}`)
    console.log('')
  }

  // Categories
  const categories = await prisma.category.findMany()
  console.log('-- =====================================')
  console.log('-- CATEGORIES')
  console.log('-- =====================================')
  console.log('-- Total:', categories.length, 'categories')
  for (const c of categories) {
    console.log(`-- ${c.name} (${c.slug}) - ID: ${c.id}`)
  }

  // Collections
  const collections = await prisma.collection.findMany()
  console.log('')
  console.log('-- =====================================')
  console.log('-- COLLECTIONS')
  console.log('-- =====================================')
  console.log('-- Total:', collections.length, 'collections')
  for (const c of collections) {
    console.log(`-- ${c.name} (${c.slug}) - ID: ${c.id}`)
    const cp = await prisma.collectionProduct.findMany({
      where: { collectionId: c.id }
    })
    console.log(`--   Products in collection: ${cp.length}`)
  }

  // Variants stats
  const allVariants = await prisma.productVariant.findMany()
  console.log('')
  console.log('-- =====================================')
  console.log('-- VARIANTS')
  console.log('-- Total:', allVariants.length, 'variants')

  // ProductImages stats
  const allImages = await prisma.productImage.findMany()
  console.log('-- Total:', allImages.length, 'product images')
}

main()
  .catch((e) => {
    console.error('Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())