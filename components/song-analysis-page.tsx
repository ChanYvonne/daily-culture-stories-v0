"use client"

import { FormEvent, useRef, useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import type { PhraseAnnotation, SongAnalysis, SongAnalysisLine } from "@/lib/song-analysis-types"
import { ArrowUpRight, Loader2, Music2, Plus, RefreshCw } from "lucide-react"

type AnalysisResponse = {
  analysis?: SongAnalysis
  reused?: boolean
  unsaved?: boolean
  warning?: string
  error?: string
}

function SectionHeading({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4 md:gap-6">
      <h2 className="min-w-0 font-serif text-2xl font-semibold italic leading-tight text-[#6f5b49] md:text-3xl">
        {children}
      </h2>
      <div className="h-px flex-1 bg-[#dfd2bf]" />
    </div>
  )
}

function splitAnnotatedText(text: string, annotations: PhraseAnnotation[]) {
  const matchedAnnotation = annotations.find((annotation) => annotation.phrase && text.includes(annotation.phrase))

  if (!matchedAnnotation) {
    return [{ text, annotation: null as PhraseAnnotation | null }]
  }

  const [before, after] = text.split(matchedAnnotation.phrase)

  return [
    { text: before, annotation: null },
    { text: matchedAnnotation.phrase, annotation: matchedAnnotation },
    { text: after, annotation: null },
  ].filter((part) => part.text)
}

function AnnotatedText({ line }: { line: SongAnalysisLine }) {
  return (
    <>
      {splitAnnotatedText(line.original, line.annotations).map((part, index) =>
        part.annotation ? (
          <span key={`${part.text}-${index}`} className="group/annotation relative inline-block cursor-help">
            <span className="border-b-2 border-[#9e1b1b]">{part.text}</span>
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 hidden w-72 -translate-x-1/2 bg-[#171008] px-4 py-3 text-center font-serif text-base font-semibold leading-snug text-white shadow-xl group-hover/annotation:block group-focus/annotation:block md:w-80">
              <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-[#171008]" />
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
    <section className="border-b border-[#dfd2bf] pb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center border-2 border-[#c8b797] bg-[#e8ddc9] md:h-32 md:w-32">
          {analysis.artworkUrl ? (
            <img src={analysis.artworkUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Music2 className="h-10 w-10 text-[#6f5b49] md:h-12 md:w-12" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-balance font-serif text-3xl font-bold leading-tight text-[#171008] md:text-4xl lg:text-5xl">
                {analysis.title}
              </h1>
              <p className="mt-2 font-serif text-xl italic leading-tight text-[#6f5b49] md:text-2xl">{analysis.artist}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isRegenerating}
              onClick={onRegenerate}
              aria-label="Regenerate Song Analysis"
              title="Regenerate Song Analysis"
              className="mt-1 rounded-none text-[#6f5b49] hover:bg-[#eadfce]"
            >
              {isRegenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            </Button>
          </div>

          {heroTags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {heroTags.map((tag, index) => (
                <span
                  key={tag}
                  className={`border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide ${
                    index === 0
                      ? "border-[#9e1b1b] bg-[#9e1b1b] text-white"
                      : "border-[#c8b797] text-[#6f5b49]"
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

function LyricTable({ lines }: { lines: SongAnalysisLine[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 md:gap-6">
        <h2 className="min-w-0 font-serif text-2xl font-semibold italic leading-tight text-[#6f5b49] md:text-3xl">
          Lyric Analysis — Line By Line
        </h2>
        <div className="h-px flex-1 bg-[#dfd2bf]" />
      </div>

      <div className="border-2 border-[#c8b797]">
        <div className="grid border-b-2 border-[#c8b797] font-mono text-xs font-bold uppercase tracking-wide text-[#6f5b49] md:grid-cols-[48%_52%]">
          <div className="border-b-2 border-[#c8b797] px-5 py-4 md:border-b-0 md:border-r-2 md:px-6">
            Original · Pinyin
          </div>
          <div className="px-5 py-4 md:px-6">Cultural Reading</div>
        </div>

        {lines.map((line, index) => (
          <div
            key={`${line.original}-${index}`}
            className="grid border-b border-[#c8b797] last:border-b-0 md:grid-cols-[48%_52%]"
          >
            <div className="min-h-36 border-b border-[#c8b797] px-5 py-6 md:border-b-0 md:border-r-2 md:px-6">
              <p className="font-serif text-2xl font-bold leading-snug text-[#171008] md:text-[28px]">
                <AnnotatedText line={line} />
              </p>
              <p className="mt-3 font-mono text-sm leading-relaxed tracking-wide text-[#6f5b49] md:text-base">
                {line.pinyin}
              </p>
            </div>

            <div className="px-5 py-6 font-serif text-base leading-relaxed text-[#6f5b49] md:px-6 md:text-lg">
              <p className="font-semibold italic text-[#3a2b20]">"{line.literalTranslation}"</p>
              <p className="mt-4">{line.culturalMeaning}</p>
            </div>
          </div>
        ))}

        <div className="border-t border-[#c8b797] px-4 py-4 text-center font-mono text-xs font-bold uppercase tracking-wide text-[#c8b797]">
          Hover Over Underlined Phrases For Literal Translations
        </div>
      </div>
    </section>
  )
}

function InsightCard({ title, watermark, children }: { title: string; watermark: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-56 overflow-hidden border-2 border-[#c8b797] px-6 py-6 md:p-8">
      <div className="pointer-events-none absolute bottom-0 right-6 font-serif text-[88px] font-bold leading-none text-[#9e1b1b]/[0.05] md:text-[104px]">
        {watermark}
      </div>
      <h3 className="relative z-10 font-mono text-xs font-bold uppercase tracking-wide text-[#9e1b1b]">
        {title}
      </h3>
      <div className="relative z-10 mt-4 font-serif text-base leading-relaxed text-[#3a2b20] md:text-lg">{children}</div>
    </div>
  )
}

function PhraseCloud({ analysis }: { analysis: SongAnalysis }) {
  const phraseItems = analysis.analysis.idiomsAndPhrases.length
    ? analysis.analysis.idiomsAndPhrases
    : analysis.analysis.lines.flatMap((line) =>
        line.annotations.map((annotation) => ({
          phrase: annotation.phrase,
          meaning: annotation.literalTranslation,
          culturalNote: annotation.note,
          pinyin: annotation.pinyin,
        })),
      )

  if (phraseItems.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <SectionHeading>Key Phrases & Idioms</SectionHeading>
      <div className="flex flex-wrap gap-3">
        {phraseItems.slice(0, 8).map((phrase) => (
          <span
            key={`${phrase.phrase}-${phrase.meaning}`}
            className="border-2 border-[#c8b797] px-4 py-2 font-serif text-lg font-bold text-[#3a2b20] md:text-xl"
          >
            {phrase.phrase} <em className="font-semibold text-[#6f5b49]">{phrase.meaning}</em>
          </span>
        ))}
      </div>
    </section>
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
      <LyricTable lines={analysis.analysis.lines} />

      <section className="grid gap-6 md:grid-cols-2">
        <InsightCard title="Cultural Context" watermark="文">
          <p>{analysis.analysis.culturalContext}</p>
        </InsightCard>

        <InsightCard title="Central Imagery" watermark="象">
          <p>{analysis.analysis.imageryNotes.join(" ")}</p>
        </InsightCard>
      </section>

      <PhraseCloud analysis={analysis} />
    </div>
  )
}

export function SongAnalysisPage({ initialAnalyses }: { initialAnalyses: SongAnalysis[] }) {
  const [link, setLink] = useState("")
  const [selectedAnalysis, setSelectedAnalysis] = useState<SongAnalysis | null>(initialAnalyses[0] ?? null)
  const [analyses, setAnalyses] = useState(initialAnalyses)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const analyzeSong = async (songLink: string, force = false) => {
    setError(null)
    setMessage(null)

    if (!songLink.trim()) {
      setError("Paste a Spotify or YouTube link first.")
      return
    }

    if (force) {
      setIsRegenerating(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await fetch("/api/song-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: songLink, force }),
      })
      const body = (await response.json()) as AnalysisResponse

      if (!response.ok || !body.analysis) {
        throw new Error(body.error ?? "The analysis could not be created.")
      }

      setSelectedAnalysis(body.analysis)
      setAnalyses((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== body.analysis?.id)
        return body.analysis && !body.unsaved ? [body.analysis, ...withoutDuplicate].slice(0, 6) : current
      })
      setMessage(body.warning ?? (body.reused ? "Found A Saved Analysis For This Song." : force ? null : null))
      if (!force) {
        setLink("")
      }
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Something went wrong.")
    } finally {
      if (force) {
        setIsRegenerating(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await analyzeSong(link)
  }

  const handleRegenerate = async () => {
    if (!selectedAnalysis) {
      return
    }

    await analyzeSong(selectedAnalysis.sourceUrl, true)
  }

  const focusInput = () => {
    inputRef.current?.focus()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-12 text-[#3a2b20] md:gap-16">
      <section className="relative overflow-hidden border-2 border-[#c8b797] px-5 py-6 md:px-8 md:py-8">
        <div className="pointer-events-none absolute -right-1 top-0 select-none font-serif text-[132px] font-bold leading-none text-[#9e1b1b]/[0.04] md:text-[180px]">
          歌
        </div>
        <form className="relative z-10 space-y-3" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="song-link">
            Spotify Or YouTube Link
          </label>
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-[#6f5b49]">
            Spotify Or YouTube Link
          </p>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              ref={inputRef}
              id="song-link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Paste a link to any Chinese song..."
              className="h-12 flex-1 rounded-lg border border-[#ded8cf] bg-white px-4 font-serif text-lg italic text-[#3a2b20] outline-none placeholder:text-[#c8b797] focus-visible:ring-[3px] focus-visible:ring-[#c8b797]/60 md:h-14 md:text-xl"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              variant="outline"
              className="h-12 rounded-lg border-[#c8b797] bg-[#fbf7f0]/80 px-6 font-mono text-sm font-bold uppercase tracking-wide text-[#171008] hover:bg-[#eadfce] md:h-14 md:w-44 md:text-base"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Analyze
              <ArrowUpRight className="h-5 w-5" />
            </Button>
          </div>
        </form>

        {message && <p className="relative z-10 mt-4 font-mono text-sm text-[#6f5b49]">{message}</p>}
        {error && (
          <p className="relative z-10 mt-4 border border-[#9e1b1b] bg-[#9e1b1b]/10 p-3 font-mono text-sm text-[#9e1b1b]">
            {error}
          </p>
        )}
      </section>

      {selectedAnalysis ? (
        <AnalysisReader analysis={selectedAnalysis} isRegenerating={isRegenerating} onRegenerate={handleRegenerate} />
      ) : (
        <section className="border-2 border-[#c8b797] p-6 text-center md:p-8">
          <Music2 className="mx-auto h-12 w-12 text-[#6f5b49]" />
          <h2 className="mt-4 font-serif text-2xl font-bold text-[#171008] md:text-3xl">Start With A Song Link</h2>
          <p className="mx-auto mt-3 max-w-2xl font-serif text-base leading-relaxed text-[#6f5b49] md:text-lg">
            The first analysis will appear here with original lyrics, pinyin, cultural interpretation, and literal hover notes.
          </p>
        </section>
      )}

      <section id="previously-analyzed-songs" className="space-y-6 border-t border-[#dfd2bf] pt-8 md:pt-12">
        <SectionHeading>Previously Analyzed</SectionHeading>

        <div className="grid gap-6 md:grid-cols-3">
          {analyses.map((analysis) => (
            <button
              key={analysis.id}
              type="button"
              onClick={() => setSelectedAnalysis(analysis)}
              className={`min-h-28 border-2 px-5 py-5 text-left transition-colors md:px-6 ${
                selectedAnalysis?.id === analysis.id
                  ? "border-[#9e1b1b] bg-[#f5eee5]"
                  : "border-[#c8b797] hover:border-[#9e1b1b]"
              }`}
            >
              <span className="block font-serif text-xl font-bold leading-tight text-[#171008] md:text-2xl">
                {analysis.title}
              </span>
              <span className="mt-2 block font-mono text-sm font-bold tracking-wide text-[#6f5b49]">
                {analysis.artist}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={focusInput}
            className="min-h-28 border-2 border-[#c8b797] px-5 py-5 text-left transition-colors hover:border-[#9e1b1b] md:px-6"
          >
            <span className="flex items-center gap-2 font-serif text-xl font-bold text-[#171008] md:text-2xl">
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
              New Analysis
            </span>
            <span className="mt-2 block font-mono text-sm font-bold tracking-wide text-[#6f5b49]">
              Paste A Link Above
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}
