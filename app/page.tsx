"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy, Check, Play, Pause, RotateCcw, Clock } from 'lucide-react'
import { cn } from "@/lib/utils"

type PeriodValue =
  | "5m"
  | "10m"
  | "15m"
  | "30m"
  | "1h"
  | "6h"
  | "12h"
  | "24h"
  | "2d"
  | "7d"
  | "30d"

const PERIOD_OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: "5m", label: "5 minutes" },
  { value: "10m", label: "10 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
  { value: "2d", label: "2 days" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
]

function periodToSeconds(period: PeriodValue): number {
  const m = period.match(/^(\d+)([smhd])$/) || period.match(/^(\d+)(w)$/)
  if (!m) return 24 * 60 * 60
  const amount = Number(m[1])
  const unit = m[2]
  switch (unit) {
    case "s":
      return amount
    case "m":
      return amount * 60
    case "h":
      return amount * 60 * 60
    case "d":
      return amount * 24 * 60 * 60
    case "w":
      return amount * 7 * 24 * 60 * 60
    default:
      return 24 * 60 * 60
  }
}

function pad2(n: number) {
  return n.toString().padStart(2, "0")
}

function getLocalTimeZoneAbbr(d: Date): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(d)
    const tz = parts.find((p) => p.type === "timeZoneName")?.value
    return tz ?? ""
  } catch {
    return ""
  }
}

function formatLocal(sec: number) {
  const d = new Date(sec * 1000)
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const HH = pad2(d.getHours())
  const MM = pad2(d.getMinutes())
  const SS = pad2(d.getSeconds())
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`
}

function formatUTC(sec: number) {
  const d = new Date(sec * 1000)
  const yyyy = d.getUTCFullYear()
  const mm = pad2(d.getUTCMonth() + 1)
  const dd = pad2(d.getUTCDate())
  const HH = pad2(d.getUTCHours())
  const MM = pad2(d.getUTCMinutes())
  const SS = pad2(d.getUTCSeconds())
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`
}

