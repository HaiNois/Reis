// Announcement bar type definitions

export type AnnouncementVariant = 'dark' | 'light' | 'accent'
export type AnnouncementMode = 'slider' | 'static' | 'marquee'

export type AnnouncementIcon = 'truck' | 'gift' | 'sparkle' | 'shield' | 'tag' | 'clock'

export interface AnnouncementCta {
  // Either provide an i18nKey for translation, or direct text per language
  i18nKey?: string
  text?: { vi: string; en: string }
  href: string
  external?: boolean
}

export interface AnnouncementMessage {
  id: string
  // Either provide an i18nKey for translation, or direct text per language (CMS-driven)
  i18nKey?: string
  text?: { vi: string; en: string }
  icon?: AnnouncementIcon
  cta?: AnnouncementCta
}

export interface AnnouncementBarProps {
  messages: AnnouncementMessage[]
  mode?: AnnouncementMode
  variant?: AnnouncementVariant
  autoplayInterval?: number
  pauseOnHover?: boolean
  dismissible?: boolean
  storageKey?: string
  className?: string
}
