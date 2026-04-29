// One-shot backfill: copy metaJson.collectionIds[0] (or .collectionId) into FK
// HomepageSectionItem.collectionId for COLLECTION items that have no FK set.
// Usage: cd backend && npx tsx scripts/backfill-collection-id.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  const items = await prisma.homepageSectionItem.findMany({
    where: {
      itemType: 'COLLECTION',
      collectionId: null,
      deletedAt: null,
    },
    select: { id: true, metaJson: true },
  })

  let updated = 0
  let skipped = 0

  for (const item of items) {
    const meta = (item.metaJson ?? {}) as Record<string, unknown>
    const fromArray = Array.isArray(meta.collectionIds) ? (meta.collectionIds[0] as string | undefined) : undefined
    const fromSingle = typeof meta.collectionId === 'string' ? meta.collectionId : undefined
    const collectionId = fromArray ?? fromSingle

    if (!collectionId) {
      skipped++
      continue
    }

    const exists = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    })
    if (!exists) {
      console.warn(`Item ${item.id}: collection ${collectionId} not found, skipping`)
      skipped++
      continue
    }

    await prisma.homepageSectionItem.update({
      where: { id: item.id },
      data: { collectionId },
    })
    updated++
    console.log(`Item ${item.id} → collectionId ${collectionId}`)
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, total scanned: ${items.length}`)
}

run()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
