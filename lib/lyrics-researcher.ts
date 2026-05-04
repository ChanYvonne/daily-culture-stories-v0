type LyricsResearchInput = {
  title: string
  artist: string
  album?: string
  titleAliases?: string[]
  artistAliases?: string[]
}

export type LyricsResearchResult = {
  provider: string
  lyrics: string
  providerTrackId?: string
  title?: string
  artist?: string
}

type LrcLibLyrics = {
  id?: number
  trackName?: string
  artistName?: string
  plainLyrics?: string | null
  syncedLyrics?: string | null
  instrumental?: boolean
}

type LyricsOvhResult = {
  lyrics?: string
  error?: string
}

const REQUEST_TIMEOUT_MS = 8000
const MIN_LYRICS_LENGTH = 40
const KNOWN_SEARCH_ALIASES: Record<string, string[]> = {
  那些年: ["na xie nian", "those years"],
  "na xie nian": ["那些年", "those years"],
  "those years": ["那些年", "na xie nian"],
  胡夏: ["hu xia"],
  "hu xia": ["胡夏"],
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function hasCjkText(value: string) {
  return /\p{Script=Han}/u.test(value)
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function getKnownAliases(value: string) {
  return KNOWN_SEARCH_ALIASES[value] ?? KNOWN_SEARCH_ALIASES[value.toLowerCase()] ?? []
}

function isUsableLyrics(lyrics: string | null | undefined) {
  return Boolean(lyrics && lyrics.trim().length >= MIN_LYRICS_LENGTH)
}

function cleanLrcLyrics(lyrics: string) {
  return lyrics
    .split("\n")
    .map((line) =>
      line
        .replace(/^\[[\d:.]+\]\s*/g, "")
        .replace(/^\[(ar|ti|al|by|offset|length|re):[^\]]*\]\s*/i, "")
        .trim(),
    )
    .filter(Boolean)
    .join("\n")
}

async function fetchJson<T>(url: URL): Promise<T | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "DailyCultureStories/0.1 (song-analysis)" },
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    return (await response.json().catch(() => null)) as T | null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function mapLrcLibLyrics(result: LrcLibLyrics | null): LyricsResearchResult | null {
  if (!result || result.instrumental) {
    return null
  }

  const rawLyrics = result.plainLyrics || result.syncedLyrics

  if (typeof rawLyrics !== "string" || !isUsableLyrics(rawLyrics)) {
    return null
  }

  const lyrics = rawLyrics.trim()

  return {
    provider: "LRCLIB",
    providerTrackId: result.id ? String(result.id) : undefined,
    title: result.trackName,
    artist: result.artistName,
    lyrics: cleanLrcLyrics(lyrics),
  }
}

async function searchLrcLib({ title, artist, album, titleAliases = [], artistAliases = [] }: LyricsResearchInput) {
  const titleVariants = uniqueValues([title, ...titleAliases, ...getKnownAliases(title)])
  const artistVariants = uniqueValues([artist, ...artistAliases, ...getKnownAliases(artist)])
  const directUrl = new URL("https://lrclib.net/api/get")
  directUrl.searchParams.set("track_name", titleVariants[0] ?? title)
  directUrl.searchParams.set("artist_name", artistVariants[0] ?? artist)
  if (album) {
    directUrl.searchParams.set("album_name", album)
  }

  const directResult = mapLrcLibLyrics(await fetchJson<LrcLibLyrics>(directUrl))

  if (directResult) {
    return directResult
  }

  const searches = titleVariants.flatMap((titleVariant) => [
    ...artistVariants.map((artistVariant) => ({ track_name: titleVariant, artist_name: artistVariant })),
    ...artistVariants.map((artistVariant) => ({ q: `${titleVariant} ${artistVariant}` })),
    ...(hasCjkText(titleVariant) ? [{ q: titleVariant }] : []),
  ])
  const results = (
    await Promise.all(
      searches.map((search) => {
        const searchUrl = new URL("https://lrclib.net/api/search")
        Object.entries(search).forEach(([key, value]) => searchUrl.searchParams.set(key, value))
        return fetchJson<LrcLibLyrics[]>(searchUrl)
      }),
    )
  )
    .flatMap((result) => result ?? [])
    .filter((result, index, allResults) => result.id === undefined || allResults.findIndex((item) => item.id === result.id) === index)
  const normalizedTitle = normalizeSearchText(title)
  const normalizedTitleVariants = titleVariants.map(normalizeSearchText)
  const normalizedArtistVariants = artistVariants.map(normalizeSearchText)
  const matchedResult = results
    .filter((result) => isUsableLyrics(result.plainLyrics || result.syncedLyrics))
    .find((result) => {
      const resultTitle = normalizeSearchText(result.trackName ?? "")
      const resultArtist = normalizeSearchText(result.artistName ?? "")
      const hasTitleMatch = normalizedTitleVariants.some(
        (titleVariant) => resultTitle === titleVariant || resultTitle.includes(titleVariant),
      )
      const hasArtistMatch = normalizedArtistVariants.some(
        (artistVariant) => !artistVariant || resultArtist.includes(artistVariant),
      )

      return (
        resultTitle === normalizedTitle ||
        (hasTitleMatch && (hasArtistMatch || titleVariants.some(hasCjkText)))
      )
    })

  return mapLrcLibLyrics(matchedResult ?? null)
}

async function searchLyricsOvh({ title, artist }: LyricsResearchInput) {
  const url = new URL(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`)
  const result = await fetchJson<LyricsOvhResult>(url)

  const lyrics = result?.lyrics?.trim() ?? ""

  if (!isUsableLyrics(lyrics)) {
    return null
  }

  return {
    provider: "Lyrics.ovh",
    title,
    artist,
    lyrics,
  }
}

export async function researchLyrics(input: LyricsResearchInput): Promise<LyricsResearchResult | null> {
  return (await searchLrcLib(input)) ?? (await searchLyricsOvh(input))
}
