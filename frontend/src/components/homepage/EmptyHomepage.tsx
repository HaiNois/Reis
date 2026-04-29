import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Editorial empty state shown when both homepageSections and feedback are empty.
 * Styled to match the brand aesthetic: serif light heading, eyebrow italic tracking, CTA button.
 */
export default function EmptyHomepage() {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'

  const eyebrow = lang === 'en' ? 'Explore' : 'Khám phá'
  const heading = lang === 'en' ? 'Coming Soon' : 'Sắp Có Mới'
  const cta = lang === 'en' ? 'Shop Now' : 'Mua Ngay'

  return (
    <section className="py-32 md:py-40 text-center flex flex-col items-center justify-center min-h-[60vh]">
      {/* Eyebrow */}
      <p className="text-gray-500 italic uppercase tracking-[0.25em] text-sm mb-4 font-serif">
        {eyebrow}
      </p>

      {/* Heading — serif light, large */}
      <h1 className="font-serif font-light text-5xl md:text-6xl lg:text-7xl tracking-wide text-gray-900 mb-8">
        {heading}
      </h1>

      {/* Thin divider — editorial detail */}
      <div className="w-12 border-t border-gray-300 mb-8" />

      {/* CTA */}
      <Link
        to="/products"
        className="inline-block px-10 py-3 border border-black text-black text-sm font-medium tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-300"
      >
        {cta}
      </Link>
    </section>
  )
}
