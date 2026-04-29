import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sections = await prisma.homepageSection.findMany({
    where: { sectionType: 'ANNOUNCEMENT_BAR' },
    select: {
      id: true,
      title: true,
      slug: true,
      isActive: true,
      _count: { select: { items: true } },
    },
  })
  console.log(JSON.stringify({ count: sections.length, sections }, null, 2))
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
