// Renders a single announcement message with optional icon and CTA
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Truck,
  Gift,
  Sparkles,
  ShieldCheck,
  Tag,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { AnnouncementMessage, AnnouncementIcon } from './types'

// Map icon key → Lucide component
const ICON_MAP: Record<AnnouncementIcon, LucideIcon> = {
  truck: Truck,
  gift: Gift,
  sparkle: Sparkles,
  shield: ShieldCheck,
  tag: Tag,
  clock: Clock,
}

interface AnnouncementSlideProps {
  message: AnnouncementMessage
}

export default function AnnouncementSlide({ message }: AnnouncementSlideProps) {
  const { t, i18n } = useTranslation()

  const IconComponent = message.icon ? ICON_MAP[message.icon] : null

  // Resolve text: prefer direct text (CMS-driven) over i18nKey (hardcoded)
  const lang = i18n.language?.startsWith('en') ? 'en' : 'vi'
  const messageText = message.text
    ? message.text[lang] || message.text.vi
    : message.i18nKey
      ? t(message.i18nKey)
      : ''

  const ctaText = message.cta
    ? message.cta.text
      ? message.cta.text[lang] || message.cta.text.vi
      : message.cta.i18nKey
        ? t(message.cta.i18nKey)
        : ''
    : ''

  return (
    <span className="flex items-center justify-center gap-2.5">
      {/* Icon */}
      {IconComponent && (
        <IconComponent className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
      )}

      {/* Message text */}
      <span>{messageText}</span>

      {/* Inline CTA */}
      {message.cta && ctaText && (
        <>
          <span aria-hidden="true" className="opacity-40">|</span>
          {message.cta.external ? (
            <a
              href={message.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {ctaText}
            </a>
          ) : (
            <Link
              to={message.cta.href}
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {ctaText}
            </Link>
          )}
        </>
      )}
    </span>
  )
}
