// Seed example homepage sections for ALL section types using existing data.
// - Picks real products, collections, and product images from DB
// - Creates one section of each type with sortOrder for nice flow
// - Idempotent: re-run safe (deletes prior demo sections by slug prefix)
// Usage: cd backend && npx tsx scripts/seed-homepage-examples.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_SLUG_PREFIX = 'demo-'

// Pick a usable image URL from a product (primary first, then any, then fallback)
function pickProductImage(product: {
  image: string | null
  images: { publicUrl: string | null; url: string | null; isPrimary: boolean; sortOrder: number }[]
}): string {
  const sorted = [...product.images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
    return a.sortOrder - b.sortOrder
  })
  const primary = sorted[0]
  return primary?.publicUrl || primary?.url || product.image || '/images/products/placeholder.jpg'
}

async function clearOldDemo() {
  const old = await prisma.homepageSection.findMany({
    where: { slug: { startsWith: DEMO_SLUG_PREFIX } },
    select: { id: true, slug: true },
  })
  if (old.length === 0) return

  for (const s of old) {
    await prisma.homepageSectionProduct.deleteMany({ where: { homepageSectionId: s.id } })
    await prisma.homepageSectionItem.deleteMany({ where: { homepageSectionId: s.id } })
    await prisma.homepageSection.delete({ where: { id: s.id } })
  }
  console.log(`Cleared ${old.length} old demo sections.`)
}

async function run() {
  console.log('Loading existing data...')

  const [products, collections] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        images: {
          select: { publicUrl: true, url: true, isPrimary: true, sortOrder: true },
        },
      },
      take: 30,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.collection.findMany({
      where: { isActive: true },
      take: 8,
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  console.log(`Found: ${products.length} products, ${collections.length} collections`)

  if (products.length === 0) {
    throw new Error('No products in DB. Add products first then re-run.')
  }
  if (collections.length === 0) {
    throw new Error('No active collections in DB. Add collections first then re-run.')
  }

  await clearOldDemo()

  // Use first product image as a generic hero background fallback
  const heroImage = pickProductImage(products[0])

  let order = 0

  // ============ 1. HERO ============
  const hero = await prisma.homepageSection.create({
    data: {
      slug: `${DEMO_SLUG_PREFIX}hero`,
      sectionType: 'HERO',
      title: 'A Soft Awakening',
      subtitle: 'Spring Edit 2026',
      sortOrder: order++,
      isActive: true,
      configJson: { textAlign: 'center' },
    },
  })
  await prisma.homepageSectionItem.create({
    data: {
      homepageSectionId: hero.id,
      itemType: 'BANNER',
      title: 'A Soft Awakening',
      mediaUrl: heroImage,
      ctaLabel: 'Discover',
      ctaUrl: '/products',
      isActive: true,
    },
  })
  console.log('✓ HERO created')

  // ============ 2. PRODUCT_RAIL ============
  const rail = await prisma.homepageSection.create({
    data: {
      slug: `${DEMO_SLUG_PREFIX}product-rail`,
      sectionType: 'PRODUCT_RAIL',
      title: 'Featured',
      subtitle: 'Hand-picked pieces',
      sortOrder: order++,
      isActive: true,
      layout: 'carousel',
    },
  })
  for (const [idx, p] of products.slice(0, 8).entries()) {
    await prisma.homepageSectionProduct.create({
      data: { homepageSectionId: rail.id, productId: p.id, sortOrder: idx },
    })
  }
  console.log(`✓ PRODUCT_RAIL created (${Math.min(8, products.length)} products)`)

  // ============ 3. MEDIA_TILES ============
  const tiles = await prisma.homepageSection.create({
    data: {
      slug: `${DEMO_SLUG_PREFIX}media-tiles`,
      sectionType: 'MEDIA_TILES',
      title: 'Collections',
      sortOrder: order++,
      isActive: true,
      layout: 'carousel',
    },
  })
  // Use collections beyond first 4 if available, else reuse
  const tileCollections = collections.length > 4 ? collections.slice(4, 8) : collections.slice(0, 3)
  for (const [idx, col] of tileCollections.entries()) {
    await prisma.homepageSectionItem.create({
      data: {
        homepageSectionId: tiles.id,
        itemType: 'COLLECTION',
        collectionId: col.id,
        sortOrder: idx,
        isActive: true,
      },
    })
  }
  console.log(`✓ MEDIA_TILES created (${tileCollections.length} tiles)`)

  // ============ 4. NEW_SEASON_ARRIVALS (PRODUCT_RAIL variant) ============
  const newArrivals = await prisma.homepageSection.create({
    data: {
      slug: `${DEMO_SLUG_PREFIX}new-arrivals`,
      sectionType: 'NEW_SEASON_ARRIVALS',
      title: 'New Arrivals',
      subtitle: 'Just landed',
      sortOrder: order++,
      isActive: true,
      layout: 'carousel',
    },
  })
  // Prefer isNewArrival flagged products, else fallback to most recent
  const arrivalsSource = await prisma.product.findMany({
    where: { deletedAt: null, status: 'ACTIVE', isNewArrival: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
  })
  const arrivals = arrivalsSource.length > 0 ? arrivalsSource : products.slice(0, 6)
  for (const [idx, p] of arrivals.entries()) {
    await prisma.homepageSectionProduct.create({
      data: { homepageSectionId: newArrivals.id, productId: p.id, sortOrder: idx },
    })
  }
  console.log(`✓ NEW_SEASON_ARRIVALS created (${arrivals.length} products)`)

  console.log('\nAll demo sections created. Order on homepage:')
  const all = await prisma.homepageSection.findMany({
    where: { slug: { startsWith: DEMO_SLUG_PREFIX } },
    orderBy: { sortOrder: 'asc' },
    select: { sortOrder: true, sectionType: true, title: true, slug: true },
  })
  for (const s of all) {
    console.log(`  ${s.sortOrder}. ${s.sectionType.padEnd(22)} — ${s.title} (${s.slug})`)
  }
}

run()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
