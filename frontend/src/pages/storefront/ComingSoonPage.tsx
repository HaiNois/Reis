import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useParallax } from '@/hooks/useParallax'
import { cn } from '@/lib/utils'

interface ComingSoonProps {
  title?: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  launchDate?: string
  backgroundImage?: string
}

export default function ComingSoonPage({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  launchDate,
  backgroundImage = '/images/banners/banner.jpg',
}: ComingSoonProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const leftParallax = useParallax({ speed: 0.2, maxOffset: 80 })
  const rightParallax = useParallax({ speed: 0.1, maxOffset: 40 })

  const displayTitle = lang === 'en' && titleEn ? titleEn : title
  const displaySubtitle = lang === 'en' && subtitleEn ? subtitleEn : subtitle

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Default to 30 days from now if no launch date
    const targetDate = launchDate
      ? new Date(launchDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [launchDate])

  // Newsletter form
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setSubscribed(true)
      setLoading(false)
    }, 1000)
  }

  return (
    <section className="relative min-h-[80vh] md:min-h-screen flex items-center bg-gray-50 overflow-hidden">
      {/* Split layout: Left 50% image, Right 50% content */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
        {/* Left side - Image with parallax */}
        <div
          className="relative h-[40vh] md:h-screen will-change-transform"
          style={{ transform: `translateY(${leftParallax}px)` }}
        >
          <img
            src={backgroundImage}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Right side - Content */}
        <div
          className="relative flex items-center justify-center p-8 md:p-16 lg:p-20 will-change-transform"
          style={{ transform: `translateY(${rightParallax}px)` }}
        >
          <div className="max-w-md w-full">
            {/* Eyebrow */}
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-4 md:mb-6">
              {lang === 'en' ? 'Coming Soon' : 'Sắp Ra Mắt'}
            </p>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-wide mb-4 md:mb-6">
              {displayTitle || (lang === 'en' ? 'Something New is Coming' : 'Điều Mới Đang Đến')}
            </h1>

            {/* Subtitle */}
            <p className="text-gray-500 mb-8 md:mb-10 leading-relaxed">
              {displaySubtitle ||
                (lang === 'en'
                  ? 'We\'re working on something exciting. Stay tuned for the launch.'
                  : 'Chúng tôi đang chuẩn bị điều gì đó thú vị. Hãy theo dõi để không bỏ lỡ.')}
            </p>

            {/* Countdown Timer */}
            <div className="mb-10 md:mb-12">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-4">
                {lang === 'en' ? 'Launching in' : 'Ra mắt trong'}
              </p>
              <div className="flex gap-4 md:gap-6">
                {[
                  { value: timeLeft.days, label: lang === 'en' ? 'Days' : 'Ngày' },
                  { value: timeLeft.hours, label: lang === 'en' ? 'Hours' : 'Giờ' },
                  { value: timeLeft.minutes, label: lang === 'en' ? 'Minutes' : 'Phút' },
                  { value: timeLeft.seconds, label: lang === 'en' ? 'Seconds' : 'Giây' },
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2">
                      <span className="text-xl md:text-2xl font-bold font-display">
                        {String(item.value).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="mb-8">
                <p className="text-sm text-gray-500 mb-3">
                  {lang === 'en'
                    ? 'Get notified when we launch:'
                    : 'Nhận thông báo khi ra mắt:'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang === 'en' ? 'Enter your email' : 'Nhập email của bạn'}
                    className={cn(
                      'flex-1 px-4 py-3 border border-gray-200 rounded-lg',
                      'text-sm focus:outline-none focus:border-black transition-colors',
                      'placeholder:text-gray-400'
                    )}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'px-6 py-3 bg-black text-white text-sm font-medium tracking-wide',
                      'hover:bg-gray-800 transition-colors disabled:opacity-50',
                      'rounded-lg'
                    )}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      (lang === 'en' ? 'Notify Me' : 'Thông Báo')
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-700">
                  {lang === 'en'
                    ? 'Thank you! We\'ll notify you when we launch.'
                    : 'Cảm ơn bạn! Chúng tôi sẽ thông báo khi ra mắt.'}
                </p>
              </div>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.1em] text-gray-400">
                {lang === 'en' ? 'Follow us' : 'Theo dõi chúng tôi'}
              </span>
              <div className="flex gap-3">
                {[
                  { label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                  { label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                  { label: 'TikTok', icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.36V13.5a8.27 8.27 0 005.58 2.13V9.39a4.85 4.85 0 01-1-.7z' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300"
                    aria-label={social.label}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Back to home */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {lang === 'en' ? 'Back to Home' : 'Về Trang Chủ'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
