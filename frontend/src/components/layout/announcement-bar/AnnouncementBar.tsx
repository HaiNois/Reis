// Main AnnouncementBar orchestrator — supports slider, static, and marquee modes
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAnnouncementRotation, useDismissibleBar } from './hooks'
import AnnouncementCloseButton from './AnnouncementCloseButton'
import AnnouncementSlide from './AnnouncementSlide'
import type { AnnouncementBarProps } from './types'

// CSS variable-based variant classes for dark mode compatibility
const VARIANT_CLASSES: Record<string, string> = {
  dark: 'bg-foreground text-background',
  light: 'bg-muted text-foreground',
  accent: 'bg-primary text-primary-foreground',
}

const DEFAULT_STORAGE_KEY = 'reis_announcement_dismissed_v1'

export default function AnnouncementBar({
  messages,
  mode = 'slider',
  variant = 'dark',
  autoplayInterval = 5000,
  pauseOnHover = true,
  dismissible = true,
  storageKey = DEFAULT_STORAGE_KEY,
  className,
}: AnnouncementBarProps) {
  const { t } = useTranslation()

  const { isDismissed, dismiss } = useDismissibleBar(storageKey)

  const { currentIndex, setHovered, prefersReducedMotion } = useAnnouncementRotation({
    count: messages.length,
    interval: autoplayInterval,
    pauseOnHover,
  })

  // Render nothing if dismissed or no messages
  if (isDismissed || messages.length === 0) return null

  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.dark

  // ----- MARQUEE mode -----
  if (mode === 'marquee') {
    // Duplicate messages to create seamless loop; skip animation if reduced motion
    const combined = [...messages, ...messages]

    return (
      <div
        role="region"
        aria-label={t('announcement.label')}
        className={cn(
          'relative w-full overflow-hidden border-b h-9 md:h-10 text-[11px] md:text-[12px] font-light tracking-[0.18em] uppercase flex items-center',
          variantClass,
          className
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Scrolling track — duplicated for seamless loop */}
        <div
          className={cn(
            'flex gap-16 whitespace-nowrap',
            !prefersReducedMotion && 'animate-marquee'
          )}
          aria-live="off"
          aria-atomic="true"
        >
          {combined.map((msg, idx) => (
            <AnnouncementSlide key={`${msg.id}-${idx}`} message={msg} />
          ))}
        </div>

        {/* Dismiss button */}
        {dismissible && <AnnouncementCloseButton onClick={dismiss} />}
      </div>
    )
  }

  // ----- STATIC mode -----
  if (mode === 'static') {
    return (
      <div
        role="region"
        aria-label={t('announcement.label')}
        className={cn(
          'relative w-full overflow-hidden border-b h-9 md:h-10 text-[11px] md:text-[12px] font-light tracking-[0.18em] uppercase flex items-center justify-center',
          variantClass,
          className
        )}
      >
        <div aria-live="polite" aria-atomic="true">
          <AnnouncementSlide message={messages[0]} />
        </div>

        {dismissible && <AnnouncementCloseButton onClick={dismiss} />}
      </div>
    )
  }

  // ----- SLIDER mode (default) -----
  return (
    <div
      role="region"
      aria-label={t('announcement.label')}
      className={cn(
        'relative w-full overflow-hidden border-b h-9 md:h-10 text-[11px] md:text-[12px] font-light tracking-[0.18em] uppercase flex items-center justify-center transition-all',
        variantClass,
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Crossfade slides */}
      <div className="relative flex items-center justify-center w-full px-8">
        {messages.map((message, index) => (
          <div
            key={message.id}
            aria-hidden={index !== currentIndex}
            className={cn(
              'transition-opacity duration-500 absolute inset-0 flex items-center justify-center',
              index === currentIndex
                ? 'opacity-100 animate-announcement-fade'
                : 'opacity-0 pointer-events-none'
            )}
          >
            <div aria-live={index === currentIndex ? 'polite' : 'off'} aria-atomic="true">
              <AnnouncementSlide message={message} />
            </div>
          </div>
        ))}

        {/* Invisible spacer to maintain height */}
        <span className="invisible" aria-hidden="true">
          <AnnouncementSlide message={messages[currentIndex]} />
        </span>
      </div>

      {/* Navigation dots — only when multiple messages and not reduced motion */}
      {messages.length > 1 && !prefersReducedMotion && (
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
          role="tablist"
          aria-label="Announcement messages"
        >
          {messages.map((msg, idx) => (
            <button
              key={msg.id}
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Message ${idx + 1}`}
              className={cn(
                'w-1 h-1 rounded-full transition-all duration-300',
                idx === currentIndex
                  ? 'bg-current opacity-80 w-3'
                  : 'bg-current opacity-30'
              )}
            />
          ))}
        </div>
      )}

      {/* Dismiss button */}
      {dismissible && <AnnouncementCloseButton onClick={dismiss} />}
    </div>
  )
}
