"use client"

import { useTranslation } from "react-i18next"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi"
    i18n.changeLanguage(newLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="text-sm font-medium hover:underline"
    >
      {i18n.language === "vi" ? "EN" : "VI"}
    </button>
  )
}

export default LanguageSwitcher
