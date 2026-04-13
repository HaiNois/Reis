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

// Common sizes and colors for fashion
const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const COLORS = [
  { name: 'Black', code: 'BLK' },
  { name: 'White', code: 'WHT' },
  { name: 'Beige', code: 'BEG' },
  { name: 'Navy', code: 'NVY' },
  { name: 'Brown', code: 'BRN' },
  { name: 'Gray', code: 'GRY' },
  { name: 'Pink', code: 'PNK' },
  { name: 'Red', code: 'RED' },
  { name: 'Green', code: 'GRN' },
  { name: 'Blue', code: 'BLU' },
]

async function main() {
  console.log('🔄 Inserting variants for all products without variants...\n')

  // Get all products without variants
  const products = await prisma.product.findMany({
    include: { variants: true },
  })

  const productsWithoutVariants = products.filter(p => p.variants.length === 0)
  console.log(`📦 Found ${products.length} products, ${productsWithoutVariants.length} need variants\n`)

  if (productsWithoutVariants.length === 0) {
    console.log('✅ All products already have variants!')
    return
  }

  let totalVariantsCreated = 0

  for (const product of productsWithoutVariants) {
    console.log(`\n📁 ${product.name}`)
    console.log(`   Price: ${product.price} VND`)

    // Generate variants: 2-3 colors x 2-3 sizes
    const selectedColors = COLORS.slice(0, 3) // 3 colors
    const selectedSizes = SIZES.slice(1, 4) // S, M, L (3 sizes)

    let productVariantCount = 0

    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        const sku = generateSku(product.slug, color.name, size)

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: sku,
            size: size,
            color: color.name,
            price: product.price,
            quantity: Math.floor(Math.random() * 20) + 5, // 5-25 stock
            isActive: true,
          },
        })

        console.log(`   ✅ ${color.name} / ${size} → ${sku}`)
        productVariantCount++
        totalVariantsCreated++
      }
    }

    console.log(`   → Created ${productVariantCount} variants`)
  }

  console.log(`\n✨ Done!`)
  console.log(`   - Products processed: ${productsWithoutVariants.length}`)
  console.log(`   - Total variants created: ${totalVariantsCreated}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })