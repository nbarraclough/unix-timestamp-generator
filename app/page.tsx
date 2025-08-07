"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy, Check, Play, Pause, RotateCcw } from 'lucide-react'

type PeriodValue = "5m" | "10m" | "15m" | "30m" | "1h" | "6h" | "12h" | "24h" | "2d" | "7d" | "30d"

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
    const tz = parts.find(p => p.type === "timeZoneName")?.value
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
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // no-op: clipboard might be blocked
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className="shrink-0"
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  )
}

export default function Page() {
  const [nowSec, setNowSec] = useState<number>(() => Math.floor(Date.now() / 1000))
  const [period, setPeriod] = useState<PeriodValue>("24h")
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    // sync immediately on (re)start
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
  const nowAbbr = getLocalTimeZoneAbbr(nowDate)
  const futureAbbr = getLocalTimeZoneAbbr(futureDate)

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

  return (
    <main className="min-h-dvh w-full flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">UNIX Time Helper</h1>
          <p className="text-sm text-muted-foreground">
            Shows the current UNIX timestamp and a future timestamp based on a selected period.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={handlePause} variant="secondary" disabled={paused}>
            <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
            Pause
          </Button>
          <Button onClick={handleResume} disabled={!paused}>
            <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            Resume
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reset
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current UNIX time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-mono tracking-tight" aria-live="polite" aria-atomic="true">
                {nowSec}
              </div>
              <CopyButton value={String(nowSec)} ariaLabel="Copy current UNIX timestamp" />
            </div>
            <div className="text-sm text-muted-foreground">
              {nowAbbr || "Local"}: {formatLocal(nowSec)}
            </div>
            <div className="text-sm text-muted-foreground">
              UTC: {formatUTC(nowSec)}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-[300px_1fr] items-start">
          <div className="space-y-2">
            <Label htmlFor="period">Select period to add</Label>
            <select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodValue)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground">
              Currently adding {addSeconds.toLocaleString()} seconds.
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Future UNIX time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-mono tracking-tight" aria-live="polite" aria-atomic="true">
                  {futureSec}
                </div>
                <CopyButton value={String(futureSec)} ariaLabel="Copy future UNIX timestamp" />
              </div>
              <div className="text-sm text-muted-foreground">
                {futureAbbr || "Local"}: {formatLocal(futureSec)}
              </div>
              <div className="text-sm text-muted-foreground">
                UTC: {formatUTC(futureSec)}
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="text-xs text-muted-foreground text-center">
          UNIX timestamps shown here are in seconds since 1970-01-01 UTC.
        </footer>
      </div>
    </main>
  )
}
