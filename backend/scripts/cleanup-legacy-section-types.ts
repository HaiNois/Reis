// One-time cleanup: removes any HomepageSection rows whose type was retired
// (CATEGORY_QUICK_SHOP, EDITORIAL_LOOKBOOK, NEWSLETTER_SIGNUP). These types
// were dropped from the Prisma enum on 2026-04-29 because storefront no longer
// renders them. MySQL strict mode refuses `ALTER TABLE ... MODIFY COLUMN ...
// ENUM(...)` while existing rows still hold values not in the new enum, so
// this script must run BEFORE `prisma db push`.
//
// Usage:
//   cd backend && npx tsx scripts/cleanup-legacy-section-types.ts
//   then:
//   npx prisma db push
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LEGACY_TYPES = ['CATEGORY_QUICK_SHOP', 'EDITORIAL_LOOKBOOK', 'NEWSLETTER_SIGNUP'] as const

async function run() {
  // Use raw SQL because the Prisma client's TS enum no longer contains the
  // legacy values — `where: { sectionType: { in: [...] } }` would not type-check.
  // MySQL identifier quoting uses backticks; ENUM columns can be compared as strings directly.
  const rows = await prisma.$queryRawUnsafe<{ id: string; slug: string; sectionType: string }[]>(
    'SELECT `id`, `slug`, `sectionType` FROM `HomepageSection` WHERE `sectionType` IN (?, ?, ?)',
    ...LEGACY_TYPES,
  )

  if (rows.length === 0) {
    console.log('No legacy-typed homepage sections found. Safe to run `prisma db push`.')
    return
  }

  console.log(`Found ${rows.length} legacy-typed sections — removing:`)
  for (const r of rows) {
    console.log(`  - ${r.sectionType}: ${r.slug} (${r.id})`)
  }

  // Use raw DELETE so Prisma client doesn't reject the legacy enum literal.
  // FK relations are cleaned up via separate DELETEs (no CASCADE assumed).
  for (const r of rows) {
    await prisma.$executeRawUnsafe(
      'DELETE FROM `HomepageSectionProduct` WHERE `homepageSectionId` = ?',
      r.id,
    )
    await prisma.$executeRawUnsafe(
      'DELETE FROM `HomepageSectionItem` WHERE `homepageSectionId` = ?',
      r.id,
    )
    await prisma.$executeRawUnsafe(
      'DELETE FROM `HomepageSection` WHERE `id` = ?',
      r.id,
    )
  }

  console.log(`\nDeleted ${rows.length} sections. You can now run \`npx prisma db push\`.`)
}

run()
  .catch((err) => {
    console.error('Cleanup failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
