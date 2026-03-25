import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function Header() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { items } = useCartStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { to: '/products', label: t('header.products') },
    { to: '/collections', label: t('header.collections') },
    { to: '/about', label: t('header.about') },
    { to: '/contact', label: t('header.contact') },
  ]

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b transition-all duration-300 ${
        isScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container-custom">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'h-14 md:h-16' : 'h-16 md:h-20'
          }`}
        >
          {/* Left: Toggle Button */}
          <div className="flex items-center">
            {/* Toggle Button */}
            <button
              className="p-2 -ml-2 mr-2"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Menu Links - Desktop: fade show/hide */}
            <div
              className={`hidden lg:block overflow-hidden transition-all duration-300 ease-out ${
                isMenuOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <nav className="flex items-center gap-4 md:gap-6 whitespace-nowrap">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-xs md:text-sm uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Center: Logo */}
          <Link
            to="/"
            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ${
              isScrolled ? 'h-10 md:h-12' : 'h-12 md:h-14'
            }`}
          >
            <img
              src="/images/logo/logo.png"
              alt="FASHION"
              className="h-full w-auto object-contain"
            />
          </Link>

          {/* Right: Search + Language + Account + Cart */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Search */}
            <button className="p-2 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Account */}
            {isAuthenticated ? (
              <Link to="/account" className="p-2 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            ) : (
              <Link to="/login" className="p-2 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-medium rounded-none flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Slide from left, full screen overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer - Left side */}
        <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm uppercase tracking-wider font-medium">Menu</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-lg uppercase tracking-wider font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6" />

            {/* Account */}
            {isAuthenticated ? (
              <div className="flex flex-col gap-4">
                <Link
                  to="/account"
                  className="text-base uppercase tracking-wider"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('account.profile')}
                </Link>
                <Link
                  to="/account/orders"
                  className="text-base uppercase tracking-wider"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('account.orders')}
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-base uppercase tracking-wider font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}