"use client"

import { FormEvent, useRef, useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import type { PhraseAnnotation, SongAnalysis, SongAnalysisLine } from "@/lib/song-analysis-types"
import { ArrowUpRight, Loader2, Music2, RefreshCw } from "lucide-react"

type AnalysisResponse = {
  analysis?: SongAnalysis
  reused?: boolean
  unsaved?: boolean
  warning?: string
  error?: string
}

type AnalysisProgress = {
  step: string
  message: string
  percent: number
  elapsedMs: number
}

type AnalysisStreamEvent =
  | { type: "progress"; step: string; message: string; percent: number; elapsedMs: number }
  | { type: "complete"; body: AnalysisResponse }
  | { type: "error"; error: string; status: number }

type PhraseItem = SongAnalysis["analysis"]["idiomsAndPhrases"][number]
type SongBackground = NonNullable<SongAnalysis["analysis"]["songBackground"]>
const ANALYSIS_VERSION = "song-analysis-v5-hsk4-annotations"

function SectionHeading({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4 md:gap-6">
      <h2 className="min-w-0 text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
        {children}
      </h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function splitAnnotatedText(text: string, annotations: PhraseAnnotation[]) {
  const parts: Array<{ text: string; annotation: PhraseAnnotation | null }> = []
  let cursor = 0

  while (cursor < text.length) {
    const nextMatch = annotations
      .filter((annotation) => annotation.phrase)
      .map((annotation) => ({
        annotation,
        index: text.indexOf(annotation.phrase, cursor),
      }))
      .filter((match) => match.index >= 0)
      .sort((a, b) => a.index - b.index || b.annotation.phrase.length - a.annotation.phrase.length)[0]

    if (!nextMatch) {
      parts.push({ text: text.slice(cursor), annotation: null })
      break
    }

    if (nextMatch.index > cursor) {
      parts.push({ text: text.slice(cursor, nextMatch.index), annotation: null })
    }

    parts.push({
      text: nextMatch.annotation.phrase,
      annotation: nextMatch.annotation,
    })
    cursor = nextMatch.index + nextMatch.annotation.phrase.length
  }

  return parts.filter((part) => part.text)
}

function buildLineAnnotations(line: SongAnalysisLine, phraseItems: PhraseItem[]) {
  const annotationsByPhrase = new Map<string, PhraseAnnotation>()

  line.annotations.forEach((annotation) => {
    if (annotation.phrase && line.original.includes(annotation.phrase)) {
      annotationsByPhrase.set(annotation.phrase, annotation)
    }
  })

  phraseItems.forEach((phrase) => {
    if (!phrase.phrase || !line.original.includes(phrase.phrase) || annotationsByPhrase.has(phrase.phrase)) {
      return
    }

    annotationsByPhrase.set(phrase.phrase, {
      phrase: phrase.phrase,
      pinyin: phrase.pinyin,
      literalTranslation: phrase.meaning,
      note: phrase.culturalNote,
    })
  })

  return Array.from(annotationsByPhrase.values())
}

function getUserFacingAnalysisError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes("openai is temporarily unavailable") ||
    normalizedMessage.includes("openai request failed with status 502") ||
    normalizedMessage.includes("openai request failed with status 503") ||
    normalizedMessage.includes("openai request failed with status 504") ||
    normalizedMessage.includes("bad gateway") ||
    normalizedMessage.includes("cloudflare")
  ) {
    return "OpenAI is temporarily unavailable. Please try regenerating again in a minute."
  }

  return message
}

function AnnotatedText({ line, annotations }: { line: SongAnalysisLine; annotations: PhraseAnnotation[] }) {
  return (
    <>
      {splitAnnotatedText(line.original, annotations).map((part, index) =>
        part.annotation ? (
          <span
            key={`${part.text}-${index}`}
            className="group/annotation relative inline-block cursor-help outline-none"
            tabIndex={0}
          >
            <span className="border-b-2 border-primary pb-0.5">{part.text}</span>
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 hidden w-72 -translate-x-1/2 rounded-md bg-foreground px-4 py-3 text-center text-base font-semibold leading-snug text-background shadow-xl group-hover/annotation:block group-focus/annotation:block md:w-80">
              <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-foreground" />
              {part.annotation.phrase} {part.annotation.pinyin && `(${part.annotation.pinyin})`} ={" "}
              {part.annotation.literalTranslation}
              <span className="mt-2 block text-sm font-normal leading-snug">{part.annotation.note}</span>
            </span>
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  )
}

function SongHero({
  analysis,
  isRegenerating,
  onRegenerate,
}: {
  analysis: SongAnalysis
  isRegenerating: boolean
  onRegenerate: () => void
}) {
  const heroTags = [...analysis.genreTags, ...(analysis.releaseYear ? [analysis.releaseYear] : [])].slice(0, 3)

  return (
    <section className="border-b border-border pb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/60 shadow-sm md:h-32 md:w-32">
          {analysis.artworkUrl ? (
            <img src={analysis.artworkUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Music2 className="h-10 w-10 text-accent md:h-12 md:w-12" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {analysis.title}
              </h1>
              <p className="mt-2 text-xl font-medium leading-tight text-muted-foreground md:text-2xl">{analysis.artist}</p>
              <a
                href={analysis.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex max-w-full items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary underline-offset-4 hover:underline"
              >
                <span className="truncate">{analysis.sourceUrl}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isRegenerating}
              onClick={onRegenerate}
              aria-label="Regenerate Song Analysis"
              title="Regenerate Song Analysis"
              className="mt-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {isRegenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            </Button>
          </div>

          {heroTags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {heroTags.map((tag, index) => (
                <span
                  key={tag}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    index === 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/60 text-muted-foreground"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function LyricPair({ line, phraseItems, index }: { line: SongAnalysisLine; phraseItems: PhraseItem[]; index: number }) {
  const annotations = buildLineAnnotations(line, phraseItems)

  return (
    <div className="grid gap-4 border-t border-border/80 py-6 first:border-t-0 md:grid-cols-2 md:gap-12 md:py-7">
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-[30px]">
          <AnnotatedText line={line} annotations={annotations} />
        </p>
        <p className="mt-2 text-sm leading-relaxed tracking-wide text-muted-foreground md:text-base">
          {line.pinyin}
        </p>
      </div>

      <div className="min-w-0 md:pt-1">
        <p className="text-xl font-medium leading-snug text-foreground/90 md:text-2xl">
          {line.literalTranslation}
        </p>
      </div>

      <span className="sr-only">Lyric Line {index + 1}</span>
    </div>
  )
}

function LyricPoem({ analysis }: { analysis: SongAnalysis }) {
  return (
    <section className="space-y-6 md:space-y-7">
      <SectionHeading>Lyrics & Translation</SectionHeading>

      <div className="grid grid-cols-1 gap-3 border-b border-t border-border py-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary md:grid-cols-2 md:gap-12">
        <p>Original · Pinyin</p>
        <p>Poetic Translation</p>
      </div>

      <div>
        {analysis.analysis.lines.map((line, index) => (
          <LyricPair
            key={`${line.original}-${line.literalTranslation}-${index}`}
            line={line}
            phraseItems={analysis.analysis.idiomsAndPhrases}
            index={index}
          />
        ))}
      </div>
    </section>
  )
}

function InsightCard({
  title,
  watermark,
  className = "",
  children,
}: {
  title: string
  watermark: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative min-h-56 overflow-hidden rounded-md border border-border bg-card/80 px-6 py-6 shadow-sm shadow-black/[0.03] md:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute bottom-0 right-6 text-[88px] font-bold leading-none text-primary/[0.045] md:text-[104px]">
        {watermark}
      </div>
      <h3 className="relative z-10 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {title}
      </h3>
      <div className="relative z-10 mt-4 text-base leading-relaxed text-foreground/85 md:text-lg">{children}</div>
    </div>
  )
}

function normalizeDisplaySongBackground(analysis: SongAnalysis): SongBackground {
  const background = analysis.analysis.songBackground
  const hasSummary = Boolean(background?.summary?.trim())
  const hasSources = Boolean(background?.sourceUrls?.length)
  const isCurrentAnalysis = analysis.analysis.analysisVersion === ANALYSIS_VERSION

  if (!background || !hasSummary || !hasSources) {
    return {
      summary: isCurrentAnalysis
        ? "No reliable media association was found yet. Regenerate this analysis to run the Song Background lookup again."
        : "Regenerate To Generate Song Background.",
      sourceUrls: [],
      prompt: "",
    }
  }

  return {
    summary: removeInlineSourceUrls(background.summary),
    sourceUrls: background.sourceUrls ?? [],
    prompt: background.prompt ?? "",
  }
}

function removeInlineSourceUrls(summary: string) {
  return summary
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)\s]+[^)]*\)/g, "$1")
    .replace(/\s*\((?:(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^)\s]*)?)\)/gi, "")
    .replace(/\s*\[[^\]]*(?:(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,})[^\]]*\]/gi, "")
    .replace(/\b(?:(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?)\b/gi, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function getSourceLabel(sourceUrl: string, index: number) {
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase()
    const knownSources: Array<[string, string]> = [
      ["wikipedia", "Wikipedia"],
      ["apple.com", "Apple Music"],
      ["music.apple", "Apple Music"],
      ["yesasia", "YesAsia"],
      ["youtube", "YouTube"],
      ["youtu.be", "YouTube"],
      ["spotify", "Spotify"],
      ["kkbox", "KKBOX"],
      ["genius", "Genius"],
      ["imdb", "IMDb"],
      ["douban", "Douban"],
      ["baike.baidu", "Baidu Baike"],
      ["qq.com", "QQ Music"],
      ["kugou", "Kugou"],
      ["netease", "NetEase Music"],
    ]
    const knownSource = knownSources.find(([domain]) => hostname.includes(domain))

    if (knownSource) {
      return knownSource[1]
    }

    const hostnameParts = hostname.split(".")
    const sourceName = hostnameParts.length > 2 ? hostnameParts[hostnameParts.length - 2] : hostnameParts[0]

    if (!sourceName) {
      return `Source ${index + 1}`
    }

    return sourceName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  } catch {
    return `Source ${index + 1}`
  }
}

function getDisplaySourceLinks(sourceUrls: string[]) {
  const seenLabels = new Set<string>()

  return sourceUrls
    .map((sourceUrl, index) => ({
      sourceUrl,
      label: getSourceLabel(sourceUrl, index),
    }))
    .filter(({ label }) => {
      const key = label.toLowerCase()

      if (seenLabels.has(key)) {
        return false
      }

      seenLabels.add(key)
      return true
    })
}

function SongBackgroundCard({ analysis }: { analysis: SongAnalysis }) {
  const background = normalizeDisplaySongBackground(analysis)
  const sourceLinks = getDisplaySourceLinks(background.sourceUrls)

  return (
    <InsightCard title="Background" watermark="背">
      <div className="space-y-5">
        <p>{background.summary}</p>

        {sourceLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sourceLinks.map(({ sourceUrl, label }) => (
              <a
                key={sourceUrl}
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background/70 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
              >
                {label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </InsightCard>
  )
}

function AnalysisReader({
  analysis,
  isRegenerating,
  onRegenerate,
}: {
  analysis: SongAnalysis
  isRegenerating: boolean
  onRegenerate: () => void
}) {
  return (
    <div className="space-y-12 md:space-y-16">
      <SongHero analysis={analysis} isRegenerating={isRegenerating} onRegenerate={onRegenerate} />
      <LyricPoem analysis={analysis} />

      <section className="space-y-6">
        <SectionHeading>Song Background</SectionHeading>
        <SongBackgroundCard analysis={analysis} />
      </section>
    </div>
  )
}

function ProgressStatus({ progress, elapsedSeconds }: { progress: AnalysisProgress | null; elapsedSeconds: number }) {
  if (!progress) {
    return null
  }

  return (
    <div className="relative z-10 mt-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span>{progress.message}</span>
        <span className="normal-case">{elapsedSeconds}s</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  )
}

export function SongAnalysisPage({ initialAnalyses }: { initialAnalyses: SongAnalysis[] }) {
  const [link, setLink] = useState("")
  const [manualLyrics, setManualLyrics] = useState("")
  const [selectedAnalysis, setSelectedAnalysis] = useState<SongAnalysis | null>(initialAnalyses[0] ?? null)
  const [analyses, setAnalyses] = useState(initialAnalyses)
  const [hasAnalyzedOwnSong, setHasAnalyzedOwnSong] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showManualLyrics, setShowManualLyrics] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const progressResetRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)

  const readAnalysisStream = async (response: Response) => {
    if (!response.body) {
      return (await response.json()) as AnalysisResponse
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let completedBody: AnalysisResponse | null = null

    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (!line.trim()) {
          continue
        }

        const event = JSON.parse(line) as AnalysisStreamEvent

        if (event.type === "progress") {
          setProgress({
            step: event.step,
            message: event.message,
            percent: event.percent,
            elapsedMs: event.elapsedMs,
          })
        }

        if (event.type === "error") {
          throw new Error(event.error)
        }

        if (event.type === "complete") {
          completedBody = event.body
        }
      }

      if (done) {
        break
      }
    }

    if (!completedBody) {
      throw new Error("The analysis ended before a result was returned.")
    }

    return completedBody
  }

  const analyzeSong = async (songLink: string, force = false, lyricsOverride = "") => {
    setError(null)
    setMessage(null)
    setProgress(null)
    setElapsedSeconds(0)
    if (!lyricsOverride.trim()) {
      setShowManualLyrics(false)
    }
    if (progressResetRef.current) {
      window.clearTimeout(progressResetRef.current)
      progressResetRef.current = null
    }
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current)
      elapsedTimerRef.current = null
    }

    if (!songLink.trim()) {
      setError("Paste a YouTube or Spotify link first.")
      return
    }

    if (force) {
      setIsRegenerating(true)
    } else {
      setIsLoading(true)
    }
    const analysisStartedAt = Date.now()
    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - analysisStartedAt) / 1000))
    }, 250)

    try {
      const response = await fetch("/api/song-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
        body: JSON.stringify({ link: songLink, lyrics: lyricsOverride.trim() || undefined, force }),
      })
      const body = await readAnalysisStream(response)

      if (!response.ok || !body.analysis) {
        throw new Error(body.error ?? "The analysis could not be created.")
      }

      setSelectedAnalysis(body.analysis)
      setHasAnalyzedOwnSong(true)
      setAnalyses((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== body.analysis?.id)
        return body.analysis && !body.unsaved ? [body.analysis, ...withoutDuplicate].slice(0, 6) : current
      })
      setMessage(body.warning ?? (body.reused ? "Found A Saved Analysis For This Song." : force ? null : null))
      if (!force) {
        setLink("")
        setManualLyrics("")
        setShowManualLyrics(false)
      }
    } catch (analysisError) {
      const nextError = analysisError instanceof Error ? analysisError.message : "Something went wrong."
      setError(getUserFacingAnalysisError(nextError))
      if (nextError.toLowerCase().includes("lyrics were not available")) {
        setShowManualLyrics(true)
      }
    } finally {
      if (force) {
        setIsRegenerating(false)
      } else {
        setIsLoading(false)
      }
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
      progressResetRef.current = window.setTimeout(() => setProgress(null), 900)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await analyzeSong(link, false, manualLyrics)
  }

  const handleRegenerate = async () => {
    if (!selectedAnalysis) {
      return
    }

    await analyzeSong(selectedAnalysis.sourceUrl, true)
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-12 text-foreground md:gap-16">
      <section className="relative overflow-hidden rounded-md border border-border bg-card/85 px-5 py-5 shadow-sm shadow-black/[0.04] md:px-7 md:py-6">
        <div className="pointer-events-none absolute -right-1 top-0 select-none text-[120px] font-bold leading-none text-primary/[0.035] md:text-[156px]">
          歌
        </div>
        <form className="relative z-10 space-y-3" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="song-link">
            YouTube Or Spotify Link
          </label>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            YouTube Or Spotify Link
          </p>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              ref={inputRef}
              id="song-link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Paste a link to any Chinese song..."
              className="h-12 flex-1 rounded-md border border-input bg-background/80 px-4 text-lg text-foreground outline-none placeholder:text-muted-foreground/55 focus-visible:ring-[3px] focus-visible:ring-ring/30 md:text-xl"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="h-12 px-6 text-sm font-semibold uppercase tracking-[0.12em] md:w-44 md:text-base"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Analyze
              <ArrowUpRight className="h-5 w-5" />
            </Button>
          </div>
        </form>

        {message && <p className="relative z-10 mt-4 text-sm text-muted-foreground">{message}</p>}
        {error && (
          <p className="relative z-10 mt-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            {error}
          </p>
        )}
        <ProgressStatus progress={progress} elapsedSeconds={elapsedSeconds} />

        {showManualLyrics && (
          <div className="relative z-10 mt-4 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor="song-lyrics">
              Lyrics
            </label>
            <textarea
              id="song-lyrics"
              value={manualLyrics}
              onChange={(event) => setManualLyrics(event.target.value)}
              placeholder="Paste lyrics here, then click Analyze again..."
              className="min-h-32 w-full resize-y rounded-md border border-input bg-background/80 px-4 py-3 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/55 focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />
          </div>
        )}
      </section>

      {selectedAnalysis ? (
        <>
          {!hasAnalyzedOwnSong && (
            <SectionHeading>Here&apos;s An Example Of What A Song Analysis Looks Like</SectionHeading>
          )}
          <AnalysisReader analysis={selectedAnalysis} isRegenerating={isRegenerating} onRegenerate={handleRegenerate} />
        </>
      ) : (
        <section className="rounded-md border border-border bg-card/80 p-6 text-center shadow-sm shadow-black/[0.04] md:p-8">
          <Music2 className="mx-auto h-12 w-12 text-accent" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Start With A Song Link</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            The first analysis will appear here with original lyrics, pinyin, cultural interpretation, and literal hover notes.
          </p>
        </section>
      )}

      <section id="previously-analyzed-songs" className="space-y-6 border-t border-border pt-8 md:pt-12">
        <SectionHeading>Previously Analyzed</SectionHeading>

        <div className="grid gap-4 md:grid-cols-3">
          {analyses.map((analysis) => (
            <button
              key={analysis.id}
              type="button"
              onClick={() => setSelectedAnalysis(analysis)}
              className={`min-h-28 rounded-md border px-5 py-5 text-left shadow-sm shadow-black/[0.02] transition-colors md:px-6 ${
                selectedAnalysis?.id === analysis.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/70 hover:border-accent/60 hover:bg-card"
              }`}
            >
              <span className="block text-xl font-semibold leading-tight tracking-tight text-foreground">
                {analysis.title}
              </span>
              <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {analysis.artist}
              </span>
              {analysis.releaseYear ? (
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  {analysis.releaseYear}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
