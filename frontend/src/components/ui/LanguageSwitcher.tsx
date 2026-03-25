import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'vi', label: 'VI' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:text-gray-600 text-sm font-medium"
      >
        {currentLang.label}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 bg-white border border-gray-200 shadow-lg z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  lang.code === i18n.language ? 'font-medium' : ''
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}