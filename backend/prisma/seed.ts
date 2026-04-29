import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding announcement messages...')

  // Upsert default announcement messages (idempotent)
  const defaults = [
    {
      id: 'announcement-seed-001',
      textVi: 'Miễn phí vận chuyển cho đơn hàng từ 500.000đ',
      textEn: 'Free shipping on orders over $20',
      icon: 'truck',
      ctaTextVi: 'Mua ngay',
      ctaTextEn: 'Shop now',
      ctaHref: '/products',
      variant: 'dark',
      isActive: true,
      sortOrder: 0,
    },
    {
      id: 'announcement-seed-002',
      textVi: 'Bộ sưu tập mới SS26 — Khám phá ngay',
      textEn: 'New Collection SS26 — Discover now',
      icon: 'sparkle',
      ctaTextVi: 'Xem bộ sưu tập',
      ctaTextEn: 'View collection',
      ctaHref: '/collections',
      variant: 'dark',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'announcement-seed-003',
      textVi: 'Đổi trả dễ dàng trong 30 ngày',
      textEn: 'Easy 30-day returns, no questions asked',
      icon: 'shield',
      ctaTextVi: null,
      ctaTextEn: null,
      ctaHref: null,
      variant: 'dark',
      isActive: true,
      sortOrder: 2,
    },
  ]

  for (const msg of defaults) {
    await prisma.announcementMessage.upsert({
      where: { id: msg.id },
      update: {},
      create: msg,
    })
    console.log(`  Upserted: ${msg.textEn}`)
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
