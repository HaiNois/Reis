import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    where: { isDelete: false },
    include: { variants: true, images: true, category: true },
  })

  console.log(`-- Total: ${products.length} products`)
  console.log(JSON.stringify(products, null, 2))
}

main()
  .catch((e) => {
    console.error('Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())