import { createSupabaseServiceClient } from "@/lib/supabase"
import { researchLyrics } from "@/lib/lyrics-researcher"
import {
  mapSongAnalysisRow,
  type SongBackground,
  type SongAnalysisPayload,
  type SongAnalysisRow,
  type SongSoundtrackContext,
  type SongSourceType,
} from "@/lib/song-analysis-types"

const LYRICS_API_BASE_URL = process.env.LYRICS_API_BASE_URL ?? "https://lyrics.lewdhutao.my.eu.org"
const DEFAULT_MODEL = "gpt-4.1-mini"
const ANALYSIS_VERSION = "song-analysis-v4-song-background"
const SONG_BACKGROUND_PROMPT =
  "For each song, search the web and write one concise paragraph summarizing the Chinese drama, movie, TV show, or variety show it is most strongly associated with. Include the media title, how the song was used, key production credits, any memorable behind-the-scenes story, and only the most important popularity facts or statistics. Do not include lyric meaning analysis unless it directly explains the song’s media use or popularity. Prioritize official OST pages, label/artist sources, reputable entertainment outlets, interviews, award pages, and music databases. If no reliable media association exists, say so clearly and give the strongest known association instead. Keep each paragraph to 4 to 6 sentences. Do not cite sources sentence-by-sentence, and do not include raw URLs, bare domains like en.wikipedia.org, parenthetical domain citations like (music.apple.com), Markdown links, bracketed citations, or a source list inside the paragraph; put 2 to 4 verification links only in sourceUrls."
const OPENAI_TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504])
const OPENAI_MAX_ATTEMPTS = 3

class TemporaryOpenAIError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "TemporaryOpenAIError"
  }
}

type SongMetadata = {
  sourceType: SongSourceType
  sourceId: string
  sourceUrl: string
  title: string
  artist: string
  album?: string
  artworkUrl?: string
  releaseYear?: string
  genreTags: string[]
}

type LyricsResult = {
  provider: string
  providerTrackId?: string
  title?: string
  artist?: string
  artworkUrl?: string
  lyrics: string
}

type SongAnalysisResponse = {
  analysis?: ReturnType<typeof mapSongAnalysisRow> | (SongMetadata & {
    id: string
    genreTags: string[]
    lyricsProvider: string
    providerTrackId?: string
    modelName?: string
    latencyMs: number
    status: "published"
    analysis: SongAnalysisPayload
    createdAt: string
    updatedAt: string
  })
  reused?: boolean
  unsaved?: boolean
  warning?: string
  error?: string
}

type ProgressEvent =
  | { type: "progress"; step: string; message: string; percent: number; elapsedMs: number }
  | { type: "complete"; body: SongAnalysisResponse }
  | { type: "error"; error: string; status: number }

function streamEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: ProgressEvent) {
  controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`))
}

function isTemporaryOpenAIError(error: unknown) {
  return error instanceof TemporaryOpenAIError
}

function isRetryableOpenAIStatus(status: number) {
  return OPENAI_TRANSIENT_STATUSES.has(status)
}

function getOpenAIErrorMessage(status: number) {
  if (isRetryableOpenAIStatus(status)) {
    return "OpenAI is temporarily unavailable. Please try again in a minute."
  }

  return `OpenAI request failed with status ${status}.`
}

function sanitizeOpenAIErrorBody(body: string) {
  const withoutTags = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
  return withoutTags.replace(/\s+/g, " ").trim().slice(0, 500)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getSpotifyTrackId(url: URL) {
  if (!url.hostname.includes("spotify.com")) {
    return null
  }

  const parts = url.pathname.split("/").filter(Boolean)
  const trackIndex = parts.indexOf("track")
  return trackIndex >= 0 ? parts[trackIndex + 1] ?? null : null
}

function getYouTubeVideoId(url: URL) {
  if (url.hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null
  }

  if (url.hostname.includes("youtube.com")) {
    return url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).at(-1) ?? null
  }

  return null
}

function parseMusicLink(link: string): { sourceType: SongSourceType; sourceId: string; sourceUrl: string } | null {
  let url: URL

  try {
    url = new URL(link)
  } catch {
    return null
  }

  const spotifyTrackId = getSpotifyTrackId(url)
  if (spotifyTrackId) {
    return { sourceType: "spotify", sourceId: spotifyTrackId, sourceUrl: url.toString() }
  }

  const youtubeVideoId = getYouTubeVideoId(url)
  if (youtubeVideoId) {
    return { sourceType: "youtube", sourceId: youtubeVideoId, sourceUrl: url.toString() }
  }

  return null
}

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  })

  if (!response.ok) {
    return null
  }

  const body = (await response.json()) as { access_token?: string }
  return body.access_token ?? null
}

function getReleaseYear(releaseDate: unknown) {
  return typeof releaseDate === "string" && releaseDate.length >= 4 ? releaseDate.slice(0, 4) : undefined
}

function normalizeTag(tag: string) {
  const normalized = tag
    .replace(/^chinese\s+/i, "")
    .replace(/^taiwan\s+/i, "Taiwanese ")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalized) {
    return null
  }

  if (/mandopop|mandarin pop/i.test(normalized)) {
    return "MANDOPOP"
  }

  if (/cantopop|cantonese pop/i.test(normalized)) {
    return "CANTOPOP"
  }

  if (/ballad/i.test(normalized)) {
    return "ROMANTIC BALLAD"
  }

  return normalized.toUpperCase()
}

async function getSpotifyMetadata(sourceId: string, sourceUrl: string): Promise<SongMetadata | null> {
  const accessToken = await getSpotifyAccessToken()

  if (accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${sourceId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (response.ok) {
      const track = await response.json()
      const artists = Array.isArray(track.artists)
        ? track.artists.map((artist: { name?: string }) => artist.name).filter(Boolean).join(", ")
        : ""
      const images = Array.isArray(track.album?.images) ? track.album.images : []

      if (typeof track.name === "string" && artists) {
        return {
          sourceType: "spotify",
          sourceId,
          sourceUrl,
          title: track.name,
          artist: artists,
          album: typeof track.album?.name === "string" ? track.album.name : undefined,
          artworkUrl: typeof images[0]?.url === "string" ? images[0].url : undefined,
          releaseYear: getReleaseYear(track.album?.release_date),
          genreTags: [],
        }
      }
    }
  }

  const fallback = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(sourceUrl)}`).catch(() => null)

  if (!fallback?.ok) {
    return null
  }

  const body = (await fallback.json()) as { title?: string; thumbnail_url?: string }
  const [title, artist] = (body.title ?? "").split(" - ")

  if (!title) {
    return null
  }

  return {
    sourceType: "spotify",
    sourceId,
    sourceUrl,
    title: title.trim(),
    artist: artist?.trim() || "Unknown artist",
    artworkUrl: body.thumbnail_url,
    genreTags: [],
  }
}

async function fetchLyrics(path: string, params: Record<string, string>) {
  const url = new URL(path, LYRICS_API_BASE_URL)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url, { next: { revalidate: 0 } })

  if (!response.ok) {
    return null
  }

  const body = await response.json().catch(() => null)
  const data = body?.data
  const lyrics = typeof data?.lyrics === "string" ? data.lyrics.trim() : ""

  if (!lyrics) {
    return null
  }

  return {
    provider: typeof data.searchEngine === "string" ? data.searchEngine : path.includes("youtube") ? "LyricsAPI YouTube" : "LyricsAPI Musixmatch",
    providerTrackId: typeof data.trackId === "string" ? data.trackId : undefined,
    title: typeof data.trackName === "string" ? data.trackName : undefined,
    artist: typeof data.artistName === "string" ? data.artistName : undefined,
    artworkUrl: typeof data.artworkUrl === "string" ? data.artworkUrl : undefined,
    lyrics,
  } satisfies LyricsResult
}

async function resolveYouTubeMetadataAndLyrics(sourceId: string, sourceUrl: string) {
  const lyrics = await fetchLyrics("/v2/youtube/lyrics", { trackid: sourceId })

  if (!lyrics) {
    return null
  }

  const metadata: SongMetadata = {
    sourceType: "youtube",
    sourceId,
    sourceUrl,
    title: lyrics.title ?? "YouTube song",
    artist: lyrics.artist ?? "Unknown artist",
    artworkUrl: lyrics.artworkUrl,
    genreTags: [],
  }

  return { metadata, lyrics }
}