// Convert seconds -> value for <input type="datetime-local">
function secToLocalInput(sec: number): string {
  const d = new Date(sec * 1000)
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const HH = pad2(d.getHours())
  const MM = pad2(d.getMinutes())
  const SS = pad2(d.getSeconds())
  // datetime-local expects "YYYY-MM-DDTHH:MM[:SS]"
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`
}

// Convert value from <input type="datetime-local"> -> seconds
function localInputToSec(value: string): number | null {
  const ms = Date.parse(value) // treated as local time when no timezone suffix
  if (Number.isNaN(ms)) return null
  return Math.floor(ms / 1000)
}

function CopyButton({
  value,
  ariaLabel = "Copy to clipboard",
}: {
  value: string
  ariaLabel?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // no-op
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className="shrink-0 rounded-full border-neutral-200/80 bg-white/60 backdrop-blur hover:bg-white/80 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-900/80"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  )
}

function StatusChip({ paused }: { paused: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        "border-neutral-200 bg-white/70 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300"
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          paused ? "bg-amber-500" : "bg-emerald-500"
        )}
      />
      {paused ? "Paused" : "Live"}
    </div>
  )
}

export default function Page() {
  const [nowSec, setNowSec] = useState<number>(() => Math.floor(Date.now() / 1000))
  const [period, setPeriod] = useState<PeriodValue>("24h")
  const [paused, setPaused] = useState(false)
  const [nowInput, setNowInput] = useState<string>(() => secToLocalInput(Math.floor(Date.now() / 1000)))

  // Keep input field in sync with nowSec
  useEffect(() => {
    setNowInput(secToLocalInput(nowSec))
  }, [nowSec])

  useEffect(() => {
    if (paused) return
    setNowSec(Math.floor(Date.now() / 1000))
    const id = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [paused])

  const addSeconds = useMemo(() => periodToSeconds(period), [period])
  const futureSec = nowSec + addSeconds

  const nowDate = new Date(nowSec * 1000)
  const futureDate = new Date(futureSec * 1000)
  const nowAbbr = getLocalTimeZoneAbbr(nowDate) || "Local"
  const futureAbbr = getLocalTimeZoneAbbr(futureDate) || "Local"

  const handlePause = () => setPaused(true)
  const handleResume = () => {
    setPaused(false)
    setNowSec(Math.floor(Date.now() / 1000))
  }
  const handleReset = () => {
    setPeriod("24h")
    setPaused(false)
    setNowSec(Math.floor(Date.now() / 1000))
  }

  function handleNowInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setNowInput(v)
    const sec = localInputToSec(v)
    if (sec !== null) {
      setPaused(true) // editing base time freezes the clock
      setNowSec(sec)
    }
  }

  function handleSetToCurrent() {
    const sec = Math.floor(Date.now() / 1000)
    setNowSec(sec)
    setPaused(true) // keep frozen unless user resumes
  }

  return (
    <main
      className={cn(
        "min-h-dvh w-full",
        "bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-950"
      )}
    >
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
              <Clock className="h-5 w-5 text-neutral-800 dark:text-neutral-200" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                UNIX Time Helper
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Clean, precise timestamps with future offsets.
              </p>
            </div>
          </div>
          <StatusChip paused={paused} />
        </div>

        {/* Toolbar */}
        <div
          className={cn(
            "mb-6 grid items-center gap-4 rounded-2xl border p-4 sm:grid-cols-[1fr_auto]",
            "border-neutral-200 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60",
            "dark:border-neutral-800 dark:bg-neutral-900/50"
          )}
        >
          {/* Left: controls for period and base time */}
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <Label
                htmlFor="period"
                className="text-neutral-600 dark:text-neutral-300"
              >
                Add period
              </Label>
              <div className="relative">
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as PeriodValue)}
                  className={cn(
                    "h-10 w-full appearance-none rounded-xl border bg-transparent px-3 pr-9 text-sm",
                    "border-neutral-200 text-neutral-900 shadow-sm ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
                    "dark:border-neutral-800 dark:bg-transparent dark:text-neutral-100 dark:focus-visible:ring-neutral-700"
                  )}
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
                  {"▾"}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <Label
                htmlFor="base-time"
                className="text-neutral-600 dark:text-neutral-300"
              >
                Base time
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="base-time"
                  type="datetime-local"
                  step="1"
                  value={nowInput}
                  onChange={handleNowInputChange}
                  className={cn(
                    "h-10 w-full rounded-xl border bg-transparent px-3 text-sm",
                    "border-neutral-200 text-neutral-900 shadow-sm ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
                    "dark:border-neutral-800 dark:bg-transparent dark:text-neutral-100 dark:focus-visible:ring-neutral-700"
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetToCurrent}
                  className="rounded-full border-neutral-200 bg-white/70 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-900"
                >
                  Now
                </Button>
              </div>
            </div>
          </div>

          {/* Right: playback controls */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              onClick={handlePause}
              variant="secondary"
              disabled={paused}
              className="rounded-full border border-neutral-200 bg-white/70 text-neutral-900 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100"
            >
              <Pause className="mr-2 h-4 w-4" aria-hidden="true" />
              Pause
            </Button>
            <Button
              onClick={handleResume}
              disabled={!paused}
              className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Play className="mr-2 h-4 w-4" aria-hidden="true" />
              Resume
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="rounded-full border-neutral-200 bg-white/70 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-900"
            >
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={cn(
              "rounded-2xl border-neutral-200 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60",
              "dark:border-neutral-800 dark:bg-neutral-900/50"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Now
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
                  {nowSec}
                </div>
                <CopyButton value={String(nowSec)} ariaLabel="Copy current UNIX timestamp" />
              </div>
              <div className="space-y-1.5">
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  {getLocalTimeZoneAbbr(new Date(nowSec * 1000)) || "Local"}: {formatLocal(nowSec)}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  UTC: {formatUTC(nowSec)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "rounded-2xl border-neutral-200 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60",
              "dark:border-neutral-800 dark:bg-neutral-900/50"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Future
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
                  {futureSec}
                </div>
                <CopyButton value={String(futureSec)} ariaLabel="Copy future UNIX timestamp" />
              </div>
              <div className="space-y-1.5">
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  {getLocalTimeZoneAbbr(new Date(futureSec * 1000)) || "Local"}: {formatLocal(futureSec)}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  UTC: {formatUTC(futureSec)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
          UNIX timestamps shown are seconds since 1970-01-01 (UTC).
        </p>
      </div>
    </main>
  )
}
