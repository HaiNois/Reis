// Close/dismiss button for the AnnouncementBar
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AnnouncementCloseButtonProps {
  onClick: () => void
}

export default function AnnouncementCloseButton({ onClick }: AnnouncementCloseButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      aria-label={t('announcement.close')}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
    >
      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
  )
}
