// Smart container: fetches active messages from API, falls back to defaultMessages
import { useEffect, useState } from 'react'
import { announcementApi, type AnnouncementMessageEntity } from '@/services/announcementApi'
import AnnouncementBar from './AnnouncementBar'
import { defaultMessages } from './messages'
import type { AnnouncementBarProps, AnnouncementMessage, AnnouncementIcon } from './types'

const VALID_ICONS: AnnouncementIcon[] = [
  'truck',
  'gift',
  'sparkle',
  'shield',
  'tag',
  'clock',
]

function isValidIcon(value: string | null): value is AnnouncementIcon {
  return value !== null && (VALID_ICONS as string[]).includes(value)
}

function entityToMessage(entity: AnnouncementMessageEntity): AnnouncementMessage {
  const message: AnnouncementMessage = {
    id: entity.id,
    text: { vi: entity.textVi, en: entity.textEn },
  }

  if (entity.icon && isValidIcon(entity.icon)) {
    message.icon = entity.icon
  }

  if (entity.ctaHref && (entity.ctaTextVi || entity.ctaTextEn)) {
    const isExternal = /^https?:\/\//i.test(entity.ctaHref)
    message.cta = {
      href: entity.ctaHref,
      external: isExternal,
      text: {
        vi: entity.ctaTextVi || entity.ctaTextEn || '',
        en: entity.ctaTextEn || entity.ctaTextVi || '',
      },
    }
  }

  return message
}

type ContainerProps = Omit<AnnouncementBarProps, 'messages'> & {
  fallbackMessages?: AnnouncementMessage[]
}

export default function AnnouncementBarContainer({
  fallbackMessages = defaultMessages,
  ...rest
}: ContainerProps) {
  const [messages, setMessages] = useState<AnnouncementMessage[]>(fallbackMessages)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    announcementApi
      .getPublicMessages()
      .then((entities) => {
        if (cancelled) return
        if (Array.isArray(entities) && entities.length > 0) {
          setMessages(entities.map(entityToMessage))
        }
      })
      .catch(() => {
        // Silent fail — keep fallbackMessages
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Avoid flash of fallback content before API resolves on first paint when there is no fallback
  if (!loaded && messages.length === 0) return null

  return <AnnouncementBar messages={messages} {...rest} />
}
