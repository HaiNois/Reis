import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find and delete homepage sections of type ANNOUNCEMENT_BAR (cascades to items)
  const sectionsToDelete = await prisma.homepageSection.findMany({
    where: { sectionType: 'ANNOUNCEMENT_BAR' },
    select: { id: true, title: true },
  })
  console.log('Sections to delete:', sectionsToDelete.length)
  console.log(JSON.stringify(sectionsToDelete, null, 2))

  // Hard delete (Cascade will remove items)
  const result = await prisma.homepageSection.deleteMany({
    where: { sectionType: 'ANNOUNCEMENT_BAR' },
  })
  console.log('Deleted sections:', result.count)

  // Also clean orphan items of type ANNOUNCEMENT (if any)
  const itemsResult = await prisma.homepageSectionItem.deleteMany({
    where: { itemType: 'ANNOUNCEMENT' },
  })
  console.log('Deleted ANNOUNCEMENT items:', itemsResult.count)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
