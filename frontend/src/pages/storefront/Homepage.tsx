import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Product Card Component
function ProductCard({ product }: { product: { id: string; name: string; price: number; image: string } }) {
  return (
    <Link to={`/products/${product.id}`} className="product-card group">
      <div className="product-card__image">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="product-card__info">
        <h3 className="product-card__title group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
        <p className="product-card__price">
          {product.price.toLocaleString('vi-VN')} ₫
        </p>
      </div>
    </Link>
  )
}

// Collection Card Component
function CollectionCard({ title, image }: { title: string; image?: string }) {
  return (
    <Link to="/collections" className="block group">
      <div className="aspect-[4/5] overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm uppercase tracking-wider font-medium group-hover:text-gray-600 transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  )
}

export default function Homepage() {
  const { t } = useTranslation()

  // Products from local images
  const products = [
    { id: '1', name: 'Áo sơ mi linen', price: 1250000, image: '/images/products/643009809_17963745309044199_7380776049816387432_n.jpg' },
    { id: '2', name: 'Quần jeans relaxed', price: 1890000, image: '/images/products/641141062_17963745300044199_7710789955335006532_n.jpg' },
    { id: '3', name: 'Váy midi wrap', price: 2150000, image: '/images/products/625384557_17960306385044199_6704453117691993401_n.jpg' },
    { id: '4', name: 'Blazer oversize', price: 3200000, image: '/images/products/626865357_17960306367044199_6272284495024395439_n.jpg' },
    { id: '5', name: 'Cardigan knit', price: 1650000, image: '/images/products/626322684_17960306358044199_5110067743005030592_n.jpg' },
    { id: '6', name: 'Chân váy pleated', price: 1450000, image: '/images/products/622048174_17959353666044199_4518277513085328632_n.jpg' },
    { id: '7', name: 'T-shirt basic', price: 590000, image: '/images/products/652773970_17965292115044199_4178386017491887744_n.jpg' },
    { id: '8', name: 'Jumpsuit linen', price: 2750000, image: '/images/products/652756334_17965292124044199_3007955669452747268_n.jpg' },
  ]

  const collections = [
    { title: 'New Arrivals', image: '/images/products/652768327_17965292085044199_1049891371526429030_n.jpg' },
    { title: 'Best Sellers', image: '/images/products/621587618_17959276566044199_5273857070301099679_n.jpg' },
    { title: 'Essentials', image: '/images/products/621201906_17959276608044199_3284918714546507646_n.jpg' },
  ]

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gray-100">
        <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-[25/9] max-h-[700px]">
          <img
            src="/images/banners/banner.jpg"
            alt="New Season"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-wide mb-4 text-white">
                {t('home.newSeason')}
              </h1>
              <p className="text-white/80 mb-8">{t('home.shopNow')}</p>
              <Link to="/products" className="btn btn-primary">
                {t('home.shopNow')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
              {t('home.featured')}
            </h2>
            <Link to="/collections" className="text-sm uppercase tracking-wider text-gray-600 hover:text-black link-underline">
              {t('home.viewCollection')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <CollectionCard key={index} title={collection.title} image={collection.image} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-24 border-t">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
              {t('home.newArrivals')}
            </h2>
            <Link to="/products" className="text-sm uppercase tracking-wider text-gray-600 hover:text-black link-underline">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/collections" className="block group">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src="/images/products/621561089_17959227669044199_2769149982932536652_n.jpg"
                  alt={t('home.women')}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                  {t('home.women')}
                </h3>
              </div>
            </Link>
            <Link to="/collections" className="block group">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src="/images/products/621788664_17959227642044199_6141261247981617575_n.jpg"
                  alt={t('home.accessories')}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                  {t('home.accessories')}
                </h3>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}