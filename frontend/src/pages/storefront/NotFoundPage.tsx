import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useParallax } from '@/hooks/useParallax'
import { cn } from '@/lib/utils'

export default function NotFoundPage() {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const parallax = useParallax({ speed: 0.15, maxOffset: 100 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-gray-50">
      {/* Background image with parallax */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translateY(${parallax}px)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white" />
        <img
          src="/images/banners/banner.jpg"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom text-center py-20">
        {/* 404 Typography - editorial style */}
        <div className="mb-8 md:mb-12">
          <span
            className="text-[20vw] md:text-[15vw] lg:text-[12vw] font-display font-bold tracking-tight text-gray-200 select-none leading-none"
            style={{
              transform: `translateY(${scrollY * 0.05}px)`,
            }}
          >
            404
          </span>
        </div>

        {/* Message */}
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-wide mb-4">
            {lang === 'en' ? 'Page Not Found' : 'Trang Không Tồn Tại'}
          </h1>
          <p className="text-gray-500 mb-8 md:mb-10 leading-relaxed">
            {lang === 'en'
              ? 'The page you\'re looking for doesn\'t exist or has been moved.'
              : 'Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đến nơi khác.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className={cn(
                'inline-flex items-center gap-2 px-8 py-3',
                'border border-black text-black font-medium tracking-wide',
                'hover:bg-black hover:text-white transition-all duration-300'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {lang === 'en' ? 'Back to Home' : 'Về Trang Chủ'}
            </Link>

            <Link
              to="/products"
              className={cn(
                'inline-flex items-center gap-2 px-8 py-3',
                'bg-black text-white font-medium tracking-wide',
                'hover:bg-gray-800 transition-all duration-300'
              )}
            >
              {lang === 'en' ? 'Browse Products' : 'Xem Sản Phẩm'}
            </Link>
          </div>
        </div>

        {/* Decorative line */}
        <div className="mt-16 md:mt-20">
          <div className="w-px h-16 bg-gray-300 mx-auto" />
        </div>

        {/* Quick links */}
        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link to="/collections" className="hover:text-black transition-colors">
            {lang === 'en' ? 'Collections' : 'Bộ Sưu Tập'}
          </Link>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <Link to="/cart" className="hover:text-black transition-colors">
            {lang === 'en' ? 'Cart' : 'Giỏ Hàng'}
          </Link>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <Link to="/track" className="hover:text-black transition-colors">
            {lang === 'en' ? 'Track Order' : 'Theo Dõi Đơn'}
          </Link>
        </div>
      </div>
    </section>
  )
}
