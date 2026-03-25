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
            <h3 className="text-xl font-display font-bold tracking-wider mb-4">
              {t('footer.brand')}
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md">
              {t('footer.description')}
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
              <li><Link to="/shipping" className="text-gray-600 hover:text-black">{t('footer.shipping')}</Link></li>
              <li><Link to="/returns" className="text-gray-600 hover:text-black">{t('footer.returns')}</Link></li>
              <li><Link to="/faq" className="text-gray-600 hover:text-black">{t('footer.faq')}</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-black">{t('footer.contact')}</Link></li>
              <li><Link to="/size-guide" className="text-gray-600 hover:text-black">{t('footer.sizeGuide')}</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4">
              {t('footer.aboutUs')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="text-gray-600 hover:text-black">{t('footer.about')}</Link></li>
              <li><Link to="/stores" className="text-gray-600 hover:text-black">{t('footer.stores')}</Link></li>
              <li><Link to="/careers" className="text-gray-600 hover:text-black">{t('footer.careers')}</Link></li>
              <li><Link to="/press" className="text-gray-600 hover:text-black">{t('footer.press')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            {t('footer.copyright')}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-600 hover:text-black">{t('footer.privacy')}</a>
            <a href="#" className="text-sm text-gray-600 hover:text-black">{t('footer.terms')}</a>
            <a href="#" className="text-sm text-gray-600 hover:text-black">{t('footer.cookies')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}