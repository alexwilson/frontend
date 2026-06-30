import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns"
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  TimelineLevel,
  activeRange,
  bucketKey,
  buildBuckets,
  detectLevels,
  isActive,
} from "./timeline-scroll.logic"

const LEVEL_LABEL: Record<TimelineLevel, string> = {
  day: "Days",
  month: "Months",
  year: "Years",
}

// Monday-first weekday headers for the day grid.
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

type DaySlot = { day: Date } | { blank: string }

const plural = (n: number) => `${n} ${n === 1 ? "item" : "items"}`

export type TimelineScrollProps = {
  /** Every date that has content. Bucketed by the active level. */
  dates: Date[]
  /** The slice currently on screen as [oldest, newest]; its cells are highlighted. */
  visibleRange?: [Date, Date] | null
  /** A cell was clicked — jump the host's scroll to content at this date. */
  onJump: (date: Date) => void
  /** Zoom levels to offer. Omit to auto-detect from the content (days always,
   *  months/years once it spans more than one). */
  levels?: TimelineLevel[]
  /** Controlled active level; omit to let the component manage it. */
  level?: TimelineLevel
  defaultLevel?: TimelineLevel
  onLevelChange?: (level: TimelineLevel) => void
  /** Skip layout/paint for off-screen month sections (content-visibility) so
   *  large collections scroll smoothly. Defaults to true. */
  virtualize?: boolean
  className?: string
}