async function getYouTubeMetadata(sourceId: string, sourceUrl: string): Promise<SongMetadata | null> {
  const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`).catch(() => null)

  if (!response?.ok) {
    return {
      sourceType: "youtube",
      sourceId,
      sourceUrl,
      title: "YouTube song",
      artist: "Unknown artist",
      genreTags: [],
    }
  }

  const body = (await response.json().catch(() => null)) as { title?: string; author_name?: string; thumbnail_url?: string } | null

  return {
    sourceType: "youtube",
    sourceId,
    sourceUrl,
    title: body?.title?.trim() || "YouTube song",
    artist: body?.author_name?.trim() || "Unknown artist",
    artworkUrl: body?.thumbnail_url,
    genreTags: [],
  }
}

async function resolveLyricsForMetadata(metadata: SongMetadata) {
  const musixmatchLyrics = await fetchLyrics("/v2/musixmatch/lyrics", {
    title: metadata.title,
    artist: metadata.artist,
  })

  if (musixmatchLyrics) {
    return musixmatchLyrics
  }

  return fetchLyrics("/v2/youtube/lyrics", {
    title: metadata.title,
    artist: metadata.artist,
  })
}

async function researchLyricsForMetadata(metadata: SongMetadata): Promise<LyricsResult | null> {
  const result = await researchLyrics({
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    titleAliases: metadata.title === "那些年" ? ["na xie nian", "those years"] : [],
    artistAliases: metadata.artist.toLowerCase() === "hu xia" ? ["胡夏"] : [],
  })

  if (!result) {
    return null
  }

  return {
    provider: `Lyrics Research: ${result.provider}`,
    providerTrackId: result.providerTrackId,
    title: result.title,
    artist: result.artist,
    lyrics: result.lyrics,
  }
}

function getTrustedLyricsMetadata(metadata: SongMetadata, lyrics: LyricsResult) {
  const providerTitle = lyrics.title?.trim()
  const providerArtist = lyrics.artist?.trim()
  const hasGenericMetadata = metadata.title === "YouTube song" || metadata.artist === "Unknown artist"
  const providerLooksInstrumental = /instrumental/i.test(providerTitle ?? "")

  return {
    ...metadata,
    title: hasGenericMetadata && providerTitle && !providerLooksInstrumental ? providerTitle : metadata.title,
    artist: hasGenericMetadata && providerArtist ? providerArtist : metadata.artist,
    artworkUrl: metadata.artworkUrl ?? lyrics.artworkUrl,
  }
}

function hasUsefulSongBackground(analysis: SongAnalysisPayload) {
  return Boolean(analysis.songBackground?.summary?.trim() && analysis.songBackground.sourceUrls?.length)
}

function isCurrentAnalysisPayload(analysis: SongAnalysisPayload | null | undefined) {
  return Boolean(analysis?.analysisVersion === ANALYSIS_VERSION && hasUsefulSongBackground(analysis))
}

function shouldReuseCachedAnalysis(row: SongAnalysisRow) {
  if (!isCurrentAnalysisPayload(row.analysis)) {
    return false
  }

  const sourceLineCount = getLyricLineCount(row.raw_lyrics)
  const analysisLineCount = row.analysis.lines?.length ?? 0

  return sourceLineCount === 0 || analysisLineCount >= sourceLineCount
}

function getAnalysisSchema() {
  return {
    type: "json_schema",
    name: "song_analysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "analysisVersion",
        "overview",
        "displayTags",
        "culturalContext",
        "idiomsAndPhrases",
        "imageryNotes",
        "soundtrackContext",
        "songBackground",
        "lines",
      ],
      properties: {
        analysisVersion: { type: "string" },
        overview: { type: "string" },
        displayTags: {
          type: "array",
          minItems: 1,
          maxItems: 2,
          items: { type: "string" },
        },
        culturalContext: { type: "string" },
        idiomsAndPhrases: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["phrase", "pinyin", "meaning", "culturalNote"],
            properties: {
              phrase: { type: "string" },
              pinyin: { type: "string" },
              meaning: { type: "string" },
              culturalNote: { type: "string" },
            },
          },
        },
        imageryNotes: {
          type: "array",
          items: { type: "string" },
        },
        soundtrackContext: getSoundtrackContextProperties(),
        songBackground: getSongBackgroundProperties(),
        lines: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["original", "pinyin", "culturalMeaning", "poeticNotes", "literalTranslation", "annotations"],
            properties: {
              original: { type: "string" },
              pinyin: { type: "string" },
              culturalMeaning: { type: "string" },
              poeticNotes: { type: "string" },
              literalTranslation: { type: "string" },
              annotations: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["phrase", "pinyin", "literalTranslation", "note"],
                  properties: {
                    phrase: { type: "string" },
                    pinyin: { type: "string" },
                    literalTranslation: { type: "string" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
}

function getSongBackgroundProperties() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "sourceUrls", "prompt"],
    properties: {
      summary: { type: "string" },
      sourceUrls: {
        type: "array",
        maxItems: 4,
        items: { type: "string" },
      },
      prompt: { type: "string" },
    },
  }
}

function getSongBackgroundSchema() {
  return {
    type: "json_schema",
    name: "song_background",
    strict: true,
    schema: getSongBackgroundProperties(),
  }
}

function getSoundtrackContextProperties() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "album",
      "releaseYear",
      "isSoundtrack",
      "dramaTitle",
      "dramaOriginalTitle",
      "dramaDescription",
      "relevanceInDrama",
      "evidenceSummary",
      "sourceUrls",
      "searchQueriesTried",
    ],
    properties: {
      album: { type: ["string", "null"] },
      releaseYear: { type: ["string", "null"] },
      isSoundtrack: { type: ["boolean", "null"] },
      dramaTitle: { type: ["string", "null"] },
      dramaOriginalTitle: { type: ["string", "null"] },
      dramaDescription: { type: ["string", "null"] },
      relevanceInDrama: { type: ["string", "null"] },
      evidenceSummary: { type: "string" },
      sourceUrls: {
        type: "array",
        maxItems: 3,
        items: { type: "string" },
      },
      searchQueriesTried: {
        type: "array",
        items: { type: "string" },
      },
    },
  }
}

function getDisplayTags(metadata: SongMetadata, analysis: SongAnalysisPayload) {
  const tags = [...(analysis.displayTags ?? []), ...metadata.genreTags]
    .map((tag) => normalizeTag(tag))
    .filter(Boolean) as string[]

  return Array.from(new Set(tags)).slice(0, 2)
}

function buildSoundtrackSearchQueries(metadata: SongMetadata) {
  const queries = [
    `"${metadata.title}" "${metadata.artist}"`,
    metadata.album ? `"${metadata.title}" "${metadata.album}"` : "",
    `"${metadata.title}" 原聲帶`,
    `"${metadata.title}" 主題曲`,
    `"${metadata.title}" 插曲`,
    `"${metadata.title}" 片尾曲`,
    `"${metadata.title}" 電影`,
    `"${metadata.title}" 電視劇`,
    `"${metadata.title}" 劇集`,
    `"${metadata.title}" 影集`,
    `"${metadata.title}" "${metadata.artist}" soundtrack`,
    `"${metadata.title}" "${metadata.artist}" drama OST`,
    `"${metadata.title}" "${metadata.artist}" movie theme song`,
    `"${metadata.title}" "${metadata.artist}" official video`,
  ]

  return Array.from(new Set(queries.filter(Boolean)))
}

function getFallbackSoundtrackContext(metadata: SongMetadata, evidenceSummary = "No separate soundtrack lookup was available."): SongSoundtrackContext {
  return {
    album: metadata.album ?? null,
    releaseYear: metadata.releaseYear ?? null,
    isSoundtrack: null,
    dramaTitle: null,
    dramaOriginalTitle: null,
    dramaDescription: null,
    relevanceInDrama: null,
    evidenceSummary,
    sourceUrls: [],
    searchQueriesTried: buildSoundtrackSearchQueries(metadata),
  }
}

function normalizeSoundtrackContext(metadata: SongMetadata, context: SongSoundtrackContext): SongSoundtrackContext {
  const sourceUrls = Array.isArray(context.sourceUrls) ? context.sourceUrls.filter(Boolean).slice(0, 3) : []
  const hasSourcesForSoundtrack = sourceUrls.length > 0
  const requestedIsSoundtrack = typeof context.isSoundtrack === "boolean" ? context.isSoundtrack : null
  const isSoundtrack = requestedIsSoundtrack === true && !hasSourcesForSoundtrack ? false : requestedIsSoundtrack
  const evidenceSummary =
    requestedIsSoundtrack === true && !hasSourcesForSoundtrack
      ? `${context.evidenceSummary?.trim() || "A soundtrack connection was suggested, but no reliable source URL was provided."} Treating this as not confirmed.`
      : context.evidenceSummary?.trim() || "No verified film/drama connection found yet."

  return {
    album: context.album ?? metadata.album ?? null,
    releaseYear: context.releaseYear ?? metadata.releaseYear ?? null,
    isSoundtrack,
    dramaTitle: isSoundtrack ? context.dramaTitle ?? null : null,
    dramaOriginalTitle: isSoundtrack ? context.dramaOriginalTitle ?? null : null,
    dramaDescription: isSoundtrack ? context.dramaDescription ?? null : null,
    relevanceInDrama: isSoundtrack ? context.relevanceInDrama ?? null : null,
    evidenceSummary,
    sourceUrls,
    searchQueriesTried: context.searchQueriesTried?.length ? context.searchQueriesTried : buildSoundtrackSearchQueries(metadata),
  }
}

function getFallbackSongBackground(summary = "Regenerate this analysis to fetch Song Background."): SongBackground {
  return {
    summary,
    sourceUrls: [],
    prompt: SONG_BACKGROUND_PROMPT,
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

function normalizeSongBackground(background: SongBackground | null | undefined) {
  return {
    summary: removeInlineSourceUrls(background?.summary?.trim() || "No reliable media association was found yet."),
    sourceUrls: Array.isArray(background?.sourceUrls) ? background.sourceUrls.filter(Boolean).slice(0, 4) : [],
    prompt: background?.prompt || SONG_BACKGROUND_PROMPT,
  }
}

async function researchSongBackground(metadata: SongMetadata): Promise<SongBackground> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return getFallbackSongBackground("No OpenAI key was available for the Song Background lookup.")
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL
  const requestBody = JSON.stringify({
    model,
    tools: [{ type: "web_search", search_context_size: "low" }],
    tool_choice: "required",
    include: ["web_search_call.action.sources"],
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              SONG_BACKGROUND_PROMPT,
              "Return only the requested structured JSON. The summary must be one paragraph of 4 to 6 sentences.",
              "The sourceUrls array must contain 2 to 4 verification links whenever reliable sources are available.",
              "Never put URLs, domains, source names in parentheses, footnotes, or sentence-by-sentence citations in summary. Use sourceUrls for links and mention source names in prose only when the source itself is part of the story.",
              "Use English prose except for official Chinese media, song, album, and person names.",
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Song title: ${metadata.title}`,
              `Artist: ${metadata.artist}`,
              `Album: ${metadata.album ?? "unknown"}`,
              `Release year: ${metadata.releaseYear ?? "unknown"}`,
              `Source URL: ${metadata.sourceUrl}`,
            ].join("\n"),
          },
        ],
      },
    ],
    text: { format: getSongBackgroundSchema() },
  })
  let body: unknown = null

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: requestBody,
    })

    if (response.ok) {
      body = await response.json()
      break
    }

    const errorBody = await response.text().catch(() => "")
    console.error("OpenAI song background lookup failed", {
      attempt,
      status: response.status,
      body: sanitizeOpenAIErrorBody(errorBody),
    })

    if (!isRetryableOpenAIStatus(response.status) || attempt === OPENAI_MAX_ATTEMPTS) {
      return getFallbackSongBackground(getOpenAIErrorMessage(response.status))
    }

    await wait(500 * attempt)
  }

  const outputText = body ? extractOutputText(body) : null

  if (!outputText) {
    return getFallbackSongBackground("The Song Background lookup did not return structured context.")
  }

  try {
    return normalizeSongBackground(JSON.parse(outputText) as SongBackground)
  } catch {
    return getFallbackSongBackground("The Song Background lookup returned unreadable context.")
  }
}

