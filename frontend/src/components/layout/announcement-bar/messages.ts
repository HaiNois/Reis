// Default MVP announcement messages — static fallback when API is unavailable
import type { AnnouncementMessage } from './types'

export const defaultMessages: AnnouncementMessage[] = [
  {
    id: 'ship',
    i18nKey: 'announcement.freeShipping',
    icon: 'truck',
    cta: {
      i18nKey: 'announcement.shopNow',
      href: '/products',
    },
  },
  {
    id: 'new',
    i18nKey: 'announcement.newCollection',
    icon: 'sparkle',
    cta: {
      i18nKey: 'announcement.discover',
      href: '/collections',
    },
  },
  {
    id: 'return',
    i18nKey: 'announcement.easyReturn',
    icon: 'shield',
  },
]
