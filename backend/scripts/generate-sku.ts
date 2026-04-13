import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sanitize string to remove non-ASCII and special characters
function sanitizeSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .substring(0, 20)
}

// Generate SKU from product slug + color + size
function generateSku(productSlug: string, color: string, size: string): string {
  const slugPart = sanitizeSlug(productSlug).substring(0, 6)
  const colorPart = sanitizeSlug(color).substring(0, 4)
  const sizePart = sanitizeSlug(size)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${slugPart}-${colorPart}-${sizePart}-${random}`
}

async function main() {
  console.log('🔄 Starting SKU regeneration for all product variants...\n')

  const args = process.argv.slice(2)
  const regenerateAll = args.includes('--force')

  // Get all products with their variants (including soft deleted)
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
  })

  console.log(`📦 Found ${products.length} products\n`)

  let updatedCount = 0
  let skippedCount = 0

  for (const product of products) {
    for (const variant of product.variants) {
      // Check if SKU is empty, null, or invalid (contains special unicode chars)
      const isInvalidSku = !variant.sku || variant.sku.trim() === '' || /[^\w-]/.test(variant.sku)

      if (isInvalidSku || regenerateAll) {
        const newSku = generateSku(product.slug, variant.color, variant.size)

        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { sku: newSku },
        })

        console.log(`  ✅ ${product.name} | ${variant.color} ${variant.size} → ${newSku}`)
        updatedCount++
      } else {
        console.log(`  ⏭️  ${product.name} | ${variant.color} ${variant.size} (SKU: ${variant.sku}) - kept`)
        skippedCount++
      }
    }
  }

  console.log(`\n✨ Done!`)
  console.log(`   - Updated: ${updatedCount} variants`)
  console.log(`   - Skipped: ${skippedCount} variants`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