export default function TimelineScroll({
  dates,
  visibleRange = null,
  onJump,
  levels: levelsProp,
  level: controlledLevel,
  defaultLevel,
  onLevelChange,
  virtualize = true,
  className,
}: TimelineScrollProps) {
  // Without an explicit list, offer only the levels the content fills.
  const levels = useMemo(() => levelsProp ?? detectLevels(dates), [levelsProp, dates])
  const [internalLevel, setInternalLevel] = useState<TimelineLevel>(
    defaultLevel ?? levels[0],
  )
  const requestedLevel = controlledLevel ?? internalLevel
  // Guard against an active level the current content no longer offers.
  const level = levels.includes(requestedLevel) ? requestedLevel : levels[0]
  const changeLevel = (next: TimelineLevel) => {
    if (controlledLevel === undefined) setInternalLevel(next)
    onLevelChange?.(next)
  }

  const buckets = useMemo(() => buildBuckets(dates, level), [dates, level])
  const counts = useMemo(
    () => new Map(buckets.map((b) => [b.key, b.count])),
    [buckets],
  )
  const maxCount = useMemo(
    () => buckets.reduce((max, b) => Math.max(max, b.count), 0),
    [buckets],
  )

  const range = useMemo(() => activeRange(visibleRange, level), [visibleRange, level])

  // Keep the highlighted span centred as the feed moves. The newest cell (hi)
  // sits at the top of the rail, the oldest (lo) below it; we recentre on the
  // midpoint so a range spread across weeks or months stays framed.
  const bodyRef = useRef<HTMLDivElement>(null)
  const hiRef = useRef<HTMLButtonElement>(null)
  const loRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const body = bodyRef.current
    const hi = hiRef.current
    if (!body || !hi) return
    const lo = loRef.current ?? hi
    const bodyRect = body.getBoundingClientRect()
    const spanCenter = (hi.getBoundingClientRect().top + lo.getBoundingClientRect().bottom) / 2
    body.scrollTop += spanCenter - (bodyRect.top + bodyRect.height / 2)
  }, [range?.lo, range?.hi])

  // Render one cell for a date at the active level: an interactive, shaded cell
  // when it has content, otherwise a muted placeholder.
  const cell = (date: Date, label: string) => {
    const key = bucketKey(date, level)
    const count = counts.get(key) ?? 0
    if (count === 0) {
      return (
        <span
          key={key}
          className="alex-timeline-scroll__cell alex-timeline-scroll__cell--empty"
        >
          {label}
        </span>
      )
    }
    const active = isActive(key, range)
    const intensity = maxCount > 0 ? 0.1 + 0.35 * (count / maxCount) : 0
    return (
      <button
        key={key}
        ref={key === range?.hi ? hiRef : key === range?.lo ? loRef : undefined}
        type="button"
        className={`alex-timeline-scroll__cell alex-timeline-scroll__cell--filled${
          active ? " alex-timeline-scroll__cell--active" : ""
        }`}
        aria-current={active ? "true" : undefined}
        aria-label={`${format(date, ariaFormat(level))} — ${plural(count)}`}
        onClick={() => onJump(date)}
      >
        <span className="alex-timeline-scroll__fill" style={{ opacity: intensity }} />
        <span className="alex-timeline-scroll__num">{label}</span>
      </button>
    )
  }

  const newest = buckets[0]?.date
  const oldest = buckets[buckets.length - 1]?.date

  let body: React.ReactNode = null
  if (newest && oldest && level === "day") {
    // One sticky weekday header for the whole scroll (every month aligns to the
    // same Monday-first columns), then the months flow continuously beneath it.
    body = (
      <>
        <div className="alex-timeline-scroll__weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day} className="alex-timeline-scroll__weekday">
              {day}
            </span>
          ))}
        </div>
        {descendingMonths(newest, oldest).map((month) => {
          const lead = (getDay(month) + 6) % 7 // Monday-first offset
          const days = eachDayOfInterval({ start: month, end: endOfMonth(month) })
          // Pad to whole weeks, then reverse the week order so the most recent
          // week sits at the top — matching the feed's newest-first direction.
          const slots: DaySlot[] = [
            ...Array.from({ length: lead }, (_, i): DaySlot => ({ blank: `lead-${i}` })),
            ...days.map((day): DaySlot => ({ day })),
          ]
          const trailing = (7 - (slots.length % 7)) % 7
          for (let i = 0; i < trailing; i++) slots.push({ blank: `trail-${i}` })
          const weeks: DaySlot[][] = []
          for (let i = 0; i < slots.length; i += 7) weeks.push(slots.slice(i, i + 7))
          weeks.reverse()
          return (
            <section key={month.toISOString()} className="alex-timeline-scroll__section">
              <h3 className="alex-timeline-scroll__heading">{format(month, "MMMM yyyy")}</h3>
              <div className="alex-timeline-scroll__grid alex-timeline-scroll__grid--days">
                {weeks.flat().map((slot) =>
                  "day" in slot ? (
                    cell(slot.day, String(slot.day.getDate()))
                  ) : (
                    <span key={slot.blank} className="alex-timeline-scroll__cell--blank" />
                  ),
                )}
              </div>
            </section>
          )
        })}
      </>
    )
  } else if (newest && oldest && level === "month") {
    body = descendingYears(newest, oldest).map((year) => (
      <section key={year.toISOString()} className="alex-timeline-scroll__section">
        <h3 className="alex-timeline-scroll__heading">{format(year, "yyyy")}</h3>
        <div className="alex-timeline-scroll__grid alex-timeline-scroll__grid--months">
          {Array.from({ length: 12 }, (_, i) => {
            const month = addMonths(year, 11 - i) // Dec → Jan, newest first
            return cell(month, format(month, "MMM"))
          })}
        </div>
      </section>
    ))
  } else if (newest && oldest) {
    body = (
      <div className="alex-timeline-scroll__grid alex-timeline-scroll__grid--years">
        {descendingYears(newest, oldest).map((year) => cell(year, format(year, "yyyy")))}
      </div>
    )
  }

  if (buckets.length === 0) return null

  const classes = [
    "alex-timeline-scroll",
    virtualize && "alex-timeline-scroll--virtualized",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <nav className={classes} aria-label="Calendar">
      {levels.length > 1 && (
        <div className="alex-timeline-scroll__levels" role="group" aria-label="Zoom level">
          {levels.map((option) => (
            <button
              key={option}
              type="button"
              className={`alex-timeline-scroll__level${
                option === level ? " alex-timeline-scroll__level--active" : ""
              }`}
              aria-pressed={option === level}
              onClick={() => changeLevel(option)}
            >
              {LEVEL_LABEL[option]}
            </button>
          ))}
        </div>
      )}
      <div ref={bodyRef} className="alex-timeline-scroll__body">{body}</div>
    </nav>
  )
}

const ariaFormat = (level: TimelineLevel): string =>
  level === "day" ? "d MMMM yyyy" : level === "month" ? "MMMM yyyy" : "yyyy"

// Month starts from newest to oldest, inclusive — to mirror a reverse-chron feed.
const descendingMonths = (newest: Date, oldest: Date): Date[] => {
  const months: Date[] = []
  const last = startOfMonth(oldest).getTime()
  for (let m = startOfMonth(newest); m.getTime() >= last; m = subMonths(m, 1)) {
    months.push(m)
  }
  return months
}

const descendingYears = (newest: Date, oldest: Date): Date[] => {
  const years: Date[] = []
  const last = startOfYear(oldest).getTime()
  for (let y = startOfYear(newest); y.getTime() >= last; y = subYears(y, 1)) {
    years.push(y)
  }
  return years
}
