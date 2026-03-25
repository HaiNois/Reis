import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-white border-t">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-display font-bold tracking-wider mb-4">FASHION</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md">
              Chúng tôi mang đến những bộ sưu tập thời trang premium, tinh tế và đẳng cấp cho phong cách của bạn.
            </p>
            <div className="mb-8">
              <h4 className="text-sm font-medium uppercase tracking-wider mb-3">
                {t('footer.newsletter')}
              </h4>
              <p className="text-sm text-gray-500 mb-4">{t('footer.newsletterDesc')}</p>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder={t('footer.emailPlaceholder')}
                  className="flex-1 px-4 py-3 border border-gray-200 focus:border-black focus:outline-none text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-gray-800"
                >
                  {t('footer.subscribe')}
                </button>
              </form>
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4">
              {t('footer.customerCare')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/shipping" className="text-gray-600 hover:text-black">Vận chuyển</Link></li>
              <li><Link to="/returns" className="text-gray-600 hover:text-black">Đổi trả</Link></li>
              <li><Link to="/faq" className="text-gray-600 hover:text-black">FAQ</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-black">Liên hệ</Link></li>
              <li><Link to="/size-guide" className="text-gray-600 hover:text-black">Hướng dẫn size</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4">
              {t('footer.aboutUs')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="text-gray-600 hover:text-black">Về chúng tôi</Link></li>
              <li><Link to="/stores" className="text-gray-600 hover:text-black">Cửa hàng</Link></li>
              <li><Link to="/careers" className="text-gray-600 hover:text-black">Tuyển dụng</Link></li>
              <li><Link to="/press" className="text-gray-600 hover:text-black">Báo chí</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; 2024 Fashion. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-600 hover:text-black">Privacy</a>
            <a href="#" className="text-sm text-gray-600 hover:text-black">Terms</a>
            <a href="#" className="text-sm text-gray-600 hover:text-black">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}