function extractOutputText(body: unknown) {
  if (!body || typeof body !== "object") {
    return null
  }

  const outputText = (body as { output_text?: unknown }).output_text
  if (typeof outputText === "string") {
    return outputText
  }

  const output = (body as { output?: unknown }).output
  if (!Array.isArray(output)) {
    return null
  }

  for (const item of output) {
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : []

    for (const part of content) {
      const text = (part as { text?: unknown }).text
      if (typeof text === "string") {
        return text
      }
    }
  }

  return null
}

function getLyricLineCount(lyrics: string | null | undefined) {
  if (!lyrics) {
    return 0
  }

  return lyrics.split("\n").filter((line) => line.trim()).length
}

async function createAnalysis(
  metadata: SongMetadata,
  lyrics: string,
  soundtrackContext: SongSoundtrackContext,
  songBackground: SongBackground,
) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return createAnalysisWithSupabaseFunction(metadata, lyrics, soundtrackContext, songBackground)
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL
  const requestBody = JSON.stringify({
    model,
    reasoning: { effort: "low" },
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "You are a careful Mandarin Chinese lyric interpreter for English-speaking learners.",
              "Analyze Chinese songs for cultural depth, poetic imagery, idioms, proverbs, emotional meaning, and release context.",
              "Prioritize meaningful English interpretation over literal translation.",
              "Unless a field is directly quoting or referencing the song lyrics, write it in English.",
              "Write overview, culturalContext, culturalMeaning, poeticNotes, literalTranslation, meaning, culturalNote, imageryNotes, and annotation notes in English.",
              "Only original lyric lines and quoted phrases should remain in Chinese.",
              `Return analysisVersion exactly as ${ANALYSIS_VERSION}.`,
              "Return exactly one line object for every supplied lyric line, in order. If a lyric repeats, include it again each time it appears. Do not dedupe, summarize, collapse choruses, or invent missing lines.",
              "For each line, original should keep the source lyric line unchanged except for trimming whitespace or timestamp markers.",
              "Every pinyin field must contain pinyin with tone marks, such as nǐ hǎo, not unmarked pinyin like ni hao and not tone numbers like ni3 hao3.",
              "Before returning, check every line pinyin and annotation pinyin value; if any Mandarin syllable lacks tone marks, add the correct tone marks.",
              "For each line, literalTranslation should read like polished English song lyrics: poetic, natural, emotionally faithful, and line-length conscious for side-by-side display.",
              "Do not make literalTranslation sound like a dictionary gloss; preserve the original line's feeling, image, and rhythm while keeping the meaning accurate.",
              "Use culturalMeaning for explanation and interpretation, not literalTranslation.",
              "Keep explanatory notes out of the lyric translation column; phrase-specific explanations belong only in annotations for the Chinese phrase they refer to.",
              "Write culturalContext as a concise lyric meaning overview. Do not repeat the Song Background paragraph there.",
              "Use the supplied soundtrackContext exactly for soundtrack, Chinese drama, film, OST, album, and release claims.",
              "Return soundtrackContext in the final analysis payload, preserving the supplied values unless the lyric evidence clearly requires a cautious wording adjustment to relevanceInDrama or evidenceSummary.",
              "Return songBackground exactly as supplied. Do not rewrite it inside lyric meaning fields.",
              "Do not invent unsupported release history, drama titles, chart facts, or biographical claims.",
              "In imageryNotes, if you mention any Chinese word, phrase, or lyric fragment, include pinyin with tone marks immediately after it in parentheses.",
              "Cultural context, imagery, and phrase explanations must always be in English.",
              "Return displayTags as 1-2 short uppercase English genre/style labels suitable for UI chips, such as MANDOPOP, ROMANTIC BALLAD, CANTOPOP, FOLK POP, or ROCK BALLAD.",
              "Return concise, accessible, culturally grounded notes.",
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Song: ${metadata.title}\nArtist: ${metadata.artist}\nAlbum: ${
              metadata.album ?? "unknown"
            }\nSource Platform: ${metadata.sourceType}\nSource URL: ${metadata.sourceUrl}\nKnown API Genre Tags: ${
              metadata.genreTags.join(", ") || "unknown"
            }\nRelease Year: ${
              metadata.releaseYear ?? "unknown"
            }\nExpected Lyric Line Count: ${getLyricLineCount(lyrics)}\n\nSong Background:\n${JSON.stringify(songBackground)}\n\nSeparate Soundtrack Lookup:\n${JSON.stringify(soundtrackContext)}\n\nLyrics:\n${lyrics}`,
          },
        ],
      },
    ],
    text: { format: getAnalysisSchema() },
  })
  let body: unknown = null

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: requestBody,
    })

    if (response.ok) {
      body = await response.json()
      break
    }

    const errorBody = await response.text().catch(() => "")
    const sanitizedBody = sanitizeOpenAIErrorBody(errorBody)
    console.error("OpenAI analysis request failed", {
      attempt,
      status: response.status,
      body: sanitizedBody,
    })

    if (!isRetryableOpenAIStatus(response.status) || attempt === OPENAI_MAX_ATTEMPTS) {
      const message = getOpenAIErrorMessage(response.status)
      if (isRetryableOpenAIStatus(response.status)) {
        throw new TemporaryOpenAIError(message, response.status)
      }

      throw new Error(message)
    }

    await wait(750 * attempt)
  }

  if (!body) {
    throw new TemporaryOpenAIError("OpenAI is temporarily unavailable. Please try again in a minute.", 502)
  }

  const outputText = extractOutputText(body)

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text")
  }

  const analysis = JSON.parse(outputText) as SongAnalysisPayload

  return {
    analysis: {
      ...analysis,
      analysisVersion: ANALYSIS_VERSION,
      soundtrackContext: normalizeSoundtrackContext(metadata, analysis.soundtrackContext ?? soundtrackContext),
      songBackground: normalizeSongBackground(analysis.songBackground ?? songBackground),
    },
    modelName: typeof (body as { model?: unknown }).model === "string" ? (body as { model: string }).model : model,
  }
}

async function createAnalysisWithSupabaseFunction(
  metadata: SongMetadata,
  lyrics: string,
  soundtrackContext: SongSoundtrackContext,
  songBackground: SongBackground,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing OpenAI key in Vercel and missing Supabase function credentials for fallback generation.")
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-song`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      metadata: {
        sourceType: metadata.sourceType,
        sourceUrl: metadata.sourceUrl,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        genreTags: metadata.genreTags,
        releaseYear: metadata.releaseYear,
        soundtrackContext,
        songBackground,
      },
      lyrics,
    }),
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : `Supabase analyze-song failed with status ${response.status}`
    throw new Error(message)
  }

  if (!body?.analysis) {
    throw new Error("Supabase analyze-song did not return an analysis.")
  }

  return {
    analysis: body.analysis as SongAnalysisPayload,
    modelName: typeof body.modelName === "string" ? body.modelName : process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emitProgress = (step: string, message: string, percent: number) => {
        streamEvent(controller, { type: "progress", step, message, percent, elapsedMs: Date.now() - startedAt })
      }

      const emitError = (error: string, status = 400) => {
        streamEvent(controller, { type: "error", error, status })
        controller.close()
      }

      const buildUnsavedAnalysis = (
        metadata: SongMetadata,
        genreTags: string[],
        lyrics: LyricsResult,
        generated: Awaited<ReturnType<typeof createAnalysis>>,
        latencyMs: number,
      ) => ({
        id: "unsaved",
        ...metadata,
        genreTags,
        lyricsProvider: lyrics.provider,
        providerTrackId: lyrics.providerTrackId,
        modelName: generated.modelName,
        latencyMs,
        status: "published" as const,
        analysis: generated.analysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      try {
      emitProgress("validate", "Checking the song link...", 8)
      const body = await request.json().catch(() => null)
      const link = typeof body?.link === "string" ? body.link.trim() : ""
      const manualLyrics = typeof body?.lyrics === "string" ? body.lyrics.trim() : ""
      const force = Boolean(body?.force)

      if (!link) {
        emitError("Paste a YouTube or Spotify link to analyze.")
        return
      }

      const parsedLink = parseMusicLink(link)

      if (!parsedLink) {
        emitError("Use a YouTube / YouTube Music link or a Spotify track link.")
        return
      }

      const supabase = createSupabaseServiceClient()

      emitProgress("cache", "Checking for a saved analysis...", 18)
      if (supabase && !force && !manualLyrics) {
        const { data: existing } = await supabase
          .from("song_analyses")
          .select("*")
          .eq("status", "published")
          .eq("source_type", parsedLink.sourceType)
          .eq("source_id", parsedLink.sourceId)
          .maybeSingle()

        if (existing && shouldReuseCachedAnalysis(existing as SongAnalysisRow)) {
          const latencyMs = Date.now() - startedAt
          const { data: updated } = await supabase
            .from("song_analyses")
            .update({ latency_ms: latencyMs })
            .eq("id", (existing as SongAnalysisRow).id)
            .select("*")
            .single()

          emitProgress("complete", "Found a saved analysis.", 100)
          streamEvent(controller, {
            type: "complete",
            body: { analysis: mapSongAnalysisRow((updated ?? existing) as SongAnalysisRow), reused: true },
          })
          controller.close()
          return
        }

        if (existing) {
          emitProgress("refresh", "Refreshing an older saved analysis...", 24)
        }
      }

      let metadata: SongMetadata | null = null
      let lyrics: LyricsResult | null = null

      emitProgress("metadata", "Reading song metadata...", 32)
      if (parsedLink.sourceType === "youtube") {
        const resolved = await resolveYouTubeMetadataAndLyrics(parsedLink.sourceId, parsedLink.sourceUrl)
        metadata = resolved?.metadata ?? null
        lyrics = resolved?.lyrics ?? null
        if (!metadata) {
          metadata = await getYouTubeMetadata(parsedLink.sourceId, parsedLink.sourceUrl)
        }
      } else {
        metadata = await getSpotifyMetadata(parsedLink.sourceId, parsedLink.sourceUrl)
      }

      if (!metadata) {
        emitError("I could not identify that song from the link.", 422)
        return
      }

      if (manualLyrics) {
        emitProgress("manual-lyrics", "Using pasted lyrics...", 52)
        lyrics = {
          provider: "User-provided lyrics",
          lyrics: manualLyrics,
        }
      }

      if (!lyrics) {
        emitProgress("lyrics-research", "Searching public lyric libraries...", 48)
        lyrics = await researchLyricsForMetadata(metadata)
      }

      if (!lyrics) {
        emitProgress("lyrics", "Checking configured lyrics APIs...", 58)
        lyrics = await resolveLyricsForMetadata(metadata)
      }

      if (!lyrics) {
        emitError("I found the song, but lyrics were not available from the configured free lyric sources.", 422)
        return
      }

      const enrichedMetadata = getTrustedLyricsMetadata(metadata, lyrics)
      let generated: Awaited<ReturnType<typeof createAnalysis>>

      emitProgress("song-background", "Researching song background...", 62)
      const songBackground = await researchSongBackground(enrichedMetadata)
      const soundtrackContext = getFallbackSoundtrackContext(
        enrichedMetadata,
        "Song Background is now the source for media, OST, and release context.",
      )

      emitProgress("analysis", "Interpreting lyrics and cultural context...", 72)
      try {
        generated = await createAnalysis(enrichedMetadata, lyrics.lyrics, soundtrackContext, songBackground)
      } catch (error) {
        emitError(
          error instanceof Error ? error.message : "The AI analysis could not be created.",
          isTemporaryOpenAIError(error) ? 503 : 500,
        )
        return
      }

      const genreTags = getDisplayTags(enrichedMetadata, generated.analysis)
      const latencyMs = Date.now() - startedAt

      if (!supabase) {
        emitProgress("complete", "Analysis created.", 100)
        streamEvent(controller, {
          type: "complete",
          body: {
            analysis: buildUnsavedAnalysis(enrichedMetadata, genreTags, lyrics, generated, latencyMs),
            reused: false,
            unsaved: true,
          },
        })
        controller.close()
        return
      }

      emitProgress("save", "Saving the analysis...", 88)
      const { data, error } = await supabase
        .from("song_analyses")
        .upsert(
          {
            source_type: enrichedMetadata.sourceType,
            source_id: enrichedMetadata.sourceId,
            source_url: enrichedMetadata.sourceUrl,
            title: enrichedMetadata.title,
            artist: enrichedMetadata.artist,
            album: enrichedMetadata.album ?? null,
            artwork_url: enrichedMetadata.artworkUrl ?? null,
            release_year: enrichedMetadata.releaseYear ?? null,
            genre_tags: genreTags,
            latency_ms: latencyMs,
            lyrics_provider: lyrics.provider,
            provider_track_id: lyrics.providerTrackId ?? null,
            raw_lyrics: lyrics.lyrics,
            analysis: generated.analysis,
            model_name: generated.modelName,
            status: "published",
          },
          { onConflict: "source_type,source_id" },
        )
        .select("*")
        .single()

      if (error || !data) {
        const saveMessage = error?.message ?? "No saved row was returned."
        emitProgress("complete", "Analysis created, but saving needs attention.", 100)
        streamEvent(controller, {
          type: "complete",
          body: {
            analysis: buildUnsavedAnalysis(enrichedMetadata, genreTags, lyrics, generated, latencyMs),
            reused: false,
            unsaved: true,
            warning: `The analysis was created, but it could not be saved yet: ${saveMessage}`,
          },
        })
        controller.close()
        return
      }

      emitProgress("complete", "Analysis saved.", 100)
      streamEvent(controller, { type: "complete", body: { analysis: mapSongAnalysisRow(data as SongAnalysisRow), reused: false } })
      controller.close()
      } catch (error) {
        emitError(error instanceof Error ? error.message : "The song analysis request failed unexpectedly.", 500)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  })
}
