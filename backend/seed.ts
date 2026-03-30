import prisma from './src/config/database.js'

async function main() {
  console.log('Seeding database...')

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'ao-thun' },
      update: {},
      create: {
        name: 'Áo Thun',
        nameEn: 'T-Shirts',
        slug: 'ao-thun',
        description: 'Áo thun cotton thoáng mát',
        descriptionEn: 'Breathable cotton t-shirts',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'ao-so-mi' },
      update: {},
      create: {
        name: 'Áo Sơ Mi',
        nameEn: 'Shirts',
        slug: 'ao-so-mi',
        description: 'Áo sơ mi thanh lịch',
        descriptionEn: 'Elegant shirts',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'quan-jeans' },
      update: {},
      create: {
        name: 'Quần Jeans',
        nameEn: 'Jeans',
        slug: 'quan-jeans',
        description: 'Quần jeans nam nữ',
        descriptionEn: 'Men and women jeans',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'phu-kien' },
      update: {},
      create: {
        name: 'Phụ Kiện',
        nameEn: 'Accessories',
        slug: 'phu-kien',
        description: 'Phụ kiện thời trang',
        descriptionEn: 'Fashion accessories',
      },
    }),
  ])
  console.log('Created categories:', categories.length)

  // Create Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'ao-thun-cotton-basic' },
      update: {},
      create: {
        name: 'Áo Thun Cotton Basic',
        nameEn: 'Cotton Basic T-Shirt',
        slug: 'ao-thun-cotton-basic',
        description: 'Áo thun cotton 100% cao cấp, thoáng mát, thoải mái. Phù hợp cho mọi hoàn cảnh.',
        descriptionEn: 'Premium 100% cotton t-shirt, breathable and comfortable. Suitable for all occasions.',
        material: '100% Cotton',
        materialEn: '100% Cotton',
        careGuide: 'Giặt máy nước ấm, không tẩy trắng',
        careGuideEn: 'Machine wash warm, do not bleach',
        price: 299000,
        status: 'ACTIVE',
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'ao-thun-essential' },
      update: {},
      create: {
        name: 'Áo Thun Essential',
        nameEn: 'Essential T-Shirt',
        slug: 'ao-thun-essential',
        description: 'Áo thun essential với chất liệu cotton mềm mại, basic cho everyday wear.',
        descriptionEn: 'Essential t-shirt with soft cotton material, basic for everyday wear.',
        material: '95% Cotton, 5% Spandex',
        materialEn: '95% Cotton, 5% Spandex',
        careGuide: 'Giặt máy nước lạnh',
        careGuideEn: 'Machine wash cold',
        price: 349000,
        status: 'ACTIVE',
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'ao-so-mi-trang' },
      update: {},
      create: {
        name: 'Áo Sơ Mi Trắng',
        nameEn: 'White Dress Shirt',
        slug: 'ao-so-mi-trang',
        description: 'Áo sơ mi trắng thanh lịch, phù hợp cho công sở và sự kiện.',
        descriptionEn: 'Elegant white dress shirt, suitable for office and events.',
        material: '100% Cotton',
        materialEn: '100% Cotton',
        careGuide: 'Giặt khô, ủi nhiệt độ trung bình',
        careGuideEn: 'Dry clean, medium iron',
        price: 599000,
        status: 'ACTIVE',
        categoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'ao-so-mi-xanh' },
      update: {},
      create: {
        name: 'Áo Sơ Mi Xanh Navy',
        nameEn: 'Navy Blue Shirt',
        slug: 'ao-so-mi-xanh',
        description: 'Áo sơ mi xanh navy sang trọng, form Regular Fit thoải mái.',
        descriptionEn: 'Luxury navy blue shirt, regular fit for comfort.',
        material: '100% Cotton',
        materialEn: '100% Cotton',
        careGuide: 'Giặt máy nước lạnh, phơi trong bóng râm',
        careGuideEn: 'Machine wash cold, dry in shade',
        price: 649000,
        status: 'ACTIVE',
        categoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'quan-jeans-skinny' },
      update: {},
      create: {
        name: 'Quần Jeans Skinny',
        nameEn: 'Skinny Fit Jeans',
        slug: 'quan-jeans-skinny',
        description: 'Quần jeans skinny fit ôm sát, phong cách hiện đại.',
        descriptionEn: 'Skinny fit jeans, modern style.',
        material: '98% Cotton, 2% Elastane',
        materialEn: '98% Cotton, 2% Elastane',
        careGuide: 'Giặt máy nước lạnh, không tẩy trắng',
        careGuideEn: 'Machine wash cold, do not bleach',
        price: 799000,
        status: 'ACTIVE',
        categoryId: categories[2].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'quan-jeans-regular' },
      update: {},
      create: {
        name: 'Quần Jeans Regular',
        nameEn: 'Regular Fit Jeans',
        slug: 'quan-jeans-regular',
        description: 'Quần jeans regular fit thoải mái, phù hợp mọi dáng người.',
        descriptionEn: 'Regular fit jeans, suitable for all body types.',
        material: '100% Cotton',
        materialEn: '100% Cotton',
        careGuide: 'Giặt máy nước ấm',
        careGuideEn: 'Machine wash warm',
        price: 749000,
        status: 'ACTIVE',
        categoryId: categories[2].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'non-ket-cao' },
      update: {},
      create: {
        name: 'Nón Kết Cao Cấp',
        nameEn: 'Premium Baseball Cap',
        slug: 'non-ket-cao',
        description: 'Nón kết cao cấp, che nắng hoàn hảo.',
        descriptionEn: 'Premium baseball cap, perfect sun protection.',
        material: '100% Cotton',
        materialEn: '100% Cotton',
        price: 199000,
        status: 'ACTIVE',
        categoryId: categories[3].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'that-lung-da' },
      update: {},
      create: {
        name: 'Thắt Lưng Da',
        nameEn: 'Leather Belt',
        slug: 'that-lung-da',
        description: 'Thắt lưng da cao cấp, bền đẹp theo thời gian.',
        descriptionEn: 'Premium leather belt, durable and elegant.',
        material: '100% Da Bò',
        materialEn: '100% Cow Leather',
        price: 399000,
        status: 'ACTIVE',
        categoryId: categories[3].id,
      },
    }),
  ])
  console.log('Created products:', products.length)

  // Create Homepage Sections
  // 1. ANNOUNCEMENT_BAR
  const announcementSection = await prisma.homepageSection.upsert({
    where: { slug: 'announcement-bar' },
    update: {},
    create: {
      sectionType: 'ANNOUNCEMENT_BAR',
      title: 'Free shipping on orders over 500K VND',
      slug: 'announcement-bar',
      isActive: true,
      sortOrder: 0,
    },
  })

  // Create announcement items
  await prisma.homepageSectionItem.upsert({
    where: { id: 'announcement-1' },
    update: {},
    create: {
      id: 'announcement-1',
      homepageSectionId: announcementSection.id,
      itemType: 'ANNOUNCEMENT',
      title: 'Free shipping on orders over 500K VND',
      ctaUrl: '/shipping',
      sortOrder: 0,
    },
  })
  await prisma.homepageSectionItem.upsert({
    where: { id: 'announcement-2' },
    update: {},
    create: {
      id: 'announcement-2',
      homepageSectionId: announcementSection.id,
      itemType: 'ANNOUNCEMENT',
      title: 'New collection - 20% off',
      ctaUrl: '/collections/new',
      sortOrder: 1,
    },
  })

  // 2. HERO
  const heroSection = await prisma.homepageSection.upsert({
    where: { slug: 'hero-banner' },
    update: {},
    create: {
      sectionType: 'HERO',
      title: 'New Season Arrivals',
      subtitle: 'Discover the latest fashion trends',
      slug: 'hero-banner',
      layout: 'grid',
      configJson: { overlayStyle: 'dark', textAlign: 'center' },
      isActive: true,
      sortOrder: 1,
    },
  })

  // Create hero item with local image
  await prisma.homepageSectionItem.upsert({
    where: { id: 'hero-item-1' },
    update: {},
    create: {
      id: 'hero-item-1',
      homepageSectionId: heroSection.id,
      itemType: 'MEDIA_TILE',
      title: 'New Season',
      subtitle: 'Fresh styles for you',
      mediaUrl: '/images/products/643009809_17963745309044199_7380776049816387432_n.jpg',
      mobileMediaUrl: '/images/products/643009809_17963745309044199_7380776049816387432_n.jpg',
      ctaLabel: 'Shop Now',
      ctaUrl: '/products',
      sortOrder: 0,
    },
  })

  // 3. PRODUCT_RAIL
  const productRailSection = await prisma.homepageSection.upsert({
    where: { slug: 'new-arrivals' },
    update: {},
    create: {
      sectionType: 'PRODUCT_RAIL',
      title: 'New Arrivals',
      subtitle: 'Latest additions to our collection',
      slug: 'new-arrivals',
      layout: 'grid',
      isActive: true,
      sortOrder: 2,
    },
  })

  // 4. MEDIA_TILES (Collections)
  const mediaTilesSection = await prisma.homepageSection.upsert({
    where: { slug: 'shop-collections' },
    update: {},
    create: {
      sectionType: 'MEDIA_TILES',
      title: 'Shop by Collection',
      slug: 'shop-collections',
      layout: 'grid',
      isActive: true,
      sortOrder: 3,
    },
  })

  // Create media tile items with local images
  await prisma.homepageSectionItem.upsert({
    where: { id: 'media-tile-1' },
    update: {},
    create: {
      id: 'media-tile-1',
      homepageSectionId: mediaTilesSection.id,
      itemType: 'MEDIA_TILE',
      title: 'New Arrivals',
      subtitle: 'Latest styles',
      mediaUrl: '/images/products/621587618_17959276566044199_5273857070301099679_n.jpg',
      ctaLabel: 'Explore',
      ctaUrl: '/collections/new-arrivals',
      sortOrder: 0,
    },
  })

  await prisma.homepageSectionItem.upsert({
    where: { id: 'media-tile-2' },
    update: {},
    create: {
      id: 'media-tile-2',
      homepageSectionId: mediaTilesSection.id,
      itemType: 'MEDIA_TILE',
      title: 'Best Sellers',
      subtitle: 'Most loved',
      mediaUrl: '/images/products/621201906_17959276608044199_3284918714546507646_n.jpg',
      ctaLabel: 'Explore',
      ctaUrl: '/collections/best-sellers',
      sortOrder: 1,
    },
  })

  await prisma.homepageSectionItem.upsert({
    where: { id: 'media-tile-3' },
    update: {},
    create: {
      id: 'media-tile-3',
      homepageSectionId: mediaTilesSection.id,
      itemType: 'MEDIA_TILE',
      title: 'Essentials',
      subtitle: 'Wardrobe staples',
      mediaUrl: '/images/products/652768327_17965292085044199_1049891371526429030_n.jpg',
      ctaLabel: 'Explore',
      ctaUrl: '/collections/essentials',
      sortOrder: 2,
    },
  })

  console.log('Created homepage sections')

  // Link products to PRODUCT_RAIL section (use first 4 products)
  const allProducts = await prisma.product.findMany({ take: 4 })

  // Add products to Product Rail section
  for (let i = 0; i < allProducts.length; i++) {
    await prisma.homepageSectionProduct.upsert({
      where: {
        homepageSectionId_productId: {
          homepageSectionId: productRailSection.id,
          productId: allProducts[i].id,
        },
      },
      update: { sortOrder: i },
      create: {
        homepageSectionId: productRailSection.id,
        productId: allProducts[i].id,
        sortOrder: i,
      },
    })
  }
  console.log('Linked products to sections')

  // Create Feedback
  const feedbackData = [
    {
      customerName: 'Nguyễn Văn A',
      customerRole: 'Khách hàng thân thiết',
      customerRoleEn: 'Loyal Customer',
      content: 'Sản phẩm rất chất lượng, giao hàng nhanh chóng. Tôi sẽ tiếp tục ủng hộ shop!',
      contentEn: 'Products are very high quality, fast delivery. I will continue to support the shop!',
      rating: 5,
      isFeatured: true,
      isActive: true,
    },
    {
      customerName: 'Trần Thị B',
      customerRole: 'Khách hàng mới',
      customerRoleEn: 'New Customer',
      content: 'Áo thun cotton mềm mại, mặc rất thoải mái. Giá cả hợp lý.',
      contentEn: 'Cotton t-shirt is soft and comfortable to wear. Reasonable price.',
      rating: 5,
      isFeatured: true,
      isActive: true,
    },
    {
      customerName: 'Lê Văn C',
      customerRole: 'Fashion Blogger',
      customerRoleEn: 'Fashion Blogger',
      content: 'Chất liệu vải rất tốt, may cẩn thận. Recommend cho mọi người!',
      contentEn: 'Very good fabric quality, careful sewing. Recommend to everyone!',
      rating: 5,
      isFeatured: false,
      isActive: true,
    },
  ]

  for (const fb of feedbackData) {
    await prisma.feedback.upsert({
      where: { id: fb.customerName }, // Use name as unique key for seeding
      update: {},
      create: {
        customerName: fb.customerName,
        customerRole: fb.customerRole,
        content: fb.content,
        rating: fb.rating,
        isFeatured: fb.isFeatured,
        isActive: fb.isActive,
      },
    })
  }
  console.log('Created feedback:', feedbackData.length)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
